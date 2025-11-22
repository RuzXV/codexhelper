<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import eventConfigs from '../../data/event_configs.json';
    import EventModal from './EventModal.svelte';
    import ShiftModal from './ShiftModal.svelte';
    import RemoveModal from './RemoveModal.svelte';

    const iconModules = import.meta.glob('../../assets/images/calendar/event_icons/*.{png,jpg,jpeg,webp,svg}', { eager: true });

    function getIconSrc(filename) {
        if (!filename) return null;
        const path = `../../assets/images/calendar/event_icons/${filename}`;
        return iconModules[path]?.default?.src || iconModules[path]?.default || null;
    }

    let viewDate = new Date();
    let events = [];
    let isAdmin = false;
    let clockTime = '';
    let clockInterval;
    let isLoading = false;

    let modalState = {
        add: false,
        shift: false,
        remove: false
    };

    $: activeSeries = getUniqueSeries(events);
    $: year = viewDate.getUTCFullYear();
    $: month = viewDate.getUTCMonth();
    $: monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(viewDate);
    
    $: calendarCells = generateGrid(year, month, events);

    onMount(async () => {
        startClock();
        await fetchEvents();
        checkAdminStatus();

        window.addEventListener('auth:loggedIn', checkAdminStatus);
        if (window.onAuthSuccess) window.onAuthSuccess = checkAdminStatus;
    });

    onDestroy(() => {
        if (clockInterval) clearInterval(clockInterval);
        window.removeEventListener('auth:loggedIn', checkAdminStatus);
    });

    function startClock() {
        const update = () => {
            const now = new Date();
            const datePart = now.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
            const timePart = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
            clockTime = `${datePart}, ${timePart} UTC`;
        };
        update();
        clockInterval = setInterval(update, 1000);
    }

    function checkAdminStatus() {
        const user = window.auth ? window.auth.getLoggedInUser() : null;
        isAdmin = user?.is_calendar_admin || false; 
    }

    async function fetchEvents() {
        isLoading = true;
        try {
            const response = await fetch('/api/events');
            if (response.ok) events = await response.json();
        } catch (e) { console.error("Fetch error", e);
        } finally {
            isLoading = false;
        }
    }

    function getUniqueSeries(allEvents) {
        const map = new Map();
        allEvents.forEach(e => {
            if (e.series_id && !map.has(e.series_id)) {
                map.set(e.series_id, { id: e.series_id, title: e.title, type: e.type });
            }
        });
        return Array.from(map.values());
    }

    function toISODate(d) { return d.toISOString().split('T')[0]; }
    
    function addDays(dateStr, days) {
        const d = new Date(dateStr + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + days);
        return toISODate(d);
    }

    function generateGrid(y, m, currentEvents) {
        const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        const firstDayIndex = new Date(Date.UTC(y, m, 1)).getUTCDay();
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
            const eventEnd = addDays(event.start_date, event.duration); 
            
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
                const endStr = addDays(e.start_date, e.duration - 1);
                return cell.dateStr >= e.start_date && cell.dateStr <= endStr;
            });

            if (dayActiveEvents.length === 0) return;

            const maxLane = dayActiveEvents.length > 0 
                ? Math.max(...dayActiveEvents.map(e => eventLaneMap.get(e.id))) 
                : 0;
            
            const cellEvents = new Array(maxLane + 1).fill(null);

            dayActiveEvents.forEach(e => {
                const lane = eventLaneMap.get(e.id);
                const endStr = addDays(e.start_date, e.duration - 1);
                
                const isStart = cell.dateStr === e.start_date;
                const isEnd = cell.dateStr === endStr;
                const dayOfWeek = new Date(cell.dateStr + 'T00:00:00Z').getUTCDay();
                const isRowStart = dayOfWeek === 0;
                const isRowEnd = dayOfWeek === 6;

                const config = eventConfigs.events[e.type];
                const iconSrc = config ? getIconSrc(config.icon) : null;
                const colorHex = config ? config.color_hex : '#3b82f6';

                cellEvents[lane] = { 
                    ...e, 
                    isStart, isEnd, isRowStart, isRowEnd,
                    iconSrc, 
                    colorHex 
                };
            });

            cell.events = cellEvents;
        });

        return cells;
    }

    function changeMonth(dir) {
        viewDate.setUTCMonth(viewDate.getUTCMonth() + dir);
        viewDate = new Date(viewDate);
    }

    async function handleSaveEvent(e) {
        const { preset, troop_type, start } = e.detail;
        const config = eventConfigs.events[preset];
        
        const currentYear = new Date().getUTCFullYear();
        const limitDate = new Date(Date.UTC(currentYear + 1, 11, 31)).toISOString().split('T')[0];
        const daysDiff = (new Date(limitDate) - new Date(start)) / (1000 * 60 * 60 * 24);
        const interval = config.recurrence_interval || 14;
        
        let count = 1;
        if (interval > 0) {
            count = Math.floor(daysDiff / interval) + 1;
        }

        isLoading = true;
        try {
            await window.auth.fetchWithAuth('/api/events', {
                method: 'POST',
                body: JSON.stringify({
                    title: config.title,
                    type: preset,
                    troop_type: troop_type || null,
                    start: start,
                    duration: config.duration,
                    repeat_count: count,
                    repeat_interval: interval
                })
            });
            await fetchEvents();
            window.showAlert(`Generated ${count} events successfully.`);
        } catch (err) {
            console.error("Failed to generate events", err);
            window.showAlert("Failed to create events.", "Error");
        } finally {
            isLoading = false;
        }
    }

    async function handleShiftSeries(e) {
        const { seriesId, shiftDays } = e.detail;
        isLoading = true;
        try {
            await window.auth.fetchWithAuth('/api/events/shift', {
                method: 'POST',
                body: JSON.stringify({ series_id: seriesId, shift_days: shiftDays })
            });
            await fetchEvents();
        } catch (err) { console.error(err); }
        finally { isLoading = false; }
    }

    async function handleRemoveSeries(e) {
        const { seriesId } = e.detail;
        isLoading = true;
        try {
            const toDelete = events.filter(ev => ev.series_id === seriesId);
            await Promise.all(toDelete.map(ev => 
                 window.auth.fetchWithAuth(`/api/events/${ev.id}`, { method: 'DELETE' })
            ));
            await fetchEvents();
        } catch (err) { console.error(err); }
        finally { isLoading = false; }
    }

    function getEventStyle(type, hex) {
        const baseHex = hex || '#3b82f6';
        return `
            background-color: ${baseHex}; 
            border-color: ${baseHex};
            color: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
    }
</script>

<section class="tool-hero">
    <div class="tool-hero-container">
        <div class="section-badge">Community Tools</div>
        <h1>Event Calendar</h1>
        <div class="utc-clock">{clockTime}</div>
    </div>
</section>

<section class="tool-content">
    <div class="tool-container calendar-container">
        
        <div class="calendar-header-card">
            <div class="nav-controls">
                <button class="nav-btn" on:click={() => changeMonth(-1)} aria-label="Prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h2>{monthName} <span class="year">{year}</span></h2>
                <button class="nav-btn" on:click={() => changeMonth(1)} aria-label="Next">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            {#if isAdmin}
                <div class="admin-panel">
                    <span class="admin-label">Admin:</span>
                    <button class="admin-btn add" on:click={() => modalState.add = true} aria-label="Add">
                        <i class="fas fa-plus"></i> Add
                    </button>
                    <button class="admin-btn shift" on:click={() => modalState.shift = true} aria-label="Shift">
                        <i class="fas fa-exchange-alt"></i> Shift
                    </button>
                    <button class="admin-btn remove" on:click={() => modalState.remove = true} aria-label="Remove">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            {/if}
        </div>

        <div class="calendar-card">
            <div class="weekdays">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            {#key viewDate} 
                <div class="grid" in:fade={{ duration: 250 }}>
                    
                    {#if isLoading}
                        <div class="loading-overlay">
                            <div class="spinner"></div>
                        </div>
                    {/if}

                    {#each calendarCells as cell}
                    <div class="day-cell" class:other-month={cell.isOtherMonth} class:today={cell.isToday} class:past={cell.isPast}>
                            <span class="day-number">{cell.day}</span>
                            <div class="event-stack">
                                {#each cell.events as event}
                                    {#if event}
                                        <div 
                                            class="event-bar" 
                                            class:start={event.isStart || event.isRowStart}
                                            class:end={event.isEnd || event.isRowEnd}
                                            style={getEventStyle(event.type, event.colorHex)}
                                        >
                                            {#if event.isStart || event.isRowStart}
                                                <div class="event-content">
                                                    {#if event.iconSrc}
                                                        <img src={event.iconSrc} alt="" class="event-icon" />
                                                    {/if}
                                                    <span class="event-title">
                                                        {event.title} {event.troop_type ? `(${event.troop_type})` : ''}
                                                    </span>
                                                </div>
                                            {:else}
                                                &nbsp;
                                            {/if}
                                        </div>
                                    {:else}
                                        <div class="event-bar placeholder"></div>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {/key}
        </div>

    </div>
</section>

<EventModal 
    isOpen={modalState.add} 
    {eventConfigs}
    on:close={() => modalState.add = false}
    on:save={handleSaveEvent}
/>

<ShiftModal
    isOpen={modalState.shift}
    {activeSeries}
    on:close={() => modalState.shift = false}
    on:shift={handleShiftSeries}
/>

<RemoveModal
    isOpen={modalState.remove}
    {activeSeries}
    on:close={() => modalState.remove = false}
    on:remove={handleRemoveSeries}
/>

<style>
    .calendar-container { max-width: 1200px; margin: 0 auto; }
    
    .tool-hero { padding-bottom: 20px; }
    .utc-clock {
        font-family: 'Monaco', monospace;
        font-size: 1.1rem; color: var(--accent-blue-bright);
        background: rgba(0, 0, 0, 0.3); padding: 6px 12px;
        border-radius: 8px; display: inline-block; margin-top: 10px;
        border: 1px solid var(--border-color);
    }

    .calendar-header-card {
        display: flex; justify-content: space-between; align-items: center;
        background: var(--bg-secondary); border: 1px solid var(--border-color);
        border-bottom: none; border-radius: 12px 12px 0 0; padding: 16px 24px;
        flex-wrap: wrap; gap: 16px;
    }
    .nav-controls { display: flex; align-items: center; gap: 16px; flex-grow: 1; justify-content: center; }
    .nav-controls h2 { margin: 0; font-size: 1.5rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px; min-width: 250px; text-align: center; }
    .nav-controls .year { color: var(--text-secondary); font-weight: 400; }
    .nav-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 1.2rem; cursor: pointer; padding: 8px; transition: color 0.2s; }
    .nav-btn:hover { color: white; }

    .admin-panel {
        display: flex; align-items: center; gap: 10px;
        background: rgba(255, 255, 255, 0.05); padding: 6px 12px; border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .admin-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-right: 5px; }
    .admin-btn {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 12px;
        border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
        border: 1px solid transparent; transition: all 0.2s;
    }
    .admin-btn.add { background: var(--accent-blue-light); color: var(--accent-blue); border-color: var(--accent-blue); }
    .admin-btn.add:hover { background: var(--accent-blue); color: white; }
    .admin-btn.shift { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border-color: var(--border-color); }
    .admin-btn.shift:hover { background: rgba(255, 255, 255, 0.2); }
    .admin-btn.remove { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }
    .admin-btn.remove:hover { background: rgba(239, 68, 68, 0.8); color: white; }

    .calendar-card {
        background: var(--bg-secondary); border: 1px solid var(--border-color);
        border-radius: 0 0 12px 12px; overflow: hidden; position: relative;
    }
    .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--bg-tertiary); padding: 10px 0;
        border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);
    }
    .weekdays div { text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    
    .grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: var(--border-color); gap: 1px; position: relative;
    }
    .day-cell {
        background-color: var(--bg-secondary);
        min-height: 120px; padding: 4px 0;
        display: flex; flex-direction: column; position: relative;
    }
    .day-cell.other-month { background-color: #0f1012; }
    .day-cell.other-month .day-number { opacity: 0.3; }
    .day-cell.today { background-color: rgba(59, 130, 246, 0.03); }
    
    .day-number {
        margin: 4px 8px;
        font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); align-self: flex-end;
    }
    .day-cell.today .day-number {
        background: var(--accent-blue);
        color: white; width: 24px; height: 24px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }

    .event-stack { display: flex; flex-direction: column; gap: 2px; width: 100%; margin-top: 2px; }
    
    .event-bar {
        height: 24px;
        font-size: 0.75rem; color: white;
        display: flex; align-items: center; padding: 0 4px;
        white-space: nowrap; overflow: hidden;
        position: relative; margin: 1px -1px;
        border-radius: 0;
    }
    .event-bar.placeholder {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        pointer-events: none;
    }
    .event-bar.start { border-top-left-radius: 4px; border-bottom-left-radius: 4px; margin-left: 4px; }
    .event-bar.end { border-top-right-radius: 4px; border-bottom-right-radius: 4px; margin-right: 4px; }
    
    .event-content { display: flex; align-items: center; gap: 6px; width: 100%; }
    
    .event-icon {
        width: 16px; height: 16px; object-fit: contain;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        flex-shrink: 0;
    }

    .event-title { 
        font-weight: 600; 
        text-shadow: 0 1px 2px rgba(0,0,0,0.5); 
        overflow: hidden; text-overflow: ellipsis; 
    }

    .loading-overlay {
        position: absolute;
        inset: 0; background: rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center; z-index: 10;
        backdrop-filter: blur(2px);
    }
    .spinner {
        width: 40px; height: 40px;
        border: 4px solid rgba(255,255,255,0.3);
        border-top-color: var(--accent-blue); border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    .day-cell.past::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 5;
        pointer-events: none;
        
        background-image: linear-gradient(
            to bottom left,
            transparent calc(50% - 1px),
            rgba(255, 255, 255, 0.1) calc(50% - 1px),
            rgba(255, 255, 255, 0.1) calc(50% + 1px),
            transparent calc(50% + 1px)
        );
    }

    .day-cell.past {
        opacity: 0.7;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
        .calendar-header-card { flex-direction: column; align-items: stretch; }
        .admin-panel { justify-content: center; }
        .day-cell { min-height: 80px; }
        .event-bar { height: 20px; font-size: 0.7rem; }
        .event-icon { width: 12px; height: 12px; }
    }
</style>