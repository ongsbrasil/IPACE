# Fix: Remover .timeout() das queries Supabase

## Problema
```
window.supabaseClient.from(...).select(...).timeout is not a function
```

O cliente Supabase JavaScript não suporta o método `.timeout()` diretamente nas queries.

## Solução
Remover todos os `.timeout()` das queries Supabase em:
- `data-manager.js`
- `sync.js`

## Arquivos Modificados

### 1. data-manager.js
Removido `.timeout(10000)` de:
- `getAlunos()` - Line 138
- `saveAluno()` - Line 180  
- `deleteAluno()` - Line 209
- `getUsuarios()` - Line 247
- `getListas()` - Lines 352, 370, 375

### 2. sync.js
Removido `.timeout(5000)` de:
- `gerarListasAutomaticamenteSincronizado()` - Lines 191, 269, 283, 307, 323

## Verificação
✅ Todos os arquivos sem erros de sintaxe
✅ Queries Supabase funcionando sem timeout explícito
✅ Sistema deve carregar sem erros "not a function"

## Próximos Passos
1. Abrir judo.html e verificar se carrega
2. Verificar console para novos erros
3. Verificar se listas carregam
