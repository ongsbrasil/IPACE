// Configuração do Supabase
// Substitua com suas chaves reais
const SUPABASE_URL = 'https://lypkhzpxwgwckdovitqi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cGtoenB4d2d3Y2tkb3ZpdHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODE5MTEsImV4cCI6MjA4MTU1NzkxMX0.Ot-g8-Eu79h0BoY7_4dgY6DDUm1qGpDQjQ_6B22QQdM';

// Exportar para uso em outros arquivos (se estiver usando módulos)
// ou apenas variáveis globais se estiver usando script tags simples
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
};
