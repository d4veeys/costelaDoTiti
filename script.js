/**
 * Sistema de Delivery - Costela do Titi
 * Script principal com todas as funcionalidades
 */

class DeliveryApp {
    constructor() {
        this.cart = this.loadFromStorage('cart') || [];
        this.deliveryMode = this.loadFromStorage('deliveryMode') || 'local';
        this.customerData = this.loadFromStorage('customerData') || {};
        this.currentCustomizeProduct = null;
        this.deliveryFee = 0;
        this.customerAddress = null;
        
        this.init();
    }

    // Inicialização do app
    init() {
        this.hideLoading();
        this.setupEventListeners();
        this.renderMenus();
        this.updateDeliveryMode();
        this.updateCartUI();
        this.setupScrollEffects();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botões de delivery/local
        document.getElementById('local-btn')?.addEventListener('click', () => this.setDeliveryMode('local'));
        document.getElementById('viagem-btn')?.addEventListener('click', () => this.setDeliveryMode('delivery'));

        // Carrinho
        document.getElementById('clear-cart')?.addEventListener('click', () => this.clearCart());
        document.getElementById('finalizar-pedido')?.addEventListener('click', () => this.openCustomerModal());

        // Modal de personalização
        document.getElementById('add-customized')?.addEventListener('click', () => this.addCustomizedToCart());

        // Modal do cliente
        document.getElementById('customer-form')?.addEventListener('submit', (e) => this.submitOrder(e));
        document.getElementById('buscar-cep')?.addEventListener('click', () => this.searchCEP());

        // Máscara para telefone e CEP
        this.setupInputMasks();

        // Fechar modais clicando fora
        this.setupModalCloseEvents();
    }

