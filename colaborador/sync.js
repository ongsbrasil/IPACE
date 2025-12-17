/**
 * SISTEMA DE SINCRONIZAÇÃO CENTRALIZADO (Versão Híbrida Supabase/LocalStorage)
 * 
 * Este arquivo gerencia a sincronização de dados entre:
 * - Painel da Secretária
 * - Painéis dos Professores
 * - Listas de Presença
 */

// ============================================================================
// FUNÇÕES DE FILTRO POR DATA
// ============================================================================

async function obterAlunosAtivosNoMes(mes, ano, modalidade, turma) {
    const alunos = await DataManager.getAlunos();
    
    // Primeiro dia e último dia do mês
    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0);
    
    const primeiroDiaStr = primeiroDia.toISOString().split('T')[0]; // YYYY-MM-DD
    const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];    // YYYY-MM-DD
    
    return alunos.filter(aluno => 
        aluno.modalidade === modalidade && 
        aluno.turma === turma &&
        aluno.data_entrada <= ultimoDiaStr &&
        (!aluno.data_saida || aluno.data_saida >= primeiroDiaStr)
    );
}

// ============================================================================
// FUNÇÕES DE GERENCIAMENTO DE ALUNOS
// ============================================================================

async function adicionarAluno(aluno) {
    if (!aluno.nome || !aluno.dataNascimento || !aluno.rg || !aluno.modalidade || !aluno.turma || !aluno.data_entrada) {
        console.error('Dados incompletos do aluno:', aluno);
        return false;
    }

    try {
        const novoAluno = {
            nome: aluno.nome,
            data_nascimento: aluno.dataNascimento, // Mapeando para snake_case do banco
            dataNascimento: aluno.dataNascimento, // Mantendo camelCase para compatibilidade legado
            rg: aluno.rg,
            sexo: aluno.sexo || null,
            gravida: aluno.gravida || 'Não',
            pcd: aluno.pcd || 'Não',
            modalidade: aluno.modalidade,
            turma: aluno.turma,
            data_entrada: aluno.data_entrada,
            data_saida: aluno.data_saida || null,
            ativo: true
        };

        if (!DataManager.useSupabase) {
            novoAluno.id = Math.floor(Date.now() + Math.random() * 10000);
            novoAluno.dataCadastro = new Date().toISOString();
        }

        const sucesso = await DataManager.saveAluno(novoAluno);

        if (sucesso) {
            // Gerar listas automaticamente
            await gerarListasAutomaticamenteSincronizado();
            
            console.log('✓ Aluno adicionado com sucesso:', novoAluno);
            
            window.dispatchEvent(new CustomEvent('alunosSincronizados', { detail: { aluno: novoAluno } }));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao adicionar aluno:', error);
        return false;
    }
}

async function editarAlunoSincronizado(alunoId, dadosAtualizados) {
    try {
        // Buscar aluno atual para comparar mudanças
        const alunos = await DataManager.getAlunos();
        const alunoAnterior = alunos.find(a => a.id === alunoId);

        if (!alunoAnterior) {
            console.error('Aluno não encontrado:', alunoId);
            return false;
        }

        // Mesclar dados
        const alunoAtualizado = { ...alunoAnterior, ...dadosAtualizados };
        
        // Mapeamento para snake_case se necessário
        if (dadosAtualizados.dataNascimento) alunoAtualizado.data_nascimento = dadosAtualizados.dataNascimento;

        const sucesso = await DataManager.saveAluno(alunoAtualizado);

        if (sucesso) {
            // Se modalidade ou turma mudaram, sincronizar listas
            if (dadosAtualizados.modalidade !== alunoAnterior.modalidade || 
                dadosAtualizados.turma !== alunoAnterior.turma) {
                await gerarListasAutomaticamenteSincronizado();
            }

            window.dispatchEvent(new CustomEvent('alunosSincronizados', { detail: { alunoId } }));
            window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { alunoId } }));

            console.log('✓ Aluno editado com sucesso:', alunoAtualizado);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao editar aluno:', error);
        return false;
    }
}

