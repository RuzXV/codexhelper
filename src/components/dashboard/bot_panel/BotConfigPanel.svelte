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
            <p>Please select a server from the top right dropdown to configure the bot.</p>
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
                
            </div>
        </div>

        <div class="panel-content">
            {#if loading}
                <div class="loading-state">
                    <i class="fas fa-spinner fa-spin"></i> Loading configuration...
                </div>
            {:else if activeTab === 'overview'}
                <OverviewConfig {selectedServer} {guildChannels} channelSettings={currentSettings} />

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
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); margin-bottom: 10px; }
    .dashboard-header h1 { font-size: 1.8rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .config-tabs { 
        display: flex;
        gap: 10px; 
        overflow-x: auto;
        padding-bottom: 5px;
    }
    .config-tab-btn { background: var(--bg-tertiary); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-secondary); padding: 12px 16px; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; font-weight: 600; font-size: 0.9rem; }
    .config-tab-btn.active { background: var(--accent-blue-light, rgba(59, 130, 246, 0.1)); color: var(--accent-blue); border-color: var(--accent-blue); }
    .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); font-size: 1.1rem; }
    @media (max-width: 768px) {
        .dashboard-header { flex-direction: column; align-items: flex-start; }
        .config-tabs { grid-template-columns: 1fr; min-width: auto; width: 100%; margin-top: 15px; }
    }
</style>