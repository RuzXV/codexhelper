<script>
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import '../../../../styles/reminders-shared.css';

    const dispatch = createEventDispatcher();

    export let custom;
    export let channels = [];
    export let roles = [];
    export let index;
    export let openDropdownId = null;

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

    function getChannelName(id) {
        if (!id || id === 'none') return '\u26D4 Disabled / Not Set';
        const ch = channels.find((c) => c.id === id);
        return ch ? `# ${ch.name}` : 'Unknown Channel';
    }

    function getRoleName(id) {
        if (!id) return 'No Role Tagged';
        const r = roles.find((x) => x.id === id);
        return r ? r.name : 'Unknown Role';
    }

    function getDisplayValue(c) {
        if (c.unit === 'd') return c.repeat_interval_seconds / 86400;
        if (c.unit === 'm') return c.repeat_interval_seconds / 60;
        return c.repeat_interval_seconds / 3600;
    }

    function getUnitLabel(u) {
        if (u === 'd') return 'Days';
        if (u === 'm') return 'Minutes';
        return 'Hours';
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

    function updateIntervalValue(val) {
        const num = parseFloat(val);
        if (isNaN(num)) return;

        let mult = 3600;
        if (custom.unit === 'd') mult = 86400;
        else if (custom.unit === 'm') mult = 60;

        custom.repeat_interval_seconds = num * mult;
        dispatch('change');
    }

    function handleToggleDropdown(id, event) {
        event.stopPropagation();
        dispatch('toggleDropdown', { id });
    }

    function handleChannelSelect(channelId) {
        custom.channel_id = channelId;
        dispatch('toggleDropdown', { id: null });
        dispatch('change');
    }

    function handleRoleSelect(roleId) {
        custom.role_id = roleId;
        dispatch('toggleDropdown', { id: null });
        dispatch('change');
    }

    function handleUnitSelect(unit) {
        custom.unit = unit;
        dispatch('toggleDropdown', { id: null });
        dispatch('change');
    }

    function handleDelete() {
        dispatch('delete', { index });
    }

    function handleShiftTime(minutes) {
        custom.first_instance_ts += minutes * 60;
        dispatch('change');
    }
</script>

<div class="custom-card" transition:slide|local>
    <div class="custom-card-header">
        <input
            type="text"
            class="input-title"
            placeholder="Reminder Title (e.g. Silk Trader)"
            bind:value={custom.title}
            on:input={() => dispatch('change')}
        />
        <button class="btn-delete" on:click={handleDelete} title="Delete Reminder">
            <i class="fas fa-trash"></i>
        </button>
    </div>

    <div class="custom-card-body">
        <div class="custom-row">
            <div class="c-group">
                <label for="c-ch-{index}">Channel</label>
                <div class="custom-select-container">
                    <button
                        type="button"
                        class="custom-select-trigger small"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdownId === `custom-ch-${index}`}
                        on:click={(e) => handleToggleDropdown(`custom-ch-${index}`, e)}
                    >
                        <span>{getChannelName(custom.channel_id)}</span>
                        <i class="fas fa-chevron-down arrow"></i>
                    </button>
                    {#if openDropdownId === `custom-ch-${index}`}
                        <div class="custom-dropdown-menu" transition:slide>
                            {#each channels as ch}
                                <button
                                    class="dropdown-option"
                                    on:click={() => handleChannelSelect(ch.id)}
                                >
                                    # {ch.name}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="c-group">
                <label for="c-role-{index}">Role Tag</label>
                <div class="custom-select-container">
                    <button
                        type="button"
                        class="custom-select-trigger small"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdownId === `custom-role-${index}`}
                        on:click={(e) => handleToggleDropdown(`custom-role-${index}`, e)}
                    >
                        <span style={custom.role_id ? 'color: var(--accent-blue)' : 'opacity: 0.7'}>
                            {getRoleName(custom.role_id)}
                        </span>
                        <i class="fas fa-chevron-down arrow"></i>
                    </button>
                    {#if openDropdownId === `custom-role-${index}`}
                        <div class="custom-dropdown-menu" transition:slide>
                            <button
                                class="dropdown-option danger"
                                on:click={() => handleRoleSelect(null)}
                            >
                                No Role Tagged
                            </button>
                            {#each roles as role}
                                <button
                                    class="dropdown-option"
                                    on:click={() => handleRoleSelect(role.id)}
                                >
                                    <span
                                        style="color: #{role.color === 0
                                            ? 'ffffff'
                                            : role.color.toString(16).padStart(6, '0')}"
                                        >{role.name}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="custom-row" style="margin-top: 10px;">
            <div class="c-group" style="flex: 2;">
                <label for="c-int-{index}">Interval Value</label>
                <input
                    type="number"
                    id="c-int-{index}"
                    value={getDisplayValue(custom)}
                    on:input={(e) => updateIntervalValue(e.target.value)}
                    min="0.1"
                    step="any"
                />
            </div>
            <div class="c-group" style="flex: 1;">
                <label for="c-unit-{index}">Unit</label>
                <div class="custom-select-container">
                    <button
                        type="button"
                        class="custom-select-trigger small"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdownId === `custom-unit-${index}`}
                        on:click={(e) => handleToggleDropdown(`custom-unit-${index}`, e)}
                    >
                        <span>{getUnitLabel(custom.unit)}</span>
                        <i class="fas fa-chevron-down arrow"></i>
                    </button>
                    {#if openDropdownId === `custom-unit-${index}`}
                        <div class="custom-dropdown-menu" transition:slide>
                            <button
                                class="dropdown-option"
                                on:click={() => handleUnitSelect('d')}
                                >Days</button
                            >
                            <button
                                class="dropdown-option"
                                on:click={() => handleUnitSelect('h')}
                                >Hours</button
                            >
                            <button
                                class="dropdown-option"
                                on:click={() => handleUnitSelect('m')}
                                >Minutes</button
                            >
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="custom-row">
            <div class="c-group full">
                <label for="c-msg-{index}">Message (Optional)</label>
                <input
                    type="text"
                    id="c-msg-{index}"
                    bind:value={custom.message}
                    on:input={() => dispatch('change')}
                    placeholder="Message to send with the reminder..."
                />
            </div>
        </div>

        <div class="custom-row footer-row">
            <div class="shift-preview">
                <span class="next-label"
                    >Next Occurrence: <strong
                        >{formatTime(
                            getNextInstances(
                                custom.first_instance_ts,
                                custom.repeat_interval_seconds,
                            )[0],
                        )}</strong
                    ></span
                >
            </div>
            <div class="shift-buttons mini">
                <button class="btn-shift" on:click={() => handleShiftTime(-60)}
                    >-1<br />Hour</button
                >
                <button class="btn-shift" on:click={() => handleShiftTime(-1)}
                    >-1<br />Minute</button
                >
                <button class="btn-shift" on:click={() => handleShiftTime(1)}
                    >+1<br />Minute</button
                >
                <button class="btn-shift" on:click={() => handleShiftTime(60)}
                    >+1<br />Hour</button
                >
            </div>
        </div>
    </div>
</div>
