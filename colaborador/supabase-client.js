// Cliente Supabase
// Requer a biblioteca supabase-js carregada no HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabase;

function initSupabase() {
    if (window.supabase) {
        // Já inicializado
        return window.supabase;
    }

    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || window.SUPABASE_CONFIG.url.includes('SUA_URL')) {
        console.warn('Supabase não configurado. Usando modo LocalStorage.');
        return null;
    }

    try {
        const { createClient } = window.supabase;
        supabase = createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
        window.supabaseClient = supabase; // Global reference
        console.log('Supabase inicializado com sucesso.');
        return supabase;
    } catch (e) {
        console.error('Erro ao inicializar Supabase:', e);
        return null;
    }
}

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', initSupabase);
