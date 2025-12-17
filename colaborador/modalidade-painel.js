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
    // 1) Tentar via listas existentes
    try {
        const listas = await DataManager.getListas();
        const turmasListas = [...new Set(listas.filter(l => l.modalidade === modalidade).map(l => l.turma))];
        if (turmasListas.length > 0) return turmasListas.sort();
    } catch (e) { console.warn('Falha ao ler listas', e); }

    // 2) Tentar via alunos cadastrados
    try {
        const alunos = await DataManager.getAlunos();
        const turmasAlunos = [...new Set(alunos.filter(a => a.modalidade === modalidade).map(a => a.turma))];
        if (turmasAlunos.length > 0) return turmasAlunos.sort();
    } catch (e) { console.warn('Falha ao ler alunos', e); }

    // 3) Fallback: retornar do cronograma apenas se banco estiver vazio
    for (const bloco of Object.values(CRONOGRAMA_MODAL)) {
        if (bloco.modalidades[modalidade]) {
            return bloco.modalidades[modalidade].horarios;
        }
    }
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

// Função para gerar datas das aulas do mês
function gerarDatasAulas(mes, ano, modalidade) {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diasDaModalidade = diasPorModalidade[modalidade] || ['Terça', 'Sexta'];
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
    
    return datasAulas;
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
    window.location.href = 'index.html';
}

// Carregar horários para o filtro
async function carregarHorarios() {
    const horarios = await obterHorariosPorModalidade(modalidadeSelecionada) || [];
    
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
    
    let html = '<option value="">-- Selecione --</option>';
    horariosOrdenados.forEach(horario => {
        html += `<option value="${horario}">${horario}</option>`;
    });
    document.getElementById('filtroTurma').innerHTML = html;
}

