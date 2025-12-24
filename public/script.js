// --- Global Configuration and Utilities ---

// The base URL for your backend API (Ensure your server is running on this port)
const API_BASE_URL = 'http://localhost:5000/api';
// Delivery Fee Constants
const OUTSIDE_NAIROBI_DELIVERY_FEE = 500;

// 1. Get Cart Data (STILL uses localStorage, as cart state is client-side)
const getCart = () => {
    const cart = localStorage.getItem('olmarithiCart');
    return cart ? JSON.parse(cart) : [];
};

// 2. Update Cart Data
const updateCart = (cart) => {
    localStorage.setItem('olmarithiCart', JSON.stringify(cart));
};

// 3. Get Auth Header (Utility to attach JWT for protected Admin routes)
const getAuthHeader = () => {
    // This key MUST match the one used in handleAdminLogin
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo')); 
    if (adminInfo && adminInfo.token) {
        return {
            'Authorization': `Bearer ${adminInfo.token}`,
            'Content-Type': 'application/json'
        };
    }
    return {};
};

// 4. Show Message Notification
const showMessage = (message, type = 'success') => {
    const existingMessage = document.getElementById('temp-message-box');
    if (existingMessage) existingMessage.remove();

    const messageBox = document.createElement('div');
    messageBox.id = 'temp-message-box';
    messageBox.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px;
        color: white; z-index: 1000; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: opacity 0.3s ease-in-out; opacity: 1;
    `;

    if (type === 'success') messageBox.style.backgroundColor = '#10b981';
    else if (type === 'error') messageBox.style.backgroundColor = '#ef4444';
    else if (type === 'info') messageBox.style.backgroundColor = '#3b82f6';

    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => messageBox.remove(), 300);
    }, 3500);
};

// 5. Global Checkout Function
const proceedToCheckout = () => {
    const cart = getCart();
    if (cart.length === 0) {
        showMessage("Your cart is empty. Please add items before checking out.", 'error');
        return;
    }
    window.location.href = 'checkout.html';
};

// 5. Save Auth Token
const saveToken = (token) => {
    // Stores the token along with the user info (optional, but good practice)
    localStorage.setItem('adminInfo', JSON.stringify({ token }));
};

// 6. Remove Auth Token (Used by logout)
const removeToken = () => {
    localStorage.removeItem('adminInfo');
};

const setupFeedbackModal = () => {
    console.log("setupFeedbackModal is running.");
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackModal = document.getElementById('feedback-modal');
    const closeBtn = document.getElementById('close-feedback-modal');
    const feedbackForm = document.getElementById('feedback-form');

    if (!feedbackIcon || !feedbackModal || !closeBtn || !feedbackForm) {
        console.error("CRITICAL ERROR: One or more feedback elements were not found.");
        return; 
    }
    
    console.log("SUCCESS: All feedback elements were found.");
        
    // 1. Open Modal
    feedbackIcon.addEventListener('click', (e) => {
        e.preventDefault(); 
        feedbackModal.style.display = 'block';
    });

    // 2. Close Modal
    closeBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
    });

    // 3. Close Modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === feedbackModal) {
            feedbackModal.style.display = 'none';
        }
    });

    // 4. Handle Form Submission (THE MISSING LOGIC IS HERE)
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('feedback-name');
        const emailInput = document.getElementById('feedback-email');
        const messageInput = document.getElementById('feedback-message');
        const submitButton = e.target.querySelector('button[type="submit"]');

        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        const feedbackData = {
            // If the name is empty, default to 'Anonymous'
            customerName: nameInput.value.trim(), 
            email: emailInput.value.trim(),
            message: messageInput.value.trim(),
        };
        
        // Ensure message is not empty before sending
        if (!feedbackData.message) {
            showMessage("Please enter your feedback message.", 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Send Feedback';
            return;
        }

        try {
            // *** POST request to your backend to save the feedback ***
            const response = await fetch(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                // 1. Show the success message (Thank You)
                showMessage("Thank you for sharing your feedback!", 'success');
                
                // 2. Close the modal
                feedbackModal.style.display = 'none';
                
                // 3. Clear the form fields
                feedbackForm.reset();
                
                // 4. If the admin is logged in, refresh their feedback list immediately
                if (document.body.dataset.pageType === 'admin' && typeof fetchAndRenderFeedback === 'function') {
                    fetchAndRenderFeedback(); 
                }
            } else {
                const errorData = await response.json();
                showMessage(errorData.message || 'Failed to send feedback. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Feedback submission error:', error);
            showMessage('Network error: Could not connect to the server.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Feedback';
        }
    });
};

// /public/script.js (Insert the following block)

// -------------------------------------------------------------
// --- ADMIN: FEEDBACK MANAGEMENT ---
// -------------------------------------------------------------

/**
 * Handles the deletion of a specific feedback entry.
 * @param {string} feedbackId - The ID of the feedback entry to delete.
 */
/**
 * Fetches all feedback from the backend and renders them in the admin panel.
 */
const fetchAndRenderFeedback = async () => {
    const feedbackSection = document.getElementById('manage-feedback-section');
    if (!feedbackSection) return;

    feedbackSection.innerHTML = '<p style="text-align: center; color: #aaa;">Loading feedback...</p>';

    try {
        const headers = getAuthHeader();
        if (!headers.Authorization) {
            feedbackSection.innerHTML = '<p style="text-align: center; color: #ef4444;">Access Denied. Please log in as Admin to view feedback.</p>';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/feedback`, { headers });
        if (!response.ok) throw new Error('Failed to fetch feedback.');
        
        const feedbackItems = await response.json();
        
        feedbackSection.innerHTML = ''; // Clear loading message

        if (feedbackItems.length === 0) {
            feedbackSection.innerHTML = '<p style="text-align: center; color: #aaa;">No client feedback has been submitted yet.</p>';
            return;
        }

        // Render the feedback table/list
        const listHtml = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Message</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${feedbackItems.map(item => `
                        <tr>
                            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
                            <td>${item.customerName}</td>
                            <td>${item.email || '-'}</td>
                            <td>${item.message}</td>
                            <td>
                                <button class="delete-feedback-btn" data-id="${item._id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        feedbackSection.innerHTML = listHtml;
        
        // Attach event listeners to the new delete buttons
        document.querySelectorAll('.delete-feedback-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                handleDeleteFeedback(e.target.dataset.id);
            });
        });

    } catch (error) {
        console.error('Error in fetchAndRenderFeedback:', error);
        feedbackSection.innerHTML = `<p style="text-align: center; color: #ef4444;">Error loading feedback. ${error.message}</p>`;
    }
};

const handleDeleteFeedback = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
        return;
    }

    try {
        const headers = getAuthHeader();
        if (!headers.Authorization) {
            showMessage('Admin authentication failed. Please log in again.', 'error');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
            method: 'DELETE',
            headers: headers,
        });

        if (response.ok) {
            showMessage('Feedback deleted successfully.', 'success');
            // Re-render the list to show the change
            fetchAndRenderFeedback(); 
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete feedback.');
        }

    } catch (error) {
        console.error('Error deleting feedback:', error);
        showMessage(error.message || 'Error deleting feedback.', 'error');
    }
};



// -------------------------------------------------------------
// --- CORE BACKEND INTEGRATION FUNCTIONS (PRODUCTS) ---
// -------------------------------------------------------------

/**
 * Fetches products and renders them on Shop/Index pages.
 * It uses server-side filtering for the shop pages and client-side filtering for index (Featured).
 * @param {string} category - Optional category slug (e.g., 'backpacks') for shop page filtering.
 */
const fetchAndRenderProducts = async (category = null) => {
    const pageType = document.body.dataset.pageType;
    let endpoint = `${API_BASE_URL}/products`; // Base endpoint

    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">Loading products...</p>';

    try {
        // 1. DYNAMIC URL CONSTRUCTION: If a category is provided (from shop.html),
        // we use the new query parameter to let the backend do the filtering.
        if (category) {
            endpoint += `?category=${category}`;
        }
        // NOTE: For the 'index' page, the URL remains /api/products to fetch all products,
        // as the index page filtering (for 'featured') is still done client-side below.
        
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch products from API.');

        let products = await response.json();
        
        // 2. INDEX PAGE FILTERING: This logic remains the same.
        if (pageType === 'index') {
            products = products.filter(p => p.category === 'featured').slice(0, 6);
            if (products.length === 0) {
                // Fallback: If no 'featured' products exist, take the first 6 products
                products = products.slice(0, 6);
            }
        }


        productGrid.innerHTML = ''; // Clear loading message

        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No products available in this category.</p>';
            return;
        }

        // 3. PRODUCT RENDERING (Your original logic, which is correct)
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.id = product._id; 
            productCard.dataset.name = product.name;
            productCard.dataset.price = product.price;
            productCard.dataset.image = product.imageUrl;

            productCard.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 70)}...</p>
                <span class="price">KSH ${product.price.toFixed(2)}</span>
                <button class="add-to-cart-btn" 
                                data-product-id="${product._id}" 
                                data-product-name="${product.name}" 
                                data-product-price="${product.price}" 
                                data-product-image="${product.imageUrl}">
                    Add to Cart
                </button>
            `;
            productGrid.appendChild(productCard);
        });

    } catch (error) {
        console.error('Error in fetchAndRenderProducts:', error);
        productGrid.innerHTML = `<p style="text-align: center; padding: 20px; color: #ef4444;">Error loading products. Check backend server (${API_BASE_URL}) status.</p>`;
    }
};