async function removerAluno(alunoId) {
    try {
        const sucesso = await DataManager.deleteAluno(alunoId);
        
        if (sucesso) {
            if (!DataManager.useSupabase) {
                removerAlunodasListas(alunoId);
            }

            console.log('✓ Aluno removido com sucesso');
            window.dispatchEvent(new CustomEvent('alunosSincronizados', { detail: { alunoRemovido: alunoId } }));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao remover aluno:', error);
        return false;
    }
}

// ============================================================================
// FUNÇÕES DE SINCRONIZAÇÃO DE LISTAS
// ============================================================================

async function gerarListasAutomaticamenteSincronizado() {
    if (DataManager.useSupabase) {
        console.log('Gerar listas no Supabase: Pendente de implementação completa');
        return true;
    }

    try {
        let listas = JSON.parse(localStorage.getItem('listas')) || [];
        const mesesNomes = {'01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'};
        const alunos = JSON.parse(localStorage.getItem('alunos')) || [];
        const grupos = new Set();
        alunos.forEach(a => grupos.add(`${a.modalidade}||${a.turma}`));

        const hoje = new Date();
        let ano = hoje.getFullYear();
        if (hoje.getMonth() === 11) ano = ano + 1;

        for (let anoIter = ano; anoIter <= ano; anoIter++) {
            for (let mes = 1; mes <= 12; mes++) {
                const mesStr = String(mes).padStart(2, '0');
                const meNome = mesesNomes[mesStr];

                grupos.forEach(grupo => {
                    const [modalidade, turma] = grupo.split('||');
                    const primeiroDiaStr = `${anoIter}-${mesStr}-01`;
                    const ultimoDia = new Date(anoIter, mes, 0);
                    const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];
                    
                    const alunosAtivos = alunos.filter(aluno => 
                        aluno.modalidade === modalidade && 
                        aluno.turma === turma &&
                        aluno.data_entrada <= ultimoDiaStr &&
                        (!aluno.data_saida || aluno.data_saida >= primeiroDiaStr)
                    );
                    
                    if (alunosAtivos.length === 0) return;
                    
                    let lista = listas.find(l => l.mes === mesStr && l.ano === anoIter && l.modalidade === modalidade && l.turma === turma);
                    
                    if (lista) {
                        const alunosJaExistentes = new Set(lista.presencas.map(p => p.alunoId));
                        lista.presencas = lista.presencas.filter(p => alunosAtivos.some(a => a.id === p.alunoId));
                        alunosAtivos.forEach(aluno => {
                            if (!alunosJaExistentes.has(aluno.id)) {
                                lista.presencas.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: null });
                            }
                        });
                    } else {
                        listas.push({
                            id: Math.floor(Date.now() + Math.random() * 10000),
                            nome: `${meNome} ${anoIter}`,
                            mes: mesStr,
                            ano: anoIter,
                            modalidade: modalidade,
                            turma: turma,
                            dataCriacao: new Date().toISOString(),
                            presencas: alunosAtivos.map(a => ({ alunoId: a.id, alunoNome: a.nome, status: null })),
                            chamadas: {},
                            diasSalvos: [],
                            salva: false
                        });
                    }
                });
            }
        }
        localStorage.setItem('listas', JSON.stringify(listas));
        window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { totalListas: listas.length } }));
        return true;
    } catch (error) {
        console.error('Erro ao gerar listas (LocalStorage):', error);
        return false;
    }
}

function removerAlunodasListas(alunoId) {
    let listas = JSON.parse(localStorage.getItem('listas')) || [];
    const listasAtualizadas = listas.map(lista => {
        lista.presencas = lista.presencas.filter(p => p.alunoId !== alunoId);
        return lista;
    });
    localStorage.setItem('listas', JSON.stringify(listasAtualizadas));
}

