let currentUser = null;
let salesOrders = [];
let componentsInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initBillingHistoryPage();
});

document.addEventListener('bridgeReady', () => {
    initBillingHistoryPage();
});

async function initBillingHistoryPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('billing-history', handleNavigation)
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
        console.error('Error initializing billing history page:', error);
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
        pageTitle.textContent = 'Billing History';
    }

    const billingDateFilter = document.getElementById('billingDateFilter');
    if (billingDateFilter) {
        billingDateFilter.value = getTodayISO();
    }

    await loadBillingHistory();
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
// DATA LOADING AND RENDERING
// =============================================================================

async function loadBillingHistory() {
    const selectedDate = (document.getElementById('billingDateFilter')?.value || getTodayISO()).trim();

    const result = await callBridge('getSalesByDate', selectedDate);
    if (!result.success || !Array.isArray(result.data)) {
        salesOrders = [];
        renderBillingRows();
        showToast(result.message || 'Failed to load billing history.', 'error');
        return;
    }

    salesOrders = result.data || [];
    renderBillingRows();
}

function renderBillingRows() {
    const tbody = document.getElementById('billingHistoryBody');
    const emptyState = document.getElementById('billingHistoryEmptyState');
    const countText = document.getElementById('billingCountText');

    if (!tbody || !emptyState || !countText) {
        return;
    }

    tbody.innerHTML = '';

    if (!salesOrders.length) {
        emptyState.classList.remove('hidden');
        countText.textContent = '0 receipts';
        return;
    }

    emptyState.classList.add('hidden');
    countText.textContent = `${salesOrders.length} receipt${salesOrders.length === 1 ? '' : 's'}`;

    salesOrders.forEach((order) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors';

        row.innerHTML = `
            <td class="py-3 px-4">
                <div class="text-sm font-semibold text-text-main dark:text-white">${escapeHtml(order.orderNo || '—')}</div>
                <div class="text-xs text-text-muted">${escapeHtml(order.note || '')}</div>
            </td>
            <td class="py-3 px-4">
                <div class="text-sm font-medium text-text-main dark:text-white">${escapeHtml(order.soldByName || '—')}</div>
                <div class="text-xs text-text-muted">${escapeHtml(order.customerName || 'Walk-in Customer')}</div>
            </td>
            <td class="py-3 px-4 text-right text-sm font-bold text-text-main dark:text-white">${formatCurrency(order.totalAmount || 0)}</td>
            <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">${escapeHtml(order.paymentMethod || 'CASH')}</span>
            </td>
            <td class="py-3 px-4 text-sm text-text-muted">${escapeHtml(formatDateTime(order.soldAt))}</td>
            <td class="py-3 px-4 text-right">
                <button type="button" class="view-receipt-btn text-primary text-sm font-semibold hover:text-primary-content transition-colors">View Receipt</button>
            </td>
        `;

        row.querySelector('.view-receipt-btn')?.addEventListener('click', () => {
            openReceiptDetailModal(order);
        });

        tbody.appendChild(row);
    });
}

function openReceiptDetailModal(order) {
    const itemsRows = (order.items || []).map((item) => `
        <tr>
            <td class="py-2 pr-3 text-sm text-text-main dark:text-white">${escapeHtml(item.productName || 'Product')}</td>
            <td class="py-2 px-3 text-sm text-right text-text-main dark:text-white">${item.quantity || 0}</td>
            <td class="py-2 px-3 text-sm text-right text-text-main dark:text-white">${formatCurrency(item.unitPrice || 0)}</td>
            <td class="py-2 pl-3 text-sm text-right font-semibold text-text-main dark:text-white">${formatCurrency(item.lineTotal || 0)}</td>
        </tr>
    `).join('');

    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <th class="py-2 px-3 text-left text-xs uppercase tracking-wide text-text-muted">Item</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Qty</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Price</th>
                            <th class="py-2 px-3 text-right text-xs uppercase tracking-wide text-text-muted">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                        ${itemsRows || '<tr><td colspan="4" class="py-3 text-center text-sm text-text-muted">No items</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="space-y-1 text-sm">
                <div class="flex items-center justify-between"><span class="text-text-muted">Subtotal</span><span class="font-semibold">${formatCurrency(order.subtotal || 0)}</span></div>
                <div class="flex items-center justify-between"><span class="text-text-muted">Discount</span><span class="font-semibold">${formatCurrency(order.discount || 0)}</span></div>
                <div class="flex items-center justify-between"><span class="text-text-muted">Payment</span><span class="font-semibold">${escapeHtml(order.paymentMethod || 'CASH')}</span></div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-gray-800"><span class="font-bold">Total</span><span class="font-extrabold text-primary">${formatCurrency(order.totalAmount || 0)}</span></div>
            </div>

            <div class="flex justify-end pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-content">Close</button>
            </div>
        </div>
    `;

    openModal('Receipt Detail', content);
}

// =============================================================================
// EVENT BINDING
// =============================================================================

function setupEventListeners() {
    document.getElementById('billingDateFilter')?.addEventListener('change', loadBillingHistory);

    document.getElementById('refreshBillingBtn')?.addEventListener('click', async () => {
        await loadBillingHistory();
        showToast('Billing history refreshed.', 'success');
    });
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
