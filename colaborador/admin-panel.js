// ============================================================
// PAINEL DE ADMINISTRAÇÃO - Gerenciar Usuarios, Chamadas, Dashboard
// ============================================================

let usuariosAdmin = {};
let usuarioEmEdicao = null;
let chamadaEmEdicao = null;
let intervaloRecarregaUsuarios = null;
let ordenacaoMesAscChamadas = true; // Default: Jan → Dez
let dataManagerAdminInicializado = false;

// Dias de aula por modalidade
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
    
    // ⚠️ VALIDAÇÃO INTELIGENTE: se modalidade não existe, logar erro
    const diasDaModalidade = diasPorModalidade[modalidade];
    if (!diasDaModalidade) {
        console.error(`❌ ERRO CRÍTICO: Modalidade "${modalidade}" não encontrada em diasPorModalidade!`);
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

// Inicializar DataManager
async function inicializarDataManagerAdmin() {
    if (dataManagerAdminInicializado) return true;
    
    try {
        console.log('🔄 Admin-Panel: Inicializando DataManager...');
        await DataManager.init();
        dataManagerAdminInicializado = true;
        console.log('✅ Admin-Panel: DataManager inicializado com sucesso');
        return true;
    } catch (e) {
        console.error('❌ Admin-Panel ERRO: Falha ao inicializar DataManager:', e.message);
        return false;
    }
}

// Verificar autenticacao de admin
function verificarAutenticacaoAdmin() {
    const adminLogado = localStorage.getItem('adminLogado');
    if (!adminLogado) {
        window.location.href = '/colaborador/admin-login.html';
    }
}

function fazerLogoutAdmin() {
    localStorage.removeItem('adminLogado');
    window.location.href = '/colaborador/admin-login.html';
}

// ============================================================
// 1. GERENCIAR USUÁRIOS
// ============================================================

async function inicializarAdmin() {
    // Garantir que DataManager está inicializado
    const dmOk = await inicializarDataManagerAdmin();
    if (!dmOk) {
        console.error('❌ Admin-Panel: Não foi possível inicializar DataManager');
        document.body.innerHTML = '<h1>Erro: Sistema indisponível. Recarregue a página.</h1>';
        return;
    }
    
    usuariosAdmin = await DataManager.getUsuarios();
    
    // Se vazio, criar admin padrão se não existir (opcional, mas bom para evitar bloqueio)
    if (Object.keys(usuariosAdmin).length === 0) {
        console.log('Nenhum usuário encontrado. Criando admin padrão...');
        // Lógica de criação de admin padrão poderia ir aqui, mas vamos assumir que o usuário cria via interface ou já existe
    }
    
    await recarregarUsuarios();
    
    // Remover listas antigas de 2025 e (somente uma vez) resetar para apenas Judô jan/2026 (6 horários)
    await removerListasAntiga2025();
    const resetFlagKey = 'listasResetadas2026';
    if (!localStorage.getItem(resetFlagKey)) {
        await resetarListasParaJudoJaneiro2026();
        localStorage.setItem(resetFlagKey, 'true');
    }
    
    await inicializarFiltrosChamadas();
    await atualizarDashboard();
    atualizarEstatisticas();
    
    // Iniciar monitoramento de usuarios enquanto tab usuarios estiver ativa
    iniciarMonitoragemUsuarios();
}

// Recarregar lista de usuários
async function recarregarUsuarios() {
    console.time('⏱️ recarregarUsuarios');
    
    usuariosAdmin = await DataManager.getUsuarios();
    const tbody = document.getElementById('tabelaUsuarios');
    
    if (!tbody) {
        console.error('Elemento tabelaUsuarios nao encontrado!');
        return;
    }
    
    console.log('📥 Recarregando usuarios... Total:', Object.keys(usuariosAdmin).length);
    
    // Usar innerHTML para ser mais rápido (em vez de createElement)
    let html = '';
    
    if (Object.keys(usuariosAdmin).length === 0) {
        html = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum usuario cadastrado</td></tr>';
    } else {
        // Reconstruir tabela rapidamente
        Object.entries(usuariosAdmin).forEach(([usuario, dados]) => {
            const modalidade = dados.modalidade ? `<span class="badge professor">${dados.modalidade}</span>` : '-';
            const tipo = dados.tipo === 'professor' ? 'Professor' : 'Secretaria';
            const ativo = dados.ativo !== false ? '<span class="badge active">Ativo</span>' : '<span class="badge inactive">Inativo</span>';
            
            html += `
                <tr>
                    <td><strong>${usuario}</strong></td>
                    <td>${tipo}</td>
                    <td>${dados.nome || '-'}</td>
                    <td>${modalidade}</td>
                    <td>${ativo}</td>
                    <td>
                        <button onclick="editarUsuario('${usuario}')" style="background: #ffc107; margin-right: 5px;">Editar</button>
                        <button class="danger" onclick="deletarUsuario('${usuario}')">Deletar</button>
                    </td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
    
    // Atualizar estatísticas
    atualizarEstatisticas();
    
    console.timeEnd('⏱️ recarregarUsuarios');
    console.log('✅ Usuarios recarregados com sucesso!');
}

function atualizarEstatisticas() {
    const total = Object.keys(usuariosAdmin).length;
    const professores = Object.values(usuariosAdmin).filter(u => u.tipo === 'professor').length;
    const secretarias = Object.values(usuariosAdmin).filter(u => u.tipo === 'secretaria').length;
    
    console.log('Atualizando estatisticas:', { total, professores, secretarias });
    
    const elemTotal = document.getElementById('totalUsuarios');
    const elemProf = document.getElementById('totalProfessores');
    const elemSec = document.getElementById('totalSecretarias');
    
    if (elemTotal) elemTotal.textContent = total;
    if (elemProf) elemProf.textContent = professores;
    if (elemSec) elemSec.textContent = secretarias;
    
    console.log('Estatisticas atualizadas!');
}

function abrirModalNovoUsuario() {
    usuarioEmEdicao = null;
    document.getElementById('modalUsuarioTitulo').textContent = 'Novo Usuário';
    document.getElementById('inputUsuario').value = '';
    document.getElementById('inputSenha').value = '';
    document.getElementById('inputTipo').value = 'professor';
    document.getElementById('inputNome').value = '';
    document.getElementById('inputModalidade').value = 'judo';
    document.getElementById('inputAtivo').checked = true;
    document.getElementById('inputUsuario').disabled = false;
    atualizarCamposModalidadeModal();
    document.getElementById('modalUsuario').classList.add('show');
}

function editarUsuario(usuario) {
    usuarioEmEdicao = usuario;
    const dados = usuariosAdmin[usuario];
    
    document.getElementById('modalUsuarioTitulo').textContent = `Editar: ${usuario}`;
    document.getElementById('inputUsuario').value = usuario;
    document.getElementById('inputUsuario').disabled = false;
    document.getElementById('inputSenha').value = dados.senha;
    document.getElementById('inputTipo').value = dados.tipo;
    document.getElementById('inputNome').value = dados.nome || '';
    document.getElementById('inputModalidade').value = dados.modalidade || 'judo';
    document.getElementById('inputAtivo').checked = dados.ativo !== false;
    atualizarCamposModalidadeModal();
    document.getElementById('modalUsuario').classList.add('show');
}

function atualizarCamposModalidadeModal() {
    const tipo = document.getElementById('inputTipo').value;
    const grupoModalidade = document.getElementById('grupoModalidadeModal');
    
    if (tipo === 'professor') {
        grupoModalidade.style.display = 'block';
        document.getElementById('inputModalidade').required = true;
    } else {
        grupoModalidade.style.display = 'none';
        document.getElementById('inputModalidade').required = false;
    }
}

async function salvarUsuario(event) {
    event.preventDefault();
    
    // MOSTRAR LOADING
    const btnSalvar = document.querySelector('button[type="submit"]');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
    }
    
    try {
        const usuario = document.getElementById('inputUsuario').value.trim().toLowerCase();
        const senha = document.getElementById('inputSenha').value;
        const tipo = document.getElementById('inputTipo').value;
        const nome = document.getElementById('inputNome').value;
        const ativo = document.getElementById('inputAtivo').checked;
        const modalidade = tipo === 'professor' ? document.getElementById('inputModalidade').value : null;
        
        if (!usuario || !senha || !nome) {
            mostrarAlerta('Por favor, preencha todos os campos obrigatorios', 'danger');
            return;
        }
        
        // Verificar se novo usuario ja existe (exceto se for o mesmo user em edicao)
        if (usuariosAdmin[usuario] && (!usuarioEmEdicao || usuarioEmEdicao !== usuario)) {
            mostrarAlerta('Usuario ja existe! Escolha outro login', 'danger');
            return;
        }
        
        // Se editando e mudou o login, remover o antigo
        if (usuarioEmEdicao && usuarioEmEdicao !== usuario) {
            await DataManager.deleteUsuario(usuarioEmEdicao);
        }
        
        const novoUsuario = {
            username: usuario,
            senha: senha,
            tipo: tipo,
            nome: nome,
            ativo: ativo,
            modalidade: modalidade
        };
        
        await DataManager.saveUsuario(novoUsuario);
        
        // 🔴 LIMPAR CACHE PARA PEGAR DADOS NOVOS
        DataManager._clearCache('usuarios');
        
        // Fechar modal IMEDIATAMENTE
        fecharModal('modalUsuario');
        
        // Recarregar lista
        await recarregarUsuarios();
        
        // Sincronizar usuarios com todas as abas
        sincronizarUsuariosGlobalmente();
        
        mostrarAlerta(usuarioEmEdicao ? 'Usuario atualizado!' : 'Usuario criado!', 'success');
        
    } catch (e) {
        console.error('Erro ao salvar:', e);
        mostrarAlerta('Erro ao salvar: ' + e.message, 'danger');
    } finally {
        // REMOVER LOADING
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = '✓ Salvar';
        }
    }
}

// Funcao para sincronizar usuarios em tempo real com todas as abas
async function sincronizarUsuariosGlobalmente() {
    usuariosAdmin = await DataManager.getUsuarios();
    // Disparar evento global
    window.dispatchEvent(new CustomEvent('usuariosAtualizados', { 
        detail: { 
            usuarios: usuariosAdmin,
            timestamp: Date.now()
        } 
    }));
    
    console.log('Usuarios sincronizados globalmente com todas as abas');
}

async function deletarUsuario(usuario) {
    if (confirm(`Deletar "${usuario}"?`)) {
        try {
            console.log('Deletando usuario:', usuario);
            
            // MOSTRAR LOADING (feedback visual) - encontrar o botão correto
            const botoes = document.querySelectorAll('button.danger');
            let btnDelete = null;
            for (let btn of botoes) {
                if (btn.onclick && btn.onclick.toString().includes(usuario)) {
                    btnDelete = btn;
                    break;
                }
            }
            
            if (btnDelete) {
                btnDelete.disabled = true;
                btnDelete.textContent = 'Deletando...';
            }
            
            await DataManager.deleteUsuario(usuario);
            
            // 🔴 LIMPAR CACHE PARA PEGAR DADOS NOVOS
            DataManager._clearCache('usuarios');
            
            // Recarregar lista IMEDIATAMENTE
            await recarregarUsuarios();
            
            mostrarAlerta('Usuario deletado com sucesso!', 'success');
            
            // Sincronizar usuarios com todas as abas
            sincronizarUsuariosGlobalmente();
            
        } catch (e) {
            console.error('Erro ao deletar:', e);
            mostrarAlerta('Erro ao deletar: ' + e.message, 'danger');
        }
    }
}

// ============================================================
// CRONOGRAMA OFICIAL - 21 HORÁRIOS
// ============================================================

const CRONOGRAMA = {
    'terça-quinta': {
        dias: ['Terça', 'Quinta'],
        modalidades: {
            'judo': {
                nome: 'Judô',
                horarios: [
                    'Manhã - 8h às 9h',
                    'Manhã - 9h às 10h',
                    'Manhã - 10h às 11h',
                    'Tarde - 14h às 15h',
                    'Tarde - 15h às 16h',
                    'Tarde - 16h às 17h'
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

// ============================================================
// 2. GERENCIAR CHAMADAS
// ============================================================

async function inicializarFiltrosChamadas() {
    // Preencher modalidades a partir do CRONOGRAMA
    const modalidadesSet = new Set();
    Object.values(CRONOGRAMA).forEach(bloco => {
        Object.keys(bloco.modalidades).forEach(mod => {
            modalidadesSet.add(mod);
        });
    });
    
    const filtroModalidadeSelect = document.getElementById('filtroModalidade');
    if (filtroModalidadeSelect) {
        while (filtroModalidadeSelect.options.length > 1) filtroModalidadeSelect.remove(1);
        
        Array.from(modalidadesSet).sort().forEach(mod => {
            let nomeModalidade = mod;
            Object.values(CRONOGRAMA).forEach(bloco => {
                if (bloco.modalidades[mod]) {
                    nomeModalidade = bloco.modalidades[mod].nome;
                }
            });
            
            const opt = document.createElement('option');
            opt.value = mod;
            opt.textContent = nomeModalidade;
            filtroModalidadeSelect.appendChild(opt);
        });
    }
    
    // Preencher horários (turmas) a partir do CRONOGRAMA
    const turmasSet = new Set();
    Object.values(CRONOGRAMA).forEach(bloco => {
        Object.values(bloco.modalidades).forEach(mod => {
            mod.horarios.forEach(horario => {
                // Apenas adiciona horários que têm o prefixo "Manhã -" ou "Tarde -"
                if (horario.includes('Manhã -') || horario.includes('Tarde -')) {
                    turmasSet.add(horario);
                }
            });
        });
    });
    
    const filtroTurmaSelect = document.getElementById('filtroTurma');
    if (filtroTurmaSelect) {
        while (filtroTurmaSelect.options.length > 1) filtroTurmaSelect.remove(1);
        
        // Ordenar horários: Manhã primeiro, depois Tarde, e dentro de cada um por hora numérica
        const horariosOrdenados = Array.from(turmasSet).sort((a, b) => {
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
        
        horariosOrdenados.forEach(turma => {
            const opt = document.createElement('option');
            opt.value = turma;
            opt.textContent = turma;
            filtroTurmaSelect.appendChild(opt);
        });
    }
    
    // Preencher meses
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const filtroMesSelect = document.getElementById('filtroMes');
    if (filtroMesSelect) {
        while (filtroMesSelect.options.length > 1) filtroMesSelect.remove(1);
        
        mesesNomes.forEach((mes, i) => {
            const opt = document.createElement('option');
            opt.value = String(i + 1).padStart(2, '0');
            opt.textContent = mes;
            filtroMesSelect.appendChild(opt);
        });
    }
    
    // Preencher anos
    const filtroAnoSelect = document.getElementById('filtroAno');
    if (filtroAnoSelect) {
        while (filtroAnoSelect.options.length > 1) filtroAnoSelect.remove(1);
        
        for (let ano = 2024; ano <= 2027; ano++) {
            const opt = document.createElement('option');
            opt.value = ano;
            opt.textContent = ano;
            filtroAnoSelect.appendChild(opt);
        }
    }
    
    await recarregarChamadas();
}

async function filtrarChamadas() {
    await recarregarChamadas();
}

async function recarregarChamadas() {
    const listas = await DataManager.getListas();
    const filtroModalidade = document.getElementById('filtroModalidade')?.value || '';
    const filtroTurma = document.getElementById('filtroTurma')?.value || '';
    const filtroMes = document.getElementById('filtroMes')?.value || '';
    const filtroAno = document.getElementById('filtroAno')?.value || '';
    
    let listasFiltradasArg = listas;
    
    if (filtroMes) listasFiltradasArg = listasFiltradasArg.filter(l => l.mes === filtroMes);
    if (filtroAno) listasFiltradasArg = listasFiltradasArg.filter(l => Number(l.ano) === Number(filtroAno));
    if (filtroTurma) listasFiltradasArg = listasFiltradasArg.filter(l => l.turma === filtroTurma);
    if (filtroModalidade) listasFiltradasArg = listasFiltradasArg.filter(l => l.modalidade === filtroModalidade);
    
    // Ordenar por ano asc e mes conforme seleção (asc: Jan→Dez, desc: Dez→Jan)
    listasFiltradasArg.sort((a, b) => {
        const cmpAno = Number(a.ano) - Number(b.ano);
        if (cmpAno !== 0) return cmpAno;
        const ma = Number(a.mes);
        const mb = Number(b.mes);
        return ordenacaoMesAscChamadas ? (ma - mb) : (mb - ma);
    });
    
    const tbody = document.getElementById('tabelaChamadas');
    tbody.innerHTML = '';
    
    if (listasFiltradasArg.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhuma chamada encontrada</td></tr>';
        return;
    }
    
    listasFiltradasArg.forEach(lista => {
        const mesesNomes = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        let nomeModalidade = lista.modalidade;
        Object.values(CRONOGRAMA).forEach(bloco => {
            if (bloco.modalidades[lista.modalidade]) {
                nomeModalidade = bloco.modalidades[lista.modalidade].nome;
            }
        });
        
        const totalPresencas = lista.presencas ? lista.presencas.length : 0;
        const todosDiasPreenchidos = todosOsDiasForamPreenchidos(lista);
        const statusTexto = todosDiasPreenchidos ? 'Salva' : 'Pendente';
        const statusCor = todosDiasPreenchidos ? '#28a745' : '#ff9800';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mesesNomes[parseInt(lista.mes)]} ${lista.ano}</td>
            <td>${nomeModalidade}</td>
            <td><strong>${lista.turma}</strong></td>
            <td>${totalPresencas} alunos</td>
            <td style="color: ${statusCor}; font-weight: bold;">${statusTexto}</td>
            <td>
                <button onclick="editarChamada(${lista.id})" style="padding: 5px 10px; margin-right: 5px;">Editar</button>
                <button class="danger" onclick="deletarChamada(${lista.id})" style="padding: 5px 10px;">Deletar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Alternar ordenação de meses na aba Chamadas
async function setOrdenacaoChamadas(order) {
    ordenacaoMesAscChamadas = (order === 'asc');
    await recarregarChamadas();
}

// Remover listas antigas de 2025 (limpeza de dados antigos)
async function removerListasAntiga2025() {
    const listas = await DataManager.getListas();
    const listasAntigas = listas.filter(l => l.ano === '2025');
    
    for (const lista of listasAntigas) {
        await DataManager.deleteLista(lista.id);
    }
    
    if (listasAntigas.length > 0) {
        console.log('Listas de 2025 removidas.');
    }
}

// Resetar todas as listas e manter apenas Judô janeiro/2026 com 6 horários
async function resetarListasParaJudoJaneiro2026() {
    const alunos = await DataManager.getAlunos();
    const alunosJudo = alunos.filter(a => a.modalidade === 'judo' && a.ativo !== false);
    const horariosJudo = [
        'Manhã - 8h às 9h',
        'Manhã - 9h às 10h',
        'Manhã - 10h às 11h',
        'Tarde - 14h às 15h',
        'Tarde - 15h às 16h',
        'Tarde - 16h às 17h'
    ];
    const mes = '01';
    const ano = '2026';
    
    // Primeiro apagar todas as listas
    const listasAtuais = await DataManager.getListas();
    for (const l of listasAtuais) {
        await DataManager.deleteLista(l.id);
    }
    
    // Criar novas
    for (const [index, horario] of horariosJudo.entries()) {
        const presencas = alunosJudo
            .filter(aluno => aluno.turma === horario)
            .map(aluno => ({
                alunoId: aluno.id,
                alunoNome: aluno.nome,
                dataNascimento: aluno.dataNascimento || '-'
            }));
            
        const novaLista = {
            id: Date.now() + index,
            modalidade: 'judo',
            turma: horario,
            mes,
            ano,
            nome: `Judô - ${horario}`,
            presencas,
            chamadas: {},
            salva: false
        };
        await DataManager.saveLista(novaLista);
    }
    
    window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { reset: true } }));
    console.log('Listas resetadas: apenas Judô janeiro/2026 com 6 horários.');
}

// Obter dias da semana específicos do mês
function obterDiasDoMes(mes, ano, diasDaSemana) {
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diasSelecionados = [];
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    
    for (let dia = 1; dia <= ultimoDiaDoMes; dia++) {
        const data = new Date(ano, mes - 1, dia);
        const diaSemana = diasNomes[data.getDay()];
        
        if (diasDaSemana.includes(diaSemana)) {
            diasSelecionados.push(dia);
        }
    }
    
    return diasSelecionados;
}

// Utilidades para manter chamadas no mesmo formato do painel do professor (data "DD/MM/AAAA" com array de presenças)
function montarChaveData(lista, dia) {
    return `${String(dia).padStart(2, '0')}/${lista.mes}/${lista.ano}`;
}

function statusParaSelect(status) {
    if (!status) return 'S';
    if (status === 'presente' || status === 'P') return 'P';
    if (status === 'falta' || status === 'F') return 'F';
    return 'S';
}

function obterStatusAlunoDiaTabela(lista, dia, alunoId) {
    if (!lista || !lista.chamadas) return 'S';
    const chave = montarChaveData(lista, dia);
    const chamadaDia = lista.chamadas[chave];
    if (Array.isArray(chamadaDia)) {
        const registro = chamadaDia.find(r => Number(r.alunoId) === Number(alunoId));
        if (registro) return statusParaSelect(registro.status);
    }
    const formatoAntigo = lista.chamadas[dia];
    if (formatoAntigo && typeof formatoAntigo === 'object') {
        const valor = formatoAntigo[alunoId] || formatoAntigo[String(alunoId)];
        if (valor) return statusParaSelect(valor);
    }
    return 'S';
}

function salvarStatusAlunoDia(lista, dia, alunoId, alunoNome, statusSelect) {
    if (!lista.chamadas) lista.chamadas = {};
    const chave = montarChaveData(lista, dia);
    if (!Array.isArray(lista.chamadas[chave])) {
        lista.chamadas[chave] = [];
    }
    const registros = lista.chamadas[chave];
    const indiceExistente = registros.findIndex(r => Number(r.alunoId) === Number(alunoId));
    if (indiceExistente !== -1) registros.splice(indiceExistente, 1);
    if (statusSelect && statusSelect !== 'S') {
        const statusConvertido = statusSelect === 'P' ? 'presente' : 'falta';
        registros.push({ alunoId, alunoNome, status: statusConvertido });
    }
    if (registros.length === 0) delete lista.chamadas[chave];
    if (lista.chamadas[dia]) delete lista.chamadas[dia];
}

function normalizarChamadasParaProfessor(lista) {
    if (!lista || !lista.chamadas) return;
    const chamadasNormalizadas = {};
    Object.entries(lista.chamadas).forEach(([chave, valor]) => {
        const diaNumero = chave.includes('/') ? parseInt(chave.split('/')[0], 10) : parseInt(chave, 10);
        if (Number.isNaN(diaNumero)) return;
        const chaveData = montarChaveData(lista, diaNumero);
        const registros = [];
        if (Array.isArray(valor)) {
            valor.forEach(item => {
                const statusSel = statusParaSelect(item.status);
                if (statusSel === 'S') return;
                registros.push({
                    alunoId: item.alunoId,
                    alunoNome: item.alunoNome,
                    status: statusSel === 'P' ? 'presente' : 'falta'
                });
            });
        } else if (valor && typeof valor === 'object') {
            Object.entries(valor).forEach(([alunoId, st]) => {
                const statusSel = statusParaSelect(st);
                if (statusSel === 'S') return;
                const alunoInfo = (lista.presencas || []).find(p => Number(p.alunoId) === Number(alunoId));
                registros.push({
                    alunoId: Number(alunoId),
                    alunoNome: alunoInfo?.alunoNome || alunoInfo?.nome || '',
                    status: statusSel === 'P' ? 'presente' : 'falta'
                });
            });
        }
        if (registros.length > 0) {
            chamadasNormalizadas[chaveData] = registros;
        }
    });
    lista.chamadas = chamadasNormalizadas;
}

function atualizarDiasSalvosLista(lista) {
    if (!lista) return;
    const dias = [];
    Object.entries(lista.chamadas || {}).forEach(([chave, registros]) => {
        if (Array.isArray(registros) && registros.length > 0) {
            dias.push(chave);
        }
    });
    lista.diasSalvos = dias;
    if (dias.length > 0) {
        // Guardar ultimo dia salvo como referencia
        lista.dia = dias[dias.length - 1];
    }
}

async function editarChamada(listaId) {
    console.time('⏱️ editarChamada');
    
    const listas = await DataManager.getListas();
    const lista = listas.find(l => l.id === listaId);
    
    if (!lista) {
        mostrarAlerta('Chamada nao encontrada', 'danger');
        return;
    }
    
    chamadaEmEdicao = lista;
    normalizarChamadasParaProfessor(chamadaEmEdicao);
    
    // Obter dias de aula (terça e quinta para Judô)
    const diasAula = obterDiasDoMes(parseInt(lista.mes), parseInt(lista.ano), ['Terça', 'Quinta']);
    
    if (diasAula.length === 0) {
        mostrarAlerta('Nenhum dia de aula encontrado para este mês!', 'warning');
        return;
    }
    
    // ⚡ Fazer UMA ÚNICA requisição de alunos
    const alunos = lista.presencas && lista.presencas.length > 0 ? await DataManager.getAlunos() : [];
    const alunosPorId = {};
    alunos.forEach(a => { alunosPorId[a.id] = a; });
    
    // Criar cabeçalho da tabela
    let html = `<h3 style="margin-top: 0;">${lista.nome}</h3>
    <p style="color: #666; margin: 5px 0 20px 0;">Janeiro de ${lista.ano} - ${lista.turma} (Terça/Quinta)</p>
    
    <div style="overflow-x: auto; max-height: calc(95vh - 200px); overflow-y: auto; border: 2px solid #007bff; border-radius: 4px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
        <thead style="position: sticky; top: 0; background: #007bff; color: white; z-index: 10;">
            <tr>
                <th style="border: 1px solid #0056b3; padding: 12px; min-width: 40px; text-align: center; font-weight: bold; background: #555;">Nº</th>
                <th style="border: 1px solid #0056b3; padding: 12px; min-width: 180px; text-align: left; font-weight: bold; background: #555;">Nome do Aluno</th>
                <th style="border: 1px solid #0056b3; padding: 12px; min-width: 130px; font-weight: bold; background: #555;">Data Nasc</th>
                <th style="border: 1px solid #0056b3; padding: 12px; min-width: 80px; font-weight: bold; background: #555;">Sexo</th>
                <th style="border: 1px solid #0056b3; padding: 12px; min-width: 120px; font-weight: bold; background: #555;">RG</th>`;
    
    // Adicionar coluna para cada dia de aula
    diasAula.forEach(dia => {
        html += `<th style="border: 1px solid #0056b3; padding: 12px; min-width: 60px; text-align: center; font-weight: bold; background: #0056b3;">${dia}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // Adicionar linhas de alunos
    if (lista.presencas && lista.presencas.length > 0) {
        lista.presencas.forEach((presenca, index) => {
            // ⚡ Buscar aluno do dicionário em O(1) em vez de array.find()
            const alunoData = alunosPorId[presenca.alunoId];
            const rgAluno = alunoData ? (alunoData.rg || '-') : '-';
            const sexoAluno = alunoData ? (alunoData.sexo || '-') : '-';
            const dataNascAluno = alunoData ? (alunoData.dataNascimento || presenca.dataNascimento || '-') : (presenca.dataNascimento || '-');
            
            // Formatar data para padrão brasileiro DD/MM/AAAA
            let dataNascFormatada = '-';
            if (dataNascAluno && dataNascAluno !== '-') {
                try {
                    const data = new Date(dataNascAluno);
                    dataNascFormatada = data.toLocaleDateString('pt-BR');
                } catch (e) {
                    dataNascFormatada = dataNascAluno;
                }
            }
            
            html += `<tr style="border-bottom: 1px solid #ddd;">
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center; background: #f0f0f0; font-weight: bold; font-size: 1rem;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 12px; font-weight: 500;">${presenca.alunoNome}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: #555; font-size: 0.9rem;">${dataNascFormatada}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: #555; font-size: 0.9rem;">${sexoAluno}</td>
                <td style="border: 1px solid #ddd; padding: 12px; color: #555; font-size: 0.9rem;">${rgAluno}</td>`;
            
            // Adicionar célula P/F para cada dia
            diasAula.forEach(dia => {
                const status = obterStatusAlunoDiaTabela(chamadaEmEdicao, dia, presenca.alunoId);
                let corFundo = '#f5f5f5';
                let corTexto = '#666';
                
                if (status === 'P') {
                    corFundo = '#c8e6c9';
                    corTexto = '#2e7d32';
                } else if (status === 'F') {
                    corFundo = '#ffcdd2';
                    corTexto = '#c62828';
                }

                html += `<td style="border: 1px solid #ddd; padding: 12px; text-align: center; background: ${corFundo};">
                    <select id="presenca_${presenca.alunoId}_${dia}" 
                            onchange="atualizarPresencaDia(${presenca.alunoId}, ${dia}, this.value)" 
                            style="width: 55px; padding: 8px; border: 2px solid #999; border-radius: 4px; cursor: pointer; font-weight: bold; color: ${corTexto}; background: ${corFundo}; font-size: 1rem;">
                        <option value="S" ${status === 'S' ? 'selected' : ''}>S</option>
                        <option value="P" ${status === 'P' ? 'selected' : ''}>P</option>
                        <option value="F" ${status === 'F' ? 'selected' : ''}>F</option>
                    </select>
                </td>`;
            });
            
            html += `</tr>`;
        });
    }
    
    html += `</tbody></table></div>
    
    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button type="button" class="secondary" onclick="fecharModal('modalEditarChamada')">Cancelar</button>
        <button type="button" class="success" onclick="salvarChamadaEditada()" style="padding: 10px 20px; font-size: 1rem;">✓ Salvar Alterações</button>
    </div>`;
    
    document.getElementById('conteudoChamada').innerHTML = html;
    document.getElementById('modalEditarChamada').classList.add('show');
    
    console.timeEnd('⏱️ editarChamada');
}

// Atualizar presença de aluno em um dia específico
function atualizarPresencaDia(alunoId, dia, status) {
    const alunoInfo = (chamadaEmEdicao.presencas || []).find(p => Number(p.alunoId) === Number(alunoId));
    salvarStatusAlunoDia(
        chamadaEmEdicao,
        dia,
        alunoId,
        alunoInfo?.alunoNome || alunoInfo?.nome || '',
        status
    );
    
    // Atualizar cor de fundo do select
    const select = document.getElementById(`presenca_${alunoId}_${dia}`);
    if (select) {
        let corFundo = '#f5f5f5';
        let corTexto = '#666';
        
        if (status === 'P') {
            corFundo = '#c8e6c9';
            corTexto = '#2e7d32';
        } else if (status === 'F') {
            corFundo = '#ffcdd2';
            corTexto = '#c62828';
        }
        select.style.background = corFundo;
        select.style.color = corTexto;
    }
}

async function salvarChamadaEditada() {
    normalizarChamadasParaProfessor(chamadaEmEdicao);
    atualizarDiasSalvosLista(chamadaEmEdicao);
    
    await DataManager.saveLista(chamadaEmEdicao);
    
    window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { listaId: chamadaEmEdicao.id } }));
    fecharModal('modalEditarChamada');
    await recarregarChamadas();
    mostrarAlerta('Chamada atualizada!', 'success');
}

async function deletarChamada(listaId) {
    if (confirm('Deletar esta chamada?')) {
        await DataManager.deleteLista(listaId);
        window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { listaId: listaId, deleted: true } }));
        await recarregarChamadas();
        mostrarAlerta('Chamada deletada!', 'success');
    }
}

