// Verificar se professor está logado
verificarLogin();

function verificarLogin() {
    const professorLogado = localStorage.getItem('professorLogado');
    if (!professorLogado) {
        // Se não estiver logado, redirecionar para login
        window.location.href = '/colaborador/index.html';
    } else {
        // Se estiver logado, garantir que a modalidade selecionada está correta
        const dados = JSON.parse(professorLogado);
        if (dados.modalidade) {
            localStorage.setItem('modalidadeSelecionada', dados.modalidade);
        }
    }
}

// Fazer logout
function fazerLogout() {
    localStorage.removeItem('professorLogado');
    window.location.href = '/colaborador/index.html';
}

// Cronograma Oficial (sincronizado com admin-panel.js)
// TERÇA E QUINTA
const CRONOGRAMA_MODAL = {
    'terça-quinta': {
        dias: ['Terça', 'Quinta'],
        modalidades: {
            'judo': {
                nome: 'Judô',
                horarios: [
                    '08h às 09h',
                    '09h às 10h',
                    '10h às 11h',
                    '14h às 15h',
                    '15h às 16h',
                    '16h às 17h'
                ]
            },
            'canoagem-velocidade': {
                nome: 'Canoagem Velocidade',
                horarios: [
                    '09h às 10h30',
                    '14h às 15h30',
                    '15h30 às 17h'
                ]
            }
        }
    },
    'quarta-sexta': {
        dias: ['Quarta', 'Sexta'],
        modalidades: {
            'futebol': {
                nome: 'Futebol',
                horarios: [
                    '08h às 09h',
                    '09h às 10h',
                    '10h às 11h',
                    '14h às 15h',
                    '15h às 16h',
                    '16h às 17h'
                ]
            },
            'vela': {
                nome: 'Vela',
                horarios: [
                    '09h às 10h30',
                    '14h às 15h30',
                    '15h30 às 17h'
                ]
            },
            'canoagem-turismo': {
                nome: 'Canoagem Turismo',
                horarios: [
                    '09h às 10h30',
                    '14h às 15h30',
                    '15h30 às 17h'
                ]
            }
        }
    }
};

// Obter horários por modalidade (preferir dados do DataManager)
async function obterHorariosPorModalidade(modalidade) {
    console.log('🔍 obterHorariosPorModalidade chamada para:', modalidade);
    
    // 1) Tentar via listas existentes
    try {
        const listas = await DataManager.getListas();
        console.log('Listas obtidas:', listas.length);
        const modalidadeNormalizada = normalizarModalidade(modalidade);
        const turmasListas = [...new Set(listas.filter(l => l && normalizarModalidade(l.modalidade) === modalidadeNormalizada).map(l => l.turma))];
        console.log('Turmas encontradas em listas:', turmasListas);
        if (turmasListas.length > 0) {
            const resultado = turmasListas.sort();
            console.log('✓ Retornando turmas de listas:', resultado);
            return resultado;
        }
    } catch (e) { 
        console.warn('Falha ao ler listas', e); 
    }

    // 2) Tentar via alunos cadastrados
    try {
        const alunos = await DataManager.getAlunos();
        console.log('Alunos obtidos:', alunos.length);
        const modalidadeNormalizada = normalizarModalidade(modalidade);
        const turmasAlunos = [...new Set(alunos.filter(a => a && normalizarModalidade(a.modalidade) === modalidadeNormalizada).map(a => a.turma))];
        console.log('Turmas encontradas em alunos:', turmasAlunos);
        if (turmasAlunos.length > 0) {
            const resultado = turmasAlunos.sort();
            console.log('✓ Retornando turmas de alunos:', resultado);
            return resultado;
        }
    } catch (e) { 
        console.warn('Falha ao ler alunos', e); 
    }

    // 3) Fallback: retornar do cronograma apenas se banco estiver vazio
    console.log('Nenhuma turma encontrada, usando cronograma fallback');
    for (const bloco of Object.values(CRONOGRAMA_MODAL)) {
        if (bloco.modalidades[modalidade]) {
            const resultado = bloco.modalidades[modalidade].horarios;
            console.log('✓ Retornando horários do cronograma:', resultado);
            return resultado;
        }
    }
    console.warn('❌ Nenhum horário encontrado para modalidade:', modalidade);
    return [];
}

