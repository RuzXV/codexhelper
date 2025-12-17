<script>
    import { onMount } from 'svelte';
    const COMMAND_GROUPS = [
        { id: "commands_commanders", label: "Commander Info" },
        { id: "commands_meta_lineups", label: "Meta Lineups" },
        { id: "commands_kvk", label: "KvK Commands" },
        { id: "commands_event_info", label: "Event Info" },
        { id: "commands_bundle_info", label: "Bundle Info" },
        { id: "all_commands", label: "All Commands" }
    ];

    export let guildId;
    export let channels = [];
    
    let currentSettings = {};
    let loading = false;
    let saving = false;

    onMount(async () => {
        loading = true;
        try {
            const res = await window.auth.fetchWithAuth(`/api/guilds/${guildId}/settings/channels`);
            currentSettings = res.settings || {};
        } catch (e) {
            console.error("Failed to load channel settings", e);
        }
        loading = false;
    });

    async function saveSetting(groupId, channelId) {
        saving = true;
        try {
            currentSettings[groupId] = channelId;

            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/settings/channels`, {
                method: 'POST',
                body: JSON.stringify({
                    command_group: groupId,
                    channel_id: channelId,
                    action: channelId === 'none' ? 'Remove Channel' : 'Add Channel'
                })
            });
            
        } catch (e) {
            console.error("Failed to save", e);
            alert("Failed to save setting.");
        } finally {
            saving = false;
        }
    }
</script>

<div class="channel-config-container">
    <h3><i class="fas fa-network-wired"></i> Command Channel Restrictions</h3>
    <p class="sub-text">Select which channels specific command groups are allowed to be used in.</p>

    {#if loading}
        <div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading settings...</div>
    {:else}
        <div class="settings-grid">
            {#each COMMAND_GROUPS as group}
                <div class="setting-row">
                    <div class="group-info">
                        <span class="group-name">{group.label}</span>
                        <code class="group-id">{group.id}</code>
                    </div>
                    
                    <div class="channel-select-wrapper">
                        <select 
                            value={currentSettings[group.id] || 'none'} 
                            on:change={(e) => saveSetting(group.id, e.target.value)}
                            disabled={saving}
                        >
                            <option value="none">⛔ No Restriction (or Not Set)</option>
                            {#each channels as channel}
                                <option value={channel.id}># {channel.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .channel-config-container {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .sub-text { color: var(--text-secondary); margin-bottom: 20px; font-size: 0.9rem; }
    .settings-grid { display: flex; flex-direction: column; gap: 15px; }
    .setting-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 10px; 
        background: var(--bg-tertiary); 
        border-radius: 6px;
    }
    .group-info { display: flex; flex-direction: column; }
    .group-name { font-weight: 600; color: var(--text-primary); }
    .group-id { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
    
    select {
        padding: 8px 12px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        border-radius: 4px;
        min-width: 200px;
    }
</style>