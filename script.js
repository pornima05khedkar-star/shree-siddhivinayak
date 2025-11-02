// ==================== GLOBAL VARIABLES ====================
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];
let selectedPaymentMethod = null;
let paymentInProgress = false;
let generatedOTP = '';
let otpTimer = null;

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

// ==================== ORDER PROCESSING ====================
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

function completeOrder() {
    const email = document.getElementById('checkout-email').value;
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order details
    const orderDetails = {
        orderId: 'ORD' + Date.now(),
        amount: totalAmount,
        items: cart.length
    };
    
    // Send order confirmation Email
    sendOrderConfirmation(email, orderDetails);
    
    // Clear cart
    cart = [];
    updateCartCount();
    saveCart();
    
    // Show order success section
    showSection('order-success');
    
    // Reset checkout form
    document.getElementById('checkout-first-name').value = '';
    document.getElementById('checkout-last-name').value = '';
    document.getElementById('checkout-email').value = '';
    document.getElementById('checkout-phone').value = '';
    document.getElementById('checkout-address').value = '';
    
    showNotification('Order placed successfully! Confirmation sent to your email.');
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
    
    // Start payment processing (phone is now retrieved inside sendOTP)
    startPaymentProcessing(paymentMethod, totalAmount);
}

function startPaymentProcessing(paymentMethod, amount) {
    paymentInProgress = true;
    
    // Show payment processing modal
    const modal = document.getElementById('payment-processing-modal');
    const paymentAmount = document.getElementById('payment-amount');
    const selectedMethodDisplay = document.getElementById('selected-method-display');
    
    paymentAmount.textContent = `₹${amount}`;
    selectedMethodDisplay.textContent = paymentMethod;
    
    modal.style.display = 'flex';
    
    // Reset OTP inputs
    resetOTPInputs();
    
    // Send OTP to the actual phone number
    sendOTP();
    
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
        
        // Step 2: Sending OTP (already sent in startPaymentProcessing)
        setTimeout(() => {
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

async function sendOTP() {
    const phone = document.getElementById('checkout-phone').value;
    const email = document.getElementById('checkout-email').value;
    
    // Basic validation
    if (!phone || phone.length < 10) {
        showNotification('Please enter a valid phone number');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showNotification('Please enter a valid email address for OTP');
        return;
    }

    // Generate random 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        showNotification('Sending OTP to your email...');
        
        // Send OTP via Email
        const success = await sendOTPViaEmail(email, generatedOTP, phone);
        
        if (success) {
            showNotification(`OTP sent to ${email}`);
            console.log('OTP sent via email:', generatedOTP);
        } else {
            throw new Error('Failed to send OTP email');
        }
    } catch (error) {
        console.error('Email OTP failed:', error);
        // Fallback to on-screen display
        showNotification(`OTP: ${generatedOTP} - Enter this to continue`);
        console.log('OTP:', generatedOTP, 'for email:', email);
    }
    
    // Update mobile ending display (now shows email)
    const mobileEnding = document.getElementById('mobile-ending');
    if (mobileEnding) {
        mobileEnding.textContent = email.split('@')[0].slice(-4) + '...';
    }
}

// EmailJS integration for OTP
async function sendOTPViaEmail(email, otp, phone) {
    const serviceID = 'service_b8qp1sx';           // ← Use default_service or your actual service ID
    const templateID = 'template_qrr7x97';         // Your OTP template
    const userID = 'S0ZGmLq5Zma9ehfkj';            // Your public key

    
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: serviceID,
                template_id: templateID,
                user_id: userID,
                template_params: {
                    'user_email': email,
                    'otp_code': otp,
                    'phone_number': phone,
                    'company_name': 'Shree Siddhivinayak Creation',
                    'current_year': new Date().getFullYear()
                }
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('EmailJS error:', error);
        return false;
    }
}

// TextLocal integration
async function sendOTPViaTextLocal(phoneNumber, otp) {
    const apiKey = 'YOUR_TEXTLOCAL_API_KEY'; // Get from textlocal.in
    const sender = 'TXTLCL'; // Your sender ID
    
    const message = `Your OTP for Shree Siddhivinayak Creation is: ${otp}. Order confirmation will be sent separately.`;
    
    const response = await fetch('https://api.textlocal.in/send/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            apikey: apiKey,
            numbers: phoneNumber,
            message: message,
            sender: sender
        })
    });
    
    const result = await response.json();
    return {
        success: result.status === 'success',
        message: result.status === 'success' ? 'OTP sent successfully' : result.errors?.[0]?.message
    };
}

