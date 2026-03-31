/**
 * PetSpa Admin - Pets Management
 * Handles CRUD operations for registered pets
 */

let currentUser = null;
let allPets = [];
let filteredPets = [];
let customers = [];
let componentsInitialized = false;

// Pagination state
const PAGE_SIZE = 10;
let currentPage = 1;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initPetsPage();
});

document.addEventListener('bridgeReady', () => {
    initPetsPage();
});

async function initPetsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('pets', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Manage Pets';

        await initializePage();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing pets page:', error);
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

        await Promise.all([loadPets(), loadCustomers()]);

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

async function loadPets() {
    try {
        const result = await callBridge('getAllPets');
        if (result.success && result.data) {
            allPets = result.data;
            filteredPets = [...allPets];
            currentPage = 1;
            renderTable();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showEmptyState();
    }
}

async function loadCustomers() {
    try {
        const result = await callBridge('getAllCustomers');
        if (result.success && result.data) {
            customers = result.data;
            populateOwnerSelect();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function populateOwnerSelect(selectedId = null) {
    const select = document.getElementById('petOwnerSelect');
    if (!select) return;

    const current = select.value;
    select.innerHTML = '<option value="">Select owner...</option>';
    customers.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.fullName}${c.phoneNumber ? ' — ' + c.phoneNumber : ''}`;
        select.appendChild(opt);
    });

    if (selectedId) {
        select.value = String(selectedId);
    } else if (current) {
        select.value = current;
    }
}

// =============================================================================
// TABLE RENDERING
// =============================================================================

function renderTable() {
    const tbody = document.getElementById('petsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationBar = document.getElementById('paginationBar');
    const totalEl = document.getElementById('totalPetsCount');

    if (!tbody) return;

    if (totalEl) totalEl.textContent = `Total Pets: ${allPets.length}`;

    if (!filteredPets || filteredPets.length === 0) {
        showEmptyState();
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredPets.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(pet => createPetRow(pet)).join('');
    attachRowEventListeners();

    // Pagination
    const totalPages = Math.ceil(filteredPets.length / PAGE_SIZE);
    if (totalPages > 1) {
        if (paginationBar) paginationBar.classList.remove('hidden');
        updatePaginationUI(totalPages);
    } else {
        if (paginationBar) paginationBar.classList.add('hidden');
    }

    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        const from = start + 1;
        const to = Math.min(start + PAGE_SIZE, filteredPets.length);
        pageInfo.textContent = `Showing ${from} to ${to} of ${filteredPets.length} entries`;
    }
}

function createPetRow(pet) {
    const age = pet.age != null ? `${pet.age} yr${pet.age !== 1 ? 's' : ''}` : '—';
    return `
        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors" data-pet-id="${pet.id}">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <svg class="w-5 h-5" viewBox="0 0 1024 1024" fill="currentColor">
                            <path d="M792.5 558.4c-46.8-27-44-118.7-14-170.7 26.9-46.6 86.5-62.6 133.1-35.7s62.6 86.5 35.7 133.1c-30.1 52.1-108 100.4-154.8 73.3zM623.4 390c-60.7-16.3-86.1-124.4-67.4-194 16.5-61.5 79.7-98.1 141.3-81.6 61.5 16.5 98.1 79.7 81.6 141.3-18.7 69.6-94.8 150.6-155.5 134.3zM233.5 558.7c-46.9 27.1-125.1-21.3-155.2-73.4-27-46.7-11-106.4 35.8-133.4 46.7-27 106.5-11 133.4 35.7 30 52.2 32.9 144-14 171.1zM374.6 390c-60.7 16.3-136.8-64.7-155.4-134.3-16.5-61.5 20-124.8 81.6-141.3S425.6 134.4 442.1 196c18.6 69.6-6.8 177.7-67.5 194zM513 436.3c111.7 0 279.9 170.1 279.9 307.6 0 91.3-28.3 143.3-79.1 161.4-17.5 6.2-32 7.4-54.3 6.7-4.4-0.1-5.2-0.2-6.5-0.2-11.7 0-23.4-3.8-39.7-11.2-5.4-2.5-11.1-5.3-19.2-9.4 5.8 2.9-15.2-7.7-20.1-10.1-16.3-8.1-28.8-13.7-40.5-17.8-9-3.2-17.2-5.3-24.5-6.3h8c-7.3 1.1-15.4 3.2-24.5 6.4-11.8 4.2-24.2 9.7-40.5 17.9-4.9 2.4-25.8 13.1-20.1 10.2-8.1 4.1-13.8 6.9-19.2 9.4-16.2 7.5-28 11.3-39.7 11.3-1.3 0-2.1 0-6.5 0.2-22.3 0.7-36.8-0.5-54.3-6.7-50.8-18.1-79.1-70.1-79.1-161.4 0-137.5 168.2-308 279.9-308z"/>
                        </svg>
                    </div>
                    <span class="font-bold text-sm text-text-main dark:text-white">${escapeHtml(pet.name)}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-text-main dark:text-gray-300">${escapeHtml(pet.ownerName || '—')}</td>
            <td class="px-6 py-4 text-sm text-text-muted">${escapeHtml(pet.species || '—')}</td>
            <td class="px-6 py-4 text-sm text-text-muted">${escapeHtml(pet.breed || '—')}</td>
            <td class="px-6 py-4 text-sm text-text-muted">${age}</td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button
                        class="edit-btn size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Edit"
                        data-id="${pet.id}"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                    <button
                        class="delete-btn size-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
                        data-id="${pet.id}"
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
    const tbody = document.getElementById('petsTableBody');
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
    document.getElementById('registerPetBtn')?.addEventListener('click', () => openPetModal());
    document.getElementById('closeModalBtn')?.addEventListener('click', closePetModal);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closePetModal);
    document.getElementById('petForm')?.addEventListener('submit', handlePetSubmit);

    document.getElementById('prevPageBtn')?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    document.getElementById('nextPageBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPets.length / PAGE_SIZE);
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // Search filter (from admin_header component)
    document.addEventListener('input', e => {
        if (e.target && e.target.id === 'searchInput') {
            const query = e.target.value.toLowerCase().trim();
            filteredPets = query
                ? allPets.filter(p =>
                    (p.name || '').toLowerCase().includes(query) ||
                    (p.ownerName || '').toLowerCase().includes(query) ||
                    (p.species || '').toLowerCase().includes(query) ||
                    (p.breed || '').toLowerCase().includes(query)
                )
                : [...allPets];
            currentPage = 1;
            renderTable();
        }
    });

    setupLogout();
}

function attachRowEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.petId;
            const petId = parseEntityId(rawId);
            if (!petId) {
                alert('Unable to edit pet: invalid ID. Please refresh and try again.');
                return;
            }
            editPet(petId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            const rawId = e.currentTarget.dataset.id || e.currentTarget.closest('tr')?.dataset.petId;
            const petId = parseEntityId(rawId);
            if (!petId) {
                alert('Unable to delete pet: invalid ID. Please refresh and try again.');
                return;
            }

            if (!(await confirmAction('Are you sure you want to delete this pet?'))) {
                return;
            }
            deletePet(petId);
        });
    });
}