// Função para abrir modal de criar nova chamada
function abrirModalNovaChamada() {
    document.getElementById('modalChamadaTitulo').textContent = 'Criar Nova Chamada';
    document.getElementById('selectModalidadeChamada').value = '';
    document.getElementById('selectTurmaChamada').value = '';
    document.getElementById('selectMesChamada').value = '';
    document.getElementById('selectAnoChamada').value = new Date().getFullYear();
    document.getElementById('inputNomeChamada').value = '';
    atualizarHorariosModal();
    document.getElementById('modalNovaChamada').classList.add('show');
}

// Atualizar horários quando modalidade é selecionada
function atualizarHorariosModal() {
    const modalidade = document.getElementById('selectModalidadeChamada').value;
    const selectTurma = document.getElementById('selectTurmaChamada');
    
    selectTurma.innerHTML = '<option value="">-- Selecione o Horário --</option>';
    
    if (!modalidade) return;
    
    // Validar que modalidade existe
    if (!diasPorModalidade[modalidade]) {
        console.error(`❌ ERRO: Modalidade "${modalidade}" não encontrada!`);
        selectTurma.innerHTML = '<option value="">❌ Modalidade inválida</option>';
        return;
    }
    
    // Coletar todos os horários e ordenar
    const horariosSet = new Set();
    Object.values(CRONOGRAMA).forEach(bloco => {
        if (bloco.modalidades[modalidade]) {
            bloco.modalidades[modalidade].horarios.forEach(horario => {
                // Apenas adiciona horários que têm o prefixo "Manhã -" ou "Tarde -"
                if (horario.includes('Manhã -') || horario.includes('Tarde -')) {
                    horariosSet.add(horario);
                }
            });
        }
    });
    
    // Ordenar horários: Manhã primeiro, depois Tarde, e dentro de cada um por hora numérica
    const horariosOrdenados = Array.from(horariosSet).sort((a, b) => {
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
    
    horariosOrdenados.forEach(horario => {
        const opt = document.createElement('option');
        opt.value = horario;
        opt.textContent = horario;
        selectTurma.appendChild(opt);
    });
}

async function salvarNovaChamada(event) {
    event.preventDefault();
    
    const modalidade = document.getElementById('selectModalidadeChamada').value;
    const turma = document.getElementById('selectTurmaChamada').value;
    const mes = document.getElementById('selectMesChamada').value;
    const ano = document.getElementById('selectAnoChamada').value;
    const nome = document.getElementById('inputNomeChamada').value;
    
    if (!modalidade || !turma || !mes || !ano || !nome) {
        mostrarAlerta('Por favor, preencha todos os campos!', 'danger');
        return;
    }
    
    // Verificar se já existe chamada com mesma modalidade + turma + mes + ano
    const listas = await DataManager.getListas();
    const existe = listas.some(l => 
        l.modalidade === modalidade && 
        l.turma === turma && 
        l.mes === mes && 
        l.ano === ano
    );
    
    if (existe) {
        mostrarAlerta('Já existe uma chamada para esta combinacao de modalidade, horário, mês e ano!', 'danger');
        return;
    }
    
    // BUSCAR ALUNOS QUE ESTÃO NESSA MODALIDADE E TURMA
    const alunos = await DataManager.getAlunos();
    const alunosDaModalidade = alunos.filter(aluno => 
        aluno.modalidade === modalidade && 
        aluno.turma === turma &&
        aluno.ativo !== false // Apenas alunos ativos
    );
    
    // Mapear alunos para presencas
    const presencas = alunosDaModalidade.map(aluno => ({
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        dataNascimento: aluno.dataNascimento || '-'
    }));
    
    // Criar nova chamada COM OS ALUNOS
    const novaLista = {
        id: Date.now(),
        modalidade: modalidade,
        turma: turma,
        mes: mes,
        ano: ano,
        nome: nome,
        presencas: presencas,
        chamadas: {},
        salva: false
    };
    
    await DataManager.saveLista(novaLista);
    window.dispatchEvent(new CustomEvent('listasAtualizadas', { detail: { listaId: novaLista.id, novo: true } }));
    
    fecharModal('modalNovaChamada');
    await recarregarChamadas();
    
    // Mensagem informativa
    const msgAlunos = presencas.length === 0 
        ? '(Nenhum aluno encontrado para esta turma)' 
        : `(${presencas.length} alunos adicionados)`;
    mostrarAlerta(`Chamada criada com sucesso! ${msgAlunos}`, 'success');
}

// ============================================================
// 3. DASHBOARD
// ============================================================

async function inicializarDashboard() {
    const mesesNomes = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dashMesSelect = document.getElementById('dashMes');
    while (dashMesSelect.options.length > 1) dashMesSelect.remove(1);
    
    mesesNomes.forEach((mes, i) => {
        if (i > 0) {
            const opt = document.createElement('option');
            opt.value = String(i).padStart(2, '0');
            opt.textContent = mes;
            dashMesSelect.appendChild(opt);
        }
    });
    
    const dashModalidadeSelect = document.getElementById('dashModalidade');
    while (dashModalidadeSelect.options.length > 1) dashModalidadeSelect.remove(1);
    
    const modalidades = ['judo', 'futebol', 'vela', 'canoagem-velocidade', 'canoagem-turismo'];
    const nomes = ['Judô', 'Futebol', 'Vela', 'Canoagem Velocidade', 'Canoagem Turismo'];
    
    modalidades.forEach((mod, i) => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.textContent = nomes[i];
        dashModalidadeSelect.appendChild(opt);
    });
    
    await atualizarDashboard();
}

async function atualizarDashboard() {
    const alunos = await DataManager.getAlunos();
    const listas = await DataManager.getListas();
    
    const meshDashboard = document.getElementById('dashMes')?.value || '';
    const modalidadeDashboard = document.getElementById('dashModalidade')?.value || '';
    
    let alunosFiltrados = alunos;
    if (modalidadeDashboard) alunosFiltrados = alunosFiltrados.filter(a => a.modalidade === modalidadeDashboard);
    document.getElementById('dashTotalAlunos').textContent = alunosFiltrados.length;
    
    let alunosAtivos = alunosFiltrados;
    if (meshDashboard) {
        const hoje = new Date();
        const mes = parseInt(meshDashboard) || hoje.getMonth() + 1;
        const ano = hoje.getFullYear();
        const primeiroDia = new Date(ano, mes - 1, 1);
        const ultimoDia = new Date(ano, mes, 0);
        const primeiroDiaStr = primeiroDia.toISOString().split('T')[0];
        const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];
        
        alunosAtivos = alunosFiltrados.filter(a => 
            a.data_entrada <= ultimoDiaStr && 
            (!a.data_saida || a.data_saida >= primeiroDiaStr)
        );
    }
    document.getElementById('dashAlunosAtivos').textContent = alunosAtivos.length;
    
    let totalPresentes = 0, totalChamadas = 0;
    listas.forEach(lista => {
        if (modalidadeDashboard && lista.modalidade !== modalidadeDashboard) return;
        if (meshDashboard && lista.mes !== meshDashboard) return;
        
        Object.values(lista.chamadas || {}).forEach(chamadaDia => {
            if (Array.isArray(chamadaDia)) {
                chamadaDia.forEach(item => {
                    const statusSel = statusParaSelect(item.status);
                    if (statusSel === 'S') return;
                    totalChamadas++;
                    if (statusSel === 'P') totalPresentes++;
                });
            } else if (chamadaDia && typeof chamadaDia === 'object') {
                Object.entries(chamadaDia).forEach(([_, st]) => {
                    const statusSel = statusParaSelect(st);
                    if (statusSel === 'S') return;
                    totalChamadas++;
                    if (statusSel === 'P') totalPresentes++;
                });
            }
        });
    });
    
    const frequenciaMedia = totalChamadas > 0 ? Math.round((totalPresentes / totalChamadas) * 100) : 0;
    document.getElementById('dashFrequenciaMedia').textContent = frequenciaMedia + '%';
    document.getElementById('dashChamadasTotal').textContent = listas.length;
    
    const ranking = {};
    alunosAtivos.forEach(aluno => {
        ranking[aluno.id] = { nome: aluno.nome, presentes: 0, faltas: 0 };
    });
    
    listas.forEach(lista => {
        if (modalidadeDashboard && lista.modalidade !== modalidadeDashboard) return;
        if (meshDashboard && lista.mes !== meshDashboard) return;
        
        Object.values(lista.chamadas || {}).forEach(chamadaDia => {
            if (Array.isArray(chamadaDia)) {
                chamadaDia.forEach(item => {
                    const statusSel = statusParaSelect(item.status);
                    if (statusSel === 'S') return;
                    if (ranking[item.alunoId]) {
                        if (statusSel === 'P') ranking[item.alunoId].presentes++;
                        else if (statusSel === 'F') ranking[item.alunoId].faltas++;
                    }
                });
            } else if (chamadaDia && typeof chamadaDia === 'object') {
                Object.entries(chamadaDia).forEach(([alunoId, st]) => {
                    const statusSel = statusParaSelect(st);
                    if (statusSel === 'S') return;
                    if (ranking[alunoId]) {
                        if (statusSel === 'P') ranking[alunoId].presentes++;
                        else if (statusSel === 'F') ranking[alunoId].faltas++;
                    }
                });
            }
        });
    });
    
    const rankingArray = Object.values(ranking)
        .map(r => ({ ...r, taxa: r.presentes + r.faltas > 0 ? Math.round((r.presentes / (r.presentes + r.faltas)) * 100) : 0 }))
        .sort((a, b) => b.taxa - a.taxa)
        .slice(0, 10);
    
    let htmlRanking = '';
    rankingArray.forEach((item, i) => {
        htmlRanking += `<tr><td>${i + 1}</td><td>${item.nome}</td><td>${item.presentes}</td><td>${item.faltas}</td><td>${item.taxa}%</td></tr>`;
    });
    
    document.getElementById('rankingPresenca').innerHTML = htmlRanking || '<tr><td colspan="5" style="text-align: center; color: #999;">Sem dados</td></tr>';
    
    const professorChamadas = {};
    listas.forEach(lista => {
        const key = `${lista.modalidade} - ${lista.turma}`;
        if (!professorChamadas[key]) {
            professorChamadas[key] = { modalidade: lista.modalidade, turma: lista.turma, total: 0, ultima: '' };
        }
        professorChamadas[key].total++;
        professorChamadas[key].ultima = lista.nome;
    });
    
    const profArray = Object.values(professorChamadas)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    let htmlProf = '';
    profArray.forEach(prof => {
        htmlProf += `<tr><td>${prof.modalidade}</td><td>${prof.turma}</td><td>${prof.total}</td><td>${prof.ultima}</td></tr>`;
    });
    
    document.getElementById('professoresChamadas').innerHTML = htmlProf || '<tr><td colspan="4" style="text-align: center; color: #999;">Sem dados</td></tr>';
}

