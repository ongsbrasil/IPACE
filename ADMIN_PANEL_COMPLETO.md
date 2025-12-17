# 📊 Painel de Administração Completo - Documentação

## 🎯 Visão Geral

O **Painel Admin** foi completamente refatorado com:
- ✅ **Menu lateral** com 3 abas principais
- ✅ **Gerenciar Usuários** - CRUD + Active/Inactive
- ✅ **Gerenciar Chamadas** - Admin override para editar presença
- ✅ **Dashboard** - Métricas e estatísticas do sistema

---

## 📁 Arquivos

1. **admin-panel.html** (650+ linhas)
   - Layout com sidebar + 3 tabs
   - Modals para editar usuários e chamadas
   - Formulários e tabelas responsivas

2. **admin-panel.js** (500+ linhas)
   - Lógica de routing entre abas
   - CRUD de usuários com persistência
   - Sistema de edição de chamadas
   - Cálculos e métricas do dashboard

---

## 👥 1. GERENCIAR USUÁRIOS

### Funcionalidades

#### Criar Novo Usuário
- Clique **"+ Novo Usuário"**
- Preencha campos:
  - **Usuário**: Login único (case-insensitive)
  - **Senha**: Sem validação de força
  - **Tipo**: Professor ou Secretária
  - **Modalidade**: Apenas para Professores (obrigatório)
  - **Nome**: Nome completo
  - **Ativo**: Checkbox (padrão = marcado)
- Clique **Salvar**

#### Editar Usuário
- Clique **Editar** na linha
- Campos: Login fica **BLOQUEADO** (não pode mudar)
- Pode editar: Senha, Tipo, Modalidade, Nome, Status Ativo
- Clique **Salvar**

#### Deletar Usuário
- Clique **Deletar** (botão vermelho)
- Confirme no popup
- ⚠️ **Irreversível**

### Persistência

```javascript
// Salvo em localStorage com chave 'usuariosAdmin'
{
  "prof_judo_1": {
    "senha": "1234",
    "tipo": "professor",
    "modalidade": "judo",
    "nome": "Professor Judô",
    "ativo": true
  },
  "secretaria": {
    "senha": "123",
    "tipo": "secretaria",
    "nome": "Secretária",
    "ativo": true
  }
}
```

### Sincronização com Login

- A variável global `usuarios` é atualizada em tempo real
- **Próximo login**: Já usa novas credenciais
- Se mudar senha: Usuário logado continua logado até fazer logout manual

### Regras

- ✅ Admin consegue alterar **qualquer coisa** sem restrições
- ✅ Username **não pode duplicar**
- ✅ Tipo e modalidade obrigatórios para professor
- ✅ Usuários inativos ainda fazem login (implementar bloqueio se necessário)

---

## 📋 2. GERENCIAR CHAMADAS

### Objetivo

Admin pode **override** qualquer chamada/presença do professor, útil para:
- Corrigir erros de entrada de dados
- Justificar faltas retroativas
- Reparar chamadas deletadas acidentalmente

### Filtros

1. **Professor**: Filtro por `modalidade - turma`
2. **Turma**: Todas as turmas cadastradas
3. **Mês**: 01-12
4. **Ano**: 2024-2027

Combinar filtros: Ex. "Judô" + "Manhã 8h-9h" + "Janeiro" + "2026"

### Editar Chamada

1. Selecione filtros e clique **Editar** na chamada desejada
2. Modal abre mostrando:
   - Título: `[Mês Ano] - [Modalidade] - [Turma]`
   - Tabela com alunos
3. Para cada aluno, mude o status:
   - **Sem Registro** (padrão)
   - **Presente**
   - **Falta**
   - **Justificado**
4. Clique **Salvar Alterações**

### Persistência

Alterações salvam em:
```javascript
// Em localStorage['listas']
{
  "id": 123456,
  "mes": "01",
  "ano": 2026,
  "modalidade": "judo",
  "turma": "Manhã - 8h às 9h",
  "presencas": [...],
  "chamadas": {
    "12345": { "status": "presente" },  // alunoId -> status
    "12346": { "status": "falta" }
  }
}
```

