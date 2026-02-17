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
    const buffDurations: Record<string, number> = {
        'Building Buff': 4,
        'Research Buff': 4,
        'Training Buff': 4,
        'Resource Buff': 8,
        'Healing Buff': 8,
    };
    const cooldownPeriodHours = 20;

    let buffType: string = 'Building Buff';
    let buffHours: string = '';
    let buffMinutes: string = '';

    type BuffResult = {
        buffType: string;
        activationUTC: string;
        activationLocal: Date;
        buffEndUTC: string;
        buffEndLocal: Date;
        readyUTC: string;
        readyLocal: Date;
    } | null;

    let buffResult: BuffResult = null;
    let buffError: string = '';

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

    const buffTypeOptions = [
        { value: 'Building Buff', label: 'Building Buff', icon: 'fa-hammer' },
        { value: 'Research Buff', label: 'Research Buff', icon: 'fa-flask' },
        { value: 'Training Buff', label: 'Training Buff', icon: 'fa-person-military-rifle' },
        { value: 'Resource Buff', label: 'Resource Buff', icon: 'fa-wheat-awn' },
        { value: 'Healing Buff', label: 'Healing Buff', icon: 'fa-kit-medical' },
    ];

    // ── Calculation ──
    function calculateBuff() {
        buffError = '';
        buffResult = null;

        let timerMs = dhmToMs('0', buffHours, buffMinutes);
        if (timerMs <= 0) {
            buffError = 'Please provide a time remaining.';
            return;
        }

        const maxBuffMs = buffDurations[buffType] * 3600000;
        if (timerMs > maxBuffMs) {
            timerMs = maxBuffMs;
        }

        const now = new Date();
        const buffEndTime = new Date(now.getTime() + timerMs);
        const fullBuffDurationMs = buffDurations[buffType] * 3600000;
        const activationTime = new Date(buffEndTime.getTime() - fullBuffDurationMs);
        const readyTime = new Date(activationTime.getTime() + cooldownPeriodHours * 3600000);

        buffResult = {
            buffType,
            activationUTC: formatDateUTC(activationTime),
            activationLocal: activationTime,
            buffEndUTC: formatDateUTC(buffEndTime),
            buffEndLocal: buffEndTime,
            readyUTC: formatDateUTC(readyTime),
            readyLocal: readyTime,
        };
    }

    function clearBuff() {
        buffResult = null;
        buffError = '';
        buffHours = '';
        buffMinutes = '';
    }
</script>

<div class="timer-panel">
    <div class="panel-header">
        <i class="fas fa-bolt panel-icon buff"></i>
        <div>
            <h3>Kingdom Buff Timer</h3>
            <p>Calculate when a kingdom buff will be ready again.</p>
        </div>
    </div>

    <div class="input-grid">
        <div class="input-group">
            <label>Buff Type</label>
            <div class="custom-select-container">
                <button
                    class="custom-select-trigger"
                    class:open={openDropdown === 'buff-type'}
                    on:click|stopPropagation={() => toggleDropdown('buff-type')}
                >
                    <i class="fas {buffTypeOptions.find((o) => o.value === buffType)?.icon} option-icon"></i>
                    <span class="selected-text">{buffType}</span>
                    <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'buff-type'}></i>
                </button>
                {#if openDropdown === 'buff-type'}
                    <div class="custom-dropdown-menu">
                        {#each buffTypeOptions as opt}
                            <button
                                class="dropdown-option"
                                class:selected={buffType === opt.value}
                                on:click|stopPropagation={() =>
                                    selectOption('buff-type', opt.value, (v) => (buffType = v))}
                            >
                                <i class="fas {opt.icon} option-icon"></i>
                                <span>{opt.label}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
        <div class="input-group">
            <label>Time Left</label>
            <div class="dhm-row">
                <div class="dhm-field">
                    <input type="number" bind:value={buffHours} placeholder="0" min="0" max="23" />
                    <span class="dhm-label">H</span>
                </div>
                <div class="dhm-field">
                    <input type="number" bind:value={buffMinutes} placeholder="0" min="0" max="59" />
                    <span class="dhm-label">M</span>
                </div>
            </div>
        </div>
    </div>

    <div class="buff-info">
        <i class="fas fa-info-circle"></i>
        <span>
            {buffType} lasts <strong>{buffDurations[buffType]}h</strong> &middot; Cooldown is
            <strong>20h</strong> after activation
        </span>
    </div>

    <div class="action-row">
        <button class="btn-calculate" on:click={calculateBuff}>
            <span>Calculate</span>
        </button>
        {#if buffResult || buffError}
            <button class="btn-clear" on:click={clearBuff}>
                <i class="fas fa-times"></i> Clear
            </button>
        {/if}
    </div>

    {#if buffError}
        <div class="result-card error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{buffError}</span>
        </div>
    {/if}

    {#if buffResult}
        <div class="result-card">
            <div class="result-title">
                <i class="fas fa-bolt buff-icon"></i>
                {buffResult.buffType} Status
            </div>

            <div class="result-section">
                <div class="result-label">
                    The <strong>{buffResult.buffType}</strong> was <strong>popped</strong> at:
                </div>
                <div class="time-rows">
                    <div class="time-row">
                        <span class="time-tag">UTC</span><span class="time-value"
                            >{buffResult.activationUTC}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Local</span><span class="time-value"
                            >{formatDateLocal(buffResult.activationLocal)}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Relative</span><span class="time-value relative"
                            >{(void tick, formatRelative(buffResult.activationLocal))}</span
                        >
                    </div>
                </div>
            </div>
            <div class="result-divider"></div>
            <div class="result-section">
                <div class="result-label">It will <strong>end</strong> at:</div>
                <div class="time-rows">
                    <div class="time-row">
                        <span class="time-tag">UTC</span><span class="time-value"
                            >{buffResult.buffEndUTC}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Local</span><span class="time-value"
                            >{formatDateLocal(buffResult.buffEndLocal)}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Relative</span><span class="time-value relative"
                            >{(void tick, formatRelative(buffResult.buffEndLocal))}</span
                        >
                    </div>
                </div>
            </div>
            <div class="result-divider"></div>
            <div class="result-section">
                <div class="result-label">
                    And will be <strong>ready again</strong> at (20h after popping):
                </div>
                <div class="time-rows">
                    <div class="time-row">
                        <span class="time-tag">UTC</span><span class="time-value"
                            >{buffResult.readyUTC}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Local</span><span class="time-value"
                            >{formatDateLocal(buffResult.readyLocal)}</span
                        >
                    </div>
                    <div class="time-row">
                        <span class="time-tag">Relative</span><span class="time-value relative"
                            >{(void tick, formatRelative(buffResult.readyLocal))}</span
                        >
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
