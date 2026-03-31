let currentUser = null;
let bookings = [];
let componentsInitialized = false;

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

document.addEventListener('DOMContentLoaded', () => {
    initMyTasksPage();
});

document.addEventListener('bridgeReady', () => {
    initMyTasksPage();
});

async function initMyTasksPage() {
    if (componentsInitialized || !window.javaBridge) return;
    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/staff_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('my-tasks', handleNavigation)
            },
            {
                path: '../components/admin_header.html',
                target: 'header'
            }
        ]);

        const userResult = await callBridge('getCurrentUser');
        if (!userResult.success || !userResult.data) {
            window.javaBridge.navigateTo('index.html');
            return;
        }

        currentUser = userResult.data;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'My Tasks';
        const userNameEl = document.getElementById('currentUserName');
        if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email || 'Staff';

        renderCalendar();
        await loadBookingsForVisibleMonth();
        setupEventListeners();
        setupLogout();
    } catch (error) {
        console.error('Error initializing My Tasks page:', error);
    }
}

function handleNavigation(page) {
    const routes = {
        dashboard: 'dashboard.html',
        'my-tasks': 'my_tasks.html',
        'my-schedule': 'my_schedule.html'
    };

    const route = routes[page];
    if (route) {
        window.javaBridge.navigateTo(`staff/${route}`);
    }
}

function setupEventListeners() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', async () => {
        currentMonth -= 1;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear -= 1;
        }
        renderCalendar();
        await loadBookingsForVisibleMonth();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', async () => {
        currentMonth += 1;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
        }
        renderCalendar();
        await loadBookingsForVisibleMonth();
    });

    document.getElementById('todayBtn')?.addEventListener('click', async () => {
        const now = new Date();
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
        renderCalendar();
        await loadBookingsForVisibleMonth();
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i += 1) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day p-2 bg-slate-50/50 dark:bg-gray-900/20';
        grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const isToday = day === today.getDate()
            && currentMonth === today.getMonth()
            && currentYear === today.getFullYear();
        grid.appendChild(createDayCell(day, isToday));
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i += 1) {
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

    const dateStr = getDateString(currentYear, currentMonth, day);
    cell.dataset.date = dateStr;

    const dayLabel = document.createElement('span');
    dayLabel.className = isToday
        ? 'text-sm font-bold text-primary mb-2 block'
        : 'text-sm font-medium text-text-muted mb-2 block';
    dayLabel.textContent = String(day);
    cell.appendChild(dayLabel);

    const bookingsContainer = document.createElement('div');
    bookingsContainer.className = 'space-y-1';
    bookingsContainer.id = `day-${dateStr}`;
    cell.appendChild(bookingsContainer);

    return cell;
}

function updateMonthDisplay() {
    const monthEl = document.getElementById('currentMonth');
    if (!monthEl) return;

    monthEl.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
}

function getDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

async function loadBookingsForVisibleMonth() {
    if (!currentUser?.id) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const requests = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateStr = getDateString(currentYear, currentMonth, day);
        requests.push(callBridge('getBookingsByStaff', String(currentUser.id), dateStr));
    }

    try {
        const results = await Promise.all(requests);
        bookings = results
            .filter((result) => result.success && Array.isArray(result.data))
            .flatMap((result) => result.data || []);

        renderBookingsOnCalendar();
    } catch (error) {
        console.error('Error loading staff bookings:', error);
        showToast('Failed to load your bookings.', 'error');
    }
}

function renderBookingsOnCalendar() {
    document.querySelectorAll('[id^="day-"]').forEach((el) => {
        el.innerHTML = '';
    });

    bookings.forEach((booking) => {
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
        'px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-content text-[11px] font-semibold truncate hover:bg-primary/20 transition-all cursor-pointer';

    const petName = booking.petName || booking.pet?.name || 'Pet';
    const serviceName = booking.services?.[0]?.serviceName || booking.serviceName || 'Service';
    block.textContent = `${petName} • ${serviceName}`;

    const bookingId = parseEntityId(booking.id ?? booking.bookingId);
    if (!bookingId) {
        return block;
    }

    block.addEventListener('click', () => openBookingDetailsModal(bookingId));
    return block;
}

async function openBookingDetailsModal(bookingId) {
    const normalizedBookingId = parseEntityId(bookingId);
    if (!normalizedBookingId) return;

    const result = await callBridge('getBookingById', String(normalizedBookingId));
    if (!result.success || !result.data) {
        showToast(result.message || 'Failed to load booking details.', 'error');
        return;
    }

    const booking = result.data;
    const serviceName = booking.services?.[0]?.serviceName || 'Service';

    const content = `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Date</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(booking.bookingDate || '—')}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                    <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Time</p>
                    <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(formatTime(String(booking.bookingTime || '')))}</p>
                </div>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Customer</p>
                <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(booking.customerName || '—')}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Pet</p>
                <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(booking.petName || '—')}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Service</p>
                <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(serviceName)}</p>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/50">
                <p class="text-xs uppercase tracking-wide text-text-muted font-bold">Status</p>
                <p class="text-sm font-semibold text-text-main dark:text-white mt-1">${escapeHtml(booking.status || '—')}</p>
            </div>
            <div class="flex justify-end pt-2">
                <button type="button" onclick="closeModal()" class="px-5 py-2.5 bg-slate-100 dark:bg-gray-700 text-text-main dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

    openModal(`Booking #${normalizedBookingId}`, content);
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn || logoutBtn.dataset.bound === 'true') return;

    logoutBtn.dataset.bound = 'true';
    logoutBtn.addEventListener('click', async () => {
        await callBridge('logout');
        window.javaBridge.navigateTo('index.html');
    });
}

function parseEntityId(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

console.log('Staff My Tasks JS loaded');