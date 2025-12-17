/**
 * Gerenciador de Dados (Data Manager)
 * Abstrai a camada de dados para permitir transição de LocalStorage para Supabase.
 * 
 * Uso:
 * await DataManager.getAlunos();
 * await DataManager.saveAluno(aluno);
 */

const DataManager = {
    useSupabase: true, // APENAS SUPABASE

    init: async function() {
        // Aguardar Supabase inicializar
        let tentativas = 0;
        while (!window.supabaseClient && tentativas < 10) {
            console.log('⏳ Aguardando Supabase... tentativa', tentativas + 1);
            await new Promise(resolve => setTimeout(resolve, 100));
            tentativas++;
        }
        
        if (!window.supabaseClient) {
            console.error('❌ ERRO CRÍTICO: Supabase não foi inicializado!');
            throw new Error('Supabase não disponível');
        }
        
        console.log('✅ DataManager: Supabase Inicializado');
        
        // Testar conexão
        try {
            const { error } = await window.supabaseClient.from('alunos').select('count', { count: 'exact' }).limit(1);
            if (error) {
                console.error('❌ ERRO: Supabase retornou erro na conexão:', error.message);
                throw error;
            }
            console.log('✅ Conexão Supabase OK');
        } catch (e) {
            console.error('❌ ERRO CRÍTICO na conexão Supabase:', e.message);
            throw e;
        }
    },

    // ============================================================
    // ALUNOS
    // ============================================================

    getAlunos: async function() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            const { data, error } = await window.supabaseClient
                .from('alunos')
                .select('*')
                .order('nome');
            
            if (error) {
                console.error('❌ Erro ao buscar alunos:', error.message);
                throw error;
            }
            
            console.log('✅ Alunos obtidos:', data ? data.length : 0);
            return data || [];
        } catch (e) {
            console.error('❌ getAlunos falhou:', e.message);
            throw e;
        }
    },

    saveAluno: async function(aluno) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            // Mapear campos camelCase para snake_case
            const alunoDB = {
                ...aluno,
                data_nascimento: aluno.dataNascimento || aluno.data_nascimento,
                data_cadastro: aluno.dataCadastro || aluno.data_cadastro
            };
            
            delete alunoDB.dataNascimento;
            delete alunoDB.dataCadastro;

            console.log('📤 Salvando aluno:', alunoDB.nome);

            const { data, error } = await window.supabaseClient
                .from('alunos')
                .upsert(alunoDB)
                .select();
            
            if (error) {
                console.error('❌ Erro ao salvar aluno:', error.message);
                throw error;
            }
            
            console.log('✅ Aluno salvo com sucesso');
            return data && data.length > 0 ? data[0] : null;
        } catch (e) {
            console.error('❌ saveAluno falhou:', e.message);
            throw e;
        }
    },

    deleteAluno: async function(id) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            const { error } = await window.supabaseClient
                .from('alunos')
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('❌ Erro ao deletar aluno:', error.message);
                throw error;
            }
            
            console.log('✅ Aluno deletado');
            return true;
        } catch (e) {
            console.error('❌ deleteAluno falhou:', e.message);
            throw e;
        }
    },

    // ============================================================
    // USUARIOS
    // ============================================================

    getUsuarios: async function() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }

            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('*');
            
            if (error) {
                console.error('❌ Erro ao buscar usuarios:', error.message);
                throw error;
            }
            
            // Converter array para objeto {username: {dados}}
            const usuariosObj = {};
            if (Array.isArray(data)) {
                data.forEach(u => {
                    if (u && u.username) {
                        usuariosObj[u.username] = u;
                    }
                });
            }
            console.log('✅ Usuários obtidos:', Object.keys(usuariosObj).length);
            return usuariosObj;
        } catch (e) {
            console.error('❌ getUsuarios falhou:', e.message);
            throw e;
        }
    },

    saveUsuario: async function(usuarioData) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            const usuarioDB = {
                username: usuarioData.username || usuarioData.usuario,
                senha: usuarioData.senha,
                tipo: usuarioData.tipo,
                nome: usuarioData.nome,
                modalidade: usuarioData.modalidade,
                ativo: usuarioData.ativo !== undefined ? usuarioData.ativo : true
            };

            console.log('📤 Salvando usuário:', usuarioDB.username);
            
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .upsert(usuarioDB)
                .select();
            
            if (error) {
                console.error('❌ Erro ao salvar usuario:', error.message);
                throw error;
            }
            console.log('✅ Usuário salvo com sucesso');
            return data && data.length > 0 ? data[0] : null;
        } catch (e) {
            console.error('❌ saveUsuario falhou:', e.message);
            throw e;
        }
    },

    deleteUsuario: async function(username) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            const { error } = await window.supabaseClient
                .from('usuarios')
                .delete()
                .eq('username', username);
            
            if (error) {
                console.error('❌ Erro ao deletar usuario:', error.message);
                throw error;
            }
            console.log('✅ Usuário deletado');
            return true;
        } catch (e) {
            console.error('❌ deleteUsuario falhou:', e.message);
            throw e;
        }
    },

    // ============================================================
    // LISTAS
    // ============================================================
    
    getListas: async function() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
            
            // 1. Buscar Listas
            const { data: listas, error: errListas } = await window.supabaseClient
                .from('listas')
                .select('*');
        
            if (errListas) {
                console.error('❌ Erro ao buscar listas:', errListas.message);
                throw errListas;
            }

            // Se não houver listas, retornar vazio
            if (!listas || !listas.length) {
                console.log('✅ Nenhuma lista encontrada');
                return [];
            }

            // 2. Buscar Alunos das Listas
            const { data: listaAlunos } = await window.supabaseClient
                .from('lista_alunos')
                .select('*');
            
            // 3. Buscar Chamadas
            const { data: chamadas } = await window.supabaseClient
                .from('chamadas')
                .select('*');

            // Reconstruir estrutura complexa
            const resultado = listas.map(lista => {
                const alunosDestaLista = listaAlunos
                    ? listaAlunos.filter(la => la.lista_id === lista.id)
                    : [];
                
                const presencas = alunosDestaLista.map(la => ({
                    alunoId: la.aluno_id,
                    alunoNome: la.aluno_nome,
                    status: la.status
                }));

                const chamadasDestaLista = chamadas
                    ? chamadas.filter(c => c.lista_id === lista.id)
                    : [];
                
                const chamadasMap = {};
                chamadasDestaLista.forEach(c => {
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
            
            console.log('✅ Listas obtidas:', resultado.length);
            return resultado;
        } catch (e) {
            console.error('❌ getListas falhou:', e.message);
            throw e;
        }
    },

    saveLista: async function(lista) {
        if (this.useSupabase) {
            try {
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
            } catch (e) {
                console.error('Erro ao salvar lista Supabase:', e);
                return null;
            }
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
            try {
                const { error } = await window.supabaseClient
                    .from('listas')
                    .delete()
                    .eq('id', id);
                return !error;
            } catch (e) {
                console.error('Erro ao deletar lista:', e);
                return false;
            }
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
