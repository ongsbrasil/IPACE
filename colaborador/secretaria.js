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
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade;
}

// Carregar turmas para pesquisa
async function carregarTurmasPesquisa() {
    const modalidade = document.getElementById('modalidadePesquisa').value;
    const alunos = await DataManager.getAlunos();
    const turmas = [...new Set(alunos.filter(a => a.modalidade === modalidade).map(a => a.turma))];

    let html = '<option value="">Selecione...</option>';

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

    document.getElementById('turmaPesquisa').innerHTML = html;
}

// Pesquisar aluno
document.getElementById('formPesquisa').addEventListener('submit', async function(e) {
    e.preventDefault();

    const rgValor = (document.getElementById('rgPesquisa').value || '').trim();
    const nome = document.getElementById('nomePesquisa').value.trim();
    const modalidade = document.getElementById('modalidadePesquisa').value;
    const turma = document.getElementById('turmaPesquisa').value;

    const alunos = await DataManager.getAlunos();
    const resultadoDiv = document.getElementById('resultadoPesquisa');

    // 1) Priorizar busca por RG se informado
    function normalizarRG(rg) { return (rg || '').replace(/\D/g, ''); }
    let alunoEncontrado = null;
    if (rgValor) {
        const alvo = normalizarRG(rgValor);
        alunoEncontrado = alunos.find(a => normalizarRG(a.rg) === alvo);
    }

    // 2) Fallback: buscar por nome + modalidade + turma
    if (!alunoEncontrado && nome) {
        alunoEncontrado = alunos.find(a =>
            a.nome.toLowerCase() === nome.toLowerCase() &&
            (!modalidade || a.modalidade === modalidade) &&
            (!turma || a.turma === turma)
        );
    }

    if (alunoEncontrado) {
        const modalidadeNomes = {
            'canoagem-velocidade': 'Canoagem Velocidade',
            'canoagem-turismo': 'Canoagem Turismo',
            'vela': 'Vela',
            'futebol': 'Futebol',
            'judo': 'Judô'
        };
        const idade = calcularIdade(alunoEncontrado.dataNascimento);
        // Preencher inputs principais
        document.getElementById('nomePesquisa').value = alunoEncontrado.nome;
        document.getElementById('dataNascInfo').value = new Date(alunoEncontrado.dataNascimento).toLocaleDateString('pt-BR');
        document.getElementById('sexoInfo').value = alunoEncontrado.sexo || '-';
        document.getElementById('idadeInfo').value = `${idade} anos`;
        const modalidadeInput = document.getElementById('modalidadePesquisa');
        const turmaInput = document.getElementById('turmaPesquisa');
        const modalidadeNomesDisplay = {
            'canoagem-velocidade': 'Canoagem Velocidade',
            'canoagem-turismo': 'Canoagem Turismo',
            'vela': 'Vela',
            'futebol': 'Futebol',
            'judo': 'Judô'
        };
        if (modalidadeInput) modalidadeInput.value = modalidadeNomesDisplay[alunoEncontrado.modalidade] || alunoEncontrado.modalidade;
        if (turmaInput) turmaInput.value = alunoEncontrado.turma;

        resultadoDiv.innerHTML = `
            <h3>Aluno Encontrado:</h3>
            <p><strong>Modalidade:</strong> ${modalidadeNomes[alunoEncontrado.modalidade]}</p>
        `;
    } else {
        resultadoDiv.innerHTML = '<p style="color: red;">Nenhum aluno encontrado com os critérios informados.</p>';
    }
});

