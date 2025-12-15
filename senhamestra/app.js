// ==================== DOM Elements ====================
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginModeToggle = document.getElementById('login-mode-toggle');

const masterPasswordInput = document.getElementById('master-password');
const masterPasswordStrengthSetupDiv = document.getElementById('master-password-strength-setup');
const confirmMasterPasswordContainer = document.getElementById('confirm-master-password-container');
const confirmMasterPasswordInput = document.getElementById('confirm-master-password');
const loginError = document.getElementById('login-error');
const loginTitle = document.getElementById('login-title');
const loginSubtitle = document.getElementById('login-subtitle');
const masterPasswordLabel = document.getElementById('master-password-label');
const loginButton = document.getElementById('login-button');
const resetAppButton = document.getElementById('reset-app-button');

const collabInfoModal = document.getElementById('collab-info-modal');
const collabInfoForm = document.getElementById('collab-info-form');
const submitCollabInfoButton = document.getElementById('submit-collab-info-button');
const skipCollabInfoButton = document.getElementById('skip-collab-info-button');
const collabNameInput = document.getElementById('collab-name');
const collabEmailInput = document.getElementById('collab-email');
const collabBusinessTypeInput = document.getElementById('collab-business-type');
const collabDescriptionInput = document.getElementById('collab-description');
const collabAgreeCheckbox = document.getElementById('collab-agree');
const collabSubmitFeedback = document.getElementById('collab-submit-feedback');

const termsModal = document.getElementById('terms-modal');
const termsStep1 = document.getElementById('terms-step-1');
const acceptTermsAndContinueButton = document.getElementById('accept-terms-and-continue-button');

const logoutButton = document.getElementById('logout-button');
const settingsButton = document.getElementById('settings-button');
const upgradeToPaidHeaderButton = document.getElementById('upgrade-to-paid-header-button');

const credentialModal = document.getElementById('credential-modal');
const modalContent = document.getElementById('modal-content');
const credentialForm = document.getElementById('credential-form');
const closeModalButton = document.getElementById('close-modal-button');
const modalTitle = document.getElementById('modal-title');
const modalSubmitButton = document.getElementById('modal-submit-button');
const editingCredentialIdInput = document.getElementById('editing-credential-id');
const siteServiceInput = document.getElementById('site-service');
const siteNameInput = document.getElementById('site-name');
const siteLoginInput = document.getElementById('site-login');
const sitePasswordInput = document.getElementById('site-password');
const sitePasswordStrengthDiv = document.getElementById('site-password-strength');
const togglePasswordVisibilityButton = document.getElementById('toggle-password-visibility');
const eyeIconOpen = document.getElementById('eye-icon-open');
const eyeIconClosed = document.getElementById('eye-icon-closed');

const changeMasterPasswordModal = document.getElementById('change-master-password-modal');
const closeChangeMasterPasswordModalButton = document.getElementById('close-change-master-password-modal-button');
const changeMasterPasswordForm = document.getElementById('change-master-password-form');
const changeMasterPasswordError = document.getElementById('change-master-password-error');
const upgradeToPaidSettingsButton = document.getElementById('upgrade-to-paid-settings-button');

const shareCredentialModal = document.getElementById('share-credential-modal');
const closeShareModalButton = document.getElementById('close-share-modal-button');
const sharedLinkTextarea = document.getElementById('shared-link-textarea');
const copySharedLinkButton = document.getElementById('copy-shared-link-button');
const copyShareFeedback = document.getElementById('copy-share-feedback');

const pasteSharedLinkInput = document.getElementById('paste-shared-link-input');
const decryptSharedLinkButton = document.getElementById('decrypt-shared-link-button');
const decryptError = document.getElementById('decrypt-error');
const decryptedCredentialDisplayArea = document.getElementById('decrypted-credential-display-area');

const chatForm = document.getElementById('chat-form');
const chatInputElem = document.getElementById('chat-input');
const chatMessagesElem = document.getElementById('chat-messages');
const suggestionsContainer = document.getElementById('chat-suggestions');

// 🔹 Container que realmente rola
const chatScrollContainer = document.getElementById('chat-scroll-container');

// ==================== Constants and State Variables ====================
// Supabase Configuration
const SUPABASE_URL = 'https://srmwrzyrubjelsvdoqay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybXdyenlydWJqZWxzdmRvcWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODMwNjcsImV4cCI6MjA3OTI1OTA2N30.0aeyyGDXyOI6PgRUUZLgArCe9YE2cKje5AjeQuKz57g';
const SUPABASE_TABLE_CREDENTIALS = 'credentials';

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let currentUser = null;

let cryptoKey = null;
const ENC_PREFIX = 'sm1:';

