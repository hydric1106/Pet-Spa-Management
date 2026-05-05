let currentUser = null;
let products = [];
let filteredProducts = [];
let categories = [];
let componentsInitialized = false;
let editingProductId = null;
let editingProductActive = true;

const PRODUCT_IMAGE_BASE_PATH = '../assets/images/products';
const PRODUCT_IMAGE_PLACEHOLDER = `${PRODUCT_IMAGE_BASE_PATH}/placeholder.svg`;
const PRODUCT_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'svg'];

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initStockPage();
});

document.addEventListener('bridgeReady', () => {
    initStockPage();
});

async function initStockPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('stock', handleNavigation)
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
        console.error('Error initializing stock page:', error);
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
        pageTitle.textContent = 'Stock';
    }

    await loadProducts();
    renderProducts();
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
        sales: 'store.html',
        stock: 'stock.html',
        'billing-history': 'billing_history.html',
        clients: 'clients.html',
        staff: 'staff.html',
        workshifts: 'workshifts.html'
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
        showToast(result.message || 'Failed to load stock.', 'error');
        return;
    }

    products = result.data || [];
    filteredProducts = [...products];
    categories = [...new Set(products.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    populateCategoryFilter();
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
                <span class="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-lg ${lowStock ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-primary/10 text-primary'}">${stockQty <= 0 ? 'Out of stock' : lowStock ? `Low Stock: ${stockQty}` : `${stockQty} in stock`}</span>
            </div>
            <div class="space-y-1">
                <h3 class="font-bold text-sm text-text-main dark:text-white">${escapeHtml(product.name || 'Product')}</h3>
                <p class="text-xs text-text-muted">${escapeHtml(product.category || 'Uncategorized')} ${product.sku ? `• ${escapeHtml(product.sku)}` : ''}</p>
            </div>
            <div class="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                <span class="font-extrabold text-primary">${formatCurrency(product.price || 0)}</span>
                <div class="flex items-center gap-2">
                    <button class="edit-product-btn px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 text-xs font-bold text-text-main dark:text-white hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors" data-product-id="${productId}">Edit</button>
                </div>
            </div>
        `;

        const editBtn = card.querySelector('.edit-product-btn');
        editBtn?.addEventListener('click', () => setEditMode(product));

        const productImage = card.querySelector('.product-image');
        bindProductImageFallback(productImage);

        productGrid.appendChild(card);
    });
}

// =============================================================================
// FORM HANDLING
// =============================================================================

async function handleSaveProduct() {
    const nameInput = document.getElementById('productNameInput');
    const categoryInput = document.getElementById('productCategoryInput');
    const skuInput = document.getElementById('productSkuInput');
    const priceInput = document.getElementById('productPriceInput');
    const stockInput = document.getElementById('productStockInput');

    const name = (nameInput?.value || '').trim();
    const category = (categoryInput?.value || '').trim();
    const sku = (skuInput?.value || '').trim();
    const price = toNumber(priceInput?.value);
    const stockQty = Number.parseInt(stockInput?.value || '0', 10) || 0;

    if (!name) {
        showToast('Product name is required.', 'error');
        return;
    }

    if (price <= 0) {
        showToast('Product price must be greater than 0.', 'error');
        return;
    }

    if (stockQty < 0) {
        showToast('Stock quantity cannot be negative.', 'error');
        return;
    }

    const payload = {
        name,
        category: category || undefined,
        sku: sku || undefined,
        price,
        stockQty,
        isActive: editingProductId ? editingProductActive : true
    };

    let result;
    if (editingProductId) {
        payload.id = editingProductId;
        result = await callBridge('updateProduct', JSON.stringify(payload));
    } else {
        result = await callBridge('createProduct', JSON.stringify(payload));
    }

    if (!result.success) {
        showToast(result.message || 'Failed to save product.', 'error');
        return;
    }

    showToast(editingProductId ? 'Product updated successfully.' : 'Product created successfully.', 'success');
    closeModal();
    resetForm();
    await loadProducts();
    renderProducts();
}

function openProductModal(product = null) {
    const isEdit = Boolean(product);

    editingProductId = isEdit ? parseEntityId(product.id) : null;
    editingProductActive = isEdit ? product.isActive !== false : true;

    const title = isEdit ? 'Edit Product' : 'Add Product';
    const hint = isEdit ? 'Update product details and save changes.' : 'Create a new stock item.';
    const saveLabel = isEdit ? 'Save Changes' : 'Save Product';

    const nameValue = escapeHtml(product?.name || '');
    const categoryValue = escapeHtml(product?.category || '');
    const skuValue = escapeHtml(product?.sku || '');
    const priceValue = escapeHtml(product?.price ?? '');
    const stockValue = escapeHtml(product?.stockQty ?? '');

    const content = `
        <form id="productForm" class="space-y-4">
            <p class="text-sm text-text-muted">${hint}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Name</label>
                    <input
                        id="productNameInput"
                        type="text"
                        value="${nameValue}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Category</label>
                    <input
                        id="productCategoryInput"
                        type="text"
                        value="${categoryValue}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Product Code</label>
                    <input
                        id="productSkuInput"
                        type="text"
                        value="${skuValue}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Price</label>
                    <input
                        id="productPriceInput"
                        type="number"
                        min="1"
                        step="0.01"
                        value="${priceValue}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Stock Qty</label>
                    <input
                        id="productStockInput"
                        type="number"
                        min="0"
                        step="1"
                        value="${stockValue}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    />
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="cancelProductBtn" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white text-sm font-semibold hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="button" id="saveProductBtn" class="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-content transition-colors">${saveLabel}</button>
            </div>
        </form>
    `;

    openModal(title, content);

    document.getElementById('cancelProductBtn')?.addEventListener('click', () => {
        closeModal();
        resetForm();
    });

    document.getElementById('saveProductBtn')?.addEventListener('click', handleSaveProduct);
}

function resetForm() {
    editingProductId = null;
    editingProductActive = true;
}

function setEditMode(product) {
    openProductModal(product);
}

// =============================================================================
// EVENT BINDING
// =============================================================================

function setupEventListeners() {
    document.getElementById('productSearchInput')?.addEventListener('input', applyProductFilters);
    document.getElementById('categoryFilter')?.addEventListener('change', applyProductFilters);

    document.getElementById('refreshProductsBtn')?.addEventListener('click', async () => {
        await loadProducts();
        renderProducts();
        showToast('Stock list refreshed.', 'success');
    });

    document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());
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