// Dias das semanas por modalidade (quais dias acontecem as aulas)
const diasPorModalidade = {
    'judo': ['Terça', 'Quinta'],
    'canoagem-velocidade': ['Terça', 'Quinta'],
    'futebol': ['Quarta', 'Sexta'],
    'canoagem-turismo': ['Quarta', 'Sexta'],
    'vela': ['Quarta', 'Sexta']
};

// Função auxiliar para normalizar modalidade (remover acentos e converter para minúsculo)
function normalizarModalidade(modalidade) {
    return modalidade
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '-') // Substituir espaços por hífens
        .replace(/[^\w-]/g, ''); // Remover caracteres especiais
}

// Função para gerar datas das aulas do mês
function gerarDatasAulas(mes, ano, modalidade) {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Normalizar modalidade para busca
    const modalidadeNormalizada = normalizarModalidade(modalidade);
    
    // ⚠️ VALIDAÇÃO INTELIGENTE: se modalidade não existe, logar erro e usar default com warning
    const diasDaModalidade = diasPorModalidade[modalidadeNormalizada];
    if (!diasDaModalidade) {
        console.error(`❌ ERRO CRÍTICO: Modalidade "${modalidade}" (normalizada: "${modalidadeNormalizada}") não encontrada em diasPorModalidade!`);
        console.error(`   Modalidades válidas: ${Object.keys(diasPorModalidade).join(', ')}`);
        console.error(`   Usando FALLBACK ["Terça", "Sexta"] - ISSO PODE ESTAR ERRADO!`);
        return []; // Retornar array vazio ao invés de silenciosamente retornar valor errado
    }
    
    const datasAulas = [];
    
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    
    for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
        const data = new Date(ano, mes - 1, dia);
        const diaSemana = diasDaSemana[data.getDay()];
        
        if (diasDaModalidade.includes(diaSemana)) {
            const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
            datasAulas.push({
                label: `${diaSemana} ${dataFormatada}`,
                value: dataFormatada
            });
        }
    }
    
    console.log(`📅 gerarDatasAulas: ${modalidade} ${mes}/${ano} → ${datasAulas.length} dias`);
    return datasAulas;
}

// Função para verificar se TODOS os dias de uma lista foram preenchidos
function todosOsDiasForamPreenchidos(lista) {
    if (!lista || !lista.chamadas) return false;
    
    // Obter todos os dias possíveis da lista
    const diasAulas = gerarDatasAulas(parseInt(lista.mes), lista.ano, lista.modalidade);
    
    // Verificar se TODOS os dias estão em chamadas
    const todosDiasSalvos = diasAulas.every(dia => lista.chamadas[dia.value]);
    
    return todosDiasSalvos && diasAulas.length > 0;
}

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

// Obter modalidade selecionada
const modalidadeSelecionada = localStorage.getItem('modalidadeSelecionada');
if (!modalidadeSelecionada) {
    alert('Nenhuma modalidade selecionada!');
    window.location.href = '/colaborador/index.html';
}

