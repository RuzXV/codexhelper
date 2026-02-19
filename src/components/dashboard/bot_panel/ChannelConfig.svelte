<script>
    import { createEventDispatcher, tick } from 'svelte';
    import { fade } from 'svelte/transition';
    import SaveBar from '../../shared/SaveBar.svelte';
    import { fetchWithAuth } from '../../../stores/auth.js';

    const dispatch = createEventDispatcher();

    export let guildId;
    export let guildChannels = [];
    export let initialSettings = {};

    const COMMAND_GROUPS = [
        { id: 'all_commands', label: 'All Commands', icon: 'fa-asterisk' },
        { id: 'commands_commanders', label: 'Commander Info', icon: 'fa-chess-knight' },
        { id: 'commands_meta_lineups', label: 'Meta Lineups', icon: 'fa-shield-alt' },
        { id: 'commands_kvk', label: 'KvK Commands', icon: 'fa-map-marked-alt' },
        { id: 'commands_event_info', label: 'Event Info', icon: 'fa-calendar-alt' },
        { id: 'commands_bundle_info', label: 'Bundle Info', icon: 'fa-gift' },
    ];

    let currentSettings = { ...initialSettings };
    let originalSettings = { ...initialSettings };
    let saving = false;
    let hasUnsavedChanges = false;
    let openDropdownId = null;
    let dropdownSearch = '';

    $: hasUnsavedChanges = JSON.stringify(currentSettings) !== JSON.stringify(originalSettings);

    async function saveAllSettings() {
        saving = true;
        try {
            const changedGroups = Object.keys(currentSettings).filter(
                (groupId) => currentSettings[groupId] !== originalSettings[groupId],
            );

            for (const groupId of changedGroups) {
                const channelId = currentSettings[groupId];
                await fetchWithAuth(`/api/guilds/${guildId}/settings/channels`, {
                    method: 'POST',
                    body: JSON.stringify({
                        command_group: groupId,
                        channel_id: channelId,
                        action: channelId === 'none' || !channelId ? 'Remove Channel' : 'Add Channel',
                    }),
                });
            }
            originalSettings = { ...currentSettings };
            dispatch('settingsUpdated', { settings: currentSettings });
        } catch (e) {
            console.error('Failed to save', e);
            alert('Failed to save settings. Check console/network.');
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        currentSettings = { ...originalSettings };
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = '';
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

    function selectChannel(groupId, channelId) {
        currentSettings[groupId] = channelId;
        openDropdownId = null;
    }

    function getChannelName(id) {
        if (!id || id === 'none') return '⛔ Disabled / Not Set';
        const ch = guildChannels.find((c) => c.id === id);
        return ch ? `# ${ch.name}` : 'Unknown Channel';
    }

    function handleWindowClick() {
        openDropdownId = null;
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="section-card" transition:fade={{ duration: 200 }}>
    <div class="section-header">
        <h3>Command Restrictions</h3>
        <p class="section-desc">
            Select the specific channel where commands are allowed. If <strong>Disabled / Not Set</strong>, commands for
            that group will not work in any channel.
        </p>

        <div class="info-note">
            <i class="fas fa-info-circle"></i>
            <div class="note-text">
                <strong>Note:</strong> The <em>"All Commands"</em> setting is additive. It enables commands in the
                selected channel <strong>in addition</strong> to any channels assigned to specific groups below.
                <br /><br />
                If you want to simply restrict the bot to a single channel for everything, just set
                <strong>"All Commands"</strong> and leave the specific groups disabled.
            </div>
        </div>
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
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="custom-dropdown-menu" on:click|stopPropagation>
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
                                        class:selected={!currentSettings[group.id] ||
                                            currentSettings[group.id] === 'none'}
                                        on:click={() => selectChannel(group.id, 'none')}
                                    >
                                        ⛔ Disabled / Not Set
                                    </button>

                                    {#each guildChannels.filter((c) => c.name
                                            .toLowerCase()
                                            .includes(dropdownSearch.toLowerCase())) as channel}
                                        <button
                                            type="button"
                                            class="dropdown-option"
                                            class:selected={currentSettings[group.id] === channel.id}
                                            on:click={() => selectChannel(group.id, channel.id)}
                                        >
                                            <span class="channel-hash">#</span>
                                            {channel.name}
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

<SaveBar {hasUnsavedChanges} {saving} on:save={saveAllSettings} on:discard={discardChanges} />

<style>
    .section-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: visible;
    }
    .section-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.1);
        display: block;
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
    .setting-row:hover {
        background: var(--bg-tertiary);
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
        align-items: center;
        justify-content: center;
        padding: 10px 14px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.95rem;
        transition: border 0.2s;
        position: relative;
    }
    .selected-text {
        text-align: center;
        flex-grow: 1;
    }
    .arrow {
        font-size: 0.8rem;
        opacity: 0.7;
        transition: transform 0.2s;
        position: absolute;
        right: 14px;
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
        z-index: 50;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
    .dropdown-options-list {
        max-height: 250px;
        overflow-y: auto;
    }
    .dropdown-option {
        width: 100%;
        text-align: left;
        background: transparent;
        justify-content: flex-start;
        border: none;
        display: flex;
        padding: 8px 12px;
        color: var(--text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
    }
    .dropdown-option:hover {
        background: var(--accent-blue);
        color: white;
    }
    .dropdown-option.selected {
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-blue);
        font-weight: 600;
    }
    .dropdown-option.danger {
        color: #ef4444;
    }
    .info-note {
        margin-top: 15px;
        background: rgba(59, 130, 246, 0.1);
        border-left: 3px solid var(--accent-blue);
        padding: 12px 15px;
        border-radius: 4px;
        color: var(--text-secondary);
        font-size: 0.85rem;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        line-height: 1.4;
    }

    .info-note i {
        color: var(--accent-blue);
        margin-top: 2.2px;
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
