<script lang="ts">
    // ============================================
    // KvK Timers & Tracking
    // Replicates the exact timer logic from
    // helper_bot/bot/functions/cog_timers.py
    // ============================================

    type TimerTab = 'burn' | 'shield' | 'heal' | 'buff';
    let activeTab: TimerTab = 'burn';

    // ── Shared helpers ──

    const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function ordinal(n: number): string {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function formatDateUTC(date: Date): string {
        const day = ordinal(date.getUTCDate());
        const month = shortMonths[date.getUTCMonth()];
        const hours = date.getUTCHours();
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${day} of ${month}, ${hours}:${minutes} UTC`;
    }

    function formatDateLocal(date: Date): string {
        const day = ordinal(date.getDate());
        const month = shortMonths[date.getMonth()];
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${day} of ${month}, ${hours}:${minutes} ${ampm}`;
    }

    /** Parse an HP string that may contain , or . as thousand separators */
    function parseHP(val: string): number {
        if (!val) return NaN;
        // Strip commas and dots used as thousand separators
        const cleaned = val.replace(/[,.\s]/g, '');
        return parseInt(cleaned, 10);
    }

    /** Format a number with commas for display */
    function formatHP(n: number): string {
        return n.toLocaleString('en-US');
    }

    /** Auto-format an HP input value with commas as user types */
    function formatHPInput(value: string): string {
        const num = parseHP(value);
        if (isNaN(num) || num === 0) {
            // Keep empty or partial input as-is
            return value.replace(/[^0-9.,\s]/g, '');
        }
        return formatHP(num);
    }

    function formatRelative(date: Date): string {
        const now = new Date();
        let diffMs = date.getTime() - now.getTime();
        const past = diffMs < 0;
        diffMs = Math.abs(diffMs);
        const totalSec = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);

        let parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (parts.length === 0) parts.push('< 1m');
        const str = parts.join(' ');
        return past ? `${str} ago` : `in ${str}`;
    }

    /** Convert separate D/H/M fields to total milliseconds */
    function dhmToMs(d: string, h: string, m: string): number {
        const days = parseInt(d) || 0;
        const hours = parseInt(h) || 0;
        const mins = parseInt(m) || 0;
        return (days * 86400 + hours * 3600 + mins * 60) * 1000;
    }

    // ── Tick for live relative times ──
    let tick = 0;
    let tickInterval: ReturnType<typeof setInterval>;

    import { onMount, onDestroy } from 'svelte';
    import { slide } from 'svelte/transition';

    // ── Custom dropdown logic ──
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

    onMount(() => {
        tickInterval = setInterval(() => { tick++; }, 15000);
        document.addEventListener('click', handleClickOutside);
        return () => {
            clearInterval(tickInterval);
            document.removeEventListener('click', handleClickOutside);
        };
    });

    // ============================================
    // BURN TIMER
    // ============================================
    let burnStructure: 'Flag' | 'Fort' | 'City' = 'Flag';
    let burnHP: string = '';
    let burnLastBurnTime: string = '';
    let burnBuffPercent: string = '';
    let burnBuffHours: string = '';
    let burnBuffMinutes: string = '';
    let showTidesOfWar: boolean = false;

    type BurnResult = {
        structure: string;
        nextBurnUTC?: string; nextBurnLocal?: Date;
        totalBurnUTC: string; totalBurnLocal: Date;
        remainingBurns?: number;
    } | null;

    let burnResult: BurnResult = null;
    let burnError: string = '';

    function calculateBurn() {
        burnError = '';
        burnResult = null;

        const hp = parseHP(burnHP);
        if (!hp || hp <= 0) { burnError = 'HP must be a positive number.'; return; }

        let now: Date;
        if (burnLastBurnTime.trim()) {
            const parts = burnLastBurnTime.trim().split(':');
            if (parts.length !== 2) { burnError = 'Invalid time format. Use HH:MM (e.g. 19:36).'; return; }
            const h = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) { burnError = 'Invalid time. Hours 0-23, minutes 0-59.'; return; }
            now = new Date();
            now.setUTCHours(h, m, 0, 0);
            // If that time is in the future, assume it was yesterday
            if (now.getTime() > Date.now()) {
                now.setUTCDate(now.getUTCDate() - 1);
            }
        } else {
            now = new Date();
        }
        const defaultBurnRate = 2; // HP per second
        let burnRate = defaultBurnRate;
        let burnSpeedEndTime: Date | null = null;

        // Parse buff (Flag/Fort only)
        if (burnStructure !== 'City' && showTidesOfWar) {
            if (burnBuffPercent.trim()) {
                const pctStr = burnBuffPercent.trim().replace('%', '');
                const pct = parseFloat(pctStr);
                if (isNaN(pct) || pct < 0) { burnError = 'Invalid burn speed buff percentage.'; return; }
                burnRate *= (1 + pct / 100);
            }

            const buffMs = dhmToMs('0', burnBuffHours, burnBuffMinutes);
            if (buffMs > 0) {
                burnSpeedEndTime = new Date(now.getTime() + buffMs);
            }
        }

        // City: 1 second per HP
        if (burnStructure === 'City') {
            const totalBurnTime = new Date(now.getTime() + hp * 1000);
            burnResult = {
                structure: 'City',
                totalBurnUTC: formatDateUTC(totalBurnTime),
                totalBurnLocal: totalBurnTime
            };
            return;
        }

        // Flag / Fort intervals
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
            remainingBurns
        };
    }

    // ============================================
    // SHIELD TIMER
    // ============================================
    const shieldingStructures: Record<string, { shielding_time: number; unshielding_time: number }> = {
        'RCF':          { shielding_time: 48,  unshielding_time: 6 },
        'Lost Temple':  { shielding_time: 168, unshielding_time: 8 },
        'Ziggurat':     { shielding_time: 72,  unshielding_time: 8 },
        'Other':        { shielding_time: 48,  unshielding_time: 4 }
    };

    let shieldStructure: string = 'RCF';
    let shieldStatus: 'shielded' | 'unshielded' = 'shielded';
    let shieldDays: string = '';
    let shieldHours: string = '';
    let shieldMinutes: string = '';

    type ShieldResult = {
        structureName: string;
        status: 'shielded' | 'unshielded';
        unshieldingUTC: string; unshieldingLocal: Date;
        shieldingUTC: string; shieldingLocal: Date;
        config: { shielding_time: number; unshielding_time: number };
    } | null;

    let shieldResult: ShieldResult = null;
    let shieldError: string = '';

    function calculateShield() {
        shieldError = '';
        shieldResult = null;

        const timerMs = dhmToMs(shieldDays, shieldHours, shieldMinutes);
        if (timerMs <= 0) { shieldError = 'Please provide a time remaining.'; return; }

        const now = new Date();
        const config = shieldingStructures[shieldStructure];
        const structureName = shieldStructure === 'Other' ? 'Structure' : shieldStructure;

        if (shieldStatus === 'shielded') {
            const unshieldingTime = new Date(now.getTime() + timerMs);
            const shieldingTime = new Date(unshieldingTime.getTime() + config.unshielding_time * 3600000);
            shieldResult = {
                structureName, status: shieldStatus, config,
                unshieldingUTC: formatDateUTC(unshieldingTime), unshieldingLocal: unshieldingTime,
                shieldingUTC: formatDateUTC(shieldingTime), shieldingLocal: shieldingTime
            };
        } else {
            const shieldingTime = new Date(now.getTime() + timerMs);
            const unshieldingTime = new Date(shieldingTime.getTime() + config.shielding_time * 3600000);
            shieldResult = {
                structureName, status: shieldStatus, config,
                shieldingUTC: formatDateUTC(shieldingTime), shieldingLocal: shieldingTime,
                unshieldingUTC: formatDateUTC(unshieldingTime), unshieldingLocal: unshieldingTime
            };
        }
    }

    // ============================================
    // HEAL TIMER
    // ============================================
    let healCurrentHP: string = '';
    let healMaxHP: string = '';

    type HealResult = {
        healUTC: string; healLocal: Date;
    } | null;

    let healResult: HealResult = null;
    let healError: string = '';

    function calculateHeal() {
        healError = '';
        healResult = null;

        const currentHP = parseHP(healCurrentHP);
        const maxHP = parseHP(healMaxHP);

        if (isNaN(currentHP) || isNaN(maxHP)) { healError = 'Please enter valid HP values.'; return; }
        if (currentHP < 0 || maxHP < 0) { healError = 'HP values cannot be negative.'; return; }
        if (maxHP < currentHP) { healError = 'Max HP must be greater than or equal to current HP.'; return; }

        const hpNeeded = maxHP - currentHP;
        const secondsNeeded = hpNeeded * 2; // 0.5 HP per second = 2 seconds per HP

        const now = new Date();
        const healingTime = new Date(now.getTime() + secondsNeeded * 1000);

        healResult = {
            healUTC: formatDateUTC(healingTime),
            healLocal: healingTime
        };
    }

    // ============================================
    // BUFF TIMER
    // ============================================
    const buffDurations: Record<string, number> = {
        'Building Buff': 4,
        'Research Buff': 4,
        'Training Buff': 4,
        'Resource Buff': 8,
        'Healing Buff': 8
    };
    const cooldownPeriodHours = 20;

    let buffType: string = 'Building Buff';
    let buffHours: string = '';
    let buffMinutes: string = '';

    type BuffResult = {
        buffType: string;
        activationUTC: string; activationLocal: Date;
        buffEndUTC: string; buffEndLocal: Date;
        readyUTC: string; readyLocal: Date;
    } | null;

    let buffResult: BuffResult = null;
    let buffError: string = '';

    function calculateBuff() {
        buffError = '';
        buffResult = null;

        let timerMs = dhmToMs('0', buffHours, buffMinutes);
        if (timerMs <= 0) { buffError = 'Please provide a time remaining.'; return; }

        const maxBuffMs = buffDurations[buffType] * 3600000;
        if (timerMs > maxBuffMs) {
            timerMs = maxBuffMs; // Cap to max like the bot does
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
            readyLocal: readyTime
        };
    }

    // ── Clear helpers ──
    function clearBurn() { burnResult = null; burnError = ''; burnHP = ''; burnLastBurnTime = ''; burnBuffPercent = ''; burnBuffHours = ''; burnBuffMinutes = ''; }
    function clearShield() { shieldResult = null; shieldError = ''; shieldDays = ''; shieldHours = ''; shieldMinutes = ''; }
    function clearHeal() { healResult = null; healError = ''; healCurrentHP = ''; healMaxHP = ''; }
    function clearBuff() { buffResult = null; buffError = ''; buffHours = ''; buffMinutes = ''; }

    // ── Dropdown display labels ──
    const burnStructureOptions = [
        { value: 'Flag', label: 'Flag', icon: 'fa-flag' },
        { value: 'Fort', label: 'Fort', icon: 'fa-chess-rook' },
        { value: 'City', label: 'City', icon: 'fa-city' }
    ];

    const shieldStructureOptions = [
        { value: 'RCF', label: 'RCF' },
        { value: 'Lost Temple', label: 'Lost Temple' },
        { value: 'Ziggurat', label: 'Ziggurat' },
        { value: 'Other', label: 'Other' }
    ];

    const shieldStatusOptions = [
        { value: 'shielded', label: 'Shielded', icon: 'fa-shield-halved' },
        { value: 'unshielded', label: 'Unshielded', icon: 'fa-shield' }
    ];

    const buffTypeOptions = [
        { value: 'Building Buff', label: 'Building Buff', icon: 'fa-hammer' },
        { value: 'Research Buff', label: 'Research Buff', icon: 'fa-flask' },
        { value: 'Training Buff', label: 'Training Buff', icon: 'fa-person-military-rifle' },
        { value: 'Resource Buff', label: 'Resource Buff', icon: 'fa-wheat-awn' },
        { value: 'Healing Buff', label: 'Healing Buff', icon: 'fa-kit-medical' }
    ];