### Sincronização com Painel do Professor

- ✅ Evento `listasAtualizadas` disparado ao salvar
- ✅ Professor vê mudanças no **próximo refresh**
- ✅ Para SPA (single-page), escutar evento e re-renderizar

---

## 📊 3. DASHBOARD

### Métricas Principais

#### Cartões no Topo
1. **Total de Alunos**: Todos os alunos cadastrados (filtrados por modalidade se selecionada)
2. **Alunos Ativos**: Alunos com `data_entrada <= último dia do mês` E `(!data_saida || data_saida >= primeiro dia do mês)`
3. **Frequência Média**: `(Total de Presentes / Total de Chamadas) * 100%`
4. **Chamadas Registradas**: Total de registros de chamadas no período

#### Ranking de Presença
Tabela com Top 10 alunos:
- **#**: Posição
- **Aluno**: Nome
- **Presentes**: Contagem de "presente"
- **Faltas**: Contagem de "falta"
- **Taxa %**: Percentual de presença

Cálculo: `(Presentes / (Presentes + Faltas)) * 100%`

#### Professores com Mais Chamadas
Tabela com Top 10 professores/turmas:
- **Professor**: `modalidade - turma`
- **Modalidade**: Ex. "judo"
- **Chamadas**: Total de chamadas registradas
- **Última Chamada**: Nome do mês mais recente

### Filtros

1. **Mês**: Todos os meses (01-12) ou vazio para todos
2. **Modalidade**: Todas as 5 modalidades ou vazio para todas

Exemplo: "Janeiro" + "Judô" = métricas apenas para alunos de judô em janeiro

### Cálculos

#### Frequência Média
```javascript
totalPresentes = 0, totalChamadas = 0;
listas.forEach(lista => {
    Object.values(lista.chamadas || {}).forEach(chamada => {
        totalChamadas++;
        if (chamada.status === 'presente') totalPresentes++;
    });
});
frequencia = (totalPresentes / totalChamadas) * 100;
```

#### Alunos Ativos no Mês
```javascript
const primeiroDia = new Date(ano, mes - 1, 1);
const ultimoDia = new Date(ano, mes, 0);
const primeiroDiaStr = primeiroDia.toISOString().split('T')[0];
const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];

alunosAtivos = alunos.filter(a => 
    a.data_entrada <= ultimoDiaStr && 
    (!a.data_saida || a.data_saida >= primeiroDiaStr)
);
```

### Sincronização

- ✅ Listener `listasAtualizadas` atualiza dashboard se estiver ativo
- ✅ Dados sempre lidos direto do localStorage
- ✅ Respeita lógica de `data_entrada/data_saida`

---

## 🎨 Design

### Layout
- **Sidebar**: 250px fixo, menu escuro
- **Main**: Flex, ocupa resto do espaço
- **Header**: Título dinâmico + botão Sair
- **Content**: Scroll independente

### Responsividade
- Grid adaptável para cartões
- Tabelas 100% width
- Modals centered com max-width 600px

