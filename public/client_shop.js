let products = [];
let currentCategory = 'All';
let currentSort = '';
let currentSearch = '';
let cart = [];

// Hardcoded products data with icons instead of image files
const productsData = [
    {
        id: 1,
        name: "Premium Dog Food (5kg)",
        description: "High-quality nutrition for adult dogs of all breeds",
        price: 1250,
        category: "Dog Food",
        icon: "fas fa-drumstick-bite",
        isOnSale: false,
        isBestSeller: true,
        stock: 50
    },
    {
        id: 2,
        name: "Flea & Tick Treatment",
        description: "3-month protection against fleas and ticks",
        price: 550,
        category: "Medications",
        icon: "fas fa-pills",
        isOnSale: true,
        salePrice: 450,
        stock: 45
    },
    {
        id: 3,
        name: "Premium Cat Carrier",
        description: "Comfortable and secure carrier for cats up to 10kg",
        price: 1800,
        category: "Accessories",
        icon: "fas fa-suitcase",
        stock: 30
    },
    {
        id: 4,
        name: "Premium Cat Food (3kg)",
        description: "Complete nutrition for indoor cats",
        price: 950,
        category: "Cat Food",
        icon: "fas fa-fish",
        stock: 25
    },
    {
        id: 5,
        name: "Interactive Dog Toy",
        description: "Durable chew toy that keeps dogs entertained",
        price: 650,
        category: "Accessories",
        icon: "fas fa-baseball-ball",
        isNew: true,
        stock: 40
    },
    {
        id: 6,
        name: "Medicated Pet Shampoo",
        description: "Gentle formula for sensitive skin",
        price: 350,
        category: "Medications",
        icon: "fas fa-shower",
        stock: 35
    }
];

// Load products when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
    initializeShop();
    loadCart();
    updateCartBadge();
});

// Cart functions
function loadCart() {
    const savedCart = localStorage.getItem('pawsAndClawsCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCart() {
    localStorage.setItem('pawsAndClawsCart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        cartBadge.textContent = cartCount;
        cartBadge.style.display = cartCount > 0 ? 'inline-block' : 'none';
    }
}

function addToCart(productId) {
    // Find the product in our data
    const product = productsData.find(p => p.id == productId);
    if (!product) {
        showError('Product not found');
        return;
    }
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id == productId);
    
    if (existingItem) {
        // Increment quantity if already in cart
        existingItem.quantity += 1;
        showCartNotification(`Increased quantity of ${product.name} in cart`);
    } else {
        // Add new item to cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.isOnSale ? product.salePrice : product.price,
            quantity: 1,
            icon: product.icon
        });
        showCartNotification(`Added ${product.name} to cart`);
    }
    
    // Save cart to localStorage
    saveCart();
    
    // Show the cart sidebar
    showCartSidebar();
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id == productId);
    if (index !== -1) {
        const removedItem = cart[index];
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
        showCartNotification(`Removed ${removedItem.name} from cart`);
    }
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id == productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCart();
            updateCartUI();
        }
    }
}

function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showCartSidebar() {
    let cartSidebar = document.getElementById('cartSidebar');
    
    if (!cartSidebar) {
        // Create cart sidebar if it doesn't exist
        cartSidebar = document.createElement('div');
        cartSidebar.id = 'cartSidebar';
        cartSidebar.className = 'cart-sidebar';
        document.body.appendChild(cartSidebar);
    }
    
    updateCartUI();
    
    // Show the sidebar
    cartSidebar.classList.add('show');
    
    // Add backdrop if it doesn't exist
    let backdrop = document.getElementById('cartBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'cartBackdrop';
        backdrop.className = 'cart-backdrop';
        backdrop.addEventListener('click', hideCartSidebar);
        document.body.appendChild(backdrop);
    }
    backdrop.classList.add('show');
}

function hideCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    const backdrop = document.getElementById('cartBackdrop');
    
    if (cartSidebar) {
        cartSidebar.classList.remove('show');
    }
    
    if (backdrop) {
        backdrop.classList.remove('show');
    }
}