// Send order confirmation via Email
async function sendOrderConfirmation(email, orderDetails) {

    const serviceID = 'service_b8qp1sx';           // ← Use default_service or your actual service ID
    const templateID = 'template_bz6fy8r';         // Your order template
    const userID = 'S0ZGmLq5Zma9ehfkj';            // Your public key
    
    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: serviceID,
                template_id: templateID,
                user_id: userID,
                template_params: {
                    'user_email': email,
                    'order_id': orderDetails.orderId,
                    'order_amount': orderDetails.amount,
                    'order_date': new Date().toLocaleDateString(),
                    'company_name': 'Shree Siddhivinayak Creation',
                    'customer_name': document.getElementById('checkout-first-name').value + ' ' + document.getElementById('checkout-last-name').value
                }
            })
        });
        
        console.log('Order confirmation email sent:', response.ok);
        return response.ok;
    } catch (error) {
        console.error('Order confirmation email failed:', error);
        return false;
    }
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
    
    // Enable OTP verification immediately
    document.getElementById('verify-otp').disabled = false;
    
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
    if (otpTimer) clearInterval(otpTimer);
    startOTPTimer();
}

function resetOTPInputs() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (input) {
            input.value = '';
            input.classList.remove('error', 'filled');
        }
    }
}

// ==================== OTP INPUT HANDLING ====================
function setupOTPInputHandling() {
    // Setup OTP input event listeners
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (input) {
            input.addEventListener('input', handleOTPInput);
            input.addEventListener('keydown', handleOTPKeydown);
            input.addEventListener('paste', handleOTPPaste);
        }
    }
    
    // Verify OTP button
    const verifyOTPBtn = document.getElementById('verify-otp');
    if (verifyOTPBtn) {
        verifyOTPBtn.addEventListener('click', verifyOTP);
    }
    
    // Resend OTP button
    const resendOTPBtn = document.getElementById('resend-otp');
    if (resendOTPBtn) {
        resendOTPBtn.addEventListener('click', resendOTP);
    }
    
    // Cancel payment button
    const cancelPaymentBtn = document.getElementById('cancel-payment');
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', closePaymentModal);
    }
    
    // Close modal button
    const closeModalBtn = document.getElementById('close-payment-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePaymentModal);
    }
}

function handleOTPInput(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    input.value = numericValue;
    
    // Update filled class
    if (numericValue) {
        input.classList.add('filled');
    } else {
        input.classList.remove('filled');
    }
    
    // Remove error class when user types
    input.classList.remove('error');
    
    // Auto move to next input
    if (numericValue.length === 1 && index < 6) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
    }
    
    // Auto verify when all inputs are filled
    if (index === 6 && numericValue.length === 1) {
        setTimeout(() => {
            if (isOTPComplete()) {
                verifyOTP();
            }
        }, 100);
    }
}

function handleOTPKeydown(event) {
    const input = event.target;
    const value = input.value;
    const index = parseInt(input.getAttribute('data-index'));
    
    if (event.key === 'Backspace') {
        if (value.length === 0 && index > 1) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
                prevInput.value = '';
                prevInput.classList.remove('filled');
            }
        }
    }
}

function handleOTPPaste(event) {
    event.preventDefault();
    const pasteData = event.clipboardData.getData('text').slice(0, 6);
    const numericData = pasteData.replace(/[^0-9]/g, '');
    
    if (numericData.length === 6) {
        for (let i = 0; i < 6; i++) {
            const input = document.getElementById(`otp-${i + 1}`);
            if (input) {
                input.value = numericData[i];
                input.classList.add('filled');
            }
        }
        // Focus last input and verify
        document.getElementById('otp-6').focus();
        setTimeout(verifyOTP, 100);
    }
}

function isOTPComplete() {
    for (let i = 1; i <= 6; i++) {
        const input = document.getElementById(`otp-${i}`);
        if (!input || input.value.length !== 1) {
            return false;
        }
    }
    return true;
}

