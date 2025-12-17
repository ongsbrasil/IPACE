// Banco de dados de usuários - Carregado via DataManager
let usuarios = {};

// Mostrar mensagem de inicialização
console.log('%c=== IPACE - SISTEMA DE LOGIN ===', 'color: #1084d0; font-weight: bold; font-size: 14px;');

// ============================================================================
// CARREGAR USUARIOS
// ============================================================================

async function carregarUsuarios() {
    try {
        usuarios = await DataManager.getUsuarios();
        console.log('✓ Usuarios carregados:', Object.keys(usuarios));
        return true;
    } catch (e) {
        console.error('✗ Erro ao carregar usuarios:', e);
        usuarios = {};
        return false;
    }
}

// Carregar usuarios ao inicializar a pagina
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== INICIANDO LOGIN ===');
    await carregarUsuarios();
});

// ============================================================================
// FUNCAO DE LOGIN
// ============================================================================

// Função para fazer login
async function fazerLogin(event) {
    event.preventDefault();
    
    const usuario = document.getElementById('usuario').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const errorDiv = document.getElementById('errorMessage');
    
    // Garantir dados atualizados
    await carregarUsuarios();
    
    console.log('🔐 Tentando login com usuario:', usuario);
    
    // Verificar se o usuário existe e a senha está correta
    if (usuarios[usuario] && usuarios[usuario].senha === senha) {
        // Login bem-sucedido
        const dadosUser = usuarios[usuario];
        
        console.log('✓ Login bem-sucedido para:', usuario);
        // Salvar dados do usuário no localStorage (sessão)
        if (dadosUser.tipo === 'professor') {
            localStorage.setItem('professorLogado', JSON.stringify({
                usuario: usuario,
                modalidade: dadosUser.modalidade,
                nome: dadosUser.nome,
                dataLogin: new Date().toISOString()
            }));
            localStorage.setItem('modalidadeSelecionada', dadosUser.modalidade);
            
            // Redirecionar para página da modalidade
            const paginasModalidades = {
                'judo': 'judo.html',
                'canoagem-velocidade': 'canoagem-velocidade.html',
                'canoagem-turismo': 'canoagem-turismo.html',
                'vela': 'vela.html',
                'futebol': 'futebol.html'
            };
            
            window.location.href = '/colaborador/' + paginasModalidades[dadosUser.modalidade];
        } else if (dadosUser.tipo === 'secretaria') {
            localStorage.setItem('secretariaLogada', JSON.stringify({
                usuario: usuario,
                nome: dadosUser.nome,
                dataLogin: new Date().toISOString()
            }));
            window.location.href = '/colaborador/secretaria.html';
        } else if (dadosUser.tipo === 'admin') {
            localStorage.setItem('adminLogado', JSON.stringify({
                usuario: usuario,
                nome: dadosUser.nome,
                dataLogin: new Date().toISOString()
            }));
            window.location.href = '/colaborador/admin-panel.html';
        }
    } else {
        // Login falhou
        console.log('✗ Login falhou para:', usuario);
        errorDiv.textContent = 'Usuário ou senha incorretos!';
        errorDiv.style.display = 'block';
        
        // Efeito de shake no formulário
        const form = document.querySelector('.login-container');
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 500);
    }
}

// Adicionar listener ao formulário
document.getElementById('loginForm').addEventListener('submit', fazerLogin);

// Listener para sincronização (caso mude em outra aba/admin)
window.addEventListener('usuariosAtualizados', async function() {
    console.log('Login.js recebeu atualizacao de usuarios');
    await carregarUsuarios();
});