// Renders the categories into the sidebar menu in index.html
const renderCategories = (categories) => {
    const menu = document.getElementById('side-menu');
    if (!menu) return;

    // Preserve the close button, clear everything else
    const closeBtn = document.getElementById('close-menu'); 
    menu.innerHTML = ''; 
    menu.appendChild(closeBtn); 

    // 1. Add 'All Products' link (optional, but helpful)
    const allProductsLink = document.createElement('a');
    allProductsLink.href = 'shop.html';
    allProductsLink.textContent = 'All Products';
    menu.appendChild(allProductsLink);

    // 2. Add dynamic links for each category
    categories.forEach(category => {
        const link = document.createElement('a');
        // KEY CHANGE: All links now use the single shop.html with a query parameter
        link.href = `shop.html?category=${category.slug}`;
        link.textContent = category.name;
        menu.appendChild(link);
    });
};

const loadDynamicNavigation = async () => {
    const categories = await fetchCategories(); // Re-use the fetch function
    const sideMenu = document.getElementById('side-menu');

    // Helper to create link
    const createLink = (cat) => {
        // Use the SLUG for the URL query parameter
        const urlSlug = cat.slug || cat; 
        // Use the NAME for the link display text
        const linkText = cat.name || cat; 
        
        return `<a href="shop.html?category=${urlSlug}">${linkText}</a>`;
    };

    // 1. Update Side Menu (Mobile/Index)
    if (sideMenu) {
        let html = '<a href="#" id="close-menu">&times;</a>'; 
        categories.forEach(cat => { 
            // Only create link if we have the necessary properties
            if (cat.slug && cat.name) {
                html += createLink(cat);
            }
        });
        sideMenu.innerHTML = html;
        
        // Re-attach close listener
        document.getElementById('close-menu').addEventListener('click', (e) => {
            e.preventDefault();
            sideMenu.style.width = '0';
        });
    }
    
    // 2. Update Header Nav (Optional - if you want categories in the top bar)
    // You might want to keep the top bar simple, but if you want them there:
    // This part depends on your specific design preference.
};

