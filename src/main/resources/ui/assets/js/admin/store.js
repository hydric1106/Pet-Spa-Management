let currentUser = null;
let products = [];
let filteredProducts = [];
let customers = [];
let categories = [];
let cart = new Map();
let componentsInitialized = false;
let pendingCheckoutPayload = null;

const PRODUCT_IMAGE_BASE_PATH = '../assets/images/products';
const PRODUCT_IMAGE_PLACEHOLDER = `${PRODUCT_IMAGE_BASE_PATH}/placeholder.svg`;
const PRODUCT_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initStorePage();
});

document.addEventListener('bridgeReady', () => {
    initStorePage();
});

async function initStorePage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('sales', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        await initializePage();
        setupEventListeners();
        setupLogout();
    } catch (error) {
        console.error('Error initializing store page:', error);
    }
}

async function initializePage() {
    await waitForBridge();

    const userResult = await callBridge('getCurrentUser');
    if (!userResult.success || !userResult.data) {
        window.javaBridge.navigateTo('index.html');
        return;
    }

    currentUser = userResult.data;
    updateUserDisplay();

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = 'Store Sales';
    }

    await Promise.all([
        loadProducts(),
        loadCustomers()
    ]);

    renderProducts();
    renderCart();
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('currentUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.fullName || currentUser.email || 'Admin';
    }
}

// =============================================================================
// NAVIGATION
// =============================================================================

