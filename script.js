// Configurações e constantes
const PRODUCTS = {
    // Lanches
    'casa': { 
        name: 'Pão da Casa', 
        price: 20.00, 
        category: 'lanche',
        description: 'Pão, carne 100g, queijo, alface e banana frita, cebola roxa',
        available: true
    },
    'titi': { 
        name: 'Pão do Titi', 
        price: 27.00, 
        category: 'lanche',
        description: 'Pão, carne 150g, queijo, bacon, alface, cebola roxa e banana frita',
        available: true
    },
    'premium': { 
        name: 'Costela Premium', 
        price: 29.90, 
        category: 'lanche',
        description: 'Pão baguete, costela defumada 180g, queijo cheddar, cebola caramelizada e molho barbecue',
        available: false
    },
    // Bebidas
    'agua_mineral': { name: 'Água Mineral', price: 3.00, category: 'bebida', available: true },
    'agua_gas': { name: 'Água Mineral c/ Gás', price: 4.00, category: 'bebida', available: true },
    'refri_lata': { name: 'Refrigerante Lata', price: 5.00, category: 'bebida', available: true },
    'refri_1l': { name: 'Refrigerante 1L', price: 10.00, category: 'bebida', available: true },
    // Porções
    'batata_150': { name: 'Batata Frita 150g', price: 10.00, category: 'porcao', available: true },
    'batata_300': { name: 'Batata Frita 300g', price: 15.00, category: 'porcao', available: true }
};

const ADDITIONALS = {
  //  'vinagrete': { name: 'Vinagrete', price: 3.00 },
    'requeijao': { name: 'Requeijão', price: 3.00 },
    'bacon': { name: 'Bacon', price: 3.00 },
    'banana': { name: 'Banana', price: 2.00 }
};

const CONFIG = {
    deliveryText: "A combinar", // Alterado para texto em vez de valor fixo
    whatsappNumber: '5569992588282',
    prepareTime: '15-20',
    minDeliveryValue: 0
};

// Estado da aplicação
let cart = {};
let isDelivery = false;
let currentCustomizing = null;

// Elementos DOM
const elements = {
    cartItems: document.getElementById('cart-items'),
    cartTotal: document.getElementById('cart-total'),
    deliveryFeeContainer: document.getElementById('delivery-fee-container'),
    deliveryFeeValue: document.getElementById('delivery-fee-value'),
    customerModal: document.getElementById('customer-modal'),
    customizeModal: document.getElementById('customize-modal'),
    modalTitle: document.getElementById('modal-title'),
    deliveryFields: document.getElementById('delivery-fields'),
    localInstructions: document.getElementById('local-instructions'),
    addressFields: document.getElementById('address-fields')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCartDisplay();
    enhanceTouchExperience();
});

// Event Listeners
function initializeEventListeners() {
    // Botões de delivery/local
    document.getElementById('local-btn').addEventListener('click', () => toggleDeliveryOption(false));
    document.getElementById('viagem-btn').addEventListener('click', () => toggleDeliveryOption(true));

    // Botões de quantidade (bebidas e porções)
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            const action = this.dataset.action;
            updateQuantity(productId, action === 'increase' ? 1 : -1);
        });
    });

    // Botões adicionar direto (bebidas e porções)
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            addToCartDirect(productId);
        });
    });

    // Botões adicionar direto (lanches sem personalização)
    document.querySelectorAll('.add-to-cart-direct').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            addToCartDirect(productId);
        });
    });

    // Botões personalizar (lanches)
    document.querySelectorAll('.customize-btn').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.product;
            openCustomizeModal(productId);
        });
    });

    // Modal de personalização
    document.getElementById('cancel-customize').addEventListener('click', closeCustomizeModal);
    document.getElementById('add-customized').addEventListener('click', addCustomizedToCart);
    
    // Adicionar listeners para adicionais
    document.querySelectorAll('input[name="additional"]').forEach(input => {
        input.addEventListener('change', updateCustomizeTotal);
    });

    // Modal do cliente
    document.getElementById('finalizar-pedido').addEventListener('click', finalizarPedido);
    document.getElementById('buscar-cep').addEventListener('click', buscarCep);
    document.getElementById('cancelar-pedido').addEventListener('click', closeCustomerModal);
    document.getElementById('enviar-whatsapp').addEventListener('click', enviarPedidoWhatsApp);

    // Formatação de campos
    document.getElementById('customer-cep').addEventListener('input', formatarCep);
    document.getElementById('customer-phone').addEventListener('input', formatarTelefone);

    // Listener para tecla ESC fechar modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.customizeModal.style.display === 'flex') {
                closeCustomizeModal();
            }
            if (elements.customerModal.style.display === 'flex') {
                closeCustomerModal();
            }
        }
    });
}

