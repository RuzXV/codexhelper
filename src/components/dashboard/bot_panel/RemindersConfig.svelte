<script>
    import { onMount } from 'svelte';
    import { slide, fade, fly } from 'svelte/transition';
    export let guildId;
    export let channels = [];

    let loading = true;
    let saving = false;

    let roles = [];
    let reminders = [];
    let customReminders = [];
    let deletedCustomIds = [];

    let originalState = null;
    let hasUnsavedChanges = false;
    let openDropdownId = null;

    // Setup form state for new ruins/altar reminders
    let setupForms = { ruins: null, altar: null };

    onMount(async () => {
        await loadData();
    });

    $: {
        const currentState = JSON.stringify({ r: reminders, c: customReminders, d: deletedCustomIds });
        if (originalState) {
            hasUnsavedChanges = currentState !== originalState;
        }
    }

    async function loadData() {
        loading = true;
        try {
            const [res, rolesRes] = await Promise.all([
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/reminders`),
                window.auth.fetchWithAuth(`/api/guilds/${guildId}/roles`)
            ]);

            roles = rolesRes.roles || [];

            const loadedReminders = (res.reminders || []).map(r => ({
                ...r,
                is_active: !!r.is_active,
                create_discord_event: !!r.create_discord_events
            }));

            // Ensure both ruins and altar entries always exist
            const types = ['ruins', 'altar'];
            reminders = types.map(type => {
                const existing = loadedReminders.find(r => r.reminder_type === type);
                if (existing) return existing;
                // Create a placeholder entry for reminders that don't exist yet
                return {
                    reminder_type: type,
                    channel_id: null,
                    is_active: false,
                    create_discord_event: false,
                    role_id: null,
                    role_menu_message_id: null,
                    first_instance_ts: 0,
                    last_instance_ts: 0,
                    reminder_intervals_seconds: '14400',
                    _placeholder: true
                };
            });

            customReminders = (res.customReminders || []).map(c => {
                let unit = 'h';
                if (c.repeat_interval_seconds % 86400 === 0) unit = 'd';
                else if (c.repeat_interval_seconds % 3600 !== 0) unit = 'm';

                return {
                    ...c,
                    message: c.message || '',
                    role_id: c.role_id || null,
                    ui_id: c.reminder_id || Math.random().toString(36),
                    unit: unit
                };
            });
            
            deletedCustomIds = [];
            originalState = JSON.stringify({ r: reminders, c: customReminders, d: deletedCustomIds });
        } catch (e) {
            console.error("Failed to load data:", e);
        } finally {
            loading = false;
        }
    }

    function getRoleName(id) {
        if (!id) return "No Role Tagged";
        const r = roles.find(x => x.id === id);
        return r ? r.name : "Unknown Role";
    }

    async function saveChanges() {
        saving = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/reminders`, {
                method: 'POST',
                body: JSON.stringify({ 
                    reminders: reminders, 
                    customReminders: customReminders,
                    deletedCustomIds: deletedCustomIds
                })
            });
            await loadData();
        } catch (e) {
            console.error("Failed to save reminders:", e);
            alert("Failed to save settings. Please try again.");
        } finally {
            saving = false;
        }
    }

    function discardChanges() {
        if (!originalState) return;
        const parsed = JSON.parse(originalState);
        reminders = parsed.r;
        customReminders = parsed.c;
        deletedCustomIds = parsed.d;
    }

    function shiftTime(item, minutes) {
        item.first_instance_ts += (minutes * 60);
        if (item.reminder_type) reminders = reminders;
        else customReminders = customReminders;
    }

    function getNextInstances(firstTs, intervalSeconds) {
        const instances = [];
        const interval = intervalSeconds; 
        
        let current = firstTs;
        const now = Math.floor(Date.now() / 1000);
        
        if (current < now) {
            const diff = now - current;
            const jumps = Math.ceil(diff / interval);
            current += (jumps * interval);
        }
        
        for (let i = 0; i < 5; i++) {
            instances.push(current + (i * interval));
        }
        return instances;
    }

    function addCustomReminder() {
        const now = Math.floor(Date.now() / 1000);
        customReminders = [...customReminders, {
            ui_id: `new_${Date.now()}`,
            reminder_id: null,
            title: "New Reminder",
            message: "",
            channel_id: channels[0]?.id || 'none',
            repeat_interval_seconds: 86400,
            first_instance_ts: now + 3600,
            unit: 'd'
        }];
    }

    function deleteCustomReminder(index) {
        const item = customReminders[index];
        if (item.reminder_id) {
            deletedCustomIds = [...deletedCustomIds, item.reminder_id];
        }
        customReminders = customReminders.filter((_, i) => i !== index);
    }

    function formatTime(ts) {
        return new Date(ts * 1000).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            timeZone: 'UTC'
        }) + ' UTC';
    }

    function updateIntervalValue(custom, val) {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        
        let mult = 3600;
        if (custom.unit === 'd') mult = 86400;
        else if (custom.unit === 'm') mult = 60;
        
        custom.repeat_interval_seconds = num * mult;
        customReminders = customReminders;
    }

    function getDisplayValue(custom) {
        if (custom.unit === 'd') return custom.repeat_interval_seconds / 86400;
        if (custom.unit === 'm') return custom.repeat_interval_seconds / 60;
        return custom.repeat_interval_seconds / 3600;
    }

    function getUnitLabel(u) {
        if (u === 'd') return 'Days';
        if (u === 'm') return 'Minutes';
        return 'Hours';
    }

    function formatRelative(ts) {
        const diff = (ts * 1000) - Date.now();
        if (diff < 0) return "Starting now";
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `in ${days}d ${hours}h`;
        return `in ${hours}h ${mins}m`;
    }

    function getChannelName(id) {
        if (!id || id === 'none') return "⛔ Disabled / Not Set";
        const ch = channels.find(c => c.id === id);
        return ch ? `# ${ch.name}` : "Unknown Channel";
    }

    function toggleDropdown(id, event) {
        event.stopPropagation();
        openDropdownId = openDropdownId === id ? null : id;
    }

    function initSetupForm(type) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000);
        const threeMonths = new Date(now.getTime() + 90 * 86400000);

        setupForms[type] = {
            channel_id: channels[0]?.id || 'none',
            first_instance_date: formatDateInput(tomorrow),
            first_instance_time: '00:00',
            last_instance_date: formatDateInput(threeMonths),
            last_instance_time: '00:00',
            reminder_1h: false,
            reminder_4h: true,
            reminder_8h: false,
            create_discord_event: false
        };
        setupForms = setupForms;
    }

    function cancelSetupForm(type) {
        setupForms[type] = null;
        setupForms = setupForms;
    }

    function formatDateInput(date) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getSetupIntervals(form) {
        const intervals = [];
        if (form.reminder_1h) intervals.push(3600);
        if (form.reminder_4h) intervals.push(14400);
        if (form.reminder_8h) intervals.push(28800);
        if (intervals.length === 0) intervals.push(14400);
        return intervals.sort((a, b) => a - b).join(',');
    }

    async function submitSetup(type) {
        const form = setupForms[type];
        if (!form) return;
        if (!form.channel_id || form.channel_id === 'none') {
            alert('Please select a destination channel.');
            return;
        }

        const firstTs = new Date(`${form.first_instance_date}T${form.first_instance_time}:00Z`).getTime() / 1000;
        const lastTs = new Date(`${form.last_instance_date}T${form.last_instance_time}:00Z`).getTime() / 1000;

        if (isNaN(firstTs) || isNaN(lastTs)) {
            alert('Invalid date/time. Please check your inputs.');
            return;
        }
        if (lastTs <= firstTs) {
            alert('Last instance must be after first instance.');
            return;
        }

        saving = true;
        try {
            await window.auth.fetchWithAuth(`/api/guilds/${guildId}/reminders`, {
                method: 'POST',
                body: JSON.stringify({
                    reminders: [{
                        reminder_type: type,
                        channel_id: form.channel_id,
                        is_active: true,
                        first_instance_ts: firstTs,
                        last_instance_ts: lastTs,
                        create_discord_event: form.create_discord_event,
                        reminder_intervals_seconds: getSetupIntervals(form),
                        is_new_setup: true
                    }],
                    customReminders: [],
                    deletedCustomIds: []
                })
            });
            setupForms[type] = null;
            setupForms = setupForms;
            await loadData();
        } catch (e) {
            console.error("Failed to setup reminder:", e);
            alert("Failed to set up reminder. Please try again.");
        } finally {
            saving = false;
        }
    }

    function formatIntervalLabel(seconds) {
        if (seconds === 3600) return '1 hour';
        if (seconds === 14400) return '4 hours';
        if (seconds === 28800) return '8 hours';
        return `${seconds / 3600}h`;
    }

    function getReminderIntervals(reminder) {
        if (!reminder.reminder_intervals_seconds) return '4 hours';
        return reminder.reminder_intervals_seconds
            .split(',')
            .map(s => formatIntervalLabel(parseInt(s)))
            .join(', ');
    }