function removerAlunodasListasEspecificas(alunoId, modalidade, turma) {
    let listas = JSON.parse(localStorage.getItem('listas')) || [];
    const listasAtualizadas = listas.map(lista => {
        if (lista.modalidade === modalidade && lista.turma === turma) {
            lista.presencas = lista.presencas.filter(p => p.alunoId !== alunoId);
        }
        return lista;
    });
    localStorage.setItem('listas', JSON.stringify(listasAtualizadas));
}

function sincronizarAlunoComListas(aluno) {
    let listas = JSON.parse(localStorage.getItem('listas')) || [];
    const listasAtualizadas = listas.map(lista => {
        if (lista.modalidade === aluno.modalidade && lista.turma === aluno.turma) {
            const alunoJaExiste = lista.presencas.some(p => p.alunoId === aluno.id);
            if (!alunoJaExiste) {
                lista.presencas.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: null });
            }
        }
        return lista;
    });
    localStorage.setItem('listas', JSON.stringify(listasAtualizadas));
}

// ============================================================================
// FUNÇÕES DE CONSULTA
// ============================================================================

async function obterAlunosPorModalidade(modalidade) {
    const alunos = await DataManager.getAlunos();
    return alunos.filter(a => a.modalidade === modalidade && a.ativo);
}

async function obterAlunosPorModalidadeETurma(modalidade, turma) {
    const alunos = await DataManager.getAlunos();
    return alunos.filter(a => a.modalidade === modalidade && a.turma === turma && a.ativo);
}

async function obterListasPorModalidade(modalidade) {
    const listas = await DataManager.getListas();
    return listas.filter(l => l.modalidade === modalidade);
}

// ============================================================================
// LISTENERS E UTILITÁRIOS
// ============================================================================

window.addEventListener('alunosSincronizados', function(event) {
    console.log('🔄 Evento de sincronização:', event.detail);
    if (typeof exibirAlunos === 'function') exibirAlunos();
    if (typeof carregarLista === 'function') carregarLista();
});

window.addEventListener('listasAtualizadas', function(event) {
    if (typeof carregarLista === 'function') carregarLista();
    if (typeof carregarTurmas === 'function') carregarTurmas();
});

function validarAluno(aluno) {
    if (!aluno.nome || aluno.nome.trim() === '') return { valido: false, erro: 'Nome é obrigatório' };
    if (!aluno.dataNascimento) return { valido: false, erro: 'Data de nascimento é obrigatória' };
    if (!aluno.rg || aluno.rg.trim() === '') return { valido: false, erro: 'RG é obrigatório' };
    if (!aluno.modalidade) return { valido: false, erro: 'Modalidade é obrigatória' };
    if (!aluno.turma) return { valido: false, erro: 'Turma/Horário é obrigatório' };
    return { valido: true };
}

function obterHorariosPorModalidade(modalidade) {
    const horarios = {
        'judo': ['Manhã - 8h às 9h', 'Manhã - 9h às 10h', 'Manhã - 10h às 11h', 'Tarde - 14h às 15h', 'Tarde - 15h às 16h', 'Tarde - 16h às 17h'],
        'canoagem-velocidade': ['Manhã - 9h às 10:30h', 'Tarde - 14h às 15:30h', 'Tarde - 15:30h às 17h'],
        'futebol': ['Manhã - 8h às 9h', 'Manhã - 9h às 10h', 'Manhã - 10h às 11h', 'Tarde - 14h às 15h', 'Tarde - 15h às 16h', 'Tarde - 16h às 17h'],
        'canoagem-turismo': ['Manhã - 9h às 10:30h', 'Tarde - 14h às 15:30h', 'Tarde - 15:30h às 17h'],
        'vela': ['Manhã - 9h às 10:30h', 'Tarde - 14h às 15:30h', 'Tarde - 15:30h às 17h']
    };
    return horarios[modalidade] || [];
}

console.log('✓ Sistema de sincronização (Híbrido) carregado!');