// Alternar opção de delivery
function toggleDeliveryOption(delivery) {
    isDelivery = delivery;
    
    document.getElementById('local-btn').classList.toggle('active', !delivery);
    document.getElementById('viagem-btn').classList.toggle('active', delivery);
    
    updateCartDisplay();
}

// Atualizar quantidade
function updateQuantity(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    let quantity = parseInt(qtyElement.textContent);
    quantity += change;
    
    if (quantity < 0) quantity = 0;
    
    qtyElement.textContent = quantity;
}

// Adicionar ao carrinho direto (sem personalização)
function addToCartDirect(productId) {
    const product = PRODUCTS[productId];
    if (!product || !product.available) {
        showFeedback('Este produto não está disponível no momento.', 'error');
        return;
    }

    // Para bebidas e porções, usar a quantidade selecionada
    let quantity = 1;
    const qtyElement = document.getElementById(`qty-${productId}`);
    if (qtyElement) {
        quantity = parseInt(qtyElement.textContent);
        if (quantity <= 0) {
            showFeedback('Selecione uma quantidade antes de adicionar.', 'error');
            return;
        }
        qtyElement.textContent = '0'; // Resetar
    }

    addItemToCart(productId, quantity);
}

// Adicionar item ao carrinho (função genérica)
function addItemToCart(productId, quantity = 1, additionals = [], notes = '') {
    const product = PRODUCTS[productId];
    if (!product) return;

    const itemId = generateItemId(productId, additionals);
    
    if (cart[itemId]) {
        cart[itemId].quantity += quantity;
    } else {
        let totalPrice = product.price;
        let additionalsInfo = [];
        
        // Calcular preço dos adicionais
        additionals.forEach(additionalId => {
            const additional = ADDITIONALS[additionalId];
            if (additional) {
                totalPrice += additional.price;
                additionalsInfo.push(additional.name);
            }
        });

        cart[itemId] = {
            productId: productId,
            name: product.name,
            basePrice: product.price,
            totalPrice: totalPrice,
            quantity: quantity,
            additionals: additionals,
            additionalsInfo: additionalsInfo,
            notes: notes,
            category: product.category
        };
    }
    
    updateCartDisplay();
    showFeedback(`${product.name} adicionado ao carrinho!`, 'success');
}

// Gerar ID único para item (considerando adicionais)
function generateItemId(productId, additionals = []) {
    const additionalsStr = additionals.sort().join(',');
    return `${productId}_${additionalsStr}`;
}

// Abrir modal de personalização
function openCustomizeModal(productId) {
    const product = PRODUCTS[productId];
    if (!product || !product.available) {
        showFeedback('Este produto não está disponível no momento.', 'error');
        return;
    }

    currentCustomizing = productId;
    
    // Atualizar título
    document.getElementById('customize-title').textContent = `Personalizar ${product.name}`;
    
    // Mostrar info do produto base
    document.getElementById('base-product-info').innerHTML = `
        <div class="base-product-name">${product.name}</div>
        <div class="base-product-price">R$ ${product.price.toFixed(2)}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">${product.description}</div>
    `;
    
    // Limpar seleções anteriores
    document.querySelectorAll('input[name="additional"]').forEach(input => {
        input.checked = false;
    });
    document.getElementById('item-notes').value = '';
    
    updateCustomizeTotal();
    elements.customizeModal.style.display = 'flex';
}