</script>

<div class="timers-container">
    <!-- Tab Navigation -->
    <div class="timer-tabs">
        <button class="timer-tab" class:active={activeTab === 'burn'} on:click={() => { activeTab = 'burn'; }}>
            <i class="fas fa-fire"></i>
            <span>Burn</span>
        </button>
        <button class="timer-tab" class:active={activeTab === 'shield'} on:click={() => { activeTab = 'shield'; }}>
            <i class="fas fa-shield-halved"></i>
            <span>Shield</span>
        </button>
        <button class="timer-tab" class:active={activeTab === 'heal'} on:click={() => { activeTab = 'heal'; }}>
            <i class="fas fa-heart-pulse"></i>
            <span>Heal</span>
        </button>
        <button class="timer-tab" class:active={activeTab === 'buff'} on:click={() => { activeTab = 'buff'; }}>
            <i class="fas fa-bolt"></i>
            <span>Buff</span>
        </button>
    </div>

    <!-- Tab Content -->
    <div class="timer-content">

        <!-- ══════════════════════════════════════ -->
        <!-- BURN TAB -->
        <!-- ══════════════════════════════════════ -->
        {#if activeTab === 'burn'}
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
                            <button class="custom-select-trigger" class:open={openDropdown === 'burn-structure'} on:click|stopPropagation={() => toggleDropdown('burn-structure')}>
                                <i class="fas {burnStructureOptions.find(o => o.value === burnStructure)?.icon} option-icon"></i>
                                <span class="selected-text">{burnStructure}</span>
                                <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'burn-structure'}></i>
                            </button>
                            {#if openDropdown === 'burn-structure'}
                                <div class="custom-dropdown-menu">
                                    {#each burnStructureOptions as opt}
                                        <button class="dropdown-option" class:selected={burnStructure === opt.value} on:click|stopPropagation={() => selectOption('burn-structure', opt.value, v => burnStructure = v)}>
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
                        <input id="burn-hp" type="text" inputmode="numeric" bind:value={burnHP} placeholder="Example: 50,000" on:input={() => { burnHP = formatHPInput(burnHP); }} />
                    </div>
                    <div class="input-group">
                        <label for="burn-last-burn">Last Burn (UTC)</label>
                        <input id="burn-last-burn" type="text" bind:value={burnLastBurnTime} placeholder="Example: 19:36" />
                    </div>
                </div>

                {#if burnStructure !== 'City'}
                    <div class="toggle-row">
                        <button class="toggle-btn" class:active={showTidesOfWar} on:click={() => showTidesOfWar = !showTidesOfWar}>
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
                                <input id="burn-buff" type="text" bind:value={burnBuffPercent} placeholder="Example: 20" />
                            </div>
                            <div class="input-group">
                                <label>Buff Duration</label>
                                <div class="dhm-row">
                                    <div class="dhm-field">
                                        <input type="number" bind:value={burnBuffHours} placeholder="0" min="0" />
                                        <span class="dhm-label">H</span>
                                    </div>
                                    <div class="dhm-field">
                                        <input type="number" bind:value={burnBuffMinutes} placeholder="0" min="0" max="59" />
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
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{burnResult.totalBurnUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(burnResult.totalBurnLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(burnResult.totalBurnLocal)}</span></div>
                                </div>
                            </div>
                        {:else}
                            <div class="result-section">
                                <div class="result-label"><strong>Next burn</strong> for the {burnResult.structure} at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{burnResult.nextBurnUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{burnResult.nextBurnLocal ? formatDateLocal(burnResult.nextBurnLocal) : ''}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, burnResult.nextBurnLocal ? formatRelative(burnResult.nextBurnLocal) : ''}</span></div>
                                </div>
                                <div class="result-stat">
                                    <span class="stat-label">Remaining burns:</span>
                                    <span class="stat-value">{burnResult.remainingBurns}</span>
                                </div>
                            </div>
                            <div class="result-divider"></div>
                            <div class="result-section">
                                <div class="result-label">If not healed, the {burnResult.structure} will be <strong>fully destroyed</strong> at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{burnResult.totalBurnUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(burnResult.totalBurnLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(burnResult.totalBurnLocal)}</span></div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

        <!-- ══════════════════════════════════════ -->
        <!-- SHIELD TAB -->
        <!-- ══════════════════════════════════════ -->
        {:else if activeTab === 'shield'}
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
                            <button class="custom-select-trigger" class:open={openDropdown === 'shield-structure'} on:click|stopPropagation={() => toggleDropdown('shield-structure')}>
                                <span class="selected-text">{shieldStructure}</span>
                                <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'shield-structure'}></i>
                            </button>
                            {#if openDropdown === 'shield-structure'}
                                <div class="custom-dropdown-menu">
                                    {#each shieldStructureOptions as opt}
                                        <button class="dropdown-option" class:selected={shieldStructure === opt.value} on:click|stopPropagation={() => selectOption('shield-structure', opt.value, v => shieldStructure = v)}>
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
                            <button class="custom-select-trigger" class:open={openDropdown === 'shield-status'} on:click|stopPropagation={() => toggleDropdown('shield-status')}>
                                <i class="fas {shieldStatusOptions.find(o => o.value === shieldStatus)?.icon} option-icon"></i>
                                <span class="selected-text">{shieldStatus === 'shielded' ? 'Shielded' : 'Unshielded'}</span>
                                <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'shield-status'}></i>
                            </button>
                            {#if openDropdown === 'shield-status'}
                                <div class="custom-dropdown-menu">
                                    {#each shieldStatusOptions as opt}
                                        <button class="dropdown-option" class:selected={shieldStatus === opt.value} on:click|stopPropagation={() => selectOption('shield-status', opt.value, v => shieldStatus = v)}>
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
                                <div class="result-label">The {shieldResult.structureName} will be <strong>unshielded</strong> at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{shieldResult.unshieldingUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(shieldResult.unshieldingLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(shieldResult.unshieldingLocal)}</span></div>
                                </div>
                            </div>
                            <div class="result-divider"></div>
                            <div class="result-section">
                                <div class="result-label">After being unshielded for {shieldResult.config.unshielding_time} hours, it will be <strong>shielded</strong> again at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{shieldResult.shieldingUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(shieldResult.shieldingLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(shieldResult.shieldingLocal)}</span></div>
                                </div>
                            </div>
                        {:else}
                            <div class="result-section">
                                <div class="result-label">The {shieldResult.structureName} will be <strong>shielded</strong> at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{shieldResult.shieldingUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(shieldResult.shieldingLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(shieldResult.shieldingLocal)}</span></div>
                                </div>
                            </div>
                            <div class="result-divider"></div>
                            <div class="result-section">
                                <div class="result-label">After being shielded for {shieldResult.config.shielding_time} hours, it will be <strong>unshielded</strong> again at:</div>
                                <div class="time-rows">
                                    <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{shieldResult.unshieldingUTC}</span></div>
                                    <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(shieldResult.unshieldingLocal)}</span></div>
                                    <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(shieldResult.unshieldingLocal)}</span></div>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

        <!-- ══════════════════════════════════════ -->
        <!-- HEAL TAB -->
        <!-- ══════════════════════════════════════ -->
        {:else if activeTab === 'heal'}
            <div class="timer-panel">
                <div class="panel-header">
                    <i class="fas fa-heart-pulse panel-icon heal"></i>
                    <div>
                        <h3>Structure Heal Timer</h3>
                        <p>Calculate when a structure will be fully healed.</p>
                    </div>
                </div>

                <div class="input-grid">
                    <div class="input-group">
                        <label for="heal-current">Current HP</label>
                        <input id="heal-current" type="text" inputmode="numeric" bind:value={healCurrentHP} placeholder="Example: 10,000" on:input={() => { healCurrentHP = formatHPInput(healCurrentHP); }} />
                    </div>
                    <div class="input-group">
                        <label for="heal-max">Max HP</label>
                        <input id="heal-max" type="text" inputmode="numeric" bind:value={healMaxHP} placeholder="Example: 50,000" on:input={() => { healMaxHP = formatHPInput(healMaxHP); }} />
                    </div>
                </div>

                <div class="action-row">
                    <button class="btn-calculate" on:click={calculateHeal}>
                        <span>Calculate</span>
                    </button>
                    {#if healResult || healError}
                        <button class="btn-clear" on:click={clearHeal}>
                            <i class="fas fa-times"></i> Clear
                        </button>
                    {/if}
                </div>

                {#if healError}
                    <div class="result-card error">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>{healError}</span>
                    </div>
                {/if}

                {#if healResult}
                    <div class="result-card">
                        <div class="result-title">
                            <i class="fas fa-heart-pulse heal-icon"></i>
                            Structure Heal Status
                        </div>
                        <div class="result-section">
                            <div class="result-label">The structure will be <strong>fully healed</strong> at:</div>
                            <div class="time-rows">
                                <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{healResult.healUTC}</span></div>
                                <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(healResult.healLocal)}</span></div>
                                <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(healResult.healLocal)}</span></div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>

        <!-- ══════════════════════════════════════ -->
        <!-- BUFF TAB -->
        <!-- ══════════════════════════════════════ -->
        {:else if activeTab === 'buff'}
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
                            <button class="custom-select-trigger" class:open={openDropdown === 'buff-type'} on:click|stopPropagation={() => toggleDropdown('buff-type')}>
                                <i class="fas {buffTypeOptions.find(o => o.value === buffType)?.icon} option-icon"></i>
                                <span class="selected-text">{buffType}</span>
                                <i class="fas fa-chevron-down arrow" class:rotated={openDropdown === 'buff-type'}></i>
                            </button>
                            {#if openDropdown === 'buff-type'}
                                <div class="custom-dropdown-menu">
                                    {#each buffTypeOptions as opt}
                                        <button class="dropdown-option" class:selected={buffType === opt.value} on:click|stopPropagation={() => selectOption('buff-type', opt.value, v => buffType = v)}>
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
                        {buffType} lasts <strong>{buffDurations[buffType]}h</strong> &middot; Cooldown is <strong>20h</strong> after activation
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
                            <div class="result-label">The <strong>{buffResult.buffType}</strong> was <strong>popped</strong> at:</div>
                            <div class="time-rows">
                                <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{buffResult.activationUTC}</span></div>
                                <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(buffResult.activationLocal)}</span></div>
                                <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(buffResult.activationLocal)}</span></div>
                            </div>
                        </div>
                        <div class="result-divider"></div>
                        <div class="result-section">
                            <div class="result-label">It will <strong>end</strong> at:</div>
                            <div class="time-rows">
                                <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{buffResult.buffEndUTC}</span></div>
                                <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(buffResult.buffEndLocal)}</span></div>
                                <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(buffResult.buffEndLocal)}</span></div>
                            </div>
                        </div>
                        <div class="result-divider"></div>
                        <div class="result-section">
                            <div class="result-label">And will be <strong>ready again</strong> at (20h after popping):</div>
                            <div class="time-rows">
                                <div class="time-row"><span class="time-tag">UTC</span><span class="time-value">{buffResult.readyUTC}</span></div>
                                <div class="time-row"><span class="time-tag">Local</span><span class="time-value">{formatDateLocal(buffResult.readyLocal)}</span></div>
                                <div class="time-row"><span class="time-tag">Relative</span><span class="time-value relative">{void tick, formatRelative(buffResult.readyLocal)}</span></div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    /* ================================================
       CONTAINER
       ================================================ */
    .timers-container {
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
        padding: var(--spacing-4);
    }

    /* ================================================
       TABS
       ================================================ */
    .timer-tabs {
        display: flex;
        gap: var(--spacing-2);
        background: rgba(20, 21, 24, 0.65);
        padding: var(--spacing-2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        margin-bottom: var(--spacing-6);
    }

    .timer-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-4);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .timer-tab:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
    }

    .timer-tab.active {
        background: var(--accent-blue-light);
        border-color: var(--accent-blue);
        color: var(--text-primary);
    }

    .timer-tab i {
        font-size: 0.9rem;
    }

    /* ================================================
       PANEL
       ================================================ */
    .timer-panel {
        background: rgba(20, 21, 24, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        padding: var(--spacing-6);
    }

    .panel-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-6);
    }

    .panel-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .panel-icon.burn {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ef4444;
    }
    .panel-icon.shield {
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #3b82f6;
    }
    .panel-icon.heal {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #10b981;
    }
    .panel-icon.buff {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #f59e0b;
    }

    .panel-header h3 {
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
    }

    .panel-header p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin: 0;
    }

    /* ================================================
       INPUTS
       ================================================ */
    .input-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-4);
    }

    .input-grid.burn-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    /* Hide number input spinners */
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
    }

    .input-group.full-width {
        grid-column: 1 / -1;
    }

    .input-group label {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .input-group input {
        width: 100%;
        padding: var(--spacing-3);
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        outline: none;
        font-family: inherit;
    }

    .input-group input::placeholder {
        color: var(--text-muted);
    }

    .input-group input:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    /* ── D/H/M time inputs ── */
    .dhm-row {
        display: flex;
        gap: var(--spacing-2);
    }

    .dhm-field {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--spacing-1);
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding-right: var(--spacing-2);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .dhm-field:focus-within {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .dhm-field input {
        flex: 1;
        width: 100%;
        padding: var(--spacing-3);
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        outline: none;
        font-family: inherit;
        min-width: 0;
        box-shadow: none;
    }

    .dhm-field input:focus {
        border: none;
        box-shadow: none;
    }

    .dhm-field input::placeholder {
        color: var(--text-muted);
    }

    .dhm-label {
        font-size: var(--font-size-xs);
        font-weight: 700;
        color: var(--text-muted);
        flex-shrink: 0;
        user-select: none;
    }

    /* ================================================
       CUSTOM DROPDOWN
       ================================================ */
    .custom-select-container {
        position: relative;
    }

    .custom-select-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3);
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        font-size: var(--font-size-sm);
        font-family: inherit;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .custom-select-trigger:hover {
        border-color: var(--border-hover);
    }

    .custom-select-trigger.open {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .selected-text {
        flex-grow: 1;
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .option-icon {
        width: 16px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.8rem;
        flex-shrink: 0;
    }

    .arrow {
        font-size: 0.65rem;
        color: var(--text-muted);
        transition: transform 0.2s ease;
        flex-shrink: 0;
    }

    .arrow.rotated {
        transform: rotate(180deg);
    }

    .custom-dropdown-menu {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        right: 0;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        z-index: 50;
        overflow: hidden;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }

    .dropdown-option {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        display: flex;
        align-items: center;
        padding: 10px 14px;
        color: var(--text-secondary);
        cursor: pointer;
        gap: var(--spacing-3);
        font-size: var(--font-size-sm);
        font-family: inherit;
        transition: all 0.15s ease;
    }

    .dropdown-option:hover {
        background: var(--accent-blue);
        color: white;
    }

    .dropdown-option:hover .option-icon {
        color: white;
    }

    .dropdown-option.selected {
        background: rgba(59, 130, 246, 0.1);
        color: var(--accent-blue-bright);
        font-weight: 600;
    }

    .dropdown-option.selected .option-icon {
        color: var(--accent-blue-bright);
    }

    /* ================================================
       TOGGLE
       ================================================ */
    .toggle-row {
        margin-bottom: var(--spacing-4);
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        font-family: inherit;
        transition: color 0.2s ease;
    }

    .toggle-btn:hover {
        color: var(--text-primary);
    }

    .toggle-btn.active {
        color: var(--text-primary);
    }

    .toggle-track {
        width: 36px;
        height: 20px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 10px;
        position: relative;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .toggle-btn.active .toggle-track {
        background: rgba(59, 130, 246, 0.3);
        border-color: var(--accent-blue);
    }

    .toggle-thumb {
        width: 14px;
        height: 14px;
        background: var(--text-muted);
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: all 0.2s ease;
    }

    .toggle-btn.active .toggle-thumb {
        left: 18px;
        background: var(--accent-blue-bright);
    }

    .buff-fields {
        margin-top: 0;
    }

    /* ================================================
       ACTIONS
       ================================================ */
    .action-row {
        display: flex;
        gap: var(--spacing-3);
        margin-bottom: var(--spacing-4);
    }

    .btn-calculate {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-6);
        border-radius: var(--radius-md);
        font-weight: 500;
        font-size: var(--font-size-sm);
        font-family: inherit;
        cursor: pointer;
        min-height: 44px;
        background: rgba(54, 164, 247, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: white;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .btn-calculate::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: left 0.4s ease;
        z-index: -1;
    }

    .btn-calculate:hover {
        background: rgba(54, 164, 247, 0.55);
        transform: translateY(-2px);
        box-shadow: 0 0 25px rgba(54, 164, 247, 0.4);
    }

    .btn-calculate:hover::before {
        left: 100%;
    }

    .btn-clear {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-4);
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: var(--font-size-sm);
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-clear:hover {
        border-color: var(--border-hover);
        color: var(--text-primary);
    }

    /* ================================================
       BUFF INFO
       ================================================ */
    .buff-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-3) var(--spacing-4);
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: var(--radius-md);
        margin-bottom: var(--spacing-4);
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
    }

    .buff-info i {
        color: #f59e0b;
        flex-shrink: 0;
    }

    /* ================================================
       RESULT CARDS
       ================================================ */
    .result-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-lg);
        padding: var(--spacing-6);
    }

    .result-card.error {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.25);
        padding: var(--spacing-4);
        color: #f87171;
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-4);
    }

    .result-card.error i {
        flex-shrink: 0;
    }

    .result-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        font-size: var(--font-size-lg);
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: var(--spacing-6);
        padding-bottom: var(--spacing-4);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .burn-icon { color: #ef4444; }
    .shield-icon { color: #3b82f6; }
    .heal-icon { color: #10b981; }
    .buff-icon { color: #f59e0b; }

    .result-section {
        margin-bottom: var(--spacing-2);
    }

    .result-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-3);
        line-height: 1.5;
    }

    .result-label strong {
        color: var(--text-primary);
    }

    .result-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: var(--spacing-4) 0;
    }

    .result-stat {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        margin-top: var(--spacing-3);
        font-size: var(--font-size-sm);
    }

    .stat-label {
        color: var(--text-secondary);
    }

    .stat-value {
        font-weight: 700;
        color: var(--accent-blue-bright);
    }

    /* ── Time rows ── */
    .time-rows {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
    }

    .time-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
    }

    .time-tag {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 64px;
        padding: 3px var(--spacing-3);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: #ffffff;
        text-align: center;
    }

    .time-value {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        font-weight: 500;
    }

    .time-value.relative {
        color: var(--accent-blue-bright);
        font-weight: 600;
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */
    @media (max-width: 768px) {
        .timers-container {
            padding: var(--spacing-2);
        }

        .timer-tabs {
            gap: var(--spacing-1);
            padding: var(--spacing-1);
        }

        .timer-tab {
            padding: var(--spacing-2) var(--spacing-2);
            font-size: var(--font-size-xs);
        }

        .timer-tab span {
            display: none;
        }

        .timer-tab i {
            font-size: 1rem;
        }

        .timer-panel {
            padding: var(--spacing-4);
        }

        .panel-icon {
            width: 40px;
            height: 40px;
            font-size: 1rem;
        }

        .panel-header h3 {
            font-size: var(--font-size-base);
        }

        .input-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-3);
        }

        .input-grid.burn-grid {
            grid-template-columns: 1fr;
        }

        .result-card {
            padding: var(--spacing-4);
        }

        .time-tag {
            min-width: 50px;
            font-size: 0.65rem;
        }

        .time-value {
            font-size: var(--font-size-xs);
        }
    }

    @media (max-width: 480px) {
        .panel-header {
            gap: var(--spacing-3);
        }

        .panel-header p {
            display: none;
        }

        .btn-calculate {
            flex: 1;
            justify-content: center;
        }
    }
</style>
