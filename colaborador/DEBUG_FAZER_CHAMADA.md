# Debug: Fazer Chamada - Logs Adicionados

## O que foi feito
Adicionei logs detalhados em três funções para rastrear o que está acontecendo:

### 1. carregarLista() - Line 252
```javascript
console.log('📋 Todas as listas carregadas:', listas.length);
console.log('🔍 Listas filtradas para', modalidadeSelecionada, '-', horarioSelecionado, ':', listasModalidade.length);
console.log('  📌 Lista:', mesNome + '/' + lista.ano, '- ID:', lista.id, '- Alunos:', presencasCount);
```

### 2. abrirChamada(listaId) - Line 396
```javascript
console.log('🔵 abrirChamada chamada com listaId:', listaId);
console.log('📋 Listas obtidas:', listas.length);
console.log('🔍 listaAtual encontrada:', listaAtual);
console.log('✅ chamadaContainer mostrado');
```

### 3. atualizarTabelaAoMudarDia() - Line 310
```javascript
console.log('📊 atualizarTabelaAoMudarDia iniciada');
console.log('   listaAtual.presencas:', listaAtual.presencas?.length || 0);
console.log('   diaSelecionado:', diaSelecionado);
console.log('   alunos carregados:', alunos.length);
console.log('✅ Tabela atualizada com', listaAtual.presencas.length, 'alunos');
```

## Como usar
1. Abra F12 (Developer Console)
2. Clique em "Fazer Chamada"
3. Veja os logs no console
4. Copie os logs e compartilhe

## Exemplo de logs esperados:
```
📋 Todas as listas carregadas: 12
🔍 Listas filtradas para judo - 08h às 09h : 3
  📌 Lista: jan/2026 - ID: 123456 - Alunos: 15
  📌 Lista: fev/2026 - ID: 123457 - Alunos: 16
  📌 Lista: mar/2026 - ID: 123458 - Alunos: 15
🔵 abrirChamada chamada com listaId: 123456
📋 Listas obtidas: 12
🔍 listaAtual encontrada: {id: 123456, nome: "Judo jan/2026", ...}
✅ chamadaContainer mostrado
📊 atualizarTabelaAoMudarDia iniciada
   listaAtual.presencas: 15
   diaSelecionado: 15/01/2026
   alunos carregados: 156
✅ Tabela atualizada com 15 alunos
```

## Possíveis problemas a rastrear:
- Se não vir "Fazer Chamada", as listas não estão sendo filtradas corretamente
- Se vir "Fazer Chamada" mas não abrir, a modal não está sendo exibida
- Se abrir mas tabela vazia, há problema com dados de alunos
