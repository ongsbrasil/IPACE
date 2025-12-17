# Cronograma Oficial - IPACE 2026

## Estrutura de Horários

O sistema foi refatorado para gerenciar **21 horários** distribuídos em **5 modalidades** com **2 blocos de tempo**:

### TERÇA E QUINTA (9 horários)

#### Judô (6 horários)
- **Manhã:**
  - 08h às 09h
  - 09h às 10h
  - 10h às 11h
- **Tarde:**
  - 14h às 15h
  - 15h às 16h
  - 16h às 17h

#### Canoagem Velocidade (3 horários)
- **Manhã:**
  - 09h às 10h30
- **Tarde:**
  - 14h às 15h30
  - 15h30 às 17h

---

### QUARTA E SEXTA (12 horários)

#### Futebol (6 horários)
- **Manhã:**
  - 08h às 09h
  - 09h às 10h
  - 10h às 11h
- **Tarde:**
  - 14h às 15h
  - 15h às 16h
  - 16h às 17h

#### Vela (3 horários)
- **Manhã:**
  - 09h às 10h30
- **Tarde:**
  - 14h às 15h30
  - 15h30 às 17h

#### Canoagem Turismo (3 horários)
- **Manhã:**
  - 09h às 10h30
- **Tarde:**
  - 14h às 15h30
  - 15h30 às 17h

---

## Total: 21 Horários

| Modalidade | Dias | Horários |
|-----------|------|----------|
| Judô | Terça, Quinta | 6 |
| Canoagem Velocidade | Terça, Quinta | 3 |
| Futebol | Quarta, Sexta | 6 |
| Vela | Quarta, Sexta | 3 |
| Canoagem Turismo | Quarta, Sexta | 3 |
| **TOTAL** | - | **21** |

---

## Implementação Técnica

### Admin Panel (`admin-panel.js`)
- **CRONOGRAMA:** Objeto estruturado com blocos de tempo (terça-quinta, quarta-sexta)
- **Modalidades:** Cada modalidade tem `nome` e array de `horarios`
- **Filtros:** Modalidade → Horário (Turma) → Mês → Ano
- **Gestão:** Criar, editar, deletar chamadas

### Interface de Gerenciamento
- **Aba "Gerenciar Chamadas":**
  - Filtro por Modalidade (em vez de "Professor")
  - Filtro por Horário (em vez de turma genérica)
  - Filtro por Mês e Ano
  - Botão "+ Criar Nova Chamada" (abre modal)
  - Opção de deletar chamadas

### Modal de Criar Chamada
- Seleção de Modalidade
- Seleção de Horário (dinâmica conforme modalidade)
- Seleção de Mês (janeiro-dezembro)
- Seleção de Ano (2024-2027)
- Nome da Chamada
- Validação: evita duplicatas

### Painel de Modalidade (`modalidade-painel.js`)
- Sincronização com o `CRONOGRAMA_MODAL`
- Função `obterHorariosPorModalidade()` central
- Horários carregados dinamicamente na página

---

## Fluxo de Chamada

1. **Admin cria lista de chamada:**
   - Seleciona Modalidade (ex: Judô)
   - Seleciona Horário (ex: 08h às 09h)
   - Seleciona Mês/Ano
   - Nomeia chamada (ex: "Aula 1 - Janeiro")
   - Sistema gera lista com alunos da turma correspondente

2. **Professor acessa modalidade:**
   - Vê horários disponíveis para sua modalidade
   - Seleciona horário
   - Vê todas as listas de chamada para esse horário
   - Faz registro de presença/falta
   - Salva chamada

3. **Admin gerencia chamadas:**
   - Filtra por modalidade, horário, mês, ano
   - Edita presença de alunos
   - Deleta chamadas antigas
   - Acompanha estatísticas

---

## Vantagens da Nova Estrutura

✅ **Clareza:** Cada turma = um horário específico (não genérico)  
✅ **Escalabilidade:** Fácil adicionar/remover horários no CRONOGRAMA  
✅ **Sincronização:** Admin-panel e modalidade-painel usam mesma fonte de verdade  
✅ **Validação:** Impossível criar chamadas duplicadas  
✅ **Usabilidade:** Filtros refinados e interface intuitiva

---

## Próximos Passos

- [ ] Testar criação de chamadas no admin-panel
- [ ] Verificar carregamento de horários nas modalidades
- [ ] Validar sincronização com localStorage
- [ ] Testar edição/exclusão de chamadas
- [ ] Conferir dados de presença