// -------------------------------------------------------------
// --- CHECKOUT AND PAYMENT (M-PESA) LOGIC ---
// -------------------------------------------------------------

const handleMpesaPayment = async (orderData) => {
    const phone = orderData.phone.startsWith('0') ? '254' + orderData.phone.substring(1) : orderData.phone;
    // For M-Pesa testing, charge 1 KSH only, but use the real total for the order creation
    const paymentAmount = 1; // Testing only! Use orderData.totalAmount for live system
    const amountToCharge = paymentAmount; 
    
    const payButton = document.getElementById('pay-button');
    const originalText = payButton.textContent;
    
    showMessage(`Initiating M-Pesa STK Push for KSH ${amountToCharge.toFixed(2)} (Test) to ${phone}. Please wait...`, 'info');
    
    try {
        // 1. Initiate STK Push
        const response = await fetch(`${API_BASE_URL}/mpesa/stk-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amountToCharge,
                phone: phone,
                orderId: new Date().getTime().toString() 
            }),
        });

        const data = await response.json();
        
        if (data.ResponseCode === '0') {
            showMessage('M-Pesa prompt sent! Enter your PIN. Simulating backend callback...', 'success');
            
            // 2. MOCKING the asynchronous M-Pesa Callback
            // In a real flow, your server handles the callback. Here, we pause and assume success.
            await new Promise(resolve => setTimeout(resolve, 8000)); 

            // 3. Create the final order on our backend after 'successful' payment
            const finalOrder = await createFinalOrder(orderData, 'MOCK_MPESA_ID_' + Date.now());
            
            // 4. Update the UI
            handleSuccessfulCheckout(finalOrder);

        } else {
             showMessage(`Payment failed or cancelled. ${data.ResponseDescription || data.errorMessage || 'An unknown error occurred.'}`, 'error');
        }


    } catch (error) {
        console.error('Checkout error:', error);
        showMessage('A server error occurred during M-Pesa processing.', 'error');
    } finally {
        payButton.disabled = false;
        payButton.textContent = originalText;
    }
};


/**
 * Creates the final order on the backend, which triggers the email notifications.
 */
const createFinalOrder = async (orderData, transactionId) => {
    
    const cart = getCart();
    const itemsForAPI = cart.map(item => ({
        name: item.name,
        qty: 1, 
        price: item.price,
        product: item._id // Using the MongoDB product ID stored in the cart item
    }));

    const apiOrderData = {
        customerName: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        deliveryLocation: orderData.deliveryAddress,
        items: itemsForAPI,
        totalAmount: orderData.totalAmount,
        deliveryFee: orderData.deliveryFee,
        transactionId: transactionId,
    };

    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiOrderData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Order Creation Failed: ${errorData.message}`);
    }

    const createdOrder = await response.json();
    return createdOrder;
};

