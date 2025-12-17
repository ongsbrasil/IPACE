/**
 * Gerenciador de Dados (Data Manager)
 * Abstrai a camada de dados para permitir transição de LocalStorage para Supabase.
 * 
 * Uso:
 * await DataManager.getAlunos();
 * await DataManager.saveAluno(aluno);
 */

const DataManager = {
    useSupabase: false,

    init: async function() {
        const client = initSupabase();
        if (client) {
            this.useSupabase = true;
            console.log('DataManager: Usando Supabase');
        } else {
            console.log('DataManager: Usando LocalStorage');
        }
    },

    // ============================================================
    // ALUNOS
    // ============================================================

    getAlunos: async function() {
        if (this.useSupabase) {
            const { data, error } = await window.supabaseClient
                .from('alunos')
                .select('*')
                .order('nome');
            if (error) {
                console.error('Erro ao buscar alunos:', error);
                return [];
            }
            return data;
        } else {
            return JSON.parse(localStorage.getItem('alunos')) || [];
        }
    },

    saveAluno: async function(aluno) {
        if (this.useSupabase) {
            // Mapear campos camelCase para snake_case para o Supabase
            const alunoDB = {
                ...aluno,
                data_nascimento: aluno.dataNascimento || aluno.data_nascimento,
                data_cadastro: aluno.dataCadastro || aluno.data_cadastro
            };
            
            // Remover campos camelCase que não existem no banco para evitar erro
            delete alunoDB.dataNascimento;
            delete alunoDB.dataCadastro;

            // Remover ID se for novo (para auto-incremento) ou manter se for update
            const { data, error } = await window.supabaseClient
                .from('alunos')
                .upsert(alunoDB)
                .select();
            
            if (error) {
                console.error('Erro ao salvar aluno:', error);
                return null;
            }
            return data[0];
        } else {
            let alunos = JSON.parse(localStorage.getItem('alunos')) || [];
            if (aluno.id) {
                const index = alunos.findIndex(a => a.id === aluno.id);
                if (index !== -1) alunos[index] = aluno;
                else alunos.push(aluno);
            } else {
                // Gerar ID único combinando timestamp e random para evitar colisão em imports rápidos
                aluno.id = Date.now() + Math.floor(Math.random() * 10000);
                alunos.push(aluno);
            }
            localStorage.setItem('alunos', JSON.stringify(alunos));
            return aluno;
        }
    },

    deleteAluno: async function(id) {
        if (this.useSupabase) {
            const { error } = await window.supabaseClient
                .from('alunos')
                .delete()
                .eq('id', id);
            return !error;
        } else {
            let alunos = JSON.parse(localStorage.getItem('alunos')) || [];
            // Usar != para permitir comparação entre string e number
            alunos = alunos.filter(a => a.id != id);
            localStorage.setItem('alunos', JSON.stringify(alunos));
            return true;
        }
    },

    // ============================================================
    // USUARIOS
    // ============================================================

    getUsuarios: async function() {
        if (this.useSupabase) {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('*');
            
            if (error) return {};
            
            // Converter array para objeto {username: {dados}}
            const usuariosObj = {};
            data.forEach(u => {
                usuariosObj[u.username] = u;
            });
            return usuariosObj;
        } else {
            return JSON.parse(localStorage.getItem('usuariosAdmin')) || {};
        }
    },

    saveUsuario: async function(usuarioData) {
        // usuarioData deve ter { username, senha, tipo, nome, modalidade, ativo }
        // No localStorage era { username: { ...dados } }
        // Aqui esperamos o objeto de dados, e o username deve estar dentro ou ser passado
        
        // Normalizar para formato do banco
        const usuarioDB = {
            username: usuarioData.username || usuarioData.usuario, // Aceitar ambos
            senha: usuarioData.senha,
            tipo: usuarioData.tipo,
            nome: usuarioData.nome,
            modalidade: usuarioData.modalidade,
            ativo: usuarioData.ativo
        };

        if (this.useSupabase) {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .upsert(usuarioDB)
                .select();
            
            if (error) {
                console.error('Erro ao salvar usuario:', error);
                return null;
            }
            return data[0];
        } else {
            let usuarios = JSON.parse(localStorage.getItem('usuariosAdmin')) || {};
            usuarios[usuarioDB.username] = usuarioDB;
            localStorage.setItem('usuariosAdmin', JSON.stringify(usuarios));
            // Manter compatibilidade com login.js antigo
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            return usuarioDB;
        }
    },

    deleteUsuario: async function(username) {
        if (this.useSupabase) {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('username', username);
            return !error;
        } else {
            let usuarios = JSON.parse(localStorage.getItem('usuariosAdmin')) || {};
            delete usuarios[username];
            localStorage.setItem('usuariosAdmin', JSON.stringify(usuarios));
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
            return true;
        }
    },

    // ============================================================
    // LISTAS
    // ============================================================
    
    getListas: async function() {
        if (this.useSupabase) {
            // 1. Buscar Listas
            const { data: listas, error: errListas } = await window.supabaseClient
                .from('listas')
                .select('*');
            
            if (errListas) {
                console.error('Erro ao buscar listas:', errListas);
                return [];
            }

            // Se não houver listas, retornar vazio
            if (!listas.length) return [];

            // 2. Buscar Alunos das Listas (lista_alunos)
            const { data: listaAlunos, error: errAlunos } = await window.supabaseClient
                .from('lista_alunos')
                .select('*');
            
            // 3. Buscar Chamadas
            const { data: chamadas, error: errChamadas } = await window.supabaseClient
                .from('chamadas')
                .select('*');

            // Reconstruir estrutura complexa
            return listas.map(lista => {
                // Filtrar alunos desta lista
                const alunosDestaLista = listaAlunos
                    ? listaAlunos.filter(la => la.lista_id === lista.id)
                    : [];
                
                // Mapear para formato esperado (presencas)
                const presencas = alunosDestaLista.map(la => ({
                    alunoId: la.aluno_id,
                    alunoNome: la.aluno_nome,
                    status: la.status
                }));

                // Filtrar chamadas desta lista
                const chamadasDestaLista = chamadas
                    ? chamadas.filter(c => c.lista_id === lista.id)
                    : [];
                
                // Agrupar chamadas por data
                const chamadasMap = {};
                chamadasDestaLista.forEach(c => {
                    // Converter data YYYY-MM-DD para DD/MM/YYYY
                    const dataObj = new Date(c.data_chamada);
                    // Ajuste de fuso horário simples (adicionar minutos do offset se necessário, mas aqui assumimos UTC ou local consistente)
                    // Melhor usar string split para evitar problemas de timezone
                    const [ano, mes, dia] = c.data_chamada.split('-');
                    const dataFormatada = `${dia}/${mes}/${ano}`;

                    if (!chamadasMap[dataFormatada]) {
                        chamadasMap[dataFormatada] = [];
                    }
                    chamadasMap[dataFormatada].push({
                        alunoId: c.aluno_id,
                        status: c.status
                    });
                });

                return {
                    ...lista,
                    presencas: presencas,
                    chamadas: chamadasMap
                };
            });

        } else {
            return JSON.parse(localStorage.getItem('listas')) || [];
        }
    },

    saveLista: async function(lista) {
        if (this.useSupabase) {
            // 1. Salvar/Atualizar Lista (Cabeçalho)
            const listaHeader = {
                nome: lista.nome,
                mes: lista.mes,
                ano: lista.ano,
                modalidade: lista.modalidade,
                turma: lista.turma,
                salva: lista.salva
            };
            
            if (lista.id) listaHeader.id = lista.id;

            const { data: listaSalva, error: errLista } = await window.supabaseClient
                .from('listas')
                .upsert(listaHeader)
                .select()
                .single();
            
            if (errLista) {
                console.error('Erro ao salvar lista header:', errLista);
                return null;
            }

            const listaId = listaSalva.id;

            // 2. Salvar Alunos da Lista (lista_alunos)
            // Primeiro remover existentes para substituir (estratégia simples)
            await window.supabaseClient.from('lista_alunos').delete().eq('lista_id', listaId);
            
            if (lista.presencas && lista.presencas.length > 0) {
                const alunosParaSalvar = lista.presencas.map(p => ({
                    lista_id: listaId,
                    aluno_id: p.alunoId,
                    aluno_nome: p.alunoNome,
                    status: p.status
                }));
                await window.supabaseClient.from('lista_alunos').insert(alunosParaSalvar);
            }

            // 3. Salvar Chamadas
            // Remover existentes
            await window.supabaseClient.from('chamadas').delete().eq('lista_id', listaId);

            if (lista.chamadas) {
                const chamadasParaSalvar = [];
                for (const [dataChamada, registros] of Object.entries(lista.chamadas)) {
                    // Converter DD/MM/YYYY para YYYY-MM-DD
                    const [dia, mes, ano] = dataChamada.split('/');
                    const dataISO = `${ano}-${mes}-${dia}`;

                    registros.forEach(r => {
                        chamadasParaSalvar.push({
                            lista_id: listaId,
                            data_chamada: dataISO,
                            aluno_id: r.alunoId,
                            status: r.status
                        });
                    });
                }
                if (chamadasParaSalvar.length > 0) {
                    await window.supabaseClient.from('chamadas').insert(chamadasParaSalvar);
                }
            }

            return listaSalva;

        } else {
            let listas = JSON.parse(localStorage.getItem('listas')) || [];
            if (lista.id) {
                const index = listas.findIndex(l => l.id === lista.id);
                if (index !== -1) listas[index] = lista;
                else listas.push(lista);
            } else {
                lista.id = Date.now();
                listas.push(lista);
            }
            localStorage.setItem('listas', JSON.stringify(listas));
            return lista;
        }
    },

    deleteLista: async function(id) {
        if (this.useSupabase) {
            const { error } = await window.supabaseClient
                .from('listas')
                .delete()
                .eq('id', id);
            return !error;
        } else {
            let listas = JSON.parse(localStorage.getItem('listas')) || [];
            // Usar != para permitir comparação entre string e number
            listas = listas.filter(l => l.id != id);
            localStorage.setItem('listas', JSON.stringify(listas));
            return true;
        }
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    // Pequeno delay para garantir que supabase-client carregou
    setTimeout(() => DataManager.init(), 100);
});
