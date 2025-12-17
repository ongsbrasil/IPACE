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
                aluno.id = Date.now();
                alunos.push(aluno);
            }
            localStorage.setItem('alunos', JSON.stringify(alunos));
            return aluno;
        }
    },