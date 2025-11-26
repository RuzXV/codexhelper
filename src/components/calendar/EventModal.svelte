<script>
    import { createEventDispatcher } from 'svelte';
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
        if (isDropdownOpen && !e.target.closest('.custom-select-container')) {
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
                
                <div class="custom-select-container">
                    <div 
                        class="select-selected" 
                        class:select-arrow-active={isDropdownOpen} 
                        on:click={toggleDropdown}
                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}
                        role="button"
                        tabindex="0"
                    >
                        {#if preset && eventConfigs.events[preset]}
                            <div class="selected-content">
                                {#if eventConfigs.events[preset].icon}
                                    <img src={getIconSrc(eventConfigs.events[preset].icon)} alt="" class="select-icon">
                                {/if}
                                <span>{eventConfigs.events[preset].title}</span>
                            </div>
                        {:else}
                            <span class="placeholder">-- Select Event --</span>
                        {/if}
                    </div>

                    {#if isDropdownOpen}
                        <div class="select-items">
                            {#each Object.entries(eventConfigs.events) as [key, data]}
                                <div 
                                    class="select-option" 
                                    on:click={() => selectPreset(key)}
                                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPreset(key)}
                                    role="button"
                                    tabindex="0"
                                >
                                    {#if data.icon}
                                        <img src={getIconSrc(data.icon)} alt="" class="select-icon">
                                    {/if}
                                    <span>{data.title}</span>
                                </div>
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
        position: fixed;
        inset: 0; width: 100%; height: 100%; 
        background: rgba(0, 0, 0, 0.85);
        display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .simple-modal-content { 
        background: var(--bg-secondary); padding: var(--spacing-6); 
        border-radius: var(--radius-lg); border: 1px solid var(--border-color); width: 90%;
        max-width: 400px; 
        animation: zoomIn 0.2s ease-out forwards;
        transform: translateZ(0);
    }
    h3 { margin: 0 0 var(--spacing-6); color: var(--text-primary);
        font-size: 1.25rem; text-align: center; }
    .simple-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;
    }
    .form-group { margin-bottom: 15px; text-align: left; }
    label { display: block; margin-bottom: 5px;
        color: var(--text-secondary); font-size: 0.9rem; }
    input, select { width: 100%; padding: 10px; background: var(--bg-primary);
        border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 1rem; }

    .custom-select-container { position: relative; width: 100%;
        user-select: none; }
    
    .select-selected {
        display: flex;
        align-items: center; gap: var(--spacing-3);
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 10px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        justify-content: space-between;
    }
    
    .select-selected::after {
        content: "";
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 1.2em 1.2em;
        width: 1.2em; height: 1.2em;
        transition: transform 0.3s ease;
        flex-shrink: 0;
    }
    
    .select-selected.select-arrow-active { border-color: var(--accent-blue);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
    .select-selected.select-arrow-active::after { transform: rotate(180deg);
    }

    .select-items {
        position: absolute;
        background-color: var(--bg-tertiary);
        top: calc(100% + 4px); left: 0; right: 0;
        z-index: 1000;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        max-height: 250px;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }

    .select-option {
        display: flex;
        align-items: center; gap: 10px;
        color: var(--text-secondary);
        padding: 10px;
        cursor: pointer;
        transition: background 0.1s;
        font-size: 0.95rem;
    }
    .select-option:hover { background-color: var(--accent-blue-light); color: var(--text-primary);
    }
    
    .selected-content { display: flex; align-items: center; gap: 10px; width: 100%; overflow: hidden;
    }
    .placeholder { color: var(--text-muted); }
    .select-icon { width: 24px; height: 24px; object-fit: contain;
        flex-shrink: 0; }

    .calendar-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;
        border: 1px solid transparent; transition: all 0.2s; }
    .secondary-btn { background: transparent; color: var(--text-secondary); border-color: var(--border-color);
    }
    .secondary-btn:hover { color: var(--text-primary); border-color: var(--text-primary); }
    .primary-btn { background: var(--accent-blue); color: white;
    }
    .primary-btn:hover { background: var(--accent-blue-hover); }
    .primary-btn:disabled { opacity: 0.5; cursor: not-allowed;
    }
    
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95);
    } to { opacity: 1; transform: scale(1); } }
</style>