### Cores
- 🔵 **Azul** (#007bff): Ação padrão
- 🟢 **Verde** (#28a745): Criar/Salvar
- 🔴 **Vermelho** (#dc3545): Deletar/Perigo
- ⚪ **Cinza** (#6c757d): Cancelar/Secundário

### CSS Minimalista
- 0 frameworks (Bootstrap, Tailwind)
- ~200 linhas de CSS puro
- Grid e Flexbox para layouts
- Sem animações complexas

---

## 🔄 Fluxo de Dados

### Criar Usuário
```
Admin preenche form 
  → Valida unicidade 
  → Salva em localStorage['usuariosAdmin'] 
  → Atualiza variável global 'usuarios' 
  → Recarrega lista 
  → Mostra alerta
```

### Editar Chamada
```
Admin seleciona chamada 
  → Abre modal com alunos 
  → Muda status dos alunos 
  → Clica Salvar 
  → Atualiza chamada em localStorage['listas'] 
  → Dispara evento 'listasAtualizadas' 
  → Dashboard atualiza se ativo
```

### Dashboard
```
Abri aba Dashboard 
  → Inicializa filtros (preenche dropdowns) 
  → Carrega dados de localStorage 
  → Aplica filtros 
  → Calcula métricas 
  → Renderiza tabelas
```

---

## ⚙️ Funções Principais

### Usuários
- `inicializarAdmin()` - Setup inicial
- `recarregarUsuarios()` - Carrega lista da tabela
- `abrirModalNovoUsuario()` - Abre modal de criar
- `editarUsuario(usuario)` - Abre modal de editar
- `salvarUsuario(event)` - Salva dados
- `deletarUsuario(usuario)` - Deleta com confirmação
- `atualizarEstatisticas()` - Atualiza contadores

### Chamadas
- `inicializarFiltrosChamadas()` - Setup dos dropdowns
- `recarregarChamadas()` - Carrega lista filtrada
- `filtrarChamadas()` - Callback dos filtros
- `editarChamada(listaId)` - Abre modal de edição
- `atualizarStatusPresenca(alunoId, status)` - Atualiza em memória
- `salvarChamadaEditada()` - Persiste alteração

### Dashboard
- `inicializarDashboard()` - Setup dos filtros
- `atualizarDashboard()` - Calcula e renderiza métricas

---

## 🚀 Como Usar

### Acesso
1. Vá para [admin-panel.html](admin-panel.html)
2. Ou clique **"⚙️ Painel Admin"** na página de login

### Fluxo Típico

**Cenário 1: Criar novo professor**
1. Aba "Usuários" → "+ Novo Usuário"
2. Preencha: prof_edu / senha123 / Professor / Judô / Professor Educador
3. Salvar
4. Professor consegue fazer login com essas credenciais

**Cenário 2: Corrigir presença do aluno**
1. Aba "Chamadas"
2. Filtrar: Judô / Manhã 8-9 / Janeiro / 2026
3. Clique "Editar" na chamada desejada
4. Mude status de João: Falta → Presente
5. Salvar

**Cenário 3: Ver estatísticas**
1. Aba "Dashboard"
2. Filtrar: Janeiro / Judô
3. Veja: 25 alunos, 20 ativos, 85% frequência
4. Ranking mostra top 10 presentes

---

## 🔒 Segurança & Regras

### O que Admin Pode Fazer
- ✅ Criar/editar/deletar usuários
- ✅ Mudar senha sem validação
- ✅ Ativar/desativar contas
- ✅ Override qualquer chamada
- ✅ Ver todas as métricas

### O que Admin NÃO Pode (Implementar depois)
- ❌ Deletar alunos (apenas usuários de login)
- ❌ Mudar data_entrada de aluno (apenas no próprio cadastro)
- ❌ Acessar dados de outras unidades (multi-tenant)

### Validações
- ✅ Username não pode duplicar
- ✅ Campos obrigatórios verificados
- ✅ Datas em formato válido
- ✅ Status enum: presente|falta|justificado|sem-registro

---

## 📝 Próximos Passos (Opcional)

1. **Login Admin Separado**: Implementar login de admin com permissões
2. **Backup/Restore**: Exportar e importar dados (CSV/JSON)
3. **Logs de Auditoria**: Rastrear quem criou/editou/deletou o quê
4. **Validação de Senha**: Força mínima, histórico
5. **Permissões Granulares**: Admin, Secretária, Professor com diferentes acessos
6. **Multi-tenant**: Separar dados por unidade/centro
7. **API**: Conectar com backend real (Node.js, Python, etc)

---

## 📞 Suporte

Para dúvidas ou bugs:
1. Verifique browser console (F12) para erros
2. Verifique localStorage em DevTools → Application → Local Storage
3. Teste com dados diferentes
4. Verifique se sync.js está carregado antes de admin-panel.js
