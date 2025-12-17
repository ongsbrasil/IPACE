# ⚡ INÍCIO RÁPIDO - SINCRONIZAÇÃO IPACE

## 🎯 Em 3 Passos

### 1️⃣ Abrir Teste Interativo
Abra este arquivo no navegador:
```
d:\IPACE-main\IPACE-main\colaborador\teste-sincronizacao.html
```

### 2️⃣ Adicionar um Aluno
1. Preencha o formulário (valores já aparecem)
2. Clique "Adicionar Aluno"
3. Veja a sincronização acontecer em tempo real! 🎉

### 3️⃣ Verificar Resultado
- ✅ Log mostrará eventos de sincronização
- ✅ Tabela de estado mostrará alunos cadastrados
- ✅ Tabela de listas mostrará listas criadas

---

## 📱 Teste Realista (com 3 abas)

### Aba 1: Secretária cadastra
```
1. Abra: colaborador/index.html
2. Login: sec_ipace / 1234
3. Clique "Cadastrar Aluno"
4. Preencha e salve
```

### Aba 2: Verificar na lista de alunos
```
1. Volte ao painel secretaria
2. Clique "Lista de Alunos"
3. Procure o aluno → ✅ Aparece!
```

### Aba 3: Professor vê o aluno
```
1. Abra NOVA aba: colaborador/index.html
2. Login: prof_judo_1 / 1234 (se aluno em Judô)
3. Clique "Listas de Presença"
4. Procure o aluno → ✅ Aparece!
```

---

## 🔍 Ver Dados no Console

Pressione **F12** e execute:

```javascript
// Ver todos os alunos
JSON.parse(localStorage.getItem('alunos'))

// Ver todas as listas
JSON.parse(localStorage.getItem('listas'))

// Testar sincronização
const teste = {
  id: Date.now(),
  nome: 'Teste',
  dataNascimento: '2010-01-01',
  modalidade: 'judo',
  turma: 'Manhã - 8h às 9h',
  dataCadastro: new Date().toISOString(),
  ativo: true
};
adicionarAluno(teste);
console.log('✅ Aluno adicionado!');
```

---

## ✨ Funcionalidades Principais

| Função | O que faz | Arquivo |
|--------|-----------|---------|
| `adicionarAluno()` | Adiciona aluno + sincroniza com listas | sync.js |
| `editarAluno()` | Edita aluno + atualiza listas | sync.js |
| `removerAluno()` | Remove aluno de tudo | sync.js |
| `validarAluno()` | Valida dados antes de salvar | sync.js |

---

## 🎉 Pronto!

Sua sincronização está funcionando quando você vê:
- ✅ Aluno cadastrado aparece em lista de alunos
- ✅ Aluno aparece na lista do professor (mesma modalidade)
- ✅ Aluno pode receber presença nas listas

---

## ❓ Dúvidas?

Se algo não funcionar:
1. Abra o console (F12)
2. Execute: `typeof adicionarAluno === 'function'`
3. Se der `true` = ✅ sync.js carregado
4. Se der `false` = ❌ Erro ao carregar

Veja **GUIA_TESTE_SINCRONIZACAO.md** para mais detalhes.

---

**Parabéns! Sua sincronização está pronta para usar! 🚀**
