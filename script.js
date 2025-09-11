// Constantes e configurações
const PRODUCTS = {
    'casa': { name: 'Pão da Casa', price: 20.00 },
    'titi': { name: 'Pão do Titi', price: 25.00 },
    'premium': { name: 'Costela Premium', price: 29.90 }
};

const DELIVERY_FEE = 5.00;
const WHATSAPP_NUMBER = '5511999999999'; // Substitua pelo número real

// Estado da aplicação
let cart = {};
let isDelivery = false;

// Elementos do DOM
const elements = {
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    deliveryFeeContainer: document.getElementById('delivery-fee-container'),
    deliveryFeeValue: document.getElementById('delivery-fee-value'),
    customerModal: document.getElementById('customer-modal'),
    modalTitle: document.getElementById('modal-title'),
    deliveryFields: document.getElementById('delivery-fields'),
    localInstructions: document.getElementById('local-instructions'),
    addressFields: document.getElementById('address-fields')
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

// Configuração dos event listeners
function initializeEventListeners() {
    // Botões de quantidade
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            const action = this.dataset.action;
            updateQuantity(productId, action === 'increase' ? 1 : -1);
        });
    });

    // Botões de adicionar ao carrinho
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            addToCart(productId);
        });
    });

    // Botões de entrega/retirada
    document.getElementById('local-btn').addEventListener('click', () => toggleDeliveryOption(false));
    document.getElementById('viagem-btn').addEventListener('click', () => toggleDeliveryOption(true));

    // Botão finalizar pedido
    document.getElementById('finalizar-pedido').addEventListener('click', finalizarPedido);

    // Botões do modal
    document.getElementById('buscar-cep').addEventListener('click', buscarCep);
    document.getElementById('cancelar-pedido').addEventListener('click', closeCustomerModal);
    document.getElementById('enviar-whatsapp').addEventListener('click', enviarPedidoWhatsApp);

    // Formatação de campos
    document.getElementById('customer-cep').addEventListener('input', formatarCep);
    document.getElementById('customer-phone').addEventListener('input', formatarTelefone);
}

// Alternar entre opções de entrega
function toggleDeliveryOption(delivery) {
    isDelivery = delivery;
    
    document.getElementById('local-btn').classList.toggle('active', !delivery);
    document.getElementById('viagem-btn').classList.toggle('active', delivery);
    
    updateCartDisplay();
}

// Atualizar quantidade do produto
function updateQuantity(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    let quantity = parseInt(qtyElement.textContent);
    quantity += change;
    
    if (quantity < 0) quantity = 0;
    
    qtyElement.textContent = quantity;
}

