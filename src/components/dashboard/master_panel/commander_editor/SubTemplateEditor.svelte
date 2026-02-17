<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let recAccessories = [null, null];
    export let optAccessories = [];
    export let formations = [];
    export let accessoriesList = [];
    export let formationsList = [];
    export let openDropdownId = null;

    let dropdownSearch = '';

    function getAccessoryIcon(key) {
        const a = accessoriesList.find((i) => i.key === key);
        return a ? `https://cdn.discordapp.com/emojis/${a.emoji}.png` : '';
    }
    function getAccessoryName(key) {
        const a = accessoriesList.find((i) => i.key === key);
        return a ? a.name : 'Select Accessory';
    }
    function getFormationIcon(key) {
        const f = formationsList.find((i) => i.key === key);
        return f ? `https://cdn.discordapp.com/emojis/${f.emoji}.png` : '';
    }
    function getFormationName(key) {
        const f = formationsList.find((i) => i.key === key);
        return f ? f.name : 'Select Formation';
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = '';
        if (openDropdownId === id) {
            dispatch('dropdown', { id: null });
        } else {
            dispatch('dropdown', { id });
            setTimeout(() => {
                const input = document.querySelector('.dropdown-search-input');
                if (input) input.focus();
            }, 50);
        }
    }

    function handleSearchClick(event) {
        event.stopPropagation();
    }

    function handleKeyEnter(event, callback) {
        if (event.key === 'Enter') {
            event.preventDefault();
            callback(event);
        }
    }

    function notifyChange() {
        dispatch('change', {
            recAccessories,
            optAccessories,
            formations,
        });
    }

    function setRecAccessory(index, value) {
        recAccessories[index] = value;
        recAccessories = recAccessories;
        dispatch('dropdown', { id: null });
        notifyChange();
    }

    function setOptAccessory(index, value) {
        optAccessories[index] = value;
        optAccessories = optAccessories;
        dispatch('dropdown', { id: null });
        notifyChange();
    }

    function removeOptAccessory(idx) {
        optAccessories = optAccessories.filter((_, i) => i !== idx);
        notifyChange();
    }

    function addOptAccessory() {
        optAccessories = [...optAccessories, accessoriesList[0]?.key || null];
        notifyChange();
    }

    function setFormation(index, value) {
        formations[index] = value;
        formations = formations;
        dispatch('dropdown', { id: null });
        notifyChange();
    }

    function removeFormation(idx) {
        formations = formations.filter((_, i) => i !== idx);
        notifyChange();
    }

    function addFormation() {
        formations = [...formations, formationsList[0]?.key || null];
        notifyChange();
    }
</script>

<div class="sub-field-group">
    <div class="group-label">Recommended Accessories</div>
    <div class="row">
        <div class="custom-select">
            <div
                class="select-trigger"
                role="button"
                tabindex="0"
                on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown('recAcc1', ev))}
                on:click={(e) => toggleDropdown('recAcc1', e)}
            >
                <div class="trigger-content">
                    {#if recAccessories[0]}
                        {getAccessoryName(recAccessories[0])}
                        <img
                            src={getAccessoryIcon(recAccessories[0])}
                            alt=""
                            class="select-icon"
                        />
                    {:else}
                        <span class="placeholder">Accessory 1</span>
                    {/if}
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            {#if openDropdownId === 'recAcc1'}
                <div class="select-options">
                    <div
                        class="search-container"
                        role="button"
                        tabindex="0"
                        on:click={handleSearchClick}
                        on:keydown={handleSearchClick}
                    >
                        <input
                            type="text"
                            class="dropdown-search-input"
                            placeholder="Search Accessory..."
                            bind:value={dropdownSearch}
                            on:keydown|stopPropagation
                        />
                    </div>

                    <div
                        class="option"
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => handleKeyEnter(e, () => setRecAccessory(0, null))}
                        on:click={() => setRecAccessory(0, null)}
                    >
                        None
                    </div>
                    {#each accessoriesList.filter((a) => a.name
                            .toLowerCase()
                            .includes(dropdownSearch.toLowerCase())) as a}
                        <div
                            class="option"
                            role="button"
                            tabindex="0"
                            on:keydown={(e) => handleKeyEnter(e, () => setRecAccessory(0, a.key))}
                            on:click={() => setRecAccessory(0, a.key)}
                        >
                            <img
                                src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`}
                                alt=""
                                class="select-icon"
                            />
                            {a.name}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        <span class="sep">+</span>

        <div class="custom-select">
            <div
                class="select-trigger"
                role="button"
                tabindex="0"
                on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown('recAcc2', ev))}
                on:click={(e) => toggleDropdown('recAcc2', e)}
            >
                <div class="trigger-content">
                    {#if recAccessories[1]}
                        {getAccessoryName(recAccessories[1])}
                        <img
                            src={getAccessoryIcon(recAccessories[1])}
                            alt=""
                            class="select-icon"
                        />
                    {:else}
                        <span class="placeholder">Accessory 2</span>
                    {/if}
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>

            {#if openDropdownId === 'recAcc2'}
                <div class="select-options">
                    <div
                        class="search-container"
                        role="button"
                        tabindex="0"
                        on:click={handleSearchClick}
                        on:keydown={handleSearchClick}
                    >
                        <input
                            type="text"
                            class="dropdown-search-input"
                            placeholder="Search Accessory..."
                            bind:value={dropdownSearch}
                            on:keydown|stopPropagation
                        />
                    </div>

                    <div
                        class="option"
                        role="button"
                        tabindex="0"
                        on:keydown={(e) => handleKeyEnter(e, () => setRecAccessory(1, null))}
                        on:click={() => setRecAccessory(1, null)}
                    >
                        None
                    </div>
                    {#each accessoriesList.filter((a) => a.name
                            .toLowerCase()
                            .includes(dropdownSearch.toLowerCase())) as a}
                        <div
                            class="option"
                            role="button"
                            tabindex="0"
                            on:keydown={(e) => handleKeyEnter(e, () => setRecAccessory(1, a.key))}
                            on:click={() => setRecAccessory(1, a.key)}
                        >
                            <img
                                src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`}
                                alt=""
                                class="select-icon"
                            />
                            {a.name}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<div class="sub-field-group">
    <div class="group-label">Optional Accessories</div>
    {#each optAccessories as accKey, idx}
        <div class="pairing-row">
            <div class="custom-select">
                <div
                    class="select-trigger"
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`optAcc${idx}`, ev))}
                    on:click={(e) => toggleDropdown(`optAcc${idx}`, e)}
                >
                    <div class="trigger-content">
                        {getAccessoryName(accKey)}
                        <img src={getAccessoryIcon(accKey)} alt="" class="select-icon" />
                    </div>
                </div>

                {#if openDropdownId === `optAcc${idx}`}
                    <div class="select-options">
                        <div
                            class="search-container"
                            role="button"
                            tabindex="0"
                            on:click={handleSearchClick}
                            on:keydown={handleSearchClick}
                        >
                            <input
                                type="text"
                                class="dropdown-search-input"
                                placeholder="Search Accessory..."
                                bind:value={dropdownSearch}
                                on:keydown|stopPropagation
                            />
                        </div>

                        {#each accessoriesList.filter((a) => a.name
                                .toLowerCase()
                                .includes(dropdownSearch.toLowerCase())) as a}
                            <div
                                class="option"
                                role="button"
                                tabindex="0"
                                on:keydown={(e) => handleKeyEnter(e, () => setOptAccessory(idx, a.key))}
                                on:click={() => setOptAccessory(idx, a.key)}
                            >
                                <img
                                    src={`https://cdn.discordapp.com/emojis/${a.emoji}.png`}
                                    alt=""
                                    class="select-icon"
                                />
                                {a.name}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <button
                class="btn-icon"
                aria-label="Delete Accessory"
                on:click={() => removeOptAccessory(idx)}
            ><i class="fas fa-trash"></i></button>
        </div>
    {/each}

    <button class="add-btn-modern" on:click={addOptAccessory}>+ Add Accessory</button>
