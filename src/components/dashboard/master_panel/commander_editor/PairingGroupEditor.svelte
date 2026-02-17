<script>
    import { createEventDispatcher } from 'svelte';
    import CommanderSelect from '../../../shared/CommanderSelect.svelte';

    const dispatch = createEventDispatcher();

    export let group;
    export let groupIndex;
    export let commanders = [];
    export let emojiData;
    export let openDropdownId = null;

    const LIMITS = {
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
    };

    const SEPARATOR = '\u3021';
    const BULLET_POINT = '<:bullet_point:1362669097321627809>';

    function formatRow(row) {
        if (row.type === 'custom') return `${BULLET_POINT} ${row.customText}`;

        let text = `${BULLET_POINT} `;

        if (row.cmd1 && emojiData?.commanders) {
            const c1 = emojiData.commanders.find((e) => e.key === row.cmd1);
            if (c1) text += `${c1.name} <:${c1.key}:${c1.emoji}>`;
        }
        if (row.cmd2 && emojiData?.commanders) {
            const c2 = emojiData.commanders.find((e) => e.key === row.cmd2);
            if (c2) text += `${SEPARATOR}${c2.name} <:${c2.key}:${c2.emoji}>`;
        }
        return text;
    }

    function getGroupValueLength(g) {
        if (!g.rows || g.rows.length === 0) return 0;
        const rowsLength = g.rows.reduce((acc, row) => acc + formatRow(row).length, 0);
        const newlines = Math.max(0, g.rows.length - 1);
        return rowsLength + newlines;
    }

    $: currentLen = getGroupValueLength(group);

    function handleDropdown(event) {
        dispatch('dropdown', event.detail);
    }

    function notifyChange() {
        dispatch('change');
    }

    function removeGroup() {
        dispatch('remove');
    }

    function addRow() {
        group.rows = [
            ...group.rows,
            { id: Date.now(), type: 'pair', cmd1: null, cmd2: null, customText: '' },
        ];
        notifyChange();
    }

    function removeRow(rIdx) {
        group.rows = group.rows.filter((_, i) => i !== rIdx);
        notifyChange();
    }

    function handleCmd1Change(row, event) {
        row.cmd1 = event.detail.value;
        notifyChange();
    }

    function handleCmd2Change(row, event) {
        row.cmd2 = event.detail.value;
        notifyChange();
    }

    function handleKeyEnter(event, callback) {
        if (event.key === 'Enter') {
            event.preventDefault();
            callback(event);
        }
    }
</script>

<div class="pairing-group">
    <div class="group-header">
        <div style="flex:1; display: flex; flex-direction: column;">
            <input
                type="text"
                aria-label="Group Title"
                class="group-title-input"
                bind:value={group.title}
                on:input={notifyChange}
                maxlength={LIMITS.FIELD_NAME}
            />
            <span
                class="char-mini"
                class:error={group.title.length > LIMITS.FIELD_NAME}
                style="text-align:right; margin-right: 10px;"
            >{group.title.length}/{LIMITS.FIELD_NAME}</span>
        </div>
        <button
            class="btn-icon danger"
            aria-label="Delete Group"
            on:click={removeGroup}
        ><i class="fas fa-trash"></i></button>
    </div>
    <div class="rows-container">
        {#each group.rows as row, rIdx (row.id)}
            <div class="pairing-row">
                <div class="row-type-toggle">
                    <button
                        aria-label="Pair Mode"
                        class:active={row.type === 'pair'}
                        on:click={() => { row.type = 'pair'; notifyChange(); }}
                    ><i class="fas fa-user-friends"></i></button>
                    <button
                        aria-label="Custom Text Mode"
                        class:active={row.type === 'custom'}
                        on:click={() => { row.type = 'custom'; notifyChange(); }}
                    ><i class="fas fa-quote-right"></i></button>
                </div>

                <div class="row-content">
                    {#if row.type === 'pair'}
                        <CommanderSelect
                            {commanders}
                            selected={row.cmd1}
                            id={`g${groupIndex}r${rIdx}s1`}
                            {openDropdownId}
                            placeholder="Select..."
                            on:change={(e) => handleCmd1Change(row, e)}
                            on:dropdown={handleDropdown}
                        />

                        <span class="sep">|</span>

                        <CommanderSelect
                            {commanders}
                            selected={row.cmd2}
                            id={`g${groupIndex}r${rIdx}s2`}
                            {openDropdownId}
                            placeholder="Select..."
                            on:change={(e) => handleCmd2Change(row, e)}
                            on:dropdown={handleDropdown}
                        />
                    {:else}
                        <input
                            type="text"
                            aria-label="Custom text"
                            class="custom-text-input"
                            bind:value={row.customText}
                            on:input={notifyChange}
                        />
                    {/if}
                </div>
                <button
                    class="btn-icon"
                    aria-label="Remove Row"
                    on:click={() => removeRow(rIdx)}
                ><i class="fas fa-minus"></i></button>
            </div>
        {/each}

        <button class="add-btn-modern" on:click={addRow}>+ Add Row</button>
    </div>

    <div class="group-footer-info">
        <span
            class="char-count"
            class:warning={currentLen > LIMITS.FIELD_VALUE * 0.9}
            class:error={currentLen > LIMITS.FIELD_VALUE}
        >
            Field Value: {currentLen} / {LIMITS.FIELD_VALUE}
        </span>
    </div>
</div>

<style>
    .pairing-group {
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 10px;
    }
    .group-header {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
    }
    .group-title-input {
        flex: 1;
        font-weight: bold;
        background: transparent;
        border: none;
        border-bottom: 1px dashed var(--border-color);
        border-radius: 0;
        padding-left: 0;
        color: var(--text-primary);
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
    .row-type-toggle {
        display: flex;
        background: var(--bg-tertiary);
        border-radius: 4px;
        border: 1px solid var(--border-color);
    }
    .row-type-toggle button {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 5px 8px;
        cursor: pointer;
        opacity: 0.5;
    }
    .row-type-toggle button.active {
        background: var(--accent-blue);
        color: white;
        opacity: 1;
    }
    .row-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
    }
    .custom-text-input {
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 8px 12px;
        border-radius: 4px;
        color: var(--text-primary);
    }
    .sep {
        color: var(--text-secondary);
        opacity: 0.5;
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
    .btn-icon.danger:hover {
        color: #ff4444;
    }
    .char-count {
        font-size: 0.7rem;
        color: var(--text-secondary);
        transition: color 0.2s;
    }
    .char-count.warning {
        color: #eab308;
    }
    .char-count.error {
        color: #ef4444;
        font-weight: bold;
    }
    .char-mini {
        font-size: 0.7rem;
        color: var(--text-secondary);
        pointer-events: none;
    }
    .char-mini.error {
        color: #ef4444;
        font-weight: bold;
    }
    .group-footer-info {
        display: flex;
        justify-content: flex-end;
        padding-top: 5px;
    }
</style>