// Carregar horários para o filtro
async function carregarHorarios() {
    console.time('⏱️ carregarHorarios');
    console.log('📋 carregarHorarios iniciada para modalidade:', modalidadeSelecionada);
    
    if (!modalidadeSelecionada) {
        console.error('Modalidade não selecionada em carregarHorarios');
        return;
    }
    
    const horarios = await obterHorariosPorModalidade(modalidadeSelecionada) || [];
    console.log('Horários obtidos em carregarHorarios:', horarios);
    
    // Ordenar horários: Manhã primeiro, depois Tarde, e dentro de cada um por hora numérica
    const horariosOrdenados = horarios.sort((a, b) => {
        const ehManhãA = a.includes('Manhã');
        const ehManhãB = b.includes('Manhã');
        
        // Se um é Manhã e outro é Tarde, Manhã vem primeiro
        if (ehManhãA && !ehManhãB) return -1;
        if (!ehManhãA && ehManhãB) return 1;
        
        // Extrair a hora numérica (ex: "8" de "Manhã - 8h às 9h")
        const horaA = parseInt(a.match(/(\d+)h/)?.[1] || '0');
        const horaB = parseInt(b.match(/(\d+)h/)?.[1] || '0');
        
        return horaA - horaB;
    });
    
    console.log('Horários ordenados:', horariosOrdenados);
    
    let html = '<option value="">-- Selecione --</option>';
    horariosOrdenados.forEach(horario => {
        html += `<option value="${horario}">${horario}</option>`;
    });
    
    const filtroTurmaEl = document.getElementById('filtroTurma');
    if (filtroTurmaEl) {
        console.log('✓ Populando dropdown com', horariosOrdenados.length, 'opções');
        filtroTurmaEl.innerHTML = html;
    } else {
        console.error('❌ Elemento filtroTurma não encontrado no DOM');
    }
    
    console.timeEnd('⏱️ carregarHorarios');
}

// Carregar lista de presença
async function carregarLista() {
    console.time('⏱️ carregarLista');
    
    const filtroEl = document.getElementById('filtroTurma');
    if (!filtroEl) {
        console.error('Elemento filtroTurma não encontrado');
        return;
    }
    const horarioSelecionado = filtroEl.value;
    console.log('🔴 carregarLista iniciada');
    console.log('   modalidadeSelecionada:', modalidadeSelecionada);
    console.log('   horarioSelecionado:', horarioSelecionado);
    
    if (!horarioSelecionado) {
        const listasEl = document.getElementById('listasDisponiveis');
        if (listasEl) {
            listasEl.innerHTML = '<p style="text-align: center; color: #999;">Selecione um horário</p>';
        }
        console.timeEnd('⏱️ carregarLista');
        return;
    }

    try {
        const listas = await DataManager.getListas();
        if (!Array.isArray(listas)) {
            throw new Error('getListas retornou valor não-array');
        }
        console.log('📋 Todas as listas carregadas:', listas.length);
        
        const listasModalidade = listas.filter(l => 
            l && normalizarModalidade(l.modalidade) === normalizarModalidade(modalidadeSelecionada) && l.turma === horarioSelecionado
        );
        
        console.log('🔍 Listas filtradas para', modalidadeSelecionada, '(normalizada:', normalizarModalidade(modalidadeSelecionada), ')', '-', horarioSelecionado, ':', listasModalidade.length);
        
        // Debug: mostrar todas as combinações modalidade/turma disponíveis
        if (listasModalidade.length === 0) {
            console.log('⚠️ Nenhuma lista encontrada! Combinações disponíveis:');
            const combinacoes = {};
            listas.forEach(l => {
                if (l && l.modalidade && l.turma) {
                    const chave = `${l.modalidade} | ${l.turma}`;
                    if (!combinacoes[chave]) combinacoes[chave] = 0;
                    combinacoes[chave]++;
                }
            });
            Object.entries(combinacoes).forEach(([chave, count]) => {
                console.log(`  - ${chave}: ${count} listas`);
            });
        }

        let html = '';
        if (listasModalidade.length === 0) {
            html = '<p style="text-align: center; color: #999;">Nenhuma lista disponível para este horário</p>';
        } else {
            // Ordenar listas por mês (01, 02, 03... até 12)
            listasModalidade.sort((a, b) => parseInt(a.mes) - parseInt(b.mes));
            
            html = '<table><thead><tr><th>Mês/Ano</th><th>Alunos</th><th>Status</th><th>Ação</th></tr></thead><tbody>';
            listasModalidade.forEach(lista => {
                if (!lista) return;
                const meses = {
                    '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr',
                    '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago',
                    '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
                };
                const mesNome = meses[lista.mes];
                const todosDiasPreenchidos = todosOsDiasForamPreenchidos(lista);
                const statusTexto = todosDiasPreenchidos ? '✓ Salva' : 'Pendente';
                const statusCor = todosDiasPreenchidos ? '#28a745' : '#ff9800';
                const presencasCount = lista.presencas ? lista.presencas.length : 0;
                console.log('  📌 Lista:', mesNome + '/' + lista.ano, '- ID:', lista.id, '- Alunos:', presencasCount, '- Status:', statusTexto);
                html += `
                    <tr>
                        <td>${mesNome}/${lista.ano}</td>
                        <td>${presencasCount} alunos</td>
                        <td style="color: ${statusCor}; font-weight: bold;">${statusTexto}</td>
                        <td>
                            <button class="btn" onclick="abrirChamada(${lista.id})" style="padding: 5px 15px; font-size: 0.9rem;">Fazer Chamada</button>
                        </td>
                    </tr>
                `;
            });
            html += '</tbody></table>';
        }
        const listasEl = document.getElementById('listasDisponiveis');
        if (listasEl) {
            listasEl.innerHTML = html;
        }
    } catch (e) {
        console.error('Erro em carregarLista:', e);
        const listasEl = document.getElementById('listasDisponiveis');
        if (listasEl) {
            listasEl.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar listas</p>';
        }
    }
    
    console.timeEnd('⏱️ carregarLista');

}

