<script>
    import { onMount } from 'svelte';
    
    let aliasesRaw = {};
    let commandersRaw = {};
    let isLoading = true;
    let saveStatus = '';
    
    let selectedKey = null;
    let searchQuery = '';
    
    let editDisplayName = '';
    let editAliasesStr = '';
    let editEmbedJsonStr = '';
    
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
        
        editEmbedJsonStr = JSON.stringify(cmdData, null, 2);
        saveStatus = '';
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
                alert("Invalid JSON in Embed Data field!");
                saveStatus = 'Error: Invalid JSON';
                return;
            }
            commandersRaw[selectedKey] = parsedCmdData;

            await Promise.all([
                window.auth.fetchWithAuth('/api/admin/data/aliases', {
                    method: 'POST',
                    body: JSON.stringify(aliasesRaw)
                }),
                window.auth.fetchWithAuth('/api/admin/data/commanders', {
                    method: 'POST',
                    body: JSON.stringify(commandersRaw)
                })
            ]);

            saveStatus = 'Saved successfully!';
            setTimeout(() => saveStatus = '', 2000);

        } catch (e) {
            console.error(e);
            saveStatus = 'Save failed.';
            alert("Error saving: " + e.message);
        }
    }
    
    function createNew() {
        const id = prompt("Enter new unique Commander ID (e.g., 'scipio_prime'):");
        if (!id) return;
        if (aliasesRaw[id]) {
            alert("ID already exists!");
            return;
        }
        
        aliasesRaw[id] = { display_name: "New Commander", aliases: [] };
        commandersRaw[id] = [{ name: id, json: { embeds: [{ title: "New", description: "Content" }] } }];
        
        aliasesRaw = {...aliasesRaw}; 
        selectCommander(id);
    }
</script>

<div class="editor-container">
    {#if isLoading}
        <div class="loading">Loading Data...</div>
    {:else}
        <div class="sidebar">
            <div class="sidebar-header">
                <input type="text" placeholder="Search..." bind:value={searchQuery} />
                <button on:click={createNew}>+ New</button>
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
                <div class="editor-header">
                    <h2>Editing: {selectedKey}</h2>
                    <div class="actions">
                        <span class="status">{saveStatus}</span>
                        <button class="save-btn" on:click={saveChanges}>Save Changes</button>
                    </div>
                </div>

                <div class="form-grid">
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" bind:value={editDisplayName} />
                    </div>
                    <div class="form-group">
                        <label>Aliases (comma separated)</label>
                        <input type="text" bind:value={editAliasesStr} />
                    </div>
                </div>

                <div class="form-group full-height">
                    <label>
                        Embed Data (JSON Array) 
                        <span class="hint">- This controls the bot response. Be careful with syntax.</span>
                    </label>
                    <textarea bind:value={editEmbedJsonStr} spellcheck="false"></textarea>
                </div>

            {:else}
                <div class="empty-state">Select a commander to edit</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .editor-container { display: flex; height: 80vh; border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 8px; overflow: hidden; }
    .sidebar { width: 250px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: var(--bg-primary); }
    .sidebar-header { padding: 10px; display: flex; gap: 5px; border-bottom: 1px solid var(--border-color); }
    .sidebar-header input { flex: 1; padding: 4px; border-radius: 4px; border: 1px solid var(--border-hover); background: var(--bg-tertiary); color: white; }
    .list { flex: 1; overflow-y: auto; }
    .list button { width: 100%; text-align: left; padding: 10px; background: none; border: none; border-bottom: 1px solid var(--border-hover); cursor: pointer; color: var(--text-secondary); }
    .list button:hover { background: var(--bg-tertiary); }
    .list button.active { background: var(--accent-blue-low); border-left: 3px solid var(--accent-blue); color: white; }
    .key-id { font-size: 0.75rem; opacity: 0.7; font-family: monospace; }
    .key-name { font-weight: 600; }

    .main-content { flex: 1; display: flex; flex-direction: column; padding: 20px; gap: 20px; overflow-y: auto; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
    .save-btn { background: var(--accent-blue); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .save-btn:hover { background: var(--accent-blue-bright); }
    .status { margin-right: 10px; color: var(--accent-green); font-size: 0.9rem; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; }
    .hint { font-size: 0.8rem; opacity: 0.6; font-weight: normal; }
    .form-group input { padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-hover); color: white; border-radius: 4px; }
    
    .full-height { flex: 1; display: flex; flex-direction: column; min-height: 300px; }
    textarea { flex: 1; background: #1e1e1e; color: #d4d4d4; font-family: monospace; padding: 10px; border: 1px solid var(--border-hover); border-radius: 4px; resize: none; line-height: 1.4; tab-size: 4;}
    
    .empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
</style>