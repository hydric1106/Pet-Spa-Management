/**
 * PetSpa Admin - Services Management
 * Handles CRUD operations for spa services
 */

let currentUser = null;
let services = [];
let componentsInitialized = false;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initServicesPage();
});

document.addEventListener('bridgeReady', () => {
    initServicesPage();
});

async function initServicesPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;
    
    componentsInitialized = true;
    
    try {
        // Load sidebar and header components
        await loadComponents([
            { 
                path: '../components/admin_sidebar.html', 
                target: 'sidebar',
                callback: () => initSidebarNavigation('services', handleNavigation)
            },
            { 
                path: '../components/admin_header.html', 
                target: 'header'
            }
        ]);
        
        // Set page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Manage Services';
        }
        
        // Initialize page
        await initializePage();
        setupEventListeners();
        
    } catch (error) {
        console.error('Error initializing services page:', error);
    }
}

async function initializePage() {
    try {
        await waitForBridge();
        
        // Get current user
        const userResult = await callBridge('getCurrentUser');
        if (userResult.success) {
            currentUser = userResult.data;
            updateUserDisplay();
        } else {
            window.javaBridge.navigateTo('index.html');
            return;
        }
        
        // Load services
        await loadServices();
        
    } catch (error) {
        console.error('Page initialization error:', error);
    }
}

function updateUserDisplay() {
    const userNameEl = document.getElementById('currentUserName');
    if (userNameEl && currentUser) {
        userNameEl.textContent = currentUser.fullName;
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
        'sales': 'store.html',
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
// SERVICES CRUD
// =============================================================================

async function loadServices() {
    try {
        const result = await callBridge('getAllServices');
        
        if (result.success && result.data) {
            services = (result.data || []).filter(service => service.isActive !== false);
            renderServicesTable(services);
        } else {
            // Show empty state if no services
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading services:', error);
        showEmptyState();
    }
}

function renderServicesTable(servicesList) {
    const tbody = document.getElementById('servicesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;
    
    if (!servicesList || servicesList.length === 0) {
        showEmptyState();
        return;
    }
    
    // Hide empty state
    if (emptyState) {
        emptyState.classList.add('hidden');
    }
    
    tbody.innerHTML = servicesList.map(service => createServiceRow(service)).join('');
    
    // Add event listeners to action buttons
    attachRowEventListeners();
}

function createServiceRow(service) {
    return `
        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors" data-service-id="${service.id}">
            <td class="px-6 py-4 font-bold text-sm text-text-main dark:text-white">${escapeHtml(service.name)}</td>
            <td class="px-6 py-4 text-sm text-text-muted">${service.durationMinutes ? service.durationMinutes + ' mins' : '-'}</td>
            <td class="px-6 py-4 text-sm font-bold text-text-main dark:text-white">${formatCurrency(service.price)}</td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button 
                        class="edit-btn size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors" 
                        title="Edit"
                        data-id="${service.id}"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                    <button 
                        class="delete-btn size-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors" 
                        title="Delete"
                        data-id="${service.id}"
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
    const tbody = document.getElementById('servicesTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (tbody) {
        tbody.innerHTML = '';
    }
    if (emptyState) {
        emptyState.classList.remove('hidden');
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Add new service button
    const addBtn = document.getElementById('addServiceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openServiceModal());
    }
    
    // Setup logout
    setupLogout();
}

function attachRowEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.serviceId;
            const serviceId = parseEntityId(rawId);
            if (!serviceId) {
                alert('Unable to edit service: invalid ID. Please refresh and try again.');
                return;
            }
            editService(serviceId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.serviceId;
            const serviceId = parseEntityId(rawId);
            if (!serviceId) {
                alert('Unable to delete service: invalid ID. Please refresh and try again.');
                return;
            }

            if (!(await confirmAction('Are you sure you want to delete this service?'))) {
                return;
            }
            deleteService(serviceId);
        });
    });
}

// =============================================================================
// SERVICE OPERATIONS
// =============================================================================

function openServiceModal(service = null) {
    const isEdit = service !== null;
    const title = isEdit ? 'Edit Service' : 'Add New Service';
    
    const content = `
        <form id="serviceForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Service Name <span class="text-red-500">*</span></label>
                <input 
                    type="text" 
                    id="serviceName" 
                    value="${isEdit ? escapeHtml(service.name) : ''}"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    placeholder="Enter service name"
                    required
                />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Duration (mins)</label>
                    <input 
                        type="number" 
                        id="serviceDuration" 
                        value="${isEdit ? service.durationMinutes || '' : ''}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                        placeholder="30"
                        min="1"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Price</label>
                    <input 
                        type="number" 
                        id="servicePrice" 
                        value="${isEdit ? service.price || '' : ''}"
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                        placeholder="0"
                        min="0"
                        step="1000"
                        required
                    />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Description</label>
                <textarea 
                    id="serviceDescription"
                    rows="3"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white resize-none"
                    placeholder="Enter service description"
                >${isEdit ? escapeHtml(service.description || '') : ''}</textarea>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <button 
                    type="button" 
                    onclick="closeModal()"
                    class="px-5 py-2.5 bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-content transition-colors"
                >
                    ${isEdit ? 'Update Service' : 'Add Service'}
                </button>
            </div>
            <input type="hidden" id="serviceId" value="${isEdit ? service.id : ''}" />
        </form>
    `;
    
    openModal(title, content);
    
    // Attach form submit handler
    setTimeout(() => {
        const form = document.getElementById('serviceForm');
        if (form) {
            form.addEventListener('submit', handleServiceSubmit);
        }
    }, 100);
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    
    const serviceId = parseEntityId(document.getElementById('serviceId').value);
    const serviceData = {
        name: document.getElementById('serviceName').value.trim(),
        durationMinutes: parseInt(document.getElementById('serviceDuration').value) || 0,
        price: parseFloat(document.getElementById('servicePrice').value) || 0,
        description: document.getElementById('serviceDescription').value.trim()
    };
    
    try {
        let result;
        if (serviceId) {
            if (!(await confirmAction('Save changes to this service?'))) {
                return;
            }
            serviceData.id = serviceId;
            result = await callBridge('updateService', JSON.stringify(serviceData));
        } else {
            result = await callBridge('createService', JSON.stringify(serviceData));
        }
        
        if (result.success) {
            closeModal();
            await loadServices();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving service:', error);
        alert('Error saving service');
    }
}

async function editService(id) {
    const serviceId = parseEntityId(id);
    if (!serviceId) {
        alert('Unable to edit service: invalid ID.');
        return;
    }

    const service = services.find(s => Number(s.id) === serviceId);
    if (service) {
        openServiceModal(service);
    }
}

async function deleteService(id) {
    const serviceId = parseEntityId(id);
    if (!serviceId) {
        alert('Unable to delete service: invalid ID.');
        return;
    }

    try {
        const result = await callBridge('deleteService', String(serviceId));
        
        if (result.success) {
            await loadServices();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service');
    }
}

// =============================================================================
// LOGOUT
// =============================================================================

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await callBridge('logout');
                window.javaBridge.navigateTo('index.html');
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

// =============================================================================
// UTILITIES
// =============================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

console.log('Services Admin JS loaded');