/**
 * Updates the UI after a successful order.
 */
const handleSuccessfulCheckout = (order) => {
    localStorage.removeItem('olmarithiCart');
    
    const checkoutSection = document.getElementById('checkout-form-section');
    const confirmationSection = document.getElementById('confirmation-message');
    const finalPaidAmountSpan = document.getElementById('final-paid-amount');
    const finalEmailSpan = document.getElementById('final-email-address');

    if (checkoutSection) checkoutSection.style.display = 'none';
    if (confirmationSection) confirmationSection.style.display = 'block';

    if (finalPaidAmountSpan) finalPaidAmountSpan.textContent = `KSH ${order.totalAmount.toFixed(2)}`;
    if (finalEmailSpan) finalEmailSpan.textContent = order.email;
    
    showMessage("Order created and payment confirmed! Check your email for details.", 'success');
};


// -------------------------------------------------------------
// --- ADMIN PANEL LOGIC (AUTHENTICATION & CRUD) ---
// -------------------------------------------------------------

const toggleAdminViews = (isLoggedIn) => {
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    
    if (loginSection && adminPanel) {
        loginSection.style.display = isLoggedIn ? 'none' : 'block';
        adminPanel.style.display = isLoggedIn ? 'block' : 'none';
    }
};

const logoutAdmin = (e) => {
    if(e) e.preventDefault();
    localStorage.removeItem('adminInfo'); // Must match the key used by getAuthHeader()
    showMessage('Logged out successfully.', 'info');
    window.location.reload(); 
};

const handleAdminLogin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const button = event.target.querySelector('button');
    button.textContent = 'Logging in...';
    button.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('Server response status:', response.status);
        console.log('Server response data:', data);

        if (response.ok) {
            // CRITICAL: Save the token/user data using the 'adminInfo' key
            localStorage.setItem('adminInfo', JSON.stringify(data)); 
            showMessage(`Welcome, Admin!`, 'success');
            
            // Now that we are logged in, switch views
            toggleAdminViews(true); 
            loadAdminData(); // Load products and orders
            
            const adminUserIdSpan = document.getElementById('admin-user-id');
            if(adminUserIdSpan) adminUserIdSpan.textContent = data.userId || 'Authenticated';
            
        } else {
            showMessage(data.message || 'Login failed. Invalid credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('A network error occurred. Check server status.', 'error');
    } finally {
        button.textContent = 'Log In';
        button.disabled = false;
    }
};

// ------------------- Events Management (Admin + Public) -------------------

/**
 * Fetch events (public use).
 * GET /api/events
 */
const fetchEventsPublic = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return await res.json();
    } catch (err) {
        console.error('fetchEventsPublic error', err);
        return [];
    }
};

// --- Category Management in script.js ---

const addCategoryForm = document.getElementById('add-category-form');
const newCategoryNameInput = document.getElementById('new-category-name');
const closeCatModalButton = document.getElementById('close-cat-modal');
const categoryModal = document.getElementById('add-category-modal');
const openCatModalBtn = document.getElementById('btn-open-category-modal'); 

// 2. Add the click listener
if (openCatModalBtn) {
    openCatModalBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent page reload
        categoryModal.style.display = 'block'; // Open the modal
    });
}

if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryName = newCategoryNameInput.value.trim();
        if (!categoryName) {
            showMessage('Category name cannot be empty.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: getAuthHeader(), // Use your existing authorization utility
                body: JSON.stringify({ name: categoryName }),
            });

            if (response.ok) {
                const newCategory = await response.json();
                showMessage(`Category '${newCategory.name}' created successfully!`, 'success');
                
                // 1. Hide the modal
                categoryModal.style.display = 'none';
                newCategoryNameInput.value = ''; // Clear input

                // 2. Refresh/update the product category dropdown (Important!)
                // You will need a function to call the GET /api/categories route 
                // and dynamically populate the <select> in admin.html and the 
                // shop sidebar (side-menu).
                await populateCategoryDropdowns(); 

            } else {
                const errorData = await response.json();
                showMessage(errorData.message || 'Failed to create new category.', 'error');
            }
        } catch (error) {
            console.error('Category creation error:', error);
            showMessage('Network error. Failed to connect to server.', 'error');
        }
    });

    closeCatModalButton.addEventListener('click', () => {
        categoryModal.style.display = 'none';
    });
}

