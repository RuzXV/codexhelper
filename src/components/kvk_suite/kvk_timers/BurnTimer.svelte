<script lang="ts">
    import '../../../styles/kvk-timer-shared.css';
    import { slide } from 'svelte/transition';
    import {
        formatDateUTC,
        formatDateLocal,
        formatRelative,
        dhmToMs,
        parseHP,
        formatHPInput,
    } from '../../../lib/kvk-timers/timerUtils';

    export let tick: number;

    // ── State ──
    let burnStructure: 'Flag' | 'Fort' | 'City' = 'Flag';
    let burnHP: string = '';
    let burnLastBurnTime: string = '';
    let burnBuffPercent: string = '';
    let burnBuffHours: string = '';
    let burnBuffMinutes: string = '';
    let showTidesOfWar: boolean = false;

    type BurnResult = {
        structure: string;
        nextBurnUTC?: string;
        nextBurnLocal?: Date;
        totalBurnUTC: string;
        totalBurnLocal: Date;
        remainingBurns?: number;
    } | null;

    let burnResult: BurnResult = null;
    let burnError: string = '';

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

    const burnStructureOptions = [
        { value: 'Flag', label: 'Flag', icon: 'fa-flag' },
        { value: 'Fort', label: 'Fort', icon: 'fa-chess-rook' },
        { value: 'City', label: 'City', icon: 'fa-city' },
    ];

    // ── Calculation ──
    function calculateBurn() {
        burnError = '';
        burnResult = null;

        const hp = parseHP(burnHP);
        if (!hp || hp <= 0) {
            burnError = 'HP must be a positive number.';
            return;
        }

        let now: Date;
        if (burnLastBurnTime.trim()) {
            const parts = burnLastBurnTime.trim().split(':');
            if (parts.length !== 2) {
                burnError = 'Invalid time format. Use HH:MM (e.g. 19:36).';
                return;
            }
            const h = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
                burnError = 'Invalid time. Hours 0-23, minutes 0-59.';
                return;
            }
            now = new Date();
            now.setUTCHours(h, m, 0, 0);
            if (now.getTime() > Date.now()) {
                now.setUTCDate(now.getUTCDate() - 1);
            }
        } else {
            now = new Date();
        }
        const defaultBurnRate = 2;
        let burnRate = defaultBurnRate;
        let burnSpeedEndTime: Date | null = null;

        if (burnStructure !== 'City' && showTidesOfWar) {
            if (burnBuffPercent.trim()) {
                const pctStr = burnBuffPercent.trim().replace('%', '');
                const pct = parseFloat(pctStr);
                if (isNaN(pct) || pct < 0) {
                    burnError = 'Invalid burn speed buff percentage.';
                    return;
                }
                burnRate *= 1 + pct / 100;
            }

            const buffMs = dhmToMs('0', burnBuffHours, burnBuffMinutes);
            if (buffMs > 0) {
                burnSpeedEndTime = new Date(now.getTime() + buffMs);
            }
        }

        if (burnStructure === 'City') {
            const totalBurnTime = new Date(now.getTime() + hp * 1000);
            burnResult = {
                structure: 'City',
                totalBurnUTC: formatDateUTC(totalBurnTime),
                totalBurnLocal: totalBurnTime,
            };
            return;
        }

        const burnIntervalMs = burnStructure === 'Flag' ? 20 * 60 * 1000 : 60 * 60 * 1000;
        const burnIntervalSec = burnIntervalMs / 1000;

        let totalBurnTime: Date;

        if (burnSpeedEndTime && burnSpeedEndTime.getTime() > now.getTime()) {
            const buffDurationSec = (burnSpeedEndTime.getTime() - now.getTime()) / 1000;
            const hpBurnedDuringBuff = burnRate * buffDurationSec;

            if (hpBurnedDuringBuff >= hp) {
                const totalBurnSec = hp / burnRate;
                totalBurnTime = new Date(now.getTime() + totalBurnSec * 1000);
            } else {
                const remainingHP = hp - hpBurnedDuringBuff;
                const remainingBurnSec = remainingHP / defaultBurnRate;
                totalBurnTime = new Date(burnSpeedEndTime.getTime() + remainingBurnSec * 1000);
            }
        } else {
            const totalBurnSec = hp / defaultBurnRate;
            totalBurnTime = new Date(now.getTime() + totalBurnSec * 1000);
        }

        const hpPerInterval = defaultBurnRate * burnIntervalSec;
        const totalIntervalsNeeded = Math.ceil(hp / hpPerInterval);
        const remainingBurns = Math.max(0, totalIntervalsNeeded - 1);

        const nextBurnTime = new Date(now.getTime() + burnIntervalMs);

        burnResult = {
            structure: burnStructure,
            nextBurnUTC: formatDateUTC(nextBurnTime),
            nextBurnLocal: nextBurnTime,
            totalBurnUTC: formatDateUTC(totalBurnTime),
            totalBurnLocal: totalBurnTime,
            remainingBurns,
        };
    }

    function clearBurn() {
        burnResult = null;
        burnError = '';
        burnHP = '';
        burnLastBurnTime = '';
        burnBuffPercent = '';
        burnBuffHours = '';
        burnBuffMinutes = '';
    }
</script>