const COLLAB_INFO_SHOWN_KEY = 'senhaMestra_collabInfoShown';
const TERMS_ACCEPTED_KEY = 'senhaMestra_termsAccepted';
const VIEWED_SHARED_LINKS_KEY = 'senhaMestra_viewedSharedLinks';
const N8N_WEBHOOK_URL = 'https://sutomacao-tea-n8n.9ajkgc.easypanel.host/webhook/75f81b54-4288-4781-b704-6e63160ef583';
const MAX_CHAT_MESSAGES_CONST = 25;

let credentials = [];
let editingCredentialId = null;
let isFirstTimeSetup = false;
let viewedSharedLinks = {};
let isSignUpMode = false;
let chatMessageCount = 0;

// ==================== Helper Functions ====================
function generateSimpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'h' + Math.abs(hash).toString(36);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function loadViewedSharedLinks() {
    try {
        const stored = localStorage.getItem(VIEWED_SHARED_LINKS_KEY);
        viewedSharedLinks = stored ? JSON.parse(stored) : {};
    } catch (e) {
        console.error("Erro ao carregar links compartilhados visualizados:", e);
        viewedSharedLinks = {};
    }
}

function saveViewedSharedLinks() {
    try {
        localStorage.setItem(VIEWED_SHARED_LINKS_KEY, JSON.stringify(viewedSharedLinks));
    } catch (e) {
        console.error("Erro ao salvar links compartilhados visualizados:", e);
    }
}

// ==================== Encryption Helpers (Client-side) ====================
async function deriveKeyFromPassword(password) {
    const enc = new TextEncoder();
    // Para MVP usamos um salt fixo. Em produção, ideal usar um salt por usuário/instalação.
    const salt = enc.encode('senhaMestra_salt_v1');

    const baseKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    cryptoKey = key;
}

async function encryptPassword(plainText) {
    if (!cryptoKey) {
        throw new Error('Chave de criptografia não inicializada');
    }

    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        enc.encode(plainText)
    );

    const ivB64 = btoa(String.fromCharCode(...iv));
    const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));

    return ENC_PREFIX + ivB64 + ':' + cipherB64;
}

async function decryptPassword(cipherText) {
    if (!cipherText) return '';

    // Dados antigos (texto puro) ainda funcionam
    if (!cipherText.startsWith(ENC_PREFIX)) {
        return cipherText;
    }

    if (!cryptoKey) {
        throw new Error('Chave de criptografia não inicializada');
    }

    const payload = cipherText.slice(ENC_PREFIX.length);
    const [ivB64, cipherB64] = payload.split(':');

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));

    const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        cipherBytes
    );

    return new TextDecoder().decode(plainBuffer);
}

// ==================== Chat Suggestions ====================
const suggestedMessages = [
    { display: "Cadastrar senha", command: "Quero cadastrar uma nova senha" },
    { display: "Listar senhas", command: "Listar todas as minhas senhas" },
    { display: "Como editar uma senha?", command: "Como faço para editar uma senha?" },
    { display: "Como excluir uma senha?", command: "Como posso excluir um acesso?" },
    { display: "O que é isto?", command: "O que é o SenhaMestra?" },
    { display: "Como funciona?", command: "Como o SenhaMestra funciona?" },
    { display: "Preciso de ajuda", command: "Ajuda" }
];

function renderSuggestions() {
    if (!suggestionsContainer || !chatInputElem) {
        return;
    }
    suggestionsContainer.innerHTML = '';
    suggestedMessages.forEach(suggestion => {
        const button = document.createElement('button');
        button.classList.add('suggestion-button');
        button.textContent = suggestion.display;
        button.type = "button";

        button.addEventListener('click', () => {
            if (chatInputElem) {
                chatInputElem.value = suggestion.command;
                chatInputElem.focus();
            }
        });

        suggestionsContainer.appendChild(button);
    });
}

// ==================== Password Strength ====================
function evaluatePasswordStrength(password) {
    if (!password) return { score: 0, text: '', className: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let text = '';
    let className = '';

    if (score <= 2) {
        text = 'Fraca';
        className = 'password-strength-weak';
    } else if (score === 3) {
        text = 'Média';
        className = 'password-strength-fair';
    } else if (score === 4) {
        text = 'Boa';
        className = 'password-strength-good';
    } else {
        text = 'Forte';
        className = 'password-strength-strong';
    }

    return { score, text, className };
}

function updatePasswordStrengthDisplay(password, barElement, textElement) {
    if (!barElement || !textElement) return;

    const strength = evaluatePasswordStrength(password);
    const widthPercent = (strength.score / 5) * 100;

    barElement.style.width = widthPercent + '%';
    barElement.className = 'h-full transition-all duration-300 ' + strength.className;
    textElement.textContent = strength.text ? `Força: ${strength.text}` : '';
}

// ==================== Supabase Functions ====================
async function loadCredentialsFromSupabase() {
    if (!supabaseClient || !currentUser) {
        console.error('Supabase não inicializado ou usuário não logado');
        return [];
    }

    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_TABLE_CREDENTIALS)
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro detalhado ao carregar credenciais:', error);
            throw error;
        }

        const rawCreds = data || [];
        const decryptedCreds = [];

        for (const cred of rawCreds) {
            let plainPassword = cred.password || '';
            try {
                plainPassword = await decryptPassword(cred.password);
            } catch (e) {
                console.error('Erro ao descriptografar senha:', e);
            }
            decryptedCreds.push({
                ...cred,
                password: plainPassword
            });
        }

        console.log('Credenciais carregadas com sucesso:', decryptedCreds.length);
        return decryptedCreds;
    } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
        addMessageToChat('⚠️ Erro ao carregar credenciais. Verifique sua conexão.', 'bot');
        return [];
    }
}

