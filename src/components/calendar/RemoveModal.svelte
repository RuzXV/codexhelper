<script>
    import { createEventDispatcher } from 'svelte';
    
    export let isOpen = false;
    export let activeSeries = [];
    
    const dispatch = createEventDispatcher();
    let selectedSeriesId = '';

    function handleRemove() {
        if (!selectedSeriesId) return;
        dispatch('remove', { seriesId: selectedSeriesId });
        close();
    }

    function close() {
        selectedSeriesId = '';
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
            <h3 style="color: #ef4444;">Remove Event Series</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">Select an event to remove all future and past instances of it.</p>
            
            <div class="form-group">
                <label for="remove-select">Select Event Series</label>
                <select id="remove-select" bind:value={selectedSeriesId}>
                    <option value="">-- Choose Series --</option>
                    {#each activeSeries as series}
                        <option value={series.id}>{series.title} (ID: {series.id.substring(0,4)}...)</option>
                    {/each}
                </select>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={close}>Cancel</button>
                <button class="calendar-btn danger-btn" on:click={handleRemove} disabled={!selectedSeriesId}>Remove All</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .simple-modal-overlay { position: fixed; inset: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
    .simple-modal-content { background: var(--bg-secondary); padding: var(--spacing-6); border-radius: var(--radius-lg); border: 1px solid var(--border-color); width: 90%; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); animation: zoomIn 0.2s ease-out forwards; }
    h3 { margin: 0 0 var(--spacing-4); color: var(--text-primary); font-size: 1.25rem; text-align: center; }
    .simple-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    .form-group { margin-bottom: 15px; text-align: left; }
    label { display: block; margin-bottom: 5px; color: var(--text-secondary); font-size: 0.9rem; }
    
    select { width: 100%; padding: 10px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); font-size: 1rem; }
    
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    
    .calendar-btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .secondary-btn { background: transparent; color: var(--text-secondary); border-color: var(--border-color); }
    .secondary-btn:hover { color: var(--text-primary); border-color: var(--text-primary); }
    .danger-btn { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.5); }
    .danger-btn:hover { background: rgba(239, 68, 68, 0.4); color: white; }
    .danger-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>