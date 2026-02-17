<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let currentMode: 'single' | 'max' | 'remove';

    const dispatch = createEventDispatcher<{
        modeChange: { mode: 'single' | 'max' | 'remove' };
        clearRequest: void;
    }>();

    function setMode(mode: 'single' | 'max' | 'remove') {
        dispatch('modeChange', { mode });
    }

    function handleClear() {
        dispatch('clearRequest');
    }
</script>

<div class="mode-selector">
    <span class="mode-label">Mode:</span>
    <div class="mode-buttons">
        <button
            class="mode-btn single"
            class:active={currentMode === 'single'}
            on:click={() => setMode('single')}
            title="Add 1 level"
        >
            <i class="fas fa-plus"></i>
            <span>Single</span>
        </button>
        <button
            class="mode-btn max"
            class:active={currentMode === 'max'}
            on:click={() => setMode('max')}
            title="Max out tech"
        >
            <i class="fas fa-angles-up"></i>
            <span>Max</span>
        </button>
        <button
            class="mode-btn remove"
            class:active={currentMode === 'remove'}
            on:click={() => setMode('remove')}
            title="Remove 1 level"
        >
            <i class="fas fa-minus"></i>
            <span>Remove</span>
        </button>
        <button class="mode-btn clear" on:click={handleClear} title="Clear all progress">
            <i class="fas fa-trash"></i>
            <span>Clear</span>
        </button>
    </div>
</div>

<style>
    @import '../../../styles/tech-simulator-shared.css';
</style>
