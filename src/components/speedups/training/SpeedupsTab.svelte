<script>
    import { tick, createEventDispatcher } from 'svelte';
    import '../../../styles/training-shared.css';
    import DualThumbSlider from './DualThumbSlider.svelte';
    import {
        POWER_PER_UNIT,
        MGE_POINTS_PER_UNIT,
        formatNumber,
        distributeTroops,
        parseSpeedupSeconds,
        getAvgTime,
        calcPower,
        calcMgePoints,
        handleFormattedInput,
    } from '../../../lib/training/trainingData';

    export let images = {};
    export let trainingSpeed = '';

    const dispatch = createEventDispatcher();

    let sliderThumb1 = 0;
    let sliderThumb2 = 100;
    let speedupTime = { d: '', h: '', m: '' };

    let maxTroops = 0;
    let troopBreakdown = { t4: 0, t5: 0, upgrade: 0 };
    let totalPower = 0;
    let totalMge = 0;
    let hasResult = false;
    let resultAnimationTrigger = false;

    $: mixRatio = {
        t4: sliderThumb1 / 100,
        t5: (sliderThumb2 - sliderThumb1) / 100,
        upgrade: (100 - sliderThumb2) / 100,
    };

    $: calculateSpeedups(speedupTime, trainingSpeed, sliderThumb1, sliderThumb2);

    async function triggerAnimation() {
        resultAnimationTrigger = false;
        await tick();
        resultAnimationTrigger = true;
        setTimeout(() => {
            resultAnimationTrigger = false;
        }, 1200);
    }

    function calculateSpeedups() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;

        const totalInputSeconds = parseSpeedupSeconds(speedupTime);

        if (totalInputSeconds <= 0) {
            resetResults();
            return;
        }

        const avgTime = getAvgTime(mixRatio);

        let calculatedTotalTroops = Math.floor((totalInputSeconds * speedMultiplier) / avgTime);

        if (calculatedTotalTroops > 0) {
            const result = distributeTroops(calculatedTotalTroops, mixRatio);
            troopBreakdown = result.troopBreakdown;
            maxTroops = result.maxTroops;

            totalPower = calcPower(troopBreakdown);
            totalMge = calcMgePoints(troopBreakdown);

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
        totalMge = 0;
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
</script>

<DualThumbSlider bind:sliderThumb1 bind:sliderThumb2 on:change={handleSliderChange} />

<div class="dynamic-input-container">
    <div class="form-group fade-in-panel">
        <span class="label-text">Total Speedups Available</span>
        <div class="time-input-row">
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
    </div>
</div>

<div
    class="calc-result"
    class:result-success={hasResult && resultAnimationTrigger}
    class:has-value={hasResult}
    style="flex-direction: column; gap: 10px; padding: 20px; justify-content: center;"
>
    {#if hasResult}
        <div class="cost-line" style="font-size: 1.1rem;">
            <img
                src={images[mixRatio.t5 > 0 || mixRatio.upgrade > 0 ? 'troop_t5.webp' : 'troop_t4.webp']}
                alt="Troop"
                style="height: 28px; margin-right: 8px;"
            />
            <span
                >Total Troops: <strong style="color: var(--accent-blue-bright);"
                    >{maxTroops.toLocaleString()}</strong
                ></span
            >
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: -5px;">
            ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
            Upgrades)
        </div>

        <div class="result-divider"></div>
        <div class="stats-row">
            <div class="stat-item">
                <img src={images['power_icon.webp']} alt="Power" />
                <div class="stat-info">
                    <span class="stat-label">Power Gained</span>
                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                        >{totalPower.toLocaleString()}</span
                    >
                </div>
            </div>

            <div class="stat-item">
                <img
                    src={images['mge_icon.webp']}
                    alt="MGE"
                    on:error={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div class="stat-info">
                    <span class="stat-label">MGE Points</span>
                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                        >{totalMge.toLocaleString()}</span
                    >
                </div>
            </div>
        </div>
    {:else}
        <div style="opacity: 0;">&nbsp;</div>
    {/if}
</div>

<style>
    .calc-result {
        min-height: 140px;
        position: relative;
    }
</style>
