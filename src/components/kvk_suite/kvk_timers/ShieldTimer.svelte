<script lang="ts">
    import '../../../styles/kvk-timer-shared.css';
    import {
        formatDateUTC,
        formatDateLocal,
        formatRelative,
        dhmToMs,
    } from '../../../lib/kvk-timers/timerUtils';

    export let tick: number;

    // ── State ──
    const shieldingStructures: Record<string, { shielding_time: number; unshielding_time: number }> = {
        RCF: { shielding_time: 48, unshielding_time: 6 },
        'Lost Temple': { shielding_time: 168, unshielding_time: 8 },
        Ziggurat: { shielding_time: 72, unshielding_time: 8 },
        Other: { shielding_time: 48, unshielding_time: 4 },
    };

    let shieldStructure: string = 'RCF';
    let shieldStatus: 'shielded' | 'unshielded' = 'shielded';
    let shieldDays: string = '';
    let shieldHours: string = '';
    let shieldMinutes: string = '';

    type ShieldResult = {
        structureName: string;
        status: 'shielded' | 'unshielded';
        unshieldingUTC: string;
        unshieldingLocal: Date;
        shieldingUTC: string;
        shieldingLocal: Date;
        config: { shielding_time: number; unshielding_time: number };
    } | null;

    let shieldResult: ShieldResult = null;
    let shieldError: string = '';

    // ── Dropdown ──
    let openDropdown: string | null = null;

    function toggleDropdown(id: string) {
        openDropdown = openDropdown === id ? null : id;
    }

    function selectOption(id: string, value: string, setter: (v: any) => void) {
        setter(value);
        openDropdown = null;
    }

    function handleClickOutside(event: MouseEvent) {
        if (openDropdown && !(event.target as HTMLElement).closest('.custom-select-container')) {
            openDropdown = null;
        }
    }

    import { onMount } from 'svelte';
    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    const shieldStructureOptions = [
        { value: 'RCF', label: 'RCF' },
        { value: 'Lost Temple', label: 'Lost Temple' },
        { value: 'Ziggurat', label: 'Ziggurat' },
        { value: 'Other', label: 'Other' },
    ];

    const shieldStatusOptions = [
        { value: 'shielded', label: 'Shielded', icon: 'fa-shield-halved' },
        { value: 'unshielded', label: 'Unshielded', icon: 'fa-shield' },
    ];

    // ── Calculation ──
    function calculateShield() {
        shieldError = '';
        shieldResult = null;

        const timerMs = dhmToMs(shieldDays, shieldHours, shieldMinutes);
        if (timerMs <= 0) {
            shieldError = 'Please provide a time remaining.';
            return;
        }

        const now = new Date();
        const config = shieldingStructures[shieldStructure];
        const structureName = shieldStructure === 'Other' ? 'Structure' : shieldStructure;

        if (shieldStatus === 'shielded') {
            const unshieldingTime = new Date(now.getTime() + timerMs);
            const shieldingTime = new Date(unshieldingTime.getTime() + config.unshielding_time * 3600000);
            shieldResult = {
                structureName,
                status: shieldStatus,
                config,
                unshieldingUTC: formatDateUTC(unshieldingTime),
                unshieldingLocal: unshieldingTime,
                shieldingUTC: formatDateUTC(shieldingTime),
                shieldingLocal: shieldingTime,
            };
        } else {
            const shieldingTime = new Date(now.getTime() + timerMs);
            const unshieldingTime = new Date(shieldingTime.getTime() + config.shielding_time * 3600000);
            shieldResult = {
                structureName,
                status: shieldStatus,
                config,
                shieldingUTC: formatDateUTC(shieldingTime),
                shieldingLocal: shieldingTime,
                unshieldingUTC: formatDateUTC(unshieldingTime),
                unshieldingLocal: unshieldingTime,
            };
        }
    }

    function clearShield() {
        shieldResult = null;
        shieldError = '';
        shieldDays = '';
        shieldHours = '';
        shieldMinutes = '';
    }
</script>

