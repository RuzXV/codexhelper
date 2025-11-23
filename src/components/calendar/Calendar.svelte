<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade, slide } from 'svelte/transition';
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
    let selectedEventId = null;
    
    let isFilterOpen = false;
    let activeFilters = []; 
    const ALL_EVENT_TYPES = Object.keys(eventConfigs.events);
    let modalState = {
        add: false,
        shift: false,
        remove: false
    };
    $: activeSeries = getUniqueSeries(events);
    $: year = viewDate.getUTCFullYear();
    $: month = viewDate.getUTCMonth();
    $: monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(viewDate);
    $: filteredEvents = activeFilters.length > 0 
        ? events.filter(e => activeFilters.includes(e.type)) 
        : events;
    $: calendarCells = window.calendarUtils 
        ? window.calendarUtils.generateGrid(year, month, filteredEvents, eventConfigs, getIconSrc)
        : [];
    onMount(async () => {
        startClock();
        loadFilters();
        await fetchEvents();
        checkAdminStatus();

        window.addEventListener('auth:loggedIn', (e) => {
            checkAdminStatus();
            loadFilters(e.detail.user.id);
        });
        if (window.onAuthSuccess) window.onAuthSuccess = checkAdminStatus;

        document.addEventListener('click', (e) => {
            if (isFilterOpen && !e.target.closest('.filter-container')) {
                isFilterOpen = false;
            }
        });
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

    function loadFilters(userId = null) {
        const user = userId || (window.auth?.getLoggedInUser()?.id);
        const key = user ? `calendar_filters_${user}` : 'calendar_filters_guest';
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                activeFilters = JSON.parse(stored);
            } catch (e) { activeFilters = []; }
        }
    }

    function toggleFilter(type) {
        if (activeFilters.includes(type)) {
            activeFilters = activeFilters.filter(t => t !== type);
        } else {
            activeFilters = [...activeFilters, type];
        }
        saveFilters();
    }

    function saveFilters() {
        const user = window.auth?.getLoggedInUser()?.id;
        const key = user ? `calendar_filters_${user}` : 'calendar_filters_guest';
        localStorage.setItem(key, JSON.stringify(activeFilters));
    }

    function clearFilters() {
        activeFilters = [];
        saveFilters();
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

    function jumpToToday() {
        viewDate = new Date();
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

        const tempSeriesId = 'temp-' + Date.now();
        let tempEvents = [];
        let currDate = new Date(start);
        
        for(let i=0; i<count; i++) {
            tempEvents.push({
                id: `${tempSeriesId}-${i}`,
                series_id: tempSeriesId,
                title: config.title,
                type: preset,
                troop_type: troop_type || null,
                start_date: currDate.toISOString().split('T')[0],
                duration: config.duration,
                isTemp: true
            });
            currDate.setUTCDate(currDate.getUTCDate() + interval);
        }

        const previousEvents = [...events];
        events = [...events, ...tempEvents];
        modalState.add = false; 

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
            events = previousEvents;
            window.showAlert("Failed to create events.", "Error");
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
        finally { isLoading = false;
        }
    }

    async function handleRemoveSeries(e) {
        const { seriesId } = e.detail;
        isLoading = true;
        try {
            const toDelete = events.filter(ev => ev.series_id === seriesId);
            const prev = [...events];
            events = events.filter(ev => ev.series_id !== seriesId);
            await Promise.all(toDelete.map(ev => 
                 window.auth.fetchWithAuth(`/api/events/${ev.id}`, { method: 'DELETE' })
            ));
            await fetchEvents();
        } catch (err) { 
            console.error(err);
            await fetchEvents(); 
        }
        finally { isLoading = false;
        }
    }

    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 59, g: 130, b: 246 };
    }

    function getEventStyle(type, hex) {
        const rgb = hexToRgb(hex || '#3b82f6');
        return `
            background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35); 
            --event-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1);
        `;
    }
    
    function getMobileDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    }
</script>

