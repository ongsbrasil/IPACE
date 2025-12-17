/**
 * 🔍 SCRIPT DE DIAGNÓSTICO DO SUPABASE
 * 
 * Execute no console do navegador (F12):
 * 1. Copie todo o conteúdo deste arquivo
 * 2. Cole no console do navegador
 * 3. Pressione Enter
 * 4. Verifique os resultados
 */

console.log('\n=== 🔍 DIAGNÓSTICO DO SUPABASE ===\n');

// 1. Verificar se a biblioteca está carregada
console.log('1️⃣ Biblioteca supabase-js carregada?');
if (window.supabase) {
    console.log('   ✅ SIM - window.supabase disponível');
} else {
    console.error('   ❌ NÃO - A biblioteca não foi carregada. Verifique o <script> no HTML');
}

// 2. Verificar configuração
console.log('\n2️⃣ Configuração do Supabase');
if (window.SUPABASE_CONFIG) {
    console.log('   ✅ SUPABASE_CONFIG encontrado');
    console.log('   URL:', window.SUPABASE_CONFIG.url);
    console.log('   Key (primeiros 30 chars):', window.SUPABASE_CONFIG.key.substring(0, 30) + '...');
} else {
    console.error('   ❌ SUPABASE_CONFIG não encontrado');
}

// 3. Verificar cliente
console.log('\n3️⃣ Cliente Supabase');
if (window.supabaseClient) {
    console.log('   ✅ supabaseClient inicializado');
} else {
    console.warn('   ⚠️  supabaseClient não inicializado. Tentando inicializar...');
    if (typeof initSupabase === 'function') {
        window.supabaseClient = initSupabase();
        if (window.supabaseClient) {
            console.log('   ✅ supabaseClient inicializado com sucesso');
        } else {
            console.error('   ❌ Falha ao inicializar supabaseClient');
        }
    }
}

// 4. Testar SELECT
console.log('\n4️⃣ Teste de SELECT (READ)');
if (window.supabaseClient) {
    window.supabaseClient.from('alunos').select('count', { count: 'exact' }).limit(1)
        .then(({ data, error, count }) => {
            if (error) {
                console.error('   ❌ Erro:', error.message);
                console.log('   Código:', error.code);
            } else {
                console.log('   ✅ SELECT funcionando');
                console.log('   Total de alunos:', count || data?.length || 0);
            }
        })
        .catch(e => console.error('   ❌ Exceção:', e.message));
} else {
    console.error('   ❌ supabaseClient não disponível');
}

// 5. Testar INSERT
console.log('\n5️⃣ Teste de INSERT (WRITE) - Aluno de teste');
if (window.supabaseClient) {
    const alunoTeste = {
        nome: 'TESTE_' + Date.now(),
        data_nascimento: '2010-01-01',
        rg: 'TESTE123',
        modalidade: 'judo',
        turma: '08h às 09h',
        data_entrada: '2025-01-01',
        ativo: true
    };
    
    window.supabaseClient.from('alunos').insert([alunoTeste])
        .then(({ data, error }) => {
            if (error) {
                console.error('   ❌ Erro ao inserir:', error.message);
                console.log('   Código:', error.code);
                console.log('   Details:', error.details);
            } else {
                console.log('   ✅ INSERT funcionando');
                console.log('   Aluno inserido:', alunoTeste.nome);
            }
        })
        .catch(e => console.error('   ❌ Exceção:', e.message));
} else {
    console.error('   ❌ supabaseClient não disponível');
}

// 6. Verificar DataManager
console.log('\n6️⃣ DataManager');
if (typeof DataManager !== 'undefined') {
    console.log('   ✅ DataManager carregado');
    console.log('   Usando Supabase?', DataManager.useSupabase ? '✅ SIM' : '❌ NÃO (LocalStorage)');
} else {
    console.error('   ❌ DataManager não encontrado');
}

// 7. Resumo
console.log('\n=== 📋 RESUMO ===');
const diagnostico = {
    'Biblioteca Supabase-js': !!window.supabase,
    'Configuração SUPABASE_CONFIG': !!window.SUPABASE_CONFIG,
    'Cliente Inicializado': !!window.supabaseClient,
    'DataManager Carregado': typeof DataManager !== 'undefined',
    'DataManager Usando Supabase': typeof DataManager !== 'undefined' && DataManager.useSupabase
};

Object.entries(diagnostico).forEach(([chave, valor]) => {
    console.log(`  ${valor ? '✅' : '❌'} ${chave}`);
});

console.log('\n=== ✅ DIAGNÓSTICO COMPLETO ===\n');

// Exportar função para testar manualmente
window.testSupabase = async function() {
    console.log('\n🧪 Executando teste manual...');
    
    try {
        // Testar alunos
        const { data: alunos, error: errAlunos } = await window.supabaseClient
            .from('alunos')
            .select('*')
            .limit(5);
        
        if (errAlunos) throw errAlunos;
        console.log('✅ Alunos:', alunos.length);
        
        // Testar listas
        const { data: listas, error: errListas } = await window.supabaseClient
            .from('listas')
            .select('*')
            .limit(5);
        
        if (errListas) throw errListas;
        console.log('✅ Listas:', listas.length);
        
        // Testar usuarios
        const { data: usuarios, error: errUsuarios } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .limit(5);
        
        if (errUsuarios) throw errUsuarios;
        console.log('✅ Usuários:', usuarios.length);
        
        console.log('\n✅ TODOS OS TESTES PASSARAM!');
        
    } catch (e) {
        console.error('\n❌ ERRO NO TESTE:', e.message);
    }
};

console.log('💡 Dica: Execute no console: testSupabase()');