function verifyOTP() {
    const enteredOTP = getEnteredOTP();
    
    if (enteredOTP.length !== 6) {
        showNotification('Please enter complete 6-digit OTP');
        showOTPError();
        return;
    }
    
    // For demo purposes, accept any 6-digit OTP
    if (enteredOTP.length === 6) {
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
    if (otpTimer) clearInterval(otpTimer);
    
    // Update to final step
    updateStep(4);
    
    // Show success state
    setTimeout(() => {
        const modal = document.getElementById('payment-processing-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
            <div class="payment-success" style="text-align: center; padding: 30px;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--accent-gold); margin-bottom: 20px;"></i>
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">Payment Successful!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">Your payment of ₹${document.getElementById('payment-amount').textContent.slice(1)} has been processed successfully.</p>
                <p style="color: var(--text-secondary); margin-bottom: 25px;">Order confirmation has been sent to your email.</p>
                <button class="btn" id="close-payment-success" style="margin-top: 15px;">Continue Shopping</button>
            </div>
        `;
        
        // Add event listener for continue button
        document.getElementById('close-payment-success').addEventListener('click', () => {
            modal.style.display = 'none';
            completeOrder();
            paymentInProgress = false;
        });
        
    }, 1000);
}

function resendOTP() {
    const resendButton = document.getElementById('resend-otp');
    resendButton.disabled = true;
    resendButton.textContent = 'Resending...';
    
    resetOTPInputs();
    sendOTP(); // This will now use the actual phone number
    resetOTPTimer();
    
    setTimeout(() => {
        resendButton.textContent = 'Resend OTP';
        document.getElementById('otp-1').focus();
        // Notification is already shown in sendOTP()
    }, 2000);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-processing-modal');
    modal.style.display = 'none';
    
    // Reset payment state
    paymentInProgress = false;
    
    // Clear OTP timer
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
    
    // Reset OTP inputs
    resetOTPInputs();
    
    // Reset steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    document.getElementById('step-1').classList.add('active');
    
    // Hide OTP section
    document.getElementById('otp-section').style.display = 'none';
    
    showNotification('Payment cancelled');
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
        
        // Close modal when clicking outside
        if (target.id === 'imageModal') {
            closeModal();
        }
    });
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

    // Cart icon
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) cartIcon.addEventListener('click', () => showSection('cart'));

    // Checkout button
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
    setupOTPInputHandling();
    
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
            images: ['uploads/kurta1.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Navy Blue']
        },
        {
            _id: '2',
            name: 'White Chikan Kurta',
            description: 'Handcrafted chikan work on premium cotton',
            price: 5899,
            category: 'kurtas',
            images: ['uploads/kurta2.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['White', 'Off-White']
        },
        {
            _id: '3',
            name: 'Royal Maroon Sherwani',
            description: 'Regal sherwani with golden embroidery for weddings',
            price: 10999,
            category: 'sherwanis',
            images: ['uploads/shervani.jpg'],
            sizes: ['M', 'L', 'XL', 'XXL'],
            colors: ['Maroon', 'Red']
        },
        {
            _id: '4',
            name: 'Designer Indo-Western Suit',
            description: 'Contemporary fusion wear with traditional touch',
            price: 15399,
            category: 'modern',
            images: ['uploads/Indowestern.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Black', 'Grey', 'Navy']
        },
        {
            _id: '5',
            name: 'Traditional Dhoti Kurta Set',
            description: 'Complete traditional attire for festivals',
            price: 4599,
            category: 'traditional',
            images: ['uploads/dhotikurta.jpg'],
            sizes: ['M', 'L', 'XL'],
            colors: ['White', 'Cream']
        },
        {
            _id: '6',
            name: 'Embroidered Jodhpuri Suit',
            description: 'Classic Jodhpuri style with intricate embroidery',
            price: 14999,
            category: 'modern',
            images: ['uploads/jodhpuri.jpg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Blue', 'Black']
        }
    ];
    
    setupEventListeners();
    displayProducts(allProducts);
    updateCartCount();
    showSection('home');
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(300px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(300px); opacity: 0; }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .otp-input.error {
        border-color: #dc3545 !important;
        background: rgba(220, 53, 69, 0.1) !important;
    }
`;
document.head.appendChild(style);

// Start everything when page loads
document.addEventListener('DOMContentLoaded', init);