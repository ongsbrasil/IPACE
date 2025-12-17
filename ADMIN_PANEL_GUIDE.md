# 📋 Painel de Administração - Guia de Uso

## Acesso
- **URL**: `admin-panel.html`
- **Link**: Disponível na página de login (⚙️ Painel Admin)
- **Permissão**: Qualquer pessoa pode acessar (implementar segurança se necessário)

## Funcionalidades

### 1️⃣ Visualizar Usuários
- Tabela com todos os usuários cadastrados
- Mostra: Usuário, Tipo, Nome, Modalidade
- Estatísticas no topo: Total, Professores, Secretárias

### 2️⃣ Criar Novo Usuário
- Clique **"+ Novo Usuário"**
- Preencha:
  - **Usuário**: Login único (sem espaços, case-insensitive)
  - **Senha**: Senha de acesso
  - **Tipo**: Professor ou Secretária
  - **Modalidade**: Apenas para Professores (Judô, Futebol, Vela, Canoagem, etc)
  - **Nome**: Nome completo
- Clique **Salvar**

### 3️⃣ Editar Usuário
- Clique **"Editar"** na linha do usuário
- Modify campos desejados (login fica bloqueado)
- Clique **Salvar**

### 4️⃣ Deletar Usuário
- Clique **"Deletar"** em vermelho
- Confirme na caixa de diálogo
- ⚠️ Ação irreversível

### 5️⃣ Recarregar Lista
- Clique **"🔄 Recarregar"** para atualizar a lista
- Útil se estiver sincronizando com outra aba

## Dados Armazenados

Os usuários são salvos em **localStorage** com a chave `usuariosAdmin`:

```javascript
{
  "prof_judo_1": {
    "senha": "1234",
    "tipo": "professor",
    "modalidade": "judo",
    "nome": "Professor Judô"
  },
  "sec_ipace": {
    "senha": "1234",
    "tipo": "secretaria",
    "nome": "Secretária"
  }
}
```

## Fluxo de Sincronização

1. **Admin cria/edita/deleta** usuário em admin-panel.html
2. **localStorage** é atualizado com chave `usuariosAdmin`
3. **login.js** carrega dados de `usuariosAdmin` na inicialização
4. Usuário pode fazer login normalmente

## Layout Minimalista

- **Sem frameworks CSS** (apenas CSS puro)
- Grid de estatísticas simples
- Modal reutilizável para criar/editar
- Botões com cores significativas:
  - 🔵 Azul: Ação padrão (Editar, Recarregar)
  - 🟢 Verde: Adicionar novo
  - 🔴 Vermelho: Deletar/Perigo
  - ⚪ Cinza: Cancelar

## Próximos Passos (Opcional)

- [ ] Implementar login de admin separado
- [ ] Adicionar permissões granulares por usuário
- [ ] Exportar/Importar usuários (CSV)
- [ ] Log de atividades (quem criou/editou/deletou)
- [ ] Validação de força de senha
- [ ] Recuperação de senha

## Usuários Padrão

Ao abrir o painel pela primeira vez, vem com 12 usuários pré-carregados:

**Professores**:
- prof_judo_1 / 1234
- prof_velocidade_1 / 1234
- prof_turismo_1 / 1234
- prof_vela_1 / 1234
- prof_futebol_1 / 1234

**Secretária**:
- sec_ipace / 1234

**Logins Alternativos** (simplificados):
- judo / 123
- canoagem v / 123
- canoagem t / 123
- vela / 123
- futebol / 123
- secretaria / 123