<svelte:window on:click={() => selectedEventId = null } />

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
            <div class="filter-container">
                <button class="nav-btn filter-btn" on:click={() => isFilterOpen = !isFilterOpen} title="Filter Events">
                    <i class="fas fa-filter"></i>
                    {#if activeFilters.length > 0}<span class="filter-badge">{activeFilters.length}</span>{/if}
                </button>
                
                {#if isFilterOpen}
                    <div class="filter-dropdown" transition:slide={{duration: 200}}>
                        <div class="filter-header">
                            <span>Filter Events</span>
                            {#if activeFilters.length > 0}
                                <button class="clear-btn" on:click={clearFilters}>Clear</button>
                            {/if}
                        </div>
    
                        <div class="filter-list">
                            {#each ALL_EVENT_TYPES as type}
                                <label class="filter-item">
                                    <input type="checkbox" 
                                           checked={activeFilters.includes(type)}
                                           on:change={() => toggleFilter(type)}>
                                    <span class="checkmark" style="--evt-color: {eventConfigs.events[type].color_hex}"></span>
                                    {#if eventConfigs.events[type].icon}
                                        <img src={getIconSrc(eventConfigs.events[type].icon)} alt="" class="filter-list-icon" />
                                    {/if}
                                    {eventConfigs.events[type].title}
                                </label>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>

            <div class="nav-controls">
                <button class="nav-btn" on:click={() => changeMonth(-1)} aria-label="Prev">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h2>{monthName} <span class="year">{year}</span></h2>
                <button class="nav-btn" on:click={() => changeMonth(1)} aria-label="Next">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>

            <div class="right-controls">
                <button class="today-btn" on:click={jumpToToday}>Today</button>
                
                {#if isAdmin}
                    <div class="admin-panel">
                        <button class="admin-btn add" on:click={() => modalState.add = true} aria-label="Add">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="admin-btn shift" on:click={() => modalState.shift = true} aria-label="Shift">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="admin-btn remove" on:click={() => modalState.remove = true} aria-label="Remove">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <div class="calendar-card desktop-view">
            <div class="weekdays">
                <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
            </div>
             
            {#key viewDate} 
                <div class="grid" in:fade={{ duration: 250 }}>
                    {#each calendarCells as cell}
                        <div class="day-cell" 
                             class:other-month={cell.isOtherMonth} 
                             class:today={cell.isToday} 
                             class:past={cell.isPast}
                             class:skeleton-loading={isLoading && events.length === 0} >
                            
                            <span class="day-number">{cell.day}</span>
                            
                            <div class="event-stack">
                                {#each cell.events as event, i}
                                    {#if event}
                                        <div 
                                            class="event-bar" 
                                            class:start={event.isStart || event.isRowStart}
                                            class:end={event.isEnd || event.isRowEnd}
                                            class:temp-optimistic={event.isTemp}
                                            class:selected={selectedEventId === event.id}
                                            on:click|stopPropagation={() => selectedEventId = (selectedEventId === event.id ? null : event.id)}
                                            on:keydown={(e) => e.key === 'Enter' && (selectedEventId = (selectedEventId === event.id ? null : event.id))}
                                            role="button"
                                            tabindex="0"
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
                                                
                                                <div 
                                                    class="event-tooltip" 
                                                    on:click|stopPropagation 
                                                    role="dialog" 
                                                    aria-label="Event details"
                                                    tabindex="-1"
                                                    on:keydown|stopPropagation
                                                >
                                                    <div class="tooltip-header">
                                                        {#if event.iconSrc}<img src={event.iconSrc} alt="" />{/if}
                                                        <span>{event.title}</span>
                                                    </div>
                                                    <div class="tooltip-body">
                                                        {#if event.troop_type}<p>Troop: {event.troop_type}</p>{/if}
                                                        <p>Duration: {event.duration} days</p>
                                                        
                                                        {#if Array.isArray(event.guideLink)}
                                                            {#each event.guideLink as link}
                                                                <a href={link.url} target="_blank" class="guide-link" aria-label="Guide for {link.title}">
                                                                    <i class="fab fa-discord"></i> {link.title}
                                                                </a>
                                                            {/each}
                                                        {:else if event.guideLink}
                                                            <a href={event.guideLink} target="_blank" class="guide-link" aria-label="Guide for {event.title}">
                                                                <i class="fab fa-discord"></i> Event Guide
                                                            </a>
                                                        {/if}
                                                    </div>
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

        <div class="mobile-list-view">
            {#each calendarCells.filter(c => c.events.some(e => e !== null) && !c.isOtherMonth) as cell}
                <div class="mobile-day-card" class:today-card={cell.isToday}>
                    <div class="mobile-date-header">
                        {getMobileDate(cell.dateStr)}
                    </div>
                    <div class="mobile-events">
                        {#each cell.events.filter(e => e !== null) as event}
                            {#if event.isStart || event.isRowStart || event === cell.events.find(x => x && (x.isStart || x.isRowStart) === false)} 
                                <div class="mobile-event-row" style="border-left: 4px solid {event.colorHex || '#3b82f6'}">
                                    <div class="mobile-event-info">
                                        <span class="mobile-event-title">{event.title}</span>
                                        {#if event.troop_type}
                                            <span class="mobile-troop-badge">{event.troop_type}</span>
                                        {/if}
                                    </div>
                                    
                                    <div class="mobile-actions">
                                        {#if Array.isArray(event.guideLink)}
                                            {#each event.guideLink as link}
                                                <a href={link.url} target="_blank" class="mobile-guide-btn" title={link.title} aria-label="Guide for {link.title}">
                                                    <i class="fas fa-book-open"></i>
                                                </a>
                                            {/each}
                                        {:else if event.guideLink}
                                            <a href={event.guideLink} target="_blank" class="mobile-guide-btn" aria-label="Guide for {event.title}">
                                                <i class="fas fa-book-open"></i>
                                            </a>
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
             {#if calendarCells.filter(c => c.events.some(e => e !== null) && !c.isOtherMonth).length === 0}
                <div class="empty-state">No events found for this month.</div>
            {/if}
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
        position: relative;
    }
    .nav-controls { display: flex; align-items: center; gap: 16px; flex-grow: 1; justify-content: center; }
    .nav-controls h2 { margin: 0; font-size: 1.5rem; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 1px;
        min-width: 250px; text-align: center; }
    .nav-controls .year { color: var(--text-secondary); font-weight: 400; }
    
    .nav-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 1.2rem; cursor: pointer;
        padding: 8px; transition: color 0.2s; }
    .nav-btn:hover { color: white; }

    .right-controls { display: flex; align-items: center; gap: 12px; }
    .today-btn {
        background: var(--bg-tertiary); color: var(--text-primary);
        border: 1px solid var(--border-color); padding: 6px 12px;
        border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
        transition: all 0.2s;
    }
    .today-btn:hover { background: var(--accent-blue); color: white; border-color: var(--accent-blue); }

    .admin-panel {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255, 255, 255, 0.05); padding: 4px; border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .admin-btn {
        width: 32px; height: 32px; display: flex;
        align-items: center; justify-content: center;
        border-radius: 6px; font-size: 0.9rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
    }
    .admin-btn.add { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }
    .admin-btn.add:hover { background: var(--accent-blue); color: white; }
    .admin-btn.shift { background: rgba(255, 255, 255, 0.1); color: var(--text-primary); }
    .admin-btn.shift:hover { background: rgba(255, 255, 255, 0.2); }
    .admin-btn.remove { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
    .admin-btn.remove:hover { background: rgba(239, 68, 68, 0.8); color: white; }

    .filter-container { position: relative; }
    .filter-btn { display: flex; align-items: center; gap: 5px; position: relative; }
    .filter-badge { background: var(--accent-blue); color: white; font-size: 0.7rem; border-radius: 50%; width: 16px; height: 16px;
        display: flex; align-items: center; justify-content: center; position: absolute; top: 0; right: 0;
    }
    
    .filter-dropdown {
        position: absolute;
        top: 100%; left: 0; z-index: 100;
        background: var(--bg-tertiary); border: 1px solid var(--border-color);
        border-radius: 8px; width: 280px;
        padding: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    
    .filter-header { 
        display: flex;
        justify-content: space-between; 
        align-items: center; 
        height: 32px; 
        margin-bottom: 8px; 
        font-size: 0.9rem; 
        color: var(--text-secondary); 
        border-bottom: 1px solid var(--border-color); 
        box-sizing: border-box;
    }
    
    .clear-btn { background: none; border: none; color: var(--text-muted); font-size: 0.8rem; cursor: pointer;
        text-decoration: underline; padding: 0; margin: 0; line-height: 1; }
    .filter-list { max-height: 300px; overflow-y: auto; display: flex;
        flex-direction: column; gap: 5px; }
    
    .filter-item { display: flex; align-items: center; gap: 8px;
        padding: 5px; cursor: pointer; font-size: 0.9rem; color: var(--text-primary); }
    .filter-item input { display: none; }
    .filter-list-icon { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
    .checkmark { width: 12px; height: 12px; border-radius: 2px; border: 1px solid var(--text-muted); background: transparent; position: relative;
        flex-shrink: 0; }
    .filter-item input:checked + .checkmark { background: var(--evt-color); border-color: var(--evt-color); }

    .calendar-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0 0 12px 12px; overflow: hidden; }
    .weekdays { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--bg-tertiary); padding: 10px 0; border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color); }
    .weekdays div { text-align: center; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    
    .grid { 
        display: grid; 
        grid-template-columns: repeat(7, 1fr); 
        background: var(--bg-secondary);
        gap: 0; 
        border-top: 1px solid var(--border-color);
        border-left: 1px solid var(--border-color);
    }
    .day-cell { 
        background-color: var(--bg-secondary); 
        min-height: 80px;
        padding: 4px 0; 
        display: flex; 
        flex-direction: column; 
        position: relative; 
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
    }
    
    .day-cell.today { 
        background-color: rgba(59, 130, 246, 0.05);
        box-shadow: inset 0 0 0 2px var(--accent-blue), inset 0 0 15px rgba(59,130,246,0.2);
        z-index: 2;
    }
    .day-cell.other-month { background-color: #0f1012; }
    .day-cell.other-month .day-number { opacity: 0.3; }
    
    .day-number { 
        margin: 4px 8px;
        font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); align-self: flex-end;
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
    }
    .day-cell.today .day-number { background: var(--accent-blue); color: white; border-radius: 50%; }

    .day-cell.skeleton-loading { pointer-events: none; }
    .day-cell.skeleton-loading::before {
        content: "";
        position: absolute; inset: 10px; background: rgba(255,255,255,0.05);
        border-radius: 4px; animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

    .event-stack { display: flex; flex-direction: column; gap: 2px; width: 100%; margin-top: 2px; }
    
    .event-bar {
        height: 24px;
        font-size: 0.75rem; color: white; display: flex; align-items: center; padding: 0 4px;
        white-space: nowrap; overflow: visible; position: relative; 
        
        margin: 1px -1px; 
        
        border-radius: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
        border-left: none;
        border-right: none;
        
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        
        cursor: pointer;
        z-index: 10;
    }

    .event-bar.placeholder {
        background: transparent !important;
        border: none !important;
        backdrop-filter: none !important;
        pointer-events: none;
        z-index: 0;
    }

    .event-bar.start { 
        border-top-left-radius: 6px; 
        border-bottom-left-radius: 6px; 
        margin-left: 6px;
        border-left: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .event-bar.end { 
        border-top-right-radius: 6px; 
        border-bottom-right-radius: 6px; 
        margin-right: 6px;
        border-right: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    .event-bar.temp-optimistic { opacity: 0.7; filter: grayscale(0.3); }
    
    .event-content { display: flex; align-items: center; gap: 6px; width: 100%; overflow: hidden; }
    .event-icon { width: 16px; height: 16px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); flex-shrink: 0; }
    .event-title { font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); overflow: hidden; text-overflow: ellipsis; }

    .event-tooltip {
        display: none; position: absolute; bottom: 100%;
        left: 50%; transform: translateX(-50%);
        background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px;
        padding: 10px; min-width: 180px; z-index: 50;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        margin-bottom: 8px; pointer-events: none;
    }
    .event-bar:hover .event-tooltip,
    .event-bar.selected .event-tooltip { display: block; pointer-events: auto; }
    
    .tooltip-header { display: flex; align-items: center; gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px; margin-bottom: 5px; font-weight: bold; }
    .tooltip-header img { width: 20px; height: 20px; }
    .tooltip-body p { margin: 2px 0; color: var(--text-secondary); font-size: 0.8rem; }
    .guide-link { display: inline-flex; align-items: center; gap: 5px; margin-top: 5px; color: var(--accent-blue); font-weight: 600; text-decoration: none;
        font-size: 0.8rem; display: block; }
    .guide-link:hover { text-decoration: underline; }

    .mobile-list-view { display: none; background: var(--bg-secondary); border-radius: 0 0 12px 12px; padding: 10px; }
    .mobile-day-card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 10px; padding: 10px; }
    .mobile-day-card.today-card { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.03); }
    .mobile-date-header { font-weight: bold; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 10px; }
    .mobile-event-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 8px 12px; margin-bottom: 5px; border-radius: 4px; }
    .mobile-event-info { display: flex; flex-direction: column; }
    .mobile-event-title { font-weight: 600; color: var(--text-primary); }
    .mobile-troop-badge { font-size: 0.75rem; color: var(--text-muted); }
    .mobile-actions { display: flex; gap: 8px; }
    .mobile-guide-btn { color: var(--accent-blue); padding: 5px; font-size: 1.1rem; }
    .empty-state { padding: 20px; text-align: center; color: var(--text-muted); }

    @media (max-width: 768px) {
        .calendar-header-card { flex-direction: column; align-items: stretch; }
        .nav-controls { order: 2; }
        .filter-container { order: 1; align-self: flex-start; }
        .right-controls { order: 3; justify-content: space-between; width: 100%; }
        
        .desktop-view { display: none; }
        .mobile-list-view { display: block; }
    }
</style>