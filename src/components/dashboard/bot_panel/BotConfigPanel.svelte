<script>
    import { onMount, tick } from 'svelte';
    import { fly } from 'svelte/transition';

    export let selectedServer;

    const COMMAND_GROUPS = [
        { id: "all_commands", label: "All Commands", icon: "fa-asterisk" },
        { id: "commands_commanders", label: "Commander Info", icon: "fa-chess-knight" },
        { id: "commands_kvk", label: "KvK Commands", icon: "fa-map-marked-alt" },
        { id: "commands_event_info", label: "Event Info", icon: "fa-calendar-alt" },
        { id: "commands_bundle_info", label: "Bundle Info", icon: "fa-gift" }
    ];

    let activeTab = 'channels';
    let loading = false;
    let saving = false;
    let currentSettings = {};
    let guildChannels = []; 
    
    let openDropdownId = null;
    let dropdownSearch = "";

    $: if (selectedServer) {
        loadServerData(selectedServer.id);
    }

    async function loadServerData(guildId) {
        loading = true;
        try {
            const [settingsRes, channelsRes] = await Promise.all([
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/settings/channels`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/channels`)
            ]);

            currentSettings = settingsRes.settings || {};
            guildChannels = channelsRes.channels || [];
            
        } catch (e) {
            console.error("Failed to load server data", e);
        } finally {
            loading = false;
        }
    }

    async function saveChannelSetting(groupId, channelId) {
        if (!selectedServer) return;
        saving = true;

        const previousValue = currentSettings[groupId];
        currentSettings[groupId] = channelId;

        try {
            const action = (channelId === 'none' || !channelId) ? 'Remove Channel' : 'Add Channel';
            
            await window.auth.fetchWithAuth(`/api/guilds/${selectedServer.id}/settings/channels`, {
                method: 'POST',
                body: JSON.stringify({
                    command_group: groupId,
                    channel_id: channelId,
                    action: action
                })
            });
        } catch (e) {
            console.error("Failed to save", e);
            alert("Failed to save setting. Check console/network.");
            currentSettings[groupId] = previousValue;
        } finally {
            saving = false;
        }
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = "";
        if (openDropdownId === id) {
            openDropdownId = null;
        } else {
            openDropdownId = id;
            tick().then(() => {
                const input = document.getElementById(`search-${id}`);
                if (input) input.focus();
            });
        }
    }

    function handleWindowClick() {
        openDropdownId = null;
    }

    function handleContainerKeydown(e) {
        e.stopPropagation();
    }

    function getChannelName(id) {
        if (!id || id === 'none') return "⛔ Disabled / Not Set";
        const ch = guildChannels.find(c => c.id === id);
        return ch ? `# ${ch.name}` : "Unknown Channel";
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="panel-container">
    {#if !selectedServer}
        <div class="no-server-selected">
            <i class="fas fa-server" style="font-size: 4rem; color: var(--bg-tertiary); margin-bottom: 20px;"></i>
            <h2>No Server Selected</h2>
            <p>Please select a server from the top right dropdown to configure the bot.</p>
        </div>
    {:else}
        <div class="dashboard-header">
            <div>
                <h1>Codex Helper Configuration</h1>
            </div>
            <div class="config-tabs">
                <button 
                    class="config-tab-btn" 
                    class:active={activeTab === 'channels'} 
                    on:click={() => activeTab = 'channels'}
                >
                    <i class="fas fa-network-wired"></i> Channels
                </button>
                <button 
                    class="config-tab-btn" 
                    class:active={activeTab === 'roles'} 
                    on:click={() => activeTab = 'roles'}
                    disabled title="Coming Soon"
                >
                    <i class="fas fa-user-tag"></i> Roles (Soon)
                </button>
            </div>
        </div>

        <div class="panel-content">
            {#if loading}
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i> Loading configuration...
                </div>
            {:else if activeTab === 'channels'}
                <div class="section-card">
                    <div class="section-header">
                        <h3>Command Restrictions</h3>
                        <p class="section-desc">
                            Select the specific channel where commands are allowed. 
                            If <strong>Disabled / Not Set</strong>, commands for that group will not work in any channel.
                        </p>
                    </div>

                    <div class="settings-grid">
                        {#each COMMAND_GROUPS as group}
                            <div class="setting-row">
                                <div class="group-info">
                                    <div class="group-title-row">
                                        <i class="fas {group.icon} group-icon"></i>
                                        <span class="group-name">{group.label}</span>
                                    </div>
                                    </div>
                                
                                <div class="control-wrapper">
                                    <div class="custom-select-container">
                                        <button 
                                            type="button"
                                            class="custom-select-trigger" 
                                            on:click={(e) => toggleDropdown(group.id, e)}
                                            disabled={saving}
                                        >
                                            <span class="selected-text">
                                                {getChannelName(currentSettings[group.id])}
                                            </span>
                                            <i class="fas fa-chevron-down arrow" class:rotated={openDropdownId === group.id}></i>
                                        </button>

                                        {#if openDropdownId === group.id}
                                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                            <div 
                                                class="custom-dropdown-menu" 
                                                role="group"
                                                on:click|stopPropagation 
                                                on:keydown|stopPropagation={handleContainerKeydown}
                                            >
                                                <div class="dropdown-search">
                                                    <input 
                                                        id="search-{group.id}"
                                                        type="text" 
                                                        placeholder="Search channels..." 
                                                        bind:value={dropdownSearch}
                                                    />
                                                </div>
                                                <div class="dropdown-options-list">
                                                    <button 
                                                        type="button"
                                                        class="dropdown-option danger"
                                                        class:selected={!currentSettings[group.id] || currentSettings[group.id] === 'none'}
                                                        on:click={() => { saveChannelSetting(group.id, 'none'); openDropdownId = null; }}
                                                    >
                                                        ⛔ Disabled / Not Set
                                                    </button>

                                                    {#each guildChannels.filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase())) as channel}
                                                        <button 
                                                            type="button"
                                                            class="dropdown-option"
                                                            class:selected={currentSettings[group.id] === channel.id}
                                                            on:click={() => { saveChannelSetting(group.id, channel.id); openDropdownId = null; }}
                                                        >
                                                            <span class="channel-hash">#</span> {channel.name}
                                                        </button>
                                                    {/each}
                                                    
                                                    {#if guildChannels.length === 0}
                                                        <div class="empty-msg">No text channels found</div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .panel-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .no-server-selected {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        text-align: center;
        opacity: 0.6;
    }

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 10px;
    }

    .dashboard-header h1 {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
    }

    .config-tabs {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        min-width: 300px;
    }

    .config-tab-btn {
        background: var(--bg-tertiary); 
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--text-secondary);
        padding: 12px 16px;
        border-radius: var(--radius-md);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.2s;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .config-tab-btn.active {
        background: var(--accent-blue-light, rgba(59, 130, 246, 0.1));
        color: var(--accent-blue);
        border-color: var(--accent-blue);
    }
    
    .config-tab-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .section-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: visible; 
    }

    .section-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        background: rgba(0,0,0,0.1);
    }

    .section-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-top: 5px;
    }

    .settings-grid {
        display: flex;
        flex-direction: column;
    }

    .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid var(--border-color);
        transition: background 0.2s;
    }

    .setting-row:last-child {
        border-bottom: none;
    }

    .setting-row:hover {
        background: var(--bg-tertiary);
    }

    .group-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .group-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .group-icon {
        color: var(--accent-blue);
        width: 20px;
        text-align: center;
    }

    .group-name {
        font-weight: 600;
        color: var(--text-primary);
    }

    .control-wrapper {
        width: 300px;
    }

    .custom-select-container {
        position: relative;
        width: 100%;
    }

    .custom-select-trigger {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.95rem;
        transition: border 0.2s;
        text-align: left;
    }
    
    .custom-select-trigger .selected-text {
        flex-grow: 1;
        text-align: left;
    }

    .custom-select-trigger:hover {
        border-color: var(--text-secondary);
    }

    .arrow {
        font-size: 0.8rem;
        opacity: 0.7;
        transition: transform 0.2s;
    }

    .arrow.rotated {
        transform: rotate(180deg);
    }

    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        width: 100%;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        z-index: 50;
        overflow: hidden;
    }

    .dropdown-search {
        padding: 8px;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-tertiary);
    }

    .dropdown-search input {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        padding: 6px 10px;
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .dropdown-search input:focus {
        outline: none;
        border-color: var(--accent-blue);
    }

    .dropdown-options-list {
        max-height: 250px;
        overflow-y: auto;
    }

    .dropdown-option {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 8px 12px;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        transition: background 0.1s;
    }

    .dropdown-option:hover {
        background: var(--accent-blue);
        color: white;
    }
    
    .dropdown-option.danger {
        color: #ef4444;
    }
    .dropdown-option.danger:hover {
        background: #ef4444;
        color: white;
    }

    .dropdown-option.selected {
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-blue);
        font-weight: 600;
    }
    
    .channel-hash {
        opacity: 0.5;
        font-weight: 400;
    }

    .loading-state {
        padding: 40px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }

    .empty-msg {
        padding: 10px;
        text-align: center;
        font-size: 0.85rem;
        color: var(--text-muted);
        font-style: italic;
    }

    @media (max-width: 768px) {
        .setting-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }
        .control-wrapper {
            width: 100%;
        }
    }
</style>