// --- NEW: Category Management Functions ---

const fetchCategories = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        return await res.json();
    } catch (e) {
        console.warn("Could not fetch categories, using defaults", e);
        // FIXED FALLBACK DATA:
        return [
            // Use 'slug' instead of 'display' to match your populate function
            { slug: 'laptop_sleeves', name: 'Laptop Sleeves' },
            { slug: 'backpacks', name: 'Backpacks' },
            { slug: 'totes', name: 'Totes' },
            { slug: 'blouses', name: 'Blouses' },
            { slug: 'recycled_bags', name: 'Recycled Bags' }
        ];
    }
};


// Fetches the categories from the backend and calls the renderer
const fetchAndRenderCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error('Error fetching categories for sidebar:', error);
    }
};

// /public/script.js (Inside DOMContentLoaded listener)
// Make sure this is called when index.html loads:
if (document.body.dataset.pageType === 'index') {
    fetchAndRenderCategories(); // <--- Add this call to run the function
}

const populateCategoryDropdowns = async () => {
    const categories = await fetchCategories();
    const closeProductModalButton = document.getElementById('close-product-modal');
    if (closeProductModalButton) {
        closeProductModalButton.onclick = () => {
            // Also good to check if the modal itself exists, but this is usually safe if the button exists.
            const productModal = document.getElementById('add-product-modal');
            if (productModal) {
                 productModal.style.display = 'none';
            }
        };
    }
    const select = document.getElementById('product-category');

    if (select) {
        select.innerHTML = '<option value="featured">Featured (Home Page)</option>';
        
        categories.forEach(cat => {
            // Check if the category object has the expected structure from the new backend
            if (cat.slug && cat.name) { 
                const option = document.createElement('option');
                option.value = cat.slug;         // The value used in the backend (e.g., 'curtain')
                option.textContent = cat.name;   // The user-friendly name (e.g., 'Curtain')
                select.appendChild(option);
            }
        });
    }
    // ... (rest of the function)
};
/**
 * Render events for Admin management list (with delete controls)
 */
const renderAdminEvents = async () => {
    const listEl = document.getElementById('admin-events-list');
    if (!listEl) return;
    listEl.innerHTML = '<p style="text-align:center;color:#aaa;">Loading events…</p>';

    try {
        const events = await fetchEventsPublic();
        if (events.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;color:#aaa;">No events found.</p>';
            return;
        }

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';

        events.forEach(ev => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid #444;background:#1a1a1a;border-radius:6px;';
            item.innerHTML = `
                <div>
                  <strong style="color:#4ade80;">${ev.title}</strong>
                  <div style="color:#ccc;font-size:0.95em;">${ev.location} • ${new Date(ev.dateTime).toLocaleString()}</div>
                  ${ev.notes ? `<div style="color:#999;margin-top:6px">${ev.notes}</div>` : ''}
                </div>
                <div>
                  <button class="delete-event-btn" data-id="${ev._id}" style="background:#ef4444;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Delete</button>
                </div>
            `;
            container.appendChild(item);
        });

        listEl.innerHTML = '';
        listEl.appendChild(container);

        // Attach delete handlers
        listEl.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!confirm('Delete this event? This action cannot be undone.')) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
                        method: 'DELETE',
                        headers: getAuthHeader()
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.message || 'Failed to delete event');
                    }
                    showMessage('Event deleted.', 'success');
                    renderAdminEvents();
                    // refresh public product/event views
                } catch (err) {
                    console.error('delete event error', err);
                    showMessage('Failed to delete event.', 'error');
                }
            });
        });

    } catch (err) {
        console.error('renderAdminEvents error', err);
        listEl.innerHTML = `<p style="text-align:center;color:#ef4444;">Error loading events.</p>`;
    }
};

/**
 * Admin adds an event -> POST /api/events (requires Authorization header)
 */
const handleAdminAddEvent = async (ev) => {
    ev.preventDefault();
    const btn = ev.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Publishing…';

    const title = document.getElementById('event-title').value;
    const location = document.getElementById('event-location').value;
    const dateTime = document.getElementById('event-datetime').value;
    const notes = document.getElementById('event-notes').value;
    const host = document.getElementById('event-host').value;

    if (!title || !location || !dateTime) {
        showMessage('Please fill required fields.', 'error');
        btn.disabled = false;
        btn.textContent = 'Publish Event';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ title, location, dateTime, notes, host })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create event');

        showMessage('Event published!', 'success');
        ev.target.reset();
        renderAdminEvents();

        // Optionally trigger a refresh for public pages — the public pages poll every 30s
        // For immediate push, you could consider sending a message via websockets or server-sent events.
    } catch (err) {
        console.error('create event error', err);
        showMessage('Error publishing event.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publish Event';
    }
};

