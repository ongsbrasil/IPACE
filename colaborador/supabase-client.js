// Cliente Supabase
// Requer a biblioteca supabase-js carregada no HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase;

function initSupabase() {
    if (window.supabaseClient) {
        // Já inicializado
        console.log('✓ Supabase já estava inicializado');
        return window.supabaseClient;
    }

    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || window.SUPABASE_CONFIG.url.includes('SUA_URL')) {
        console.warn('⚠️ Supabase não configurado. Usando modo LocalStorage.');
        return null;
    }

    try {
        // Verificar se a biblioteca supabase-js está carregada
        if (!window.supabase || !window.supabase.createClient) {
            console.error('❌ Biblioteca supabase-js não carregada. Verifique o script tag no HTML.');
            return null;
        }

        const { createClient } = window.supabase;
        supabase = createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
        window.supabaseClient = supabase; // Global reference
        
        console.log('✓ Supabase inicializado com sucesso');
        console.log('  URL:', window.SUPABASE_CONFIG.url);
        console.log('  Key (primeiros 20 chars):', window.SUPABASE_CONFIG.key.substring(0, 20) + '...');
        
        return supabase;
    } catch (e) {
        console.error('❌ Erro ao inicializar Supabase:', e);
        return null;
    }
}

// Inicializar imediatamente quando o script carregar (não esperar DOMContentLoaded)
// Pois outros scripts podem precisar do Supabase antes disso
if (document.readyState === 'loading') {
    // Se o documento ainda está carregando, aguardar
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    // Se o documento já foi carregado, inicializar agora
    initSupabase();
}

// Também tentar inicializar quando a biblioteca supabase-js carregar
if (document.readyState !== 'loading') {
    // Se estiver após DOMContentLoaded, chamar imediatamente
    setTimeout(() => {
        if (!window.supabaseClient) {
            console.log('Tentando inicializar Supabase novamente...');
            initSupabase();
        }
    }, 100);
}
