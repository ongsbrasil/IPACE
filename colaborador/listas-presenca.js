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
function gerarDatasAulasListas(mes, ano, modalidade) {
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const modalidadeNormalizada = normalizarModalidade(modalidade);
    const diasDaModalidade = diasPorModalidade[modalidadeNormalizada] || ['Terça', 'Sexta'];
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

function calcularIdade(dataNasc) {
    if (!dataNasc) return '-';
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

// Função para calcular dias no mês
function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

// Horários por modalidade
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

// Função para gerar automaticamente listas de presença para cada turma/modalidade/mês a partir de 2026
async function gerarListasAutomaticamente() {
    if (typeof gerarListasAutomaticamenteSincronizado === 'function') {
        await gerarListasAutomaticamenteSincronizado();
    }
    
    const listasExistentes = await DataManager.getListas();
    console.log('Listas geradas/atualizadas. Total de listas:', listasExistentes.length);
}

// Função para remover listas duplicadas (Mantida para compatibilidade com LocalStorage legado)
function removerListasDuplicadas(listas) {
    const mapa = {};
    const listasFinal = [];
    
    listas.forEach(lista => {
        const chave = `${lista.mes}||${lista.ano}||${lista.modalidade}||${lista.turma}`;
        
        if (!mapa[chave]) {
            mapa[chave] = lista;
            listasFinal.push(lista);
        } else {
            const listaExistente = mapa[chave];
            const temDadosExistente = listaExistente.chamadas && Object.keys(listaExistente.chamadas).length > 0;
            const temDadosNova = lista.chamadas && Object.keys(lista.chamadas).length > 0;
            
            if (temDadosNova && !temDadosExistente) {
                const index = listasFinal.findIndex(l => l.id === listaExistente.id);
                if (index !== -1) {
                    listasFinal[index] = lista;
                    mapa[chave] = lista;
                }
            }
        }
    });
    
    return listasFinal;
}

// Exibir listas criadas com filtro, só mostra após filtrar
async function exibirListas(filtros = null) {
    let listas = await DataManager.getListas();
    console.log('=== EXIBIR LISTAS ===');
    console.log('Listas totais encontradas:', listas.length);
    
    const modalidadeNomes = {
        'canoagem-velocidade': 'Canoagem Velocidade',
        'canoagem-turismo': 'Canoagem Turismo',
        'vela': 'Vela',
        'futebol': 'Futebol',
        'judo': 'Judô'
    };
    
    // Aplicar filtros EXATOS
    if (filtros && filtros.mes && filtros.mes !== '') {
        const mesFormatado = String(filtros.mes).padStart(2, '0');
        listas = listas.filter(l => l.mes === mesFormatado);
    }
    if (filtros && filtros.ano && filtros.ano !== '') {
        listas = listas.filter(l => Number(l.ano) === Number(filtros.ano));
    }
    if (filtros && filtros.modalidade && filtros.modalidade !== '') {
        listas = listas.filter(l => l.modalidade === filtros.modalidade);
    }
    if (filtros && filtros.turma && filtros.turma !== "") {
        listas = listas.filter(l => l.turma === filtros.turma);
    }
    
    let html = '';
    if (listas.length === 0) {
        const filtrosAplicados = [];
        if (filtros && filtros.mes) filtrosAplicados.push(`Mês: ${Object.values({
            '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
            '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
            '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
        })[filtros.mes] || filtros.mes}`);
        if (filtros && filtros.ano) filtrosAplicados.push(`Ano: ${filtros.ano}`);
        if (filtros && filtros.modalidade) filtrosAplicados.push(`Modalidade: ${filtros.modalidade}`);
        if (filtros && filtros.turma) filtrosAplicados.push(`Horário: ${filtros.turma}`);
        const mensagem = filtrosAplicados.length > 0 
            ? `Nenhuma lista encontrada com os filtros: ${filtrosAplicados.join(', ')}`
            : 'Nenhuma lista encontrada';
        html = `<p style="text-align: center; color: #666;">${mensagem}</p>`;
    } else {
        listas.slice().reverse().forEach(lista => {
            const diasNoMes = daysInMonth(parseInt(lista.mes), lista.ano);
            html += `<h3>${lista.nome} - ${modalidadeNomes[lista.modalidade]} - ${lista.turma}</h3>`;
            html += gerarTabelaListaPresenca(lista.presencas, diasNoMes, lista);
            html += `
                <div style="margin: 10px 0; display: flex; gap: 10px;">
                    <button class="btn" onclick="baixarPlanilha(${lista.id})" style="padding: 6px 12px; font-size: 0.85rem; background-color: #008000; color: white;">✓ Baixar Planilha</button>
                    <button class="btn" onclick="editarLista(${lista.id})" style="padding: 6px 12px; font-size: 0.85rem; background-color: #ff9900; color: white;">✎ Editar</button>
                    <button class="btn" onclick="excluirLista(${lista.id})" style="padding: 6px 12px; font-size: 0.85rem; background-color: #dc3545; color: white;">🗑 Excluir</button>
                </div>
            `;
        });
    }
    document.getElementById('listasPresenca').innerHTML = html;
}

// Função para gerar tabela de presença
function gerarTabelaListaPresenca(dadosAlunos, diasNoMes, listaInfo = null) {
    if (!dadosAlunos) return '<p>Sem dados de alunos</p>';
    
    let html = `<table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <thead>
            <tr>
                <th>Data Nasc</th>
                <th>RG</th>
                <th>Idade</th>
                <th>G?</th>
                <th>PcD?</th>
                <th>Nome</th>
                <th colspan="${diasNoMes}">Dias do Mês</th>
                <th>Total Presente</th>
                <th>Assinatura</th>
            </tr>
            <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>`;
    for (let i = 1; i <= diasNoMes; i++) {
        html += `<th>${i}</th>`;
    }
    html += `<th></th>
                <th></th>
            </tr>
        </thead>
        <tbody>`;
    
    dadosAlunos.forEach(aluno => {
        html += `<tr>
            <td>${aluno.dataNascimento || ''}</td>
            <td>${aluno.rg || '-'}</td>
            <td>${aluno.idade || ''}</td>
            <td>${aluno.gravida ? 'Sim' : 'Não'}</td>
            <td>${aluno.pcd ? 'Sim' : 'Não'}</td>
            <td>${aluno.alunoNome}</td>`;
        
        let presentesTotal = 0;
        for (let i = 1; i <= diasNoMes; i++) {
            let celula = '';
            
            // Procurar em chamadas se existe uma data com esse dia
            if (listaInfo && listaInfo.chamadas) {
                for (const [dataSalva, presencas] of Object.entries(listaInfo.chamadas)) {
                    // Extrair dia da data (ex: "06/01/2026" -> 6)
                    const partesData = dataSalva.split('/');
                    const diaData = parseInt(partesData[0]);
                    
                    if (diaData === i) {
                        // Procurar status deste aluno nesta data
                        const presencaAluno = presencas.find(p => (p.alunoId === aluno.alunoId || p.alunoId === aluno.id));
                        if (presencaAluno && presencaAluno.status) {
                            const marcacao = presencaAluno.status === 'presente' ? 'P' : 'F';
                            celula = marcacao;
                            if (presencaAluno.status === 'presente') presentesTotal++;
                        }
                        break;
                    }
                }
            }
            
            html += `<td>${celula}</td>`;
        }
        html += `<td>${presentesTotal}</td>
            <td class="assinatura"></td>
        </tr>`;
    });
    html += `</tbody>
    </table>`;
    return html;
}

// Função para baixar planilha
async function baixarPlanilha(listaId) {
    const listas = await DataManager.getListas();
    const lista = listas.find(l => l.id === listaId);
    if (!lista) {
        alert('Lista não encontrada!');
        return;
    }
    
    const diasNoMes = daysInMonth(parseInt(lista.mes), lista.ano);
    const html = gerarHTMLListaPresenca(lista, lista.modalidade, diasNoMes, lista.presencas, {});
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista_${lista.nome.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Função para editar lista
async function editarLista(listaId) {
    const listas = await DataManager.getListas();
    const lista = listas.find(l => l.id === listaId);
    if (!lista) {
        alert('Lista não encontrada!');
        return;
    }
    alert('Funcionalidade de edição em desenvolvimento para: ' + lista.nome);
}

// Criar filtro para listas de presença com layout de formulário e select dinâmico de horário
function criarFiltroListas() {
    const container = document.getElementById('filtroListasPresenca');
    if (!container) return;
    const mesesNomes = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    let html = '<form id="formFiltroListas" class="form-group" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;">';
    // Meses: Janeiro, Fevereiro, ... Dezembro
    html += '<div class="form-group"><label for="filtroMes">Mês:</label><select id="filtroMes" class="input-form"><option value="">Todos</option>';
    ['01','02','03','04','05','06','07','08','09','10','11','12'].forEach(m => {
        html += `<option value="${m}">${mesesNomes[m]}</option>`;
    });
    html += '</select></div>';
    // Anos: 2026-2030
    html += '<div class="form-group"><label for="filtroAno">Ano:</label><select id="filtroAno" class="input-form"><option value="">Todos</option>';
    for(let y=2026; y<=2030; y++) html += `<option value="${y}">${y}</option>`;
    html += '</select></div>';
    html += '<div class="form-group"><label for="filtroModalidade">Modalidade:</label><select id="filtroModalidade" class="input-form"><option value="">Todas</option>';
    html += '<option value="judo">Judô</option><option value="canoagem-velocidade">Canoagem Velocidade</option><option value="canoagem-turismo">Canoagem Turismo</option><option value="vela">Vela</option><option value="futebol">Futebol</option>';
    html += '</select></div>';
    html += '<div class="form-group"><label for="filtroTurma">Horário:</label><select id="filtroTurma" class="input-form"><option value="">Todos</option></select></div>';
    html += '<div class="form-group" style="align-self: flex-end;"><button type="submit" class="btn">Filtrar</button></div>';
    html += '</form>';
    container.innerHTML = html;

    // Atualizar horários ao mudar modalidade
    document.getElementById('filtroModalidade').onchange = function() {
        const modalidade = this.value;
        const selectHorario = document.getElementById('filtroTurma');
        selectHorario.innerHTML = '<option value="">Todos</option>';
        if (!modalidade) return;
        // Pega horários EXATAMENTE como no cadastro de aluno
        const horarios = horariosPorModalidade[modalidade] || [];
        // Ordenar os horários: Manhã primeiro, depois Tarde, e dentro de cada um por hora numérica
        const horariosOrdenados = [...horarios].sort((a, b) => {
            const ehManhãA = a.includes('Manhã');
            const ehManhãB = b.includes('Manhã');
            
            // Se um é Manhã e outro é Tarde, Manhã vem primeiro
            if (ehManhãA && !ehManhãB) return -1;
            if (!ehManhãA && ehManhãB) return 1;
            
            // Extrair a hora numérica (ex: "9" de "Manhã - 9h às 10:30h")
            const horaA = parseInt(a.match(/(\d+)h/)?.[1] || '0');
            const horaB = parseInt(b.match(/(\d+)h/)?.[1] || '0');
            
            return horaA - horaB;
        });
        horariosOrdenados.forEach(horario => {
            const opt = document.createElement('option');
            opt.value = horario;
            opt.textContent = horario;
            selectHorario.appendChild(opt);
        });
    };

    document.getElementById('formFiltroListas').onsubmit = function(e) {
        e.preventDefault();
        aplicarFiltroListas();
    };
    
    // Aplicar filtro ao mudar qualquer campo
    ['filtroMes', 'filtroAno', 'filtroModalidade', 'filtroTurma'].forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener('change', aplicarFiltroListas);
        }
    });
}

function aplicarFiltroListas() {
    // Pegar valores dos filtros
    const mesValue = document.getElementById('filtroMes').value;
    const anoValue = document.getElementById('filtroAno').value;
    const modalidadeValue = document.getElementById('filtroModalidade').value;
    const turmaValue = document.getElementById('filtroTurma').value;
    
    // Validar se pelo menos um filtro foi preenchido
    if (!mesValue && !anoValue && !modalidadeValue && !turmaValue) {
        document.getElementById('listasPresenca').innerHTML = '<p style="text-align: center; color: #999; padding: 40px; font-size: 1rem;">Selecione ao menos um filtro para visualizar as listas</p>';
        return;
    }
    
    const filtros = {
        mes: mesValue,
        ano: anoValue,
        modalidade: modalidadeValue,
        turma: turmaValue
    };
    exibirListas(filtros);
}

async function verDetalhes(listaId) {
    const listas = await DataManager.getListas();
    const lista = listas.find(l => l.id === listaId);
    
    if (!lista) {
        alert('Lista não encontrada!');
        return;
    }
    
    // Criar modal ou nova janela para detalhes
    const detalhesWindow = window.open('', '_blank', 'width=800,height=600');
    detalhesWindow.document.write(`
        <html>
        <head>
            <title>Detalhes da Lista - ${lista.nome}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .presente { background-color: #d4edda; }
                .ausente { background-color: #f8d7da; }
                .pendente { background-color: #fff3cd; }
            </style>
        </head>
        <body>
            <h1>Detalhes da Lista: ${lista.nome}</h1>
            <p><strong>Modalidade:</strong> ${lista.modalidade}</p>
            <p><strong>Turma:</strong> ${lista.turma}</p>
            <p><strong>Mês/Ano:</strong> ${lista.mes}/${lista.ano}</p>
            <table>
                <thead>
                    <tr>
                        <th>Nome do Aluno</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="detalhesPresenca">
                </tbody>
            </table>
            <script>
                function atualizarStatus(alunoId, status) {
                    // Aqui você pode implementar a lógica para atualizar o status
                    alert('Status atualizado para: ' + status);
                }
                
                // Simular dados
                const presencas = ${JSON.stringify(lista.presencas)};
                const tbody = document.getElementById('detalhesPresenca');
                presencas.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.className = p.status === 'presente' ? 'presente' : p.status === 'ausente' ? 'ausente' : 'pendente';
                    tr.innerHTML = \`
                        <td>\${p.alunoNome}</td>
                        <td>\${p.status || 'Pendente'}</td>
                        <td>
                            <button onclick="atualizarStatus(\${p.alunoId}, 'presente')">Presente</button>
                            <button onclick="atualizarStatus(\${p.alunoId}, 'ausente')">Ausente</button>
                        </td>
                    \`;
                    tbody.appendChild(tr);
                });
            </script>
        </body>
        </html>
    `);
}

async function excluirLista(id) {
    if (confirm('Tem certeza que deseja excluir esta lista?')) {
        await DataManager.deleteLista(id);
        exibirListas();
    }
}

function gerarHTMLListaPresenca(lista, modalidadeNome, diasNoMes, dadosAlunos, resumo) {
    const modalidadeNomes = {
        'canoagem-velocidade': 'Canoagem Velocidade',
        'canoagem-turismo': 'Canoagem Turismo',
        'vela': 'Vela',
        'futebol': 'Futebol',
        'judo': 'Judô'
    };
    
    // Extrair o dia da data (ex: "06/01/2026" -> 6)
    let diaMarcado = null;
    if (lista && lista.dia) {
        const partesData = lista.dia.split('/');
        diaMarcado = parseInt(partesData[0]);
    }
    
    let html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Lista de Presença - ${lista.nome}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: center; }
                th { background-color: #f0f0f0; }
                .assinatura { margin-top: 50px; border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Lista de Presença</h1>
                <h2>${modalidadeNomes[lista.modalidade]}</h2>
                <h3>${lista.nome} - ${lista.turma}</h3>
                <p>Data da Aula: ${lista.dia || 'Não definida'}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Data Nasc</th>
                        <th>Sexo</th>
                        <th>RG</th>
                        <th>Idade</th>
                        <th>G?</th>
                        <th>PcD?</th>
                        <th>Nome</th>
                        <th colspan="${diasNoMes}">Dias do Mês</th>
                        <th>Total Presente</th>
                        <th>Assinatura</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>`;
    
    for (let i = 1; i <= diasNoMes; i++) {
        html += `<th>${i}</th>`;
    }
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Para gerar o HTML, precisamos dos dados completos dos alunos
    // Como dadosAlunos já vem com tudo (presencas), usamos ele
    dadosAlunos.forEach(aluno => {
        html += `<tr>
            <td>${aluno.dataNascimento || ''}</td>
            <td>${aluno.sexo || '-'}</td>
            <td>${aluno.rg || '-'}</td>
            <td>${aluno.idade || ''}</td>
            <td>${aluno.gravida ? 'Sim' : 'Não'}</td>
            <td>${aluno.pcd ? 'Sim' : 'Não'}</td>
            <td>${aluno.alunoNome}</td>`;
        
        let presentesTotal = 0;
        for (let i = 1; i <= diasNoMes; i++) {
            let celula = '';
            
            // Procurar em chamadas se existe uma data com esse dia
            if (lista && lista.chamadas) {
                for (const [dataSalva, presencas] of Object.entries(lista.chamadas)) {
                    // Extrair dia da data (ex: "06/01/2026" -> 6)
                    const partesData = dataSalva.split('/');
                    const diaData = parseInt(partesData[0]);
                    
                    if (diaData === i) {
                        // Procurar status deste aluno nesta data
                        const presencaAluno = presencas.find(p => (p.alunoId === aluno.alunoId || p.alunoId === aluno.id));
                        if (presencaAluno && presencaAluno.status) {
                            const marcacao = presencaAluno.status === 'presente' ? 'P' : 'F';
                            celula = marcacao;
                            if (presencaAluno.status === 'presente') presentesTotal++;
                        }
                        break;
                    }
                }
            }
            
            html += `<td>${celula}</td>`;
        }
        html += `<td>${presentesTotal}</td><td class="assinatura"></td></tr>`;
    });
    
    html += `
                </tbody>
            </table>
            
            <div style="margin-top: 50px;">
                <p><strong>Resumo:</strong></p>
                <p>Total de alunos: ${dadosAlunos.length}</p>
            </div>
        </body>
        </html>
    `;
    
    return html;
}

// Inicializar
window.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    gerarListasAutomaticamente();
    criarFiltroListas();
    // Mostrar mensagem inicial
    document.getElementById('listasPresenca').innerHTML = '<p style="text-align: center; color: #999; padding: 40px; font-size: 1rem;">Selecione ao menos um filtro para visualizar as listas</p>';
});

// Listener para sincronização de alunos
window.addEventListener('alunosSincronizados', function() {
    console.log('✓ Evento alunosSincronizados recebido em listas-presenca');
    gerarListasAutomaticamente();
    criarFiltroListas();
});

// Listener para sincronização de listas
window.addEventListener('listasAtualizadas', function() {
    console.log('✓ Evento listasAtualizadas recebido em listas-presenca');
    gerarListasAutomaticamente();
    criarFiltroListas();
});

// Monitorar mudanças no localStorage (funciona entre abas)
// Com Supabase, isso não é necessário pois usamos eventos, mas mantemos para compatibilidade
let ultimasListas = JSON.stringify(localStorage.getItem('listas'));
setInterval(async function() {
    if (!DataManager.useSupabase) {
        const listasCheias = JSON.stringify(localStorage.getItem('listas'));
        if (listasCheias !== ultimasListas) {
            console.log('✓ Mudança detectada nas listas - atualizando...');
            ultimasListas = listasCheias;
            await gerarListasAutomaticamente();
            criarFiltroListas();
        }
    }
}, 2000);