async function saveCredentialToSupabase(credential) {
    if (!supabaseClient || !currentUser) {
        console.error('Supabase não inicializado ou usuário não logado');
        return null;
    }

    try {
        const credentialData = {
            user_id: currentUser.id,
            service: credential.service || '',
            site: credential.site,
            login: credential.login,
            password: credential.password
        };

        if (credential.id && !credential.id.startsWith('temp-')) {
            const { data, error } = await supabaseClient
                .from(SUPABASE_TABLE_CREDENTIALS)
                .update(credentialData)
                .eq('id', credential.id)
                .eq('user_id', currentUser.id)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar:', error);
                throw error;
            }
            console.log('Credencial atualizada:', data);
            return data;
        } else {
            const { data, error } = await supabaseClient
                .from(SUPABASE_TABLE_CREDENTIALS)
                .insert([credentialData])
                .select()
                .single();

            if (error) {
                console.error('Erro ao inserir:', error);
                throw error;
            }
            console.log('Nova credencial criada:', data);
            return data;
        }
    } catch (error) {
        console.error('Erro ao salvar credencial:', error.message || error);
        
        if (error.code === '23505') {
            alert('Erro: Já existe uma credencial para este site e login.');
        } else if (error.code === 'PGRST116') {
            alert('Erro: Credencial não encontrada ou você não tem permissão.');
        } else {
            alert('Erro ao salvar credencial. Verifique sua conexão.');
        }
        
        return null;
    }
}

async function deleteCredentialFromSupabase(credentialId) {
    if (!supabaseClient || !currentUser) {
        console.error('Supabase não inicializado ou usuário não logado');
        return false;
    }

    try {
        const { error } = await supabaseClient
            .from(SUPABASE_TABLE_CREDENTIALS)
            .delete()
            .eq('id', credentialId)
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Erro ao deletar:', error);
            throw error;
        }
        
        console.log('Credencial deletada com sucesso:', credentialId);
        return true;
    } catch (error) {
        console.error('Erro ao deletar credencial:', error);
        return false;
    }
}

// ==================== Authentication ====================
async function handleLogin(email, password) {
    if (!supabaseClient) {
        showLoginError('Erro: Supabase não inicializado');
        return false;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;

        // Deriva a chave de criptografia a partir da senha informada no login
        await deriveKeyFromPassword(password);

        console.log('Login bem-sucedido:', currentUser.email);
        return true;
    } catch (error) {
        console.error('Erro no login:', error);
        showLoginError(error.message || 'Erro ao fazer login');
        return false;
    }
}

async function handleSignUp(email, password) {
    if (!supabaseClient) {
        showLoginError('Erro: Supabase não inicializado');
        return false;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            console.log('Conta criada com sucesso, verificação de e-mail necessária para:', data.user.email);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showLoginError(error.message || 'Erro ao criar conta');
        return false;
    }
}

async function handleLogout() {
    if (!supabaseClient) return;

    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        credentials = [];
        cryptoKey = null;
        console.log('Logout realizado');
        showLoginScreen();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

function showLoginError(message) {
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
        setTimeout(() => {
            loginError.classList.add('hidden');
        }, 5000);
    }
}

// ==================== UI Functions ====================
function showLoginScreen() {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appScreen) appScreen.classList.add('hidden');
}

function showAppScreen() {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appScreen) {
        appScreen.classList.remove('hidden');
        appScreen.classList.add('flex');
    }
    
    const userEmailDisplay = document.getElementById('user-email-display');
    if (userEmailDisplay && currentUser) {
        userEmailDisplay.textContent = currentUser.email;
    }
}

function toggleLoginMode() {
    isSignUpMode = !isSignUpMode;

    if (isSignUpMode) {
        if (loginTitle) loginTitle.textContent = 'Criar Conta';
        if (loginSubtitle) loginSubtitle.textContent = 'Cadastre-se para começar';
        if (loginButton) loginButton.textContent = 'Criar Conta';
        if (loginModeToggle) loginModeToggle.textContent = 'Já tem conta? Entrar';
        if (confirmMasterPasswordContainer) confirmMasterPasswordContainer.classList.remove('hidden');
        if (masterPasswordStrengthSetupDiv) masterPasswordStrengthSetupDiv.classList.remove('hidden');
    } else {
        if (loginTitle) loginTitle.textContent = 'Entrar';
        if (loginSubtitle) loginSubtitle.textContent = 'Digite suas credenciais para acessar';
        if (loginButton) loginButton.textContent = 'Entrar';
        if (loginModeToggle) loginModeToggle.textContent = 'Não tem conta? Criar conta';
        if (confirmMasterPasswordContainer) confirmMasterPasswordContainer.classList.add('hidden');
        if (masterPasswordStrengthSetupDiv) masterPasswordStrengthSetupDiv.classList.add('hidden');
    }
}

