<script>
    import TrainingCalculator from './TrainingCalculator.svelte';
    import HealingCalculator from './HealingCalculator.svelte';
    
    export let images = {};
    let activeTool = 'training';
</script>

<div class="speedups-hub">
    <div class="hub-tabs">
        <button 
            class="hub-tab-btn" 
            class:active={activeTool === 'training'} 
            on:click={() => activeTool = 'training'}
        >
            <img src={images['training_speedup.webp']} alt="" class="tab-icon"/>
            <span>Training</span>
        </button>
        <button 
            class="hub-tab-btn" 
            class:active={activeTool === 'healing'} 
            on:click={() => activeTool = 'healing'}
        >
            <img src={images['healing_speedup.webp']} alt="" class="tab-icon" on:error={(e) => e.target.src = images['training_speedup.webp']}/>
            <span>Healing</span>
        </button>
    </div>

    <div class="calculator-island">
        {#if activeTool === 'training'}
            <div class="tool-view fade-in">
                <TrainingCalculator {images} /> 
            </div>
        {:else}
            <div class="tool-view fade-in">
                <HealingCalculator {images} />
            </div>
        {/if}
    </div>
</div>

<style>
    .speedups-hub {
        max-width: 850px;
        margin: 0 auto;
        width: 100%;
    }

    .hub-tabs {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 25px;
    }

    .hub-tab-btn {
        background: rgba(20, 21, 24, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 30px;
        border-radius: 12px;
        color: var(--text-secondary);
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s ease;
        font-size: 1rem;
    }

    .hub-tab-btn:hover {
        background: var(--bg-tertiary);
        border-color: var(--border-hover);
        transform: translateY(-2px);
    }

    .hub-tab-btn.active {
        background: var(--accent-blue-light);
        border-color: var(--accent-blue);
        color: white;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
    }

    .tab-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
    }

    .calculator-island { 
        background: rgba(20, 21, 24, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.1); 
        border-radius: var(--radius-lg); 
        padding: var(--spacing-6); 
        width: 100%; 
        position: relative;
    }

    :global(.speedups-hub .calculator-island .calculator-island) {
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        min-height: auto;
    }

    .fade-in {
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 600px) {
        .hub-tab-btn {
            padding: 10px 15px;
            font-size: 0.9rem;
            flex: 1;
            justify-content: center;
        }
        .calculator-island {
            padding: var(--spacing-4);
        }
    }

    .speedups-hub :global(.troop-grid) { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 4px; 
        position: relative; 
        padding: 4px; 
        border-radius: var(--radius-lg); 
        margin-bottom: 5px; 
    }

    .speedups-hub :global(.troop-grid::after) { 
        content: ''; 
        position: absolute; 
        inset: 0; 
        border-radius: inherit; 
        z-index: 0; 
        opacity: 0.35; 
        pointer-events: none; 
    }
    .speedups-hub :global(.troop-grid.t4-group::after) { background-image: radial-gradient(circle, #ca62e6 0%, #8113a7 100%); }
    .speedups-hub :global(.troop-grid.t5-group::after) { background-image: radial-gradient(circle, #f28d00 0%, #d55800 100%); }
    .speedups-hub :global(.troop-grid.upgrade-group::after) { background: linear-gradient(135deg, #ca62e6 0%, #8113a7 45%, #f28d00 55%, #d55800 100%); opacity: 0.25; }

    .speedups-hub :global(.troop-item) { 
        background: var(--bg-tertiary); 
        border: 1px solid var(--border-hover); 
        border-radius: var(--radius-md); 
        padding: var(--spacing-2); 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: var(--spacing-2); 
        position: relative; 
        z-index: 1; 
    }
    .speedups-hub :global(.troop-item label) { 
        font-size: 0.75rem; 
        margin: 0; 
        font-weight: 500; 
        color: var(--text-secondary); 
    }
    .speedups-hub :global(.troop-item img) { 
        width: 32px; 
        height: 32px; 
        object-fit: contain; 
    }
    .speedups-hub :global(.troop-item input) { 
        width: 100%; 
        text-align: center; 
        padding: 4px; 
        font-size: 1rem; 
        border: 1px solid var(--border-color); 
        background: var(--bg-primary); 
        border-radius: var(--radius-sm); 
        color: white; 
    }
    .speedups-hub :global(.troop-item input:focus) { 
        border-color: var(--accent-blue); 
        outline: none; 
    }

    .speedups-hub :global(.res-grid) { 
        display: flex; 
        gap: 15px; 
        flex-wrap: wrap; 
        justify-content: center; 
        width: 100%; 
    }
    .speedups-hub :global(.res-grid .cost-line) { 
        display: flex; 
        align-items: center; 
        gap: 5px; 
        font-size: 1rem; 
        color: white; 
    }
    .speedups-hub :global(.res-grid .cost-line img) { 
        height: 24px; 
    }

    .speedups-hub :global(.calc-result) { 
        min-height: 140px; 
        position: relative; 
        background: var(--bg-secondary); 
        border-radius: var(--radius-md); 
        border: 1px solid var(--border-color); 
    }
    .speedups-hub :global(.calc-result.result-success::after) { 
        content: ''; 
        position: absolute; 
        inset: 0; 
        border-radius: inherit; 
        border: 2px solid transparent; 
        animation: global-glow-border 1.2s ease-out; 
    }

    .speedups-hub :global(.tooltip-wrapper) { 
        position: relative; 
        display: flex; 
        align-items: center; 
    }
    .speedups-hub :global(.info-btn) { 
        background: none; 
        border: none; 
        color: var(--text-secondary); 
        font-size: 1rem; 
        cursor: pointer; 
        padding: 0; 
        display: flex; 
        align-items: center; 
        transition: color 0.2s; 
    }
    .speedups-hub :global(.info-btn:hover) { 
        color: var(--accent-blue); 
    }
    
    .speedups-hub :global(.tooltip-container) { 
        position: absolute; 
        left: 0; 
        top: 100%; 
        margin-top: 10px; 
        background: var(--bg-tertiary); 
        border: 1px solid var(--border-color); 
        padding: 15px; 
        border-radius: var(--radius-md); 
        width: 250px; 
        z-index: 200; 
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6); 
        text-align: left; 
    }
    .speedups-hub :global(.tooltip-container h4) { 
        margin: 0 0 10px 0; 
        color: var(--text-primary); 
        font-size: 0.9rem; 
    }
    .speedups-hub :global(.tooltip-container p) { 
        font-size: 0.8rem; 
        color: var(--text-secondary); 
        margin: 5px 0; 
    }
    .speedups-hub :global(.tooltip-img) { 
        width: 100%; 
        border-radius: 4px; 
        margin-bottom: 10px; 
        border: 1px solid rgba(255,255,255,0.1); 
    }
    .speedups-hub :global(.tooltip-img.square) { aspect-ratio: 1/1; object-fit: cover; }
    .speedups-hub :global(.tooltip-img.wide) { height: auto; }

    .speedups-hub :global(.header-group) { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: var(--spacing-2); 
    }
    .speedups-hub :global(.header-group.compact) { 
        justify-content: flex-start; 
        gap: 5px; 
    }
    .speedups-hub :global(.header-group label) { 
        margin-bottom: 0; 
        font-size: 0.95rem; 
        white-space: nowrap; 
    }

    .speedups-hub :global(.buff-inputs-grid) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }
    .speedups-hub :global(.buff-inputs-grid input) {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px;
        color: var(--text-primary);
        text-align: center;
    }

    .speedups-hub :global(.ratio-selector) { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 8px; 
    }
    .speedups-hub :global(.ratio-btn) {
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px 4px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.2s;
    }
    .speedups-hub :global(.ratio-btn:hover) { 
        border-color: var(--accent-blue); 
        background: var(--bg-tertiary); 
    }
    .speedups-hub :global(.ratio-btn.active) {
        background: var(--accent-blue-light);
        border-color: var(--accent-blue);
    }
    .speedups-hub :global(.ratio-val) { font-weight: 700; color: white; font-size: 0.9rem; }
    .speedups-hub :global(.ratio-lbl) { font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px; text-align: center; white-space: nowrap; }
    .speedups-hub :global(.ratio-btn.active .ratio-val), 
    .speedups-hub :global(.ratio-btn.active .ratio-lbl) { color: white; }

    @keyframes global-glow-border { 
        0% { border-color: transparent; box-shadow: 0 0 0 0 transparent; } 
        25% { border-color: var(--accent-green); box-shadow: 0 0 15px 0 var(--accent-green); } 
        100% { border-color: transparent; box-shadow: 0 0 15px 0 transparent; } 
    }

    @media (max-width: 600px) {
        .speedups-hub :global(.troop-grid) { grid-template-columns: repeat(2, 1fr); }
        .speedups-hub :global(.res-grid) { gap: 10px; }
        .speedups-hub :global(.res-grid .cost-line) { font-size: 0.9rem; }
        .speedups-hub :global(.res-grid .cost-line img) { height: 20px; }
        .speedups-hub :global(.buff-inputs-grid) { grid-template-columns: 1fr; }
        .speedups-hub :global(.ratio-selector) { grid-template-columns: repeat(2, 1fr); }
    }
</style>