// ============================================================
// UTILITÁRIOS
// ============================================================

async function abrirAba(aba, el) {
    // Remover ativas de todas as abas e itens da sidebar
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    
    // Ativar aba correta
    const tabElement = document.getElementById(`tab-${aba}`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Ativar item da sidebar corretamente
    if (el) {
        el.classList.add('active');
    } else {
        // Fallback: ativar pelo texto
        document.querySelectorAll('.sidebar-item').forEach(item => {
            if (item.textContent.toLowerCase().includes(aba)) item.classList.add('active');
        });
    }
    
    const titulos = { 'usuarios': 'Gerenciar Usuarios', 'chamadas': 'Gerenciar Chamadas', 'dashboard': 'Dashboard' };
    document.getElementById('tabTitulo').textContent = titulos[aba];
    
    if (aba === 'usuarios') await recarregarUsuarios();
    if (aba === 'chamadas') await inicializarFiltrosChamadas();
    if (aba === 'dashboard') await inicializarDashboard();
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function mostrarAlerta(mensagem, tipo) {
    const alertDiv = document.getElementById('alert');
    alertDiv.className = `alert ${tipo}`;
    alertDiv.textContent = mensagem;
    alertDiv.style.display = 'block';
    setTimeout(() => { alertDiv.style.display = 'none'; }, 3000);
}

document.addEventListener('click', function(event) {
    const modais = document.querySelectorAll('.modal');
    modais.forEach(modal => {
        if (event.target === modal) modal.classList.remove('show');
    });
});

window.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacaoAdmin();
    inicializarAdmin();
});