// ==================== Chat Functions ====================

// Rolagem do chat até o final, com animação suave
function scrollChatToBottom(smooth = true) {
    const container = chatScrollContainer || chatMessagesElem;
    if (!container) return;

    try {
        if (typeof container.scrollTo === 'function') {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        } else {
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) {
        container.scrollTop = container.scrollHeight;
    }
}

function addMessageToChat(message, sender = 'bot', isHtml = false) {
    if (!chatMessagesElem) return;

    chatMessageCount++;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');
    if (sender === 'user') {
        messageDiv.classList.add('chat-message-user');
    } else {
        messageDiv.classList.add('chat-message-bot');
    }

    if (isHtml) {
        messageDiv.innerHTML = message;
    } else {
        messageDiv.textContent = message;
    }

    chatMessagesElem.appendChild(messageDiv);

    // Limita quantidade de mensagens no DOM
    while (chatMessagesElem.children.length > MAX_CHAT_MESSAGES_CONST) {
        chatMessagesElem.removeChild(chatMessagesElem.firstChild);
    }

    // Rolagem suave pro final sempre que chegar mensagem nova
    scrollChatToBottom(true);
}

function clearChat() {
    if (chatMessagesElem) {
        chatMessagesElem.innerHTML = '';
        chatMessageCount = 0;
    }
}

async function processUserMessage(userInput) {
    if (!userInput || !userInput.trim()) return;

    const input = userInput.trim();
    addMessageToChat(input, 'user');

    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('cadastrar') || lowerInput.includes('adicionar') || lowerInput.includes('nova senha')) {
        setTimeout(() => {
            addMessageToChat('Certo! Vou abrir o formulário para você cadastrar uma nova senha.', 'bot');
            openCredentialModal();
        }, 300);
        return;
    }

    if (lowerInput.includes('listar') || lowerInput.includes('mostrar') || lowerInput.includes('ver senhas')) {
        setTimeout(() => {
            listCredentialsInChat();
        }, 300);
        return;
    }

    if (lowerInput.includes('buscar') || lowerInput.includes('procurar') || lowerInput.includes('encontrar')) {
        const searchTerm = input.replace(/buscar|procurar|encontrar/gi, '').trim();
        if (searchTerm) {
            setTimeout(() => {
                searchCredentialsInChat(searchTerm);
            }, 300);
        } else {
            setTimeout(() => {
                addMessageToChat('Por favor, me diga o que você quer buscar. Exemplo: "buscar gmail"', 'bot');
            }, 300);
        }
        return;
    }

    if (lowerInput.includes('editar') || lowerInput.includes('modificar')) {
        setTimeout(() => {
            addMessageToChat('Para editar uma senha, use o botão "✏️" ao lado da credencial quando listar suas senhas.', 'bot');
        }, 300);
        return;
    }

    if (lowerInput.includes('excluir') || lowerInput.includes('deletar') || lowerInput.includes('remover')) {
        setTimeout(() => {
            addMessageToChat('Para excluir uma senha, use o botão "🗑️" ao lado da credencial quando listar suas senhas.', 'bot');
        }, 300);
        return;
    }

    if (lowerInput.includes('ajuda') || lowerInput.includes('help')) {
        setTimeout(() => {
            showHelp();
        }, 300);
        return;
    }

    if (lowerInput.includes('o que é') || lowerInput.includes('sobre')) {
        setTimeout(() => {
            addMessageToChat('🔐 <strong>SenhaMestra</strong> é um gerenciador de senhas seguro na nuvem. Você pode armazenar, organizar e acessar todas as suas senhas de forma criptografada. Suas credenciais ficam seguras e acessíveis de qualquer lugar!', 'bot', true);
        }, 300);
        return;
    }

    if (lowerInput.includes('como funciona')) {
        setTimeout(() => {
            addMessageToChat('O SenhaMestra funciona assim:<br><br>1️⃣ Você cria uma conta com e-mail e senha<br>2️⃣ Adiciona suas credenciais (senhas, logins, etc)<br>3️⃣ Tudo é armazenado de forma segura na nuvem<br>4️⃣ Você pode acessar de qualquer dispositivo<br>5️⃣ Use o chat para gerenciar tudo facilmente!', 'bot', true);
        }, 300);
        return;
    }

    setTimeout(() => {
        searchCredentialsInChat(input);
    }, 300);
}