</script>

<svelte:window on:click={() => openDropdownId = null} />

<div class="reminders-container" transition:fade>
    {#if loading}
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Loading configuration...
        </div>
    {:else}
        {#each reminders as reminder}
            <div class="section-card" class:collapsed={!reminder.is_active}>
                <div class="section-header">
                    <div class="header-title">
                        <h3>
                            <i class="fas {reminder.reminder_type === 'ruins' ? 'fa-monument' : 'fa-place-of-worship'}"></i> 
                            {reminder.reminder_type === 'ruins' ? 'Ancient Ruins' : 'Altar of Darkness'}
                        </h3>
                    </div>
                    <div class="toggle-wrapper">
                        <input type="checkbox" id="toggle-{reminder.reminder_type}" bind:checked={reminder.is_active} />
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
                                            <button type="button" id="select-{reminder.reminder_type}" class="custom-select-trigger" class:active={openDropdownId === reminder.reminder_type} on:click={(e) => toggleDropdown(reminder.reminder_type, e)}>
                                                <span>{getChannelName(reminder.channel_id)}</span>
                                                <i class="fas fa-chevron-down arrow"></i>
                                            </button>
                                            {#if openDropdownId === reminder.reminder_type}
                                                <div class="custom-dropdown-menu" transition:slide={{ duration: 150 }}>
                                                    {#each channels as ch}
                                                        <button class="dropdown-option" on:click={() => {reminder.channel_id = ch.id; openDropdownId = null;}}>
                                                            <span class="hash">#</span> {ch.name}
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
                                            <input type="checkbox" id="evt-{reminder.reminder_type}" bind:checked={reminder.create_discord_event} />
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
                                            <button class="btn-shift" on:click={() => shiftTime(reminder, -60)}>-1 Hour</button>
                                            <button class="btn-shift" on:click={() => shiftTime(reminder, -1)}>-1 Minute</button>
                                            <button class="btn-shift" on:click={() => shiftTime(reminder, 1)}>+1 Minute</button>
                                            <button class="btn-shift" on:click={() => shiftTime(reminder, 60)}>+1 Hour</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="setting-col">
                                    <span class="preview-label">Upcoming Schedule (Next 5)</span>
                                    <div class="instance-list">
                                        {#each getNextInstances(reminder.first_instance_ts, reminder.reminder_type === 'ruins' ? 144000 : 309600) as ts}
                                            <div class="instance-item">
                                                <div class="time-main">
                                                    <i class="far fa-clock"></i> {formatTime(ts)}
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
                        {#if setupForms[reminder.reminder_type]}
                            {@const form = setupForms[reminder.reminder_type]}
                            <div class="setup-form">
                                <div class="setup-form-header">
                                    <i class="fas fa-magic"></i>
                                    <span>Set up {reminder.reminder_type === 'ruins' ? 'Ancient Ruins' : 'Altar of Darkness'} reminders</span>
                                </div>

                                <div class="setup-form-body">
                                    <div class="setup-row">
                                        <div class="setup-group">
                                            <label>Destination Channel</label>
                                            <div class="custom-select-container">
                                                <button type="button" class="custom-select-trigger small" on:click={(e) => toggleDropdown(`setup-ch-${reminder.reminder_type}`, e)}>
                                                    <span>{getChannelName(form.channel_id)}</span>
                                                    <i class="fas fa-chevron-down arrow"></i>
                                                </button>
                                                {#if openDropdownId === `setup-ch-${reminder.reminder_type}`}
                                                    <div class="custom-dropdown-menu" transition:slide={{ duration: 150 }}>
                                                        {#each channels as ch}
                                                            <button class="dropdown-option" on:click={() => {form.channel_id = ch.id; openDropdownId = null; setupForms = setupForms;}}>
                                                                <span class="hash">#</span> {ch.name}
                                                            </button>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="setup-row">
                                        <div class="setup-group">
                                            <label>First Instance (UTC)</label>
                                            <div class="datetime-row">
                                                <input type="date" bind:value={form.first_instance_date} on:change={() => setupForms = setupForms} />
                                                <input type="time" bind:value={form.first_instance_time} on:change={() => setupForms = setupForms} />
                                            </div>
                                        </div>
                                        <div class="setup-group">
                                            <label>Last Instance (UTC)</label>
                                            <div class="datetime-row">
                                                <input type="date" bind:value={form.last_instance_date} on:change={() => setupForms = setupForms} />
                                                <input type="time" bind:value={form.last_instance_time} on:change={() => setupForms = setupForms} />
                                            </div>
                                        </div>
                                    </div>

                                    <div class="setup-row">
                                        <div class="setup-group">
                                            <label>Reminder Intervals</label>
                                            <div class="interval-checkboxes">
                                                <label class="interval-checkbox">
                                                    <input type="checkbox" bind:checked={form.reminder_1h} on:change={() => setupForms = setupForms} />
                                                    <span>1 hour before</span>
                                                </label>
                                                <label class="interval-checkbox">
                                                    <input type="checkbox" bind:checked={form.reminder_4h} on:change={() => setupForms = setupForms} />
                                                    <span>4 hours before</span>
                                                </label>
                                                <label class="interval-checkbox">
                                                    <input type="checkbox" bind:checked={form.reminder_8h} on:change={() => setupForms = setupForms} />
                                                    <span>8 hours before</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div class="setup-group">
                                            <label>Options</label>
                                            <label class="interval-checkbox">
                                                <input type="checkbox" bind:checked={form.create_discord_event} on:change={() => setupForms = setupForms} />
                                                <span>Create Discord Events</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="setup-info">
                                        <i class="fas fa-info-circle"></i>
                                        <span>The bot will automatically create the required roles and a role selection menu in the chosen channel. Events repeat every {reminder.reminder_type === 'ruins' ? '40' : '86'} hours.</span>
                                    </div>

                                    <div class="setup-actions">
                                        <button class="btn-setup-cancel" on:click={() => cancelSetupForm(reminder.reminder_type)} disabled={saving}>Cancel</button>
                                        <button class="btn-setup-confirm" on:click={() => submitSetup(reminder.reminder_type)} disabled={saving}>
                                            {#if saving}<i class="fas fa-spinner fa-spin"></i>{:else}<i class="fas fa-check"></i> Activate{/if}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <div class="setup-prompt">
                                <p>Reminders are not set up for this event type.</p>
                                <button class="btn-begin-setup" on:click={() => initSetupForm(reminder.reminder_type)}>
                                    <i class="fas fa-plus-circle"></i> Set Up Reminders
                                </button>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/each}

        <div class="section-card custom-section">
            <div class="section-header">
                <div class="header-title">
                    <h3><i class="fas fa-list-ul"></i> Custom Reminders</h3>
                </div>
                <button class="btn-add" on:click={addCustomReminder}>
                    <i class="fas fa-plus"></i> New Reminder
                </button>
            </div>

            <div class="custom-list">
                {#if customReminders.length === 0}
                    <div class="empty-state">
                        <i class="fas fa-scroll"></i>
                        <p>No custom reminders created yet.</p>
                    </div>
                {/if}

                {#each customReminders as custom, i (custom.ui_id)}
                    <div class="custom-card" transition:slide|local>
                        <div class="custom-card-header">
                            <input 
                                type="text" 
                                class="input-title" 
                                placeholder="Reminder Title (e.g. Silk Trader)" 
                                bind:value={custom.title} 
                            />
                            <button class="btn-delete" on:click={() => deleteCustomReminder(i)} title="Delete Reminder">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        
                        <div class="custom-card-body">
                            <div class="custom-row">
                                <div class="c-group">
                                    <label for="c-ch-{i}">Channel</label>
                                    <div class="custom-select-container">
                                        <button type="button" class="custom-select-trigger small" on:click={(e) => toggleDropdown(`custom-ch-${i}`, e)}>
                                            <span>{getChannelName(custom.channel_id)}</span>
                                            <i class="fas fa-chevron-down arrow"></i>
                                        </button>
                                        {#if openDropdownId === `custom-ch-${i}`}
                                            <div class="custom-dropdown-menu" transition:slide>
                                                {#each channels as ch}
                                                    <button class="dropdown-option" on:click={() => {custom.channel_id = ch.id; openDropdownId = null;}}>
                                                        # {ch.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            
                                <div class="c-group">
                                    <label for="c-role-{i}">Role Tag</label>
                                    <div class="custom-select-container">
                                        <button type="button" class="custom-select-trigger small" on:click={(e) => toggleDropdown(`custom-role-${i}`, e)}>
                                            <span style={custom.role_id ? 'color: var(--accent-blue)' : 'opacity: 0.7'}>
                                                {getRoleName(custom.role_id)}
                                            </span>
                                            <i class="fas fa-chevron-down arrow"></i>
                                        </button>
                                        {#if openDropdownId === `custom-role-${i}`}
                                            <div class="custom-dropdown-menu" transition:slide>
                                                <button class="dropdown-option danger" on:click={() => {custom.role_id = null; openDropdownId = null;}}>
                                                    No Role Tagged
                                                </button>
                                                {#each roles as role}
                                                    <button class="dropdown-option" on:click={() => {custom.role_id = role.id; openDropdownId = null;}}>
                                                        <span style="color: #{role.color === 0 ? 'ffffff' : role.color.toString(16).padStart(6, '0')}">{role.name}</span>
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="custom-row" style="margin-top: 10px;">
                                <div class="c-group" style="flex: 2;">
                                    <label for="c-int-{i}">Interval Value</label>
                                    <input 
                                        type="number" 
                                        id="c-int-{i}" 
                                        value={getDisplayValue(custom)} 
                                        on:input={(e) => updateIntervalValue(custom, e.target.value)}
                                        min="0.1" step="any"
                                    />
                                </div>
                                <div class="c-group" style="flex: 1;">
                                    <label for="c-unit-{i}">Unit</label>
                                    <div class="custom-select-container">
                                        <button type="button" class="custom-select-trigger small" on:click={(e) => toggleDropdown(`custom-unit-${i}`, e)}>
                                            <span>{getUnitLabel(custom.unit)}</span>
                                            <i class="fas fa-chevron-down arrow"></i>
                                        </button>
                                        {#if openDropdownId === `custom-unit-${i}`}
                                            <div class="custom-dropdown-menu" transition:slide>
                                                <button class="dropdown-option" on:click={() => {custom.unit = 'd'; openDropdownId = null; customReminders=customReminders;}}>Days</button>
                                                <button class="dropdown-option" on:click={() => {custom.unit = 'h'; openDropdownId = null; customReminders=customReminders;}}>Hours</button>
                                                <button class="dropdown-option" on:click={() => {custom.unit = 'm'; openDropdownId = null; customReminders=customReminders;}}>Minutes</button>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <div class="custom-row">
                                <div class="c-group full">
                                    <label for="c-msg-{i}">Message (Optional)</label>
                                    <input type="text" id="c-msg-{i}" bind:value={custom.message} placeholder="Message to send with the reminder..." />
                                </div>
                            </div>

                            <div class="custom-row footer-row">
                                <div class="shift-preview">
                                    <span class="next-label">Next Occurrence: <strong>{formatTime(getNextInstances(custom.first_instance_ts, custom.repeat_interval_seconds)[0])}</strong></span>
                                </div>
                                <div class="shift-buttons mini">
                                    <button class="btn-shift" on:click={() => shiftTime(custom, -60)}>-1<br>Hour</button>
                                    <button class="btn-shift" on:click={() => shiftTime(custom, -1)}>-1<br>Minute</button>
                                    <button class="btn-shift" on:click={() => shiftTime(custom, 1)}>+1<br>Minute</button>
                                    <button class="btn-shift" on:click={() => shiftTime(custom, 60)}>+1<br>Hour</button>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if hasUnsavedChanges}
        <div class="save-bar" transition:fly={{ y: 50 }}>
            <div class="save-bar-content">
                <span>Unsaved changes detected.</span>
                <div class="save-actions">
                    <button class="btn-discard" on:click={discardChanges} disabled={saving}>Discard</button>
                    <button class="btn-calculate" on:click={saveChanges} disabled={saving}>
                        {#if saving}<i class="fas fa-spinner fa-spin"></i>{:else}Save Changes{/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .reminders-container { display: flex; flex-direction: column; gap: 20px; padding-bottom: 80px; }
    
    .section-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: visible;
        transition: all 0.2s;
    }
    .section-card.collapsed {
        opacity: 0.8;
    }
    .section-header {
        padding: 15px 20px;
        background: rgba(0,0,0,0.15);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .section-card.collapsed .section-header {
        border-bottom: none;
        background: transparent;
    }

    .header-title h3 { margin: 0; font-size: 1.1rem; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    
    .settings-body { padding: 20px; }
    
    .setting-row { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .setting-col { display: flex; flex-direction: column; gap: 20px; }
    .setting-group { display: flex; flex-direction: column; gap: 8px; }
    .setting-group label { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }

    .sub-setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-tertiary);
        padding: 12px 15px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        margin-top: 10px;
    }
    .text-info { display: flex; flex-direction: column; gap: 2px; }
    .sub-text { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }
    .toggle-wrapper.small { transform: scale(0.9); transform-origin: right center; }

    .shift-controls {
        background: var(--bg-tertiary);
        padding: 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        margin-bottom: 10px;
    }
    .shift-help { margin: 0 0 8px 0; font-size: 0.8rem; color: var(--text-secondary); }
    .shift-buttons { display: flex; gap: 8px; }
    .btn-shift {
        flex: 1;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        padding: 6px;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-shift:hover { background: var(--accent-blue); border-color: var(--accent-blue); color: white; }

    .preview-label { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; display: block; margin-bottom: 8px; }
    .instance-list { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .instance-item { padding: 10px 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: var(--text-secondary); }
    .instance-item:last-child { border-bottom: none; }
    .time-main { display: flex; align-items: center; gap: 8px; color: var(--text-primary); }
    .time-relative { font-size: 0.8rem; opacity: 0.6; font-style: italic; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; }

    .btn-add { background: var(--accent-blue); color: white; border: none; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.2s; }
    .btn-add:hover { opacity: 0.9; }

    .custom-list { 
        padding: 20px; 
        display: grid; 
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px; 
    }
    .custom-card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; overflow: visible; transition: all 0.2s; }
    .custom-card:hover { border-color: var(--text-secondary); }

    .custom-card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid var(--border-color); background: rgba(255,255,255,0.02); }
    .input-title { background: transparent; border: none; color: var(--text-primary); font-weight: 600; font-size: 1rem; width: 100%; outline: none; }
    .input-title::placeholder { opacity: 0.5; font-weight: normal; }
    .btn-delete { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 5px; transition: color 0.2s; }
    .btn-delete:hover { color: #ef4444; }

    .custom-card-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
    .custom-row { display: flex; gap: 15px; align-items: flex-end; }
    .c-group { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .c-group.full { flex: 100%; }
    .c-group label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
    .c-group input { background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 0 10px; border-radius: 6px; color: var(--text-primary);
        font-size: 0.9rem; width: 100%; height: 42px; box-sizing: border-box; }

    .footer-row { justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 5px; }
    .next-label { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4; }
    .next-label strong { color: var(--accent-blue); display: block; margin-top: 2px; font-size: 0.8rem; }
    .shift-buttons.mini .btn-shift { 
        padding: 4px 2px; 
        font-size: 0.75rem; 
        line-height: 1.2; 
        height: auto;
        min-width: 60px;
    }

    .custom-select-container { position: relative; width: 100%; }
    .custom-select-trigger { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary); cursor: pointer; font-size: 0.95rem; }
    .custom-select-trigger.small { padding: 0 12px; font-size: 0.9rem; background: var(--bg-tertiary); height: 42px; box-sizing: border-box; }
    .custom-dropdown-menu { position: absolute; top: calc(100% + 5px); left: 0; width: 100%; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 100; max-height: 200px; overflow-y: auto; }
    .dropdown-option { width: 100%; text-align: left; background: transparent; border: none; padding: 10px 16px; cursor: pointer; color: var(--text-secondary); font-size: 0.9rem; }
    .dropdown-option:hover { background: var(--bg-tertiary); color: var(--text-primary); }

    .warning-banner { background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 10px 15px; margin: 15px 20px 0; border-radius: 4px; display: flex; gap: 10px; align-items: start; font-size: 0.85rem; color: #fbbf24; }

    .sub-label { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; }

    .setup-prompt {
        padding: 25px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    .setup-prompt p { margin: 0 0 12px 0; }
    .btn-begin-setup {
        background: var(--accent-blue);
        color: white;
        border: none;
        padding: 8px 20px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.2s;
    }
    .btn-begin-setup:hover { opacity: 0.9; }

    .setup-form { border-top: 1px solid var(--border-color); }
    .setup-form-header {
        padding: 12px 20px;
        background: rgba(59, 130, 246, 0.08);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--accent-blue);
        font-size: 0.9rem;
    }
    .setup-form-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .setup-row { display: flex; gap: 20px; }
    .setup-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .setup-group label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }

    .datetime-row { display: flex; gap: 8px; }
    .datetime-row input {
        flex: 1;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 8px 10px;
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.85rem;
        color-scheme: dark;
    }

    .interval-checkboxes { display: flex; flex-direction: column; gap: 6px; }
    .interval-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--text-secondary);
        cursor: pointer;
    }
    .interval-checkbox input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: var(--accent-blue);
        cursor: pointer;
    }

    .setup-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(59, 130, 246, 0.06);
        border-radius: 6px;
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.4;
    }
    .setup-info i { color: var(--accent-blue); margin-top: 2px; flex-shrink: 0; }

    .setup-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--border-color);
    }
    .btn-setup-cancel {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.85rem;
        transition: all 0.2s;
    }
    .btn-setup-cancel:hover { color: var(--text-primary); background: var(--bg-tertiary); }
    .btn-setup-confirm {
        background: var(--accent-blue);
        border: none;
        color: white;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.2s;
    }
    .btn-setup-confirm:hover { opacity: 0.9; }
    .btn-setup-confirm:disabled, .btn-setup-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    .toggle-wrapper { position: relative; width: 44px; height: 24px; }
    .toggle-wrapper input { opacity: 0; width: 0; height: 0; }
    .toggle-switch { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-primary); transition: .4s; border-radius: 34px; border: 1px solid var(--border-color); }
    .toggle-switch:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: var(--text-secondary); transition: .4s; border-radius: 50%; }
    input:checked + .toggle-switch { background-color: var(--accent-blue); border-color: var(--accent-blue); }
    input:checked + .toggle-switch:before { transform: translateX(20px); background-color: white; }

    .save-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px 24px; border-radius: 50px; box-shadow: 0 5px 25px rgba(0,0,0,0.5); z-index: 1000; min-width: 350px; }
    .save-bar-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
    .save-bar span { font-weight: 500; color: white; font-size: 0.95rem; }
    .save-actions { display: flex; gap: 10px; }
    .btn-calculate { background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); color: white; border: 1px solid #60a5fa; padding: 8px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
    .btn-discard { background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; }

    @media (max-width: 900px) {
        .custom-list { grid-template-columns: 1fr; }
        .setting-row { grid-template-columns: 1fr; }
        .save-bar { width: 90%; bottom: 10px; border-radius: 12px; }
        .save-bar-content { flex-direction: column; text-align: center; gap: 15px; }
    }
</style>