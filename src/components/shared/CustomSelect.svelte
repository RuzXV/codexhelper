<script>
    import { createEventDispatcher, tick } from 'svelte';

    const dispatch = createEventDispatcher();

    export let id = '';
    export let options = [];
    export let selected = null;
    export let placeholder = 'Select...';
    export let searchable = false;
    export let displayPrefix = '';

    let isOpen = false;
    let searchQuery = '';

    $: filteredOptions = searchQuery
        ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    $: displayLabel = getDisplayLabel(selected);

    function getDisplayLabel(val) {
        if (!val || val === 'none') return placeholder;
        const opt = options.find((o) => o.value === val);
        return opt ? `${displayPrefix}${opt.label}` : placeholder;
    }

    function toggle(event) {
        event.stopPropagation();
        searchQuery = '';
        isOpen = !isOpen;
        if (isOpen && searchable) {
            tick().then(() => {
                const input = document.getElementById(`search-${id}`);
                if (input) input.focus();
            });
        }
    }

    function select(value) {
        dispatch('change', { value });
        isOpen = false;
    }

    function handleWindowClick() {
        isOpen = false;
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="custom-select-container">
    <button class="custom-select-trigger" class:open={isOpen} on:click={toggle}>
        <span class="select-label" class:placeholder={!selected || selected === 'none'}>{displayLabel}</span>
        <i class="fas fa-chevron-down chevron" class:rotated={isOpen}></i>
    </button>
    {#if isOpen}
        <div class="custom-dropdown-menu" on:click|stopPropagation>
            {#if searchable}
                <input
                    id="search-{id}"
                    type="text"
                    class="dropdown-search"
                    placeholder="Search..."
                    bind:value={searchQuery}
                />
            {/if}
            <div class="dropdown-options">
                {#each filteredOptions as opt}
                    <button
                        class="dropdown-option"
                        class:selected={opt.value === selected}
                        on:click={() => select(opt.value)}
                    >
                        {#if opt.icon}
                            <i class={opt.icon}></i>
                        {/if}
                        <span>{displayPrefix}{opt.label}</span>
                    </button>
                {/each}
                {#if filteredOptions.length === 0}
                    <div class="dropdown-option empty">No results found</div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .custom-select-container {
        position: relative;
        width: 100%;
    }
    .custom-select-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all 0.2s ease;
        min-height: 38px;
    }
    .custom-select-trigger:hover {
        border-color: var(--border-hover);
    }
    .custom-select-trigger.open {
        border-color: var(--accent-blue);
    }
    .select-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .select-label.placeholder {
        color: var(--text-muted);
    }
    .chevron {
        font-size: 0.7em;
        opacity: 0.6;
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }
    .chevron.rotated {
        transform: rotate(180deg);
    }
    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 100;
        overflow: hidden;
    }
    .dropdown-search {
        width: 100%;
        padding: 8px 12px;
        background: var(--bg-tertiary);
        border: none;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        outline: none;
    }
    .dropdown-options {
        max-height: 200px;
        overflow-y: auto;
    }
    .dropdown-option {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 12px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        color: var(--text-secondary);
        cursor: pointer;
        text-align: left;
        font-size: var(--font-size-sm);
        transition: all 0.15s ease;
    }
    .dropdown-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    .dropdown-option.selected {
        color: var(--accent-blue);
        background: rgba(59, 130, 246, 0.1);
    }
    .dropdown-option:last-child {
        border-bottom: none;
    }
    .dropdown-option.empty {
        cursor: default;
        font-style: italic;
        text-align: center;
        justify-content: center;
        color: var(--text-muted);
    }
</style>
