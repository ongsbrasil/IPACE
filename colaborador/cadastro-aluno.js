// Atualizar data e hora
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const el = document.getElementById('dateTime');
    if (el) el.textContent = now.toLocaleDateString('pt-BR', dateOptions) + ' às ' + now.toLocaleTimeString('pt-BR', timeOptions);
}

// Função para importar lista de inscrição
function importarLista() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(event) {
            try {
                const csv = event.target.result;
                const linhas = csv.split('\n');
                const cabecalho = linhas[0].split(/[;,]/).map(c => c.trim().toLowerCase());
                const dados = linhas.slice(1).filter(linha => linha.trim() !== '');
                
                // Encontrar índices das colunas
                const indiceNome = cabecalho.findIndex(c => c.includes('nome'));
                const indiceDateNasc = cabecalho.findIndex(c => c.includes('nascimento') || c.includes('nasc'));
                const indiceRG = cabecalho.findIndex(c => c.includes('rg'));
                const indiceSexo = cabecalho.findIndex(c => c.includes('sexo') || c.includes('genero'));
                const indiceGravida = cabecalho.findIndex(c => c === 'g' || c.includes('gravida') || c.includes('grávida'));
                const indicePCD = cabecalho.findIndex(c => c.includes('pcd') || c.includes('deficiencia') || c.includes('deficiência'));
                const indiceModalidade = cabecalho.findIndex(c => c.includes('modalidade'));
                const indiceHorario = cabecalho.findIndex(c => c.includes('horário') || c.includes('horario'));
                const indiceDataEntrada = cabecalho.findIndex(c => c.includes('entrada') || c.includes('data_entrada'));
                const indiceDataSaida = cabecalho.findIndex(c => c.includes('saida') || c.includes('data_saida'));
                
                // Validar se as colunas obrigatórias existem
                if (indiceNome === -1 || indiceDateNasc === -1 || indiceRG === -1 || indiceModalidade === -1 || indiceHorario === -1) {
                    alert('❌ CSV com formato inválido!\n\nColunas obrigatórias:\n- Nome\n- Data Nascimento\n- RG\n- Modalidade\n- Horário\n\nColunas opcionais:\n- Data Entrada (YYYY-MM-DD)\n- Data Saida (YYYY-MM-DD)');
                    return;
                }
                
                let importados = 0;
                let erros = 0;
                
                // Usar DataManager para buscar alunos existentes
                const alunos = await DataManager.getAlunos();
                
                for (const linha of dados) {
                    try {
                        const campos = linha.split(/[;,]/).map(c => c.trim());
                        
                        const nome = campos[indiceNome];
                        const dataNasc = campos[indiceDateNasc];
                        let rg = campos[indiceRG];
                        // Formatar RG automaticamente
                        if (typeof formatarRG === 'function') {
                            rg = formatarRG(rg);
                        }

                        // Processar Sexo
                        let sexo = indiceSexo !== -1 ? campos[indiceSexo] : 'O';
                        if (sexo) {
                            const s = sexo.trim().toLowerCase();
                            if (s === 'masculino' || s === 'm') sexo = 'M';
                            else if (s === 'feminino' || s === 'f') sexo = 'F';
                            else sexo = 'O';
                        } else {
                            sexo = 'O';
                        }

                        // Processar Gravida e PCD
                        let gravida = 'Não';
                        if (indiceGravida !== -1 && campos[indiceGravida]) {
                            const g = campos[indiceGravida].trim().toLowerCase();
                            gravida = (g === 'sim' || g === 's') ? 'Sim' : 'Não';
                        }

                        let pcd = 'Não';
                        if (indicePCD !== -1 && campos[indicePCD]) {
                            const p = campos[indicePCD].trim().toLowerCase();
                            pcd = (p === 'sim' || p === 's') ? 'Sim' : 'Não';
                        }

                        const modalidade = campos[indiceModalidade];
                        const horario = campos[indiceHorario];
                        let dataEntrada = campos[indiceDataEntrada] || null;
                        let dataSaida = campos[indiceDataSaida] || null;
                        
                        if (!nome || !dataNasc || !rg || !modalidade || !horario) {
                            erros++;
                            continue;
                        }

                        // Verificar duplicidade por RG
                        const existe = alunos.some(a => a.rg === rg);
                        if (existe) {
                            console.log(`Aluno já existe: ${nome} (${rg})`);
                            continue;
                        }

                        // Se não tiver data de entrada, usar hoje (primeiro dia do mês)
                        if (!dataEntrada) {
                            const hoje = new Date();
                            dataEntrada = hoje.getFullYear() + '-' + 
                                        String(hoje.getMonth() + 1).padStart(2, '0') + '-01';
                        }

                        const novoAluno = {
                            nome: nome,
                            dataNascimento: dataNasc,
                            rg: rg,
                            sexo: sexo,
                            gravida: gravida,
                            pcd: pcd,
                            modalidade: modalidade,
                            turma: horario,
                            data_entrada: dataEntrada,
                            data_saida: dataSaida,
                            ativo: true
                        };

                        // Usar DataManager para salvar
                        await DataManager.saveAluno(novoAluno);
                        importados++;
                        
                    } catch (e) {
                        console.error('Erro ao processar linha:', linha, e);
                        erros++;
                    }
                }
                
                alert(`Importação concluída!\n\n✅ Importados: ${importados}\n❌ Erros/Duplicados: ${erros}`);
                
                if (importados > 0) {
                    // Atualizar listas se necessário
                    if (typeof gerarListasAutomaticamenteSincronizado === 'function') {
                        await gerarListasAutomaticamenteSincronizado();
                    }
                    window.location.href = 'lista-alunos.html';
                }
                
            } catch (error) {
                console.error('Erro ao ler arquivo:', error);
                alert('Erro ao processar arquivo CSV. Verifique o formato.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Validação de Aluno
function validarAluno(aluno) {
    if (!aluno.nome || aluno.nome.length < 3) return { valido: false, erro: 'Nome inválido' };
    if (!aluno.dataNascimento) return { valido: false, erro: 'Data de nascimento obrigatória' };
    if (!aluno.rg || aluno.rg.length < 5) return { valido: false, erro: 'RG inválido' };
    if (!aluno.modalidade) return { valido: false, erro: 'Selecione uma modalidade' };
    if (!aluno.turma) return { valido: false, erro: 'Selecione um horário' };
    return { valido: true };
}

const horariosPorModalidade = {
    'judo': [
        'Manhã - 8h às 9h',
        'Manhã - 9h às 10h',
        'Manhã - 10h às 11h',
        'Tarde - 14h às 15h',
        'Tarde - 15h às 16h',
        'Tarde - 16h às 17h'
    ],
    'canoagem-velocidade': [
        'Manhã - 9h às 10:30h',
        'Tarde - 14h às 15:30h',
        'Tarde - 15:30h às 17h'
    ],
    'futebol': [
        'Manhã - 8h às 9h',
        'Manhã - 9h às 10h',
        'Manhã - 10h às 11h',
        'Tarde - 14h às 15h',
        'Tarde - 15h às 16h',
        'Tarde - 16h às 17h'
    ],
    'canoagem-turismo': [
        'Manhã - 9h às 10:30h',
        'Tarde - 14h às 15:30h',
        'Tarde - 15:30h às 17h'
    ],
    'vela': [
        'Manhã - 9h às 10:30h',
        'Tarde - 14h às 15:30h',
        'Tarde - 15:30h às 17h'
    ]
};

// Carregar horários quando selecionar modalidade no cadastro
function carregarHorariosAluno() {
    const modalidade = document.getElementById('modalidadeAluno').value;
    const selectHorario = document.getElementById('turmaAluno');
    
    if (!modalidade) {
        selectHorario.innerHTML = '<option value="">Primeiro selecione a modalidade</option>';
        return;
    }
    
    const horarios = horariosPorModalidade[modalidade] || [];
    let html = '<option value="">Selecione...</option>';
    horarios.forEach(horario => {
        html += `<option value="${horario}">${horario}</option>`;
    });
    
    selectHorario.innerHTML = html;
}

// Cadastro de Alunos
document.getElementById('formAluno').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const alunoId = document.getElementById('alunoId').value;
    const nome = document.getElementById('nomeAluno').value;
    const dataNascimento = document.getElementById('dataNascimento').value;
    const rg = document.getElementById('rgAluno').value;
    const sexo = document.getElementById('sexoAluno').value;
    const gravida = document.getElementById('gravidaAluno').value;
    const pcd = document.getElementById('pcdAluno').value;
    const modalidade = document.getElementById('modalidadeAluno').value;
    const turma = document.getElementById('turmaAluno').value;
    
    // Validar dados
    const validacao = validarAluno({ nome, dataNascimento, rg, sexo, modalidade, turma });
    if (!validacao.valido) {
        alert('❌ Erro: ' + validacao.erro);
        return;
    }
    
    if (alunoId) {
        // Modo edição - usar função sincronizada do sync.js
        const sucesso = await editarAlunoSincronizado(Number(alunoId), {
            nome,
            dataNascimento,
            rg,
            sexo,
            gravida,
            pcd,
            modalidade,
            turma
        });
        if (sucesso) {
            // ✓ SINCRONIZAR: Atualizar listas de presença com aluno modificado
            if (typeof gerarListasAutomaticamenteSincronizado === 'function') {
                await gerarListasAutomaticamenteSincronizado();
            }
            
            // ✓ DISPARAR EVENTOS para atualizar painéis do professor
            const listas = await DataManager.getListas();
            const todosAlunos = await DataManager.getAlunos();
            window.dispatchEvent(new CustomEvent('alunosSincronizados', { 
                detail: { totalAlunos: todosAlunos.length } 
            }));
            window.dispatchEvent(new CustomEvent('listasAtualizadas', { 
                detail: { totalListas: listas.length } 
            }));
            
            alert('✓ Aluno atualizado com sucesso!');
            window.location.href = 'lista-alunos.html';
        } else {
            alert('❌ Erro ao atualizar aluno');
        }
    } else {
        // Modo cadastro - usar função sincronizada
        // ✓ Definir data_entrada como hoje (primeiro dia do mês)
        const hoje = new Date();
        const data_entrada = hoje.getFullYear() + '-' + 
                            String(hoje.getMonth() + 1).padStart(2, '0') + '-01';
        
        const sucesso = await adicionarAluno({
            nome,
            dataNascimento,
            rg,
            sexo,
            gravida,
            pcd,
            modalidade,
            turma,
            data_entrada: data_entrada
        });
        if (sucesso) {
            alert('✓ Aluno cadastrado com sucesso!');
            window.location.href = 'lista-alunos.html';
        } else {
            alert('❌ Erro ao cadastrar aluno');
        }
    }
    
    // cancelarEdicao(); // Removido pois já redirecionamos
});

function cancelarEdicao() {
    document.getElementById('formAluno').reset();
    document.getElementById('alunoId').value = '';
    document.getElementById('btnSubmit').textContent = 'CADASTRAR';
    document.getElementById('btnCancelar').style.display = 'none';
    document.getElementById('tituloForm').textContent = 'CADASTRAR ALUNO'; // Assumindo que existe esse ID ou similar, mas o header é estático no HTML original.
    // Se estiver em modo de edição (via URL), voltar para lista
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit')) {
        window.location.href = 'lista-alunos.html';
    }
}