function showHelp() {
    const helpMessage = `
        <div class="chat-help">
            <p class="chat-help-title">📋 Comandos Disponíveis:</p>
            <ul class="chat-help-list">
                <li><strong>Cadastrar senha</strong> - Adiciona nova credencial</li>
                <li><strong>Listar senhas</strong> - Mostra todas suas senhas</li>
                <li><strong>Buscar [termo]</strong> - Procura credenciais</li>
                <li><strong>Editar senha</strong> - Como editar</li>
                <li><strong>Excluir senha</strong> - Como excluir</li>
                <li><strong>O que é</strong> - Sobre o app</li>
                <li><strong>Como funciona</strong> - Explicação</li>
            </ul>
        </div>
    `;
    addMessageToChat(helpMessage, 'bot', true);
}

function listCredentialsInChat() {
    if (credentials.length === 0) {
        addMessageToChat('Você ainda não tem nenhuma senha cadastrada. Que tal adicionar uma agora?', 'bot');
        return;
    }

    let html = '<div class="credentials-list"><p class="credentials-list-title">📋 Suas Credenciais:</p>';
    
    credentials.forEach(cred => {
        html += formatCredentialForDisplay(cred, cred.id, false);
    });
    
    html += '</div>';
    addMessageToChat(html, 'bot', true);
}

function searchCredentialsInChat(searchTerm) {
    const term = searchTerm.toLowerCase();
    const results = credentials.filter(cred => 
        (cred.site && cred.site.toLowerCase().includes(term)) ||
        (cred.service && cred.service.toLowerCase().includes(term)) ||
        (cred.login && cred.login.toLowerCase().includes(term))
    );

    if (results.length === 0) {
        addMessageToChat(`Nenhuma credencial encontrada para "${searchTerm}". Tente outro termo.`, 'bot');
        return;
    }

    let html = `<div class="credentials-list"><p class="credentials-list-title">🔍 Resultados para "${searchTerm}" (${results.length}):</p>`;
    
    results.forEach(cred => {
        html += formatCredentialForDisplay(cred, cred.id, false);
    });
    
    html += '</div>';
    addMessageToChat(html, 'bot', true);
}

function formatCredentialForDisplay(cred, credId, isShared = false) {
    const service = cred.s || cred.service || 'Geral';
    const site = cred.n || cred.site || 'N/A';
    const login = cred.l || cred.login || 'N/A';
    const password = cred.p || cred.password || 'N/A';

    let html = `
        <div class="credential-card">
            <div class="credential-card-header">
                <div class="credential-card-info">
                    <p class="credential-card-service">${service}</p>
                    <p class="credential-card-site">${site}</p>
                </div>
    `;

    if (!isShared) {
        html += `
                <div class="credential-card-actions">
                    <button onclick="openEditCredentialModal('${credId}')" class="credential-card-action-btn credential-card-edit">✏️</button>
                    <button onclick="confirmDeleteCredential('${credId}')" class="credential-card-action-btn credential-card-delete">🗑️</button>
                    <button onclick="openShareCredentialModal('${credId}')" class="credential-card-action-btn credential-card-share">📤</button>
                </div>
        `;
    }

    html += `
            </div>
            <div class="credential-card-body">
                <div class="credential-card-row">
                    <span class="credential-card-label">Login:</span>
                    <span class="credential-card-value">${login}</span>
                </div>
                <div class="credential-card-row">
                    <span class="credential-card-label">Senha:</span>
                    <span class="credential-card-value credential-card-password">${password}</span>
                </div>
            </div>
        </div>
    `;

    return html;
}

// ==================== Credential Modal Functions ====================
function openCredentialModal(credentialId = null) {
    if (!credentialModal) return;

    editingCredentialId = credentialId;

    if (credentialId) {
        const cred = credentials.find(c => c.id === credentialId);
        if (!cred) return;

        if (modalTitle) modalTitle.textContent = 'Editar Credencial';
        if (modalSubmitButton) modalSubmitButton.textContent = 'Salvar Alterações';
        if (editingCredentialIdInput) editingCredentialIdInput.value = credentialId;
        if (siteServiceInput) siteServiceInput.value = cred.service || '';
        if (siteNameInput) siteNameInput.value = cred.site || '';
        if (siteLoginInput) siteLoginInput.value = cred.login || '';
        if (sitePasswordInput) sitePasswordInput.value = cred.password || '';
    } else {
        if (modalTitle) modalTitle.textContent = 'Adicionar Credencial';
        if (modalSubmitButton) modalSubmitButton.textContent = 'Adicionar';
        if (credentialForm) credentialForm.reset();
        if (editingCredentialIdInput) editingCredentialIdInput.value = '';
    }

    credentialModal.classList.remove('hidden');
    credentialModal.classList.add('flex');
}

function openEditCredentialModal(credentialId) {
    openCredentialModal(credentialId);
}