// Attach events in loadAdminData (update existing function)
const attachEventAdminHandlers = () => {
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
        addEventForm.addEventListener('submit', handleAdminAddEvent);
    }
    // also render list
    renderAdminEvents();
};

// Update loadAdminData() to call attachEventAdminHandlers()
// In your loadAdminData function, after other setups add:
    // attachEventAdminHandlers();


const checkAdminStatus = () => {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
    const adminLoginForm = document.getElementById('admin-login-form');
    const logoutButton = document.getElementById('logout-btn');
    
    if (adminInfo && adminInfo.token) {
        // Logged in: Show dashboard and load data
        toggleAdminViews(true);
        loadAdminData(); 
        
    } else {
        // Not logged in: Show login form
        toggleAdminViews(false);

        // Attach listener to the static login form in admin.html
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', handleAdminLogin);
        }
    }

    if(logoutButton) {
        logoutButton.addEventListener('click', logoutAdmin);
    }
};

const loadAdminData = () => {
    // 1. Fetch and render products for management
    fetchAndRenderAdminProducts(); 
    // 2. Fetch and render orders
    fetchAndRenderOrders();
    fetchAndRenderFeedback();
     
    // 3. Set up listeners for Add Product Form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
        // Set up listener for image preview (Placeholder logic)
        document.getElementById('product-image-file').addEventListener('change', (e) => {
            const preview = document.getElementById('image-preview');
            if (e.target.files.length > 0) {
                preview.src = URL.createObjectURL(e.target.files[0]);
                preview.style.display = 'block';
            }
        });
    }
    
    // 4. Set up listener for Edit Form (if the modal exists)
    const editProductForm = document.getElementById('edit-product-form');
    if(editProductForm) {
        editProductForm.addEventListener('submit', handleUpdateProduct);
    }
    attachEventAdminHandlers();
    populateCategoryDropdowns();
};

const fetchAndRenderAdminProducts = async () => {
    const productList = document.getElementById('manage-products-list');
    if (!productList) return;
    productList.innerHTML = '<p style="text-align: center; color: #aaa;">Loading products...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products.');
        const products = await response.json();
        
        productList.innerHTML = '';
        if (products.length === 0) {
            productList.innerHTML = '<p style="text-align: center; color: #aaa;">No products in the store.</p>';
            return;
        }

        products.forEach(product => {
            const item = document.createElement('div');
            item.classList.add('product-management-item');
            item.innerHTML = `
                <div class="product-info">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/60'}" alt="${product.name}">
                    <div>
                        <strong>${product.name}</strong> 
                        <span style="color: #ccc; font-size: 0.9em;">(KSH ${product.price.toFixed(2)})</span>
                        <p style="margin: 0; font-size: 0.8em; color: #999;">Cat: ${product.category}</p>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${product._id}">Edit</button>
                    <button class="delete-btn" data-id="${product._id}">Delete</button>
                </div>
            `;
            productList.appendChild(item);
        });
        
        // Attach action listeners
        productList.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteProduct));
        productList.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleOpenEditModal));

    } catch (error) {
        productList.innerHTML = `<p style="text-align: center; color: #ef4444;">Error: ${error.message}</p>`;
    }
};

const handleAddProduct = async (event) => {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    
    // 1. Create FormData (Automatically grabs all inputs, including the file)
    const formData = new FormData(form);

    // 2. Get Auth Token
    const authHeader = getAuthHeader(); 
    if (!authHeader.Authorization) {
        showMessage("You are not logged in!", "error");
        return;
    }

    button.textContent = 'Uploading...';
    button.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                // IMPORTANT: We ONLY send the Authorization header. 
                // We do NOT send 'Content-Type': 'application/json' 
                // because the browser automatically sets the correct Multipart boundary for files.
                'Authorization': authHeader.Authorization 
            },
            body: formData, // Send the FormData object directly
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(`${data.name} added successfully!`, 'success');
            form.reset();
            document.getElementById('image-preview').style.display = 'none';
            fetchAndRenderAdminProducts(); // Refresh Admin list
            // Optionally fetch products again if on the shop page
        } else {
            throw new Error(data.message || 'Failed to add product.');
        }

    } catch (error) {
        console.error('Upload Error:', error);
        showMessage(`Error adding product: ${error.message}`, 'error');
    } finally {
        button.textContent = 'Add Product to Store';
        button.disabled = false;
    }
};

