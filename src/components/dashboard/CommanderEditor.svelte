<script>
    import { onMount } from 'svelte';
    import DiscordEmbedPreview from './DiscordEmbedPreview.svelte';
    
    let aliasesRaw = {};
    let commandersRaw = {};
    let isLoading = true;
    let saveStatus = '';
    
    let selectedKey = null;
    let searchQuery = '';
    
    let editDisplayName = '';
    let editAliasesStr = '';
    let editEmbedJsonStr = ''; 
    
    let activePreviewKey = '';
    let previewData = null;

    onMount(async () => {
        await fetchData();
    });

    async function fetchData() {
        isLoading = true;
        try {
            const [aliasesRes, commandersRes] = await Promise.all([
                window.auth.fetchWithAuth('/api/data/aliases'),
                window.auth.fetchWithAuth('/api/data/commanders')
            ]);
            aliasesRaw = aliasesRes || {};
            commandersRaw = commandersRes || {};
        } catch (e) {
            alert("Failed to load data: " + e.message);
        } finally {
            isLoading = false;
        }
    }

    $: filteredKeys = Object.keys(aliasesRaw).filter(key => {
        const name = aliasesRaw[key]?.display_name?.toLowerCase() || '';
        return key.includes(searchQuery.toLowerCase()) || name.includes(searchQuery.toLowerCase());
    }).sort();

    function selectCommander(key) {
        selectedKey = key;
        const aliasData = aliasesRaw[key] || {};
        const cmdData = commandersRaw[key] || [];

        editDisplayName = aliasData.display_name || '';
        editAliasesStr = (aliasData.aliases || []).join(', ');
        
        editEmbedJsonStr = JSON.stringify(cmdData, null, 4);
        
        activePreviewKey = key; 
        updatePreview();
        saveStatus = '';
    }

    $: if (editEmbedJsonStr) updatePreview();

    function updatePreview() {
        if (!editEmbedJsonStr) {
            previewData = null;
            return;
        }
        try {
            const parsedArray = JSON.parse(editEmbedJsonStr);
            if (!Array.isArray(parsedArray)) {
                previewData = null; 
                return;
            }

            let targetTemplate = parsedArray.find(t => t.name === activePreviewKey);
            
            if (!targetTemplate && parsedArray.length > 0) {
                targetTemplate = parsedArray[0];
            }

            if (targetTemplate && targetTemplate.json) {
                previewData = {
                    embed: targetTemplate.json.embeds ? targetTemplate.json.embeds[0] : {},
                    components: targetTemplate.json.components || []
                };
            } else {
                previewData = null;
            }
        } catch (e) {
        }
    }

    function handlePreviewAction(event) {
        const { customId } = event.detail;
        console.log("Simulating click:", customId);
        
        try {
            const parsedArray = JSON.parse(editEmbedJsonStr);
            const found = parsedArray.find(t => t.name === customId);
            if (found) {
                activePreviewKey = customId;
                updatePreview();
            } else {
                console.warn(`Template '${customId}' not found in this commander's data.`);
            }
        } catch (e) {}
    }

    async function saveChanges() {
        if (!selectedKey) return;
        saveStatus = 'Saving...';

        try {
            aliasesRaw[selectedKey] = {
                display_name: editDisplayName,
                aliases: editAliasesStr.split(',').map(s => s.trim()).filter(s => s)
            };

            let parsedCmdData;
            try {
                parsedCmdData = JSON.parse(editEmbedJsonStr);
            } catch (e) {
                alert("Invalid JSON!");
                saveStatus = 'Error: Invalid JSON';
                return;
            }
            commandersRaw[selectedKey] = parsedCmdData;

            await Promise.all([
                window.auth.fetchWithAuth('/api/admin/data/aliases', { method: 'POST', body: JSON.stringify(aliasesRaw) }),
                window.auth.fetchWithAuth('/api/admin/data/commanders', { method: 'POST', body: JSON.stringify(commandersRaw) })
            ]);

            saveStatus = '✅ Saved!';
            setTimeout(() => saveStatus = '', 2000);

        } catch (e) {
            console.error(e);
            saveStatus = 'Save failed.';
            alert("Error saving: " + e.message);
        }
    }
    
    function createNew() {
        const id = prompt("Enter new unique Commander ID:");
        if (!id) return;
        if (aliasesRaw[id]) { alert("ID exists!"); return; }
        
        aliasesRaw[id] = { display_name: "New Commander", aliases: [] };
        commandersRaw[id] = [{ name: id, json: { embeds: [{ title: "New", description: "Edit me" }] } }];
        
        aliasesRaw = {...aliasesRaw}; 
        selectCommander(id);
    }
</script>

