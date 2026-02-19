<script>
    import { onMount, tick } from 'svelte';
    import { slide, fade } from 'svelte/transition';
    import SaveBar from '../../shared/SaveBar.svelte';
    import { fetchWithAuth } from '../../../stores/auth';

    export let guildId;
    export let channels = [];

    let loading = false;
    let saving = false;

    let config = {
        channel_id: 'none',
        create_discord_events: false,
        is_personalized: false,
        reference_date: new Date().toISOString().split('T')[0],
        reference_type: 'egg',
        reference_cycle_id: 0,
    };

    let originalConfig = null;
    let hasUnsavedChanges = false;

    let openDropdownId = null;

    const CYCLE_PATTERNS = [
        { id: 0, label: 'Helmet / Legs' },
        { id: 1, label: 'Weapon / Accessory' },
        { id: 2, label: 'Chest / Gloves / Boots' },
    ];

    onMount(async () => {
        await loadSettings();
    });

    $: if (originalConfig) {
        hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);
    }

    async function loadSettings() {
        loading = true;
        try {
            const res = await fetchWithAuth(`/api/guilds/${guildId}/calendar`);
            if (res && res.config) {
                config = {
                    ...config,
                    channel_id: res.config.channel_id,
                    create_discord_events: res.config.create_discord_events,
                    is_personalized: res.config.is_personalized,
                    reference_cycle_id: res.config.anchor_cycle_id ?? 0,
                };

                if (res.config.anchor_date) {
                    config.reference_date = res.config.anchor_date;
                    config.reference_type = 'egg';
                }

                originalConfig = JSON.parse(JSON.stringify(config));
            }
        } catch (e) {
            console.error('Failed to load calendar settings', e);
        } finally {
            loading = false;
        }
    }

    async function saveSettings() {
        saving = true;
        try {
            const payload = { ...config, reference_type: 'egg' };

            await fetchWithAuth(`/api/guilds/${guildId}/calendar`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            originalConfig = JSON.parse(JSON.stringify(config));
            hasUnsavedChanges = false;
        } catch (e) {
            console.error('Failed to save', e);
            alert('Failed to save settings. Please try again.');
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        if (originalConfig) {
            config = JSON.parse(JSON.stringify(originalConfig));
            hasUnsavedChanges = false;
        }
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        openDropdownId = openDropdownId === id ? null : id;
    }

    function selectOption(key, value) {
        config[key] = value;
        openDropdownId = null;
    }

    function getChannelName(id) {
        if (id === 'none' || !id) return '⛔ Disabled / Not Set';
        const ch = channels.find((c) => c.id === id);
        return ch ? `# ${ch.name}` : 'Unknown Channel';
    }

    function getPatternLabel(id) {
        const p = CYCLE_PATTERNS.find((x) => x.id === id);
        return p ? p.label : 'Select Pattern';
    }
</script>

<svelte:window on:click={() => (openDropdownId = null)} />

<div class="calendar-config-container" transition:fade={{ duration: 200 }}>
    {#if loading}
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Loading calendar settings...
        </div>
    {:else}
        <div class="section-card">
            <div class="section-header">
                <h3><i class="fas fa-calendar-alt"></i> General Configuration</h3>
                <p class="section-desc">
                    Set up where the event tracker embed is posted and how the bot interacts with Discord events.
                </p>
            </div>

            <div class="settings-body">
                <div class="setting-group">
                    <label for="tracker-channel-trigger">Tracker Channel</label>
                    <div class="custom-select-container">
                        <button
                            type="button"
                            id="tracker-channel-trigger"
                            class="custom-select-trigger"
                            class:active={openDropdownId === 'channel'}
                            on:click={(e) => toggleDropdown('channel', e)}
                        >
                            <span>{getChannelName(config.channel_id)}</span>
                            <i class="fas fa-chevron-down arrow"></i>
                        </button>

                        {#if openDropdownId === 'channel'}
                            <div class="custom-dropdown-menu" transition:slide={{ duration: 150 }}>
                                <button
                                    type="button"
                                    class="dropdown-option danger"
                                    on:click={() => selectOption('channel_id', 'none')}
                                >
                                    ⛔ Disabled / Not Set
                                </button>
                                {#each channels as channel}
                                    <button
                                        type="button"
                                        class="dropdown-option"
                                        class:selected={config.channel_id === channel.id}
                                        on:click={() => selectOption('channel_id', channel.id)}
                                    >
                                        <span class="hash">#</span>
                                        {channel.name}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <p class="help-text">The bot will post and auto-update the event tracker embed in this channel.</p>
                </div>

                <div class="setting-group checkbox-row">
                    <div class="text-col">
                        <label for="discord-events">Create Discord Scheduled Events</label>
                        <p class="help-text">
                            Automatically create Discord Scheduled Events for upcoming game events (Requires 'Manage
                            Events' permission).
                        </p>
                    </div>
                    <div class="toggle-wrapper">
                        <input type="checkbox" id="discord-events" bind:checked={config.create_discord_events} />
                        <label for="discord-events" class="toggle-switch"></label>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-card">
            <div class="section-header">
                <h3><i class="fas fa-cogs"></i> Rotation Personalization</h3>
                <p class="section-desc">
                    Calibrate the "Hunt for History" (Hammer) and "Holy Knight's Treasure" (Egg) rotation for your
                    kingdom.
                </p>
            </div>

            <div class="settings-body">
                <div class="setting-group checkbox-row">
                    <div class="text-col">
                        <label for="personalization-toggle">Enable Personalized Rotation</label>
                        <p class="help-text">
                            If <strong>enabled</strong>, the bot will show specific blueprint pattern rotations (e.g.
                            Helmet/Legs) for your kingdom's cycle. If <strong>disabled</strong>, it uses a generic
                            label.
                        </p>
                    </div>
                    <div class="toggle-wrapper">
                        <input type="checkbox" id="personalization-toggle" bind:checked={config.is_personalized} />
                        <label for="personalization-toggle" class="toggle-switch"></label>
                    </div>
                </div>

                {#if config.is_personalized}
                    <div class="personalization-options" transition:slide>
                        <div class="info-note">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <strong>Calibration Required:</strong><br />
                                Please select a date of a recent <strong>Holy Knight's Treasure</strong> and specify
                                which <strong>blueprint pattern</strong> appeared during that event.
                            </div>
                        </div>

                        <div class="calibration-grid">
                            <div class="setting-group">
                                <label for="calibration-date">Date of Holy Knight's Treasure (Egg)</label>
                                <input
                                    type="date"
                                    id="calibration-date"
                                    class="modern-date-input clickable-date"
                                    bind:value={config.reference_date}
                                    required
                                    on:click={(e) => e.currentTarget.showPicker()}
                                    on:keydown|preventDefault
                                />
                            </div>

                            <div class="setting-group">
                                <label for="pattern-trigger">Which Pattern was active?</label>
                                <div class="custom-select-container">
                                    <button
                                        type="button"
                                        id="pattern-trigger"
                                        class="custom-select-trigger"
                                        class:active={openDropdownId === 'pattern'}
                                        on:click={(e) => toggleDropdown('pattern', e)}
                                    >
                                        <span>{getPatternLabel(config.reference_cycle_id)}</span>
                                        <i class="fas fa-chevron-down arrow"></i>
                                    </button>

                                    {#if openDropdownId === 'pattern'}
                                        <div class="custom-dropdown-menu" transition:slide={{ duration: 150 }}>
                                            {#each CYCLE_PATTERNS as pattern}
                                                <button
                                                    type="button"
                                                    class="dropdown-option"
                                                    class:selected={config.reference_cycle_id === pattern.id}
                                                    on:click={() => selectOption('reference_cycle_id', pattern.id)}
                                                >
                                                    {pattern.label}
                                                </button>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <SaveBar {hasUnsavedChanges} {saving} on:save={saveSettings} on:discard={discardChanges} />
</div>

<style>
    .calendar-config-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 80px;
    }

    .section-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: visible;
    }
    .section-header {
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid var(--border-color);
    }
    .section-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .section-desc {
        margin: 5px 0 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
    }
    .settings-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    .setting-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .setting-group label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.95rem;
    }
    .help-text {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.4;
    }
    .help-text strong {
        color: var(--text-primary);
    }

    .custom-select-container {
        position: relative;
        width: 100%;
        max-width: 400px;
    }
    .custom-select-trigger {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        color: var(--text-primary);
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    .custom-select-trigger:hover,
    .custom-select-trigger.active {
        border-color: var(--accent-blue);
    }
    .arrow {
        font-size: 0.8rem;
        opacity: 0.7;
        transition: transform 0.2s;
    }
    .active .arrow {
        transform: rotate(180deg);
    }

    .clickable-date {
        cursor: pointer;
    }

    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        width: 100%;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        z-index: 100;
        overflow: hidden;
        max-height: 250px;
        overflow-y: auto;
    }
    .dropdown-option {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        display: block;
        padding: 10px 16px;
        cursor: pointer;
        color: var(--text-secondary);
        transition: background 0.2s;
        font-size: 0.9rem;
    }
    .dropdown-option:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    .dropdown-option.selected {
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-blue);
        font-weight: 500;
    }
    .dropdown-option.danger {
        color: #ef4444;
    }
    .dropdown-option.danger:hover {
        background: rgba(239, 68, 68, 0.1);
    }
    .hash {
        opacity: 0.5;
        margin-right: 5px;
    }

    .checkbox-row {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-tertiary);
        padding: 15px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
    }
    .toggle-wrapper {
        position: relative;
        width: 50px;
        height: 26px;
    }
    .toggle-wrapper input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .toggle-switch {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--bg-primary);
        transition: 0.4s;
        border-radius: 34px;
        border: 1px solid var(--border-color);
    }
    .toggle-switch:before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: var(--text-secondary);
        transition: 0.4s;
        border-radius: 50%;
    }
    input:checked + .toggle-switch {
        background-color: var(--accent-blue);
        border-color: var(--accent-blue);
    }
    input:checked + .toggle-switch:before {
        transform: translateX(24px);
        background-color: white;
    }

    .calibration-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
        align-items: start;
    }

    .modern-date-input {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 12px;
        border-radius: 8px;
        width: 100%;
        font-family: inherit;
        font-size: 0.95rem;
    }
    .modern-date-input::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
    }

    .personalization-options {
        margin-top: 10px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }
    .info-note {
        background: rgba(59, 130, 246, 0.1);
        border-left: 3px solid var(--accent-blue);
        padding: 15px;
        border-radius: 4px;
        color: var(--text-secondary);
        font-size: 0.9rem;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 20px;
        line-height: 1.5;
    }

    .info-note i {
        color: var(--accent-blue);
        margin-top: 3px;
        font-size: 1rem;
    }

    @media (max-width: 768px) {
        .checkbox-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
        }
        .toggle-wrapper {
            align-self: flex-end;
        }
        .calibration-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
