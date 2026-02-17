<script>
    import { tick, createEventDispatcher } from 'svelte';
    import '../../../styles/training-shared.css';
    import DualThumbSlider from './DualThumbSlider.svelte';
    import {
        BASE_TIME_T4,
        BASE_TIME_T5,
        distributeTroops,
        parseSpeedupSeconds,
        getAvgTime,
        calcPower,
        calcPreKvkPoints,
        handleFormattedInput,
    } from '../../../lib/training/trainingData';

    export let images = {};
    export let trainingSpeed = '';

    const dispatch = createEventDispatcher();

    let sliderThumb1 = 0;
    let sliderThumb2 = 100;
    let speedupTime = { d: '', h: '', m: '' };

    let reserveSelection = { tier: 't5', size: 50000 };
    let reserveTargetDate = '';
    let reserveResultStr = null;
    let reserveSectionOpen = true;

    let maxTroops = 0;
    let troopBreakdown = { t4: 0, t5: 0, upgrade: 0 };
    let totalPower = 0;
    let totalPreKvkPoints = 0;
    let hasResult = false;
    let resultAnimationTrigger = false;

    let dateInputRef;

    $: mixRatio = {
        t4: sliderThumb1 / 100,
        t5: (sliderThumb2 - sliderThumb1) / 100,
        upgrade: (100 - sliderThumb2) / 100,
    };

    $: calculatePreKvk(speedupTime, trainingSpeed, sliderThumb1, sliderThumb2, reserveSelection, reserveTargetDate);

    async function triggerAnimation() {
        resultAnimationTrigger = false;
        await tick();
        resultAnimationTrigger = true;
        setTimeout(() => {
            resultAnimationTrigger = false;
        }, 1200);
    }

    function calculatePreKvk() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;

        reserveResultStr = null;
        if (reserveTargetDate) {
            const baseTime = reserveSelection.tier === 't5' ? BASE_TIME_T5 : BASE_TIME_T4;
            const troopCount = reserveSelection.size + 2000;
            const totalSecondsNeeded = (baseTime * troopCount) / speedMultiplier;

            const [year, month, day] = reserveTargetDate.split('-').map(Number);
            const targetDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

            if (!isNaN(targetDateObj.getTime())) {
                const startTimestamp = targetDateObj.getTime() - totalSecondsNeeded * 1000;
                const startDate = new Date(startTimestamp);

                const utcYear = startDate.getUTCFullYear();
                const utcMonth = String(startDate.getUTCMonth() + 1).padStart(2, '0');
                const utcDay = String(startDate.getUTCDate()).padStart(2, '0');
                const utcHours = String(startDate.getUTCHours()).padStart(2, '0');
                const utcMinutes = String(startDate.getUTCMinutes()).padStart(2, '0');

                reserveResultStr = `Start your reserves on <strong>${utcDay}/${utcMonth}/${utcYear} at ${utcHours}:${utcMinutes} UTC</strong>`;
            }
        }

        const totalInputSeconds = parseSpeedupSeconds(speedupTime);

        if (totalInputSeconds > 0) {
            const avgTime = getAvgTime(mixRatio);

            let calculatedTotalTroops = Math.floor((totalInputSeconds * speedMultiplier) / avgTime);

            if (calculatedTotalTroops > 0) {
                const result = distributeTroops(calculatedTotalTroops, mixRatio);
                troopBreakdown = result.troopBreakdown;
                maxTroops = result.maxTroops;

                totalPreKvkPoints = calcPreKvkPoints(troopBreakdown);
                totalPower = calcPower(troopBreakdown);

                hasResult = true;
                triggerAnimation();
            }
        } else if (reserveResultStr) {
            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function resetResults() {
        maxTroops = 0;
        troopBreakdown = { t4: 0, t5: 0, upgrade: 0 };
        totalPower = 0;
        totalPreKvkPoints = 0;
        reserveResultStr = null;
        hasResult = false;
        resultAnimationTrigger = false;
    }

    function handleSliderChange(e) {
        sliderThumb1 = e.detail.thumb1;
        sliderThumb2 = e.detail.thumb2;
    }

    function handleSpeedupInput(e, key) {
        speedupTime[key] = handleFormattedInput(e.target.value);
    }

    function setReserveSelection(tier, size) {
        reserveSelection = { tier, size };
    }

    function openDatePicker() {
        if (dateInputRef) {
            try {
                dateInputRef.showPicker();
            } catch (e) {
                dateInputRef.focus();
            }
        }
    }
</script>

<DualThumbSlider bind:sliderThumb1 bind:sliderThumb2 on:change={handleSliderChange} />

<div class="dynamic-input-container">
    <div class="form-group fade-in-panel">
        <span class="label-text">Points from Speedups</span>
        <div class="time-input-row" style="margin-bottom: 20px;">
            <div class="time-input-group">
                <input
                    type="text"
                    placeholder="0"
                    value={speedupTime.d}
                    on:input={(e) => handleSpeedupInput(e, 'd')}
                /><span>Days</span>
            </div>
            <div class="time-input-group">
                <input
                    type="text"
                    placeholder="0"
                    value={speedupTime.h}
                    on:input={(e) => handleSpeedupInput(e, 'h')}
                /><span>Hours</span>
            </div>
            <div class="time-input-group">
                <input
                    type="text"
                    placeholder="0"
                    value={speedupTime.m}
                    on:input={(e) => handleSpeedupInput(e, 'm')}
                /><span>Mins</span>
            </div>
        </div>

        <div
            class="collapse-group"
            style="margin-bottom: {reserveSectionOpen ? '0' : '-40px'}; transition: margin-bottom 0.3s ease;"
        >
            <div class="label-with-toggle">
                <span class="label-text">When to start your reserves?</span>
                <label class="toggle-switch">
                    <input type="checkbox" bind:checked={reserveSectionOpen} />
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <div class="collapsible-content" class:is-open={reserveSectionOpen}>
                <div class="reserve-container">
                    <div class="reserve-grid">
                        <button
                            class="reserve-btn t4"
                            class:active={reserveSelection.tier === 't4' && reserveSelection.size === 20000}
                            on:click={() => setReserveSelection('t4', 20000)}
                        >
                            <div class="reserve-icon-wrapper">
                                <img
                                    src={images['20k_reserve.webp']}
                                    alt="20k"
                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                />
                                <div class="reserve-badge t4">T4</div>
                            </div>
                            <span>20k</span>
                        </button>

                        <button
                            class="reserve-btn t4"
                            class:active={reserveSelection.tier === 't4' && reserveSelection.size === 50000}
                            on:click={() => setReserveSelection('t4', 50000)}
                        >
                            <div class="reserve-icon-wrapper">
                                <img
                                    src={images['50k_reserve.webp']}
                                    alt="50k"
                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                />
                                <div class="reserve-badge t4">T4</div>
                            </div>
                            <span>50k</span>
                        </button>

                        <button
                            class="reserve-btn t5"
                            class:active={reserveSelection.tier === 't5' && reserveSelection.size === 20000}
                            on:click={() => setReserveSelection('t5', 20000)}
                        >
                            <div class="reserve-icon-wrapper">
                                <img
                                    src={images['20k_reserve.webp']}
                                    alt="20k"
                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                />
                                <div class="reserve-badge t5">T5</div>
                            </div>
                            <span>20k</span>
                        </button>

                        <button
                            class="reserve-btn t5"
                            class:active={reserveSelection.tier === 't5' && reserveSelection.size === 50000}
                            on:click={() => setReserveSelection('t5', 50000)}
                        >
                            <div class="reserve-icon-wrapper">
                                <img
                                    src={images['50k_reserve.webp']}
                                    alt="50k"
                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                />
                                <div class="reserve-badge t5">T5</div>
                            </div>
                            <span>50k</span>
                        </button>
                    </div>

                    <div class="date-trigger">
                        <label for="kvk-date">Training Stage Date (00:00 UTC)</label>
                        <button
                            class="input-fake-wrapper"
                            type="button"
                            on:click={openDatePicker}
                            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openDatePicker()}
                            aria-label="Open date picker"
                        >
                            <input
                                type="date"
                                id="kvk-date"
                                bind:value={reserveTargetDate}
                                bind:this={dateInputRef}
                            />
                            <i class="fas fa-calendar-alt calendar-icon"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div
    class="calc-result"
    class:result-success={hasResult && resultAnimationTrigger}
    class:has-value={hasResult}
    style="flex-direction: column; gap: 10px; padding: 20px; justify-content: center;"
