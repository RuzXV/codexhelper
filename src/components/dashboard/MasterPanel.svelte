<script>
    import { onMount } from 'svelte';
    import CommanderList from './CommanderList.svelte';
    import GenericList from './GenericList.svelte';
    import CommanderEditor from './CommanderEditor.svelte';
    import EventEditor from './EventEditor.svelte';
    import BundleEditor from './BundleEditor.svelte';
    import MetaPairingEditor from './MetaPairingEditor.svelte';
    import emojiData from '../../data/emoji_mappings.json';

    export let user;

    const DATA_SOURCES = [
        { id: 'commanders', label: 'Commanders', icon: 'fa-chess-knight' },
        { id: 'events', label: 'Events', icon: 'fa-calendar-alt' },
        { id: 'bundles', label: 'Bundles', icon: 'fa-box-open' },
        { id: 'meta_lineups', label: 'Meta Pairings', icon: 'fa-users' }
    ];

    const COLOR_MAP = {
        commander_main: '#004cff',
        commander_sub: '#313338',
        meta: '#00c6ff',
        bundle: '#e9be74',
        event: '#2ecc71'
    };

    function getEmbedColor(hexOrInt) {
        if (!hexOrInt) return '#313338';
        if (typeof hexOrInt === 'string' && hexOrInt.startsWith('#')) return hexOrInt;
        if (typeof hexOrInt === 'number') return '#' + hexOrInt.toString(16).padStart(6, '0');
        return '#313338';
    }

    let activeSource = 'commanders';
    let searchQuery = '';
    
    let rawData = null;
    let aliasData = null; 
    let loading = false;
    let error = null;

    let isEditing = false;
    let editingItem = null;

    $: totalEntries = rawData ? Object.keys(rawData).length : 0;
    $: if (activeSource) loadData(activeSource);

    async function loadData(source) {
        loading = true;
        error = null;
        rawData = null;
        try {
            const response = await window.auth.fetchWithAuth(`/api/data/${source}`);
            if (source === 'commanders') {
                aliasData = await window.auth.fetchWithAuth(`/api/data/aliases`);
            }
            rawData = response;
        } catch (err) {
            console.error("Failed to fetch data:", err);
            error = err.message || "Failed to load data";
        } finally {
            loading = false;
        }
    }

    function handleAddEntry() {
        if (activeSource === 'commanders') {
            alert("Please use the 'Add Build' button inside an existing commander to create variants, or ask Dev to add a new base commander key.");
            return;
        }

        const id = prompt(`Enter a unique ID (key) for the new ${activeSource.slice(0, -1)} (e.g., 'golden_kingdom'):`);
        if (!id) return;
        if (rawData[id]) {
            alert("ID already exists!");
            return;
        }

        let newData = {};
        if (activeSource === 'events') newData = { title: "New Event", color: 3066993, fields: [] };
        if (activeSource === 'bundles') newData = { title: "New Bundle", color: "#e9be74", description: [] };
        if (activeSource === 'meta_lineups') newData = { title: "New Lineup", color: "#00c6ff", fields: [] };

        editingItem = { id, data: newData };
        isEditing = true;
    }

    function handleEdit(event) {
        const id = event.detail.id;
        if (activeSource === 'commanders') {
            editingItem = {
                id: id,
                data: rawData[id],
                aliasData: aliasData[id]
            };
        } else {
            editingItem = {
                id: id,
                data: rawData[id]
            };
        }
        isEditing = true;
    }

    async function handleSave(event) {
        const { id, commanderId, data, aliasData: newAliasData } = event.detail;
        const saveId = commanderId || id;

        rawData[saveId] = data;
        if (activeSource === 'commanders' && aliasData) {
            aliasData[saveId] = newAliasData;
        }

        isEditing = false;
        editingItem = null;

        try {
            await window.auth.fetchWithAuth(`/api/admin/data/${activeSource}`, {
                method: 'POST',
                body: JSON.stringify(rawData)
            });

            if (activeSource === 'commanders' && aliasData) {
                await window.auth.fetchWithAuth(`/api/admin/data/aliases`, {
                    method: 'POST',
                    body: JSON.stringify(aliasData)
                });
            }
            
            await loadData(activeSource);
            alert('Saved successfully!');
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save changes to API.");
            await loadData(activeSource);
        }
    }

    async function handleDeleteGeneric(event) {
        const { id } = event.detail;
        delete rawData[id];
        rawData = { ...rawData };

        try {
            await window.auth.fetchWithAuth(`/api/admin/data/${activeSource}`, {
                method: 'POST',
                body: JSON.stringify(rawData)
            });
            alert(`${id} deleted successfully.`);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete. Please refresh.");
            await loadData(activeSource);
        }
    }

    function handleCloseEditor() {
        isEditing = false;
        editingItem = null;
    }

    async function handleDeleteCommander(event) {
        const { id, name } = event.detail;
        if (!confirm(`Are you sure you want to delete "${name}"? \n\nThis will remove the Main Template and ALL Sub-Templates. This cannot be undone.`)) {
            return;
        }

        delete rawData[id];
        if (aliasData && aliasData[id]) {
            delete aliasData[id];
        }

        rawData = { ...rawData };

        try {
            await window.auth.fetchWithAuth(`/api/admin/data/commanders`, {
                method: 'POST',
                body: JSON.stringify(rawData)
            });
            if (aliasData) {
                await window.auth.fetchWithAuth(`/api/admin/data/aliases`, {
                    method: 'POST',
                    body: JSON.stringify(aliasData)
                });
            }
            alert(`${name} deleted successfully.`);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to sync deletion to server. Please refresh.");
            await loadData('commanders');
        }
    }