function closeCredentialModal() {
    if (credentialModal) {
        credentialModal.classList.add('hidden');
        credentialModal.classList.remove('flex');
    }
    if (credentialForm) credentialForm.reset();
    editingCredentialId = null;
}

async function saveCredential() {
    const service = siteServiceInput?.value?.trim() || '';
    const site = siteNameInput?.value?.trim() || '';
    const login = siteLoginInput?.value?.trim() || '';
    const password = sitePasswordInput?.value?.trim() || '';

    if (!site || !login || !password) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    let encryptedPassword;
    try {
        encryptedPassword = await encryptPassword(password);
    } catch (e) {
        console.error('Erro ao criptografar senha antes de salvar:', e);
        alert('Erro ao proteger a senha. Tente novamente.');
        return;
    }

    const credentialData = {
        service,
        site,
        login,
        password: encryptedPassword
    };

    if (editingCredentialId) {
        credentialData.id = editingCredentialId;
        const savedCred = await saveCredentialToSupabase(credentialData);
        
        if (savedCred) {
            const index = credentials.findIndex(c => c.id === editingCredentialId);
            if (index !== -1) {
                credentials[index] = {
                    ...savedCred,
                    password
                };
            }
            addMessageToChat('✅ Credencial atualizada com sucesso!', 'bot');
        } else {
            addMessageToChat('❌ Erro ao atualizar credencial.', 'bot');
        }
    } else {
        credentialData.id = 'temp-' + generateId();
        const savedCred = await saveCredentialToSupabase(credentialData);
        
        if (savedCred) {
            credentials.unshift({
                ...savedCred,
                password
            });
            addMessageToChat('✅ Nova credencial adicionada com sucesso!', 'bot');
        } else {
            addMessageToChat('❌ Erro ao adicionar credencial.', 'bot');
        }
    }

    closeCredentialModal();
}

async function confirmDeleteCredential(credentialId) {
    const cred = credentials.find(c => c.id === credentialId);
    if (!cred) return;

    const confirmed = confirm(`Tem certeza que deseja excluir a credencial de "${cred.site}"?`);
    if (!confirmed) return;

    const success = await deleteCredentialFromSupabase(credentialId);
    
    if (success) {
        credentials = credentials.filter(c => c.id !== credentialId);
        addMessageToChat('✅ Credencial excluída com sucesso!', 'bot');
        
        setTimeout(() => {
            if (chatMessagesElem && chatMessagesElem.querySelector('.credential-card')) {
                listCredentialsInChat();
            }
        }, 500);
    } else {
        addMessageToChat('❌ Erro ao excluir credencial.', 'bot');
    }
}

// ==================== Share Functions ====================
function openShareCredentialModal(credentialId) {
    const credential = credentials.find(c => c.id === credentialId);
    if (!credential) {
        addMessageToChat('Erro: Credencial não encontrada para compartilhar.', 'bot');
        return;
    }

    const dataToShare = {
        s: credential.service || '',
        n: credential.site,
        l: credential.login,
        p: credential.password
    };

    try {
        const jsonString = JSON.stringify(dataToShare);
        const encryptedLink = btoa(unescape(encodeURIComponent(jsonString)));

        if (sharedLinkTextarea) sharedLinkTextarea.value = encryptedLink;
        if (copyShareFeedback) copyShareFeedback.textContent = '';
        if (copySharedLinkButton) {
            copySharedLinkButton.textContent = 'Copiar Código';
            copySharedLinkButton.classList.remove('bg-green-700');
        }

        if (shareCredentialModal) {
            shareCredentialModal.classList.remove('hidden');
            shareCredentialModal.classList.add('flex');
        }
    } catch (error) {
        console.error('Erro ao gerar link de compartilhamento:', error);
        addMessageToChat('Ocorreu um erro ao tentar gerar o link de compartilhamento.', 'bot');
    }
}

function closeShareCredentialModal() {
    if (shareCredentialModal) {
        shareCredentialModal.classList.add('hidden');
        shareCredentialModal.classList.remove('flex');
    }
    if (sharedLinkTextarea) sharedLinkTextarea.value = '';
}

