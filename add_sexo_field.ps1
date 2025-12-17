# Script para adicionar campo Sexo em todos os arquivos

# 1. cadastro-aluno.html
$html = Get-Content "colaborador\cadastro-aluno.html" -Raw
$search = '                <div class="form-group">
                    <label for="rgAluno">RG:</label>
                    <input type="text" id="rgAluno" placeholder="Ex: 39.155.061-5" maxlength="12" required>
                </div>
                <div class="form-group">
                    <label for="modalidadeAluno">Modalidade:</label>'
$replace = '                <div class="form-group">
                    <label for="rgAluno">RG:</label>
                    <input type="text" id="rgAluno" placeholder="Ex: 39.155.061-5" maxlength="12" required>
                </div>
                <div class="form-group">
                    <label for="sexoAluno">Sexo:</label>
                    <select id="sexoAluno" required>
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modalidadeAluno">Modalidade:</label>'
$html = $html.Replace($search, $replace)
$html | Set-Content "colaborador\cadastro-aluno.html" -Encoding UTF8

Write-Host "✓ cadastro-aluno.html atualizado"

# 2. cadastro-aluno.js - capturar sexo
$js = Get-Content "colaborador\cadastro-aluno.js" -Raw

# 2.1 Capturar sexo do formulário
$search = '    const rg = document.getElementById(''rgAluno'').value;
    const modalidade = document.getElementById(''modalidadeAluno'').value;'
$replace = '    const rg = document.getElementById(''rgAluno'').value;
    const sexo = document.getElementById(''sexoAluno'').value;
    const modalidade = document.getElementById(''modalidadeAluno'').value;'
$js = $js.Replace($search, $replace)

# 2.2 Validação
$search = '    const validacao = validarAluno({ nome, dataNascimento, rg, modalidade, turma });'
$replace = '    const validacao = validarAluno({ nome, dataNascimento, rg, sexo, modalidade, turma });'
$js = $js.Replace($search, $replace)

# 2.3 Edição
$search = '        const sucesso = editarAlunoSincronizado(Number(alunoId), {
            nome,
            dataNascimento,
            rg,
            modalidade,
            turma
        });'
$replace = '        const sucesso = editarAlunoSincronizado(Number(alunoId), {
            nome,
            dataNascimento,
            rg,
            sexo,
            modalidade,
            turma
        });'
$js = $js.Replace($search, $replace)

# 2.4 Adicionar
$search = '        const sucesso = adicionarAluno({
            nome,
            dataNascimento,
            rg,
            modalidade,
            turma,
            data_entrada: data_entrada
        });'
$replace = '        const sucesso = adicionarAluno({
            nome,
            dataNascimento,
            rg,
            sexo,
            modalidade,
            turma,
            data_entrada: data_entrada
        });'
$js = $js.Replace($search, $replace)

