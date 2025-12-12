tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                ipace: {
                    blue: '#2cc3f3',
                    pink: '#ee3a7b',
                    orange: '#faa82e',
                    green: '#9ccc51',
                    white: '#ffffff',
                    text: '#4b5563',
                    title: '#374151',
                },
            },
        },
    },
};

window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const closeBtn = document.getElementById('close-menu-btn');
    const links = document.querySelectorAll('.mobile-link');
    const navbar = document.getElementById('navbar');

    const toggleMenu = () => {
        const isClosed = menu.classList.contains('translate-x-full');
        if (isClosed) {
            menu.classList.remove('translate-x-full');
            menu.classList.add('translate-x-0');
            document.body.style.overflow = 'hidden';
        } else {
            menu.classList.remove('translate-x-0');
            menu.classList.add('translate-x-full');
            document.body.style.overflow = '';
        }
    };

    if (btn && menu) {
        btn.addEventListener('click', toggleMenu);
    }
    if (closeBtn && menu) {
        closeBtn.addEventListener('click', toggleMenu);
    }
    if (links && links.length > 0 && menu) {
        links.forEach(link => link.addEventListener('click', toggleMenu));
    }

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-md');
                navbar.classList.add('py-0');
            } else {
                navbar.classList.remove('shadow-md');
                navbar.classList.remove('py-0');
            }
        });
    }

    // Animação de contador nos números
    const animateCounters = () => {
        const counters = document.querySelectorAll('.counter');
        const duration = 2000; // 2 segundos
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + (target === 1000 ? '' : '');
                }
            };
            
            updateCounter();
        });
    };

    // Inicia animação quando seção é visível
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    });

    const statsSection = document.querySelector('.bg-ipace-blue');
    if (statsSection) {
        observer.observe(statsSection);
    }
});