// Carregar dados do aluno no formulário de edição
async function carregarAlunoParaEdicao(id) {
    const alunos = await DataManager.getAlunos();
    // Usar comparação solta (==) para garantir que string/number funcionem
    const aluno = alunos.find(a => a.id == id);
    
    if (aluno) {
        console.log('Editando aluno:', aluno.nome, 'ID:', aluno.id);
        document.getElementById('alunoId').value = aluno.id;
        document.getElementById('nomeAluno').value = aluno.nome;
        document.getElementById('dataNascimento').value = aluno.dataNascimento || aluno.data_nascimento;
        document.getElementById('rgAluno').value = formatarRG(aluno.rg || '');
        document.getElementById('sexoAluno').value = aluno.sexo || '';
        document.getElementById('gravidaAluno').value = aluno.gravida || 'Não';
        document.getElementById('pcdAluno').value = aluno.pcd || 'Não';
        document.getElementById('modalidadeAluno').value = aluno.modalidade;
        carregarHorariosAluno();
        setTimeout(() => {
            document.getElementById('turmaAluno').value = aluno.turma;
        }, 100);
        document.getElementById('btnSubmit').textContent = 'ATUALIZAR';
        document.getElementById('btnCancelar').style.display = 'inline-block';
        document.getElementById('tituloForm').textContent = 'EDITAR ALUNO';
    } else {
        console.error('Aluno não encontrado para edição. ID:', id);
        alert('Erro: Aluno não encontrado. Verifique se o ID está correto.');
    }
}

// Função para formatar RG automaticamente (XX.XXX.XXX-X)
function formatarRG(valor) {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 9 dígitos
    valor = valor.substring(0, 9);
    
    // Aplica a máscara XX.XXX.XXX-X
    if (valor.length > 8) {
        valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    } else if (valor.length > 5) {
        valor = valor.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (valor.length > 2) {
        valor = valor.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    }
    
    return valor;
}

// Inicializar
window.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Adicionar formatação automática no campo RG
    const rgInput = document.getElementById('rgAluno');
    if (rgInput) {
        rgInput.addEventListener('input', function(e) {
            e.target.value = formatarRG(e.target.value);
        });
    }
    
    // Verificar se é modo edição
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        carregarAlunoParaEdicao(Number(editId)); // Usar Number() em vez de parseInt() para maior compatibilidade
    }
});