function handleNavigation(page) {
    const pageRoutes = {
        dashboard: 'dashboard.html',
        bookings: 'bookings.html',
        pets: 'pets.html',
        services: 'services.html',
        clients: 'clients.html',
        staff: 'staff.html',
        workshifts: 'workshifts.html',
        sales: 'store.html',
        stock: 'stock.html',
        'billing-history': 'billing_history.html',
    };

    const route = pageRoutes[page];
    if (route && window.javaBridge) {
        window.javaBridge.navigateTo(`admin/${route}`);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadProducts() {
    const result = await callBridge('getAllProducts');
    if (!result.success || !Array.isArray(result.data)) {
        products = [];
        filteredProducts = [];
        categories = [];
        showToast(result.message || 'Failed to load products.', 'error');
        return;
    }

    products = (result.data || []).filter((item) => item.isActive !== false);
    filteredProducts = [...products];

    categories = [...new Set(products.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    populateCategoryFilter();
}

async function loadCustomers() {
    const result = await callBridge('getAllCustomers');
    if (!result.success || !Array.isArray(result.data)) {
        customers = [];
        populateCustomerSelect();
        return;
    }

    customers = result.data || [];
    populateCustomerSelect();
}

// =============================================================================
// FILTERS AND RENDERING
// =============================================================================

function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function populateCustomerSelect() {
    const customerSelect = document.getElementById('salesCustomerSelect');
    if (!customerSelect) return;

    customerSelect.innerHTML = '<option value="">Walk-in Customer</option>';
    customers.forEach((customer) => {
        const customerId = parseEntityId(customer.id);
        if (!customerId) return;

        const option = document.createElement('option');
        option.value = String(customerId);
        option.textContent = `${customer.fullName || 'Customer'} - ${customer.phoneNumber || 'No phone'}`;
        customerSelect.appendChild(option);
    });
}

function applyProductFilters() {
    const searchText = (document.getElementById('productSearchInput')?.value || '').trim().toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter')?.value || '';

    filteredProducts = products.filter((product) => {
        const name = (product.name || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        const category = product.category || '';
        const searchMatched = !searchText || name.includes(searchText) || sku.includes(searchText) || category.toLowerCase().includes(searchText);
        const categoryMatched = !selectedCategory || category === selectedCategory;

        return searchMatched && categoryMatched;
    });

    renderProducts();
}

function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    const emptyState = document.getElementById('productsEmptyState');
    if (!productGrid || !emptyState) return;

    productGrid.innerHTML = '';

    if (!filteredProducts.length) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    filteredProducts.forEach((product) => {
        const productId = parseEntityId(product.id);
        if (!productId) return;

        const stockQty = Number.isInteger(product.stockQty) ? product.stockQty : Number.parseInt(product.stockQty || '0', 10) || 0;
        const lowStock = stockQty > 0 && stockQty <= 5;
        const imageCandidates = buildProductImageCandidates(product);

        const card = document.createElement('article');
        card.className = 'bg-white dark:bg-surface-dark rounded-2xl p-4 border border-slate-200/60 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3';
        card.innerHTML = `
            <div class="relative h-36 rounded-xl bg-slate-100 dark:bg-gray-800 overflow-hidden">
                <img
                    class="product-image w-full h-full object-cover"
                    src="${escapeHtml(imageCandidates[0])}"
                    data-alt-sources="${escapeHtml(imageCandidates.join('|'))}"
                    alt="${escapeHtml(product.name || 'Product image')}"
                    loading="lazy"
                />
                <span class="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-lg ${lowStock ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary'}">${lowStock ? `Low Stock: ${stockQty}` : `${stockQty} in stock`}</span>
            </div>
            <div class="space-y-1">
                <h3 class="font-bold text-sm text-text-main dark:text-white">${escapeHtml(product.name || 'Product')}</h3>
                <p class="text-xs text-text-muted">${escapeHtml(product.category || 'Uncategorized')} ${product.sku ? `• ${escapeHtml(product.sku)}` : ''}</p>
            </div>
            <div class="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                <span class="font-extrabold text-primary">${formatCurrency(product.price || 0)}</span>
                <button class="add-to-cart-btn px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors ${stockQty <= 0 ? 'opacity-50 cursor-not-allowed' : ''}" data-product-id="${productId}" ${stockQty <= 0 ? 'disabled' : ''}>Add</button>
            </div>
        `;

        const addBtn = card.querySelector('.add-to-cart-btn');
        addBtn?.addEventListener('click', () => addToCart(productId));

        const productImage = card.querySelector('.product-image');
        bindProductImageFallback(productImage);

        productGrid.appendChild(card);
    });
}

function renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyState = document.getElementById('cartEmptyState');
    if (!cartItemsEl || !cartEmptyState) return;

    cartItemsEl.innerHTML = '';

    const cartEntries = Array.from(cart.values());
    if (!cartEntries.length) {
        cartEmptyState.classList.remove('hidden');
        updateSummary();
        return;
    }

    cartEmptyState.classList.add('hidden');

    cartEntries.forEach((entry) => {
        const { product, quantity } = entry;
        const productId = parseEntityId(product.id);
        const lineTotal = toNumber(product.price) * quantity;

        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-900/40 border border-slate-100 dark:border-gray-800';
        row.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-text-main dark:text-white truncate">${escapeHtml(product.name || 'Product')}</p>
                <p class="text-xs text-text-muted">${formatCurrency(product.price || 0)} each</p>
                <p class="text-xs font-bold text-red-600 dark:text-red-400 mt-1">${formatCurrency(lineTotal)}</p>
            </div>
            <div class="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-slate-200 dark:border-gray-700">
                <button class="qty-minus size-7 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-bold" data-product-id="${productId}">-</button>
                <span class="w-6 text-center text-sm font-bold">${quantity}</span>
                <button class="qty-plus size-7 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 text-sm font-bold" data-product-id="${productId}">+</button>
            </div>
            <button class="remove-line size-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 text-xs font-bold" data-product-id="${productId}">X</button>
        `;

        row.querySelector('.qty-minus')?.addEventListener('click', () => changeQuantity(productId, -1));
        row.querySelector('.qty-plus')?.addEventListener('click', () => changeQuantity(productId, 1));
        row.querySelector('.remove-line')?.addEventListener('click', () => removeFromCart(productId));

        cartItemsEl.appendChild(row);
    });

    updateSummary();
}

function updateSummary() {
    const subtotalEl = document.getElementById('subtotalValue');
    const discountEl = document.getElementById('discountValue');
    const discountSummaryLabel = document.getElementById('discountSummaryLabel');
    const totalEl = document.getElementById('totalValue');
    const discountInput = document.getElementById('discountInput');

    const subtotal = Array.from(cart.values()).reduce((sum, entry) => {
        return sum + toNumber(entry.product.price) * entry.quantity;
    }, 0);

    const discountPercent = normalizeDiscountPercent(discountInput?.value);
    const discount = roundMoney((subtotal * discountPercent) / 100);
    const total = Math.max(0, subtotal - discount);

    if (discountInput && discountInput.value.trim() !== '') {
        const normalizedText = String(discountPercent);
        if (discountInput.value !== normalizedText) {
            discountInput.value = normalizedText;
        }
    }

    if (discountSummaryLabel) {
        discountSummaryLabel.textContent = discountPercent > 0 ? `Discount (${discountPercent}%)` : 'Discount';
    }
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (discountEl) discountEl.textContent = formatCurrency(discount);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

// =============================================================================
// CART ACTIONS
// =============================================================================

function addToCart(productId) {
    const product = products.find((item) => parseEntityId(item.id) === productId);
    if (!product) return;

    const maxStock = Number.isInteger(product.stockQty) ? product.stockQty : Number.parseInt(product.stockQty || '0', 10) || 0;
    if (maxStock <= 0) {
        showToast('This product is out of stock.', 'error');
        return;
    }

    const current = cart.get(productId);
    const nextQty = (current?.quantity || 0) + 1;

    if (nextQty > maxStock) {
        showToast('Quantity exceeds available stock.', 'error');
        return;
    }

    cart.set(productId, { product, quantity: nextQty });
    renderCart();
}

function changeQuantity(productId, delta) {
    const current = cart.get(productId);
    if (!current) return;

    const maxStock = Number.isInteger(current.product.stockQty)
        ? current.product.stockQty
        : Number.parseInt(current.product.stockQty || '0', 10) || 0;

    const nextQty = current.quantity + delta;
    if (nextQty <= 0) {
        cart.delete(productId);
    } else if (nextQty > maxStock) {
        showToast('Quantity exceeds available stock.', 'error');
        return;
    } else {
        cart.set(productId, { ...current, quantity: nextQty });
    }

    renderCart();
}

function removeFromCart(productId) {
    cart.delete(productId);
    renderCart();
}

function clearCart() {
    cart.clear();
    renderCart();
}

// =============================================================================
// CHECKOUT
// =============================================================================

async function handleCheckout() {
    if (!cart.size) {
        showToast('Please add at least one product to cart.', 'error');
        return;
    }

    if (!currentUser?.id) {
        showToast('Unable to checkout: missing current user.', 'error');
        return;
    }

    const previewData = buildCheckoutPreviewData();
    if (!previewData) {
        return;
    }

    pendingCheckoutPayload = previewData.payload;
    openReceiptModal(previewData.previewOrder, true);
}

function buildCheckoutPreviewData() {
    const customerId = parseEntityId(document.getElementById('salesCustomerSelect')?.value);
    const discountPercent = normalizeDiscountPercent(document.getElementById('discountInput')?.value);
    const note = (document.getElementById('salesNoteInput')?.value || '').trim();

    const previewItems = Array.from(cart.values()).map((entry) => {
        const qty = Number.parseInt(entry.quantity, 10);
        const unitPrice = toNumber(entry.product.price);
        const lineTotal = unitPrice * qty;

        return {
            productId: parseEntityId(entry.product.id),
            productName: entry.product.name || 'Product',
            quantity: qty,
            unitPrice,
            lineTotal
        };
    }).filter((item) => item.productId && item.quantity > 0);

    if (!previewItems.length) {
        showToast('Please add valid items before confirmation.', 'error');
        return null;
    }

    const subtotal = previewItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = roundMoney((subtotal * discountPercent) / 100);
    const totalAmount = Math.max(0, subtotal - discount);

    const selectedCustomer = customerId
        ? customers.find((customer) => parseEntityId(customer.id) === customerId)
        : null;

    const payload = {
        soldByUserId: parseEntityId(currentUser.id),
        customerId: customerId || undefined,
        paymentMethod: 'CASH',
        discount,
        note: note || undefined,
        items: previewItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
        }))
    };

    const previewOrder = {
        orderNo: 'Pending confirmation',
        soldAt: new Date().toISOString(),
        soldByName: currentUser.fullName || currentUser.email || 'Admin',
        customerName: selectedCustomer?.fullName || 'Walk-in Customer',
        discountPercent,
        items: previewItems,
        subtotal,
        discount,
        totalAmount
    };

    return { payload, previewOrder };
}

async function confirmSalesOrder() {
    if (!pendingCheckoutPayload) {
        showToast('No pending billing payload found. Please review again.', 'error');
        return;
    }

    const confirmBtn = document.getElementById('confirmReceiptBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Confirming...';
    }

    try {
        const result = await callBridge('createSalesOrder', JSON.stringify(pendingCheckoutPayload));
        if (!result.success || !result.data) {
            showToast(result.message || 'Billing confirmation failed.', 'error');
            return;
        }

        pendingCheckoutPayload = null;
        closeModal();
        clearCart();
        await loadProducts();
        applyProductFilters();
        showToast('Billing confirmed successfully.', 'success');
    } finally {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm';
        }
    }
}

function openReceiptModal(order, showConfirmButton = false) {
    const itemsRows = (order.items || []).map((item, index) => `
        <tr>
            <td class="py-2 px-3 text-sm text-text-muted">${index + 1}</td>
            <td class="py-2 pr-3 text-sm text-text-main dark:text-white">${escapeHtml(item.productName || 'Product')}</td>
            <td class="py-2 px-3 text-sm text-right text-text-main dark:text-white">${item.quantity || 0}</td>
            <td class="py-2 px-3 text-sm text-right text-text-main dark:text-white">${formatCurrency(item.unitPrice || 0)}</td>
            <td class="py-2 pl-3 text-sm text-right font-semibold text-text-main dark:text-white">${formatCurrency(item.lineTotal || 0)}</td>
        </tr>
    `).join('');

    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Receipt No</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(order.orderNo || '—')}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Cashier</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(order.soldByName || '—')}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Sold At</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(formatDateTime(order.soldAt))}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Customer</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(order.customerName || 'Walk-in Customer')}</p>
                </div>
            </div>

            <div class="overflow-x-auto border border-slate-200 dark:border-gray-800 rounded-xl">
                <table class="min-w-full">
                    <thead class="bg-slate-50 dark:bg-gray-800/50">
                        <tr>
                            <th class="py-2 px-3 text-left text-xs uppercase tracking-wide text-text-muted">No.</th>
                            <th class="py-2 px-3 text-left text-xs uppercase tracking-wide text-text-muted">Item</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Qty</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Price</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                        ${itemsRows || '<tr><td colspan="5" class="py-3 text-center text-sm text-text-muted">No items</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="space-y-1 text-sm">
                <div class="flex items-center justify-between"><span class="text-text-muted">Subtotal</span><span class="font-semibold">${formatCurrency(order.subtotal || 0)}</span></div>
                <div class="flex items-center justify-between"><span class="text-text-muted">Discount${order.discountPercent ? ` (${order.discountPercent}%)` : ''}</span><span class="font-semibold">${formatCurrency(order.discount || 0)}</span></div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-800"><span class="font-bold">Total</span><span class="font-extrabold text-primary">${formatCurrency(order.totalAmount || 0)}</span></div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-gray-600">Close</button>
                ${showConfirmButton ? '<button id="confirmReceiptBtn" type="button" class="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-content">Confirm</button>' : ''}
            </div>
        </div>
    `;

    openModal('Receipt Preview', content);

    if (showConfirmButton) {
        const confirmBtn = document.getElementById('confirmReceiptBtn');
        confirmBtn?.addEventListener('click', confirmSalesOrder);
    }
}

// =============================================================================
// EVENT BINDING
// =============================================================================

function setupEventListeners() {
    document.getElementById('productSearchInput')?.addEventListener('input', applyProductFilters);
    document.getElementById('categoryFilter')?.addEventListener('change', applyProductFilters);
    document.getElementById('discountInput')?.addEventListener('input', updateSummary);

    document.getElementById('clearCartBtn')?.addEventListener('click', async () => {
        if (!cart.size) {
            showToast('Cart is already empty.', 'info');
            return;
        }

        if (await confirmAction('Clear all items in the active billing cart?')) {
            clearCart();
        }
    });

    document.getElementById('refreshProductsBtn')?.addEventListener('click', async () => {
        await loadProducts();
        applyProductFilters();
        showToast('Product list refreshed.', 'success');
    });

    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn || logoutBtn.dataset.bound === 'true') return;

    logoutBtn.dataset.bound = 'true';
    logoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await callBridge('logout');
        window.javaBridge.navigateTo('index.html');
    });
}

// =============================================================================
// UTILITIES
// =============================================================================

function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function normalizeDiscountPercent(value) {
    if (value === null || value === undefined) {
        return 0;
    }

    const text = String(value).trim();
    if (!text.length) {
        return 0;
    }

    const percent = Math.floor(toNumber(text));
    return Math.max(1, Math.min(percent, 99));
}

function roundMoney(value) {
    return Number(toNumber(value).toFixed(2));
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function formatDateTime(value) {
    if (!value) return '—';
    try {
        const date = new Date(value);
        return date.toLocaleString();
    } catch (error) {
        return String(value);
    }
}

function buildProductImageCandidates(product) {
    const candidates = [];
    const sku = normalizeSkuForFilename(product?.sku);

    if (sku) {
        PRODUCT_IMAGE_EXTENSIONS.forEach((extension) => {
            candidates.push(`${PRODUCT_IMAGE_BASE_PATH}/${encodeURIComponent(sku)}.${extension}`);
        });
    }

    const productId = parseEntityId(product?.id);
    if (productId) {
        PRODUCT_IMAGE_EXTENSIONS.forEach((extension) => {
            candidates.push(`${PRODUCT_IMAGE_BASE_PATH}/${productId}.${extension}`);
        });
    }

    candidates.push(PRODUCT_IMAGE_PLACEHOLDER);
    return Array.from(new Set(candidates));
}

function normalizeSkuForFilename(value) {
    if (!value) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
}

function bindProductImageFallback(imageEl) {
    if (!imageEl) {
        return;
    }

    const sources = (imageEl.dataset.altSources || '').split('|').filter(Boolean);
    if (!sources.length) {
        imageEl.src = PRODUCT_IMAGE_PLACEHOLDER;
        return;
    }

    let sourceIndex = 0;
    imageEl.addEventListener('error', () => {
        sourceIndex += 1;
        if (sourceIndex < sources.length) {
            imageEl.src = sources[sourceIndex];
        }
    });
}
