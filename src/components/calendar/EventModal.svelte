<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    
    export let isOpen = false;
    export let eventConfigs = {};
    const dispatch = createEventDispatcher();

    const iconModules = import.meta.glob('../../assets/images/calendar/event_icons/*.{png,jpg,jpeg,webp,svg}', { eager: true });
    
    function getIconSrc(filename) {
        if (!filename) return null;
        const path = `../../assets/images/calendar/event_icons/${filename}`;
        return iconModules[path]?.default?.src || iconModules[path]?.default || null;
    }

    let preset = '';
    let troopType = '';
    let startDate = new Date().toISOString().split('T')[0];
    let showTroopType = false;
    
    let isDropdownOpen = false;

    $: if (isOpen) {
        if (!startDate) startDate = new Date().toISOString().split('T')[0];
        isDropdownOpen = false; 
    }

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function selectPreset(key) {
        preset = key;
        isDropdownOpen = false;
        handlePresetChange();
    }

    function handlePresetChange() {
        if (!preset || !eventConfigs.events[preset]) return;
        const data = eventConfigs.events[preset];
        showTroopType = data.has_troop_type;
        if (!showTroopType) troopType = '';
    }

    function handleSave() {
        if (!preset) return;
        dispatch('save', {
            preset,
            troop_type: troopType || null,
            start: startDate
        });
        close();
    }

    function close() {
        isDropdownOpen = false;
        dispatch('close');
    }

    function handleOutsideClick(e) {
        if (isDropdownOpen && !e.target.closest('.custom-select-wrapper')) {
            isDropdownOpen = false;
        }
    }
</script>

<svelte:window on:click={handleOutsideClick} />

{#if isOpen}
    <div 
        class="simple-modal-overlay" 
        role="button" 
        tabindex="0" 
        on:click|self={close} 
        on:keydown={(e) => e.key === 'Escape' && close()}
    >
        <div class="simple-modal-content">
            <h3>Add Event Series</h3>
            
            <div class="form-group">
                <label for="event-preset">Event Type</label>
                <div class="custom-select-wrapper">
                    <div 
                        class="custom-select-trigger" 
                        class:active={isDropdownOpen} 
                        on:click={toggleDropdown}
                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}
                        role="button"
                        tabindex="0"
                    >
                        {#if preset && eventConfigs.events[preset]}
                            <div class="selected-value">
                                {#if eventConfigs.events[preset].icon}
                                    <img src={getIconSrc(eventConfigs.events[preset].icon)} alt="" class="select-icon">
                                {/if}
                                <span>{eventConfigs.events[preset].title}</span>
                            </div>
                        {:else}
                            <span class="placeholder">-- Select Event --</span>
                        {/if}
                        <i class="fas fa-chevron-down chevron" class:rotate={isDropdownOpen}></i>
                    </div>

                    {#if isDropdownOpen}
                        <div class="custom-options" transition:slide={{ duration: 200 }}>
                            {#each Object.entries(eventConfigs.events) as [key, data]}
                                <button 
                                    class="custom-option" 
                                    on:click={() => selectPreset(key)}
                                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPreset(key)}
                                    type="button"
                                >
                                    {#if data.icon}
                                        <img src={getIconSrc(data.icon)} alt="" class="select-icon">
                                    {/if}
                                    <span>{data.title}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            {#if showTroopType}
                <div class="form-group">
                    <label for="troop-type">Starting Troop Type</label>
                    <div class="standard-select-wrapper">
                         <select id="troop-type" bind:value={troopType}>
                            <option value="">Select Troop...</option>
                            {#each eventConfigs.troop_types as type}
                                <option value={type}>{type}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            {/if}

            <div class="form-group">
                <label for="event-start">Start Date (UTC)</label>
                <input type="date" id="event-start" bind:value={startDate}>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={close}>Cancel</button>
                <button class="calendar-btn primary-btn" on:click={handleSave} disabled={!preset}>Generate Events</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .simple-modal-overlay { 
        position: fixed; inset: 0; width: 100%; height: 100%; 
        background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; 
        z-index: 9999; backdrop-filter: blur(5px); 
    }
    .simple-modal-content { 
        background: var(--bg-secondary); padding: var(--spacing-6); 
        border-radius: var(--radius-lg); border: 1px solid var(--border-color); 
        width: 90%; max-width: 400px; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.5); 
        animation: zoomIn 0.2s ease-out forwards;
    }
    h3 { 
        margin: 0 0 var(--spacing-6); color: var(--text-primary); 
        font-size: 1.25rem; text-align: center; 
    }
    .simple-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .form-group { margin-bottom: 15px; text-align: left; }
    label { display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.9rem; }
    
    input, select { 
        width: 100%; padding: 10px; background: var(--bg-primary);
        border: 1px solid var(--border-color); border-radius: 6px; 
        color: var(--text-primary); font-size: 1rem;
    }

    .custom-select-wrapper { position: relative; width: 100%; }
    
    .custom-select-trigger {
        width: 100%; padding: 10px; 
        background: var(--bg-primary);
        border: 1px solid var(--border-color); 
        border-radius: 6px; 
        color: var(--text-primary); 
        font-size: 1rem;
        cursor: pointer;
        display: flex; justify-content: space-between; align-items: center;
        transition: all 0.2s;
    }
    .custom-select-trigger:hover { border-color: var(--text-secondary); }
    .custom-select-trigger.active { border-color: var(--accent-blue); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    
    .selected-value { display: flex; align-items: center; gap: 10px; }
    .placeholder { color: var(--text-muted); }
    
    .select-icon { width: 20px; height: 20px; object-fit: contain; }
    
    .chevron { font-size: 0.8em; color: var(--text-secondary); transition: transform 0.2s; }
    .chevron.rotate { transform: rotate(180deg); }

    .custom-options {
        position: absolute; top: 105%; left: 0; right: 0;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        max-height: 250px; overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    
    .custom-option {
        padding: 10px; display: flex; align-items: center; gap: 10px;
        cursor: pointer; transition: background 0.1s;
    }
    .custom-option:hover { background: var(--bg-primary); color: white; }
    
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    
    .calendar-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .secondary-btn { background: transparent; color: var(--text-secondary); border-color: var(--border-color); }
    .secondary-btn:hover { color: var(--text-primary); border-color: var(--text-primary); }
    .primary-btn { background: var(--accent-blue); color: white; }
    .primary-btn:hover { background: var(--accent-blue-hover); }
    .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>