# 2.5 Carregar para edição
$search = '        document.getElementById(''rgAluno'').value = formatarRG(aluno.rg || '''');
        document.getElementById(''modalidadeAluno'').value = aluno.modalidade;'
$replace = '        document.getElementById(''rgAluno'').value = formatarRG(aluno.rg || '''');
        document.getElementById(''sexoAluno'').value = aluno.sexo || '''';
        document.getElementById(''modalidadeAluno'').value = aluno.modalidade;'
$js = $js.Replace($search, $replace)

# 2.6 CSV - índice
$search = '                const indiceRG = cabecalho.findIndex(c => c.includes(''rg''));
                const indiceModalidade = cabecalho.findIndex(c => c.includes(''modalidade''));'
$replace = '                const indiceRG = cabecalho.findIndex(c => c.includes(''rg''));
                const indiceSexo = cabecalho.findIndex(c => c.includes(''sexo''));
                const indiceModalidade = cabecalho.findIndex(c => c.includes(''modalidade''));'
$js = $js.Replace($search, $replace)

# 2.7 CSV - validação
$search = 'if (indiceNome === -1 || indiceDateNasc === -1 || indiceRG === -1 || indiceModalidade === -1 || indiceHorario === -1) {
                    alert(''❌ CSV com formato inválido!\n\nColunas obrigatórias:\n- Nome\n- Data Nascimento\n- RG\n- Modalidade\n- Horário\n\nColunas opcionais:\n- Data Entrada (YYYY-MM-DD)\n- Data Saida (YYYY-MM-DD)'');'
$replace = 'if (indiceNome === -1 || indiceDateNasc === -1 || indiceRG === -1 || indiceSexo === -1 || indiceModalidade === -1 || indiceHorario === -1) {
                    alert(''❌ CSV com formato inválido!\n\nColunas obrigatórias:\n- Nome\n- Data Nascimento\n- RG\n- Sexo (M/F/O)\n- Modalidade\n- Horário\n\nColunas opcionais:\n- Data Entrada (YYYY-MM-DD)\n- Data Saida (YYYY-MM-DD)'');'
$js = $js.Replace($search, $replace)

# 2.8 CSV - extrair sexo
$search = '                        if (typeof formatarRG === ''function'') {
                            rg = formatarRG(rg);
                        }
                        const modalidade = campos[indiceModalidade];'
$replace = '                        if (typeof formatarRG === ''function'') {
                            rg = formatarRG(rg);
                        }
                        const sexo = campos[indiceSexo];
                        const modalidade = campos[indiceModalidade];'
$js = $js.Replace($search, $replace)

# 2.9 CSV - validar sexo
$search = '                        if (!nome || !dataNasc || !rg || !modalidade || !horario) {'
$replace = '                        if (!nome || !dataNasc || !rg || !sexo || !modalidade || !horario) {'
$js = $js.Replace($search, $replace)

# 2.10 CSV - objeto aluno
$search = '                            rg: rg,
                            modalidade: modalidadeNormalizada,'
$replace = '                            rg: rg,
                            sexo: sexo,
                            modalidade: modalidadeNormalizada,'
$js = $js.Replace($search, $replace)

$js | Set-Content "colaborador\cadastro-aluno.js" -Encoding UTF8
Write-Host "✓ cadastro-aluno.js atualizado"

# 3. sync.js
$sync = Get-Content "colaborador\sync.js" -Raw

# 3.1 Documentação
$search = ' * @param {string} aluno.rg
 * @param {string} aluno.modalidade'
$replace = ' * @param {string} aluno.rg
 * @param {string} aluno.sexo
 * @param {string} aluno.modalidade'
$sync = $sync.Replace($search, $replace)

# 3.2 Validação de dados
$search = '    if (!aluno.nome || !aluno.dataNascimento || !aluno.rg || !aluno.modalidade || !aluno.turma || !aluno.data_entrada) {'
$replace = '    if (!aluno.nome || !aluno.dataNascimento || !aluno.rg || !aluno.sexo || !aluno.modalidade || !aluno.turma || !aluno.data_entrada) {'
$sync = $sync.Replace($search, $replace)

# 3.3 Criar novo aluno
$search = '            dataNascimento: aluno.dataNascimento,
            rg: aluno.rg,
            modalidade: aluno.modalidade,'
$replace = '            dataNascimento: aluno.dataNascimento,
            rg: aluno.rg,
            sexo: aluno.sexo,
            modalidade: aluno.modalidade,'
$sync = $sync.Replace($search, $replace)

# 3.4 Função validarAluno
$search = '    if (!aluno.rg || aluno.rg.trim() === '''') {
        return { valido: false, erro: ''RG é obrigatório'' };
    }
    if (!aluno.modalidade) {'
$replace = '    if (!aluno.rg || aluno.rg.trim() === '''') {
        return { valido: false, erro: ''RG é obrigatório'' };
    }
    if (!aluno.sexo || aluno.sexo.trim() === '''') {
        return { valido: false, erro: ''Sexo é obrigatório'' };
    }
    if (!aluno.modalidade) {'
$sync = $sync.Replace($search, $replace)

$sync | Set-Content "colaborador\sync.js" -Encoding UTF8
Write-Host "✓ sync.js atualizado"

Write-Host "`n✅ Arquivos principais atualizados com campo Sexo!"
Write-Host "Próximos passos: atualizar visualizações (admin-panel, modalidade-painel, etc.)"