</div>

<div class="sub-field-group">
    <div class="group-label">Recommended Formations</div>
    {#each formations as formKey, idx}
        <div class="pairing-row">
            <div class="custom-select">
                <div
                    class="select-trigger"
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => handleKeyEnter(e, (ev) => toggleDropdown(`form${idx}`, ev))}
                    on:click={(e) => toggleDropdown(`form${idx}`, e)}
                >
                    <div class="trigger-content">
                        {getFormationName(formKey)}
                        <img src={getFormationIcon(formKey)} alt="" class="select-icon" />
                    </div>
                </div>

                {#if openDropdownId === `form${idx}`}
                    <div class="select-options">
                        <div
                            class="search-container"
                            role="button"
                            tabindex="0"
                            on:click={handleSearchClick}
                            on:keydown={handleSearchClick}
                        >
                            <input
                                type="text"
                                class="dropdown-search-input"
                                placeholder="Search Formation..."
                                bind:value={dropdownSearch}
                                on:keydown|stopPropagation
                            />
                        </div>

                        {#each formationsList.filter((f) => f.name
                                .toLowerCase()
                                .includes(dropdownSearch.toLowerCase())) as f}
                            <div
                                class="option"
                                role="button"
                                tabindex="0"
                                on:keydown={(e) => handleKeyEnter(e, () => setFormation(idx, f.key))}
                                on:click={() => setFormation(idx, f.key)}
                            >
                                <img
                                    src={`https://cdn.discordapp.com/emojis/${f.emoji}.png`}
                                    alt=""
                                    class="select-icon"
                                />
                                {f.name}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <button
                class="btn-icon"
                aria-label="Delete Formation"
                on:click={() => removeFormation(idx)}
            ><i class="fas fa-trash"></i></button>
        </div>
    {/each}

    <button class="add-btn-modern" on:click={addFormation}>+ Add Formation</button>
</div>

<style>
    .sub-field-group {
        margin-bottom: 20px;
    }
    .sub-field-group .group-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--accent-blue);
        border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        padding-bottom: 4px;
    }
    .row {
        display: flex;
        gap: 15px;
    }
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
    .option:hover {
        background: var(--accent-blue-light);
        color: white;
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
    .sep {
        color: var(--text-secondary);
        opacity: 0.5;
        margin: 0 5px;
        align-self: center;
    }
    .pairing-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        background: var(--bg-primary);
        padding: 5px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
    }
    .add-btn-modern {
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px dashed var(--border-color);
        color: var(--text-secondary);
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
    }
    .add-btn-modern:hover {
        background: var(--bg-secondary);
        color: var(--accent-blue);
        border-color: var(--accent-blue);
    }
    .btn-icon {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
    }
    .btn-icon:hover {
        color: var(--text-primary);
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
