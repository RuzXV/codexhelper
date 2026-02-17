<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import ReminderSetupForm from './ReminderSetupForm.svelte';
    import '../../../../styles/reminders-shared.css';

    const dispatch = createEventDispatcher();

    export let reminder;
    export let channels = [];
    export let roles = [];
    export let guildId;
    export let openDropdownId = null;
    export let setupForm = null;
    export let saving = false;

    function formatTime(ts) {
        return (
            new Date(ts * 1000).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
            }) + ' UTC'
        );
    }

    function formatRelative(ts) {
        const diff = ts * 1000 - Date.now();
        if (diff < 0) return 'Starting now';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `in ${days}d ${hours}h`;
        return `in ${hours}h ${mins}m`;
    }

    function getChannelName(id) {
        if (!id || id === 'none') return '\u26D4 Disabled / Not Set';
        const ch = channels.find((c) => c.id === id);
        return ch ? `# ${ch.name}` : 'Unknown Channel';
    }

    function getNextInstances(firstTs, intervalSeconds) {
        const instances = [];
        const interval = intervalSeconds;

        let current = firstTs;
        const now = Math.floor(Date.now() / 1000);

        if (current < now) {
            const diff = now - current;
            const jumps = Math.ceil(diff / interval);
            current += jumps * interval;
        }

        for (let i = 0; i < 5; i++) {
            instances.push(current + i * interval);
        }
        return instances;
    }

    function formatIntervalLabel(seconds) {
        if (seconds === 3600) return '1 hour';
        if (seconds === 14400) return '4 hours';
        if (seconds === 28800) return '8 hours';
        return `${seconds / 3600}h`;
    }

    function getReminderIntervals(rem) {
        if (!rem.reminder_intervals_seconds) return '4 hours';
        return rem.reminder_intervals_seconds
            .split(',')
            .map((s) => formatIntervalLabel(parseInt(s)))
            .join(', ');
    }

    function handleToggleDropdown(id, event) {
        event.stopPropagation();
        dispatch('toggleDropdown', { id });
    }

    function handleChannelSelect(channelId) {
        reminder.channel_id = channelId;
        dispatch('toggleDropdown', { id: null });
        dispatch('change');
    }

    function handleActiveToggle() {
        dispatch('change');
    }

    function handleDiscordEventToggle() {
        dispatch('change');
    }

    function handleShiftTime(minutes) {
        dispatch('shiftTime', { item: reminder, minutes });
    }

    function handleSetupSubmit(e) {
        if (e.detail && e.detail.init) {
            dispatch('initSetup', { type: reminder.reminder_type });
        } else {
            dispatch('submitSetup', { type: reminder.reminder_type });
        }
    }

    function handleSetupCancel() {
        dispatch('cancelSetup', { type: reminder.reminder_type });
    }

    function handleSetupUpdate() {
        dispatch('setupUpdate');
    }

    function handleSetupToggleDropdown(e) {
        dispatch('toggleDropdown', e.detail);
    }
</script>

<div class="section-card" class:collapsed={!reminder.is_active}>
    <div class="section-header">
        <div class="header-title">
            <h3>
                <i class="fas {reminder.reminder_type === 'ruins' ? 'fa-monument' : 'fa-place-of-worship'}"></i>
                {reminder.reminder_type === 'ruins' ? 'Ancient Ruins' : 'Altar of Darkness'}
            </h3>
        </div>
        <div class="toggle-wrapper">
            <input type="checkbox" id="toggle-{reminder.reminder_type}" bind:checked={reminder.is_active} on:change={handleActiveToggle} />
            <label for="toggle-{reminder.reminder_type}" class="toggle-switch"></label>
        </div>
    </div>

    {#if reminder.is_active}
        <div transition:slide|local>
            {#if (!reminder.role_id || !reminder.role_menu_message_id) && !reminder._placeholder}
                <div class="warning-banner">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="warning-text">
                        <strong>Syncing:</strong> The bot is creating roles and the role menu. This may take a moment.
                    </div>
                </div>
            {/if}

            <div class="settings-body">
                <div class="setting-row">
                    <div class="setting-col">
                        <div class="setting-group">
                            <label for="select-{reminder.reminder_type}">Destination Channel</label>
                            <div class="custom-select-container">
                                <button
                                    type="button"
                                    id="select-{reminder.reminder_type}"
                                    class="custom-select-trigger"
                                    class:active={openDropdownId === reminder.reminder_type}
                                    on:click={(e) => handleToggleDropdown(reminder.reminder_type, e)}
                                >
                                    <span>{getChannelName(reminder.channel_id)}</span>
                                    <i class="fas fa-chevron-down arrow"></i>
                                </button>
                                {#if openDropdownId === reminder.reminder_type}
                                    <div class="custom-dropdown-menu" transition:slide={{ duration: 150 }}>
                                        {#each channels as ch}
                                            <button
                                                class="dropdown-option"
                                                on:click={() => handleChannelSelect(ch.id)}
                                            >
                                                <span class="hash">#</span>
                                                {ch.name}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <div class="sub-setting-row">
                            <div class="text-info">
                                <label for="evt-{reminder.reminder_type}">Create Discord Event</label>
                                <p class="sub-text">Schedule a Discord Event for instances?</p>
                            </div>
                            <div class="toggle-wrapper small">
                                <input
                                    type="checkbox"
                                    id="evt-{reminder.reminder_type}"
                                    bind:checked={reminder.create_discord_event}
                                    on:change={handleDiscordEventToggle}
                                />
                                <label for="evt-{reminder.reminder_type}" class="toggle-switch"></label>
                            </div>
                        </div>

                        <div class="sub-setting-row" style="margin-top: 10px;">
                            <div class="text-info">
                                <span class="sub-label">Reminder Intervals</span>
                                <p class="sub-text">{getReminderIntervals(reminder)} before each event</p>
                            </div>
                        </div>

                        <div class="shift-controls" style="margin-top: 20px;">
                            <p class="shift-help">Shift the schedule for all future events:</p>
                            <div class="shift-buttons">
                                <button class="btn-shift" on:click={() => handleShiftTime(-60)}>-1 Hour</button>
                                <button class="btn-shift" on:click={() => handleShiftTime(-1)}>-1 Minute</button>
                                <button class="btn-shift" on:click={() => handleShiftTime(1)}>+1 Minute</button>
                                <button class="btn-shift" on:click={() => handleShiftTime(60)}>+1 Hour</button>
                            </div>
                        </div>
                    </div>

                    <div class="setting-col">
                        <span class="preview-label">Upcoming Schedule (Next 5)</span>
                        <div class="instance-list">
                            {#each getNextInstances(reminder.first_instance_ts, reminder.reminder_type === 'ruins' ? 144000 : 309600) as ts}
                                <div class="instance-item">
                                    <div class="time-main">
                                        <i class="far fa-clock"></i>
                                        {formatTime(ts)}
                                    </div>
                                    <div class="time-relative">{formatRelative(ts)}</div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <div transition:slide|local>
            <ReminderSetupForm
                type={reminder.reminder_type}
                {channels}
                form={setupForm}
                {saving}
                {openDropdownId}
                on:submit={handleSetupSubmit}
                on:cancel={handleSetupCancel}
                on:update={handleSetupUpdate}
                on:toggleDropdown={handleSetupToggleDropdown}
            />
        </div>
    {/if}
</div>
