/**
 * PetSpa Admin - Clients Management
 * Handles CRUD operations for registered clients (customers)
 */

let currentUser = null;
let allClients = [];
let filteredClients = [];
let componentsInitialized = false;

// Pagination state
const PAGE_SIZE = 10;
let currentPage = 1;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initClientsPage();
});

document.addEventListener('bridgeReady', () => {
    initClientsPage();
});

async function initClientsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('clients', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Manage Clients';

        await initializePage();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing clients page:', error);
    }
}

async function initializePage() {
    try {
        await waitForBridge();

        const userResult = await callBridge('getCurrentUser');
        if (userResult.success) {
            currentUser = userResult.data;
            updateUserDisplay();
        } else {
            window.javaBridge.navigateTo('index.html');
            return;
        }

        await loadClients();

    } catch (error) {
        console.error('Page initialization error:', error);
    }
}

function updateUserDisplay() {
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && currentUser) {
        nameEl.textContent = currentUser.fullName || currentUser.username || '—';
    }
}

// =============================================================================
// NAVIGATION
// =============================================================================

function handleNavigation(page) {
    const pageRoutes = {
        'dashboard': 'dashboard.html',
        'bookings': 'bookings.html',
        'pets': 'pets.html',
        'services': 'services.html',
        'clients': 'clients.html',
        'staff': 'staff.html',
        'workshifts': 'workshifts.html'
    };

    const route = pageRoutes[page];
    if (route && window.javaBridge) {
        window.javaBridge.navigateTo(`admin/${route}`);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadClients() {
    try {
        const result = await callBridge('getAllCustomers');
        if (result.success && result.data) {
            allClients = result.data;
            filteredClients = [...allClients];
            currentPage = 1;
            renderTable();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        showEmptyState();
    }
}

// =============================================================================
// TABLE RENDERING
// =============================================================================

function renderTable() {
    const tbody = document.getElementById('clientsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationBar = document.getElementById('paginationBar');
    const totalEl = document.getElementById('totalClientsCount');

    if (!tbody) return;

    if (totalEl) totalEl.textContent = `Total Clients: ${allClients.length}`;

    if (!filteredClients || filteredClients.length === 0) {
        showEmptyState();
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredClients.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(client => createClientRow(client)).join('');
    attachRowEventListeners();

    // Pagination
    const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
    if (totalPages > 1) {
        if (paginationBar) paginationBar.classList.remove('hidden');
        updatePaginationUI(totalPages);
    } else {
        if (paginationBar) paginationBar.classList.add('hidden');
    }

    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const from = start + 1;
        const to = Math.min(start + PAGE_SIZE, filteredClients.length);
        pageInfo.textContent = `Showing ${from} to ${to} of ${filteredClients.length} entries`;
    }
}

function createClientRow(client) {
    const pets = client.pets && client.pets.length > 0
        ? client.pets.map(p => escapeHtml(p.name)).join(', ')
        : '—';
    const petCount = client.pets ? client.pets.length : 0;

    return `
        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors" data-client-id="${client.id}">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 font-bold text-sm">
                        ${escapeHtml(getInitials(client.fullName))}
                    </div>
                    <div>
                        <p class="font-bold text-sm text-text-main dark:text-white">${escapeHtml(client.fullName || '—')}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <p class="text-sm font-medium text-text-main dark:text-gray-300">${escapeHtml(client.phoneNumber || '—')}</p>
                <p class="text-xs text-text-muted">${escapeHtml(client.email || '—')}</p>
            </td>
            <td class="px-6 py-4 text-sm text-text-muted max-w-[180px] truncate" title="${escapeHtml(client.address || '')}">
                ${escapeHtml(client.address || '—')}
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                    <span class="size-6 flex items-center justify-center bg-primary/10 text-primary rounded-full text-[10px] font-bold flex-shrink-0">${petCount}</span>
                    <span class="text-sm text-text-main dark:text-gray-300 truncate max-w-[140px]" title="${pets}">${pets}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button
                        class="edit-btn size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Edit"
                        data-id="${client.id}"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                    <button
                        class="delete-btn size-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
                        data-id="${client.id}"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function showEmptyState() {
    const tbody = document.getElementById('clientsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationBar = document.getElementById('paginationBar');

    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (paginationBar) paginationBar.classList.add('hidden');
}

function updatePaginationUI(totalPages) {
    const container = document.getElementById('pageNumbers');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === currentPage
            ? 'size-10 flex items-center justify-center rounded-full bg-primary text-white font-bold shadow-sm'
            : 'size-10 flex items-center justify-center rounded-full text-text-muted hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors font-medium';
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        container.appendChild(btn);
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    document.getElementById('registerClientBtn')?.addEventListener('click', () => openClientModal());
    document.getElementById('closeModalBtn')?.addEventListener('click', closeClientModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeClientModal);
    document.getElementById('clientForm')?.addEventListener('submit', handleClientSubmit);

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE);
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // Search filter (from admin_header component)
    document.addEventListener('input', e => {
        if (e.target && e.target.id === 'searchInput') {
            const query = e.target.value.toLowerCase().trim();
            filteredClients = query
                ? allClients.filter(c =>
                    (c.fullName || '').toLowerCase().includes(query) ||
                    (c.phoneNumber || '').toLowerCase().includes(query) ||
                    (c.email || '').toLowerCase().includes(query) ||
                    (c.address || '').toLowerCase().includes(query)
                )
                : [...allClients];
            currentPage = 1;
            renderTable();
        }
    });

    // Close modal on backdrop click
    document.getElementById('clientModal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeClientModal();
    });

    setupLogout();
}

function attachRowEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.clientId;
            const clientId = parseEntityId(rawId);
            if (!clientId) {
                alert('Unable to edit client: invalid ID. Please refresh and try again.');
                return;
            }
            editClient(clientId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.clientId;
            const clientId = parseEntityId(rawId);
            if (!clientId) {
                alert('Unable to delete client: invalid ID. Please refresh and try again.');
                return;
            }

            if (!(await confirmAction('Are you sure you want to delete this client?'))) {
                return;
            }
            deleteClient(clientId);
        });
    });
}

// =============================================================================
// MODAL
// =============================================================================

function openClientModal(client = null) {
    const modal = document.getElementById('clientModal');
    const title = document.getElementById('clientModalTitle');
    const form = document.getElementById('clientForm');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('clientId').value = client ? client.id : '';

    if (title) title.textContent = client ? 'Edit Client' : 'Register New Client';

    if (client) {
        document.getElementById('clientFullName').value = client.fullName || '';
        document.getElementById('clientPhone').value = client.phoneNumber || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientAddress').value = client.address || '';
    }

    modal.classList.remove('hidden');
}

function closeClientModal() {
    const modal = document.getElementById('clientModal');
    if (modal) modal.classList.add('hidden');
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

async function handleClientSubmit(e) {
    e.preventDefault();

    const clientId = document.getElementById('clientId').value;
    const clientData = {
        fullName: document.getElementById('clientFullName').value.trim(),
        phoneNumber: document.getElementById('clientPhone').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        address: document.getElementById('clientAddress').value.trim()
    };

    if (!clientData.fullName || !clientData.phoneNumber) {
        alert('Please fill in the required fields.');
        return;
    }

    try {
        let result;
        if (clientId) {
            if (!(await confirmAction('Save changes to this client?'))) {
                return;
            }
            clientData.id = parseInt(clientId);
            result = await callBridge('updateCustomer', JSON.stringify(clientData));
        } else {
            result = await callBridge('createCustomer', JSON.stringify(clientData));
        }

        if (result.success) {
            closeClientModal();
            await loadClients();
        } else {
            alert('Error: ' + (result.message || 'Failed to save client.'));
        }
    } catch (error) {
        console.error('Error saving client:', error);
        alert('An unexpected error occurred.');
    }
}

function editClient(id) {
    const clientId = parseEntityId(id);
    if (!clientId) {
        alert('Unable to edit client: invalid ID.');
        return;
    }

    const client = allClients.find(c => Number(c.id) === clientId);
    if (client) openClientModal(client);
}

async function deleteClient(id) {
    const clientId = parseEntityId(id);
    if (!clientId) {
        alert('Unable to delete client: invalid ID.');
        return;
    }

    try {
        const result = await callBridge('deleteCustomer', clientId);
        if (result.success) {
            await loadClients();
        } else {
            alert('Error: ' + (result.message || 'Failed to delete client.'));
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('An unexpected error occurred.');
    }
}

// =============================================================================
// LOGOUT
// =============================================================================

function setupLogout() {
    document.addEventListener('click', e => {
        if (e.target && e.target.id === 'logoutBtn') {
            if (confirm('Are you sure you want to log out?')) {
                window.javaBridge.navigateTo('login.html');
            }
        }
    });
}

// =============================================================================
// UTILITIES
// =============================================================================

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return null;
    }
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