<div class="timer-panel">
    <div class="panel-header">
        <i class="fas fa-fire panel-icon burn"></i>
        <div>
            <h3>Structure Burn Timer</h3>
            <p>Calculate when a structure will be fully burned down.</p>
        </div>
    </div>

    <div class="input-grid burn-grid">
        <div class="input-group">
            <label>Structure</label>
            <div class="custom-select-container">
                <button
                    class="custom-select-trigger"
                    class:open={openDropdown === 'burn-structure'}
                    on:click|stopPropagation={() => toggleDropdown('burn-structure')}
                >
                    <i
                        class="fas {burnStructureOptions.find((o) => o.value === burnStructure)
                            ?.icon} option-icon"
                    ></i>
                    <span class="selected-text">{burnStructure}</span>
                    <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'burn-structure'}></i>
                </button>
                {#if openDropdown === 'burn-structure'}
                    <div class="custom-dropdown-menu">
                        {#each burnStructureOptions as opt}
                            <button
                                class="dropdown-option"
                                class:selected={burnStructure === opt.value}
                                on:click|stopPropagation={() =>
                                    selectOption('burn-structure', opt.value, (v) => (burnStructure = v))}
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
            <label for="burn-hp">Current HP</label>
            <input
                id="burn-hp"
                type="text"
                inputmode="numeric"
                bind:value={burnHP}
                placeholder="Example: 50,000"
                on:input={() => {
                    burnHP = formatHPInput(burnHP);
                }}
            />
        </div>
        <div class="input-group">
            <label for="burn-last-burn">Last Burn (UTC)</label>
            <input
                id="burn-last-burn"
                type="text"
                bind:value={burnLastBurnTime}
                placeholder="Example: 19:36"
            />
        </div>
    </div>

    {#if burnStructure !== 'City'}
        <div class="toggle-row">
            <button
                class="toggle-btn"
                class:active={showTidesOfWar}
                on:click={() => (showTidesOfWar = !showTidesOfWar)}
            >
                <div class="toggle-track">
                    <div class="toggle-thumb"></div>
                </div>
                <span>Tides of War Buffs</span>
            </button>
        </div>

        {#if showTidesOfWar}
            <div class="input-grid buff-fields" transition:slide={{ duration: 250 }}>
                <div class="input-group">
                    <label for="burn-buff">Burn Speed Buff %</label>
                    <input
                        id="burn-buff"
                        type="text"
                        bind:value={burnBuffPercent}
                        placeholder="Example: 20"
                    />
                </div>
                <div class="input-group">
                    <label>Buff Duration</label>
                    <div class="dhm-row">
                        <div class="dhm-field">
                            <input type="number" bind:value={burnBuffHours} placeholder="0" min="0" />
                            <span class="dhm-label">H</span>
                        </div>
                        <div class="dhm-field">
                            <input
                                type="number"
                                bind:value={burnBuffMinutes}
                                placeholder="0"
                                min="0"
                                max="59"
                            />
                            <span class="dhm-label">M</span>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}

    <div class="action-row">
        <button class="btn-calculate" on:click={calculateBurn}>
            <span>Calculate</span>
        </button>
        {#if burnResult || burnError}
            <button class="btn-clear" on:click={clearBurn}>
                <i class="fas fa-times"></i> Clear
            </button>
        {/if}
    </div>

    {#if burnError}
        <div class="result-card error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{burnError}</span>
        </div>
    {/if}

    {#if burnResult}
        <div class="result-card">
            <div class="result-title">
                <i class="fas fa-fire burn-icon"></i>
                {burnResult.structure} Burn Status
            </div>

            {#if burnResult.structure === 'City'}
                <div class="result-section">
                    <div class="result-label">The city will be <strong>fully burned</strong> at:</div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{burnResult.totalBurnUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(burnResult.totalBurnLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(burnResult.totalBurnLocal))}</span
                            >
                        </div>
                    </div>
                </div>
            {:else}
                <div class="result-section">
                    <div class="result-label">
                        <strong>Next burn</strong> for the {burnResult.structure} at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{burnResult.nextBurnUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{burnResult.nextBurnLocal
                                    ? formatDateLocal(burnResult.nextBurnLocal)
                                    : ''}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick,
                                burnResult.nextBurnLocal
                                    ? formatRelative(burnResult.nextBurnLocal)
                                    : '')}</span
                            >
                        </div>
                    </div>
                    <div class="result-stat">
                        <span class="stat-label">Remaining burns:</span>
                        <span class="stat-value">{burnResult.remainingBurns}</span>
                    </div>
                </div>
                <div class="result-divider"></div>
                <div class="result-section">
                    <div class="result-label">
                        If not healed, the {burnResult.structure} will be <strong>fully destroyed</strong> at:
                    </div>
                    <div class="time-rows">
                        <div class="time-row">
                            <span class="time-tag">UTC</span><span class="time-value"
                                >{burnResult.totalBurnUTC}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Local</span><span class="time-value"
                                >{formatDateLocal(burnResult.totalBurnLocal)}</span
                            >
                        </div>
                        <div class="time-row">
                            <span class="time-tag">Relative</span><span class="time-value relative"
                                >{(void tick, formatRelative(burnResult.totalBurnLocal))}</span
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
</div>
