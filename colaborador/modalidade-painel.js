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
        const turmasListas = [...new Set(listas.filter(l => l && l.modalidade === modalidade).map(l => l.turma))];
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
        const turmasAlunos = [...new Set(alunos.filter(a => a && a.modalidade === modalidade).map(a => a.turma))];
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
    window.location.href = '/colaborador/index.html';
}

// Carregar horários para o filtro
async function carregarHorarios() {
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
}

// Carregar lista de presença
async function carregarLista() {
    const filtroEl = document.getElementById('filtroTurma');
    if (!filtroEl) {
        console.error('Elemento filtroTurma não encontrado');
        return;
    }
    const horarioSelecionado = filtroEl.value;
    
    if (!horarioSelecionado) {
        const listasEl = document.getElementById('listasDisponiveis');
        if (listasEl) {
            listasEl.innerHTML = '<p style="text-align: center; color: #999;">Selecione um horário</p>';
        }
        return;
    }

    try {
        const listas = await DataManager.getListas();
        if (!Array.isArray(listas)) {
            throw new Error('getListas retornou valor não-array');
        }
        const listasModalidade = listas.filter(l => 
            l && l.modalidade === modalidadeSelecionada && l.turma === horarioSelecionado
        );

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
                const statusTexto = lista.salva ? '✓ Salva' : 'Pendente';
                const statusCor = lista.salva ? '#28a745' : '#ff9800';
                const presencasCount = lista.presencas ? lista.presencas.length : 0;
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
}

// Variável global para armazenar a lista atual
let listaAtual = null;

// Atualizar tabela ao mudar o dia selecionado
async function atualizarTabelaAoMudarDia() {
    if (!listaAtual) return;
    
    try {
        const diaSelecionadoEl = document.getElementById('diaSelecionado');
        if (!diaSelecionadoEl) {
            console.error('❌ Elemento diaSelecionado não encontrado');
            return;
        }
        
        const diaSelecionado = diaSelecionadoEl.value;
        
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

    const corpoTabelaEl = document.getElementById('corpoTabelaChamada');
    if (corpoTabelaEl) {
        corpoTabelaEl.innerHTML = html;
    }
    atualizarResumo();
    } catch (e) {
        console.error('❌ Erro em atualizarTabelaAoMudarDia:', e.message);
    }
}

// Abrir modal de chamada
async function abrirChamada(listaId) {
    try {
        const listas = await DataManager.getListas();
        listaAtual = listas.find(l => l.id === listaId);
        
        if (!listaAtual) {
            console.error('❌ Lista não encontrada com ID:', listaId);
            return;
        }
        
        // Verificar se elementos existem antes de usar
        const tituloChamadaEl = document.getElementById('tituloChamada');
        const nomeLista = document.getElementById('nomeLista');
        const dataLista = document.getElementById('dataLista');
        
        if (!tituloChamadaEl) {
            console.error('❌ Elemento tituloChamada não encontrado');
            return;
        }
        
        tituloChamadaEl.textContent = `Chamada - ${listaAtual.nome}`;
        if (nomeLista) nomeLista.textContent = listaAtual.nome;
        
        const meses = {
            '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr',
            '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago',
            '09': 'set', '10': 'out', '11': 'nov', '12': 'dez'
        };
        
        if (dataLista) dataLista.textContent = `${meses[listaAtual.mes]}/${listaAtual.ano}`;
        
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
        const modalChamada = document.getElementById('modalChamada');
        
        if (!selectDia) {
            console.error('❌ Elemento diaSelecionado não encontrado');
            return;
        }
        if (!modalChamada) {
            console.error('❌ Elemento modalChamada não encontrado');
            return;
        }
        
        selectDia.innerHTML = options;
        
        // Mostrar modal
        modalChamada.style.display = 'block';
        
        // Carregar tabela (se hoje for dia de aula, já carrega)
        await atualizarTabelaAoMudarDia();
    } catch (e) {
        console.error('❌ Erro em abrirChamada:', e.message);
    }
}

// Fechar modal
function fecharChamada() {
    const modalChamada = document.getElementById('modalChamada');
    if (modalChamada) {
        modalChamada.style.display = 'none';
    }
    listaAtual = null;
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
    
    const resumoEl = document.getElementById('resumoChamada');
    if (resumoEl) {
        resumoEl.textContent = `Total: ${total} | Presentes: ${presentes} | Faltas: ${faltas}`;
    }
}

// Salvar chamada
async function salvarChamada() {
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
    } catch (e) {
        console.error('❌ Erro ao salvar chamada:', e.message);
        alert('Erro ao salvar: ' + e.message);
    }
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
        tituloEl.textContent = nomes[modalidadeSelecionada] || modalidadeSelecionada;
    }
});

// Listener para sincronização
window.addEventListener('listasAtualizadas', function() {
    carregarLista();
});
