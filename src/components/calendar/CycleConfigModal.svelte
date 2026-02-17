<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { getIconSrc } from './calendarIcons';
    export let isOpen = false;
    export let eggEvents = [];

    $: eventType = eggEvents && eggEvents.length > 0 ? eggEvents[0].type : null;

    $: currentIcon =
        eventType === 'holy_knights_treasure'
            ? 'egg.webp'
            : eventType === 'hunt_for_history'
              ? 'hammer.webp'
              : eventType === 'egg_hammer'
                ? 'egg_hammer.webp'
                : null;

    const dispatch = createEventDispatcher();

    const CYCLES = [
        { id: 0, label: 'Helmet / Pants' },
        { id: 1, label: 'Weapon / Accessory' },
        { id: 2, label: 'Chest / Gloves / Boots' },
    ];

    let selectedEventDate = '';
    let selectedCycleId = 0;
    let isDropdownOpen = false;

    $: formattedOptions = eggEvents.map((event) => ({
        originalDate: event.start_date,
        displayLabel: new Date(event.start_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
        }),
    }));

    $: selectedDateLabel = selectedEventDate
        ? new Date(selectedEventDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
          })
        : '';

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
    }

    function selectDate(date) {
        selectedEventDate = date;
        isDropdownOpen = false;
    }

    function handleOutsideClick(e) {
        if (isDropdownOpen && !e.target.closest('.custom-select-container')) {
            isDropdownOpen = false;
        }
    }

    function handleSave() {
        if (!selectedEventDate) return;
        dispatch('save', {
            anchorDate: selectedEventDate,
            anchorCycleId: selectedCycleId,
        });
        dispatch('close');
    }
</script>

<svelte:window on:click={handleOutsideClick} />

{#if isOpen}
    <div
        class="simple-modal-overlay"
        role="button"
        tabindex="0"
        on:click|self={() => dispatch('close')}
        on:keydown|self={(e) => e.key === 'Enter' && dispatch('close')}
    >
        <div class="simple-modal-content">
            <h3 class="modal-header-with-icon">
                {#if currentIcon}
                    <img src={getIconSrc(currentIcon)} alt="" class="header-icon" />
                {/if}
                Configure {eventType === 'hunt_for_history'
                    ? 'Hammer'
                    : eventType === 'egg_hammer'
                      ? 'Egg / Hammer'
                      : 'Egg'} Rotation
            </h3>
            <p class="desc">
                Select a specific "Holy Knight's Treasure" event date you know, and tell us which gear rotation it was.
                We will calculate the rest.
            </p>

            <div class="form-group">
                <label for="anchor-date">Select Event Date</label>

                <div class="custom-select-container">
                    <div
                        class="select-selected"
                        class:select-arrow-active={isDropdownOpen}
                        on:click={toggleDropdown}
                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleDropdown()}
                        role="button"
                        tabindex="0"
                    >
                        {#if selectedEventDate}
                            <span>{selectedDateLabel} (Starting Date)</span>
                        {:else}
                            <span class="placeholder">-- Choose a Date --</span>
                        {/if}
                    </div>

                    {#if isDropdownOpen}
                        <div class="select-items" transition:slide={{ duration: 200 }}>
                            {#each formattedOptions as option}
                                <div
                                    class="select-option"
                                    on:click={() => selectDate(option.originalDate)}
                                    on:keydown={(e) =>
                                        (e.key === 'Enter' || e.key === ' ') && selectDate(option.originalDate)}
                                    role="button"
                                    tabindex="0"
                                >
                                    <span>{option.displayLabel}</span>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="form-group">
                <label for="cycle-type">What rotation was it?</label>
                <div class="cycle-options">
                    {#each CYCLES as cycle}
                        <label class="radio-label" class:selected={selectedCycleId === cycle.id}>
                            <input type="radio" name="cycle" value={cycle.id} bind:group={selectedCycleId} />
                            <span class="radio-custom"></span>
                            {cycle.label}
                        </label>
                    {/each}
                </div>
            </div>

            <div class="simple-modal-actions">
                <button class="calendar-btn secondary-btn" on:click={() => dispatch('close')}>Cancel</button>
                <button class="calendar-btn primary-btn" on:click={handleSave} disabled={!selectedEventDate}
                    >Save Configuration</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .simple-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    .simple-modal-content {
        background: var(--bg-secondary);
        padding: 24px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        width: 90%;
        max-width: 450px;
        transform: translateZ(0);
    }
    h3 {
        margin-top: 0;
        text-align: center;
        color: var(--text-primary);
    }
    .desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-bottom: 20px;
        text-align: center;
    }

    .form-group {
        margin-bottom: 20px;
    }
    label {
        display: block;
        margin-bottom: 8px;
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
        justify-content: space-between;
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
        padding: 10px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: background 0.1s;
        font-size: 0.95rem;
    }
    .select-option:hover {
        background-color: var(--accent-blue-light);
        color: var(--text-primary);
    }
    .placeholder {
        color: var(--text-muted);
    }

    .cycle-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .radio-label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .radio-label:hover {
        border-color: var(--accent-blue);
    }
    .radio-label.selected {
        background: rgba(59, 130, 246, 0.1);
        border-color: var(--accent-blue);
    }
    .radio-label input {
        display: none;
    }
    .radio-custom {
        width: 16px;
        height: 16px;
        border: 2px solid var(--text-muted);
        border-radius: 50%;
        position: relative;
    }
    .radio-label.selected .radio-custom {
        border-color: var(--accent-blue);
    }
    .radio-label.selected .radio-custom::after {
        content: '';
        position: absolute;
        inset: 2px;
        background: var(--accent-blue);
        border-radius: 50%;
    }

    .simple-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
    }
    .calendar-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
    }
    .primary-btn {
        background: var(--accent-blue);
        color: white;
    }
    .secondary-btn {
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
    }

    .modal-header-with-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .header-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
    }
</style>
