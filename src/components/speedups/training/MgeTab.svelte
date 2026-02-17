<script>
    import { tick, createEventDispatcher } from 'svelte';
    import '../../../styles/training-shared.css';
    import DualThumbSlider from './DualThumbSlider.svelte';
    import {
        formatTime,
        distributeTroops,
        getAvgTime,
        getAvgMgePoints,
        calcPower,
        calcMgePoints,
        handleFormattedInput,
    } from '../../../lib/training/trainingData';

    export let images = {};
    export let trainingSpeed = '';

    const dispatch = createEventDispatcher();

    let sliderThumb1 = 0;
    let sliderThumb2 = 100;
    let targetMgePoints = '';

    let resultTime = null;
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

    $: calculateMge(targetMgePoints, trainingSpeed, sliderThumb1, sliderThumb2);

    async function triggerAnimation() {
        resultAnimationTrigger = false;
        await tick();
        resultAnimationTrigger = true;
        setTimeout(() => {
            resultAnimationTrigger = false;
        }, 1200);
    }

    function calculateMge() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;
        const target = parseInt(targetMgePoints.replace(/,/g, '') || '0');

        if (target <= 0) {
            resetResults();
            return;
        }

        const avgPoints = getAvgMgePoints(mixRatio);

        let calculatedTotalTroops = Math.ceil(target / avgPoints);

        const avgTime = getAvgTime(mixRatio);

        if (calculatedTotalTroops > 0) {
            const result = distributeTroops(calculatedTotalTroops, mixRatio);
            troopBreakdown = result.troopBreakdown;
            maxTroops = result.maxTroops;

            const totalSeconds = (avgTime / speedMultiplier) * maxTroops;

            totalPower = calcPower(troopBreakdown);
            totalMge = calcMgePoints(troopBreakdown);

            resultTime = formatTime(totalSeconds);
            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function resetResults() {
        resultTime = null;
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

    function handleMgeInput(e) {
        targetMgePoints = handleFormattedInput(e.target.value);
    }
</script>

<DualThumbSlider bind:sliderThumb1 bind:sliderThumb2 on:change={handleSliderChange} />

<div class="dynamic-input-container">
    <div class="form-group fade-in-panel">
        <span class="label-text">Desired Training Stage MGE Points</span>
        <div class="mge-input-row">
            <input
                type="text"
                class="standalone-input"
                placeholder="Example: 50,000,000"
                value={targetMgePoints}
                on:input={handleMgeInput}
            />
            <span class="mge-text-label">points</span>
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
        <div
            class="cost-line"
            style="font-size: 1.2rem; margin-bottom: 5px; flex-direction: column; align-items: center; gap: 2px;"
        >
            <div style="display: flex; align-items: center; gap: 5px;">
                <img src={images['training_speedup.webp']} alt="Clock" style="height: 32px;" />
                <span
                    >Requires: <strong style="color: var(--accent-blue-bright);">{resultTime}</strong
                    ></span
                >
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
                Upgrades)
            </div>
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
                <img src={images['troop_t5.webp']} alt="Troops" />
                <div class="stat-info">
                    <span class="stat-label">Total Troops</span>
                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                        >{maxTroops.toLocaleString()}</span
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

    .mge-input-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .standalone-input {
        flex: 1;
        border: 1px solid var(--border-hover);
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        padding: 8px;
        font-size: 1rem;
        color: var(--text-primary);
        text-align: center;
    }
    .standalone-input:focus {
        border-color: var(--accent-blue);
        outline: none;
    }
    .mge-text-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
    }
</style>
