let currentUser = null;
let schedules = [];
let staffList = [];
let componentsInitialized = false;
let showEveryone = false;

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

document.addEventListener('DOMContentLoaded', () => {
    initMySchedulePage();
});

document.addEventListener('bridgeReady', () => {
    initMySchedulePage();
});

async function initMySchedulePage() {
    if (componentsInitialized || !window.javaBridge) return;
    componentsInitialized = true;

    try {
        await loadComponents([
            {
                path: '../components/staff_sidebar.html',
                target: 'sidebar',
                callback: () => initSidebarNavigation('my-schedule', handleNavigation)
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
        if (pageTitle) pageTitle.textContent = 'My Schedule';
        const userNameEl = document.getElementById('currentUserName');
        if (userNameEl) userNameEl.textContent = currentUser.fullName || currentUser.email || 'Staff';

        await loadStaffList();
        renderCalendar();
        bindEventListeners();
        await loadSchedules();
        setupLogout();
    } catch (error) {
        console.error('Failed to initialize My Schedule page:', error);
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

function bindEventListeners() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', async () => {
        currentMonth -= 1;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear -= 1;
        }
        renderCalendar();
        await loadSchedules();
    });

    document.getElementById('nextMonthBtn')?.addEventListener('click', async () => {
        currentMonth += 1;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear += 1;
        }
        renderCalendar();
        await loadSchedules();
    });

    document.getElementById('todayBtn')?.addEventListener('click', async () => {
        const now = new Date();
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
        renderCalendar();
        await loadSchedules();
    });

    document.getElementById('showMineBtn')?.addEventListener('click', async () => {
        if (!showEveryone) return;
        showEveryone = false;
        updateVisibilityToggleUI();
        await loadSchedules();
    });

    document.getElementById('showEveryoneBtn')?.addEventListener('click', async () => {
        if (showEveryone) return;
        showEveryone = true;
        updateVisibilityToggleUI();
        await loadSchedules();
    });

    document.getElementById('closeScheduleDetailBtn')?.addEventListener('click', closeScheduleDetailModal);
    document.getElementById('closeScheduleDetailFooterBtn')?.addEventListener('click', closeScheduleDetailModal);
    document.getElementById('scheduleDetailBackdrop')?.addEventListener('click', closeScheduleDetailModal);
}

function updateVisibilityToggleUI() {
    const mineBtn = document.getElementById('showMineBtn');
    const everyoneBtn = document.getElementById('showEveryoneBtn');

    if (!mineBtn || !everyoneBtn) return;

    if (showEveryone) {
        mineBtn.className = 'px-4 py-1.5 text-sm font-semibold rounded-lg text-text-muted hover:text-text-main dark:hover:text-white transition-colors';
        everyoneBtn.className = 'px-4 py-1.5 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 text-text-main dark:text-white shadow-sm transition-colors';
    } else {
        mineBtn.className = 'px-4 py-1.5 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 text-text-main dark:text-white shadow-sm transition-colors';
        everyoneBtn.className = 'px-4 py-1.5 text-sm font-semibold rounded-lg text-text-muted hover:text-text-main dark:hover:text-white transition-colors';
    }
}

async function loadStaffList() {
    const result = await callBridge('getAllUsers');
    if (!result.success || !Array.isArray(result.data)) {
        staffList = [];
        return;
    }

    staffList = result.data.filter((user) => user.role === 'STAFF' && user.isActive !== false);
}

async function loadSchedules() {
    schedules = [];

    try {
        if (showEveryone) {
            const requests = staffList
                .map((staff) => ({
                    staff,
                    staffId: parseEntityId(staff.id)
                }))
                .filter((item) => item.staffId)
                .map(async ({ staff, staffId }) => {
                    const result = await callBridge('getStaffSchedule', String(staffId));
                    if (!result.success || !Array.isArray(result.data)) {
                        return [];
                    }

                    return result.data.map((schedule) => normalizeSchedule(schedule, staff));
                });

            const groups = await Promise.all(requests);
            schedules = groups.flat().filter((item) => item.id && item.scheduleDate);
        } else {
            const myId = parseEntityId(currentUser?.id);
            if (!myId) {
                renderSchedulesOnCalendar();
                return;
            }

            const result = await callBridge('getStaffSchedule', String(myId));
            schedules = result.success && Array.isArray(result.data)
                ? result.data.map((schedule) => normalizeSchedule(schedule, currentUser)).filter((item) => item.id && item.scheduleDate)
                : [];
        }

        renderSchedulesOnCalendar();
    } catch (error) {
        console.error('Error loading schedules:', error);
        showToast('Failed to load schedule data.', 'error');
    }
}

