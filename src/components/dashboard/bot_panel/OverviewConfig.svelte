<script>
    import { fade } from 'svelte/transition';

    export let selectedServer;
    export let guildChannels = [];
    export let channelSettings = {};

    const GROUP_LABELS = {
        "all_commands": "All Commands",
        "commands_commanders": "Commander Info",
        "commands_meta_lineups": "Meta Lineups",
        "commands_kvk": "KvK Commands",
        "commands_event_info": "Event Info",
        "commands_bundle_info": "Bundle Info"
    };

    let loading = true;
    let patron = null;
    let features = {
        ark: { enabled: false, channel_id: null },
        mge: { enabled: false, channel_id: null },
        ruins: { enabled: false, channel_id: null },
        altar: { enabled: false, channel_id: null },
        calendar: { enabled: false, channel_id: null }
    };

    $: if (selectedServer) {
        loadFeatureStatus(selectedServer.id);
    }

    async function loadFeatureStatus(guildId) {
        loading = true;
        try {
            const featureRes = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/features`);
            const calendarRes = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/calendar`);
            
            features = {
                ...featureRes.features,
                calendar: {
                    enabled: calendarRes.config?.channel_id && calendarRes.config?.channel_id !== 'none',
                    channel_id: calendarRes.config?.channel_id
                }
            };

            patron = featureRes.patron || null;

        } catch (e) {
            console.error("Failed to load overview data", e);
        } finally {
            loading = false;
        }
    }

    function getChannelMention(id) {
        if (!id || id === 'none') return "Not Set";
        const ch = guildChannels.find(c => c.id === id);
        return ch ? `#${ch.name}` : `<#${id}>`;
    }

    function getAvatarUrl(user) {
        if (user.avatar) {
            return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        }
        return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || 0) % 5}.png`;
    }
</script>

<div class="overview-container" transition:fade={{ duration: 200 }}>
    <div class="overview-header">
        <div class="header-left">
            <div class="server-identity">
                {#if selectedServer.icon}
                    <img src={`https://cdn.discordapp.com/icons/${selectedServer.id}/${selectedServer.icon}.png`} alt="" class="server-icon-lg" />
                {:else}
                    <div class="server-icon-placeholder">{selectedServer.name.substring(0, 2)}</div>
                {/if}
                <div class="server-text">
                    <h2>{selectedServer.name}</h2>
                    <span class="server-id">ID: {selectedServer.id}</span>
                </div>
            </div>
        </div>

        <div class="header-right">
            {#if patron}
                <div class="patron-badge" class:bypass={patron.is_bypass}>
                    <div class="patron-label">
                        {patron.is_bypass ? 'Granted Access By' : 'Authorized By'}
                    </div>
                    <div class="patron-info">
                        <img src={getAvatarUrl(patron)} alt="" class="patron-avatar" />
                        <span class="patron-name">
                            {patron.is_bypass ? 'Ruz' : patron.username}
                        </span>
                    </div>
                </div>
            {:else if !loading}
                <div class="patron-badge warning">
                    <span class="patron-label">Authorization Unknown</span>
                </div>
            {/if}
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <i class="fas fa-circle-notch fa-spin"></i> Loading Overview...
        </div>
    {:else}
        <div class="overview-grid">
            <div class="info-card">
                <div class="card-header">
                    <h3><i class="fas fa-network-wired"></i> Command Channels</h3>
                </div>
                <div class="card-content">
                    <ul class="status-list">
                        {#each Object.entries(GROUP_LABELS) as [key, label]}
                            <li class="status-item">
                                {#if channelSettings[key] && channelSettings[key] !== 'none'}
                                    <i class="fas fa-check-circle status-icon success"></i>
                                    <span class="label">{label}</span>
                                    <span class="value success-text">{getChannelMention(channelSettings[key])}</span>
                                {:else}
                                    <i class="fas fa-times-circle status-icon error"></i>
                                    <span class="label">{label}</span>
                                    <span class="value error-text">Not Configured</span>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>

            <div class="info-card">
                <div class="card-header">
                    <h3><i class="fas fa-cogs"></i> Feature Status</h3>
                </div>
                <div class="card-content">
                    <ul class="status-list">
                        <li class="status-item">
                            {#if features.calendar.enabled}
                                <i class="fas fa-check-circle status-icon success"></i>
                                <span class="label">Event Calendar</span>
                                <span class="value success-text">{getChannelMention(features.calendar.channel_id)}</span>
                            {:else}
                                <i class="fas fa-times-circle status-icon error"></i>
                                <span class="label">Event Calendar</span>
                                <span class="value error-text">Not Configured</span>
                            {/if}
                        </li>
                        <li class="status-item">
                            {#if features.ark.enabled}
                                <i class="fas fa-check-circle status-icon success"></i>
                                <span class="label">Ark of Osiris</span>
                                <span class="value success-text">{getChannelMention(features.ark.channel_id)}</span>
                            {:else}
                                <i class="fas fa-times-circle status-icon error"></i>
                                <span class="label">Ark of Osiris</span>
                                <span class="value error-text">Not Configured</span>
                            {/if}
                        </li>
                        <li class="status-item">
                            {#if features.mge.enabled}
                                <i class="fas fa-check-circle status-icon success"></i>
                                <span class="label">MGE Signups</span>
                                <span class="value success-text">{getChannelMention(features.mge.channel_id)}</span>
                            {:else}
                                <i class="fas fa-times-circle status-icon error"></i>
                                <span class="label">MGE Signups</span>
                                <span class="value error-text">Not Configured</span>
                            {/if}
                        </li>
                        <li class="status-item">
                            {#if features.ruins.enabled}
                                <i class="fas fa-check-circle status-icon success"></i>
                                <span class="label">Ancient Ruins</span>
                                <span class="value success-text">{getChannelMention(features.ruins.channel_id)}</span>
                            {:else}
                                <i class="fas fa-times-circle status-icon error"></i>
                                <span class="label">Ancient Ruins</span>
                                <span class="value error-text">Not Configured</span>
                            {/if}
                        </li>
                        <li class="status-item">
                            {#if features.altar.enabled}
                                <i class="fas fa-check-circle status-icon success"></i>
                                <span class="label">Altar of Darkness</span>
                                <span class="value success-text">{getChannelMention(features.altar.channel_id)}</span>
                            {:else}
                                <i class="fas fa-times-circle status-icon error"></i>
                                <span class="label">Altar of Darkness</span>
                                <span class="value error-text">Not Configured</span>
                            {/if}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .overview-container { display: flex; flex-direction: column; gap: 20px; }
    
    .overview-header {
        display: flex; justify-content: space-between; align-items: center;
        background: var(--bg-secondary); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);
        flex-wrap: wrap; gap: 20px;
    }
    
    .header-left { display: flex; align-items: center; }
    .server-identity { display: flex; align-items: center; gap: 15px; }
    .server-icon-lg { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .server-icon-placeholder { 
        width: 48px; height: 48px; border-radius: 50%; background: var(--bg-tertiary); 
        display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-secondary);
    }
    .server-text h2 { margin: 0; font-size: 1.4rem; color: var(--text-primary); }
    .server-id { font-size: 0.8rem; color: var(--text-secondary); font-family: monospace; }
    
    .patron-badge {
        background: var(--bg-tertiary);
        padding: 8px 16px;
        border-radius: 8px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--accent-blue, #3b82f6);
        transition: all 0.2s;
    }

    .patron-badge.bypass {
        border-color: var(--accent-purple, #8b5cf6);
        background: rgba(139, 92, 246, 0.1);
    }

    .patron-badge.warning {
        border-color: #f59e0b;
        color: #f59e0b;
    }

    .patron-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
        margin-bottom: 0;
        white-space: nowrap;
    }

    .patron-info {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .patron-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid var(--border-color);
    }
    
    .patron-badge.bypass .patron-avatar {
        border-color: var(--accent-purple, #8b5cf6);
    }

    .patron-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.95rem;
    }

    .overview-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;
    }

    .info-card {
        background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
    }

    .card-header {
        padding: 15px 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1);
    }
    .card-header h3 { margin: 0; font-size: 1.1rem; color: var(--text-primary); display: flex; gap: 10px; align-items: center; }

    .card-content { padding: 0; }

    .status-list { list-style: none; margin: 0; padding: 0; }
    
    .status-item {
        display: flex; align-items: center; padding: 12px 20px; border-bottom: 1px solid var(--border-color);
        font-size: 0.95rem; gap: 12px;
    }
    .status-item:last-child { border-bottom: none; }

    .status-icon { font-size: 1.1rem; }
    .status-icon.success { color: #10b981; }
    .status-icon.error { color: var(--text-muted); opacity: 0.5; }

    .label { flex-grow: 1; color: var(--text-primary); font-weight: 500; }
    
    .value { font-size: 0.9rem; font-family: monospace; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px; }
    .success-text { color: var(--text-secondary); }
    .error-text { color: var(--text-muted); font-style: italic; }

    .loading-state { padding: 40px; text-align: center; color: var(--text-secondary); font-size: 1.1rem; }

    @media (max-width: 768px) {
        .overview-header { flex-direction: column; align-items: flex-start; gap: 15px; }
        .patron-badge { align-items: flex-start; width: 100%; }
        .overview-grid { grid-template-columns: 1fr; }
    }
</style>