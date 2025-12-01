<script>
    import TrainingCalculator from './TrainingCalculator.svelte';
    import HealingCalculator from './HealingCalc.svelte';
    
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
</style>