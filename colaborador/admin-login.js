// Admin Login - Credenciais Padrão
const ADMIN_CREDENTIALS = {
    usuario: 'ipace@org.br',
    senha: 'cdcbpu2026+'
};

async function fazerLoginAdmin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const alertDiv = document.getElementById('alertDiv');
    
    // 1. Verificar credenciais hardcoded (Super Admin)
    if (usuario === ADMIN_CREDENTIALS.usuario && senha === ADMIN_CREDENTIALS.senha) {
        loginSucesso(usuario);
        return;
    }

    // 2. Verificar no DataManager (Supabase/LocalStorage)
    try {
        // Garantir que DataManager está inicializado
        if (typeof DataManager.init === 'function' && !DataManager.initialized) {
            await DataManager.init();
        }

        const usuarios = await DataManager.getUsuarios();
        const user = usuarios[usuario];

        // Verificar se existe, se a senha bate e se é do tipo 'admin' (ou se permitirmos professores acessarem painel admin?)
        // Por segurança, vamos assumir que apenas tipo 'admin' ou 'superadmin' pode acessar aqui.
        // Como o sistema atual só tem 'professor' e 'secretaria', isso não vai logar ninguém por enquanto,
        // mas prepara o terreno.
        
        // Se quisermos permitir que professores acessem o admin (não recomendado), removeríamos a checagem de tipo.
        // Vamos manter restrito.
        
        if (user && user.senha === senha && (user.tipo === 'admin' || user.tipo === 'superadmin')) {
            if (user.ativo === false) {
                mostrarAlerta('Usuário inativo!', 'danger');
                return;
            }
            loginSucesso(usuario);
            return;
        }

    } catch (e) {
        console.error('Erro ao verificar login no banco:', e);
    }

    // Se chegou aqui, falhou
    mostrarAlerta('Usuário ou senha incorretos!', 'danger');
    document.getElementById('senha').value = '';
    document.getElementById('usuario').focus();
}

function loginSucesso(usuario) {
    localStorage.setItem('adminLogado', JSON.stringify({
        usuario: usuario,
        dataLogin: new Date().toISOString()
    }));
    
    mostrarAlerta('Login realizado com sucesso!', 'success');
    
    setTimeout(() => {
        window.location.href = '/colaborador/admin-panel.html';
    }, 500);
}

function mostrarAlerta(mensagem, tipo) {
    const alertDiv = document.getElementById('alertDiv');
    if (alertDiv) {
        alertDiv.className = `alert ${tipo}`;
        alertDiv.textContent = mensagem;
        alertDiv.style.display = 'block';
    } else {
        alert(mensagem);
    }
}

// Ao carregar página, verificar se já está logado
window.addEventListener('DOMContentLoaded', function() {
    const adminLogado = localStorage.getItem('adminLogado');
    if (adminLogado) {
        window.location.href = 'admin-panel.html';
    }
});

// Permitir enter para submeter
document.addEventListener('DOMContentLoaded', function() {
    const senhaInput = document.getElementById('senha');
    if (senhaInput) {
        senhaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            }
        });
    }
});
