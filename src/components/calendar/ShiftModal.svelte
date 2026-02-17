<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import eventConfigs from '../../data/event_configs.json';
    import { getIconSrc } from './calendarIcons';

    export let isOpen = false;
    export let activeSeries = [];
    export let events = [];

    const dispatch = createEventDispatcher();

    let shiftDays = '';
    let selectedSeriesId = '';
    let selectedSeriesTitle = '';
    let selectedSeriesIcon = null;
    
    let shiftScope = 'all';
    let anchorDate = '';
    let isDropdownOpen = false;
    let isDateDropdownOpen = false;

    $: seriesDates = selectedSeriesId 
        ? events
            .filter(e => e.series_id === selectedSeriesId)
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
        : [];

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
        isDateDropdownOpen = false;
    }

    function toggleDateDropdown() {
        isDateDropdownOpen = !isDateDropdownOpen;
        isDropdownOpen = false;
    }

    function selectSeries(series) {
        selectedSeriesId = series.id;
        selectedSeriesTitle = series.title;
        const config = eventConfigs.events[series.type];
        selectedSeriesIcon = config && config.icon ? getIconSrc(config.icon) : null;
        isDropdownOpen = false;
        anchorDate = '';
    }

    function selectAnchorDate(date) {
        anchorDate = date;
        isDateDropdownOpen = false;
    }

    function handleShift() {
        const days = parseInt(shiftDays);
        if (!selectedSeriesId || isNaN(days) || days === 0) return;
        
        if (shiftScope !== 'all' && !anchorDate) return;

        dispatch('shift', { 
            seriesId: selectedSeriesId, 
            shiftDays: days,
            scope: shiftScope,
            anchorDate: anchorDate
        });
        close();
    }

    function close() {
        shiftDays = '';
        selectedSeriesId = '';
        selectedSeriesTitle = '';
        selectedSeriesIcon = null;
        shiftScope = 'all';
        anchorDate = '';
        isDropdownOpen = false;
        isDateDropdownOpen = false;
        dispatch('close');
    }

    function handleOutsideClick(e) {
        if (!e.target.closest('.custom-select-container')) {
            isDropdownOpen = false;
            isDateDropdownOpen = false;
        }
    }
    
    function getSeriesIcon(type) {
        const config = eventConfigs.events[type];
        return config && config.icon ? getIconSrc(config.icon) : null;
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' 
        });
    }
</script>

<svelte:window on:click={handleOutsideClick} />

