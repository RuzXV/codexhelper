<script>
    import { createEventDispatcher } from 'svelte';
    import eventConfigs from '../../data/event_configs.json';
    import { getIconSrc } from './calendarIcons';
    export let isOpen = false;
    export let activeSeries = [];
    const dispatch = createEventDispatcher();

    let selectedSeriesId = '';
    let selectedSeriesTitle = '';
    let selectedSeriesIcon = null;
    let isDropdownOpen = false;
    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function selectSeries(series) {
        selectedSeriesId = series.id;
        selectedSeriesTitle = series.title;
        const config = eventConfigs.events[series.type];
        if (config && config.icon) {
            selectedSeriesIcon = getIconSrc(config.icon);
        } else {
            selectedSeriesIcon = null;
        }

        isDropdownOpen = false;
    }

    function handleRemove() {
        if (!selectedSeriesId) return;
        dispatch('remove', { seriesId: selectedSeriesId });
        close();
    }

    function close() {
        selectedSeriesId = '';
        selectedSeriesTitle = '';
        selectedSeriesIcon = null;
        isDropdownOpen = false;
        dispatch('close');
    }

    function handleOutsideClick(e) {
        if (isDropdownOpen && !e.target.closest('.custom-select-container')) {
            isDropdownOpen = false;
        }
    }

    function getSeriesIcon(type) {
        const config = eventConfigs.events[type];
        return config && config.icon ? getIconSrc(config.icon) : null;
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
            <h3 style="color: #ef4444;">Remove Event Series</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">
                Select an event to remove all future and past instances of it.
            </p>

            <div class="form-group">
                <label for="remove-select">Select Event Series</label>

                <div class="custom-select-container">
                    <div
                        class="select-selected"
                        class:select-arrow-active={isDropdownOpen}
                        on:click={toggleDropdown}
                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}
                        role="button"
                        tabindex="0"
                    >
                        {#if selectedSeriesId}
                            <div class="selected-content">
                                {#if selectedSeriesIcon}
                                    <img src={selectedSeriesIcon} alt="" class="select-icon" />
                                {/if}
                                <span
                                    >{selectedSeriesTitle}
                                    <span class="series-id">({selectedSeriesId.substring(0, 4)})</span></span
                                >
                            </div>
                        {:else}
                            <span class="placeholder">-- Choose Series --</span>
                        {/if}
                    </div>

                    {#if isDropdownOpen}
                        <div class="select-items">
                            {#each activeSeries as series}
                                <div
                                    class="select-option"
                                    on:click={() => selectSeries(series)}
                                    on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSeries(series)}
                                    role="button"
                                    tabindex="0"
                                >
                                    {#if getSeriesIcon(series.type)}
                                        <img src={getSeriesIcon(series.type)} alt="" class="select-icon" />
                                    {/if}
                                    <span
                                        >{series.title}
                                        <span class="series-id">({series.id.substring(0, 4)}...)</span></span
                                    >
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={close}>Cancel</button>
                <button class="calendar-btn danger-btn" on:click={handleRemove} disabled={!selectedSeriesId}
                    >Remove All</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .simple-modal-overlay {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    .simple-modal-content {
        background: var(--bg-secondary);
        padding: var(--spacing-6);
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        width: 90%;
        max-width: 400px;
        animation: zoomIn 0.2s ease-out forwards;
        transform: translateZ(0);
    }
    h3 {
        margin: 0 0 var(--spacing-4);
        color: var(--text-primary);
        font-size: 1.25rem;
        text-align: center;
    }
    .simple-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    .form-group {
        margin-bottom: 15px;
        text-align: left;
    }
    label {
        display: block;
        margin-bottom: 5px;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }

    .custom-select-container {
        position: relative;
        width: 100%;
        user-select: none;
    }

    .select-selected {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 10px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        justify-content: space-between;
    }

    .select-selected::after {
        content: '';
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        background-position: center;
        background-repeat: no-repeat;
        background-size: 1.2em 1.2em;
        width: 1.2em;
        height: 1.2em;
        transition: transform 0.3s ease;
        flex-shrink: 0;
    }

    .select-selected.select-arrow-active {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .select-selected.select-arrow-active::after {
        transform: rotate(180deg);
    }

    .select-items {
        position: absolute;
        background-color: var(--bg-tertiary);
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 1000;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        max-height: 250px;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .select-option {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--text-secondary);
        padding: 10px;
        cursor: pointer;
        transition: background 0.1s;
        font-size: 0.95rem;
    }
    .select-option:hover {
        background-color: var(--accent-blue-light);
        color: var(--text-primary);
    }

    .selected-content {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        overflow: hidden;
    }
    .placeholder {
        color: var(--text-muted);
    }
    .select-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
        flex-shrink: 0;
    }
    .series-id {
        font-size: 0.8em;
        color: var(--text-muted);
    }

    .calendar-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s;
    }
    .secondary-btn {
        background: transparent;
        color: var(--text-secondary);
        border-color: var(--border-color);
    }
    .secondary-btn:hover {
        color: var(--text-primary);
        border-color: var(--text-primary);
    }
    .danger-btn {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.5);
    }
    .danger-btn:hover {
        background: rgba(239, 68, 68, 0.4);
        color: white;
    }
    .danger-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @keyframes zoomIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
</style>
