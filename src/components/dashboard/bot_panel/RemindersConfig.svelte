<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import ReminderCard from './reminders/ReminderCard.svelte';
    import CustomReminderCard from './reminders/CustomReminderCard.svelte';
    import SaveBar from '../../shared/SaveBar.svelte';
    import '../../../styles/reminders-shared.css';
    import { fetchWithAuth } from '../../../stores/auth.js';

    export let guildId;
    export let channels = [];
    export let roles = [];

    let loading = true;
    let saving = false;
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
            const res = await fetchWithAuth(`/api/guilds/${guildId}/reminders`);

            const loadedReminders = (res.reminders || []).map((r) => ({
                ...r,
                is_active: !!r.is_active,
                create_discord_event: !!r.create_discord_events,
            }));

            const types = ['ruins', 'altar'];
            reminders = types.map((type) => {
                const existing = loadedReminders.find((r) => r.reminder_type === type);
                if (existing) return existing;
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
                    _placeholder: true,
                };
            });

            customReminders = (res.customReminders || []).map((c) => {
                let unit = 'h';
                if (c.repeat_interval_seconds % 86400 === 0) unit = 'd';
                else if (c.repeat_interval_seconds % 3600 !== 0) unit = 'm';

                return {
                    ...c,
                    message: c.message || '',
                    role_id: c.role_id || null,
                    ui_id: c.reminder_id || Math.random().toString(36),
                    unit: unit,
                };
            });

            deletedCustomIds = [];
            originalState = JSON.stringify({ r: reminders, c: customReminders, d: deletedCustomIds });
        } catch (e) {
            console.error('Failed to load data:', e);
        } finally {
            loading = false;
        }
    }

    async function saveChanges() {
        saving = true;
        try {
            await fetchWithAuth(`/api/guilds/${guildId}/reminders`, {
                method: 'POST',
                body: JSON.stringify({
                    reminders: reminders,
                    customReminders: customReminders,
                    deletedCustomIds: deletedCustomIds,
                }),
            });
            await loadData();
        } catch (e) {
            console.error('Failed to save reminders:', e);
            alert('Failed to save settings. Please try again.');
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
        item.first_instance_ts += minutes * 60;
        if (item.reminder_type) reminders = reminders;
        else customReminders = customReminders;
    }

    function addCustomReminder() {
        const now = Math.floor(Date.now() / 1000);
        customReminders = [
            ...customReminders,
            {
                ui_id: `new_${Date.now()}`,
                reminder_id: null,
                title: 'New Reminder',
                message: '',
                channel_id: channels[0]?.id || 'none',
                repeat_interval_seconds: 86400,
                first_instance_ts: now + 3600,
                unit: 'd',
            },
        ];
    }

    function deleteCustomReminder(index) {
        const item = customReminders[index];
        if (item.reminder_id) {
            deletedCustomIds = [...deletedCustomIds, item.reminder_id];
        }
        customReminders = customReminders.filter((_, i) => i !== index);
    }

    function handleToggleDropdown(id) {
        openDropdownId = openDropdownId === id ? null : id;
    }

    function handleReminderChange() {
        reminders = reminders;
    }

    function handleCustomChange() {
        customReminders = customReminders;
    }

    function handleReminderShiftTime(e) {
        shiftTime(e.detail.item, e.detail.minutes);
    }

    function formatDateInput(date) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
            create_discord_event: false,
        };
        setupForms = setupForms;
    }

    function cancelSetupForm(type) {
        setupForms[type] = null;
        setupForms = setupForms;
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
            await fetchWithAuth(`/api/guilds/${guildId}/reminders`, {
                method: 'POST',
                body: JSON.stringify({
                    reminders: [
                        {
                            reminder_type: type,
                            channel_id: form.channel_id,
                            is_active: true,
                            first_instance_ts: firstTs,
                            last_instance_ts: lastTs,
                            create_discord_event: form.create_discord_event,
                            reminder_intervals_seconds: getSetupIntervals(form),
                            is_new_setup: true,
                        },
                    ],
                    customReminders: [],
                    deletedCustomIds: [],
                }),
            });
            setupForms[type] = null;
            setupForms = setupForms;
            await loadData();
        } catch (e) {
            console.error('Failed to setup reminder:', e);
            alert('Failed to set up reminder. Please try again.');
        } finally {
            saving = false;
        }
    }
</script>

<svelte:window on:click={() => (openDropdownId = null)} />

<div class="reminders-container" transition:fade>
    {#if loading}
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i> Loading configuration...
        </div>
    {:else}
        {#each reminders as reminder}
            <ReminderCard
                bind:reminder
                {channels}
                {roles}
                {guildId}
                {openDropdownId}
                setupForm={setupForms[reminder.reminder_type]}
                {saving}
                on:change={handleReminderChange}
                on:toggleDropdown={(e) => handleToggleDropdown(e.detail.id)}
                on:shiftTime={handleReminderShiftTime}
                on:initSetup={(e) => initSetupForm(e.detail.type)}
                on:submitSetup={(e) => submitSetup(e.detail.type)}
                on:cancelSetup={(e) => cancelSetupForm(e.detail.type)}
                on:setupUpdate={() => (setupForms = setupForms)}
            />
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
                    <CustomReminderCard
                        bind:custom
                        {channels}
                        {roles}
                        index={i}
                        {openDropdownId}
                        on:change={handleCustomChange}
                        on:delete={(e) => deleteCustomReminder(e.detail.index)}
                        on:toggleDropdown={(e) => handleToggleDropdown(e.detail.id)}
                    />
                {/each}
            </div>
        </div>
    {/if}

    <SaveBar
        {hasUnsavedChanges}
        {saving}
        message="Unsaved changes detected."
        saveLabel="Save Changes"
        on:save={saveChanges}
        on:discard={discardChanges}
    />
</div>

<style>
    .reminders-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding-bottom: 80px;
    }

    .btn-add {
        background: var(--accent-blue);
        color: white;
        border: none;
        padding: 6px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.2s;
    }
    .btn-add:hover {
        opacity: 0.9;
    }

    .custom-list {
        padding: 20px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 30px;
        color: var(--text-secondary);
    }
    .empty-state i {
        font-size: 2rem;
        margin-bottom: 10px;
        opacity: 0.5;
    }
    .empty-state p {
        margin: 0;
    }

    .loading-state {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
    }

    @media (max-width: 900px) {
        .custom-list {
            grid-template-columns: 1fr;
        }
    }
</style>