function updateCartUI() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (!cartSidebar) return;
    
    const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    cartSidebar.innerHTML = `
        <div class="cart-header">
            <h5><i class="fas fa-shopping-cart me-2"></i> Your Cart</h5>
            <button class="btn-close" onclick="hideCartSidebar()"></button>
        </div>
        <div class="cart-items">
            ${cart.length === 0 ? 
                '<div class="empty-cart"><i class="fas fa-shopping-basket fa-3x mb-3"></i><p>Your cart is empty</p></div>' : 
                cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-icon">
                            <i class="${item.icon}"></i>
                        </div>
                        <div class="cart-item-details">
                            <h6>${item.name}</h6>
                            <div class="price">₱${item.price.toFixed(2)}</div>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                        <button class="btn btn-sm text-danger" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')
            }
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total:</span>
                <span class="total-amount">₱${totalAmount.toFixed(2)}</span>
            </div>
            <button class="btn btn-primary w-100" ${cart.length === 0 ? 'disabled' : ''} onclick="proceedToCheckout()">
                Proceed to Checkout
            </button>
        </div>
    `;
}

function proceedToCheckout() {
    // Save cart for checkout page
    localStorage.setItem('pawsAndClawsCart', JSON.stringify(cart));
    
    // Redirect to checkout/orders page
    window.location.href = 'client_orders.html';
}

// Set up event listeners
function setupEventListeners() {
    // Category filters
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.textContent;
            loadProducts();
        });
    });

    // Sort dropdown
    document.querySelector('select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        loadProducts();
    });

    // Search
    const searchInput = document.querySelector('input[type="text"]');
    const searchButton = document.querySelector('.btn-outline-secondary');
    
    searchButton.addEventListener('click', () => {
        currentSearch = searchInput.value;
        loadProducts();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value;
            loadProducts();
        }
    });
}

// Load products function
function loadProducts() {
    let filteredProducts = [...productsData];
    
    // Apply category filter
    if (currentCategory !== 'All') {
        filteredProducts = filteredProducts.filter(product => product.category === currentCategory);
    }
    
    // Apply search filter
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower)
        );
    }
    
    // Apply sorting
    if (currentSort) {
        switch(currentSort) {
            case 'Price: Low to High':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'Newest':
                filteredProducts = filteredProducts.filter(p => p.isNew).concat(
                    filteredProducts.filter(p => !p.isNew)
                );
                break;
            case 'Popular':
                filteredProducts = filteredProducts.filter(p => p.isBestSeller).concat(
                    filteredProducts.filter(p => !p.isBestSeller)
                );
                break;
        }
    }
    
    displayProducts(filteredProducts);
}

// Update the displayProducts function to use icons
function displayProducts(products) {
    const productsContainer = document.querySelector('.row.g-4');
    productsContainer.innerHTML = '';

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-muted">No products found matching your criteria.</p>
            </div>`;
        return;
    }

    products.forEach(product => {
        const productHtml = `
            <div class="col-md-4">
                <div class="card product-card h-100 border-0 shadow-sm">
                    <div class="position-relative">
                        <div class="bg-light p-4 text-center">
                            <i class="${product.icon} fa-3x mb-3" style="color: #4A628A;"></i>
                            <h6>${product.name}</h6>
                        </div>
                        ${product.isNew ? '<span class="position-absolute top-0 end-0 badge bg-success m-2">New</span>' : ''}
                        ${product.isBestSeller ? '<span class="position-absolute top-0 end-0 badge bg-primary m-2">Best Seller</span>' : ''}
                        ${product.isOnSale ? '<span class="position-absolute top-0 end-0 badge bg-danger m-2">Sale</span>' : ''}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title" style="color: #4A628A;">${product.name}</h5>
                        <p class="card-text text-muted small">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                ${product.isOnSale ? 
                                    `<span class="text-decoration-line-through text-muted me-2">₱${product.price.toFixed(2)}</span>
                                     <span class="fw-bold" style="color: #4A628A; font-size: 1.2rem;">₱${product.salePrice.toFixed(2)}</span>` :
                                    `<span class="fw-bold" style="color: #4A628A; font-size: 1.2rem;">₱${product.price.toFixed(2)}</span>`
                                }
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="addToCart(${product.id})">
                                <i class="fas fa-cart-plus me-1"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', productHtml);
    });
}

// Show error message
function showError(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    document.querySelector('.container.py-5').insertAdjacentHTML('afterbegin', alertHtml);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any shop functionality here
    initializeShop();
});

function initializeShop() {
    // Add event listeners for category pills
    const categoryPills = document.querySelectorAll('.category-pill');
    categoryPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Remove active class from all pills
            categoryPills.forEach(p => p.classList.remove('active'));
            // Add active class to clicked pill
            this.classList.add('active');
            // You can add filtering logic here
        });
    });
}
