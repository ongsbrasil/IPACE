// Cliente Supabase - Inicialização Robusta
// Requer a biblioteca supabase-js carregada no HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Guard contra dupla execução deste script
if (!window._supabaseClientInitialized) {
    window._supabaseClientInitialized = true;
    window._supabaseInitAttempts = 0;

    function initSupabase() {
        // Se já foi inicializado, retornar imediatamente
        if (window.supabaseClient) {
            console.log('✓ Supabase já inicializado');
            return window.supabaseClient;
        }

        window._supabaseInitAttempts++;
        console.log(`📍 Tentativa ${window._supabaseInitAttempts} de inicializar Supabase...`);

        // Verificar se configuração existe
        if (!window.SUPABASE_CONFIG) {
            console.warn('⚠️ SUPABASE_CONFIG não encontrada - aguardando supabase-config.js');
            return null;
        }

        if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
            console.warn('⚠️ SUPABASE_CONFIG incompleta');
            return null;
        }

        if (window.SUPABASE_CONFIG.url.includes('SUA_URL')) {
            console.warn('⚠️ Supabase não configurado com valores reais');
            return null;
        }

        try {
            // Verificar se a biblioteca supabase-js está carregada
            if (!window.supabase) {
                console.warn('⚠️ window.supabase não está disponível - biblioteca não carregada');
                return null;
            }

            if (!window.supabase.createClient) {
                console.warn('⚠️ window.supabase.createClient não está disponível');
                return null;
            }

            console.log('✓ Pré-requisitos OK: supabase-js carregado');

            const { createClient } = window.supabase;
            console.log('✓ createClient obtido');
            
            const supabaseClient = createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.key
            );
            
            console.log('✓ Cliente Supabase criado');
            
            window.supabaseClient = supabaseClient;
            
            console.log('✅ Supabase inicializado com sucesso!');
            console.log('   URL:', window.SUPABASE_CONFIG.url);
            console.log('   Key:', window.SUPABASE_CONFIG.key.substring(0, 20) + '...');
            
            return supabaseClient;
        } catch (e) {
            console.error('❌ Erro ao inicializar Supabase:', e.message, e.stack);
            return null;
        }
    }

    // Tentar inicializar imediatamente
    console.log('🚀 supabase-client.js carregado - iniciando...');
    initSupabase();

    // Se documento já está pronto, tentar novamente
    if (document.readyState !== 'loading') {
        setTimeout(initSupabase, 0);
    } else {
        // Senão, aguardar DOM estar pronto
        document.addEventListener('DOMContentLoaded', initSupabase, { once: true });
    }

    // Tentar novamente em intervalos se ainda não inicializou
    const initInterval = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(initInterval);
            console.log('✓ Intervalo: Supabase já inicializado, parando tentativas');
            return;
        }

        if (window._supabaseInitAttempts > 20) {
            clearInterval(initInterval);
            console.error('❌ Não foi possível inicializar Supabase após 20 tentativas');
            return;
        }

        const result = initSupabase();
        if (result) {
            clearInterval(initInterval);
        }
    }, 100);

    // Forçar última tentativa após 2 segundos
    setTimeout(() => {
        if (!window.supabaseClient) {
            console.warn('⚠️ Última tentativa de inicialização após 2s');
            initSupabase();
        }
    }, 2000);
}
