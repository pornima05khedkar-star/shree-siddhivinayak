// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let selectedPaymentMethod = null;

// Payment Processing Variables
let paymentTimer;
let otpTimer;
let generatedOTP = '';
let paymentInProgress = false;

// ==================== IMAGE MODAL FUNCTIONALITY ====================
function openModal(imgElement) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const captionText = document.getElementById("modalCaption");
    
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = imgElement.src;
        captionText.innerHTML = imgElement.alt;
    }
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// ==================== SECTION MANAGEMENT ====================
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        console.log('Section shown successfully');
    }
    
    // Special handling for cart
    if (sectionName === 'cart') {
        showCart();
    }
}

// ==================== PAYMENT PROCESSING FUNCTIONS ====================
function showPaymentOptions() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    // Reset any previously selected payment method
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    // Disable confirm payment button until a method is selected
    document.getElementById('confirm-payment').disabled = true;
    selectedPaymentMethod = null;
    
    showSection('payment');
}

function setupPaymentSelection() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', function() {
            // Remove selected class from all methods
            paymentMethods.forEach(m => m.classList.remove('selected'));
            
            // Add selected class to clicked method
            this.classList.add('selected');
            
            // Store selected payment method
            selectedPaymentMethod = this.getAttribute('data-method');
            
            // Enable confirm payment button
            confirmPaymentBtn.disabled = false;
        });
    });
    
    // Back to checkout button
    const backToCheckoutBtn = document.getElementById('back-to-checkout');
    if (backToCheckoutBtn) {
        backToCheckoutBtn.addEventListener('click', () => showSection('checkout'));
    }
    
    // Confirm payment button
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', function() {
            if (selectedPaymentMethod) {
                processPayment(selectedPaymentMethod);
            }
        });
    }
}

