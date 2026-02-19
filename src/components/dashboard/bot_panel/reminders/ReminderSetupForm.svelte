<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import '../../../../styles/reminders-shared.css';

    const dispatch = createEventDispatcher();

    export let type;
    export let channels = [];
    export let form;
    export let saving = false;
    export let openDropdownId = null;

    function getChannelName(id) {
        if (!id || id === 'none') return '\u26D4 Disabled / Not Set';
        const ch = channels.find((c) => c.id === id);
        return ch ? `# ${ch.name}` : 'Unknown Channel';
    }

    function handleToggleDropdown(id, event) {
        event.stopPropagation();
        dispatch('toggleDropdown', { id });
    }

    function handleChannelSelect(channelId) {
        form.channel_id = channelId;
        dispatch('toggleDropdown', { id: null });
        dispatch('update');
    }

    function handleFormFieldChange() {
        dispatch('update');
    }
</script>

{#if form}
    <div class="setup-form">
        <div class="setup-form-header">
            <i class="fas fa-magic"></i>
            <span>Set up {type === 'ruins' ? 'Ancient Ruins' : 'Altar of Darkness'} reminders</span>
        </div>

        <div class="setup-form-body">
            <div class="setup-row">
                <div class="setup-group">
                    <label>Destination Channel</label>
                    <div class="custom-select-container">
                        <button
                            type="button"
                            class="custom-select-trigger small"
                            aria-haspopup="listbox"
                            aria-expanded={openDropdownId === `setup-ch-${type}`}
                            on:click={(e) => handleToggleDropdown(`setup-ch-${type}`, e)}
                        >
                            <span>{getChannelName(form.channel_id)}</span>
                            <i class="fas fa-chevron-down arrow"></i>
                        </button>
                        {#if openDropdownId === `setup-ch-${type}`}
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
            </div>

            <div class="setup-row">
                <div class="setup-group">
                    <label>First Instance (UTC)</label>
                    <div class="datetime-row">
                        <input
                            type="date"
                            bind:value={form.first_instance_date}
                            on:change={handleFormFieldChange}
                        />
                        <input
                            type="time"
                            bind:value={form.first_instance_time}
                            on:change={handleFormFieldChange}
                        />
                    </div>
                </div>
                <div class="setup-group">
                    <label>Last Instance (UTC)</label>
                    <div class="datetime-row">
                        <input
                            type="date"
                            bind:value={form.last_instance_date}
                            on:change={handleFormFieldChange}
                        />
                        <input
                            type="time"
                            bind:value={form.last_instance_time}
                            on:change={handleFormFieldChange}
                        />
                    </div>
                </div>
            </div>

            <div class="setup-row">
                <div class="setup-group">
                    <label>Reminder Intervals</label>
                    <div class="interval-checkboxes">
                        <label class="interval-checkbox">
                            <input
                                type="checkbox"
                                bind:checked={form.reminder_1h}
                                on:change={handleFormFieldChange}
                            />
                            <span>1 hour before</span>
                        </label>
                        <label class="interval-checkbox">
                            <input
                                type="checkbox"
                                bind:checked={form.reminder_4h}
                                on:change={handleFormFieldChange}
                            />
                            <span>4 hours before</span>
                        </label>
                        <label class="interval-checkbox">
                            <input
                                type="checkbox"
                                bind:checked={form.reminder_8h}
                                on:change={handleFormFieldChange}
                            />
                            <span>8 hours before</span>
                        </label>
                    </div>
                </div>
                <div class="setup-group">
                    <label>Options</label>
                    <label class="interval-checkbox">
                        <input
                            type="checkbox"
                            bind:checked={form.create_discord_event}
                            on:change={handleFormFieldChange}
                        />
                        <span>Create Discord Events</span>
                    </label>
                </div>
            </div>

            <div class="setup-info">
                <i class="fas fa-info-circle"></i>
                <span
                    >The bot will automatically create the required roles and a role selection
                    menu in the chosen channel. Events repeat every {type === 'ruins'
                        ? '40'
                        : '86'} hours.</span
                >
            </div>

            <div class="setup-actions">
                <button
                    class="btn-setup-cancel"
                    on:click={() => dispatch('cancel')}
                    disabled={saving}>Cancel</button
                >
                <button
                    class="btn-setup-confirm"
                    on:click={() => dispatch('submit')}
                    disabled={saving}
                >
                    {#if saving}<i class="fas fa-spinner fa-spin"></i>{:else}<i
                            class="fas fa-check"
                        ></i> Activate{/if}
                </button>
            </div>
        </div>
    </div>
{:else}
    <div class="setup-prompt">
        <p>Reminders are not set up for this event type.</p>
        <button class="btn-begin-setup" on:click={() => dispatch('submit', { init: true })}>
            <i class="fas fa-plus-circle"></i> Set Up Reminders
        </button>
    </div>
{/if}
