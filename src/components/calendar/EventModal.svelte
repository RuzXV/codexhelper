<script>
    import { createEventDispatcher } from 'svelte';
    
    export let isOpen = false;
    export let eventConfigs = {};

    const dispatch = createEventDispatcher();

    let preset = '';
    let troopType = '';
    let startDate = new Date().toISOString().split('T')[0];
    let showTroopType = false;

    $: if (isOpen) {
        if (!startDate) startDate = new Date().toISOString().split('T')[0];
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
        dispatch('close');
    }
</script>

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
                    <select id="event-preset" bind:value={preset} on:change={handlePresetChange}>
                        <option value="">-- Select Event --</option>
                        {#each Object.entries(eventConfigs.events) as [key, data]}
                            <option value={key}>{data.title}</option>
                        {/each}
                    </select>
                </div>
            </div>

            {#if showTroopType}
                <div class="form-group">
                    <label for="troop-type">Starting Troop Type</label>
                    <div class="custom-select-wrapper">
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
    .simple-modal-overlay { position: fixed; inset: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
    .simple-modal-content { background: var(--bg-secondary); padding: var(--spacing-6); border-radius: var(--radius-lg); border: 1px solid var(--border-color); width: 90%; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: zoomIn 0.2s ease-out forwards; }
    h3 { margin: 0 0 var(--spacing-6); color: var(--text-primary); font-size: 1.25rem; text-align: center; }
    .simple-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .form-group { margin-bottom: 15px; text-align: left; }
    label { display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.9rem; }
    input, select { width: 100%; padding: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 1rem; }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    
    .calendar-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .secondary-btn { background: transparent; color: var(--text-secondary); border-color: var(--border-color); }
    .secondary-btn:hover { color: var(--text-primary); border-color: var(--text-primary); }
    .primary-btn { background: var(--accent-blue); color: white; }
    .primary-btn:hover { background: var(--accent-blue-hover); }
    .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>