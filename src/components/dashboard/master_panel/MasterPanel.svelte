<script>
    import { onMount } from 'svelte';
    import CommanderList from './CommanderList.svelte';
    import GenericList from './GenericList.svelte';
    import CommanderEditor from './CommanderEditor.svelte';
    import EventEditor from './EventEditor.svelte';
    import BundleEditor from './BundleEditor.svelte';
    import MetaPairingEditor from './MetaPairingEditor.svelte';
    import emojiData from '../../../data/emoji_mappings.json';

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

    let onlineUsers = [];

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

    async function sendHeartbeat() {
        try {
            const res = await window.auth.fetchWithAuth('/api/admin/heartbeat', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.username, 
                    avatar: user.avatar 
                })
            });
            if (res.users) {
                onlineUsers = res.users;
            }
        } catch (e) {
            console.error("Heartbeat failed", e);
        }
    }

    onMount(() => {
        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 30000);
        return () => clearInterval(interval);
    });

    function handleAddEntry() {
        const id = prompt(`Enter a unique ID (key) for the new ${activeSource.slice(0, -1)} (e.g., 'new_entry_key'):`);
        if (!id) return;
        
        if (rawData[id]) {
            alert("ID already exists!");
            return;
        }

        let newData = {};
        if (activeSource === 'commanders') {
            newData = [{
                name: id,
                json: {
                    embeds: [{
                        title: "New Commander", 
                        description: "",
                        fields: []
                    }]
                }
            }];
            if (aliasData) {
                aliasData[id] = {
                    display_name: "New Commander",
                    aliases: []
                };
            }
        }

        if (activeSource === 'events') newData = { title: "New Event", color: 3066993, fields: [] };
        if (activeSource === 'bundles') newData = { title: "New Bundle", color: "#e9be74", description: [] };
        if (activeSource === 'meta_lineups') newData = { title: "New Lineup", color: "#00c6ff", fields: [] };

        if (activeSource === 'commanders') {
            editingItem = {
                id: id,
                data: newData,
                aliasData: aliasData[id],
                originalData: null
            };
        } else {
            editingItem = { 
                id, 
                data: newData, 
                originalData: null 
            };
        }
        
        isEditing = true;
    }

    function handleEdit(event) {
        const id = event.detail.id;
        const originalData = rawData[id] ? JSON.parse(JSON.stringify(rawData[id])) : null;

        if (activeSource === 'commanders') {
            editingItem = {
                id: id,
                data: rawData[id],
                aliasData: aliasData[id],
                originalData: originalData
            };
        } else {
            editingItem = {
                id: id,
                data: rawData[id],
                originalData: originalData
            };
        }
        isEditing = true;
    }

    function generateDiff(oldObj, newObj) {
        const diffs = {};
        const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

        for (const key in newObj) {
            if (!oldObj || !oldObj.hasOwnProperty(key)) {
                diffs[key] = { old: undefined, new: newObj[key], status: 'added' };
            } else if (!isEqual(oldObj[key], newObj[key])) {
                diffs[key] = { old: oldObj[key], new: newObj[key], status: 'modified' };
            }
        }

        if (oldObj) {
            for (const key in oldObj) {
                if (!newObj.hasOwnProperty(key)) {
                    diffs[key] = { old: oldObj[key], new: undefined, status: 'deleted' };
                }
            }
        }
        return diffs;
    }

    function generateCommanderDiff(oldArr, newArr) {
        const diffs = {};
        const oldMap = new Map((oldArr || []).map(t => [t.name, t]));
        const newMap = new Map((newArr || []).map(t => [t.name, t]));
        const allKeys = new Set([...oldMap.keys(), ...newMap.keys()]);

        const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

        for (const key of allKeys) {
            const oldItem = oldMap.get(key);
            const newItem = newMap.get(key);

            const label = `Template: ${key}`;

            if (!oldItem) {
                diffs[label] = { old: undefined, new: newItem, status: 'added' };
            } else if (!newItem) {
                diffs[label] = { old: oldItem, new: undefined, status: 'deleted' };
            } else if (!isEqual(oldItem, newItem)) {
                diffs[label] = { old: oldItem, new: newItem, status: 'modified' };
            }
        }
        return diffs;
    }

    async function handleSave(event) {
        const { id, commanderId, data, aliasData: newAliasData, callback } = event.detail;
        const saveId = commanderId || id;

        if (editingItem && editingItem.originalData) {
            try {
                const freshFullData = await window.auth.fetchWithAuth(`/api/data/${activeSource}`);
                const freshItemData = freshFullData[saveId];

                if (freshItemData && JSON.stringify(freshItemData) !== JSON.stringify(editingItem.originalData)) {
                    if (!confirm("⚠️ CONFLICT DETECTED!\n\nThe data on the server has changed since you opened this editor.\n\nSaving now will overwrite someone else's changes.\n\nClick OK to OVERWRITE anyway, or Cancel to back out.")) {
                        if (callback) callback(false);
                        return;
                    }
                }
            } catch (checkErr) {
                console.warn("Optimistic lock check failed (network error?), proceeding with save caution:", checkErr);
            }
        }

        const oldData = rawData[saveId] ? JSON.parse(JSON.stringify(rawData[saveId])) : {};
        
        let changes;
        if (activeSource === 'commanders' && Array.isArray(data)) {
            const oldArr = Array.isArray(oldData) ? oldData : [];
            changes = generateCommanderDiff(oldArr, data);
        } else {
            changes = generateDiff(oldData, data);
        }
        rawData[saveId] = data;

        if (activeSource === 'commanders' && aliasData) {
            aliasData[saveId] = newAliasData;
        }

        try {
            const logPayload = {
                target_key: saveId,
                target_name: data.title || data.displayName || data.name || saveId,
                changes: changes
            };

            await window.auth.fetchWithAuth(`/api/admin/data/${activeSource}`, {
                method: 'POST',
                body: JSON.stringify({
                    data: rawData,
                    logDetails: JSON.stringify(logPayload)
                })
            });

            if (activeSource === 'commanders' && aliasData) {
                await window.auth.fetchWithAuth(`/api/admin/data/aliases`, {
                    method: 'POST',
                    body: JSON.stringify(aliasData)
                });
            }
            
            await loadData(activeSource);
            if (callback) {
                callback(true);
            } else {
                alert('Saved successfully!');
                isEditing = false;
                editingItem = null;
            }

        } catch (err) {
            console.error("Save failed:", err);
            if (callback) {
                callback(false);
            } else {
                alert("Failed to save changes to API.");
            }
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
        <div class="header-left">
            <h1>Master Admin Panel</h1>
            
            <div class="online-section">
                {#each onlineUsers as u}
                    <div class="user-pill">
                        <img 
                            src={u.avatar 
                                ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` 
                                : `https://cdn.discordapp.com/embed/avatars/${(BigInt(u.id) >> 22n) % 6n}.png`} 
                            alt={u.username} 
                            class="pill-avatar"
                            on:error={(e) => e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"}
                        />
                        <span class="pill-name">{u.username}</span>
                        <span class="status-indicator"></span>
                    </div>
                {/each}
                {#if onlineUsers.length === 0}
                    <div class="user-pill offline">
                        <span class="status-indicator red"></span> Offline
                    </div>
                {/if}
            </div>
        </div>

        <div class="header-controls">
            <span class="entry-count">{totalEntries} Entries</span>

            <div class="search-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input type="text" placeholder="Search {activeSource}..." bind:value={searchQuery} class="search-input"/>
            </div>

            <div class="source-selector">
                {#each DATA_SOURCES as source}
                    <button 
                        class="source-btn" 
                        class:active={activeSource === source.id}
                        on:click={() => { activeSource = source.id; searchQuery = ''; }}
                        title={source.label}
                    >
                        <i class="fas {source.icon}"></i>
                        <span class="btn-label">{source.label}</span>
                    </button>
                {/each}
            </div>

            <button class="btn-add" aria-label="Add New Entry" on:click={handleAddEntry}>
                <i class="fas fa-plus"></i>
            </button>
        </div>
    </div>

    <div class="panel-content">
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
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 20px;
        gap: 20px;
    }

    .header-left {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .header-left h1 {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
    }

    .online-section {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 5px;
    }

    .user-pill {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        padding: 4px 10px 4px 4px;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--text-primary);
        transition: background 0.2s;
    }

    .user-pill:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--text-secondary);
    }

    .pill-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
    }

    .pill-name {
        font-weight: 500;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        background-color: #4ade80;
        border-radius: 50%;
        box-shadow: 0 0 5px rgba(74, 222, 128, 0.5);
    }

    .status-indicator.red {
        background-color: #ef4444;
        box-shadow: none;
    }

    .user-pill.offline {
        padding-left: 10px;
        color: var(--text-secondary);
    }

    .header-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .source-selector { 
        display: flex;
        gap: 5px; 
        background: var(--bg-tertiary);
        padding: 4px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
    }

    .source-btn { 
        background: transparent;
        border: none;
        color: var(--text-secondary); 
        padding: 8px 12px; 
        border-radius: 4px; 
        font-weight: 600; 
        cursor: pointer; 
        display: flex;
        align-items: center; 
        gap: 8px;
        transition: all 0.2s ease; 
        font-size: 0.85rem;
    }

    .source-btn:hover { 
        color: var(--text-primary);
        background: rgba(255,255,255,0.05);
    }

    .source-btn.active { 
        background: var(--bg-card);
        color: var(--accent-blue);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .entry-count { font-size: 0.9rem; color: var(--text-secondary); font-weight: 600; margin-right: 5px; white-space: nowrap; }

    .search-wrapper { position: relative; width: 220px; }
    
    .search-icon { 
        position: absolute;
        left: 10px; top: 50%; transform: translateY(-50%); 
        color: var(--text-secondary); pointer-events: none; font-size: 0.8rem;
    }
    
    .search-input { 
        width: 100%;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color); padding: 8px 8px 8px 30px; 
        border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.9rem;
    }
    .search-input:focus { outline: none; border-color: var(--accent-blue); background: var(--bg-primary); }
    
    .btn-add { 
        background: var(--accent-green);
        color: #000; border: none; 
        width: 36px; height: 36px;
        border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; 
        cursor: pointer;
        transition: all 0.2s; font-size: 1rem;
    }
    .btn-add:hover { filter: brightness(1.1); transform: translateY(-1px); }

    .data-list-container { min-height: 400px; position: relative; }
    .state-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary); gap: 10px; font-size: 1.2rem; }
    .state-msg.error { color: #ef4444; }
    .state-msg i { font-size: 2rem; opacity: 0.7; }

    @media (max-width: 1000px) {
        .dashboard-header { flex-direction: column; align-items: flex-start; gap: 15px; }
        .header-controls { width: 100%; flex-wrap: wrap; }
        .search-wrapper { flex-grow: 1; width: auto; }
        .btn-label { display: none; } 
    }
</style>