<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import MGEApplicationsPanel from './MGEApplicationsPanel.svelte';
    import SaveBar from '../../shared/SaveBar.svelte';
    import { fetchWithAuth } from '../../../stores/auth.js';

    export let guildId;
    export let channels = [];
    export let roles = [];

    let activeSubTab = 'settings';
    let loading = true;
    let saving = false;
    let settings = {};
    let originalSettings = {};
    let openDropdownId = null;
    let dropdownSearch = '';

    $: hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

    $: activeMgeName = settings.current_mge_name || null;
    $: mgeTroopType = settings.mge_troop_type || null;

    const FIELDS = [
        { id: 'signup_channel_id', label: 'Signup Channel', icon: 'fa-file-signature', type: 'channel' },
        { id: 'posted_signups_channel_id', label: 'Application Threads Channel', icon: 'fa-comments', type: 'channel' },
        { id: 'coordinator_role_id', label: 'Coordinator Role', icon: 'fa-user-cog', type: 'role' },
        { id: 'ping_role_id', label: 'Ping Role', icon: 'fa-at', type: 'role' },
    ];

    onMount(async () => {
        try {
            const settingsRes = await fetchWithAuth(`/api/guilds/${guildId}/mge`);
            settings = settingsRes?.config || {};
            originalSettings = { ...settings };
        } catch (e) {
            console.error('Failed to load MGE settings', e);
        } finally {
            loading = false;
        }
    });

    async function saveSettings() {
        saving = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/mge`, {
                method: 'POST',
                body: JSON.stringify(settings),
            });
            originalSettings = { ...settings };
        } catch (e) {
            alert('Failed to save settings.');
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        settings = { ...originalSettings };
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        dropdownSearch = '';
        openDropdownId = openDropdownId === id ? null : id;
        if (openDropdownId) setTimeout(() => document.getElementById(`search-${id}`)?.focus(), 50);
    }

    function selectItem(fieldId, value) {
        settings[fieldId] = value;
        openDropdownId = null;
    }

    function getItemName(id, type) {
        if (!id || id === 'none') return '⛔ Disabled / Not Set';
        if (type === 'channel') {
            const ch = channels.find((c) => c.id === id);
            return ch ? `# ${ch.name}` : 'Unknown Channel';
        } else {
            const r = roles.find((r) => r.id === id);
            return r ? `@${r.name}` : 'Unknown Role';
        }
    }

    function handleWindowClick() {
        openDropdownId = null;
    }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="mge-container">
    <div class="mge-subtabs">
        <button class="subtab" class:active={activeSubTab === 'settings'} on:click={() => (activeSubTab = 'settings')}>
            <i class="fas fa-cog"></i> Settings
        </button>
        <button
            class="subtab"
            class:active={activeSubTab === 'applications'}
            on:click={() => (activeSubTab = 'applications')}
        >
            <i class="fas fa-file-alt"></i> Applications
        </button>
    </div>

    {#if activeSubTab === 'settings'}
        {#if !loading && activeMgeName}
            <div class="mge-status-banner active" transition:fade={{ duration: 150 }}>
                <div class="status-icon"><i class="fas fa-shield-alt"></i></div>
                <div class="status-info">
                    <span class="status-label">Active MGE</span>
                    <span class="status-value">{activeMgeName}{mgeTroopType ? ` (${mgeTroopType})` : ''}</span>
                </div>
                {#if settings.next_mge_date}
                    <div class="status-extra">
                        <span class="status-label">Next MGE</span>
                        <span class="status-value">{settings.next_mge_date}</span>
                    </div>
                {/if}
            </div>
        {:else if !loading}
            <div class="mge-status-banner inactive" transition:fade={{ duration: 150 }}>
                <div class="status-icon"><i class="fas fa-moon"></i></div>
                <div class="status-info">
                    <span class="status-label">No Active MGE</span>
                    <span class="status-value muted">No MGE cycle is currently running.</span>
                </div>
                {#if settings.next_mge_date}
                    <div class="status-extra">
                        <span class="status-label">Next MGE</span>
                        <span class="status-value">{settings.next_mge_date}</span>
                    </div>
                {/if}
            </div>
        {/if}

        <div class="section-card" transition:fade={{ duration: 150 }}>
            <div class="section-header">
                <h3><i class="fas fa-crown"></i> Mightiest Governor (MGE)</h3>
                <p class="section-desc">Configure MGE application channels and administrative access.</p>
            </div>

            {#if loading}
                <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading settings...</div>
            {:else if !settings.signup_channel_id && !settings.posted_signups_channel_id && !settings.coordinator_role_id && !settings.ping_role_id && !activeMgeName}
                <div class="mge-not-setup">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>MGE Not Set Up</strong>
                        <p>
                            The MGE system hasn't been initialized for this server yet. Use the <code>/mge setup</code> command
                            in Discord to create your first MGE cycle, then return here to configure channels and roles.
                        </p>
                    </div>
                </div>
            {:else}
                <div class="settings-grid">
                    {#each FIELDS as field}
                        <div class="setting-row">
                            <div class="group-info">
                                <div class="group-title-row">
                                    <i class="fas {field.icon} group-icon"></i>
                                    <span class="group-name" id="label-{field.id}">{field.label}</span>
                                </div>
                            </div>

                            <div class="control-wrapper">
                                <div class="custom-select-container">
                                    <button
                                        type="button"
                                        class="custom-select-trigger"
                                        aria-labelledby="label-{field.id}"
                                        on:click={(e) => toggleDropdown(field.id, e)}
                                        disabled={saving}
                                    >
                                        <span class="selected-text">{getItemName(settings[field.id], field.type)}</span>
                                        <i class="fas fa-chevron-down arrow" class:rotated={openDropdownId === field.id}
                                        ></i>
                                    </button>

                                    {#if openDropdownId === field.id}
                                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                                        <div class="custom-dropdown-menu" on:click|stopPropagation>
                                            <div class="dropdown-search">
                                                <input
                                                    id="search-{field.id}"
                                                    type="text"
                                                    placeholder="Search..."
                                                    bind:value={dropdownSearch}
                                                />
                                            </div>
                                            <div class="dropdown-options-list">
                                                <button
                                                    type="button"
                                                    class="dropdown-option danger"
                                                    class:selected={!settings[field.id]}
                                                    on:click={() => selectItem(field.id, null)}
                                                >
                                                    ⛔ Disabled / Not Set
                                                </button>

                                                {#if field.type === 'channel'}
                                                    {#each channels.filter((c) => c.name
                                                            .toLowerCase()
                                                            .includes(dropdownSearch.toLowerCase())) as item}
                                                        <button
                                                            type="button"
                                                            class="dropdown-option"
                                                            class:selected={settings[field.id] === item.id}
                                                            on:click={() => selectItem(field.id, item.id)}
                                                        >
                                                            <span class="channel-hash">#</span>
                                                            {item.name}
                                                        </button>
                                                    {/each}
                                                {:else}
                                                    {#each roles.filter((r) => r.name
                                                            .toLowerCase()
                                                            .includes(dropdownSearch.toLowerCase())) as item}
                                                        <button
                                                            type="button"
                                                            class="dropdown-option"
                                                            class:selected={settings[field.id] === item.id}
                                                            on:click={() => selectItem(field.id, item.id)}
                                                        >
                                                            <span
                                                                class="role-dot"
                                                                style="background-color: #{item.color
                                                                    ? item.color.toString(16)
                                                                    : '99aab5'}"
                                                            ></span>
                                                            {item.name}
                                                        </button>
                                                    {/each}
                                                {/if}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <SaveBar {hasUnsavedChanges} {saving} on:save={saveSettings} on:discard={discardChanges} />
    {:else if activeSubTab === 'applications'}
        <div transition:fade={{ duration: 150 }}>
            <MGEApplicationsPanel {guildId} />
        </div>
    {/if}
</div>

<style>
    .mge-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .mge-subtabs {
        display: flex;
        gap: 4px;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 0;
    }
    .subtab {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 10px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: var(--font-size-sm);
        position: relative;
        transition: color 0.2s;
        white-space: nowrap;
    }
    .subtab:hover {
        color: var(--text-primary);
    }
    .subtab.active {
        color: var(--accent-blue);
    }
    .subtab.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-blue);
    }

    .mge-status-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 20px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .mge-status-banner.active {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
    }
    .mge-status-banner.inactive {
        background: rgba(245, 158, 11, 0.06);
        border-color: rgba(245, 158, 11, 0.2);
    }
    .status-icon {
        font-size: 1.4rem;
    }
    .mge-status-banner.active .status-icon {
        color: #10b981;
    }
    .mge-status-banner.inactive .status-icon {
        color: #f59e0b;
    }
    .status-info,
    .status-extra {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .status-extra {
        margin-left: auto;
        text-align: right;
    }
    .status-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        font-weight: 600;
    }
    .status-value {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-primary);
    }
    .status-value.muted {
        color: var(--text-muted);
        font-weight: 400;
        font-size: 0.85rem;
    }

    .section-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: visible;
        margin-bottom: 20px;
    }
    .section-header {
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.1);
    }
    .section-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1rem;
    }
    .section-desc {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-top: 5px;
        margin-left: 28px;
    }
    .loading-state {
        padding: 40px;
        text-align: center;
        color: var(--text-secondary);
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
        position: relative;
    }
    .selected-text {
        text-align: center;
        flex-grow: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        border: none;
        display: flex;
        padding: 8px 12px;
        color: var(--text-secondary);
        cursor: pointer;
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
    .role-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        display: inline-block;
    }
    .mge-not-setup {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 20px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.5;
    }
    .mge-not-setup i {
        color: var(--accent-blue);
        margin-top: 3px;
        font-size: 1.1rem;
    }
    .mge-not-setup strong {
        color: var(--text-primary);
        display: block;
        margin-bottom: 4px;
    }
    .mge-not-setup p {
        margin: 0;
    }
    .mge-not-setup code {
        background: var(--bg-primary);
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 0.85em;
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