function processPayment(paymentMethod) {
    if (paymentInProgress) return;
    
    const firstName = document.getElementById('checkout-first-name').value;
    const lastName = document.getElementById('checkout-last-name').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    
    if (!firstName || !lastName || !email || !phone || !address) {
        showNotification('Please fill all checkout details first!');
        showSection('checkout');
        return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Start payment processing
    startPaymentProcessing(paymentMethod, totalAmount, phone);
}

function startPaymentProcessing(paymentMethod, amount, phone) {
    paymentInProgress = true;
    
    // Show payment processing modal
    const modal = document.getElementById('payment-processing-modal');
    const paymentAmount = document.getElementById('payment-amount');
    const selectedMethodDisplay = document.getElementById('selected-method-display');
    const mobileEnding = document.getElementById('mobile-ending');
    
    paymentAmount.textContent = `₹${amount}`;
    selectedMethodDisplay.textContent = paymentMethod;
    mobileEnding.textContent = phone.slice(-4);
    
    modal.style.display = 'flex';
    
    // Reset OTP inputs
    resetOTPInputs();
    
    // Start payment flow
    simulatePaymentProcess();
}

function simulatePaymentProcess() {
    let currentStep = 1;
    
    // Step 1: Initializing Payment
    updateStep(currentStep);
    setTimeout(() => {
        currentStep = 2;
        updateStep(currentStep);
        
        // Step 2: Sending OTP
        setTimeout(() => {
            sendOTP();
            showOTPSection();
            startOTPTimer();
            
            currentStep = 3;
            updateStep(currentStep);
        }, 1500);
    }, 2000);
}

function updateStep(stepNumber) {
    // Reset all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // Mark previous steps as completed and current as active
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step-${i}`);
        if (i < stepNumber) {
            step.classList.add('completed');
        } else if (i === stepNumber) {
            step.classList.add('active');
        }
    }
}

function sendOTP() {
    // Generate random 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', generatedOTP); // For testing purposes
    
    // Simulate sending OTP to mobile
    showNotification(`OTP sent to your mobile device`);
}

function showOTPSection() {
    const otpSection = document.getElementById('otp-section');
    otpSection.style.display = 'block';
    
    // Focus on first OTP input
    setTimeout(() => {
        document.getElementById('otp-1').focus();
    }, 100);
}

function startOTPTimer() {
    let timeLeft = 120; // 2 minutes in seconds
    const timerElement = document.getElementById('otp-timer');
    const resendButton = document.getElementById('resend-otp');
    
    // Clear any existing timer
    if (otpTimer) clearInterval(otpTimer);
    
    otpTimer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(otpTimer);
            resendButton.disabled = false;
            resendButton.textContent = 'Resend OTP';
            showNotification('OTP has expired. Please request a new one.');
        }
    }, 1000);
}

function resetOTPTimer() {
    clearInterval(otpTimer);
    startOTPTimer();
}

function resetOTPInputs() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (input) {
            input.value = '';
            input.classList.remove('error');
        }
    }
}

// OTP Input Navigation
function handleOTPInput(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    // Allow only numbers
    input.value = value.replace(/[^0-9]/g, '');
    
    // Remove error class when user types
    input.classList.remove('error');
    
    // Auto move to next input
    if (value.length === 1 && index < 6) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
    }
    
    // Auto verify when all inputs are filled
    if (index === 6 && value.length === 1) {
        // Small delay to ensure all inputs are filled
        setTimeout(verifyOTP, 100);
    }
}

function handleOTPBackspace(event) {
    if (event.key === 'Backspace') {
        const input = event.target;
        const value = input.value;
        const index = parseInt(input.getAttribute('data-index'));
        
        if (value.length === 0 && index > 1) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    }
}

function verifyOTP() {
    const enteredOTP = getEnteredOTP();
    
    if (enteredOTP.length !== 6) {
        showNotification('Please enter complete OTP');
        return;
    }
    
    if (enteredOTP === generatedOTP) {
        // OTP verified successfully
        completePaymentProcess();
    } else {
        // Invalid OTP
        showOTPError();
        showNotification('Invalid OTP. Please try again.');
    }
}

function getEnteredOTP() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (input) {
            otp += input.value;
        }
    }
    return otp;
}

function showOTPError() {
    // Add error class to all OTP inputs
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (input) {
            input.classList.add('error');
        }
    }
    
    // Shake animation for error
    const otpContainer = document.querySelector('.otp-input-container');
    if (otpContainer) {
        otpContainer.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            otpContainer.style.animation = '';
        }, 500);
    }
}

function completePaymentProcess() {
    clearInterval(otpTimer);
    
    // Update to final step
    updateStep(4);
    
    // Show success state
    setTimeout(() => {
        const modal = document.getElementById('payment-processing-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="payment-success">
                <i class="fas fa-check-circle"></i>
                <h3>Payment Successful!</h3>
                <p>Your payment of ₹${document.getElementById('payment-amount').textContent.slice(1)} has been processed successfully.</p>
                <p>Order confirmation has been sent to your email.</p>
                <button class="btn" id="close-payment-success">Continue</button>
            </div>
        `;
        
        // Add event listener for continue button
        document.getElementById('close-payment-success').addEventListener('click', () => {
            modal.style.display = 'none';
            completeOrder(selectedPaymentMethod, getTotalAmount());
            paymentInProgress = false;
        });
        
    }, 1000);
}

function getTotalAmount() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function resendOTP() {
    const resendButton = document.getElementById('resend-otp');
    resendButton.disabled = true;
    resendButton.textContent = 'Resending...';
    
    resetOTPInputs();
    sendOTP();
    resetOTPTimer();
    
    setTimeout(() => {
        resendButton.textContent = 'Resend OTP';
        document.getElementById('otp-1').focus();
    }, 2000);
}

