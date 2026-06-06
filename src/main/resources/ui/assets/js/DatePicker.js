(function () {
    const state = {
        activePicker: null
    };

    const DATE_PICKER_Z_INDEX = 'z-[9999]';

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function formatDateValue(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function parseDateValue(value) {
        if (!value) return null;

        const normalized = String(value).trim().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            return null;
        }

        const parsed = new Date(`${normalized}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        const formatted = formatDateValue(parsed);
        return formatted === normalized ? parsed : null;
    }

    function parseBoundDate(value) {
        return parseDateValue(value);
    }

    function closeActivePicker() {
        if (!state.activePicker) {
            return;
        }

        const pickerState = state.activePicker;
        pickerState.cleanupHandlers.forEach((cleanup) => cleanup());
        pickerState.popup.remove();
        state.activePicker = null;
    }

    function attachDatePicker(input, options = {}) {
        if (!input || input.dataset.petspaDatePickerBound === 'true') {
            return;
        }

        input.dataset.petspaDatePickerBound = 'true';
        input.readOnly = true;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('inputmode', 'none');

        if (!input.placeholder) {
            input.placeholder = options.placeholder || 'Select date';
        }

        const openPicker = (event) => {
            if (event) {
                event.preventDefault();
            }

            openDatePicker(input, options);
        };

        input.addEventListener('click', openPicker);
        input.addEventListener('focus', openPicker);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openPicker();
            }
        });
    }

    function attachTimeInput(input, options = {}) {
        if (!input || input.dataset.petspaTimePickerBound === 'true') {
            return;
        }

        input.dataset.petspaTimePickerBound = 'true';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.type = 'text'; // Enforce text type to avoid mobile numeric keyboard bugs
        input.maxLength = 5;

        if (!input.placeholder) {
            input.placeholder = options.placeholder || 'HH:mm';
        }

        // Smoothly format as the user types without rejecting keys
        input.addEventListener('input', (e) => {
            const cursorPosition = input.selectionStart;
            const oldValue = input.value;
            const formatted = formatTimeMask(oldValue);

            if (oldValue !== formatted) {
                input.value = formatted;
                
                // Maintain cursor position naturally
                const diff = formatted.length - oldValue.length;
                let nextCursor = cursorPosition + diff;
                nextCursor = Math.max(0, Math.min(nextCursor, formatted.length));
                input.setSelectionRange(nextCursor, nextCursor);
            }
        });

        // Validate time format when the user clicks away
        input.addEventListener('blur', () => {
            input.value = normalizeTimeValue(input.value);
        });
        
        // NOTE: The buggy 'keydown' listener has been completely removed.
    }

    function formatTimeMask(value) {
        const strValue = String(value || '');
        const hasTrailingColon = strValue.endsWith(':');
        
        // Keep only digits, up to 4 numbers maximum
        let digits = strValue.replace(/\D/g, '').slice(0, 4);

        // Auto-format into HH:mm format once 3 or more digits are entered
        if (digits.length >= 3) {
            return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
        }

        // Allow the user to manually type the colon after the 2nd digit
        if (digits.length === 2 && hasTrailingColon) {
            return `${digits}:`;
        }

        return digits;
    }

    function normalizeTimeValue(value) {
        const formatted = formatTimeMask(value);
        const match = formatted.match(/^(\d{2}):(\d{2})$/);
        if (!match) {
            return '';
        }

        const hours = Number(match[1]);
        const minutes = Number(match[2]);

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return '';
        }

        return `${pad(hours)}:${pad(minutes)}`;
    }

    function openDatePicker(input, options) {
        closeActivePicker();

        const initialDate = parseDateValue(input.value) || new Date();
        const pickerState = {
            input,
            options,
            viewDate: new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
            selectedDate: initialDate,
            minDate: parseBoundDate(input.getAttribute('min')),
            maxDate: parseBoundDate(input.getAttribute('max')),
            popup: null,
            cleanupHandlers: []
        };

        const popup = document.createElement('div');
        popup.className = `fixed ${DATE_PICKER_Z_INDEX} w-80 max-w-[calc(100vw-1rem)] rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-surface-dark shadow-2xl overflow-hidden`;
        popup.style.visibility = 'hidden';
        popup.style.opacity = '0';
        popup.style.transition = 'opacity 120ms ease';
        popup.innerHTML = `
            <div class="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-100 dark:border-gray-800">
                <button type="button" data-picker-action="prev" class="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors" aria-label="Previous month">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
                    </svg>
                </button>
                <div data-picker-title class="text-sm font-bold text-text-main dark:text-white"></div>
                <button type="button" data-picker-action="next" class="size-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-main dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors" aria-label="Next month">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
            <div class="grid grid-cols-7 gap-1 px-3 pt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <div class="text-center py-1">Sun</div>
                <div class="text-center py-1">Mon</div>
                <div class="text-center py-1">Tue</div>
                <div class="text-center py-1">Wed</div>
                <div class="text-center py-1">Thu</div>
                <div class="text-center py-1">Fri</div>
                <div class="text-center py-1">Sat</div>
            </div>
            <div data-picker-days class="grid grid-cols-7 gap-1 px-3 py-3"></div>
            <div class="flex items-center justify-between gap-3 px-3 py-3 border-t border-slate-100 dark:border-gray-800">
                <button type="button" data-picker-action="today" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-gray-800 text-sm font-semibold text-text-main dark:text-white hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
                    Today
                </button>
                <button type="button" data-picker-action="close" class="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-content transition-colors">
                    Done
                </button>
            </div>
        `;

        pickerState.popup = popup;
        document.body.appendChild(popup);

        const handlePopupClick = (event) => {
            const target = event.target.closest('[data-picker-action], [data-picker-date]');
            if (!target || !popup.contains(target)) {
                return;
            }

            event.preventDefault();

            if (target.dataset.pickerAction === 'prev') {
                pickerState.viewDate = new Date(pickerState.viewDate.getFullYear(), pickerState.viewDate.getMonth() - 1, 1);
                renderDatePicker(pickerState);
                positionDatePicker(pickerState);
                return;
            }

            if (target.dataset.pickerAction === 'next') {
                pickerState.viewDate = new Date(pickerState.viewDate.getFullYear(), pickerState.viewDate.getMonth() + 1, 1);
                renderDatePicker(pickerState);
                positionDatePicker(pickerState);
                return;
            }

            if (target.dataset.pickerAction === 'today') {
                selectDate(pickerState, new Date());
                return;
            }

            if (target.dataset.pickerAction === 'close') {
                closeActivePicker();
                return;
            }

            const pickedDate = parseDateValue(target.dataset.pickerDate);
            if (pickedDate) {
                selectDate(pickerState, pickedDate);
            }
        };

        const handleOutsidePointerDown = (event) => {
            if (popup.contains(event.target) || event.target === input) {
                return;
            }

            closeActivePicker();
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                closeActivePicker();
            }
        };

        const handleViewportChange = () => {
            if (state.activePicker === pickerState) {
                positionDatePicker(pickerState);
            }
        };

        popup.addEventListener('click', handlePopupClick);
        document.addEventListener('pointerdown', handleOutsidePointerDown, true);
        document.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        pickerState.cleanupHandlers.push(() => popup.removeEventListener('click', handlePopupClick));
        pickerState.cleanupHandlers.push(() => document.removeEventListener('pointerdown', handleOutsidePointerDown, true));
        pickerState.cleanupHandlers.push(() => document.removeEventListener('keydown', handleEscape));
        pickerState.cleanupHandlers.push(() => window.removeEventListener('resize', handleViewportChange));
        pickerState.cleanupHandlers.push(() => window.removeEventListener('scroll', handleViewportChange, true));

        renderDatePicker(pickerState);
        positionDatePicker(pickerState);
        popup.style.visibility = 'visible';
        popup.style.opacity = '1';

        state.activePicker = pickerState;
    }

    function renderDatePicker(pickerState) {
        const popup = pickerState.popup;
        const titleEl = popup.querySelector('[data-picker-title]');
        const daysEl = popup.querySelector('[data-picker-days]');
        if (!titleEl || !daysEl) {
            return;
        }

        titleEl.textContent = pickerState.viewDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        const year = pickerState.viewDate.getFullYear();
        const month = pickerState.viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayValue = formatDateValue(new Date());
        const selectedValue = formatDateValue(pickerState.selectedDate);

        const cells = [];

        for (let index = 0; index < firstDay; index += 1) {
            cells.push('<div class="aspect-square"></div>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const candidateDate = new Date(year, month, day);
            const value = formatDateValue(candidateDate);
            const isSelected = value === selectedValue;
            const isToday = value === todayValue;
            const isDisabled = isDateDisabled(candidateDate, pickerState.minDate, pickerState.maxDate);

            const classes = [
                'aspect-square rounded-xl text-sm font-semibold transition-colors flex items-center justify-center',
                isSelected ? 'bg-primary text-white shadow' : 'text-text-main dark:text-white hover:bg-slate-100 dark:hover:bg-gray-800',
                isToday && !isSelected ? 'ring-1 ring-primary/60 text-primary dark:text-primary' : '',
                isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''
            ].filter(Boolean).join(' ');

            cells.push(`
                <button type="button" class="${classes}" data-picker-date="${value}" ${isDisabled ? 'disabled' : ''}>
                    ${day}
                </button>
            `);
        }

        const trailingCells = 42 - cells.length;
        for (let index = 0; index < trailingCells; index += 1) {
            cells.push('<div class="aspect-square"></div>');
        }

        daysEl.innerHTML = cells.join('');
    }

    function isDateDisabled(candidateDate, minDate, maxDate) {
        const candidateValue = formatDateValue(candidateDate);
        if (minDate && candidateValue < formatDateValue(minDate)) {
            return true;
        }

        if (maxDate && candidateValue > formatDateValue(maxDate)) {
            return true;
        }

        return false;
    }

    function selectDate(pickerState, date) {
        const formatted = formatDateValue(date);
        pickerState.input.value = formatted;
        pickerState.input.dispatchEvent(new Event('input', { bubbles: true }));
        pickerState.input.dispatchEvent(new Event('change', { bubbles: true }));
        closeActivePicker();
    }

    function positionDatePicker(pickerState) {
        const popup = pickerState.popup;
        const inputRect = pickerState.input.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        const margin = 8;

        let left = inputRect.left;
        let top = inputRect.bottom + margin;

        left = Math.max(margin, Math.min(left, window.innerWidth - popupRect.width - margin));

        if (top + popupRect.height > window.innerHeight - margin) {
            top = inputRect.top - popupRect.height - margin;
        }

        top = Math.max(margin, top);

        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }

    window.DatePicker = {
        attachDatePicker,
        attachTimeInput,
        close: closeActivePicker
    };
})();