</script>

<div class="panel-container">
    <div class="dashboard-header">
        <div>
            <h1>Master Admin Panel</h1>
            <p>Manage core data sources and global bot configurations.</p>
        </div>
    </div>

    <div class="panel-content">
        <div class="controls-toolbar">
             <div class="source-selector">
                {#each DATA_SOURCES as source}
                    <button 
                        class="source-btn" 
                        class:active={activeSource === source.id}
                        on:click={() => { activeSource = source.id; searchQuery = ''; }}
                    >
                        <i class="fas {source.icon}"></i>
                        <span>{source.label}</span>
                    </button>
                {/each}
            </div>

            <div class="actions-group">
                <span class="entry-count">{totalEntries} Entries</span>
                <div class="search-wrapper">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search {activeSource}..." bind:value={searchQuery} class="search-input"/>
                </div>
                <button class="btn-add" aria-label="Add New Entry" on:click={handleAddEntry}><i class="fas fa-plus"></i></button>
            </div>
        </div>

        <div class="data-list-container">
            {#if loading}
                <div class="state-msg"><i class="fas fa-circle-notch fa-spin"></i><p>Fetching {activeSource}...</p></div>
            {:else if error}
                <div class="state-msg error"><i class="fas fa-exclamation-triangle"></i><p>{error}</p></div>
            {:else if rawData}
                {#if activeSource === 'commanders'}
                    <CommanderList 
                        data={rawData} 
                        aliases={aliasData || {}} 
                        search={searchQuery} 
                        emojiMap={emojiData.commanders}
                        on:edit={handleEdit} 
                        on:delete={handleDeleteCommander} 
                    />
                {:else}
                    <GenericList 
                        data={rawData} 
                        type={activeSource} 
                        search={searchQuery} 
                        {getEmbedColor}
                        {COLOR_MAP}
                        on:edit={handleEdit}
                        on:delete={handleDeleteGeneric}
                    />
                {/if}
            {/if}
        </div>
    </div>
</div>

{#if isEditing && editingItem}
    {#if activeSource === 'commanders'}
        <CommanderEditor
            commanderId={editingItem.id}
            commanderData={editingItem.data}
            aliasData={editingItem.aliasData}
            emojiData={emojiData} 
            {user}
            on:close={handleCloseEditor}
            on:save={handleSave}
        />
    {:else if activeSource === 'events'}
        <EventEditor
            eventId={editingItem.id}
            eventData={editingItem.data}
            {user}
            on:close={handleCloseEditor}
            on:save={handleSave}
        />
    {:else if activeSource === 'bundles'}
        <BundleEditor
            bundleId={editingItem.id}
            bundleData={editingItem.data}
            {user}
            on:close={handleCloseEditor}
            on:save={handleSave}
        />
    {:else if activeSource === 'meta_lineups'}
        <MetaPairingEditor
            metaId={editingItem.id}
            metaData={editingItem.data}
            emojiData={emojiData}
            {user}
            on:close={handleCloseEditor}
            on:save={handleSave}
        />
    {/if}
{/if}

<style>
    .controls-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 15px; flex-wrap: wrap; }
    .source-selector { display: flex; background: var(--bg-tertiary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-color); gap: 2px; }
    .source-btn { background: transparent; border: none; color: var(--text-secondary); padding: 8px 16px; border-radius: var(--radius-sm); font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; font-size: 0.9rem; }
    .source-btn:hover { color: var(--text-primary); }
    .source-btn.active { background: var(--bg-card); color: var(--accent-blue); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    
    .actions-group { display: flex; gap: 10px; align-items: center; flex-grow: 1; justify-content: flex-end; }
    .entry-count { font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; margin-right: 5px; white-space: nowrap; }
    .search-wrapper { position: relative; width: 100%; max-width: 300px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; }
    .search-input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); padding: 10px 10px 10px 36px; border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.95rem; }
    .search-input:focus { outline: none; border-color: var(--accent-blue); }
    
    .btn-add { background: var(--accent-green); color: #000; border: none; width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 1.1rem; }
    .btn-add:hover { filter: brightness(1.1); transform: translateY(-1px); }

    .data-list-container { min-height: 400px; position: relative; }
    .state-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary); gap: 10px; font-size: 1.2rem; }
    .state-msg.error { color: #ef4444; }
    .state-msg i { font-size: 2rem; opacity: 0.7; }
</style>