function handleDecryptSharedLink() {
    if (!pasteSharedLinkInput || !decryptError || !decryptedCredentialDisplayArea) return;

    const sharedLink = pasteSharedLinkInput.value.trim();
    decryptError.classList.add('hidden');
    decryptError.textContent = '';
    decryptedCredentialDisplayArea.innerHTML = '';
    decryptedCredentialDisplayArea.classList.add('hidden');

    if (!sharedLink) {
        decryptError.textContent = 'Por favor, cole um código de compartilhamento.';
        decryptError.classList.remove('hidden');
        return;
    }

    const linkHash = generateSimpleHash(sharedLink);

    if (viewedSharedLinks[linkHash]) {
        decryptError.textContent = 'Este código de compartilhamento já foi visualizado e não pode ser usado novamente neste navegador.';
        decryptError.classList.remove('hidden');
        pasteSharedLinkInput.value = '';
        return;
    }

    try {
        const jsonString = decodeURIComponent(escape(atob(sharedLink)));
        const sharedData = JSON.parse(jsonString);

        if (sharedData && sharedData.n && sharedData.l && sharedData.p) {
            pasteSharedLinkInput.value = '';

            const tempId = 'shared-login-' + generateId();
            let displayHtml = '<h4 class="shared-access-title">Acesso Compartilhado:</h4>';
            displayHtml += formatCredentialForDisplay(sharedData, tempId, true);
            displayHtml += '<p class="shared-access-note">Lembre-se: este acesso foi compartilhado com você. Trate esta informação com cuidado. Este código não poderá ser usado novamente neste navegador.</p>';

            if (loginScreen && !loginScreen.classList.contains('hidden')) {
                if (decryptedCredentialDisplayArea) {
                    decryptedCredentialDisplayArea.innerHTML = displayHtml;
                    decryptedCredentialDisplayArea.classList.remove('hidden');
                }
            } else if (appScreen && !appScreen.classList.contains('hidden') && chatMessagesElem) {
                addMessageToChat('Código de compartilhamento recebido:', 'user');
                addMessageToChat(displayHtml, 'bot', true);
            } else {
                alert(`Acesso Compartilhado (uso único):\nServiço/Categoria: ${sharedData.s || 'N/A'}\nSite/Aplicação: ${sharedData.n}\nLogin: ${sharedData.l}\nSenha: ${sharedData.p}`);
            }

            viewedSharedLinks[linkHash] = true;
            saveViewedSharedLinks();

        } else {
            throw new Error('Formato do código compartilhado inválido.');
        }
    } catch (error) {
        console.error('Erro ao desencriptar link:', error);
        decryptError.textContent = 'Código de compartilhamento inválido ou corrompido.';
        decryptError.classList.remove('hidden');
        if (pasteSharedLinkInput) pasteSharedLinkInput.value = '';
    }
}

// ==================== Settings Modal ====================
function openChangeMasterPasswordModal() {
    if (changeMasterPasswordModal) {
        changeMasterPasswordModal.classList.remove('hidden');
        changeMasterPasswordModal.classList.add('flex');
    }
    if (changeMasterPasswordForm) changeMasterPasswordForm.reset();
    if (changeMasterPasswordError) changeMasterPasswordError.classList.add('hidden');
}

function closeChangeMasterPasswordModal() {
    if (changeMasterPasswordModal) {
        changeMasterPasswordModal.classList.add('hidden');
        changeMasterPasswordModal.classList.remove('flex');
    }
    if (changeMasterPasswordForm) changeMasterPasswordForm.reset();
}

// ==================== Collab & Terms ====================
async function submitCollabInfo(e) {
    e.preventDefault();
    localStorage.setItem(COLLAB_INFO_SHOWN_KEY, 'true');
    if (collabInfoModal) {
        collabInfoModal.classList.add('hidden');
        collabInfoModal.classList.remove('flex');
    }
}

function skipCollabInfo() {
    localStorage.setItem(COLLAB_INFO_SHOWN_KEY, 'true');
    if (collabInfoModal) {
        collabInfoModal.classList.add('hidden');
        collabInfoModal.classList.remove('flex');
    }
}

function acceptTerms() {
    localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
    if (termsModal) {
        termsModal.classList.add('hidden');
        termsModal.classList.remove('flex');
    }
}

// ==================== Reset App ====================
function resetApp() {
    if (confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não afeta o banco de dados.')) {
        localStorage.clear();
        location.reload();
    }
}

// ==================== Event Listeners ====================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = loginEmailInput?.value?.trim() || '';
        const password = masterPasswordInput?.value || '';
        const confirmPassword = confirmMasterPasswordInput?.value || '';

        if (!email || !password) {
            showLoginError('Por favor, preencha todos os campos.');
            return;
        }

        if (isSignUpMode) {
            if (password !== confirmPassword) {
                showLoginError('As senhas não coincidem.');
                return;
            }

            const strength = evaluatePasswordStrength(password);
            if (strength.score < 3) {
                showLoginError('Use uma senha mais forte (mínimo: 8 caracteres, maiúsculas, minúsculas e números).');
                return;
            }

            const success = await handleSignUp(email, password);
            if (success) {
                showLoginError('Conta criada! Verifique seu e-mail e clique no link de verificação para acessar o SenhaMestra.');
                loginForm.reset();
                if (isSignUpMode) {
                    toggleLoginMode();
                }
            }
        } else {
            const success = await handleLogin(email, password);
            if (success) {
                credentials = await loadCredentialsFromSupabase();
                showAppScreen();
                clearChat();
                addMessageToChat('👋 Bem-vindo de volta! Como posso ajudá-lo hoje?', 'bot');
                renderSuggestions();
            }
        }
    });
}