// Adicionar ao carrinho
function addToCart(productId) {
    const quantity = parseInt(document.getElementById(`qty-${productId}`).textContent);
    
    if (quantity > 0) {
        if (cart[productId]) {
            cart[productId].quantity += quantity;
        } else {
            cart[productId] = {
                name: PRODUCTS[productId].name,
                price: PRODUCTS[productId].price,
                quantity: quantity
            };
        }
        
        // Resetar quantidade
        document.getElementById(`qty-${productId}`).textContent = '0';
        
        updateCartDisplay();
    }
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
    // Limpar carrinho
    elements.cartItems.innerHTML = '';
    
    let subtotal = 0;
    
    // Adicionar itens
    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn" data-product="${productId}" data-action="decrease">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-product="${productId}" data-action="increase">+</button>
            </div>
            <div class="cart-item-total">R$ ${itemTotal.toFixed(2)}</div>
        `;
        
        elements.cartItems.appendChild(cartItem);
        
        // Adicionar event listeners aos novos botões
        cartItem.querySelectorAll('.qty-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.product;
                const action = this.dataset.action;
                changeCartQuantity(productId, action === 'increase' ? 1 : -1);
            });
        });
    }
    
    // Calcular total com taxa de entrega se for delivery
    let total = subtotal;
    if (isDelivery && subtotal > 0) {
        elements.deliveryFeeContainer.style.display = 'block';
        elements.deliveryFeeValue.textContent = `R$ ${DELIVERY_FEE.toFixed(2)}`;
        total += DELIVERY_FEE;
    } else {
        elements.deliveryFeeContainer.style.display = 'none';
    }
    
    // Atualizar total
    elements.cartTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    // Mostrar mensagem se carrinho estiver vazio
    if (Object.keys(cart).length === 0) {
        elements.cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio</div>';
        elements.deliveryFeeContainer.style.display = 'none';
    }
}

// Alterar quantidade no carrinho
function changeCartQuantity(productId, change) {
    if (cart[productId]) {
        cart[productId].quantity += change;
        
        if (cart[productId].quantity <= 0) {
            delete cart[productId];
        }
        
        updateCartDisplay();
    }
}

// Finalizar pedido
function finalizarPedido() {
    if (Object.keys(cart).length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar o pedido.');
        return;
    }
    
    // Abre o modal para coletar informações
    openCustomerModal();
}

// Abrir modal para informações do cliente
function openCustomerModal() {
    if (isDelivery) {
        elements.modalTitle.textContent = 'Informações para Entrega';
        elements.deliveryFields.style.display = 'block';
        elements.localInstructions.style.display = 'none';
    } else {
        elements.modalTitle.textContent = 'Informações para Consumo no Local';
        elements.deliveryFields.style.display = 'none';
        elements.localInstructions.style.display = 'block';
    }
    
    elements.customerModal.style.display = 'flex';
}

// Fechar modal
function closeCustomerModal() {
    elements.customerModal.style.display = 'none';
}

// Buscar CEP
function buscarCep() {
    const cep = document.getElementById('customer-cep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        alert('CEP inválido. Digite um CEP com 8 dígitos.');
        return;
    }
    
    // Exibir loading
    const cepButton = document.getElementById('buscar-cep');
    cepButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Fazer requisição para a API ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                alert('CEP não encontrado. Preencha o endereço manualmente.');
            } else {
                document.getElementById('customer-address').value = data.logradouro;
                document.getElementById('customer-neighborhood').value = data.bairro;
                document.getElementById('customer-city').value = data.localidade;
                document.getElementById('customer-state').value = data.uf;
                
                // Mostrar campos de endereço
                elements.addressFields.style.display = 'block';
                
                // Dar foco no campo número
                document.getElementById('customer-number').focus();
            }
            
            // Restaurar ícone de busca
            cepButton.innerHTML = '<i class="fas fa-search"></i>';
        })
        .catch(error => {
            alert('Erro ao buscar CEP. Preencha o endereço manualmente.');
            console.error('Erro:', error);
            
            // Mostrar campos de endereço mesmo com erro
            elements.addressFields.style.display = 'block';
            
            // Restaurar ícone de busca
            cepButton.innerHTML = '<i class="fas fa-search"></i>';
        });
}

// Formatar CEP
function formatarCep(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    e.target.value = value;
}

// Formatar telefone
function formatarTelefone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
        value = '(' + value;
        if (value.length > 3) {
            value = value.substring(0, 3) + ') ' + value.substring(3);
        }
        if (value.length > 10) {
            value = value.substring(0, 10) + '-' + value.substring(10, 14);
        }
    }
    e.target.value = value;
}

// Enviar pedido por WhatsApp
function enviarPedidoWhatsApp() {
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const notes = document.getElementById('customer-notes').value;
    
    if (!name || !phone) {
        alert('Por favor, preencha pelo menos seu nome e telefone.');
        return;
    }
    
    const orderType = isDelivery ? 'Delivery' : 'Retirada';
    let message = `*NOVO PEDIDO - Costela do Titi*%0A%0A`;
    message += `*Cliente:* ${name}%0A`;
    message += `*Telefone:* ${phone}%0A`;
    message += `*Tipo:* ${orderType}%0A%0A`;
    
    // Adicionar endereço se for delivery
    if (isDelivery) {
        const address = document.getElementById('customer-address').value;
        const number = document.getElementById('customer-number').value;
        const complement = document.getElementById('customer-complement').value;
        const neighborhood = document.getElementById('customer-neighborhood').value;
        const city = document.getElementById('customer-city').value;
        const state = document.getElementById('customer-state').value;
        
        if (address && number && neighborhood && city && state) {
            message += `*Endereço:* ${address}, ${number}`;
            if (complement) message += `, ${complement}`;
            message += ` - ${neighborhood}, ${city}-${state}%0A%0A`;
        } else {
            alert('Para delivery, é necessário informar o endereço completo.');
            return;
        }
    }
    
    message += `*Itens do Pedido:*%0A`;
    
    let subtotal = 0;
    for (const productId in cart) {
        const item = cart[productId];
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        message += `➡️ ${item.quantity}x ${item.name} - R$ ${itemTotal.toFixed(2)}%0A`;
    }
    
    // Adicionar taxa de entrega se for delivery
    if (isDelivery) {
        message += `📦 *Taxa de entrega:* R$ ${DELIVERY_FEE.toFixed(2)}%0A`;
    }
    
    // Calcular total
    const total = isDelivery ? subtotal + DELIVERY_FEE : subtotal;
    
    message += `%0A*Total: R$ ${total.toFixed(2)}*%0A%0A`;
    
    // Adicionar observações se houver
    if (notes) {
        message += `*Observações:* ${notes}%0A%0A`;
    }
    
    // Adicionar instruções específicas
    if (!isDelivery) {
        message += `*Instruções para retirada:*%0A`;
        message += `Seu pedido ficará pronto em aproximadamente 15-20 minutos.%0A`;
        message += `Avisaremos pelo telefone quando estiver pronto para retirada!%0A%0A`;
    }
    
    message += `*Pedido realizado via site*`;
    
    // Abrir WhatsApp
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    
    // Fechar modal e limpar carrinho
    closeCustomerModal();
    cart = {};
    updateCartDisplay();
    
    // Limpar formulário
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('customer-cep').value = '';
    document.getElementById('customer-address').value = '';
    document.getElementById('customer-number').value = '';
    document.getElementById('customer-complement').value = '';
    document.getElementById('customer-neighborhood').value = '';
    document.getElementById('customer-city').value = '';
    document.getElementById('customer-state').value = '';
    document.getElementById('customer-notes').value = '';
    
    // Esconder campos de endereço
    elements.addressFields.style.display = 'none';
}