// Fechar modal de personalização
function closeCustomizeModal() {
    elements.customizeModal.style.display = 'none';
    currentCustomizing = null;
}

// Atualizar total da personalização
function updateCustomizeTotal() {
    if (!currentCustomizing) return;
    
    const product = PRODUCTS[currentCustomizing];
    let total = product.price;
    
    document.querySelectorAll('input[name="additional"]:checked').forEach(input => {
        total += parseFloat(input.dataset.price);
    });
    
    document.getElementById('customize-total-value').textContent = `R$ ${total.toFixed(2)}`;
}

// Adicionar item personalizado ao carrinho
function addCustomizedToCart() {
    if (!currentCustomizing) return;
    
    const additionals = [];
    document.querySelectorAll('input[name="additional"]:checked').forEach(input => {
        additionals.push(input.value);
    });
    
    const notes = document.getElementById('item-notes').value.trim();
    
    addItemToCart(currentCustomizing, 1, additionals, notes);
    closeCustomizeModal();
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
    elements.cartItems.innerHTML = '';
    
    let subtotal = 0;
    const itemCount = Object.keys(cart).length;
    
    if (itemCount === 0) {
        elements.cartItems.innerHTML = '<div class="empty-cart">Seu carrinho está vazio</div>';
        elements.deliveryFeeContainer.style.display = 'none';
        elements.cartTotal.textContent = 'R$ 0,00';
        return;
    }
    
    // Renderizar itens do carrinho
    for (const itemId in cart) {
        const item = cart[itemId];
        const itemTotal = item.totalPrice * item.quantity;
        subtotal += itemTotal;
        
        const cartItemElement = createCartItemElement(itemId, item, itemTotal);
        elements.cartItems.appendChild(cartItemElement);
    }
    
    // Calcular total - SEM adicionar taxa de entrega
    let total = subtotal;
    
    // Mostrar apenas a mensagem "Entrega a combinar" para delivery
    if (isDelivery && subtotal > 0) {
        elements.deliveryFeeContainer.style.display = 'block';
        elements.deliveryFeeValue.textContent = CONFIG.deliveryText;
    } else {
        elements.deliveryFeeContainer.style.display = 'none';
    }
    
    elements.cartTotal.textContent = `R$ ${total.toFixed(2)}`;
    
    // Adicionar event listeners aos botões de quantidade do carrinho
    document.querySelectorAll('.cart-qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.item;
            const action = this.dataset.action;
            changeCartItemQuantity(itemId, action === 'increase' ? 1 : -1);
        });
    });
}

// Criar elemento do item do carrinho
function createCartItemElement(itemId, item, itemTotal) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    let additionalsHtml = '';
    if (item.additionalsInfo && item.additionalsInfo.length > 0) {
        additionalsHtml = `<div class="cart-item-details">+ ${item.additionalsInfo.join(', ')}</div>`;
    }
    
    let notesHtml = '';
    if (item.notes) {
        notesHtml = `<div class="cart-item-details">Obs: ${item.notes}</div>`;
    }
    
    cartItem.innerHTML = `
        <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${additionalsHtml}
            ${notesHtml}
            <div class="cart-item-price">R$ ${item.totalPrice.toFixed(2)} cada</div>
        </div>
        <div class="cart-item-quantity">
            <button class="qty-btn cart-qty-btn" data-item="${itemId}" data-action="decrease">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn cart-qty-btn" data-item="${itemId}" data-action="increase">+</button>
        </div>
        <div class="cart-item-total">R$ ${itemTotal.toFixed(2)}</div>
    `;
    
    return cartItem;
}

// Alterar quantidade no carrinho
function changeCartItemQuantity(itemId, change) {
    if (cart[itemId]) {
        cart[itemId].quantity += change;
        
        if (cart[itemId].quantity <= 0) {
            delete cart[itemId];
        }
        
        updateCartDisplay();
    }
}

