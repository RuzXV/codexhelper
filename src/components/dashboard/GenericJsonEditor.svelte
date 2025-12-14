<script>
    export let apiKey = '';
    export let title = '';
    import { onMount } from 'svelte';

    let data = {};
    let selectedKey = null;
    let editJson = '';
    let status = '';

    onMount(async () => {
        const res = await window.auth.fetchWithAuth(`/api/data/${apiKey}`);
        data = res || {};
    });

    function select(key) {
        selectedKey = key;
        editJson = JSON.stringify(data[key], null, 4);
        status = '';
    }

    async function save() {
        try {
            const parsed = JSON.parse(editJson);
            data[selectedKey] = parsed;
            
            status = 'Saving...';
            await window.auth.fetchWithAuth(`/api/admin/data/${apiKey}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            status = 'Saved!';
        } catch (e) {
            status = 'Error: ' + e.message;
        }
    }
</script>

<div class="editor-layout">
    <div class="sidebar">
        <h3>{title}</h3>
        {#each Object.keys(data).sort() as key}
            <button class:active={selectedKey === key} on:click={() => select(key)}>{key}</button>
        {/each}
    </div>
    <div class="main">
        {#if selectedKey}
            <div class="toolbar">
                <strong>Editing: {selectedKey}</strong>
                <span>{status}</span>
                <button class="save-btn" on:click={save}>Save</button>
            </div>
            <textarea bind:value={editJson}></textarea>
        {:else}
            <p>Select an item to edit</p>
        {/if}
    </div>
</div>

<style>
    .editor-layout { display: flex; height: 70vh; gap: 20px; border: 1px solid #333; border-radius: 8px; overflow: hidden; }
    .sidebar { width: 250px; overflow-y: auto; background: #111; border-right: 1px solid #333; }
    .sidebar button { display: block; width: 100%; text-align: left; padding: 10px; background: none; border: none; color: #aaa; cursor: pointer; border-bottom: 1px solid #222; }
    .sidebar button.active { background: #222; color: white; border-left: 3px solid #3b82f6; }
    .main { flex: 1; display: flex; flex-direction: column; background: #1e1e1e; }
    .toolbar { padding: 10px; background: #252525; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
    textarea { flex: 1; background: #1e1e1e; color: #ddd; border: none; padding: 15px; font-family: monospace; resize: none; outline: none; }
    .save-btn { background: #3b82f6; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }
</style>