<div class="editor-layout">
    <div class="sidebar glass-panel">
        <div class="sidebar-header">
            <input type="text" placeholder="Search..." bind:value={searchQuery} class="crystal-input" />
            <button class="btn-crystal small" on:click={createNew}>+ New</button>
        </div>
        <div class="list">
            {#each filteredKeys as key}
                <button class:active={selectedKey === key} on:click={() => selectCommander(key)}>
                    <div class="key-id">{key}</div>
                    <div class="key-name">{aliasesRaw[key]?.display_name}</div>
                </button>
            {/each}
        </div>
    </div>

    <div class="main-content">
        {#if selectedKey}
            <div class="editor-header glass-panel">
                <div class="header-left">
                    <h2>Editing: <span class="highlight">{selectedKey}</span></h2>
                    <div class="badge">Active View: {activePreviewKey}</div>
                </div>
                <div class="header-actions">
                    <span class="status">{saveStatus}</span>
                    <button class="btn-crystal success" on:click={saveChanges}>
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>

            <div class="split-view">
                <div class="editor-panel glass-panel">
                    <h3>Configuration</h3>
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" bind:value={editDisplayName} class="crystal-input" />
                    </div>
                    <div class="form-group">
                        <label>Aliases</label>
                        <input type="text" bind:value={editAliasesStr} class="crystal-input" />
                    </div>
                    <div class="form-group full-height">
                        <label>
                            JSON Data (Array of Templates)
                            <span class="hint">Edit raw structure here.</span>
                        </label>
                        <textarea bind:value={editEmbedJsonStr} spellcheck="false" class="code-editor"></textarea>
                    </div>
                </div>

                <div class="preview-panel glass-panel">
                    <h3>Live Preview</h3>
                    <div class="preview-wrapper">
                        {#if previewData}
                            <DiscordEmbedPreview 
                                embedData={previewData.embed} 
                                components={previewData.components}
                                on:action={handlePreviewAction}
                            />
                        {:else}
                            <div class="empty-state">Invalid JSON or Empty Data</div>
                        {/if}
                    </div>
                    <div class="preview-note">
                        <i class="fas fa-info-circle"></i> Buttons are interactive! Click them to test navigation.
                    </div>
                </div>
            </div>

        {:else}
            <div class="empty-state-container">
                <div class="glass-panel centered">
                    <i class="fas fa-arrow-left fa-2x"></i>
                    <h3>Select a Commander</h3>
                    <p>Choose an item from the sidebar to start editing.</p>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .glass-panel {
        background: rgba(20, 21, 24, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        backdrop-filter: blur(10px);
        padding: var(--spacing-4);
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }

    .editor-layout {
        display: flex;
        height: 80vh;
        gap: var(--spacing-4);
    }

    .sidebar {
        width: 300px;
        display: flex;
        flex-direction: column;
        padding: 0;
        overflow: hidden;
        flex-shrink: 0;
    }

    .sidebar-header {
        padding: var(--spacing-3);
        display: flex;
        gap: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .list {
        flex: 1;
        overflow-y: auto;
    }

    .list button {
        width: 100%;
        text-align: left;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
    }

    .list button:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }

    .list button.active {
        background: rgba(59, 130, 246, 0.15);
        border-left: 3px solid var(--accent-blue);
        color: white;
    }

    .key-id { font-size: 0.75rem; opacity: 0.7; font-family: monospace; }
    .key-name { font-weight: 600; font-size: 0.95rem; }

    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-4);
        min-width: 0;
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-3) var(--spacing-6);
    }

    .header-left h2 { margin: 0; font-size: 1.25rem; }
    .highlight { color: var(--accent-blue-bright); }
    .badge { 
        display: inline-block; 
        font-size: 0.75rem; 
        background: rgba(255,255,255,0.1); 
        padding: 2px 8px; 
        border-radius: 4px; 
        margin-top: 4px;
        font-family: monospace;
    }

    .split-view {
        display: flex;
        gap: var(--spacing-4);
        flex: 1;
        min-height: 0;
    }

    .editor-panel, .preview-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-4);
        min-width: 0;
    }

    h3 { margin: 0 0 var(--spacing-2) 0; font-size: 1rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    
    .crystal-input {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-sm);
        padding: 8px 12px;
        color: white;
        font-size: 0.9rem;
    }
    .crystal-input:focus {
        outline: none;
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .code-editor {
        flex: 1;
        background: #1e1e1e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-sm);
        padding: 12px;
        color: #d4d4d4;
        font-family: 'Consolas', monospace;
        font-size: 0.85rem;
        resize: none;
        line-height: 1.5;
        min-height: 300px;
    }

    .preview-wrapper {
        flex: 1;
        background: #1a1b1e;
        border-radius: var(--radius-md);
        padding: 20px;
        overflow-y: auto;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        border: 1px dashed rgba(255,255,255,0.1);
    }

    .btn-crystal {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .btn-crystal:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }
    .btn-crystal.success {
        background: rgba(87, 242, 135, 0.15);
        border-color: var(--accent-green);
        color: #8affae;
    }
    .btn-crystal.success:hover {
        background: rgba(87, 242, 135, 0.25);
        box-shadow: 0 0 15px rgba(87, 242, 135, 0.2);
    }
    .btn-crystal.small {
        padding: 4px 12px;
        font-size: 0.8rem;
    }

    .empty-state-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
    .centered { text-align: center; max-width: 400px; }
    
    .preview-note {
        font-size: 0.8rem;
        color: var(--text-muted);
        text-align: center;
    }
</style>