>
    {#if hasResult}
        {#if reserveResultStr}
            <div style="text-align: center; margin-bottom: 10px; line-height: 1.4;">
                <span style="color: white; font-size: 1rem;"
                    ><img
                        src={images['reserve_icon.webp']}
                        alt=""
                        style="height: 36px; vertical-align: middle; margin-right: 8px;"
                    />{@html reserveResultStr}</span
                >
            </div>
        {/if}

        {#if totalPreKvkPoints > 0}
            {#if reserveResultStr}<div class="result-divider"></div>{/if}
            <div class="stats-row">
                <div class="stat-item">
                    <img
                        src={images['prekvk_icon.webp']}
                        alt="Pre-KvK"
                        on:error={(e) => (e.target.src = images['power_icon.webp'])}
                    />
                    <div class="stat-info">
                        <span class="stat-label">Pre-KvK Points</span>
                        <span class="stat-value" style="color: var(--accent-blue-bright);"
                            >{totalPreKvkPoints.toLocaleString()}</span
                        >
                    </div>
                </div>
                <div class="stat-item">
                    <img src={images['troop_t5.webp']} alt="Troops" />
                    <div class="stat-info">
                        <span class="stat-label">Total Troops</span>
                        <span class="stat-value" style="color: var(--accent-blue-bright);"
                            >{maxTroops.toLocaleString()}</span
                        >
                    </div>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
                Upgrades)
            </div>
        {/if}
    {:else}
        <div style="opacity: 0;">&nbsp;</div>
    {/if}
</div>

<style>
    .calc-result {
        min-height: 140px;
        position: relative;
    }

    .reserve-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 5px;
        background: var(--bg-card);
        padding: 10px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
    }

    .reserve-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
    }

    .reserve-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px 4px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
    }

    .reserve-btn:hover {
        border-color: var(--text-secondary);
        transform: translateY(-2px);
    }

    .reserve-icon-wrapper {
        position: relative;
    }
    .reserve-icon-wrapper img {
        height: 32px;
        width: auto;
    }

    .reserve-badge {
        position: absolute;
        bottom: -2px;
        right: -5px;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 3px;
        border-radius: 3px;
        color: white;
        text-shadow: 0 1px 2px black;
    }
    .reserve-badge.t4 {
        background: #ca62e6;
    }
    .reserve-badge.t5 {
        background: #f28d00;
    }

    .reserve-btn span {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 500;
        z-index: 1;
    }

    .reserve-btn.t4.active {
        border-color: #ca62e6;
        background-image: radial-gradient(circle at center, rgba(202, 98, 230, 0.2) 0%, rgba(129, 19, 167, 0.4) 100%);
    }
    .reserve-btn.t4.active span {
        color: white;
    }

    .reserve-btn.t5.active {
        border-color: #f28d00;
        background-image: radial-gradient(circle at center, rgba(242, 141, 0, 0.2) 0%, rgba(213, 88, 0, 0.4) 100%);
    }
    .reserve-btn.t5.active span {
        color: white;
    }

    .date-trigger {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .date-trigger label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        cursor: pointer;
    }
    .input-fake-wrapper {
        position: relative;
        width: 100%;
    }
    .input-fake-wrapper input {
        width: 100%;
        padding: 10px;
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        cursor: pointer;
    }
    .input-fake-wrapper .calendar-icon {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        pointer-events: none;
    }

    @media (max-width: 600px) {
        .reserve-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
