import './style.css'

// Função para exibir uma mensagem personalizada na tela (substitui alert())
function showCustomMessage(message, type = 'info') {
    let messageBox = document.getElementById('custom-message-box');
    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'custom-message-box';
        // Estilos básicos para a caixa de mensagem
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
            text-align: center;
            max-width: 90%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(messageBox);
    }

    messageBox.textContent = message;
    // Define as cores da caixa de mensagem com base no tipo
    if (type === 'success') {
        messageBox.style.backgroundColor = '#4CAF50'; // Verde para sucesso
        messageBox.style.color = 'white';
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#F44336'; // Vermelho para erro
        messageBox.style.color = 'white';
    } else { // info ou padrão
        messageBox.style.backgroundColor = '#2196F3'; // Azul para informação
        messageBox.style.color = 'white';
    }

    messageBox.style.opacity = '1'; // Torna a caixa visível

    // Esconde a caixa de mensagem após 5 segundos
    setTimeout(() => {
        messageBox.style.opacity = '0';
        // Remove o elemento do DOM após a transição para limpar
        setTimeout(() => {
            if (messageBox.parentNode) {
                messageBox.parentNode.removeChild(messageBox);
            }
        }, 500); // Duração da transição
    }, 5000); // Mensagem visível por 5 segundos
}


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
            formSuccess.classList.remove('hidden'); // Exibe a mensagem de sucesso no formulário
            form.reset(); // Limpa o formulário
            showCustomMessage('Cadastro enviado com sucesso! Em breve entraremos em contato.', 'success');
            setTimeout(() => {
                formSuccess.classList.add('hidden');
            }, 5000);
        } else {
            // Erro retornado pelo servidor (Formspree)
            const errorData = await response.json();
            console.error('Erro do Formspree:', errorData);
            showCustomMessage(`Ocorreu um erro ao enviar o formulário: ${errorData.error || 'Por favor, tente novamente.'}`, 'error');
        }
    } catch (error) {
        // Erro de rede ou outro problema
        console.error('Erro ao tentar enviar o formulário:', error);
        showCustomMessage('Não foi possível enviar o formulário. Verifique sua conexão com a internet e tente novamente.', 'error');
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