function normalizeSchedule(schedule, fallbackStaff) {
    return {
        ...schedule,
        id: parseEntityId(schedule.id),
        staffId: parseEntityId(schedule.staffId) || parseEntityId(fallbackStaff?.id),
        staffName: schedule.staffName || fallbackStaff?.fullName || 'Staff',
        shiftTypeId: parseEntityId(schedule.shiftTypeId),
        scheduleDate: normalizeScheduleDate(schedule.scheduleDate),
        dayOfWeek: Number(schedule.dayOfWeek)
    };
}

function renderCalendar() {
    updateMonthDisplay();

    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i -= 1) {
        const day = prevMonthLastDay - i;
        grid.appendChild(createDayCell(day, true, false));
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const isToday = isCurrentMonth && today.getDate() === day;
        grid.appendChild(createDayCell(day, false, isToday));
    }

    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i += 1) {
        grid.appendChild(createDayCell(i, true, false));
    }
}

function createDayCell(day, isOtherMonth, isToday) {
    const cell = document.createElement('div');
    cell.className = `calendar-day p-2 ${isOtherMonth ? 'bg-slate-50/50 dark:bg-gray-900/50' : ''} ${isToday ? 'bg-primary/5' : ''}`;
    cell.dataset.day = String(day);
    cell.dataset.otherMonth = String(isOtherMonth);

    const dayLabel = document.createElement('span');
    dayLabel.className = `text-xs font-bold ${isOtherMonth ? 'text-slate-300 dark:text-gray-600' : isToday ? 'text-primary' : 'text-slate-400'}`;
    dayLabel.textContent = String(day);
    cell.appendChild(dayLabel);

    const shiftsContainer = document.createElement('div');
    shiftsContainer.className = 'mt-1 space-y-1 shifts-container';
    shiftsContainer.dataset.day = String(day);
    cell.appendChild(shiftsContainer);

    return cell;
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('currentMonth');
    if (!monthDisplay) return;

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

function renderSchedulesOnCalendar() {
    document.querySelectorAll('.shifts-container').forEach((container) => {
        container.innerHTML = '';
    });

    if (!schedules.length) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
        const dateKey = getDateString(currentYear, currentMonth, day);
        const matched = schedules.filter((schedule) => schedule.scheduleDate === dateKey);
        if (!matched.length) continue;

        const containers = document.querySelectorAll(`.shifts-container[data-day="${day}"]`);
        containers.forEach((container) => {
            if (container.closest('.calendar-day')?.dataset.otherMonth === 'true') return;
            matched.forEach((schedule) => container.appendChild(createShiftBadge(schedule)));
        });
    }
}

function createShiftBadge(schedule) {
    const badge = document.createElement('div');

    let colorClass = 'bg-blue-500';
    if (schedule.shiftName) {
        const name = schedule.shiftName.toLowerCase();
        if (name.includes('afternoon')) {
            colorClass = 'bg-orange-500';
        } else if (name.includes('full')) {
            colorClass = 'bg-green-500';
        }
    }

    badge.className = `${colorClass} text-white text-[10px] px-2 py-1 rounded font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity`;
    badge.textContent = showEveryone ? (schedule.staffName || 'Staff') : (schedule.shiftName || 'Shift');
    badge.title = `${schedule.staffName || 'Staff'} — ${schedule.shiftName || 'Shift'}`;
    badge.addEventListener('click', () => openScheduleDetailModal(schedule));

    return badge;
}

function openScheduleDetailModal(schedule) {
    const modal = document.getElementById('scheduleDetailModal');
    if (!modal) return;

    document.getElementById('detailStaffName').textContent = `Staff: ${schedule.staffName || '—'}`;
    document.getElementById('detailShiftName').textContent = `Shift: ${schedule.shiftName || '—'}`;
    document.getElementById('detailShiftDate').textContent = `Date: ${formatScheduleDateForDisplay(schedule.scheduleDate)}`;
    document.getElementById('detailShiftTime').textContent = `Time: ${formatTime(String(schedule.startTime || ''))} - ${formatTime(String(schedule.endTime || ''))}`;

    modal.classList.remove('hidden');
}

function closeScheduleDetailModal() {
    document.getElementById('scheduleDetailModal')?.classList.add('hidden');
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

function getDateString(year, month, day) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

function normalizeScheduleDate(value) {
    if (!value) return null;
    if (typeof value === 'string') return value.slice(0, 10);

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

function formatScheduleDateForDisplay(value) {
    const normalized = normalizeScheduleDate(value);
    if (!normalized) return '—';

    const date = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(date.getTime())) return normalized;

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

console.log('Staff My Schedule JS loaded');