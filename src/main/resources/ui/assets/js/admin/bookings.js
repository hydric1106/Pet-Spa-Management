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
    const serviceName = booking.serviceName || booking.service?.name || '—';
    block.textContent = `${petName} • ${serviceName}`;

    block.addEventListener('click', () => navigateToBookingDetail(booking.id));
    return block;
}

function navigateToBookingDetail(bookingId) {
    window.javaBridge.setCurrentBookingId(bookingId);
    window.javaBridge.navigateTo('admin/booking_details.html');
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
    // Load data concurrently
    let customers = [], staffList = [], servicesList = [];
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
        alert('Failed to load form data: ' + e.message);
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const customerOptions = customers.map(c =>
        `<option value="${c.id}">${escapeHtml(c.fullName)} — ${escapeHtml(c.phoneNumber || '')}</option>`
    ).join('');

    const staffOptions = `<option value="">— No staff assigned —</option>` +
        staffList.map(s => `<option value="${s.id}">${escapeHtml(s.fullName)}</option>`).join('');

    const servicesCheckboxes = servicesList.map(s => `
        <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors">
            <input type="checkbox" name="bookingService" value="${s.id}" class="rounded accent-primary w-4 h-4" />
            <span class="flex-1 text-sm text-text-main dark:text-white font-medium">${escapeHtml(s.name)}</span>
            <span class="text-xs text-text-muted">${s.durationMinutes ? s.durationMinutes + ' mins' : ''}</span>
            <span class="text-xs font-semibold text-primary">${formatCurrency(s.price)}</span>
        </label>`).join('');

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
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Staff (optional)</label>
                <select id="bookingStaff"
                    class="w-full px-4 py-2.5 bg-slate-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-text-main dark:text-white">
                    ${staffOptions}
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-main dark:text-white mb-2">Services <span class="text-red-500">*</span></label>
                <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                    ${servicesCheckboxes || '<p class="text-sm text-text-muted">No active services available.</p>'}
                </div>
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
        if (customerSelect) {
            customerSelect.addEventListener('change', () => {
                const customerId = customerSelect.value;
                const petSelect = document.getElementById('bookingPet');
                if (!customerId) {
                    petSelect.innerHTML = '<option value="">Select a customer first...</option>';
                    return;
                }
                const customer = customers.find(c => String(c.id) === String(customerId));
                const pets = customer?.pets || [];
                if (pets.length === 0) {
                    petSelect.innerHTML = '<option value="">No pets found for this customer</option>';
                } else {
                    petSelect.innerHTML = pets.map(p =>
                        `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.species || '')})</option>`
                    ).join('');
                }
            });
        }

        const form = document.getElementById('newBookingForm');
        if (form) {
            form.addEventListener('submit', handleNewBookingSubmit);
        }
    }, 100);
}

async function handleNewBookingSubmit(e) {
    e.preventDefault();

    const customerId = parseInt(document.getElementById('bookingCustomer').value);
    const petId = parseInt(document.getElementById('bookingPet').value);
    const bookingDate = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;
    const staffId = document.getElementById('bookingStaff').value;

    const selectedServices = Array.from(
        document.querySelectorAll('input[name="bookingService"]:checked')
    ).map(cb => ({ serviceId: parseInt(cb.value) }));

    if (!customerId || !petId || !bookingDate || !bookingTime) {
        alert('Please fill in all required fields.');
        return;
    }
    if (selectedServices.length === 0) {
        alert('Please select at least one service.');
        return;
    }

    const bookingData = {
        customerId,
        petId,
        bookingDate,
        bookingTime,
        staffId: staffId ? parseInt(staffId) : null,
        services: selectedServices
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating...'; }

    try {
        const result = await callBridge('createBooking', JSON.stringify(bookingData));
        if (result.success) {
            closeModal();
            await loadBookings();
        } else {
            alert('Error: ' + result.message);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Booking'; }
        }
    } catch (err) {
        alert('Unexpected error: ' + err.message);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Booking'; }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}
