/**
 * PetSpa Admin - Bookings Calendar
 * Handles the monthly calendar view and booking management
 */

let currentUser = null;
let bookings = [];
let componentsInitialized = false;

// Current calendar state
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initBookingsPage();
});

document.addEventListener('bridgeReady', () => {
    initBookingsPage();
});

async function initBookingsPage() {
    if (componentsInitialized) return;
    if (!window.javaBridge) return;

    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/admin_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('bookings', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Manage Bookings';

        await initializePage();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing bookings page:', error);
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

        renderCalendar();
        await loadBookings();

    } catch (error) {
        console.error('Error initializing page:', error);
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
        'billing-history': 'billing_history.html',
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
// CALENDAR RENDERING
// =============================================================================

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day p-2 bg-slate-50/50 dark:bg-gray-900/20';
        grid.appendChild(blank);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
        grid.appendChild(createDayCell(day, isToday));
    }

    // Fill remaining cells so grid has complete rows
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day p-2 bg-slate-50/50 dark:bg-gray-900/20';
        grid.appendChild(blank);
    }

    updateMonthDisplay();
}

function createDayCell(day, isToday) {
    const cell = document.createElement('div');
    cell.className = isToday
        ? 'calendar-day p-2 bg-primary/5 hover:bg-primary/10 transition-colors'
        : 'calendar-day p-2 hover:bg-slate-50 dark:hover:bg-gray-800/10 transition-colors';
    cell.dataset.day = day;

    const dateStr = getDateString(currentYear, currentMonth, day);
    cell.dataset.date = dateStr;

    const dayLabel = document.createElement('span');
    dayLabel.className = isToday
        ? 'text-sm font-bold text-primary mb-2 block'
        : 'text-sm font-medium text-text-muted mb-2 block';
    dayLabel.textContent = day;
    cell.appendChild(dayLabel);

    const bookingsContainer = document.createElement('div');
    bookingsContainer.className = 'space-y-1';
    bookingsContainer.id = `day-${dateStr}`;
    cell.appendChild(bookingsContainer);

    return cell;
}