// Variável global para armazenar a lista atual
let listaAtual = null;

// Atualizar tabela ao mudar o dia selecionado
async function atualizarTabelaAoMudarDia() {
    if (!listaAtual) {
        console.error('❌ listaAtual é null/undefined');
        return;
    }

    console.time('⏱️ atualizarTabelaAoMudarDia');
    try {
        const presencas = Array.isArray(listaAtual.presencas) ? listaAtual.presencas : [];

        const diaSelecionadoEl = document.getElementById('diaSelecionado');
        if (!diaSelecionadoEl) {
            console.error('❌ Elemento diaSelecionado não encontrado');
            return;
        }

        const diaSelecionado = diaSelecionadoEl.value;

        if (!listaAtual.chamadas) {
            listaAtual.chamadas = {};
        }

        if (!diaSelecionado) {
            presencas.forEach(p => (p.status = null));
        } else {
            const estadosDoDia = listaAtual.chamadas[diaSelecionado];
            if (Array.isArray(estadosDoDia)) {
                const statusPorAlunoId = new Map(estadosDoDia.map(e => [Number(e.alunoId), e.status]));
                presencas.forEach(p => {
                    const statusSalvo = statusPorAlunoId.get(Number(p.alunoId));
                    p.status = statusSalvo ?? null;
                });
            } else {
                presencas.forEach(p => (p.status = null));
            }
        }

        console.time('  ⏱️ Carregando alunos');
        const alunos = await DataManager.getAlunos();
        console.timeEnd('  ⏱️ Carregando alunos');

        const alunosPorId = new Map((alunos || []).map(a => [Number(a.id), a]));

        const formatarDataBR = (iso) => {
            if (!iso) return '-';
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return String(iso);
            return d.toLocaleDateString('pt-BR');
        };

        console.time('  ⏱️ Renderizando tabela');
        let html = '';
        presencas.forEach((presenca, index) => {
            const statusPresente = presenca.status === 'presente' ? 'btn-present' : '';
            const statusFalta = presenca.status === 'falta' ? 'btn-absent' : '';

            const aluno = alunosPorId.get(Number(presenca.alunoId));
            const dataNascimento = formatarDataBR(aluno?.dataNascimento);
            const sexo = aluno?.sexo || '-';
            const rg = aluno?.rg || '-';

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${presenca.alunoNome}</td>
                    <td>${dataNascimento}</td>
                    <td>${sexo}</td>
                    <td>${rg}</td>
                    <td style="text-align: center;">
                        <button class="attendance-btn ${statusPresente}" 
                                onclick="marcarPresenca(${index}, 'presente')"
                                id="btn-presente-${index}">
                            P
                        </button>
                        <button class="attendance-btn ${statusFalta}" 
                                onclick="marcarPresenca(${index}, 'falta')"
                                id="btn-falta-${index}">
                            F
                        </button>
                    </td>
                </tr>
            `;
        });
        console.timeEnd('  ⏱️ Renderizando tabela');

        const corpoTabelaEl = document.getElementById('corpoTabelaChamada');
        if (!corpoTabelaEl) {
            console.error('❌ Elemento corpoTabelaChamada não encontrado');
            return;
        }

        corpoTabelaEl.innerHTML = html;
        atualizarResumo();
    } catch (e) {
        console.error('❌ Erro em atualizarTabelaAoMudarDia:', e?.message || e);
        console.error('📍 Stack:', e?.stack);
    } finally {
        console.timeEnd('⏱️ atualizarTabelaAoMudarDia');
    }
}

// Abrir modal de chamada
async function abrirChamada(listaId) {
    try {
        console.time('⏱️ abrirChamada');
        console.log('🔵 abrirChamada chamada com listaId:', listaId);
        
        const listas = await DataManager.getListas();
        console.log('📋 Listas obtidas:', listas.length);
        
        listaAtual = listas.find(l => l.id === listaId);
        console.log('🔍 listaAtual encontrada:', listaAtual);
        
        if (!listaAtual) {
            console.error('❌ Lista não encontrada com ID:', listaId);
            return;
        }
        
        // Verificar se elementos existem antes de usar
        const nomeLista = document.getElementById('nomeLista');
        const dataLista = document.getElementById('dataLista');
        
        if (!nomeLista || !dataLista) {
            console.error('❌ Elementos do painel de chamada não encontrados');
            console.error('   nomeLista:', nomeLista);
            console.error('   dataLista:', dataLista);
            return;
        }
        
        nomeLista.textContent = listaAtual.nome;
        
        const meses = {
            '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr',
            '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago',
            '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
        };
        
        dataLista.textContent = `${meses[listaAtual.mes]}/${listaAtual.ano}`;
        
        // Gerar opções de dias
        const datasAulas = gerarDatasAulas(parseInt(listaAtual.mes), listaAtual.ano, listaAtual.modalidade);
        
        // 🔴 FILTRAR: REMOVER DIAS JÁ SALVOS
        const diasDisponiveis = datasAulas.filter(dia => {
            const jaSalvo = listaAtual.chamadas && listaAtual.chamadas[dia.value];
            return !jaSalvo; // Só incluir dias que NÃO foram salvos
        });
        
        console.log('📅 Dias totais disponíveis:', datasAulas.length);
        console.log('📅 Dias já salvos:', datasAulas.length - diasDisponiveis.length);
        console.log('📅 Dias ainda para preencher:', diasDisponiveis.length);
        
        let options = '<option value="">Selecione o dia...</option>';
    
        // Verificar qual é o dia de hoje para selecionar automaticamente
        const hoje = new Date();
        const hojeFormatado = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
        
        let diaHojeEncontrado = false;
        
        diasDisponiveis.forEach(data => {
            const isHoje = data.value === hojeFormatado;
            if (isHoje) diaHojeEncontrado = true;
            options += `<option value="${data.value}" ${isHoje ? 'selected' : ''}>${data.label}</option>`;
        });
        
        const selectDia = document.getElementById('diaSelecionado');
        const chamadaContainer = document.getElementById('chamadaContainer');
        
        if (!selectDia) {
            console.error('❌ Elemento diaSelecionado não encontrado');
            return;
        }
        if (!chamadaContainer) {
            console.error('❌ Elemento chamadaContainer não encontrado');
            return;
        }
        
        selectDia.innerHTML = options;
        
        // ESCONDER TUDO E MOSTRAR APENAS CHAMADA
        const filtroTurmaEl = document.getElementById('filtroTurma');
        const listasDisponiveisEl = document.getElementById('listasDisponiveis');
        
        if (filtroTurmaEl) filtroTurmaEl.parentElement.style.display = 'none';
        if (listasDisponiveisEl) listasDisponiveisEl.style.display = 'none';
        
        // Mostrar container de chamada
        chamadaContainer.style.display = 'block';
        console.log('✅ Tela de chamada exibida');
        console.log('   Computed display:', window.getComputedStyle(chamadaContainer).display);
        console.log('   Element visible:', chamadaContainer.offsetHeight > 0);
        
        // Carregar tabela (se hoje for dia de aula, já carrega)
        await atualizarTabelaAoMudarDia();
        console.timeEnd('⏱️ abrirChamada');
    } catch (e) {
        console.error('❌ Erro em abrirChamada:', e.message);
        console.error('📍 Stack:', e.stack);
    }
}

// Fechar modal e voltar
function fecharChamada() {
    const chamadaContainer = document.getElementById('chamadaContainer');
    const filtroTurmaEl = document.getElementById('filtroTurma');
    const listasDisponiveisEl = document.getElementById('listasDisponiveis');
    
    if (chamadaContainer) {
        chamadaContainer.style.display = 'none';
    }
    
    // Mostrar tudo de novo
    if (filtroTurmaEl) filtroTurmaEl.parentElement.style.display = 'block';
    if (listasDisponiveisEl) listasDisponiveisEl.style.display = 'block';
    
    listaAtual = null;
    console.log('✅ Voltado para tela de listas');
}

// Marcar presença
function marcarPresenca(index, status) {
    if (!listaAtual) return;
    
    const diaSelecionadoEl = document.getElementById('diaSelecionado');
    if (!diaSelecionadoEl) {
        console.error('❌ Elemento diaSelecionado não encontrado');
        return;
    }
    
    const diaSelecionado = diaSelecionadoEl.value;
    if (!diaSelecionado) {
        alert('Selecione o dia da aula primeiro!');
        return;
    }
    
    const presenca = listaAtual.presencas[index];
    
    // Toggle (se clicar no mesmo, desmarca)
    if (presenca.status === status) {
        presenca.status = null;
    } else {
        presenca.status = status;
    }
    
    // Atualizar botões visualmente
    const btnP = document.getElementById(`btn-presente-${index}`);
    const btnF = document.getElementById(`btn-falta-${index}`);
    
    if (btnP && btnF) {
        btnP.className = 'attendance-btn';
        btnF.className = 'attendance-btn';
        
        if (presenca.status === 'presente') btnP.classList.add('btn-present');
        if (presenca.status === 'falta') btnF.classList.add('btn-absent');
    }
    
    atualizarResumo();
}

// Atualizar resumo
function atualizarResumo() {
    if (!listaAtual) return;
    
    const total = listaAtual.presencas.length;
    const presentes = listaAtual.presencas.filter(p => p.status === 'presente').length;
    const faltas = listaAtual.presencas.filter(p => p.status === 'falta').length;
    
    const resumoEl = document.getElementById('resumoPresenca');
    if (resumoEl) {
        resumoEl.textContent = `Total: ${total} | Presentes: ${presentes} | Faltas: ${faltas}`;
    }
}

// Salvar chamada
async function salvarChamada() {
    console.time('⏱️ salvarChamada');
    
    if (!listaAtual) return;
    
    const diaSelecionadoEl = document.getElementById('diaSelecionado');
    if (!diaSelecionadoEl) {
        console.error('❌ Elemento diaSelecionado não encontrado');
        return;
    }
    
    const diaSelecionado = diaSelecionadoEl.value;
    if (!diaSelecionado) {
        alert('Selecione o dia da aula!');
        return;
    }
    
    try {
        // Salvar o estado atual na estrutura de chamadas da lista
        if (!listaAtual.chamadas) listaAtual.chamadas = {};
        
        // Mapear apenas o necessário: alunoId e status
        const estadoAtual = listaAtual.presencas.map(p => ({
            alunoId: p.alunoId,
            status: p.status
        })).filter(p => p.status !== null); // Salvar apenas quem tem status definido
        
        listaAtual.chamadas[diaSelecionado] = estadoAtual;
        
        // Salvar no DataManager
        const salvo = await DataManager.saveLista(listaAtual);
        
        if (salvo) {
            console.log('✅ Dia salvo:', diaSelecionado);
            
            // 1️⃣ REMOVER DIA SALVO DO DROPDOWN
            const optionElement = Array.from(diaSelecionadoEl.options).find(opt => opt.value === diaSelecionado);
            if (optionElement) {
                optionElement.remove();
                console.log('🗑️ Dia removido do dropdown');
            }
            
            // 2️⃣ CARREGAR PRÓXIMO DIA AUTOMATICAMENTE
            if (diaSelecionadoEl.options.length > 1) {
                // Há mais dias disponíveis
                diaSelecionadoEl.selectedIndex = 1; // Selecionar o primeiro dia disponível (pulando a opção "Selecione")
                await atualizarTabelaAoMudarDia();
                alert('Chamada salva! Carregando próximo dia...');
                console.log('➡️ Próximo dia carregado automaticamente');
            } else {
                // Não há mais dias - a lista está completa!
                alert('✅ Todos os dias da lista foram preenchidos!');
                fecharChamada();
                carregarLista(); // Atualizar lista principal para mostrar "Salva"
                console.log('✅ Todos os dias preenchidos');
            }
        } else {
            alert('Erro ao salvar chamada. Tente novamente.');
        }
    } catch (e) {
        console.error('❌ Erro ao salvar chamada:', e.message);
        alert('Erro ao salvar: ' + e.message);
    }
    
    console.timeEnd('⏱️ salvarChamada');
}

// Inicializar
let dataManagerModalidadeInicializado = false;

async function inicializarDataManagerModalidade() {
    if (dataManagerModalidadeInicializado) return true;
    
    try {
        console.log('🔄 Modalidade-Painel: Inicializando DataManager...');
        await DataManager.init();
        dataManagerModalidadeInicializado = true;
        console.log('✅ Modalidade-Painel: DataManager inicializado com sucesso');
        return true;
    } catch (e) {
        console.error('❌ Modalidade-Painel ERRO: Falha ao inicializar DataManager:', e.message);
        return false;
    }
}

window.addEventListener('DOMContentLoaded', async function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // 1. Garantir que o DataManager está inicializado
    const dmOk = await inicializarDataManagerModalidade();
    if (!dmOk) {
        alert('Erro ao inicializar sistema. Recarregue a página.');
        window.location.href = '/colaborador/index.html';
        return;
    }
    
    console.log('DataManager inicializado');

    // 2. Sincronizar listas PRIMEIRO (para garantir que turmas/horários estão disponíveis)
    if (typeof gerarListasAutomaticamenteSincronizado === 'function') {
        console.log('Iniciando sincronização de listas...');
        try {
            await gerarListasAutomaticamenteSincronizado();
            console.log('Sincronização de listas concluída');
        } catch (e) {
            console.error('Erro na sincronização de listas:', e);
        }
    }

    // 3. DEPOIS de sincronizar, carregar horários no dropdown
    await carregarHorarios();
    console.log('Horários carregados no dropdown');

    // 4. Nome da modalidade no título
    const nomes = {
        'judo': 'Judô',
        'canoagem-velocidade': 'Canoagem Velocidade',
        'futebol': 'Futebol',
        'vela': 'Vela',
        'canoagem-turismo': 'Canoagem Turismo'
    };
    
    const tituloEl = document.getElementById('tituloModalidade');
    if (tituloEl) {
        tituloEl.textContent = nomes[normalizarModalidade(modalidadeSelecionada)] || modalidadeSelecionada;
    }
});

// Listener para sincronização
window.addEventListener('listasAtualizadas', function() {
    carregarLista();
});

// ============================================================================
// ALIASES - Compatibilidade com HTML
// ============================================================================

// Alias para salvarChamada
function salvarPresencas() {
    salvarChamada();
}

// Alias para fecharChamada e recarregar listas
function voltarParaListas() {
    fecharChamada();
    carregarLista();
}

// ============================================================================
// LISTENERS PARA ATUALIZAÇÃO REALTIME
// ============================================================================

// Listener para alunos atualizados
window.addEventListener('alunosAtualizados', function() {
    console.log('📡 modalidade-painel.js: Alunos atualizados, recarregando lista...');
    if (listaAtual) {
        // Se está na chamada, recarregar a tabela
        atualizarTabelaAoMudarDia();
    } else {
        // Se na lista de listas, recarregar
        carregarLista();
    }
});

// Listener para listas atualizadas
window.addEventListener('listasAtualizadas', function() {
    console.log('📡 modalidade-painel.js: Listas atualizadas, recarregando...');
    carregarLista();
});
