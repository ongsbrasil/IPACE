# 📚 GUIA DE TESTE - SINCRONIZAÇÃO DE ALUNOS IPACE

## ✅ Objetivo
Validar que quando um aluno é cadastrado na secretaria, ele aparece automaticamente:
1. ✓ Na lista de alunos da secretaria
2. ✓ Na lista de alunos do professor (modalidade correspondente)
3. ✓ Nas listas de presença do professor

---

## 🚀 TESTE 1: Teste Rápido (5 minutos)

### Passo 1: Abrir a página de teste
1. Abra o navegador e vá para: `http://localhost/IPACE-main/colaborador/teste-sincronizacao.html`
   - Ou abra o arquivo direto: `d:\IPACE-main\IPACE-main\colaborador\teste-sincronizacao.html`

### Passo 2: Adicionar um aluno
1. Preencha o formulário (valores padrão já existem):
   - Nome: "João Silva Teste"
   - Data: "2010-05-15"
   - Modalidade: "Judô"
   - Turma: "Manhã - 8h às 9h"
2. Clique no botão "Adicionar Aluno"

### Passo 3: Verificar sincronização
Você deve ver:
- ✅ Uma mensagem de sucesso no log
- ✅ Evento "Alunos sincronizados" no log
- ✅ Evento "Listas atualizadas" no log
- ✅ A tabela de estado atualizar com 1 aluno
- ✅ A tabela de listas mostrar as listas criadas

### Passo 4: Adicionar outro aluno
Repita o processo com outro aluno (por exemplo, "Maria Silva"):
- Deve aparecer imediatamente na tabela de estado
- As listas devem ser atualizadas também

---

## 🧑‍💼 TESTE 2: Teste Completo (15 minutos)

### Cenário: Secretária cadastra aluno → Professor vê na lista

#### Abas Necessárias:
- Aba 1: Página de LOGIN
- Aba 2: CADASTRO DE ALUNO (secretária)
- Aba 3: PAINEL DO PROFESSOR (judo)
- Aba 4: LISTAS DE PRESENÇA (professor)

#### Execução:

**Aba 1 - Fazer Login como Secretária:**
1. Abra `index.html` (ou `login.html`)
2. Username: `sec_ipace`
3. Password: `1234`
4. Clique "Login"
5. Você estará no painel da secretaria

**Aba 2 - Cadastrar Aluno:**
1. No painel da secretaria, clique "Cadastrar Aluno"
2. Preencha os dados:
   - Nome: "Pedro de Oliveira"
   - Data Nascimento: "2009-08-20"
   - Modalidade: **Judô**
   - Turma: **Manhã - 8h às 9h**
3. Clique "Salvar"
4. Verá mensagem de sucesso

**Aba 3 - Verificar na lista de alunos da secretária:**
1. Volte ao painel da secretaria
2. Clique "Lista de Alunos"
3. Procure por "Pedro de Oliveira"
4. ✅ Deve estar lá!

**Aba 4 - Fazer Login como Professor:**
1. Abra uma NOVA aba com `index.html` (login)
2. Username: `prof_judo_1`
3. Password: `1234`
4. Clique "Login"
5. Você estará no painel de Judô

**Aba 5 - Verificar aluno no painel do professor:**
1. Na página de Judô, clique "Listas de Presença"
2. Procure pelo mês/ano (por exemplo: Janeiro 2026)
3. Selecione a turma "Manhã - 8h às 9h"
4. ✅ Pedro de Oliveira deve estar na lista!

---

## 🔧 TESTE 3: Verificação Console (Técnico)

### Para desenvolvedores:

1. Abra qualquer página HTML do IPACE
2. Pressione **F12** para abrir o console
3. Cole este código:

```javascript
// Script de validação completo
copy(`
// 1. Verificar sync.js
console.log('sync.js carregado:', typeof adicionarAluno === 'function');

// 2. Ver alunos
const alunos = JSON.parse(localStorage.getItem('alunos')) || [];
console.log('Total de alunos:', alunos.length);
console.table(alunos);

// 3. Ver listas
const listas = JSON.parse(localStorage.getItem('listas')) || [];
console.log('Total de listas:', listas.length);
console.table(listas);

// 4. Testar adição
const teste = {
  id: Date.now(),
  nome: 'Teste Console',
  dataNascimento: '2010-01-01',
  modalidade: 'judo',
  turma: 'Manhã - 8h às 9h',
  dataCadastro: new Date().toISOString(),
  ativo: true
};
adicionarAluno(teste);
console.log('Aluno de teste adicionado!');
`);
```