if (loginModeToggle) {
    loginModeToggle.addEventListener('click', toggleLoginMode);
}

if (masterPasswordInput) {
    masterPasswordInput.addEventListener('input', () => {
        if (masterPasswordStrengthSetupDiv && isSignUpMode) {
            const barElem = masterPasswordStrengthSetupDiv.querySelector('.h-full');
            const textElem = masterPasswordStrengthSetupDiv.querySelector('.text-xs');
            if (barElem && textElem) {
                updatePasswordStrengthDisplay(masterPasswordInput.value, barElem, textElem);
            }
        }
    });
}

// 🔹 Força da senha da credencial
if (sitePasswordInput && sitePasswordStrengthDiv) {
    sitePasswordInput.addEventListener('input', () => {
        const barElem = sitePasswordStrengthDiv.querySelector('.h-full');
        const textElem = sitePasswordStrengthDiv.querySelector('.text-xs');
        if (barElem && textElem) {
            updatePasswordStrengthDisplay(sitePasswordInput.value, barElem, textElem);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}

if (resetAppButton) {
    resetAppButton.addEventListener('click', resetApp);
}

if (settingsButton) {
    settingsButton.addEventListener('click', openChangeMasterPasswordModal);
}

if (closeChangeMasterPasswordModalButton) {
    closeChangeMasterPasswordModalButton.addEventListener('click', closeChangeMasterPasswordModal);
}

if (acceptTermsAndContinueButton) {
    acceptTermsAndContinueButton.addEventListener('click', acceptTerms);
}

if (collabInfoForm) {
    collabInfoForm.addEventListener('submit', submitCollabInfo);
}

if (skipCollabInfoButton) {
    skipCollabInfoButton.addEventListener('click', skipCollabInfo);
}

if (decryptSharedLinkButton) {
    decryptSharedLinkButton.addEventListener('click', handleDecryptSharedLink);
}

if (pasteSharedLinkInput) {
    pasteSharedLinkInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleDecryptSharedLink();
        }
    });
}

if (copySharedLinkButton) {
    copySharedLinkButton.addEventListener('click', async () => {
        if (!sharedLinkTextarea) return;
        const text = sharedLinkTextarea.value.trim();
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            if (copyShareFeedback) {
                copyShareFeedback.textContent = 'Código copiado!';
            }
            copySharedLinkButton.textContent = 'Copiado!';
            copySharedLinkButton.classList.add('bg-green-700');
        } catch (error) {
            console.error('Erro ao copiar código:', error);
        }
    });
}

if (closeShareModalButton) {
    closeShareModalButton.addEventListener('click', closeShareCredentialModal);
}

if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = chatInputElem?.value || '';
        if (userInput.trim()) {
            processUserMessage(userInput);
            if (chatInputElem) chatInputElem.value = '';
        }
    });
}

if (credentialForm) {
    credentialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCredential();
    });
}

if (closeModalButton) {
    closeModalButton.addEventListener('click', closeCredentialModal);
}

if (changeMasterPasswordModal) {
    changeMasterPasswordModal.addEventListener('click', (event) => {
        if (event.target === changeMasterPasswordModal) {
            closeChangeMasterPasswordModal();
        }
    });
}

if (credentialModal) {
    credentialModal.addEventListener('click', (event) => {
        if (event.target === credentialModal) {
            closeCredentialModal();
        }
    });
}

if (togglePasswordVisibilityButton) {
    togglePasswordVisibilityButton.addEventListener('click', () => {
        if (sitePasswordInput) {
            const isPassword = sitePasswordInput.type === 'password';
            sitePasswordInput.type = isPassword ? 'text' : 'password';
            
            if (eyeIconOpen && eyeIconClosed) {
                eyeIconOpen.classList.toggle('hidden');
                eyeIconClosed.classList.toggle('hidden');
            }
        }
    });
}

// ==================== Initialization ====================
async function initializeApp() {
    console.log('Inicializando SenhaMestra...');

    if (!supabaseClient) {
        console.error('Supabase não inicializado. Verifique se o script do Supabase foi carregado corretamente.');
        showLoginScreen();
        return;
    }

    loadViewedSharedLinks();

    try {
        const { data } = await supabaseClient.auth.getUser();

        // Se já houver usuário na sessão, só preenche o e-mail pra facilitar
        if (data && data.user) {
            currentUser = data.user;
            if (loginEmailInput) {
                loginEmailInput.value = data.user.email;
            }
        }
    } catch (error) {
        console.warn('Não foi possível recuperar usuário logado:', error);
    }

    // Sempre mostra a tela de login para poder derivar a chave com a senha digitada
    showLoginScreen();
}

// Make functions available globally for HTML onclick handlers
window.openEditCredentialModal = openEditCredentialModal;
window.confirmDeleteCredential = confirmDeleteCredential;
window.openShareCredentialModal = openShareCredentialModal;

// Start the app
initializeApp();
