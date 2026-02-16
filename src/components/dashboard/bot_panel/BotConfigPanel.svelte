<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import EventCalendarConfig from './EventCalendarConfig.svelte';
    import OverviewConfig from './OverviewConfig.svelte';
    import ChannelConfig from './ChannelConfig.svelte';
    import RemindersConfig from './RemindersConfig.svelte';
    import ArkConfig from './ArkConfig.svelte';
    import MGEConfig from './MGEConfig.svelte';

    export let selectedServer;
    export let availableServers = [];
    export let selectedServerIcon = '';

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let isServerDropdownOpen = false;

    function toggleServerDropdown(event) {
        event.stopPropagation();
        isServerDropdownOpen = !isServerDropdownOpen;
        if (isServerDropdownOpen) {
            document.addEventListener('click', closeServerDropdown);
        }
    }

    function closeServerDropdown() {
        isServerDropdownOpen = false;
        document.removeEventListener('click', closeServerDropdown);
    }

    function handleSelectServer(server) {
        isServerDropdownOpen = false;
        dispatch('selectServer', server);
    }

    function getIcon(server) {
        if (server.icon) return `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&background=2d2d2d&color=fff`;
    }

    let activeTab = 'overview';
    let loading = false;
    let currentSettings = {};
    let guildChannels = [];

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
            currentSettings = settingsRes?.settings || {};
            guildChannels = channelsRes?.channels || [];
        } catch (e) {
            console.error("Failed to load server data", e);
        } finally {
            loading = false;
        }
    }

    function handleSettingsUpdate(e) {
        currentSettings = e.detail.settings;
    }
</script>

