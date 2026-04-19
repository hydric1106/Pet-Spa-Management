/**
 * PetSpa Admin - Staff Management
 * Uses User APIs to manage STAFF accounts.
 */

let currentUser = null;
let allStaff = [];
let filteredStaff = [];
let componentsInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    initStaffPage();
});

document.addEventListener('bridgeReady', () => {
    initStaffPage();
});

async function initStaffPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('staff', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Manage Staff';

        await initializePage();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing staff page:', error);
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

        await loadStaff();
    } catch (error) {
        console.error('Page initialization error:', error);
    }
}

function updateUserDisplay() {
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && currentUser) {
        nameEl.textContent = currentUser.fullName || '—';
    }
}

function handleNavigation(page) {
    const pageRoutes = {
        dashboard: 'dashboard.html',
        bookings: 'bookings.html',
        pets: 'pets.html',
        services: 'services.html',
        sales: 'store.html',
        clients: 'clients.html',
        staff: 'staff.html',
        workshifts: 'workshifts.html'
    };

    const route = pageRoutes[page];
    if (route && window.javaBridge) {
        window.javaBridge.navigateTo(`admin/${route}`);
    }
}

async function loadStaff() {
    try {
        const result = await callBridge('getAllUsers');
        if (result.success && result.data) {
            allStaff = (result.data || []).filter(u => u.role === 'STAFF');
            filteredStaff = [...allStaff];
            renderTable();
            updateStats();
        } else {
            allStaff = [];
            filteredStaff = [];
            renderTable();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        allStaff = [];
        filteredStaff = [];
        renderTable();
        updateStats();
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalStaffBadge');
    const activeEl = document.getElementById('activeStaffBadge');

    const total = allStaff.length;
    const active = allStaff.filter(staff => staff.isActive !== false).length;

    if (totalEl) totalEl.textContent = `Total Staff: ${total}`;
    if (activeEl) activeEl.textContent = `Active: ${active}`;
}

function renderTable() {
    const tbody = document.getElementById('staffTableBody');
    const emptyState = document.getElementById('emptyState');

    if (!tbody) return;

    if (!filteredStaff.length) {
        tbody.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');
    tbody.innerHTML = filteredStaff.map(createStaffRow).join('');
    attachRowEventListeners();
}

function createStaffRow(staff) {
    const active = staff.isActive !== false;
    const statusClass = active
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400';

    const initials = getInitials(staff.fullName);

    return `
        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors" data-staff-id="${staff.id}">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 font-bold text-sm">
                        ${escapeHtml(initials)}
                    </div>
                    <p class="font-bold text-sm text-text-main dark:text-white">${escapeHtml(staff.fullName || '—')}</p>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-text-muted font-semibold">${escapeHtml(staff.role || 'STAFF')}</td>
            <td class="px-6 py-4 text-sm text-text-main dark:text-gray-300">${escapeHtml(staff.email || '—')}</td>
            <td class="px-6 py-4 text-sm text-text-muted">${escapeHtml(staff.phoneNumber || '—')}</td>
            <td class="px-6 py-4">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${statusClass}">
                    ${active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                    <button
                        class="edit-btn size-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Edit"
                        data-id="${staff.id}"
                    >
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                    </button>
                    <button
                        class="deactivate-btn size-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
                        data-id="${staff.id}"
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

function setupEventListeners() {
    document.addEventListener('input', (event) => {
        if (event.target?.id !== 'searchInput') return;

        const query = event.target.value.toLowerCase().trim();
        filteredStaff = query
            ? allStaff.filter(staff =>
                (staff.fullName || '').toLowerCase().includes(query) ||
                (staff.email || '').toLowerCase().includes(query) ||
                (staff.phoneNumber || '').toLowerCase().includes(query)
            )
            : [...allStaff];

        renderTable();
    });

    setupLogout();
}

function attachRowEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const rawId = event.currentTarget.dataset.id || event.currentTarget.closest('tr')?.dataset.staffId;
            const staffId = parseEntityId(rawId);
            if (!staffId) {
                alert('Unable to edit staff: invalid ID. Please refresh and try again.');
                return;
            }
            editStaff(staffId);
        });
    });

    document.querySelectorAll('.deactivate-btn').forEach(btn => {
        btn.addEventListener('click', async (event) => {
            const rawId = event.currentTarget.dataset.id || event.currentTarget.closest('tr')?.dataset.staffId;
            const staffId = parseEntityId(rawId);
            if (!staffId) {
                alert('Unable to deactivate staff: invalid ID. Please refresh and try again.');
                return;
            }

            if (!(await confirmAction('Are you sure you want to deactivate this staff account?'))) {
                return;
            }
            deactivateStaff(staffId);
        });
    });
}

function openStaffModal(staff) {
    if (!staff) {
        return;
    }

    const title = 'Edit Staff Account';

    const content = `
        <form id="staffForm" class="space-y-4">
            <input type="hidden" id="staffId" value="${staff.id}" />

            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Full Name <span class="text-red-500">*</span></label>
                <input id="staffFullName" type="text" required
                    value="${escapeHtml(staff.fullName || '')}"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    placeholder="Enter full name" />
            </div>

            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Email <span class="text-red-500">*</span></label>
                <input id="staffEmail" type="email" required
                    value="${escapeHtml(staff.email || '')}"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    placeholder="name@petspa.com" />
            </div>

            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Phone</label>
                <input id="staffPhone" type="text"
                    value="${escapeHtml(staff.phoneNumber || '')}"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    placeholder="Optional" />
            </div>

            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">
                    Password (leave blank to keep current)
                </label>
                <input id="staffPassword" type="password"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white"
                    placeholder="Enter new password (optional)" />
            </div>

            <input id="staffRole" type="hidden" value="STAFF" />

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-800">
                <button type="button" onclick="closeModal()"
                    class="px-5 py-2.5 bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
                    Cancel
                </button>
                <button type="submit"
                    class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-content transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
    `;

    openModal(title, content);

    setTimeout(() => {
        document.getElementById('staffForm')?.addEventListener('submit', handleStaffSubmit);
    }, 50);
}

async function handleStaffSubmit(event) {
    event.preventDefault();

    const staffId = parseEntityId(document.getElementById('staffId')?.value);
    const fullName = document.getElementById('staffFullName')?.value?.trim();
    const email = document.getElementById('staffEmail')?.value?.trim();
    const phoneNumber = document.getElementById('staffPhone')?.value?.trim();
    const password = document.getElementById('staffPassword')?.value || '';

    if (!staffId) {
        alert('Unable to update staff: invalid ID.');
        return;
    }

    if (!fullName || !email) {
        alert('Please fill required fields.');
        return;
    }

    const payload = {
        id: staffId,
        fullName,
        email,
        phoneNumber,
        password: password || undefined,
        role: 'STAFF'
    };

    try {
        if (!(await confirmAction('Save changes to this staff account?'))) {
            return;
        }

        const result = await callBridge('updateUser', JSON.stringify(payload));

        if (!result.success) {
            alert('Error: ' + (result.message || 'Failed to save staff account.'));
            return;
        }

        closeModal();
        await loadStaff();
    } catch (error) {
        console.error('Error saving staff account:', error);
        alert('Unexpected error while saving staff account.');
    }
}

function editStaff(staffId) {
    const staff = allStaff.find(user => Number(user.id) === Number(staffId));
    if (!staff) {
        alert('Staff account not found.');
        return;
    }

    openStaffModal(staff);
}

async function deactivateStaff(staffId) {
    try {
        const result = await callBridge('deactivateUser', String(staffId));
        if (!result.success) {
            alert('Error: ' + (result.message || 'Failed to deactivate staff account.'));
            return;
        }

        await loadStaff();
    } catch (error) {
        console.error('Error deactivating staff account:', error);
        alert('Unexpected error while deactivating staff account.');
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            try {
                await callBridge('logout');
                window.javaBridge.navigateTo('index.html');
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