// Carregar lista de presença
async function carregarLista() {
    const horarioSelecionado = document.getElementById('filtroTurma').value;
    
    if (!horarioSelecionado) {
        document.getElementById('listasDisponiveis').innerHTML = '<p style="text-align: center; color: #999;">Selecione um horário</p>';
        return;
    }

    const listas = await DataManager.getListas();
    const listasModalidade = listas.filter(l => 
        l.modalidade === modalidadeSelecionada && l.turma === horarioSelecionado
    );

    let html = '';
    if (listasModalidade.length === 0) {
        html = '<p style="text-align: center; color: #999;">Nenhuma lista disponível para este horário</p>';
    } else {
        // Ordenar listas por mês (01, 02, 03... até 12)
        listasModalidade.sort((a, b) => parseInt(a.mes) - parseInt(b.mes));
        
        html = '<table><thead><tr><th>Mês/Ano</th><th>Alunos</th><th>Status</th><th>Ação</th></tr></thead><tbody>';
        listasModalidade.forEach(lista => {
            const meses = {
                '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr',
                '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago',
                '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
            };
            const mesNome = meses[lista.mes];
            const statusTexto = lista.salva ? '✓ Salva' : 'Pendente';
            const statusCor = lista.salva ? '#28a745' : '#ff9800';
            html += `
                <tr>
                    <td>${mesNome}/${lista.ano}</td>
                    <td>${lista.presencas.length} alunos</td>
                    <td style="color: ${statusCor}; font-weight: bold;">${statusTexto}</td>
                    <td>
                        <button class="btn" onclick="abrirChamada(${lista.id})" style="padding: 5px 15px; font-size: 0.9rem;">Fazer Chamada</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
    }
    document.getElementById('listasDisponiveis').innerHTML = html;
}

// Variável global para armazenar a lista atual
let listaAtual = null;

// Atualizar tabela ao mudar o dia selecionado
async function atualizarTabelaAoMudarDia() {
    if (!listaAtual) return;
    
    const diaSelecionado = document.getElementById('diaSelecionado').value;
    
    // Inicializar estrutura de chamadas se não existir
    if (!listaAtual.chamadas) {
        listaAtual.chamadas = {};
    }
    
    // Se desmarcou o dia, zerar tudo
    if (!diaSelecionado) {
        // Limpar todos os estados
        listaAtual.presencas.forEach(p => p.status = null);
    } else {
        // Se mudou para um dia diferente, fazer reset automático
        // Carregar dados daquela data se existir, senão zera tudo
        const estadosDaquelaDia = listaAtual.chamadas[diaSelecionado];
        
        if (estadosDaquelaDia) {
            // Restaurar estados salvos daquela data
            listaAtual.presencas.forEach(presenca => {
                const estadoSalvo = estadosDaquelaDia.find(e => e.alunoId === presenca.alunoId);
                presenca.status = estadoSalvo ? estadoSalvo.status : null;
            });
        } else {
            // Primeira vez neste dia - zerar tudo
            listaAtual.presencas.forEach(p => p.status = null);
        }
    }
    
    // Recriar tabela com estados atualizados
    let html = '';
    const alunos = await DataManager.getAlunos();
    
    listaAtual.presencas.forEach((presenca, index) => {
        const statusPresente = presenca.status === 'presente' ? 'btn-present' : '';
        const statusFalta = presenca.status === 'falta' ? 'btn-absent' : '';
        
        // Buscar data de nascimento e RG do aluno
        const aluno = alunos.find(a => a.id === presenca.alunoId);
        const dataNascimento = aluno ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR') : '-';
        const sexo = aluno ? (aluno.sexo || '-') : '-';
        const rg = aluno ? (aluno.rg || '-') : '-';

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

    document.getElementById('corpoTabelaChamada').innerHTML = html;
    atualizarResumo();
}

// Abrir modal de chamada
async function abrirChamada(listaId) {
    const listas = await DataManager.getListas();
    listaAtual = listas.find(l => l.id === listaId);
    
    if (!listaAtual) return;
    
    document.getElementById('tituloChamada').textContent = `Chamada - ${listaAtual.nome}`;
    
    // Gerar opções de dias
    const datasAulas = gerarDatasAulas(parseInt(listaAtual.mes), listaAtual.ano, listaAtual.modalidade);
    let options = '<option value="">Selecione o dia...</option>';
    
    // Verificar qual é o dia de hoje para selecionar automaticamente
    const hoje = new Date();
    const hojeFormatado = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
    
    let diaHojeEncontrado = false;
    
    datasAulas.forEach(data => {
        const isHoje = data.value === hojeFormatado;
        if (isHoje) diaHojeEncontrado = true;
        options += `<option value="${data.value}" ${isHoje ? 'selected' : ''}>${data.label}</option>`;
    });
    
    const selectDia = document.getElementById('diaSelecionado');
    selectDia.innerHTML = options;
    
    // Mostrar modal
    document.getElementById('modalChamada').style.display = 'block';
    
    // Carregar tabela (se hoje for dia de aula, já carrega)
    await atualizarTabelaAoMudarDia();
}

// Fechar modal
function fecharChamada() {
    document.getElementById('modalChamada').style.display = 'none';
    listaAtual = null;
}

// Marcar presença
function marcarPresenca(index, status) {
    if (!listaAtual) return;
    
    const diaSelecionado = document.getElementById('diaSelecionado').value;
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
    
    btnP.className = 'attendance-btn';
    btnF.className = 'attendance-btn';
    
    if (presenca.status === 'presente') btnP.classList.add('btn-present');
    if (presenca.status === 'falta') btnF.classList.add('btn-absent');
    
    atualizarResumo();
}

// Atualizar resumo
function atualizarResumo() {
    if (!listaAtual) return;
    
    const total = listaAtual.presencas.length;
    const presentes = listaAtual.presencas.filter(p => p.status === 'presente').length;
    const faltas = listaAtual.presencas.filter(p => p.status === 'falta').length;
    
    document.getElementById('resumoChamada').textContent = 
        `Total: ${total} | Presentes: ${presentes} | Faltas: ${faltas}`;
}

// Salvar chamada
async function salvarChamada() {
    if (!listaAtual) return;
    
    const diaSelecionado = document.getElementById('diaSelecionado').value;
    if (!diaSelecionado) {
        alert('Selecione o dia da aula!');
        return;
    }
    
    // Salvar o estado atual na estrutura de chamadas da lista
    if (!listaAtual.chamadas) listaAtual.chamadas = {};
    
    // Mapear apenas o necessário: alunoId e status
    const estadoAtual = listaAtual.presencas.map(p => ({
        alunoId: p.alunoId,
        status: p.status
    })).filter(p => p.status !== null); // Salvar apenas quem tem status definido
    
    listaAtual.chamadas[diaSelecionado] = estadoAtual;
    listaAtual.salva = true;
    
    // Salvar no DataManager
    const salvo = await DataManager.saveLista(listaAtual);
    
    if (salvo) {
        alert('Chamada salva com sucesso!');
        fecharChamada();
        carregarLista(); // Atualizar lista principal
    } else {
        alert('Erro ao salvar chamada. Tente novamente.');
    }
}

// Inicializar
window.addEventListener('DOMContentLoaded', async function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Garantir que o DataManager está inicializado (Supabase ou LocalStorage)
    await DataManager.init();

    // Nome da modalidade no título
    const nomes = {
        'judo': 'Judô',
        'canoagem-velocidade': 'Canoagem Velocidade',
        'futebol': 'Futebol',
        'vela': 'Vela',
        'canoagem-turismo': 'Canoagem Turismo'
    };
    
    const tituloEl = document.getElementById('tituloModalidade');
    if (tituloEl) {
        tituloEl.textContent = nomes[modalidadeSelecionada] || modalidadeSelecionada;
    }
    
    carregarHorarios();
});

// Listener para sincronização
window.addEventListener('listasAtualizadas', function() {
    carregarLista();
});
