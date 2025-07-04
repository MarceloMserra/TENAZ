import './style.css'

// Inicializa AOS
AOS.init({
    duration: 600,
    easing: 'ease-out-quad',
    once: true,
    offset: 120
});

// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// --- CÓDIGO DO FORMULÁRIO CORRIGIDO ---
const form = document.getElementById('registration-form');
const formSuccess = document.getElementById('form-success');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o envio padrão
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Enviando...'; // Feedback visual
    submitButton.disabled = true;

    const formData = new FormData(form);
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            // Sucesso!
            formSuccess.classList.remove('hidden');
            form.reset();
            setTimeout(() => {
                formSuccess.classList.add('hidden');
            }, 5000);
        } else {
            // Erro retornado pelo servidor (Formspree)
            const errorData = await response.json();
            alert(`Ocorreu um erro ao enviar o formulário: ${errorData.error || 'Por favor, tente novamente.'}`);
            console.error('Erro do Formspree:', errorData);
        }
    } catch (error) {
        // Erro de rede ou outro problema
        console.error('Erro ao tentar enviar o formulário:', error);
        alert('Não foi possível enviar o formulário. Verifique sua conexão com a internet e tente novamente.');
    } finally {
        // Restaura o botão em qualquer caso (sucesso ou erro)
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Ajuste do offset para o header fixo
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

