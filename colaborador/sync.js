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
    try {
        const alunos = await DataManager.getAlunos();
        if (!Array.isArray(alunos)) {
            console.warn('getAlunos retornou valor não-array:', alunos);
            return [];
        }
        
        // Primeiro dia e último dia do mês
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0);
        
        const primeiroDiaStr = primeiroDia.toISOString().split('T')[0]; // YYYY-MM-DD
        const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];    // YYYY-MM-DD
        
        return alunos.filter(aluno => 
            aluno && aluno.modalidade === modalidade && 
            aluno.turma === turma &&
            aluno.data_entrada <= ultimoDiaStr &&
            (!aluno.data_saida || aluno.data_saida >= primeiroDiaStr)
        );
    } catch (e) {
        console.error('Erro em obterAlunosAtivosNoMes:', e);
        return [];
    }
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

        const alunoSalvo = await DataManager.saveAluno(novoAluno);

        if (alunoSalvo) {
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
        if (!Array.isArray(alunos)) {
            console.error('getAlunos retornou valor não-array');
            return false;
        }
        const alunoAnterior = alunos.find(a => a && a.id === alunoId);

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
    const mesesNomes = {'01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'};
    
    const hoje = new Date();
    let ano = hoje.getFullYear();
    const anosParaProcessar = [ano];
    if (hoje.getMonth() === 11) anosParaProcessar.push(ano + 1);

    console.log('📋 gerarListasAutomaticamenteSincronizado - APENAS SUPABASE (OTIMIZADO)');
    const tempoInicio = performance.now();
    
    try {
        // 1. Buscar todos os alunos
        const alunos = await DataManager.getAlunos();
        if (!alunos || alunos.length === 0) {
            console.log('⚠️ Nenhum aluno cadastrado');
            return true;
        }

        // 2. Agrupar alunos por Modalidade e Turma
        const grupos = {};
        alunos.forEach(a => {
            if (!a.modalidade || !a.turma) return;
            const chave = `${a.modalidade}||${a.turma}`;
            if (!grupos[chave]) grupos[chave] = [];
            grupos[chave].push(a);
        });

        console.log('📊 Grupos encontrados:', Object.keys(grupos).length);

        // 3. Buscar TODAS as listas de uma vez (não 12*N queries)
        const { data: todasAsListas } = await window.supabaseClient
            .from('listas')
            .select('id, mes, ano, modalidade, turma');
        
        const mapListasExistentes = {};
        (todasAsListas || []).forEach(l => {
            mapListasExistentes[`${l.mes}||${l.ano}||${l.modalidade}||${l.turma}`] = l.id;
        });

        console.log('📦 Listas existentes no banco:', todasAsListas?.length || 0);

        // 4. Preparar todas as operações em batch
        const operacoes = [];

        for (const anoIter of anosParaProcessar) {
            for (let mes = 1; mes <= 12; mes++) {
                const mesStr = String(mes).padStart(2, '0');
                const nomeMes = mesesNomes[mesStr];

                // Para cada grupo (Turma)
                for (const [chave, alunosDoGrupo] of Object.entries(grupos)) {
                    const [modalidade, turma] = chave.split('||');

                    // Filtrar alunos ativos neste mês
                    const primeiroDiaStr = `${anoIter}-${mesStr}-01`;
                    const ultimoDia = new Date(anoIter, mes, 0);
                    const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];

                    const alunosAtivos = alunosDoGrupo.filter(aluno => 
                        aluno.data_entrada <= ultimoDiaStr &&
                        (!aluno.data_saida || aluno.data_saida >= primeiroDiaStr)
                    );

                    if (alunosAtivos.length === 0) continue;

                    // Verificar se a lista já existe (do mapa)
                    const chaveMapaLista = `${mesStr}||${anoIter}||${modalidade}||${turma}`;
                    const listaId = mapListasExistentes[chaveMapaLista];

                    // Preparar operação
                    operacoes.push({
                        tipo: listaId ? 'atualizar' : 'criar',
                        listaId,
                        nome: `${nomeMes} ${anoIter}`,
                        mes: mesStr,
                        ano: anoIter,
                        modalidade,
                        turma,
                        alunosAtivos,
                        chaveMapaLista
                    });
                }
            }
        }

        console.log(`📦 Operações a processar: ${operacoes.length}`);

        // 5. PROCESSAR EM LOTES (paralelo, não sequencial)
        const tamanhoLote = 10; // 10 operações paralelas por vez
        
        for (let i = 0; i < operacoes.length; i += tamanhoLote) {
            const lote = operacoes.slice(i, i + tamanhoLote);
            
            await Promise.all(lote.map(async (op) => {
                try {
                    let listaId = op.listaId;

                    // Se não existe, criar
                    if (!listaId) {
                        const { data: novaLista, error: errCreate } = await window.supabaseClient
                            .from('listas')
                            .insert({
                                nome: op.nome,
                                mes: op.mes,
                                ano: op.ano,
                                modalidade: op.modalidade,
                                turma: op.turma,
                                salva: false
                            })
                            .select();
                        
                        if (errCreate || !novaLista) {
                            console.error('❌ Erro ao criar lista:', op.chaveMapaLista, errCreate);
                            return;
                        }
                        listaId = novaLista[0].id;
                    }

                    // Buscar alunos já na lista
                    const { data: alunosNaLista, error: errSelect } = await window.supabaseClient
                        .from('lista_alunos')
                        .select('aluno_id')
                        .eq('lista_id', listaId);
                    
                    if (errSelect) {
                        console.error('❌ Erro ao buscar alunos na lista:', listaId, errSelect);
                        return;
                    }
                    
                    const idsNaLista = new Set((alunosNaLista || []).map(a => a.aluno_id));
                    const idsAtivos = new Set(op.alunosAtivos.map(a => a.id));

                    // Adicionar novos alunos
                    const novosParaAdicionar = op.alunosAtivos
                        .filter(a => !idsNaLista.has(a.id))
                        .map(a => ({
                            lista_id: listaId,
                            aluno_id: a.id,
                            aluno_nome: a.nome,
                            status: null
                        }));
                    
                    if (novosParaAdicionar.length > 0) {
                        const { error: errInsert } = await window.supabaseClient
                            .from('lista_alunos')
                            .insert(novosParaAdicionar);
                        if (errInsert) {
                            console.warn('⚠️ Erro ao adicionar alunos na lista:', listaId, errInsert);
                        }
                    }

                    // Remover alunos inativos
                    const idsParaRemover = [...idsNaLista].filter(id => !idsAtivos.has(id));
                    
                    if (idsParaRemover.length > 0) {
                        const { error: errDelete } = await window.supabaseClient
                            .from('lista_alunos')
                            .delete()
                            .eq('lista_id', listaId)
                            .in('aluno_id', idsParaRemover);
                        if (errDelete) {
                            console.warn('⚠️ Erro ao remover alunos da lista:', listaId, errDelete);
                        }
                    }

                } catch (e) {
                    console.error('❌ Erro ao processar operação:', e.message);
                }
            }));
            
            console.log(`📊 Progresso: ${Math.min(i + tamanhoLote, operacoes.length)}/${operacoes.length}`);
        }

        const tempoFinal = performance.now();
        const tempoDecorrido = ((tempoFinal - tempoInicio) / 1000).toFixed(2);
        
        console.log(`✅ Sincronização Supabase concluída em ${tempoDecorrido}s`);
        return true;

    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
        return false;
    }
}

