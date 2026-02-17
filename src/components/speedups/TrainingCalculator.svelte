<script>
    export let images = {};
    export let activeTab = 'troops';

    let trainingSpeed = '';
    let showTooltip = false;

    function switchTab(tab) {
        activeTab = tab;
    }

    function toggleTooltip() {
        showTooltip = !showTooltip;
    }
    function closeTooltip() {
        showTooltip = false;
    }

    import TroopsTab from './training/TroopsTab.svelte';
    import SpeedupsTab from './training/SpeedupsTab.svelte';
    import MgeTab from './training/MgeTab.svelte';
    import PreKvkTab from './training/PreKvkTab.svelte';
</script>

<svelte:window on:click={closeTooltip} />

<div class="calculator-island">
    <div class="island-content">
        <div class="generator-tabs">
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'troops'}
                on:click={() => switchTab('troops')}
            >
                Troops
            </button>
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'speedups'}
                on:click={() => switchTab('speedups')}
            >
                Speedups
            </button>
            <button class="generator-tab-btn" class:active={activeTab === 'mge'} on:click={() => switchTab('mge')}>
                MGE Points
            </button>
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'prekvk'}
                on:click={() => switchTab('prekvk')}
            >
                Pre-KvK
            </button>
        </div>

        <div class="form-group header-group">
            <label for="train-speed">Training Speed (%)</label>
            <div class="tooltip-wrapper">
                <button class="info-btn" on:click|stopPropagation={toggleTooltip} aria-label="Help" type="button">
                    <i class="fas fa-question-circle"></i>
                </button>
                {#if showTooltip}
                    <div
                        class="tooltip-container"
                        on:click|stopPropagation
                        on:keydown|stopPropagation
                        role="button"
                        tabindex="0"
                    >
                        <h4>Finding Training Speed</h4>
                        <p>1. Tap City Hall -> Stats</p>
                        <img src={images['buff_showcase1.webp']} alt="Step 1" class="tooltip-img square" />
                        <p>2. Scroll to "Training Speed"</p>
                        <img src={images['buff_showcase2.webp']} alt="Step 2" class="tooltip-img wide" />
                    </div>
                {/if}
            </div>
        </div>

        <div class="form-group" style="margin-top: -10px; margin-bottom: 25px;">
            <input type="number" id="train-speed" placeholder="Example: 95" bind:value={trainingSpeed} />
        </div>

        {#if activeTab === 'troops'}
            <TroopsTab {images} {trainingSpeed} />
        {:else if activeTab === 'speedups'}
            <SpeedupsTab {images} {trainingSpeed} />
        {:else if activeTab === 'mge'}
            <MgeTab {images} {trainingSpeed} />
        {:else if activeTab === 'prekvk'}
            <PreKvkTab {images} {trainingSpeed} />
        {/if}
    </div>
</div>

<style>
    .generator-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: var(--spacing-4);
    }
    .generator-tab-btn {
        flex: 1;
        padding: var(--spacing-3) 4px;
        cursor: pointer;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-weight: 600;
        position: relative;
        transition: color 0.2s ease;
        font-size: 0.95rem;
        white-space: nowrap;
    }
    .generator-tab-btn:hover {
        color: var(--text-primary);
    }
    .generator-tab-btn.active {
        color: var(--accent-blue);
    }
    .generator-tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-blue);
    }

    .header-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-2);
    }
    .header-group label {
        margin-bottom: 0;
    }
    .tooltip-wrapper {
        position: relative;
    }
    .info-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
    }
    .info-btn:hover {
        color: var(--accent-blue);
    }
    .tooltip-container {
        position: absolute;
        right: 0;
        top: 100%;
        margin-top: 10px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 15px;
        border-radius: var(--radius-md);
        width: 300px;
        z-index: 200;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    .tooltip-container h4 {
        margin: 0 0 10px 0;
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    .tooltip-container p {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin: 5px 0;
    }
    .tooltip-img {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .tooltip-img.square {
        aspect-ratio: 1/1;
        object-fit: cover;
    }
    .tooltip-img.wide {
        height: auto;
    }
</style>
