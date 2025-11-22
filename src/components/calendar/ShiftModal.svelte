<script>
    import { createEventDispatcher } from 'svelte';
    
    export let isOpen = false;
    export let activeSeries = [];
    
    const dispatch = createEventDispatcher();
    let shiftDays = '';
    let selectedSeriesId = '';

    function handleShift() {
        const days = parseInt(shiftDays);
        if (!selectedSeriesId || isNaN(days) || days === 0) return;
        dispatch('shift', { seriesId: selectedSeriesId, shiftDays: days });
        close();
    }

    function close() {
        shiftDays = '';
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
            <h3>Shift Event Series</h3>
            
            <div class="form-group">
                <label for="series-select">Select Event Series</label>
                <select id="series-select" bind:value={selectedSeriesId}>
                    <option value="">-- Choose Series --</option>
                    {#each activeSeries as series}
                        <option value={series.id}>{series.title} (ID: {series.id.substring(0,4)}...)</option>
                    {/each}
                </select>
            </div>

            <div class="form-group">
                <label for="shift-days">Days to Shift (+/-)</label>
                <input type="number" id="shift-days" bind:value={shiftDays} placeholder="-7 or 7">
                <small style="color: var(--text-muted); display: block; margin-top: 5px;">Positive = Future, Negative = Past</small>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={close}>Cancel</button>
                <button class="calendar-btn primary-btn" on:click={handleShift} disabled={!selectedSeriesId || !shiftDays}>Shift</button>
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