// =============================================================================
// MODAL
// =============================================================================

function openPetModal(pet = null) {
    const modal = document.getElementById('petModal');
    const title = document.getElementById('petModalTitle');
    const form = document.getElementById('petForm');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('petId').value = pet ? pet.id : '';

    if (title) title.textContent = pet ? 'Edit Pet' : 'Register New Pet';

    if (pet) {
        document.getElementById('petName').value = pet.name || '';
        document.getElementById('petSpecies').value = pet.species || 'Dog';
        document.getElementById('petBreed').value = pet.breed || '';
        document.getElementById('petAge').value = pet.age ?? '';
        document.getElementById('petWeight').value = pet.weight ?? '';
        document.getElementById('petNotes').value = pet.notes || '';
        populateOwnerSelect(pet.ownerId);
    } else {
        populateOwnerSelect();
    }

    modal.classList.remove('hidden');
}

function closePetModal() {
    const modal = document.getElementById('petModal');
    if (modal) modal.classList.add('hidden');
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

async function handlePetSubmit(e) {
    e.preventDefault();

    const petId = document.getElementById('petId').value;
    const petData = {
        ownerId: parseInt(document.getElementById('petOwnerSelect').value),
        name: document.getElementById('petName').value.trim(),
        species: document.getElementById('petSpecies').value,
        breed: document.getElementById('petBreed').value.trim(),
        age: parseInt(document.getElementById('petAge').value) || null,
        weight: parseFloat(document.getElementById('petWeight').value) || null,
        notes: document.getElementById('petNotes').value.trim()
    };

    if (!petData.ownerId || !petData.name) {
        alert('Please fill in the required fields.');
        return;
    }

    try {
        let result;
        if (petId) {
            if (!(await confirmAction('Save changes to this pet?'))) {
                return;
            }
            petData.id = parseInt(petId);
            result = await callBridge('updatePet', JSON.stringify(petData));
        } else {
            result = await callBridge('createPet', JSON.stringify(petData));
        }

        if (result.success) {
            closePetModal();
            await loadPets();
        } else {
            alert('Error: ' + (result.message || 'Failed to save pet'));
        }
    } catch (error) {
        console.error('Error saving pet:', error);
        alert('Error saving pet');
    }
}

function editPet(id) {
    const petId = parseEntityId(id);
    if (!petId) {
        alert('Unable to edit pet: invalid ID.');
        return;
    }

    const pet = allPets.find(p => Number(p.id) === petId);
    if (pet) openPetModal(pet);
}

async function deletePet(id) {
    const petId = parseEntityId(id);
    if (!petId) {
        alert('Unable to delete pet: invalid ID.');
        return;
    }

    try {
        const result = await callBridge('deletePet', petId);
        if (result.success) {
            await loadPets();
        } else {
            alert('Error: ' + (result.message || 'Failed to delete pet'));
        }
    } catch (error) {
        console.error('Error deleting pet:', error);
        alert('Error deleting pet');
    }
}

// =============================================================================
// LOGOUT
// =============================================================================

function setupLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async e => {
        e.preventDefault();
        try {
            await callBridge('logout');
            window.javaBridge.navigateTo('index.html');
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
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