// Finalizar pedido
function finalizarPedido() {
    if (Object.keys(cart).length === 0) {
        showFeedback('Adicione itens ao carrinho antes de finalizar o pedido.', 'error');
        return;
    }
    
    openCustomerModal();
}

// Abrir modal do cliente
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

// Fechar modal do cliente
function closeCustomerModal() {
    elements.customerModal.style.display = 'none';
}

// Buscar CEP
function buscarCep() {
    const cep = document.getElementById('customer-cep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        showFeedback('CEP inválido. Digite um CEP com 8 dígitos.', 'error');
        return;
    }
    
    const cepButton = document.getElementById('buscar-cep');
    cepButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    cepButton.disabled = true;
    
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                showFeedback('CEP não encontrado. Preencha o endereço manualmente.', 'error');
                elements.addressFields.style.display = 'block';
            } else {
                document.getElementById('customer-address').value = data.logradouro || '';
                document.getElementById('customer-neighborhood').value = data.bairro || '';
                document.getElementById('customer-city').value = data.localidade || '';
                document.getElementById('customer-state').value = data.uf || '';
                
                elements.addressFields.style.display = 'block';
                document.getElementById('customer-number').focus();
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            showFeedback('Erro ao buscar CEP. Preencha o endereço manualmente.', 'error');
            elements.addressFields.style.display = 'block';
        })
        .finally(() => {
            cepButton.innerHTML = '<i class="fas fa-search"></i>';
            cepButton.disabled = false;
        });
}

// Formatação de CEP
function formatarCep(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    e.target.value = value;
}

// Formatação de telefone
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
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    
    if (!name || !phone) {
        showFeedback('Por favor, preencha pelo menos seu nome e telefone.', 'error');
        return;
    }
    
    if (!validateForm()) return;
    
    const message = buildWhatsAppMessage(name, phone, notes);
    
    // Enviar para WhatsApp
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Limpar e fechar
    clearFormAndCart();
    closeCustomerModal();
    showFeedback('Pedido enviado com sucesso!', 'success');
}

// Validar formulário
function validateForm() {
    if (isDelivery) {
        const address = document.getElementById('customer-address').value.trim();
        const number = document.getElementById('customer-number').value.trim();
        const neighborhood = document.getElementById('customer-neighborhood').value.trim();
        const city = document.getElementById('customer-city').value.trim();
        const state = document.getElementById('customer-state').value.trim();
        
        if (!address || !number || !neighborhood || !city || !state) {
            showFeedback('Para delivery, é necessário informar o endereço completo.', 'error');
            return false;
        }
    }
    return true;
}