<div class="panel-container">
    {#if !selectedServer}
        <div class="no-server-selected">
            <i class="fas fa-server" style="font-size: 4rem; color: var(--bg-tertiary); margin-bottom: 20px;"></i>
            <h2>No Server Selected</h2>
            <p>Please select a server from the dropdown to configure the bot.</p>
            <div class="no-server-selector" style="margin-top: 20px;">
                <button class="server-select-btn" on:click={toggleServerDropdown}>
                    <span class="server-name placeholder">Select Server...</span>
                    <i class="fas fa-chevron-down chevron-icon" class:open={isServerDropdownOpen}></i>
                </button>
                {#if isServerDropdownOpen}
                    <div class="server-dropdown">
                        {#each availableServers as server}
                            <button class="server-option" on:click={() => handleSelectServer(server)}>
                                <img src={getIcon(server)} alt="" class="server-icon-mini" />
                                <span>{server.name}</span>
                            </button>
                        {/each}
                        {#if availableServers.length === 0}
                            <div class="server-option empty">No common servers found</div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="dashboard-header">
            <div>
                <h1>Codex Helper Configuration</h1>
            </div>

            <div class="config-tabs">
                <button class="config-tab-btn" class:active={activeTab === 'overview'} on:click={() => activeTab = 'overview'}>
                    <i class="fas fa-tachometer-alt"></i> Overview
                </button>
                <button class="config-tab-btn" class:active={activeTab === 'channels'} on:click={() => activeTab = 'channels'}>
                    <i class="fas fa-network-wired"></i> Channels
                </button>
                <button class="config-tab-btn" class:active={activeTab === 'calendar'} on:click={() => activeTab = 'calendar'}>
                    <i class="fas fa-calendar-alt"></i> Event Calendar
                </button>
                <button class="config-tab-btn" class:active={activeTab === 'reminders'} on:click={() => activeTab = 'reminders'}>
                    <i class="fas fa-bell"></i> Reminders
                </button>
                <button class="config-tab-btn" class:active={activeTab === 'mge'} on:click={() => activeTab = 'mge'}>
                    <i class="fas fa-crown"></i> MGE
                </button>
                <button class="config-tab-btn" class:active={activeTab === 'ark'} on:click={() => activeTab = 'ark'}>
                    <i class="fas fa-scroll"></i> Ark
                </button>
            </div>

            <div class="header-server-selector">
                <button class="server-select-btn" on:click={toggleServerDropdown}>
                    <div class="server-btn-content">
                        <img src={getIcon(selectedServer)} alt="" class="server-icon-mini" />
                        <span class="server-name">{selectedServer.name}</span>
                    </div>
                    <i class="fas fa-chevron-down chevron-icon" class:open={isServerDropdownOpen}></i>
                </button>
                {#if isServerDropdownOpen}
                    <div class="server-dropdown">
                        {#each availableServers as server}
                            <button class="server-option" on:click={() => handleSelectServer(server)}>
                                <img src={getIcon(server)} alt="" class="server-icon-mini" />
                                <span>{server.name}</span>
                            </button>
                        {/each}
                        {#if availableServers.length === 0}
                            <div class="server-option empty">No common servers found</div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>

        <div class="panel-content">
            {#if loading}
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i> Loading configuration...
                </div>
            {:else if activeTab === 'overview'}
                <OverviewConfig {selectedServer} {guildChannels} channelSettings={currentSettings} on:deauthorized={() => dispatch('selectServer', null)} />

            {:else if activeTab === 'channels'}
                <ChannelConfig 
                    guildId={selectedServer.id} 
                    {guildChannels} 
                    initialSettings={currentSettings}
                    on:settingsUpdated={handleSettingsUpdate} 
                />

            {:else if activeTab === 'calendar'}
                <EventCalendarConfig guildId={selectedServer.id} channels={guildChannels} />
                
            {:else if activeTab === 'reminders'}
                <RemindersConfig 
                    guildId={selectedServer.id} 
                    channels={guildChannels} 
                />
            {:else if activeTab === 'ark'}
                <ArkConfig guildId={selectedServer.id} />
            {:else if activeTab === 'mge'}
                <MGEConfig guildId={selectedServer.id} />
            {/if}
        </div>
    {/if}
</div>

<style>
    .panel-container { display: flex; flex-direction: column; gap: 20px; }
    .no-server-selected { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; text-align: center; opacity: 0.6; }
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 10px;
        gap: 16px;
        flex-wrap: nowrap;
    }
    .dashboard-header h1 { font-size: 1.4rem; font-weight: 700; margin: 0; color: var(--text-primary); white-space: nowrap; }
    .config-tabs {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    .config-tab-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: color 0.2s;
        font-weight: 500;
        font-size: var(--font-size-sm);
        position: relative;
        white-space: nowrap;
    }
    .config-tab-btn:hover { color: var(--text-primary); }
    .config-tab-btn.active { color: var(--accent-blue); }
    .config-tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-blue);
    }
    .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); font-size: 1.1rem; }

    /* Server Selector */
    .no-server-selector, .header-server-selector {
        position: relative;
        z-index: 20;
    }

    .server-select-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 6px 14px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: pointer;
        font-weight: 500;
        font-size: var(--font-size-sm);
        transition: all 0.2s ease;
        min-width: 220px;
        height: 38px;
    }

    .server-select-btn:hover {
        background: var(--bg-secondary);
        border-color: var(--border-hover);
    }

    .server-btn-content {
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
    }

    .server-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 160px;
        display: block;
    }

    .server-name.placeholder {
        color: var(--text-muted);
    }

    .chevron-icon {
        font-size: 0.7em;
        opacity: 0.7;
        transition: transform 0.2s ease;
    }

    .chevron-icon.open {
        transform: rotate(180deg);
    }

    .server-icon-mini {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .server-dropdown {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        width: 100%;
        min-width: 220px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 100;
        overflow-y: auto;
        max-height: 400px;
        display: flex;
        flex-direction: column;
    }

    .server-option {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 14px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255,255,255,0.04);
        color: var(--text-secondary);
        cursor: pointer;
        text-align: left;
        font-size: var(--font-size-sm);
        transition: all 0.15s ease;
        flex-shrink: 0;
        height: 46px;
    }

    .server-option span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
    }

    .server-option:last-child {
        border-bottom: none;
    }

    .server-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }

    .server-option.empty {
        cursor: default;
        font-style: italic;
        padding: 15px;
        text-align: center;
        justify-content: center;
    }

    @media (max-width: 768px) {
        .dashboard-header { flex-direction: column; align-items: flex-start; }
        .config-tabs { grid-template-columns: 1fr; min-width: auto; width: 100%; margin-top: 15px; }
    }
</style>