<div class="timer-panel">
    <div class="panel-header">
        <i class="fas fa-shield-halved panel-icon shield"></i>
        <div>
            <h3>Shield Cycle Timer</h3>
            <p>Calculate structure shielding/unshielding cycle times.</p>
        </div>
    </div>

    <div class="input-grid">
        <div class="input-group">
            <label>Structure</label>
            <div class="custom-select-container">
                <button
                    class="custom-select-trigger"
                    class:open={openDropdown === 'shield-structure'}
                    on:click|stopPropagation={() => toggleDropdown('shield-structure')}
                >
                    <span class="selected-text">{shieldStructure}</span>
                    <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'shield-structure'}></i>
                </button>
                {#if openDropdown === 'shield-structure'}
                    <div class="custom-dropdown-menu">
                        {#each shieldStructureOptions as opt}
                            <button
                                class="dropdown-option"
                                class:selected={shieldStructure === opt.value}
                                on:click|stopPropagation={() =>
                                    selectOption(
                                        'shield-structure',
                                        opt.value,
                                        (v) => (shieldStructure = v),
                                    )}
                            >
                                <span>{opt.label}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
        <div class="input-group">
            <label>Current Status</label>
            <div class="custom-select-container">
                <button
                    class="custom-select-trigger"
                    class:open={openDropdown === 'shield-status'}
                    on:click|stopPropagation={() => toggleDropdown('shield-status')}
                >
                    <i
                        class="fas {shieldStatusOptions.find((o) => o.value === shieldStatus)
                            ?.icon} option-icon"
                    ></i>
                    <span class="selected-text"
                        >{shieldStatus === 'shielded' ? 'Shielded' : 'Unshielded'}</span
                    >
                    <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'shield-status'}></i>
                </button>
                {#if openDropdown === 'shield-status'}
                    <div class="custom-dropdown-menu">
                        {#each shieldStatusOptions as opt}
                            <button
                                class="dropdown-option"
                                class:selected={shieldStatus === opt.value}
                                on:click|stopPropagation={() =>
                                    selectOption('shield-status', opt.value, (v) => (shieldStatus = v))}
                            >
                                <i class="fas {opt.icon} option-icon"></i>
                                <span>{opt.label}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
        <div class="input-group full-width">
            <label>Time Left</label>
            <div class="dhm-row">
                <div class="dhm-field">
                    <input type="number" bind:value={shieldDays} placeholder="0" min="0" />
                    <span class="dhm-label">D</span>
                </div>
                <div class="dhm-field">
                    <input type="number" bind:value={shieldHours} placeholder="0" min="0" max="23" />
                    <span class="dhm-label">H</span>
                </div>
                <div class="dhm-field">
                    <input type="number" bind:value={shieldMinutes} placeholder="0" min="0" max="59" />
                    <span class="dhm-label">M</span>
                </div>
            </div>
        </div>
    </div>

    <div class="action-row">
        <button class="btn-calculate" on:click={calculateShield}>
            <span>Calculate</span>
        </button>
        {#if shieldResult || shieldError}
            <button class="btn-clear" on:click={clearShield}>
                <i class="fas fa-times"></i> Clear
            </button>
        {/if}
    </div>

    {#if shieldError}
        <div class="result-card error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{shieldError}</span>
        </div>
    {/if}

    {#if shieldResult}
        <div class="result-card">
            <div class="result-title">
                <i class="fas fa-shield-halved shield-icon"></i>
                {shieldResult.structureName} Cycle Status
            </div>

            {#if shieldResult.status === 'shielded'}
                <div class="result-section">
                    <div class="result-label">
                        The {shieldResult.structureName} will be <strong>unshielded</strong> at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{shieldResult.unshieldingUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(shieldResult.unshieldingLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(shieldResult.unshieldingLocal))}</span
                            >
                        </div>
                    </div>
                </div>
                <div class="result-divider"></div>
                <div class="result-section">
                    <div class="result-label">
                        After being unshielded for {shieldResult.config.unshielding_time} hours, it will be
                        <strong>shielded</strong> again at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{shieldResult.shieldingUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(shieldResult.shieldingLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(shieldResult.shieldingLocal))}</span
                            >
                        </div>
                    </div>
                </div>
            {:else}
                <div class="result-section">
                    <div class="result-label">
                        The {shieldResult.structureName} will be <strong>shielded</strong> at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{shieldResult.shieldingUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(shieldResult.shieldingLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(shieldResult.shieldingLocal))}</span
                            >
                        </div>
                    </div>
                </div>
                <div class="result-divider"></div>
                <div class="result-section">
                    <div class="result-label">
                        After being shielded for {shieldResult.config.shielding_time} hours, it will be
                        <strong>unshielded</strong> again at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{shieldResult.unshieldingUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(shieldResult.unshieldingLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(shieldResult.unshieldingLocal))}</span
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