const handleDeleteProduct = async (event) => {
    const productId = event.target.dataset.id;
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });

        if (response.ok) {
            showMessage('Product deleted successfully.', 'success');
            fetchAndRenderAdminProducts(); // Refresh Admin list
            fetchAndRenderProducts(); // Refresh public view
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete product.');
        }

    } catch (error) {
        showMessage(`Error deleting product: ${error.message}`, 'error');
    }
};

const handleOpenEditModal = async (event) => {
    const productId = event.target.dataset.id;
    const modal = document.getElementById('edit-product-modal');
    // Placeholder logic for now
    if (modal) {
        showMessage(`Opening edit modal for Product ID: ${productId}. (Not fully implemented yet)`, 'info');
        modal.style.display = 'block';
        // In a real app, you would fetch the product details here and populate the form fields
    }
};

const handleUpdateProduct = async (event) => {
    event.preventDefault();
    // Placeholder logic for now
    showMessage("Product Update logic goes here.", 'info');
    document.getElementById('edit-product-modal').style.display = 'none';
    fetchAndRenderAdminProducts();
};


const fetchAndRenderOrders = async () => {
    const ordersSection = document.getElementById('manage-orders-section');
    if (!ordersSection) return;
    ordersSection.innerHTML = '<p style="text-align: center; color: #aaa;">Loading orders...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'GET',
            headers: getAuthHeader(),
        });

        if (!response.ok) throw new Error('Failed to fetch orders.');
        const orders = await response.json();
        
        let tableHTML = `
            <table id="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        orders.forEach(order => {
            const shortId = order._id.substring(18); 
            const statusColor = order.paymentStatus === 'Paid' ? '#4ade80' : '#ef4444';
            
            tableHTML += `
                <tr>
                    <td>...${shortId}</td>
                    <td>${order.customerName}<br><small>${order.email}</small></td>
                    <td>KSH ${order.totalAmount.toFixed(2)}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${order.paymentStatus}</td>
                    <td>${order.deliveryLocation}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });
        
        tableHTML += `</tbody></table>`;
        ordersSection.innerHTML = tableHTML;
        
    } catch (error) {
        ordersSection.innerHTML = `<p style="text-align: center; color: #ef4444;">Error loading orders: ${error.message}</p>`;
    }
};

// -------------------------------------------------------------
// --- MAIN INITIALIZATION ---
// -------------------------------------------------------------

