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

// Calcular idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return '-';
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

// Carregar turmas para busca
async function carregarTurmasBusca() {
    const modalidade = document.getElementById('modalidadeBusca').value;
    const alunos = await DataManager.getAlunos();
    const turmas = [...new Set(alunos.filter(a => a.modalidade === modalidade).map(a => a.turma))];

    let html = '<option value="">Todas as Turmas</option>';
    
    // Se não houver alunos cadastrados, mostrar horários padrão da modalidade
    if (turmas.length === 0 && modalidade) {
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
        const horarios = horariosPorModalidade[modalidade] || [];
        horarios.forEach(horario => {
            html += `<option value="${horario}">${horario}</option>`;
        });
    } else {
        turmas.forEach(turma => {
            html += `<option value="${turma}">${turma}</option>`;
        });
    }
    
    document.getElementById('turmaBusca').innerHTML = html;
}

// Exibir lista de alunos
async function exibirAlunos(alunosParaExibir) {
    const alunos = alunosParaExibir || await DataManager.getAlunos();
    
    // Atualizar contador total
    const todoosAlunos = await DataManager.getAlunos();
    document.getElementById('totalAlunos').textContent = todoosAlunos.length;
    
    // Atualizar contador de encontrados
    document.getElementById('alunosEncontrados').textContent = alunos.length;
    
    const modalidadeNomes = {
        'canoagem-velocidade': 'Canoagem Velocidade',
        'canoagem-turismo': 'Canoagem Turismo',
        'vela': 'Vela',
        'futebol': 'Futebol',
        'judo': 'Judô'
    };
    
    let html = '<table><thead><tr><th style="width: 40px;">#</th><th>Nome</th><th>Data Nascimento</th><th>Sexo</th><th>RG</th><th>G</th><th>PCD</th><th>Idade</th><th>Modalidade</th><th>Horário</th><th>Ações</th></tr></thead><tbody>';
    // Verificar duplicidade de IDs para debug
    const ids = alunos.map(a => a.id);
    const idsUnicos = new Set(ids);
    if (ids.length !== idsUnicos.size) {
        console.warn('⚠️ ALERTA: Existem alunos com IDs duplicados na lista! Isso pode causar erros na edição.');
        // Identificar duplicados
        const duplicados = ids.filter((item, index) => ids.indexOf(item) !== index);
        console.warn('IDs duplicados:', duplicados);
    }

    if (alunos.length === 0) {
        html += '<tr><td colspan="11" style="text-align: center;">Nenhum aluno encontrado</td></tr>';
    } else {
        alunos.forEach((aluno, index) => {
            // Compatibilidade com snake_case do Supabase
            const dataNasc = aluno.dataNascimento || aluno.data_nascimento;
            const idade = calcularIdade(dataNasc);
            
            // Usar aspas no ID para garantir que strings/UUIDs funcionem e evitar erros de sintaxe
            html += `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${index + 1}</td>
                    <td>${aluno.nome}</td>
                    <td>${dataNasc ? new Date(dataNasc).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>${aluno.sexo || '-'}</td>
                    <td>${aluno.rg || '-'}</td>
                    <td>${aluno.gravida || 'Não'}</td>
                    <td>${aluno.pcd || 'Não'}</td>
                    <td>${idade} anos</td>
                    <td>${modalidadeNomes[aluno.modalidade] || aluno.modalidade}</td>
                    <td>${aluno.turma}</td>
                    <td>
                        <button class="btn" onclick="editarAluno('${aluno.id}')" style="padding: 5px 10px; font-size: 0.9rem;">Editar</button>
                        <button class="btn btn-danger" onclick="excluirAluno('${aluno.id}')" style="padding: 5px 10px; font-size: 0.9rem;">Excluir</button>
                    </td>
                </tr>
            `;
        });
    }
    html += '</tbody></table>';
    document.getElementById('listaAlunos').innerHTML = html;
}

async function filtrarAlunos() {
    const nome = document.getElementById('nomeBusca').value.trim().toLowerCase();
    const modalidade = document.getElementById('modalidadeBusca').value;
    const turma = document.getElementById('turmaBusca').value;
    
    const alunos = await DataManager.getAlunos();
    
    let alunosFiltrados = alunos;
    
    // Filtrar por nome
    if (nome) {
        alunosFiltrados = alunosFiltrados.filter(a => 
            a.nome.toLowerCase().includes(nome)
        );
    }
    
    // Filtrar por modalidade
    if (modalidade) {
        alunosFiltrados = alunosFiltrados.filter(a => a.modalidade === modalidade);
    }
    
    // Filtrar por turma
    if (turma) {
        alunosFiltrados = alunosFiltrados.filter(a => a.turma === turma);
    }
    
    exibirAlunos(alunosFiltrados);
}

function limparFiltros() {
    document.getElementById('nomeBusca').value = '';
    document.getElementById('modalidadeBusca').value = '';
    document.getElementById('turmaBusca').innerHTML = '<option value="">Todas as Turmas</option>';
    exibirAlunos();
}

function editarAluno(id) {
    // Redirecionar para cadastro-aluno.html com parâmetro de edição
    window.location.href = `cadastro-aluno.html?edit=${id}`;
}

async function excluirAluno(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        await removerAluno(id);
        exibirAlunos();
    }
}

// Inicializar
window.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    exibirAlunos();
});

// Listener para sincronização de alunos
window.addEventListener('alunosSincronizados', function() {
    exibirAlunos();
});
