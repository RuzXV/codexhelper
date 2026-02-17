<script>
    import { createEventDispatcher } from 'svelte';
    import '../../../styles/training-shared.css';

    export let sliderThumb1 = 0;
    export let sliderThumb2 = 100;

    const dispatch = createEventDispatcher();

    let activeThumb = null;
    let sliderNode;

    $: mixRatioT4 = Math.round((sliderThumb1 / 100) * 100);
    $: mixRatioT5 = Math.round(((sliderThumb2 - sliderThumb1) / 100) * 100);
    $: mixRatioUpgrade = Math.round(((100 - sliderThumb2) / 100) * 100);

    function handleSliderInteract(e) {
        if (!sliderNode) return;
        const rect = sliderNode.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percentage = ((clientX - rect.left) / rect.width) * 100;

        if (percentage < 1.5) percentage = 0;
        if (percentage > 98.5) percentage = 100;

        percentage = Math.max(0, Math.min(100, percentage));

        if (e.type === 'mousedown' || e.type === 'touchstart') {
            const overlap = Math.abs(sliderThumb1 - sliderThumb2) < 2;
            if (overlap) {
                activeThumb = 0;
            } else {
                const dist1 = Math.abs(percentage - sliderThumb1);
                const dist2 = Math.abs(percentage - sliderThumb2);
                activeThumb = dist1 < dist2 ? 1 : 2;
            }
        }

        if (activeThumb === 0) {
            if (percentage < sliderThumb1) activeThumb = 1;
            else if (percentage > sliderThumb1) activeThumb = 2;
        }

        if (activeThumb === 1) {
            if (Math.abs(percentage - sliderThumb2) < 1.5) percentage = sliderThumb2;
            sliderThumb1 = Math.min(percentage, sliderThumb2);
        } else if (activeThumb === 2) {
            if (Math.abs(percentage - sliderThumb1) < 1.5) percentage = sliderThumb1;
            sliderThumb2 = Math.max(percentage, sliderThumb1);
        }

        dispatch('change', { thumb1: sliderThumb1, thumb2: sliderThumb2 });
    }
</script>

<div class="form-group">
    <div class="mix-control-header">
        <span class="label-text">Training Mix</span>
        <span class="mix-readout">
            <span style="color: #ca62e6">{mixRatioT4}% T4</span> /
            <span style="color: #f28d00">{mixRatioT5}% T5</span> /
            <span style="color: #4ade80">{mixRatioUpgrade}% Upgrade</span>
        </span>
    </div>

    <div
        class="mix-slider-track"
        bind:this={sliderNode}
        role="slider"
        tabindex="0"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={sliderThumb1}
        aria-label="Troop Mix Slider"
        on:mousedown|preventDefault={handleSliderInteract}
        on:mousemove={(e) => e.buttons === 1 && handleSliderInteract(e)}
        on:touchstart|preventDefault={(e) => handleSliderInteract(e)}
        on:touchmove|preventDefault={(e) => handleSliderInteract(e)}
    >
        <div class="mix-segment" style="left: 0%; width: {sliderThumb1}%; background: #ca62e6;"></div>
        <div
            class="mix-segment"
            style="left: {sliderThumb1}%; width: {sliderThumb2 - sliderThumb1}%; background: #f28d00;"
        ></div>
        <div
            class="mix-segment"
            style="left: {sliderThumb2}%; width: {100 -
                sliderThumb2}%; background: linear-gradient(90deg, #4ade80, #22c55e);"
        ></div>

        <div class="mix-thumb" style="left: {sliderThumb1}%;"></div>
        <div class="mix-thumb" style="left: {sliderThumb2}%;"></div>
    </div>

    <div class="instruction-text">
        Drag the sliders on either end towards the middle to adjust your T4/T5/Upgrade split
    </div>
</div>

<style>
    .mix-control-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.9rem;
    }
    .mix-readout {
        font-weight: 600;
        font-size: 0.85rem;
    }

    .mix-slider-track {
        position: relative;
        height: 24px;
        background: var(--bg-primary);
        overflow: visible;
        cursor: pointer;
        border: 1px solid var(--border-hover);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        border-radius: 2px;
    }

    .mix-segment {
        position: absolute;
        top: 0;
        bottom: 0;
    }

    .mix-thumb {
        position: absolute;
        top: -6px;
        bottom: -6px;
        width: 16px;
        background: white;
        border-radius: 8px;
        transform: translateX(-50%);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
        border: 2px solid var(--bg-tertiary);
        z-index: 20;
        transition: transform 0.1s ease;
    }

    .mix-thumb:hover {
        transform: translateX(-50%) scale(1.1);
        background: white;
        cursor: grab;
    }
    .mix-thumb:active {
        cursor: grabbing;
    }
    .mix-thumb::after {
        content: '';
        position: absolute;
        top: -15px;
        bottom: -15px;
        left: -15px;
        right: -15px;
    }
</style>