window.addEventListener('listasAtualizadas', async function() {
    const dashAtivo = document.getElementById('tab-dashboard')?.classList.contains('active');
    const chamadasAtiva = document.getElementById('tab-chamadas')?.classList.contains('active');
    if (dashAtivo) await atualizarDashboard();
    if (chamadasAtiva) await recarregarChamadas();
});

// Listener para evento customizado de usuarios atualizados
window.addEventListener('usuariosAtualizados', async function(e) {
    console.log('Usuarios atualizados, recarregando tabela...', e.detail);
    
    // Recarregar se estiver na aba de usuarios
    if (document.getElementById('tab-usuarios')?.classList.contains('active')) {
        await recarregarUsuarios();
        atualizarEstatisticas();
    }
});

// Funcoes de monitoramento de usuarios
function iniciarMonitoragemUsuarios() {
    const tabUsuarios = document.getElementById('tab-usuarios');
    
    // Parar intervalo anterior se existir
    if (intervaloRecarregaUsuarios) {
        clearInterval(intervaloRecarregaUsuarios);
    }
    
    // Iniciar novo intervalo que recarrega a cada segundo se tab usuarios estiver ativa
    intervaloRecarregaUsuarios = setInterval(async () => {
        const tabUsuariosAtiva = document.getElementById('tab-usuarios')?.classList.contains('active');
        if (tabUsuariosAtiva) {
            // Sempre recarrega para garantir sincronizacao (ja atualiza estatisticas)
            await recarregarUsuarios();
            // Extra: garante que estatisticas estao atualizadas
            atualizarEstatisticas();
        }
    }, 5000); // Aumentado para 5s para não sobrecarregar o banco
}

function pararMonitoragemUsuarios() {
    if (intervaloRecarregaUsuarios) {
        clearInterval(intervaloRecarregaUsuarios);
        intervaloRecarregaUsuarios = null;
    }
}