// Busca por RG em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const rgInput = document.getElementById('rgPesquisa');
    const resultadoDiv = document.getElementById('resultadoPesquisa');
    if (!rgInput) return;

    function normalizarRG(rg) {
        return (rg || '').replace(/\D/g, '');
    }

    rgInput.addEventListener('input', async function() {
        const valor = rgInput.value.trim();
        if (valor.length < 1) {
            // Limpar tudo quando apagar o RG
            const nomeInput = document.getElementById('nomePesquisa');
            const dataNascInput = document.getElementById('dataNascInfo');
            const sexoInput = document.getElementById('sexoInfo');
            const idadeInput = document.getElementById('idadeInfo');
            const modalidadeInput = document.getElementById('modalidadePesquisa');
            const turmaInput = document.getElementById('turmaPesquisa');
            if (nomeInput) nomeInput.value = '';
            if (dataNascInput) dataNascInput.value = '';
            if (sexoInput) sexoInput.value = '';
            if (idadeInput) idadeInput.value = '';
            if (modalidadeInput) modalidadeInput.value = '';
            if (turmaInput) turmaInput.value = '';
            resultadoDiv.innerHTML = '';
            return;
        }
        
        const alunos = await DataManager.getAlunos();
        const alvo = normalizarRG(valor);
        const encontrado = alunos.find(a => normalizarRG(a.rg) === alvo);
        if (encontrado) {
            const modalidadeNomes = {
                'canoagem-velocidade': 'Canoagem Velocidade',
                'canoagem-turismo': 'Canoagem Turismo',
                'vela': 'Vela',
                'futebol': 'Futebol',
                'judo': 'Judô'
            };
            const idade = calcularIdade(encontrado.dataNascimento);
            // Preencher inputs
            const nomeInput = document.getElementById('nomePesquisa');
            const dataNascInput = document.getElementById('dataNascInfo');
            const sexoInput = document.getElementById('sexoInfo');
            const idadeInput = document.getElementById('idadeInfo');
            const modalidadeInput = document.getElementById('modalidadePesquisa');
            const turmaSelect = document.getElementById('turmaPesquisa');

            if (nomeInput) nomeInput.value = encontrado.nome;
            if (dataNascInput) dataNascInput.value = new Date(encontrado.dataNascimento).toLocaleDateString('pt-BR');
            if (sexoInput) sexoInput.value = encontrado.sexo || '-';
            if (idadeInput) idadeInput.value = `${idade} anos`;
            if (modalidadeInput) modalidadeInput.value = modalidadeNomes[encontrado.modalidade] || encontrado.modalidade;
            if (turmaInput) turmaInput.value = encontrado.turma;

            resultadoDiv.innerHTML = `
                <h3>Aluno Encontrado:</h3>
                <p><strong>Modalidade:</strong> ${modalidadeNomes[encontrado.modalidade]}</p>
            `;
        } else {
            // Limpar inputs
            const nomeInput = document.getElementById('nomePesquisa');
            const dataNascInput = document.getElementById('dataNascInfo');
            const sexoInput = document.getElementById('sexoInfo');
            const idadeInput = document.getElementById('idadeInfo');
            const modalidadeInput = document.getElementById('modalidadePesquisa');
            const turmaInput = document.getElementById('turmaPesquisa');
            if (nomeInput) nomeInput.value = '';
            if (dataNascInput) dataNascInput.value = '';
            if (sexoInput) sexoInput.value = '';
            if (idadeInput) idadeInput.value = '';
            if (modalidadeInput) modalidadeInput.value = '';
            if (turmaInput) turmaInput.value = '';
            resultadoDiv.innerHTML = '<p style="color: #999;">Nenhum aluno com este RG.</p>';
        }
    });
    
    // Limpar dados ao apagar Turma
    const turmaInputClear = document.getElementById('turmaPesquisa');
    if (turmaInputClear) {
        turmaInputClear.addEventListener('input', function() {
            if (!turmaInputClear.value) {
                const nomeInput = document.getElementById('nomePesquisa');
                const dataNascInput = document.getElementById('dataNascInfo');
                const sexoInput = document.getElementById('sexoInfo');
                const idadeInput = document.getElementById('idadeInfo');
                const modalidadeInput = document.getElementById('modalidadePesquisa');
                if (nomeInput) nomeInput.value = '';
                if (dataNascInput) dataNascInput.value = '';
                if (sexoInput) sexoInput.value = '';
                if (idadeInput) idadeInput.value = '';
                if (modalidadeInput) modalidadeInput.value = '';
                resultadoDiv.innerHTML = '';
            }
        });
    }
});

// Inicializar
window.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

// Listener para sincronização de alunos
window.addEventListener('alunosSincronizados', function() {
    carregarTurmasPesquisa();
});