function updateMonthDisplay() {
    const el = document.getElementById('currentMonth');
    if (!el) return;
    el.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function getDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

// =============================================================================
// BOOKING DATA
// =============================================================================

async function loadBookings() {
    try {
        const result = await callBridge('getAllBookings');
        if (result.success && result.data) {
            bookings = result.data;
            renderBookingsOnCalendar();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function renderBookingsOnCalendar() {
    // Clear existing booking blocks
    document.querySelectorAll('[id^="day-"]').forEach(el => (el.innerHTML = ''));

    bookings.forEach(booking => {
        const dateStr = booking.bookingDate || booking.date;
        if (!dateStr) return;

        const container = document.getElementById(`day-${dateStr}`);
        if (container) {
            container.appendChild(createBookingBlock(booking));
        }
    });
}

function createBookingBlock(booking) {
    const block = document.createElement('div');
    block.className =
        'px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-content ' +
        'text-[11px] font-semibold truncate hover:bg-primary/20 transition-all cursor-pointer';

    const petName = booking.petName || booking.pet?.name || '—';
    const serviceName = booking.services?.[0]?.serviceName || booking.serviceName || booking.service?.name || '—';
    block.textContent = `${petName} • ${serviceName}`;

    const bookingId = parseEntityId(booking.id ?? booking.bookingId);
    if (!bookingId) {
        console.warn('Skipping booking click binding due to invalid booking ID:', booking);
        block.classList.add('opacity-50', 'cursor-not-allowed');
        block.title = 'Invalid booking ID';
        return block;
    }

    block.dataset.bookingId = String(bookingId);
    block.addEventListener('click', () => openBookingDetailsModal(bookingId));
    return block;
}

async function openBookingDetailsModal(bookingId) {
    const normalizedBookingId = parseEntityId(bookingId);
    if (!normalizedBookingId) {
        showToast('Unable to open booking details: invalid booking ID.', 'error');
        return;
    }

    try {
        const [bookingResult, customersResult, usersResult, servicesResult] = await Promise.all([
            callBridge('getBookingById', String(normalizedBookingId)),
            callBridge('getAllCustomers'),
            callBridge('getAllUsers'),
            callBridge('getAllServices')
        ]);

        if (!bookingResult.success || !bookingResult.data) {
            showToast('Failed to load booking details: ' + (bookingResult.message || 'Unknown error'), 'error');
            return;
        }

        const booking = bookingResult.data;
        const customers = customersResult.success ? (customersResult.data || []) : [];
        const staffList = usersResult.success
            ? (usersResult.data || []).filter(u => u.role === 'STAFF' && u.isActive !== false)
            : [];
        const servicesList = servicesResult.success
            ? (servicesResult.data || []).filter(s => s.isActive !== false)
            : [];

        const selectedCustomerId = parseEntityId(booking.customerId);
        const selectedPetId = parseEntityId(booking.petId);
        const selectedServiceId = parseEntityId(booking.serviceId || booking.services?.[0]?.serviceId);
        const selectedStaffIds = parseEntityIdList(booking.staffIds, booking.staffId);

        const customerOptions = customers.map(customer => {
            const customerId = parseEntityId(customer.id);
            const selected = customerId === selectedCustomerId ? 'selected' : '';
            return `<option value="${customerId}" ${selected}>${escapeHtml(customer.fullName || 'Customer')}</option>`;
        }).join('');

        const petOptions = renderPetOptionsForCustomer(customers, selectedCustomerId, selectedPetId);

        const serviceOptions = servicesList.map(service => {
            const serviceId = parseEntityId(service.id);
            const selected = serviceId === selectedServiceId ? 'selected' : '';
            const duration = service.durationMinutes ? `${service.durationMinutes} mins` : 'No duration';
            return `<option value="${serviceId}" ${selected}>${escapeHtml(service.name)} (${duration})</option>`;
        }).join('');

        const staffCheckboxes = renderStaffCheckboxes(staffList, selectedStaffIds, 'detailStaff');

        const statusOptions = buildBookingStatusOptions(booking.status);

        const content = `
            <form id="bookingDetailForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Customer</label>
                        <select id="detailCustomer" required
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                            <option value="">Select customer...</option>
                            ${customerOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Pet</label>
                        <select id="detailPet" required
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                            ${petOptions}
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Date</label>
                        <input type="date" id="detailDate" required value="${escapeHtml(booking.bookingDate || '')}"
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Time</label>
                        <input type="time" id="detailTime" required value="${escapeHtml(normalizeTimeForInput(booking.bookingTime || ''))}"
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white" />
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Assigned Staff (multi-select)</label>
                    <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
                        ${staffCheckboxes || '<p class="text-sm text-text-muted">No active staff available.</p>'}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Service</label>
                    <select id="detailService" required
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                        <option value="">Select service...</option>
                        ${serviceOptions}
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Status</label>
                        <select id="detailStatus"
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                            ${statusOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Total</label>
                        <input type="text" id="detailTotal" value="${escapeHtml(formatCurrency(booking.totalPrice))}" disabled
                            class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm text-text-main dark:text-white opacity-80" />
                    </div>
                </div>

                <div class="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-gray-800">
                    <button type="button" id="deleteBookingBtn"
                        class="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Delete Booking
                    </button>
                    <div class="flex gap-3">
                        <button type="button" onclick="closeModal()"
                            class="px-5 py-2.5 bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
                            Close
                        </button>
                        <button type="submit"
                            class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-content transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        `;

        openModal(`Booking #${normalizedBookingId}`, content);

        setTimeout(() => {
            const form = document.getElementById('bookingDetailForm');
            const customerSelect = document.getElementById('detailCustomer');
            const serviceSelect = document.getElementById('detailService');

            customerSelect?.addEventListener('change', () => {
                const nextCustomerId = parseEntityId(customerSelect.value);
                const petSelect = document.getElementById('detailPet');
                if (petSelect) {
                    petSelect.innerHTML = renderPetOptionsForCustomer(customers, nextCustomerId, null);
                }
            });

            serviceSelect?.addEventListener('change', () => {
                const selectedId = parseEntityId(serviceSelect.value);
                const selectedService = servicesList.find(service => parseEntityId(service.id) === selectedId);
                const totalInput = document.getElementById('detailTotal');
                if (totalInput) {
                    totalInput.value = formatCurrency(selectedService?.price || 0);
                }
            });

            form?.addEventListener('submit', (event) => handleBookingDetailsSubmit(event, normalizedBookingId));
            document.getElementById('deleteBookingBtn')?.addEventListener('click', () => handleDeleteBooking(normalizedBookingId));
        }, 50);
    } catch (error) {
        console.error('Error opening booking details modal:', error);
        showToast('Failed to open booking details. Please try again.', 'error');
    }
}

async function handleBookingDetailsSubmit(event, bookingId) {
    event.preventDefault();

    const normalizedBookingId = parseEntityId(bookingId);
    if (!normalizedBookingId) {
        showToast('Unable to update booking: invalid booking ID.', 'error');
        return;
    }

    const customerId = parseEntityId(document.getElementById('detailCustomer')?.value);
    const petId = parseEntityId(document.getElementById('detailPet')?.value);
    const bookingDate = document.getElementById('detailDate')?.value;
    const bookingTime = document.getElementById('detailTime')?.value;
    const serviceId = parseEntityId(document.getElementById('detailService')?.value);
    const status = document.getElementById('detailStatus')?.value;
    const staffIds = Array.from(document.querySelectorAll('input[name="detailStaff"]:checked'))
        .map(input => parseEntityId(input.value))
        .filter(Boolean);

    if (!customerId || !petId || !bookingDate || !bookingTime || !serviceId || !status) {
        showToast('Please complete all required booking fields.', 'info');
        return;
    }

    try {
        const payload = {
            id: normalizedBookingId,
            customerId,
            petId,
            bookingDate,
            bookingTime,
            serviceId,
            staffIds,
            status
        };

        const result = await callBridge('updateBooking', JSON.stringify(payload));

        if (result.success) {
            showToast('Booking updated successfully.', 'success');
            closeModal();
            await loadBookings();
        } else {
            showToast('Failed to update booking: ' + (result.message || 'Unknown error'), 'error', 4500);
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        showToast('Unexpected error while updating booking.', 'error');
    }
}

async function handleDeleteBooking(bookingId) {
    const normalizedBookingId = parseEntityId(bookingId);
    if (!normalizedBookingId) {
        showToast('Unable to delete booking: invalid booking ID.', 'error');
        return;
    }

    if (!(await confirmAction('Are you sure you want to delete this booking?'))) {
        return;
    }

    try {
        const result = await callBridge('deleteBooking', String(normalizedBookingId));
        if (result.success) {
            showToast('Booking deleted successfully.', 'success');
            closeModal();
            await loadBookings();
        } else {
            showToast('Failed to delete booking: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showToast('Unexpected error while deleting booking.', 'error');
    }
}

function buildBookingStatusOptions(currentStatus) {
    return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
        .map(status => {
            const selected = currentStatus === status ? 'selected' : '';
            const label = status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
            return `<option value="${status}" ${selected}>${label}</option>`;
        })
        .join('');
}

function renderPetOptionsForCustomer(customers, customerId, selectedPetId) {
    const customer = customers.find(item => parseEntityId(item.id) === customerId);
    const pets = customer?.pets || [];

    if (!customerId) {
        return '<option value="">Select a customer first...</option>';
    }

    if (!pets.length) {
        return '<option value="">No pets found for this customer</option>';
    }

    return pets.map(pet => {
        const petId = parseEntityId(pet.id);
        const selected = petId === selectedPetId ? 'selected' : '';
        return `<option value="${petId}" ${selected}>${escapeHtml(pet.name)} (${escapeHtml(pet.species || '')})</option>`;
    }).join('');
}

function renderStaffCheckboxes(staffList, selectedStaffIds, inputName) {
    const selectedSet = new Set((selectedStaffIds || []).map(Number));
    return staffList.map(staff => {
        const staffId = parseEntityId(staff.id);
        const checked = selectedSet.has(Number(staffId)) ? 'checked' : '';
        return `
            <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
                <input type="checkbox" name="${inputName}" value="${staffId}" ${checked} class="rounded accent-primary w-4 h-4" />
                <span class="text-sm text-text-main dark:text-white font-medium">${escapeHtml(staff.fullName || 'Staff')}</span>
            </label>
        `;
    }).join('');
}

function parseEntityIdList(ids, fallbackId) {
    if (Array.isArray(ids) && ids.length) {
        return ids.map(parseEntityId).filter(Boolean);
    }
    const singleId = parseEntityId(fallbackId);
    return singleId ? [singleId] : [];
}

function normalizeTimeForInput(timeValue) {
    if (!timeValue) return '';
    return String(timeValue).slice(0, 5);
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
        loadBookings();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
        loadBookings();
    });

    document.getElementById('todayBtn')?.addEventListener('click', () => {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth();
        renderCalendar();
        loadBookings();
    });

    document.getElementById('newBookingBtn')?.addEventListener('click', () => {
        openBookingModal();
    });

    setupLogout();
}

// =============================================================================
// USER DISPLAY / LOGOUT
// =============================================================================

function updateUserDisplay() {
    const nameEl = document.getElementById('currentUserName');
    if (nameEl && currentUser) {
        nameEl.textContent = currentUser.fullName || currentUser.username || '—';
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await callBridge('logout');
            window.javaBridge.navigateTo('index.html');
        });
    }
}

// =============================================================================
// NEW BOOKING MODAL
// =============================================================================

async function openBookingModal() {
    let customers = [];
    let staffList = [];
    let servicesList = [];

    try {
        const [custRes, usersRes, svcRes] = await Promise.all([
            callBridge('getAllCustomers'),
            callBridge('getAllUsers'),
            callBridge('getAllServices')
        ]);
        if (custRes.success) customers = custRes.data || [];
        if (usersRes.success) staffList = (usersRes.data || []).filter(u => u.role === 'STAFF' && u.isActive !== false);
        if (svcRes.success) servicesList = (svcRes.data || []).filter(s => s.isActive !== false);
    } catch (e) {
        showToast('Failed to load form data: ' + e.message, 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const customerOptions = customers.map(c =>
        `<option value="${c.id}">${escapeHtml(c.fullName)} — ${escapeHtml(c.phoneNumber || '')}</option>`
    ).join('');

    const serviceOptions = servicesList.map(service => {
        const duration = service.durationMinutes ? `${service.durationMinutes} mins` : 'No duration';
        return `<option value="${service.id}">${escapeHtml(service.name)} (${duration})</option>`;
    }).join('');

    const staffCheckboxes = renderStaffCheckboxes(staffList, [], 'bookingStaff');

    const content = `
        <form id="newBookingForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Customer <span class="text-red-500">*</span></label>
                <select id="bookingCustomer" required
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                    <option value="">Select a customer...</option>
                    ${customerOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Pet <span class="text-red-500">*</span></label>
                <select id="bookingPet" required
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                    <option value="">Select a customer first...</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Date <span class="text-red-500">*</span></label>
                    <input type="date" id="bookingDate" value="${today}" required
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Time <span class="text-red-500">*</span></label>
                    <input type="time" id="bookingTime" required
                        class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white" />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Service <span class="text-red-500">*</span></label>
                <select id="bookingService" required
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                    <option value="">Select service...</option>
                    ${serviceOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Assigned Staff (multi-select)</label>
                <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                    ${staffCheckboxes || '<p class="text-sm text-text-muted">No active staff available.</p>'}
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Estimated Total</label>
                <input type="text" id="bookingTotal" value="${escapeHtml(formatCurrency(0))}" disabled
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm text-text-main dark:text-white opacity-80" />
            </div>
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-gray-800">
                <button type="button" onclick="closeModal()"
                    class="px-5 py-2.5 bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
                    Cancel
                </button>
                <button type="submit"
                    class="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-content transition-colors">
                    Create Booking
                </button>
            </div>
        </form>`;

    openModal('New Booking', content);

    // Cascade: load pets when customer changes
    setTimeout(() => {
        const customerSelect = document.getElementById('bookingCustomer');
        const serviceSelect = document.getElementById('bookingService');
        if (customerSelect) {
            customerSelect.addEventListener('change', () => {
                const customerId = parseEntityId(customerSelect.value);
                const petSelect = document.getElementById('bookingPet');
                if (petSelect) {
                    petSelect.innerHTML = renderPetOptionsForCustomer(customers, customerId, null);
                }
            });
        }

        serviceSelect?.addEventListener('change', () => {
            const selectedServiceId = parseEntityId(serviceSelect.value);
            const selectedService = servicesList.find(service => parseEntityId(service.id) === selectedServiceId);
            const totalInput = document.getElementById('bookingTotal');
            if (totalInput) {
                totalInput.value = formatCurrency(selectedService?.price || 0);
            }
        });

        const form = document.getElementById('newBookingForm');
        if (form) {
            form.addEventListener('submit', handleNewBookingSubmit);
        }
    }, 100);
}

async function handleNewBookingSubmit(e) {
    e.preventDefault();

    const customerId = parseEntityId(document.getElementById('bookingCustomer').value);
    const petId = parseEntityId(document.getElementById('bookingPet').value);
    const bookingDate = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;
    const serviceId = parseEntityId(document.getElementById('bookingService').value);
    const staffIds = Array.from(document.querySelectorAll('input[name="bookingStaff"]:checked'))
        .map(input => parseEntityId(input.value))
        .filter(Boolean);

    if (!customerId || !petId || !bookingDate || !bookingTime || !serviceId) {
        showToast('Please fill in all required fields.', 'info');
        return;
    }

    const bookingData = {
        customerId,
        petId,
        bookingDate,
        bookingTime,
        serviceId,
        staffIds
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating...'; }

    try {
        const result = await callBridge('createBooking', JSON.stringify(bookingData));
        if (result.success) {
            showToast('Booking created successfully.', 'success');
            closeModal();
            await loadBookings();
        } else {
            showToast('Failed to create booking: ' + (result.message || 'Unknown error'), 'error', 4500);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Booking'; }
        }
    } catch (err) {
        showToast('Unexpected error: ' + err.message, 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Booking'; }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