    // Configurar máscaras de entrada
    setupInputMasks() {
        const phoneInput = document.getElementById('customer-phone');
        const cepInput = document.getElementById('customer-cep');

        phoneInput?.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
            e.target.value = value;
        });

        cepInput?.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    // Configurar eventos de fechar modal
    setupModalCloseEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Configurar efeitos de scroll
    setupScrollEffects() {
        const scrollTopBtn = document.querySelector('.scroll-top');
        const floatingCart = document.getElementById('floating-cart');
        const header = document.querySelector('header');
        let lastScrollY = window.scrollY;
        let ticking = false;

        const updateScroll = () => {
            const scrollY = window.scrollY;
            const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
            
            // Header hide/show no mobile
            if (window.innerWidth <= 768) {
                if (scrollDirection === 'down' && scrollY > 100) {
                    header?.classList.add('hidden');
                } else if (scrollDirection === 'up') {
                    header?.classList.remove('hidden');
                }
            } else {
                header?.classList.remove('hidden');
            }
            
            // Botão scroll to top
            if (scrollTopBtn) {
                scrollTopBtn.classList.toggle('visible', scrollY > 300);
            }

            // Carrinho flutuante
            if (floatingCart && this.cart.length > 0) {
                floatingCart.classList.toggle('visible', scrollY > 500);
            }

            lastScrollY = scrollY;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScroll);
                ticking = true;
            }
        });

        // Atualizar no resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                header?.classList.remove('hidden');
            }
        });
    }

    // Esconder loading
    hideLoading() {
        setTimeout(() => {
            const loading = document.getElementById('loading-overlay');
            if (loading) {
                loading.classList.add('hidden');
                setTimeout(() => loading.style.display = 'none', 300);
            }
        }, 1000);
    }

    // Renderizar menus
    renderMenus() {
        this.renderSandwiches();
        this.renderDrinks();
        this.renderSides();
    }

    // Renderizar sanduíches
    renderSandwiches() {
        const container = document.getElementById('sandwiches-menu');
        if (!container) return;

        const sandwiches = getProductsByCategory('sandwiches');
        container.innerHTML = '';

        Object.values(sandwiches).forEach(product => {
            const productEl = this.createSandwichElement(product);
            container.appendChild(productEl);
        });
    }

    // Renderizar bebidas
    renderDrinks() {
        const container = document.getElementById('drinks-menu');
        if (!container) return;

        const drinks = getProductsByCategory('drinks');
        container.innerHTML = '';

        Object.values(drinks).forEach(product => {
            const productEl = this.createSimpleItemElement(product);
            container.appendChild(productEl);
        });
    }

    // Renderizar acompanhamentos
    renderSides() {
        const container = document.getElementById('sides-menu');
        if (!container) return;

        const sides = getProductsByCategory('sides');
        container.innerHTML = '';

        Object.values(sides).forEach(product => {
            const productEl = this.createSimpleItemElement(product);
            container.appendChild(productEl);
        });
    }

    // Criar elemento de sanduíche
    createSandwichElement(product) {
        const div = document.createElement('div');
        div.className = `menu-item ${product.badges?.includes('featured') ? 'featured' : ''}`;
        
        const badges = product.badges?.map(badge => 
            `<span class="item-badge ${badge}">${this.getBadgeText(badge)}</span>`
        ).join('') || '';

        const features = product.features?.map(feature => 
            `<span><i class="fas fa-${this.getFeatureIcon(feature)}"></i> ${feature}</span>`
        ).join('') || '';

        div.innerHTML = `
            <div class="item-image-container">
                <img src="${product.image}" alt="${product.name}" class="item-image">
                <div class="item-overlay">
                    <button class="quick-add" data-product="${product.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="item-badges">${badges}</div>
            <div class="item-content">
                <h3 class="item-title">${product.name}</h3>
                <p class="item-description">${product.description}</p>
                <div class="item-details">
                    <div class="item-features">${features}</div>
                    <div class="item-rating">
                        <span class="stars">${'★'.repeat(5)}</span>
                        <span class="rating-count">(${product.reviews})</span>
                    </div>
                </div>
                <div class="item-price-section">
                    <div class="item-price">
                        ${formatPrice(product.price)}
                        ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                    <div class="item-actions">
                        ${product.customizable ? `<button class="customize-btn" data-product="${product.id}"><i class="fas fa-utensil-spoon"></i> Personalizar</button>` : ''}
                        <button class="add-to-cart-direct" data-product="${product.id}">Adicionar</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners
        const quickAdd = div.querySelector('.quick-add');
        const customizeBtn = div.querySelector('.customize-btn');
        const addBtn = div.querySelector('.add-to-cart-direct');

        quickAdd?.addEventListener('click', () => this.addToCart(product.id));
        customizeBtn?.addEventListener('click', () => this.openCustomizeModal(product.id));
        addBtn?.addEventListener('click', () => this.addToCart(product.id));

        return div;
    }

    // Criar elemento simples (bebidas/acompanhamentos)
    createSimpleItemElement(product) {
        const div = document.createElement('div');
        div.className = 'simple-item';

        const flavorSection = product.flavors ? `
            <div class="flavor-selection">
                <h5>Sabor:</h5>
                <div class="flavor-options">
                    ${product.flavors.map(flavor => 
                        `<span class="flavor-option" data-flavor="${flavor}">${flavor}</span>`
                    ).join('')}
                </div>
            </div>
        ` : '';

        div.innerHTML = `
            <div class="simple-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="simple-item-info">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <span class="simple-price">${formatPrice(product.price)}</span>
                ${flavorSection}
            </div>
            <div class="simple-actions">
                <div class="quantity">
                    <button class="qty-btn" data-product="${product.id}" data-action="decrease">-</button>
                    <span class="qty-value" id="qty-${product.id}">0</span>
                    <button class="qty-btn" data-product="${product.id}" data-action="increase">+</button>
                </div>
                <button class="add-to-cart" data-product="${product.id}">Adicionar</button>
            </div>
        `;

        // Event listeners
        const decreaseBtn = div.querySelector('[data-action="decrease"]');
        const increaseBtn = div.querySelector('[data-action="increase"]');
        const addBtn = div.querySelector('.add-to-cart');

        decreaseBtn?.addEventListener('click', () => this.updateQuantity(product.id, -1));
        increaseBtn?.addEventListener('click', () => this.updateQuantity(product.id, 1));
        addBtn?.addEventListener('click', () => this.addToCart(product.id));

        // Flavor selection
        const flavorOptions = div.querySelectorAll('.flavor-option');
        flavorOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from siblings
                flavorOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
            });
        });

        // Select first flavor by default
        if (flavorOptions.length > 0) {
            flavorOptions[0].classList.add('selected');
        }

        return div;
    }

    // Atualizar quantidade
    updateQuantity(productId, change) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        if (!qtyElement) return;

        let currentQty = parseInt(qtyElement.textContent) || 0;
        currentQty = Math.max(0, currentQty + change);
        qtyElement.textContent = currentQty;

        // Atualizar estado do botão de diminuir
        const decreaseBtn = qtyElement.parentElement.querySelector('[data-action="decrease"]');
        if (decreaseBtn) {
            decreaseBtn.disabled = currentQty === 0;
        }
    }

    // Adicionar ao carrinho
    addToCart(productId, customizations = null) {
        const product = getProductById(productId);
        if (!product) return;

        const quantity = this.getProductQuantity(productId);
        
        if (quantity === 0 && !customizations) {
            this.updateQuantity(productId, 1);
        }

        // Verificar sabor selecionado para bebidas
        let selectedFlavor = null;
        if (product.flavors && product.flavors.length > 0) {
            const productElement = document.querySelector(`[data-product="${productId}"]`)?.closest('.simple-item');
            const selectedFlavorElement = productElement?.querySelector('.flavor-option.selected');
            selectedFlavor = selectedFlavorElement?.dataset.flavor || product.flavors[0];
        }

        const cartItem = {
            id: Date.now(),
            productId,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            quantity: customizations ? 1 : Math.max(1, quantity),
            customizations: customizations || {},
            notes: customizations?.notes || '',
            flavor: selectedFlavor,
            total: this.calculateItemTotal(product.price, customizations)
        };

        this.cart.push(cartItem);
        this.saveToStorage('cart', this.cart);
        this.updateCartUI();
        this.resetProductQuantity(productId);
        this.showToast(`${product.name} adicionado ao carrinho!`);
    }

    // Obter quantidade do produto
    getProductQuantity(productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        return qtyElement ? parseInt(qtyElement.textContent) || 0 : 1;
    }

    // Resetar quantidade do produto
    resetProductQuantity(productId) {
        const qtyElement = document.getElementById(`qty-${productId}`);
        if (qtyElement) {
            qtyElement.textContent = '0';
            const decreaseBtn = qtyElement.parentElement?.querySelector('[data-action="decrease"]');
            if (decreaseBtn) decreaseBtn.disabled = true;
        }
    }

    // Calcular total do item
    calculateItemTotal(basePrice, customizations) {
        let total = basePrice;
        
        if (customizations?.additionals) {
            Object.keys(customizations.additionals).forEach(additionalId => {
                const additional = ADDITIONALS[additionalId];
                if (additional) {
                    total += additional.price;
                }
            });
        }

        return total;
    }

    // Abrir modal de personalização
    openCustomizeModal(productId) {
        const product = getProductById(productId);
        if (!product) return;

        this.currentCustomizeProduct = product;
        
        // Atualizar título
        document.getElementById('customize-title').textContent = `Personalizar ${product.name}`;
        
        // Mostrar info do produto base
        document.getElementById('base-product-info').innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; padding: 15px; background: var(--bg-light); border-radius: var(--border-radius);">
                <img src="${product.image}" alt="${product.name}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                <div>
                    <h4 style="margin: 0; color: var(--text-dark);">${product.name}</h4>
                    <p style="margin: 5px 0; color: var(--text-light); font-size: 0.9rem;">${product.description}</p>
                    <strong style="color: var(--primary-color);">${formatPrice(product.price)}</strong>
                </div>
            </div>
        `;

        // Renderizar adicionais
        this.renderAdditionals();
        
        // Limpar observações
        document.getElementById('item-notes').value = '';
        
        // Atualizar total
        this.updateCustomizeTotal();
        
        // Mostrar modal
        document.getElementById('customize-modal').classList.add('active');
    }

    // Renderizar adicionais
    renderAdditionals() {
        const container = document.getElementById('additionals-grid');
        if (!container) return;

        container.innerHTML = '';

        Object.values(ADDITIONALS).forEach(additional => {
            const label = document.createElement('label');
            label.className = 'additional-item';
            
            label.innerHTML = `
                <input type="checkbox" name="additional" value="${additional.id}" data-price="${additional.price}">
                <span class="checkmark"></span>
                <div class="additional-info">
                    <span class="additional-name">${additional.name}</span>
                    <span class="additional-description">${additional.description}</span>
                </div>
                <span class="additional-price">+ ${formatPrice(additional.price)}</span>
            `;

            // Event listener para atualizar total
            const checkbox = label.querySelector('input');
            checkbox.addEventListener('change', () => this.updateCustomizeTotal());

            container.appendChild(label);
        });
    }

    // Atualizar total da personalização
    updateCustomizeTotal() {
        if (!this.currentCustomizeProduct) return;

        let total = this.currentCustomizeProduct.price;
        
        const checkboxes = document.querySelectorAll('#additionals-grid input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            total += parseFloat(checkbox.dataset.price);
        });

        document.getElementById('customize-total-value').textContent = formatPrice(total);
    }

    // Adicionar personalizado ao carrinho
    addCustomizedToCart() {
        if (!this.currentCustomizeProduct) return;

        const additionals = {};
        const checkboxes = document.querySelectorAll('#additionals-grid input[type="checkbox"]:checked');
        
        checkboxes.forEach(checkbox => {
            additionals[checkbox.value] = true;
        });

        const notes = document.getElementById('item-notes').value.trim();

        const customizations = {
            additionals,
            notes
        };

        this.addToCart(this.currentCustomizeProduct.id, customizations);
        this.closeCustomizeModal();
    }

    // Fechar modal de personalização
    closeCustomizeModal() {
        document.getElementById('customize-modal').classList.remove('active');
        this.currentCustomizeProduct = null;
    }

    // Remover item do carrinho
    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveToStorage('cart', this.cart);
        this.updateCartUI();
        this.showToast('Item removido do carrinho');
    }

    // Limpar carrinho
    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Tem certeza que deseja limpar o carrinho?')) {
            this.cart = [];
            this.saveToStorage('cart', this.cart);
            this.updateCartUI();
            this.showToast('Carrinho limpo');
        }
    }

    // Atualizar UI do carrinho
    updateCartUI() {
        this.updateCartItems();
        this.updateCartSummary();
        this.updateFloatingCart();
        this.updateCartHeader();
    }

    // Atualizar itens do carrinho
    updateCartItems() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Seu carrinho está vazio</h3>
                    <p>Adicione alguns de nossos deliciosos sanduíches!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';

            const additionalsHtml = item.customizations?.additionals ? 
                Object.keys(item.customizations.additionals)
                    .map(id => `<span class="additional-tag">${ADDITIONALS[id]?.name}</span>`)
                    .join('') : '';

            const flavorHtml = item.flavor ? 
                `<div class="cart-item-flavor">Sabor: ${item.flavor}</div>` : '';

            div.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-description">${item.description}</div>
                    ${additionalsHtml ? `<div class="cart-item-additionals">${additionalsHtml}</div>` : ''}
                    ${flavorHtml}
                    ${item.notes ? `<div class="cart-item-notes">"${item.notes}"</div>` : ''}
                </div>
                <div class="cart-item-controls">
                    <div class="quantity">
                        <button class="qty-btn" onclick="app.updateCartItemQuantity(${item.id}, -1)">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="app.updateCartItemQuantity(${item.id}, 1)">+</button>
                    </div>
                    <div class="cart-item-price">${formatPrice(item.total * item.quantity)}</div>
                    <button class="remove-item" onclick="app.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            container.appendChild(div);
        });
    }

    // Atualizar quantidade de item do carrinho
    updateCartItemQuantity(itemId, change) {
        const item = this.cart.find(item => item.id === itemId);
        if (!item) return;

        item.quantity = Math.max(1, item.quantity + change);
        this.saveToStorage('cart', this.cart);
        this.updateCartUI();
    }

    // Atualizar resumo do carrinho
    updateCartSummary() {
        const container = document.getElementById('cart-summary');
        if (!container) return;

        if (this.cart.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        const subtotal = this.calculateSubtotal();
        let deliveryFeeHtml = '';

        if (this.deliveryMode === 'delivery') {
            const fee = this.deliveryFee;
            
            deliveryFeeHtml = `
                <div class="summary-line delivery-fee">
                    <span>Taxa de Entrega:</span>
                    <span>${formatPrice(fee)}</span>
                </div>
            `;
        }

        const total = subtotal + (this.deliveryMode === 'delivery' ? this.deliveryFee : 0);

        container.innerHTML = `
            <div class="summary-line">
                <span>Subtotal:</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            ${deliveryFeeHtml}
            <div class="summary-line total">
                <span>Total:</span>
                <span>${formatPrice(total)}</span>
            </div>
        `;
    }

    // Calcular subtotal
    calculateSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.total * item.quantity), 0);
    }

    // Atualizar carrinho flutuante
    updateFloatingCart() {
        const floatingCart = document.getElementById('floating-cart');
        const countEl = document.getElementById('floating-cart-count');
        const textEl = document.getElementById('floating-items-text');
        const totalEl = document.getElementById('floating-total');

        if (!floatingCart) return;

        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = this.calculateSubtotal() + (this.deliveryMode === 'delivery' ? this.deliveryFee : 0);

        countEl.textContent = itemCount;
        textEl.textContent = itemCount === 0 ? 'Carrinho vazio' : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
        totalEl.textContent = formatPrice(total);

        floatingCart.style.display = itemCount > 0 ? 'block' : 'none';
    }

    // Atualizar cabeçalho do carrinho
    updateCartHeader() {
        const countEl = document.getElementById('cart-count-header');
        const clearBtn = document.getElementById('clear-cart');

        if (countEl) {
            const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            countEl.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
        }

        if (clearBtn) {
            clearBtn.style.display = this.cart.length > 0 ? 'block' : 'none';
        }
    }

    // Definir modo de entrega
    setDeliveryMode(mode) {
        this.deliveryMode = mode;
        this.saveToStorage('deliveryMode', mode);
        this.updateDeliveryMode();
        this.updateCartUI();
    }

    // Atualizar modo de entrega
    updateDeliveryMode() {
        const localBtn = document.getElementById('local-btn');
        const deliveryBtn = document.getElementById('viagem-btn');

        if (localBtn && deliveryBtn) {
            localBtn.classList.toggle('active', this.deliveryMode === 'local');
            deliveryBtn.classList.toggle('active', this.deliveryMode === 'delivery');
        }
    }

    // Abrir modal do cliente
    openCustomerModal() {
        if (this.cart.length === 0) {
            this.showToast('Adicione itens ao carrinho primeiro!');
            return;
        }

        const modal = document.getElementById('customer-modal');
        const title = document.getElementById('modal-title');
        const instructions = document.getElementById('local-instructions');
        const deliveryFields = document.getElementById('delivery-fields');

        if (this.deliveryMode === 'local') {
            title.textContent = 'Informações para Retirada';
            instructions.style.display = 'flex';
            deliveryFields.style.display = 'none';
        } else {
            title.textContent = 'Informações para Entrega';
            instructions.style.display = 'none';
            deliveryFields.style.display = 'block';
        }

        modal.classList.add('active');
    }

    // Fechar modal do cliente
    closeCustomerModal() {
        document.getElementById('customer-modal').classList.remove('active');
    }

    // Fechar todos os modais
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentCustomizeProduct = null;
    }

    // Buscar CEP usando ViaCEP
    async searchCEP() {
        const cepInput = document.getElementById('customer-cep');
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            this.showFieldError('cep-error', 'CEP deve ter 8 dígitos');
            return;
        }

        const button = document.getElementById('buscar-cep');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        button.disabled = true;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                this.showFieldError('cep-error', 'CEP não encontrado');
                return;
            }

            // Preencher campos
            document.getElementById('customer-address').value = data.logradouro || '';
            document.getElementById('customer-neighborhood').value = data.bairro || '';
            document.getElementById('customer-city').value = data.localidade || '';
            document.getElementById('customer-state').value = data.uf || '';

            // Mostrar campos de endereço
            document.getElementById('address-fields').style.display = 'block';

            // Calcular distância e taxa de entrega
            await this.calculateDeliveryDistance(data);

            this.clearFieldError('cep-error');

        } catch (error) {
            this.showFieldError('cep-error', 'Erro ao buscar CEP. Tente novamente.');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    // Calcular distância de entrega (simulado baseado na cidade)
    async calculateDeliveryDistance(addressData) {
        try {
            // Simulação de distância baseada na cidade de Porto Velho
            const distance = this.simulateDistanceFromPortoVelho(addressData.localidade);
            
            const fee = calculateDeliveryFee(distance);
            
            if (fee === null) {
                this.showDeliveryDistance('Área fora de entrega', 'error');
                this.deliveryFee = 0;
                return;
            }

            this.deliveryFee = fee;
            
            this.showDeliveryDistance(
                `Distância: ~${distance}km | Taxa: ${formatPrice(fee)}`,
                'info'
            );

            this.customerAddress = { ...addressData, distance };
            this.updateCartUI();

        } catch (error) {
            this.showDeliveryDistance('Erro ao calcular distância', 'error');
        }
    }

    // Simular distância de Porto Velho para outras cidades
    simulateDistanceFromPortoVelho(city) {
        const distances = {
            'Porto Velho': Math.random() * 8 + 1,
            'Ji-Paraná': Math.random() * 10 + 8,
            'Cacoal': Math.random() * 12 + 10,
            'Ariquemes': Math.random() * 15 + 12,
            'Vilhena': Math.random() * 18 + 15,
            'Rolim de Moura': Math.random() * 14 + 8,
            'Jaru': Math.random() * 8 + 5,
            'Ouro Preto do Oeste': Math.random() * 6 + 3,
            'Presidente Médici': Math.random() * 5 + 2,
            'Candeias do Jamari': Math.random() * 4 + 1
        };
        
        return Math.round((distances[city] || Math.random() * 20 + 1) * 100) / 100;
    }

    // Mostrar distância de entrega
    showDeliveryDistance(message, type) {
        const container = document.getElementById('delivery-distance');
        container.innerHTML = `
            <div class="distance-info ${type}">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
            </div>
        `;
        container.style.display = 'block';
    }

    // Obter distância de entrega
    getDeliveryDistance() {
        return this.customerAddress?.distance || 0;
    }

    // Submeter pedido
    async submitOrder(event) {
        event.preventDefault();

        if (!this.validateForm()) return;

        const formData = this.getFormData();
        const orderData = this.prepareOrderData(formData);
        
        this.sendWhatsAppOrder(orderData);
    }

    // Validar formulário
    validateForm() {
        let isValid = true;

        // Nome
        const name = document.getElementById('customer-name').value.trim();
        if (name.length < 3) {
            this.showFieldError('name-error', 'Nome deve ter pelo menos 3 caracteres');
            isValid = false;
        } else {
            this.clearFieldError('name-error');
        }

        // Telefone
        const phone = document.getElementById('customer-phone').value.replace(/\D/g, '');
        if (phone.length < 10) {
            this.showFieldError('phone-error', 'Telefone inválido');
            isValid = false;
        } else {
            this.clearFieldError('phone-error');
        }

        // Validações específicas do delivery
        if (this.deliveryMode === 'delivery') {
            const cep = document.getElementById('customer-cep').value.replace(/\D/g, '');
            const address = document.getElementById('customer-address').value.trim();
            const number = document.getElementById('customer-number').value.trim();

            if (cep.length !== 8) {
                this.showFieldError('cep-error', 'CEP é obrigatório');
                isValid = false;
            }

            if (!address) {
                this.showFieldError('address-error', 'Endereço é obrigatório');
                isValid = false;
            }

            if (!number) {
                this.showFieldError('number-error', 'Número é obrigatório');
                isValid = false;
            }
        }

        return isValid;
    }

    // Obter dados do formulário
    getFormData() {
        const formData = {
            name: document.getElementById('customer-name').value.trim(),
            phone: document.getElementById('customer-phone').value,
            notes: document.getElementById('customer-notes').value.trim()
        };

        if (this.deliveryMode === 'delivery') {
            formData.address = {
                cep: document.getElementById('customer-cep').value,
                street: document.getElementById('customer-address').value.trim(),
                number: document.getElementById('customer-number').value.trim(),
                complement: document.getElementById('customer-complement').value.trim(),
                neighborhood: document.getElementById('customer-neighborhood').value.trim(),
                city: document.getElementById('customer-city').value.trim(),
                state: document.getElementById('customer-state').value.trim(),
                distance: this.getDeliveryDistance()
            };
        }

        return formData;
    }

    // Preparar dados do pedido
    prepareOrderData(formData) {
        const subtotal = this.calculateSubtotal();
        const deliveryFee = this.deliveryMode === 'delivery' ? this.deliveryFee : 0;
        const total = subtotal + deliveryFee;

        return {
            customer: formData,
            deliveryMode: this.deliveryMode,
            items: this.cart,
            summary: {
                subtotal,
                deliveryFee,
                total,
                itemCount: this.cart.reduce((sum, item) => sum + item.quantity, 0)
            },
            timestamp: new Date().toLocaleString('pt-BR')
        };
    }

    // Enviar pedido via WhatsApp
    sendWhatsAppOrder(orderData) {
        let message = `🍔 *NOVO PEDIDO - Costela do Titi*\n\n`;
        
        // Informações do cliente
        message += `👤 *Cliente:* ${orderData.customer.name}\n`;
        message += `📞 *Telefone:* ${orderData.customer.phone}\n`;
        message += `📋 *Tipo:* ${orderData.deliveryMode === 'local' ? 'Retirar no local' : 'Delivery'}\n\n`;

        // Endereço (se delivery)
        if (orderData.deliveryMode === 'delivery' && orderData.customer.address) {
            const addr = orderData.customer.address;
            message += `📍 *Endereço:*\n`;
            message += `${addr.street}, ${addr.number}`;
            if (addr.complement) message += ` - ${addr.complement}`;
            message += `\n${addr.neighborhood} - ${addr.city}/${addr.state}`;
            message += `\nCEP: ${addr.cep}\n`;
            message += `🚗 *Distância:* ~${addr.distance}km\n\n`;
        }

        // Itens do pedido
        message += `🛒 *Itens:*\n`;
        orderData.items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* (${item.quantity}x)\n`;
            
            if (item.flavor) {
                message += `   🥤 Sabor: ${item.flavor}\n`;
            }
            
            if (item.customizations?.additionals) {
                const additionals = Object.keys(item.customizations.additionals)
                    .map(id => ADDITIONALS[id]?.name)
                    .filter(name => name);
                
                if (additionals.length > 0) {
                    message += `   + ${additionals.join(', ')}\n`;
                }
            }
            
            if (item.notes) {
                message += `   💬 "${item.notes}"\n`;
            }
            
            message += `   💰 ${formatPrice(item.total * item.quantity)}\n\n`;
        });

        // Resumo financeiro
        message += `💵 *Resumo:*\n`;
        message += `Subtotal: ${formatPrice(orderData.summary.subtotal)}\n`;
        
        if (orderData.deliveryMode === 'delivery') {
            message += `Taxa de entrega: ${formatPrice(orderData.summary.deliveryFee)}\n`;
        }
        
        message += `*Total: ${formatPrice(orderData.summary.total)}*\n\n`;

        // Observações
        if (orderData.customer.notes) {
            message += `📝 *Observações:*\n${orderData.customer.notes}\n\n`;
        }

        message += `🕐 *Pedido realizado em:* ${orderData.timestamp}`;

        // Codificar e enviar
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');

        // Salvar dados do cliente e limpar carrinho
        this.saveCustomerData(orderData.customer);
        this.showOrderSuccess();
    }

    // Salvar dados do cliente
    saveCustomerData(customerData) {
        this.customerData = customerData;
        this.saveToStorage('customerData', customerData);
    }

    // Mostrar sucesso do pedido
    showOrderSuccess() {
        this.closeAllModals();
        
        // Limpar carrinho após alguns segundos
        setTimeout(() => {
            this.cart = [];
            this.saveToStorage('cart', this.cart);
            this.updateCartUI();
            this.showToast('Pedido enviado com sucesso! Obrigado pela preferência!', 'success', 5000);
        }, 1000);
    }

    // Mostrar/limpar erros de campo
    showFieldError(fieldId, message) {
        const errorEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    clearFieldError(fieldId) {
        const errorEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    // Mostrar toast
    showToast(message, type = 'info', duration = 3000) {
        // Remover toast anterior se existir
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remover toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Obter ícone do toast
    getToastIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    }

    // Obter texto do badge
    getBadgeText(badge) {
        const badges = {
            popular: 'Mais Pedido',
            discount: '-20%',
            bestseller: 'Best Seller',
            recommended: 'Recomendado',
            premium: 'Premium',
            exclusive: 'Exclusivo'
        };
        return badges[badge] || badge;
    }

    // Obter ícone da feature
    getFeatureIcon(feature) {
        const icons = {
            'Premium': 'crown',
            'Defumado': 'fire',
            'Defumado 12h': 'fire',
            'Premiado': 'award',
            'Gourmet': 'gem',
            'Chef': 'star'
        };
        return icons[feature] || 'check';
    }

    // Salvar no localStorage
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn('Erro ao salvar no localStorage:', error);
        }
    }

    // Carregar do localStorage
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Erro ao carregar do localStorage:', error);
            return null;
        }
    }
}

// Funções globais para compatibilidade
function scrollToMenu() {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
}

function scrollToCart() {
    document.querySelector('.cart-section')?.scrollIntoView({ behavior: 'smooth' });
}

function closeCustomizeModal() {
    window.app?.closeCustomizeModal();
}

function closeCustomerModal() {
    window.app?.closeCustomerModal();
}

// Inicializar app quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DeliveryApp();
});