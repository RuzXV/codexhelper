<script>
    import { createEventDispatcher, tick } from 'svelte';

    const dispatch = createEventDispatcher();

    export let commanders = [];
    export let selected = null;
    export let placeholder = 'Select...';
    export let id = '';
    export let openDropdownId = null;

    let dropdownSearch = '';

    $: isOpen = openDropdownId === id;
    $: filteredCommanders = commanders.filter((c) =>
        c.name.toLowerCase().includes(dropdownSearch.toLowerCase()),
    );

    function getCmdIcon(key) {
        const c = commanders.find((e) => e.key === key);
        return c ? `https://cdn.discordapp.com/emojis/${c.emoji}.png` : null;
    }

    function getCmdName(key) {
        const c = commanders.find((e) => e.key === key);
        return c ? c.name : placeholder;
    }

    function toggleDropdown(event) {
        event.stopPropagation();
        dropdownSearch = '';
        if (isOpen) {
            dispatch('dropdown', { id: null });
        } else {
            dispatch('dropdown', { id });
            setTimeout(() => {
                const input = document.querySelector(`#cmd-search-${id}`);
                if (input) input.focus();
            }, 50);
        }
    }

    function handleSearchClick(event) {
        event.stopPropagation();
    }

    function handleKeyEnter(event, callback) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback(event);
        }
    }

    function selectCommander(key) {
        dispatch('change', { value: key });
        dispatch('dropdown', { id: null });
    }
</script>

<div class="custom-select">
    <div
        class="select-trigger"
        role="button"
        tabindex="0"
        on:keydown={(e) => handleKeyEnter(e, toggleDropdown)}
        on:click={toggleDropdown}
    >
        {#if selected}
            <div class="trigger-content">
                <img src={getCmdIcon(selected)} alt="" class="select-icon" />
                <span>{getCmdName(selected)}</span>
            </div>
        {:else}
            <span class="placeholder">{placeholder}</span>
        {/if}
    </div>

    {#if isOpen}
        <div class="select-options">
            <div
                class="search-container"
                role="button"
                tabindex="0"
                on:click={handleSearchClick}
                on:keydown={handleSearchClick}
            >
                <input
                    id="cmd-search-{id}"
                    type="text"
                    class="dropdown-search-input"
                    placeholder="Search..."
                    bind:value={dropdownSearch}
                    on:keydown|stopPropagation
                />
            </div>

            {#each filteredCommanders as c}
                <div
                    class="option"
                    role="button"
                    tabindex="0"
                    on:keydown|stopPropagation={(e) =>
                        handleKeyEnter(e, () => selectCommander(c.key))}
                    on:click|stopPropagation={() => selectCommander(c.key)}
                >
                    <img
                        src={`https://cdn.discordapp.com/emojis/${c.emoji}.png`}
                        alt=""
                        class="select-icon"
                    />
                    {c.name}
                </div>
            {/each}

            {#if filteredCommanders.length === 0}
                <div class="option disabled" style="opacity: 0.5; cursor: default;">
                    No results
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .custom-select {
        position: relative;
        flex: 1;
        min-width: 0;
    }
    .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 6px 10px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    .select-trigger:focus {
        border-color: var(--accent-blue);
        outline: none;
    }
    .select-options {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 50;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        margin-top: 4px;
    }
    .option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    .option:hover,
    .option:focus {
        background: var(--accent-blue-light);
        color: white;
        outline: none;
    }
    .select-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
    }
    .trigger-content {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
        white-space: nowrap;
    }
    .placeholder {
        color: var(--text-muted);
        font-size: 0.85rem;
    }
    .search-container {
        padding: 8px;
        background: var(--bg-secondary);
        position: sticky;
        top: 0;
        z-index: 10;
        border-bottom: 1px solid var(--border-color);
    }
    .dropdown-search-input {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 6px 8px;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.85rem;
    }
    .dropdown-search-input:focus {
        outline: none;
        border-color: var(--accent-blue);
    }
</style>
