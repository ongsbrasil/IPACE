// Handler para modal de "Trabalhe Conosco"
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('colaborador-modal');
    const btnAbrir = document.getElementById('colaborador-btn');
    const btnFechar = document.getElementById('close-colaborador-modal');
    const form = document.getElementById('colaborador-form');
    const messageElement = document.getElementById('form-message');

    // Abrir modal
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    // Fechar modal
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // Enviar formulário via mailto
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nome = document.getElementById('collab-nome').value;
            const email = document.getElementById('collab-email').value;
            const telefone = document.getElementById('collab-telefone').value;

            // Mensagem personalizada
            const mensagem = `Olá, meu nome é ${nome} e gostaria de ser um colaborador de vocês.

Dados de contato:
- Email: ${email}
- Telefone: ${telefone}`;

            // Criar mailto link
            const destinatario = 'contato@ipace.org.br';
            const assunto = 'Interesse em Ser Colaborador - IPACE';
            const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;

            // Abrir cliente de email
            window.location.href = mailtoLink;

            // Mostrar mensagem de feedback
            messageElement.textContent = '✓ Abrindo seu cliente de email...';
            messageElement.className = 'text-sm text-center text-ipace-green font-bold mt-2';

            // Limpar formulário e fechar modal após 2 segundos
            setTimeout(() => {
                form.reset();
                modal.classList.add('hidden');
                messageElement.textContent = '';
            }, 2000);
        });
    }
});