function removerAlunodasListas(alunoId) {
    try {
        if (!alunoId) return;
        // Apenas Supabase
        console.log('⚠️ removerAlunodasListas deprecated');
    } catch (e) {
        console.error('Erro:', e);
    }
}

function removerAlunodasListasEspecificas(alunoId, modalidade, turma) {
    try {
        if (!alunoId || !modalidade || !turma) return;
        // Apenas Supabase
        console.log('⚠️ removerAlunodasListasEspecificas deprecated');
    } catch (e) {
        console.error('Erro:', e);
    }
}

function sincronizarAlunoComListas(aluno) {
    try {
        if (!aluno || !aluno.id || !aluno.modalidade || !aluno.turma) return;
        // Apenas Supabase
        console.log('⚠️ sincronizarAlunoComListas deprecated');
    } catch (e) {
        console.error('Erro:', e);
    }
}

// ============================================================================
// FUNÇÕES DE CONSULTA
// ============================================================================

async function obterAlunosPorModalidade(modalidade) {
    try {
        if (!modalidade) return [];
        const alunos = await DataManager.getAlunos();
        if (!Array.isArray(alunos)) return [];
        return alunos.filter(a => a && a.modalidade === modalidade && a.ativo !== false);
    } catch (e) {
        console.error('Erro em obterAlunosPorModalidade:', e);
        return [];
    }
}

async function obterAlunosPorModalidadeETurma(modalidade, turma) {
    try {
        if (!modalidade || !turma) return [];
        const alunos = await DataManager.getAlunos();
        if (!Array.isArray(alunos)) return [];
        return alunos.filter(a => a && a.modalidade === modalidade && a.turma === turma && a.ativo !== false);
    } catch (e) {
        console.error('Erro em obterAlunosPorModalidadeETurma:', e);
        return [];
    }
}

async function obterListasPorModalidade(modalidade) {
    try {
        if (!modalidade) return [];
        const listas = await DataManager.getListas();
        if (!Array.isArray(listas)) return [];
        return listas.filter(l => l && l.modalidade === modalidade);
    } catch (e) {
        console.error('Erro em obterListasPorModalidade:', e);
        return [];
    }
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
    if (!aluno) return { valido: false, erro: 'Aluno é obrigatório' };
    if (!aluno.nome || aluno.nome.trim() === '') return { valido: false, erro: 'Nome é obrigatório' };
    if (!aluno.dataNascimento) return { valido: false, erro: 'Data de nascimento é obrigatória' };
    if (!aluno.rg || aluno.rg.trim() === '') return { valido: false, erro: 'RG é obrigatório' };
    if (!aluno.modalidade) return { valido: false, erro: 'Modalidade é obrigatória' };
    if (!aluno.turma) return { valido: false, erro: 'Turma/Horário é obrigatório' };
    if (!aluno.data_entrada) return { valido: false, erro: 'Data de entrada é obrigatória' };
    return { valido: true };
}

function obterHorariosPorModalidade(modalidade) {
    if (!modalidade) return [];
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
