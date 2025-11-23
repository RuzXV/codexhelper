window.debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
};

window.animateCounter = (element, target, duration, prefix = '') => {
    if (!element) return;
    element.classList.add('counting-blur');
    
    const start = 0;
    const range = target - start;
    let startTime = null;

    if (range === 0) {
        element.textContent = prefix + target.toLocaleString();
        element.classList.remove('counting-blur');
        return;
    }

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        const current = Math.floor(start + range * percentage);
        element.textContent = prefix + current.toLocaleString();

        if (progress < duration) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = prefix + target.toLocaleString();
            element.classList.remove('counting-blur');
        }
    }

    window.requestAnimationFrame(step);
};

let confirmCallback = null;

window.showAlert = (message, title = "Notice") => {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMessage = document.getElementById('custom-alert-message');

    if (alertModal && alertTitle && alertMessage) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
    } else {
        alert(message);
    }
};

window.showConfirm = (message, title, onConfirm) => {
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmTitle = document.getElementById('custom-confirm-title');
    const confirmMessage = document.getElementById('custom-confirm-message');

    if (confirmModal && confirmTitle && confirmMessage) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmCallback = onConfirm;
        confirmModal.style.display = 'flex';
    } else {
        if (confirm(message)) {
            onConfirm();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertOkBtn = document.getElementById('custom-alert-ok-btn');
    if (alertModal && alertOkBtn) {
        alertOkBtn.addEventListener('click', () => alertModal.style.display = 'none');
    }

    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    if (confirmModal && confirmActionBtn && confirmCancelBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            confirmModal.style.display = 'none';
            confirmCallback = null;
        });

        confirmCancelBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            confirmCallback = null;
        });
    }
});

window.calendarUtils = {
    toISODate: (d) => d.toISOString().split('T')[0],
    
    addDays: (dateStr, days) => {
        const d = new Date(dateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().split('T')[0];
    },

    generateGrid: (y, m, currentEvents, eventConfigs, getIconSrc) => {
        const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        
        let firstDayIndex = new Date(Date.UTC(y, m, 1)).getUTCDay(); 
        firstDayIndex = (firstDayIndex + 6) % 7;

        const prevMonthDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
        const totalCells = 42;
        const cells = [];
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 0; i < totalCells; i++) {
            let cellYear = y, cellMonth = m, cellDay;
            let isOtherMonth = false;

            if (i < firstDayIndex) {
                isOtherMonth = true;
                cellDay = prevMonthDays - (firstDayIndex - 1 - i);
                cellMonth = m - 1;
                if (cellMonth < 0) { cellMonth = 11; cellYear--; }
            } else if (i >= firstDayIndex && i < firstDayIndex + daysInMonth) {
                cellDay = i - firstDayIndex + 1;
            } else {
                isOtherMonth = true;
                cellDay = i - (firstDayIndex + daysInMonth) + 1;
                cellMonth = m + 1;
                if (cellMonth > 11) { cellMonth = 0; cellYear++; }
            }

            const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`;
            const isPast = dateStr < todayStr; 

            cells.push({ 
                day: cellDay, 
                dateStr, 
                isOtherMonth, 
                isToday: dateStr === todayStr, 
                isPast,
                events: [] 
            });
        }

        const sortedEvents = [...currentEvents].sort((a, b) => {
            if (a.start_date !== b.start_date) return a.start_date.localeCompare(b.start_date);
            if (a.duration !== b.duration) return b.duration - a.duration;
            return a.title.localeCompare(b.title);
        });

        let laneFreeDates = []; 
        const eventLaneMap = new Map();

        sortedEvents.forEach(event => {
            const eventStart = event.start_date;
            const eventEnd = window.calendarUtils.addDays(event.start_date, event.duration); 
            
            let assignedLane = -1;
            for (let i = 0; i < laneFreeDates.length; i++) {
                if (eventStart >= laneFreeDates[i]) {
                    assignedLane = i;
                    break;
                }
            }

            if (assignedLane === -1) {
                assignedLane = laneFreeDates.length;
                laneFreeDates.push(eventEnd);
            } else {
                laneFreeDates[assignedLane] = eventEnd;
            }

            eventLaneMap.set(event.id, assignedLane);
        });

        cells.forEach(cell => {
            const dayActiveEvents = currentEvents.filter(e => {
                const endStr = window.calendarUtils.addDays(e.start_date, e.duration - 1);
                return cell.dateStr >= e.start_date && cell.dateStr <= endStr;
            });

            if (dayActiveEvents.length === 0) return;

            const maxLane = dayActiveEvents.length > 0 
                ? Math.max(...dayActiveEvents.map(e => eventLaneMap.get(e.id))) 
                : 0;
            
            const cellEvents = new Array(maxLane + 1).fill(null);

            dayActiveEvents.forEach(e => {
                const lane = eventLaneMap.get(e.id);
                const endStr = window.calendarUtils.addDays(e.start_date, e.duration - 1);
                
                const isStart = cell.dateStr === e.start_date;
                const isEnd = cell.dateStr === endStr;
                
                const dayOfWeek = (new Date(cell.dateStr + 'T00:00:00Z').getUTCDay() + 6) % 7;
                const isRowStart = dayOfWeek === 0;
                const isRowEnd = dayOfWeek === 6;

                const config = eventConfigs.events[e.type];
                const iconSrc = config ? getIconSrc(config.icon) : null;
                const colorHex = config ? config.color_hex : '#3b82f6';
                const guideLink = config ? config.guide_link : null;

                cellEvents[lane] = { 
                    ...e, 
                    isStart, isEnd, isRowStart, isRowEnd,
                    iconSrc, 
                    colorHex,
                    guideLink
                };
            });

            cell.events = cellEvents;
        });
        return cells;
    }
};