{#if isOpen}
    <div class="simple-modal-overlay" role="button" tabindex="0" on:click|self={close} on:keydown={(e) => e.key === 'Escape' && close()}>
        <div class="simple-modal-content">
            <h3>Shift Event Series</h3>
            
            <div class="form-group">
                <label for="series-select">Select Event Series</label>
                <div class="custom-select-container">
                    <div class="select-selected" class:select-arrow-active={isDropdownOpen} on:click|stopPropagation={toggleDropdown} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()} role="button" tabindex="0">
                        {#if selectedSeriesId}
                            <div class="selected-content">
                                {#if selectedSeriesIcon}
                                    <img src={selectedSeriesIcon} alt="" class="select-icon">
                                {/if}
                                <span>{selectedSeriesTitle}</span>
                            </div>
                        {:else}
                            <span class="placeholder">-- Choose Series --</span>
                        {/if}
                    </div>

                    {#if isDropdownOpen}
                        <div class="select-items" transition:slide={{ duration: 200 }}>
                            {#each activeSeries as series}
                                <div 
                                    class="select-option" 
                                    on:click={() => selectSeries(series)} 
                                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSeries(series)} 
                                    role="button" 
                                    tabindex="0"
                                >
                                    {#if getSeriesIcon(series.type)}
                                        <img src={getSeriesIcon(series.type)} alt="" class="select-icon">
                                    {/if}
                                    <span>{series.title} <small>({series.start_date})</small></span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="form-group">
                <label for="shift-scope">How should we shift?</label>
                <div class="radio-group" id="shift-scope">
                    <label class="radio-label" class:selected={shiftScope === 'all'}>
                        <input type="radio" bind:group={shiftScope} value="all">
                        <span class="radio-custom"></span>
                        <div class="radio-text">
                            <strong>All Events</strong>
                            <span>Shift entire history</span>
                        </div>
                    </label>
                    <label class="radio-label" class:selected={shiftScope === 'future'}>
                        <input type="radio" bind:group={shiftScope} value="future">
                        <span class="radio-custom"></span>
                        <div class="radio-text">
                            <strong>From Date Forward</strong>
                            <span>Preserve past history</span>
                        </div>
                    </label>
                    <label class="radio-label" class:selected={shiftScope === 'single'}>
                        <input type="radio" bind:group={shiftScope} value="single">
                        <span class="radio-custom"></span>
                        <div class="radio-text">
                            <strong>Single Event</strong>
                            <span>Move just one instance</span>
                        </div>
                    </label>
                </div>
            </div>

            {#if shiftScope !== 'all'}
                <div class="form-group" transition:slide>
                    <label for="anchor-date">{shiftScope === 'future' ? 'Start shifting from:' : 'Which date to move?'}</label>
                    <div class="custom-select-container">
                        <div 
                            id="anchor-date"
                            class="select-selected" 
                            class:select-arrow-active={isDateDropdownOpen} 
                            on:click|stopPropagation={toggleDateDropdown} 
                            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDateDropdown()} 
                            role="button" 
                            tabindex="0"
                        >
                            {#if anchorDate}
                                <span>{formatDate(anchorDate)}</span>
                            {:else}
                                <span class="placeholder">-- Select Date --</span>
                            {/if}
                        </div>
                        
                        {#if isDateDropdownOpen}
                            <div class="select-items" transition:slide={{ duration: 200 }}>
                                {#each seriesDates as event}
                                    <div 
                                        class="select-option" 
                                        on:click={() => selectAnchorDate(event.start_date)} 
                                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectAnchorDate(event.start_date)} 
                                        role="button" 
                                        tabindex="0"
                                    >
                                        <span>{formatDate(event.start_date)}</span>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <div class="form-group">
                <label for="shift-days">Days to Shift (+/-)</label>
                <input type="number" id="shift-days" bind:value={shiftDays} placeholder="-7 or 7">
                <small style="color: var(--text-muted); display: block; margin-top: 5px;">Positive = Future, Negative = Past</small>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={close}>Cancel</button>
                <button 
                    class="calendar-btn primary-btn" 
                    on:click={handleShift} 
                    disabled={!selectedSeriesId || !shiftDays || (shiftScope !== 'all' && !anchorDate)}
                >
                    Shift Events
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .simple-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
    .simple-modal-content { background: var(--bg-secondary); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); width: 90%; max-width: 450px; }
    h3 { margin-top: 0; text-align: center; color: var(--text-primary); }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: var(--text-secondary); font-size: 0.9rem; }
    input { width: 100%; padding: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); }

    .custom-select-container { position: relative; width: 100%; }
    .select-selected { display: flex; align-items: center; justify-content: space-between; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; color: var(--text-primary); cursor: pointer; }
    .select-selected::after { content: ""; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); background-size: 1.2em; width: 1.2em; height: 1.2em; }
    .select-items { position: absolute; background: var(--bg-tertiary); top: calc(100% + 4px); left: 0; right: 0; z-index: 100; border: 1px solid var(--border-color); max-height: 200px; overflow-y: auto; border-radius: 6px; }
    .select-option { padding: 10px; cursor: pointer; display: flex; gap: 10px; align-items: center; color: var(--text-secondary); }
    .select-option:hover { background: var(--accent-blue-light); color: var(--text-primary); }
    .selected-content { display: flex; align-items: center; gap: 10px; }
    .select-icon { width: 20px; height: 20px; object-fit: contain; }

    .radio-group { display: flex; flex-direction: column; gap: 10px; }
    .radio-label { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .radio-label:hover { border-color: var(--accent-blue); }
    .radio-label.selected { background: rgba(59, 130, 246, 0.1); border-color: var(--accent-blue); }
    .radio-label input { display: none; }
    .radio-custom { width: 18px; height: 18px; border: 2px solid var(--text-muted); border-radius: 50%; position: relative; flex-shrink: 0; }
    .radio-label.selected .radio-custom { border-color: var(--accent-blue); }
    .radio-label.selected .radio-custom::after { content: ''; position: absolute; inset: 3px; background: var(--accent-blue); border-radius: 50%; }
    .radio-text { display: flex; flex-direction: column; }
    .radio-text strong { color: var(--text-primary); font-size: 0.95rem; }
    .radio-text span { color: var(--text-secondary); font-size: 0.8rem; }

    .simple-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .calendar-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .primary-btn { background: var(--accent-blue); color: white; }
    .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .secondary-btn { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
</style>