// ==================== CART FUNCTIONS ====================
function addToCart(productId) {
    console.log('Adding to cart - Product ID:', productId, 'Type:', typeof productId);
    
    // Convert productId to string for comparison (in case it's a number)
    const productIdStr = String(productId);
    const product = allProducts.find(p => String(p._id) === productIdStr);
    
    console.log('Found product:', product);
    
    if (!product) {
        console.error('Product not found for ID:', productId);
        showNotification('Product not found!');
        return;
    }
    
    // Check if product already in cart
    const existingItem = cart.find(item => String(item._id) === productIdStr);
    if (existingItem) {
        existingItem.quantity += 1;
        console.log('Increased quantity for:', product.name, 'New quantity:', existingItem.quantity);
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            quantity: 1
        });
        console.log('Added new item to cart:', product.name);
    }
    
    saveCart();
    updateCartCount();
    showNotification(`${product.name} added to cart!`);
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function showCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty!</p>';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item" data-product-id="${item._id}">
                <img src="${item.images[0]}" width="60" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
                <div>
                    <h4>${item.name}</h4>
                    <p>₹${item.price} x ${item.quantity}</p>
                    <div class="quantity-controls">
                        <button class="btn-quantity" data-action="decrease" data-product-id="${item._id}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="btn-quantity" data-action="increase" data-product-id="${item._id}">+</button>
                    </div>
                </div>
                <button class="btn remove-btn" data-product-id="${item._id}">Remove</button>
            </div>
        `).join('');
    }
    
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        cartTotal.textContent = total;
    }
}

function updateQuantity(productId, change) {
    const productIdStr = String(productId);
    const item = cart.find(item => String(item._id) === productIdStr);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartCount();
            showCart();
            showNotification(`Quantity updated to ${item.quantity}`);
        }
    }
}

function removeFromCart(productId) {
    const productIdStr = String(productId);
    const itemIndex = cart.findIndex(item => String(item._id) === productIdStr);
    if (itemIndex !== -1) {
        const itemName = cart[itemIndex].name;
        cart.splice(itemIndex, 1);
        saveCart();
        updateCartCount();
        showCart();
        showNotification(`${itemName} removed from cart`);
    }
}

function showCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    showSection('checkout');
}

// SIMPLE PLACE ORDER FUNCTION - FIXED!
function placeOrder() {
    const firstName = document.getElementById('checkout-first-name').value;
    const lastName = document.getElementById('checkout-last-name').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    
    // Validation
    if (!firstName || !lastName || !email || !phone || !address) {
        showNotification('Please fill all fields!');
        return;
    }
    
    // Show payment options
    showPaymentOptions();
}

function completeOrder(paymentMethod, amount) {
    const firstName = document.getElementById('checkout-first-name').value;
    const lastName = document.getElementById('checkout-last-name').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;

    const orderData = {
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        items: cart,
        totalAmount: amount,
        paymentMethod: paymentMethod,
        paymentStatus: 'completed'
    };

    // Store order in localStorage for demo purposes
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push({
        ...orderData,
        orderId: 'ORD' + Date.now(),
        orderDate: new Date().toISOString()
    });
    localStorage.setItem('orders', JSON.stringify(orders));
    
    showNotification(`Order placed successfully! Thank you for your purchase!`);
    
    // Clear cart and form
    cart = [];
    saveCart();
    updateCartCount();
    
    // Clear form
    document.getElementById('checkout-first-name').value = '';
    document.getElementById('checkout-last-name').value = '';
    document.getElementById('checkout-email').value = '';
    document.getElementById('checkout-phone').value = '';
    document.getElementById('checkout-address').value = '';
    
    showSection('order-success');
}
// ==================== PRODUCT DISPLAY ====================
function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image-container">
                <img src="${product.images[0]}" alt="${product.name}" class="product-image" data-product-image="true" onerror="this.src='https://via.placeholder.com/300x400/1a1a1a/d4af37?text=${encodeURIComponent(product.name)}'">
                <div class="product-overlay">
                    <button class="btn view-details-btn" data-product-id="${product._id}">Quick View</button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category-badge">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-features">
                    <span class="size-badge">${product.sizes.join(', ')}</span>
                    <span class="color-badge">${product.colors.length} colors</span>
                </div>
                <div class="product-price-section">
                    <p class="product-price">₹${product.price.toLocaleString()}</p>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star-half-alt"></i>
                        <span class="rating-text">(4.5)</span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn add-to-cart-btn" data-product-id="${product._id}">
                        <i class="fas fa-shopping-bag"></i>
                        Add to Cart
                    </button>
                    <button class="wishlist-btn" title="Add to Wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}



function filterProducts(category) {
    const filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);
    displayProducts(filtered);
    
    // Update active filter button with smooth animation
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    // Add smooth scroll to products
    const productsSection = document.getElementById('products-section');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-maroon);
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// ==================== EVENT DELEGATION ====================
function setupEventDelegation() {
    // Event delegation for dynamically created elements
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Add to cart buttons
        if (target.classList.contains('add-to-cart-btn')) {
            const productId = target.getAttribute('data-product-id');
            addToCart(productId);
        }
        
        // Quantity buttons in cart
        if (target.classList.contains('btn-quantity')) {
            const productId = target.getAttribute('data-product-id');
            const action = target.getAttribute('data-action');
            const change = action === 'increase' ? 1 : -1;
            updateQuantity(productId, change);
        }
        
        // Remove from cart buttons
        if (target.classList.contains('remove-btn')) {
            const productId = target.getAttribute('data-product-id');
            removeFromCart(productId);
        }
        
        // Product images for modal
        if (target.hasAttribute('data-product-image')) {
            openModal(target);
        }
    });
}

// ==================== PAYMENT EVENT LISTENERS ====================
function setupPaymentEventListeners() {
    // Verify OTP button
    const verifyOtpBtn = document.getElementById('verify-otp');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', verifyOTP);
    }
    
    // Resend OTP button
    const resendOtpBtn = document.getElementById('resend-otp');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', resendOTP);
    }
    
    // OTP input events
    for (let i = 1; i <= 6; i++) {
        const otpInput = document.getElementById(`otp-${i}`);
        if (otpInput) {
            otpInput.addEventListener('input', handleOTPInput);
            otpInput.addEventListener('keydown', handleOTPBackspace);
        }
    }
    
    // Close payment modal when clicking outside
    const paymentModal = document.getElementById('payment-processing-modal');
    if (paymentModal) {
        paymentModal.addEventListener('click', function(e) {
            if (e.target === paymentModal && !paymentInProgress) {
                paymentModal.style.display = 'none';
                paymentInProgress = false;
            }
        });
    }
}

// ==================== EVENT LISTENER SETUP ====================
function setupEventListeners() {
    // Place Order Button
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }

    // Other event listeners...
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) cartIcon.addEventListener('click', () => showSection('cart'));

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', showCheckout);

    // Continue shopping
    const continueShopping = document.getElementById('continue-shopping');
    if (continueShopping) continueShopping.addEventListener('click', () => showSection('home'));

    // Close image modal
    const closeImageModalBtn = document.getElementById('close-image-modal');
    if (closeImageModalBtn) closeImageModalBtn.addEventListener('click', closeModal);

    // Shop now button
    const shopNowBtn = document.getElementById('shop-now-btn');
    if (shopNowBtn) shopNowBtn.addEventListener('click', () => showSection('products'));

    // Our story button
    const ourStoryBtn = document.getElementById('our-story-btn');
    if (ourStoryBtn) ourStoryBtn.addEventListener('click', () => showSection('about'));

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Mobile menu
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) mobileToggle.addEventListener('click', function() {
        document.querySelector('.nav-menu').classList.toggle('active');
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Payment setup
    setupPaymentSelection();
    setupPaymentEventListeners();
    
    // Event delegation for dynamic elements
    setupEventDelegation();
}

// ==================== INITIALIZATION ====================
function init() {
    // Load sample products - MEN'S CLOTHING ONLY with LOCAL IMAGES
    allProducts = [
        {
            _id: '1',
            name: 'Navy Blue Silk Kurta',
            description: 'Premium silk kurta with traditional embroidery',
            price: 3499,
            category: 'kurtas',
            images: ['/uploads/kurta1.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Navy Blue']
        },
        {
            _id: '2',
            name: 'White Chikan Kurta',
            description: 'Handcrafted chikan work on premium cotton',
            price: 5899,
            category: 'kurtas',
            images: ['/uploads/kurta2.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['White', 'Off-White']
        },
        {
            _id: '3',
            name: 'Royal Maroon Sherwani',
            description: 'Regal sherwani with golden embroidery for weddings',
            price: 10999,
            category: 'sherwanis',
            images: ['/uploads/shervani.jpg'],
            sizes: ['M', 'L', 'XL', 'XXL'],
            colors: ['Maroon', 'Red']
        },
        {
            _id: '4',
            name: 'Designer Indo-Western Suit',
            description: 'Contemporary fusion wear with traditional touch',
            price: 15399,
            category: 'modern',
            images: ['/uploads/Indowestern.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Black', 'Grey', 'Navy']
        },
        {
            _id: '5',
            name: 'Traditional Dhoti Kurta Set',
            description: 'Complete traditional attire for festivals',
            price: 4599,
            category: 'traditional',
            images: ['/uploads/dhotikurta.jpg'],
            sizes: ['M', 'L', 'XL'],
            colors: ['White', 'Cream']
        },
        {
            _id: '6',
            name: 'Embroidered Jodhpuri Suit',
            description: 'Classic Jodhpuri style with intricate embroidery',
            price: 14999,
            category: 'modern',
            images: ['/uploads/jodhpuri.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Blue', 'Black']
        }
    ];
    
    setupEventListeners();
    displayProducts(allProducts);
    updateCartCount();
    showSection('home');
}

// Start everything when page loads
document.addEventListener('DOMContentLoaded', init);