<script>
    import { onMount } from 'svelte';
    
    export let selectedServer;

    const COMMAND_GROUPS = [
        { id: "commands_commanders", label: "Commander Info", icon: "fa-chess-knight" },
        { id: "commands_meta_lineups", label: "Meta Lineups", icon: "fa-users" },
        { id: "commands_kvk", label: "KvK Commands", icon: "fa-map-marked-alt" },
        { id: "commands_event_info", label: "Event Info", icon: "fa-calendar-alt" },
        { id: "commands_bundle_info", label: "Bundle Info", icon: "fa-gift" },
        { id: "all_commands", label: "All Commands (Default)", icon: "fa-asterisk" }
    ];

    let activeTab = 'channels';
    let loading = false;
    let saving = false;
    
    let currentSettings = {};
    let guildChannels = []; 

    $: if (selectedServer) {
        loadServerData(selectedServer.id);
    }

    async function loadServerData(guildId) {
        loading = true;
        try {
            const settingsRes = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/settings/channels`);
            currentSettings = settingsRes.settings || {};

            guildChannels = [
                { id: '101', name: 'general', type: 'text' },
                { id: '102', name: 'bot-commands', type: 'text' },
                { id: '103', name: 'officer-chat', type: 'text' },
                { id: '104', name: 'kvk-strategies', type: 'forum' }
            ];

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
</script>

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
                <h1>{selectedServer.name}</h1>
                <p>Manage bot behavior and command restrictions.</p>
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
                            Restrict specific command groups to specific channels. 
                            If set to "No Restriction", commands work in all allowed channels.
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
                                    <code class="group-id">{group.id}</code>
                                </div>
                                
                                <div class="control-wrapper">
                                    <select 
                                        class="modern-select"
                                        value={currentSettings[group.id] || 'none'} 
                                        on:change={(e) => saveChannelSetting(group.id, e.target.value)}
                                        disabled={saving}
                                    >
                                        <option value="none">⛔ No Restriction</option>
                                        {#each guildChannels as channel}
                                            <option value={channel.id}># {channel.name}</option>
                                        {/each}
                                    </select>
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
    /* Layout */
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

    .config-tabs {
        display: flex;
        gap: 10px;
    }

    .config-tab-btn {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
    }

    .config-tab-btn.active {
        background: var(--accent-blue);
        color: white;
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
        overflow: hidden;
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

    .group-id {
        font-family: monospace;
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: rgba(0,0,0,0.2);
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
        margin-left: 30px;
    }

    .modern-select {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 10px 14px;
        border-radius: 6px;
        min-width: 220px;
        cursor: pointer;
        font-size: 0.95rem;
    }

    .modern-select:hover {
        border-color: var(--text-secondary);
    }

    .modern-select:focus {
        border-color: var(--accent-blue);
        outline: none;
    }

    .loading-state {
        padding: 40px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 1.1rem;
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
        .modern-select {
            width: 100%;
        }
    }
</style>