// This is where all logic is initialized once the page content is loaded
document.addEventListener('DOMContentLoaded', async () => {
    
    if (document.getElementById('feedback-icon')) {
        setupFeedbackModal();
    }
    
    // Check if the side menu exists before attempting to load navigation
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu) {
        await loadDynamicNavigation();
    }

    // --- Product Fetching on Shop/Index Pages ---
    const pageType = document.body.dataset.pageType;

    if (pageType === 'index') {
        // 1. Load featured products for the home page
        fetchAndRenderProducts(); // Pass no argument, it will default to fetching all, then filter client-side for 'featured'
       
        // 2. Load and render the dynamic categories in the sidebar
        fetchAndRenderCategories();
        
    } else if (pageType === 'shop-category') {
        // This runs only on the single shop.html page
        
        // 1. Read the category slug from the URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const categorySlug = urlParams.get('category') || ''; // Get category from ?category=slug
        
        // 2. Update the title of the shop page dynamically
        const titleElement = document.getElementById('category-title');
        if (titleElement) {
            // Converts 'laptop_sleeves' to 'Laptop Sleeves'
            const titleText = categorySlug 
                ? categorySlug.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                : 'All Products';
                
            titleElement.textContent = titleText; 
        }
        
        // 3. Call the product fetching function with the retrieved category slug
        // The new function uses this slug for server-side filtering
        fetchAndRenderProducts(categorySlug); 
        fetchAndRenderFeedback();

    }

    // --- Admin Page Logic ---
    // Check if the admin-panel element exists, if so, run the status check
    if (document.getElementById('admin-panel')) {
        checkAdminStatus();
    }

    // --- Add to Cart Functionality ---
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const productId = event.target.dataset.productId;
            const productName = event.target.dataset.productName;
            const productPrice = parseFloat(event.target.dataset.productPrice);
            const productImage = event.target.dataset.productImage;
            
            if (productId && productName && !isNaN(productPrice)) {
                const cart = getCart();
                // Store detailed info needed for checkout
                cart.push({ 
                    _id: productId,
                    name: productName, 
                    price: productPrice, 
                    image: productImage, 
                    qty: 1
                });
                updateCart(cart);
                showMessage(`${productName} added to cart!`, 'success');
            } else {
                 showMessage("Error retrieving product details.", 'error');
            }
        }
    });


    // --- Cart Page Logic (Unchanged display, but uses new data structure) ---
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        const renderCart = () => {
            const cart = getCart();
            cartItemsContainer.innerHTML = '';
            let subtotal = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p style="text-align: center;">Your cart is empty.</p>';
                return;
            }

            cart.forEach((item, index) => {
                subtotal += item.price;
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.innerHTML = `
                    <img src="${item.image || 'https://via.placeholder.com/60'}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 4px;">
                    <div style="flex-grow: 1;">
                        <h4 style="margin: 0; color: #4ade80;">${item.name}</h4>
                        <p style="margin: 5px 0 0 0;">KSH ${item.price.toFixed(2)}</p>
                    </div>
                    <button class="remove-from-cart" data-index="${index}" style="background-color: #ef4444; padding: 5px 10px; font-size: 0.8em;">Remove</button>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
            
            // Display subtotal
            const totalElement = document.createElement('div');
            totalElement.style.cssText = 'text-align: right; padding-top: 20px; border-top: 1px solid #333; margin-top: 20px;';
            totalElement.innerHTML = `<h3>Cart Subtotal: KSH ${subtotal.toFixed(2)}</h3>`;
            cartItemsContainer.appendChild(totalElement);

            // Add remove button functionality
            document.querySelectorAll('.remove-from-cart').forEach(button => {
                button.addEventListener('click', (e) => {
                    const indexToRemove = parseInt(e.target.dataset.index);
                    let currentCart = getCart();
                    currentCart.splice(indexToRemove, 1);
                    updateCart(currentCart);
                    renderCart(); 
                    showMessage("Item removed from cart.", 'info');
                });
            });
        };
        
        renderCart(); // Initial rendering
    }
    
    // --- Checkout Page Logic ---
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        const locationSelect = document.getElementById('location-type');
        const cartTotalSpan = document.getElementById('cart-total');
        const deliveryFeeSpan = document.getElementById('delivery-fee');
        const grandTotalSpan = document.getElementById('grand-total');
        const payButton = document.getElementById('pay-button');

        const cart = getCart();
        const baseCartTotal = cart.reduce((sum, item) => sum + item.price, 0);
        let currentDeliveryFee = 0;

        // Redirect if cart is empty, unless confirmation message is already showing
        if (baseCartTotal === 0 && document.getElementById('confirmation-message').style.display === 'none') {
             showMessage("Your cart is empty. Redirecting to cart.", 'error');
             setTimeout(() => { window.location.href = 'cart.html'; }, 1500);
        }

        const updateOrderSummary = () => {
            const location = locationSelect ? locationSelect.value : 'nairobi';
            
            if (location === 'outside') {
                currentDeliveryFee = OUTSIDE_NAIROBI_DELIVERY_FEE;
            } else {
                currentDeliveryFee = 0;
            }

            const grandTotal = baseCartTotal + currentDeliveryFee;

            if (cartTotalSpan) cartTotalSpan.textContent = `KSH ${baseCartTotal.toFixed(2)}`;
            if (deliveryFeeSpan) deliveryFeeSpan.textContent = `KSH ${currentDeliveryFee.toFixed(2)}`;
            if (grandTotalSpan) grandTotalSpan.textContent = `KSH ${grandTotal.toFixed(2)}`;
            
            if (payButton) payButton.textContent = `Pay KSH ${grandTotal.toFixed(2)} via M-Pesa`;
            
            return { baseCartTotal, currentDeliveryFee, grandTotal };
        };

        if (locationSelect) {
            updateOrderSummary(); // Run immediately on load
            locationSelect.addEventListener('change', updateOrderSummary);
        }
        
        // --- FINAL SUBMISSION HANDLER ---
        checkoutForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const summary = updateOrderSummary();
            const email = document.getElementById('email').value;
            const phoneNumber = document.getElementById('phone-number').value;
            const deliveryAddress = document.getElementById('delivery-address').value;
            const customerName = deliveryAddress.split(',')[0].trim() || 'Customer';

            if (!email || !phoneNumber || !deliveryAddress) {
                showMessage("Please fill in all required fields.", 'error');
                return;
            }

            payButton.disabled = true;
            payButton.textContent = 'Contacting M-Pesa...';

            const orderData = {
                customerName,
                email,
                phone: phoneNumber,
                deliveryAddress: deliveryAddress,
                totalAmount: summary.grandTotal,
                deliveryFee: summary.currentDeliveryFee,
            };

            // Call the M-Pesa payment handler
            await handleMpesaPayment(orderData);
        });
    }
});