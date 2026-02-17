<script>
    import { createEventDispatcher } from 'svelte';
    import CommanderSelect from '../../../shared/CommanderSelect.svelte';

    const dispatch = createEventDispatcher();

    export let field;
    export let fieldIndex;
    export let commanders = [];
    export let openDropdownId = null;

    const BULLET_ID = '1366755663056867389';
    const BULLET_IMG_URL = `https://cdn.discordapp.com/emojis/${BULLET_ID}.png`;

    const LIMITS = {
        FIELD_NAME: 256,
        FIELD_VALUE: 1024,
    };

    const SEPARATOR = '\u3021';
    const BULLET_STRING = `<:bullet_point3:${BULLET_ID}>`;

    function getRowStringLength(row) {
        const c1 = commanders.find((c) => c.key === row.cmd1);
        const c2 = commanders.find((c) => c.key === row.cmd2);

        let text = '';
        if (c1) text += `${c1.name} <:${c1.key}:${c1.emoji}>`;
        if (c2) text += ` ${SEPARATOR} ${c2.name} <:${c2.key}:${c2.emoji}>`;

        if (!text) return 'Empty Row'.length;
        return BULLET_STRING.length + 1 + text.length;
    }

    function getFieldLength() {
        const rowsLength = field.rows.reduce((acc, row) => acc + getRowStringLength(row), 0);
        const newlines = Math.max(0, field.rows.length - 1);
        return rowsLength + newlines;
    }

    $: currentLen = getFieldLength();

    function handleDropdown(event) {
        dispatch('dropdown', event.detail);
    }

    function notifyChange() {
        dispatch('change');
    }

    function removeField() {
        dispatch('remove');
    }

    function addRow() {
        field.rows = [...field.rows, { id: Date.now(), cmd1: null, cmd2: null }];
        notifyChange();
    }

    function removeRow(rIdx) {
        field.rows = field.rows.filter((_, i) => i !== rIdx);
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
</script>

<div class="pairing-group">
    <div class="group-header">
        <div style="flex: 1; display: flex; flex-direction: column;">
            <input
                type="text"
                class="group-title-input"
                bind:value={field.name}
                on:input={notifyChange}
                aria-label="Category Name"
                placeholder="Category Name"
                maxlength={LIMITS.FIELD_NAME}
            />
            <span
                class="char-mini"
                style="position: relative; right: auto; text-align: right; margin-top: 2px;"
                class:error={field.name.length >= LIMITS.FIELD_NAME}
            >{field.name.length}/{LIMITS.FIELD_NAME}</span>
        </div>
        <button
            class="btn-icon danger"
            aria-label="Delete Category"
            on:click={removeField}
        ><i class="fas fa-trash"></i></button>
    </div>
    <div class="rows-container">
        {#each field.rows as row, rIdx}
            <div class="pairing-row">
                <div class="bullet-wrapper">
                    <img src={BULLET_IMG_URL} class="bullet-icon-static" alt="bullet" />
                </div>

                <CommanderSelect
                    {commanders}
                    selected={row.cmd1}
                    id={`f${fieldIndex}r${rIdx}c1`}
                    {openDropdownId}
                    placeholder="Select..."
                    on:change={(e) => handleCmd1Change(row, e)}
                    on:dropdown={handleDropdown}
                />

                <span class="sep">|</span>

                <CommanderSelect
                    {commanders}
                    selected={row.cmd2}
                    id={`f${fieldIndex}r${rIdx}c2`}
                    {openDropdownId}
                    placeholder="Select..."
                    on:change={(e) => handleCmd2Change(row, e)}
                    on:dropdown={handleDropdown}
                />

                <button
                    class="btn-icon"
                    aria-label="Delete Row"
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
    .bullet-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
    }
    .bullet-icon-static {
        width: 18px;
        height: 18px;
        opacity: 0.5;
        filter: grayscale(100%);
    }
    .sep {
        color: var(--text-secondary);
        opacity: 0.5;
        margin: 0 5px;
    }
    .add-btn-modern {
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px dashed var(--border-color);
        color: var(--text-secondary);
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
    }
    .add-btn-modern:hover {
        color: var(--accent-blue);
        border-color: var(--accent-blue);
    }
    .btn-icon {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
    }
    .btn-icon:hover {
        color: #ef4444;
    }
    .char-count {
        font-size: 0.7rem;
        color: var(--text-secondary);
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
    }
    .char-mini.error {
        color: #ef4444;
    }
    .group-footer-info {
        display: flex;
        justify-content: flex-end;
        padding-top: 5px;
    }
</style>