// Construir mensagem do WhatsApp
function buildWhatsAppMessage(name, phone, notes) {
    const orderType = isDelivery ? 'Delivery' : 'Retirada';
    let message = `*NOVO PEDIDO - Costela do Titi*\n\n`;
    message += `*Cliente:* ${name}\n`;
    message += `*Telefone:* ${phone}\n`;
    message += `*Tipo:* ${orderType}\n\n`;
    
    // Endereço para delivery
    if (isDelivery) {
        const address = document.getElementById('customer-address').value.trim();
        const number = document.getElementById('customer-number').value.trim();
        const complement = document.getElementById('customer-complement').value.trim();
        const neighborhood = document.getElementById('customer-neighborhood').value.trim();
        const city = document.getElementById('customer-city').value.trim();
        const state = document.getElementById('customer-state').value.trim();
        
        message += `*Endereço:* ${address}, ${number}`;
        if (complement) message += `, ${complement}`;
        message += ` - ${neighborhood}, ${city}-${state}\n\n`;
    }
    
    // Itens do pedido por categoria
    message += `*ITENS DO PEDIDO:*\n\n`;
    
    const categories = {
        'lanche': '🍔 *LANCHES*',
        'bebida': '🥤 *BEBIDAS*',
        'porcao': '🍟 *PORÇÕES*'
    };
    
    let subtotal = 0;
    
    // Agrupar por categoria
    const itemsByCategory = {};
    for (const itemId in cart) {
        const item = cart[itemId];
        const category = item.category || 'outros';
        
        if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
        }
        itemsByCategory[category].push({ itemId, ...item });
    }
    
    // Exibir itens por categoria
    Object.keys(itemsByCategory).forEach(category => {
        if (categories[category]) {
            message += `${categories[category]}\n`;
        }
        
        itemsByCategory[category].forEach(item => {
            const itemTotal = item.totalPrice * item.quantity;
            subtotal += itemTotal;
            
            message += `• ${item.quantity}x ${item.name}`;
            
            if (item.additionalsInfo && item.additionalsInfo.length > 0) {
                message += ` (+ ${item.additionalsInfo.join(', ')})`;
            }
            
            message += ` - R$ ${itemTotal.toFixed(2)}`;
            
            if (item.notes) {
                message += `\n  _Obs: ${item.notes}_`;
            }
            
            message += `\n`;
        });
        
        message += `\n`;
    });
    
    // Taxa de entrega - agora mostra "a combinar"
    if (isDelivery) {
        message += `📦 *Taxa de entrega:* ${CONFIG.deliveryText}\n\n`;
    }
    
    // Total - apenas o valor dos produtos
    message += `💰 *TOTAL: R$ ${subtotal.toFixed(2)}*\n\n`;
    
    // Observações gerais
    if (notes) {
        message += `📝 *Observações:* ${notes}\n\n`;
    }
    
    // Instruções finais
    if (isDelivery) {
        message += `🚚 *Delivery* - Entrega a combinar\n`;
        message += `Entraremos em contato para combinar valor e tempo de entrega!\n\n`;
    } else {
        message += `🏪 *Retirada no Local* - Tempo estimado: ${CONFIG.prepareTime} minutos\n`;
        message += `Avisaremos quando estiver pronto para retirada!\n\n`;
    }
    
    message += `_Pedido realizado via site_`;
    
    return message;
}

// Limpar formulário e carrinho
function clearFormAndCart() {
    // Limpar carrinho
    cart = {};
    
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
    
    // Resetar quantidades dos produtos
    document.querySelectorAll('.qty-value').forEach(element => {
        element.textContent = '0';
    });
    
    // Esconder campos de endereço
    elements.addressFields.style.display = 'none';
    
    // Atualizar display do carrinho
    updateCartDisplay();
}

// Mostrar feedback para o usuário
function showFeedback(message, type = 'info') {
    // Remover feedback anterior se existir
    const existingFeedback = document.querySelector('.feedback-message');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Criar novo feedback
    const feedback = document.createElement('div');
    feedback.className = `feedback-message feedback-${type}`;
    feedback.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(feedback);
    
    // Animação de entrada
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 3000);
}

// Melhorar experiência de toque para dispositivos móveis
function enhanceTouchExperience() {
    // Aumentar a área de toque para todos os botões
    document.querySelectorAll('button').forEach(button => {
        button.style.minHeight = '44px';
        button.style.minWidth = '44px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
    });
    
    // Prevenir zoom em inputs ao focar (em alguns dispositivos)
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            document.querySelector('meta[name="viewport"]')
                .setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        });
        
        input.addEventListener('blur', () => {
            document.querySelector('meta[name="viewport"]')
                .setAttribute('content', 'width=device-width, initial-scale=1.0');
        });
    });
}

// Inicializar validação de formulário
function initFormValidation() {
    // Validação de nome
    const nameInput = document.getElementById('customer-name');
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            if (!isValidName(this.value)) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }
    
    // Validação de telefone
    const phoneInput = document.getElementById('customer-phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            if (!isValidPhone(this.value)) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }
}

// Função para validar telefone
function isValidPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// Função para validar nome
function isValidName(name) {
    return name.trim().length >= 2;
}

// Inicializar validação de formulário quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initFormValidation);

// Console log para debugging
if (typeof console !== 'undefined') {
    console.log('Sistema Costela do Titi carregado com sucesso!');
}