4. Ou execute diretamente no console:
```javascript
// Verificar carregamento
typeof adicionarAluno === 'function' ? console.log('✅ sync.js OK') : console.log('❌ Erro ao carregar sync.js');

// Ver dados
console.log('Alunos:', JSON.parse(localStorage.getItem('alunos')).length);
console.log('Listas:', JSON.parse(localStorage.getItem('listas')).length);
```

---

## ⚠️ Solução de Problemas

### "Aluno não aparece na lista do professor"
**Solução:**
1. Verifique se a **modalidade** do aluno corresponde ao professor
   - Aluno em "Judô" só aparece para prof_judo_1
2. Verifique a **turma** (Manhã/Tarde)
3. Abra o console (F12) e execute:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('alunos')));
   console.log(JSON.parse(localStorage.getItem('listas')));
   ```
4. Procure pelos IDs para confirmar que o aluno está em `listas[].presencas`

### "Página não carrega"
**Solução:**
1. Verifique se os arquivos existem:
   - `sync.js` ✅
   - `cadastro-aluno.js` ✅
   - `lista-alunos.js` ✅
   - Todos os `.html` ✅
2. Verifique se há erros no console (F12)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

### "Evento de sincronização não funciona"
**Solução:**
1. No console, execute:
   ```javascript
   // Simular evento manualmente
   window.dispatchEvent(new Event('alunosSincronizados'));
   console.log('Evento disparado!');
   ```
2. Se a página não atualizar, verifique se `exibirAlunos()` existe
3. Abra o console da página específica que não atualiza

### "localStorage mostra dados duplicados"
**Solução:**
1. Limpar localStorage:
   ```javascript
   localStorage.clear();
   console.log('localStorage limpo!');
   ```
2. Recarregue a página
3. Tente adicionar aluno novamente

---

## 📊 Checklist de Validação

- [ ] sync.js está em `d:\IPACE-main\IPACE-main\colaborador\sync.js`
- [ ] sync.js está incluído em todos os 10 arquivos HTML (verificar)
- [ ] cadastro-aluno.js usa `adicionarAluno()` função
- [ ] lista-alunos.js tem listener para `alunosSincronizados`
- [ ] secretaria.js tem listener para `alunosSincronizados`
- [ ] Funções de UI existem nas páginas (exibirAlunos, carregarLista, etc.)
- [ ] Teste 1 (rápido) passou ✓
- [ ] Teste 2 (completo) passou ✓
- [ ] Console não mostra erros ao cadastrar aluno ✓

---

## 📁 Arquivos Importantes

| Arquivo | Localização | Descrição |
|---------|-----------|-----------|
| sync.js | `colaborador/sync.js` | Núcleo da sincronização |
| cadastro-aluno.js | `colaborador/cadastro-aluno.js` | Formulário de cadastro (usa sync) |
| lista-alunos.js | `colaborador/lista-alunos.js` | Lista com listeners |
| secretaria.js | `colaborador/secretaria.js` | Painel secretaria (com listeners) |
| teste-sincronizacao.html | `colaborador/teste-sincronizacao.html` | Página de teste interativa |
| validacao-sincronizacao.js | `colaborador/validacao-sincronizacao.js` | Script de validação console |

---

## 🎯 Fluxo Visual Esperado

```
SECRETÁRIA CADASTRA ALUNO
        ↓
  cadastro-aluno.html
        ↓
  cadastro-aluno.js → adicionarAluno()
        ↓
  sync.js → localStorage['alunos'].push()
        ↓
  sync.js → sincronizarAlunoComListas()
        ↓
  localStorage['listas'][].presencas.push(alunoId)
        ↓
  dispatchEvent('alunosSincronizados')
  dispatchEvent('listasAtualizadas')
        ↓
  ╔═══════════════════════════════════════╗
  ║  EVENT LISTENERS ACIONADOS IMEDIATO  ║
  ║  (em TODAS as abas abertas)          ║
  ╚═══════════════════════════════════════╝
        ↓
  Aba 1: lista-alunos.html → exibirAlunos() ✅
  Aba 2: judo.html → carregarLista() ✅
  Aba 3: listas-presenca.html → atualiza ✅
  Aba 4: secretaria.html → carregarTurmasPesquisa() ✅
```

---

## 📞 Suporte

Se encontrar problemas:
1. Abra o console do navegador (F12)
2. Use o arquivo `validacao-sincronizacao.js`
3. Verifique os dados em localStorage:
   - `localStorage.getItem('alunos')`
   - `localStorage.getItem('listas')`

---

**Status Final**: ✅ Sincronização implementada e pronta para teste
**Data**: 16 de Dezembro de 2025
