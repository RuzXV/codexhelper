<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { slide } from 'svelte/transition';
    import { formatSpeedups } from '../../../lib/tech-simulator/techCosts';

    export let totalSpeedupsUsed: number;
    export let totalSeasonCoinsUsed: number;
    export let totalCrystalsUsed: number;
    export let rawCrystalCost: number;
    export let crystalSavings: number;
    export let baseTimeDays: number;
    export let timeAfterSpeedBonusDays: number;
    export let helpsPerResearch: number;
    export let researchSpeedBonus: number;
    export let crystalIconSrc: string;
    export let researchSpeedupIconSrc: string;
    export let seasonCoinIconSrc: string;

    const dispatch = createEventDispatcher<{
        helpsChange: { value: number };
        speedBonusChange: { value: number };
    }>();

    let expandedFooterPanel: 'speedups' | 'crystals' | null = null;

    function toggleFooterPanel(panel: 'speedups' | 'crystals') {
        expandedFooterPanel = expandedFooterPanel === panel ? null : panel;
    }

    function clampHelps(e: Event) {
        const input = e.target as HTMLInputElement;
        let val = parseInt(input.value) || 0;
        if (val < 0) val = 0;
        if (val > 30) val = 30;
        dispatch('helpsChange', { value: val });
    }

    function clampSpeedBonus(e: Event) {
        const input = e.target as HTMLInputElement;
        let val = parseInt(input.value) || 0;
        if (val < 0) val = 0;
        if (val > 999) val = 999;
        dispatch('speedBonusChange', { value: val });
    }
</script>

<!-- Footer Bar with Counters -->
<div class="crystal-tech-footer">
    <button
        class="footer-counter speedups clickable"
        class:active={expandedFooterPanel === 'speedups'}
        on:click={() => toggleFooterPanel('speedups')}
        aria-label="Toggle speedup details"
    >
        <span class="icon-chevron" class:open={expandedFooterPanel === 'speedups'}
            ><i class="fas fa-chevron-down"></i></span
        >
        <img src={researchSpeedupIconSrc} alt="Speedup" class="counter-icon" width="28" height="28" />
        <span class="counter-label">Total Speedups Spent:</span>
        <span class="counter-value">{formatSpeedups(totalSpeedupsUsed)}</span>
    </button>
    <div class="footer-counter season-coins">
        <img src={seasonCoinIconSrc} alt="Season Coins" class="counter-icon" width="28" height="28" />
        <span class="counter-label">Total Season Coins:</span>
        <span class="counter-value">{totalSeasonCoinsUsed.toLocaleString()}</span>
    </div>
    <button
        class="footer-counter crystals clickable"
        class:active={expandedFooterPanel === 'crystals'}
        on:click={() => toggleFooterPanel('crystals')}
        aria-label="Toggle crystal details"
    >
        <span class="icon-chevron" class:open={expandedFooterPanel === 'crystals'}
            ><i class="fas fa-chevron-down"></i></span
        >
        <img src={crystalIconSrc} alt="Crystal" class="counter-icon" width="28" height="28" />
        <span class="counter-label">Total Crystals Used:</span>
        <span class="counter-value" id="total-crystals-value">{totalCrystalsUsed.toLocaleString()}</span>
    </button>
</div>

<!-- Footer Expansion Panel (opens downward below footer) -->
{#if expandedFooterPanel === 'speedups'}
    <div class="footer-expansion-panel" transition:slide={{ duration: 200 }}>
        <div class="expansion-content">
            <div class="expansion-inputs">
                <div class="expansion-input-group">
                    <label for="research-speed-bonus">Research Speed Bonus</label>
                    <div class="input-with-suffix">
                        <input
                            type="number"
                            id="research-speed-bonus"
                            min="0"
                            max="999"
                            value={researchSpeedBonus}
                            on:change={clampSpeedBonus}
                        />
                        <span class="input-suffix">%</span>
                    </div>
                </div>
                <div class="expansion-input-group">
                    <label for="helps-per-research">Helps per Research</label>
                    <div class="input-with-suffix">
                        <input
                            type="number"
                            id="helps-per-research"
                            min="0"
                            max="30"
                            value={helpsPerResearch}
                            on:change={clampHelps}
                        />
                        <span class="input-suffix">/ 30</span>
                    </div>
                </div>
            </div>
            <div class="expansion-stats">
                <div class="expansion-stat-row">
                    <span class="stat-label">Base Time</span>
                    <span class="stat-value">{formatSpeedups(baseTimeDays)}</span>
                </div>
                <div class="expansion-stat-row">
                    <span class="stat-label">After Speed Bonus</span>
                    <span class="stat-value">{formatSpeedups(timeAfterSpeedBonusDays)}</span>
                </div>
                <div class="expansion-stat-row">
                    <span class="stat-label">After {helpsPerResearch} Helps</span>
                    <span class="stat-value">{formatSpeedups(totalSpeedupsUsed)}</span>
                </div>
                <div class="expansion-stat-row final">
                    <span class="stat-label">Speedups Needed</span>
                    <span class="stat-value highlight">{formatSpeedups(totalSpeedupsUsed)}</span>
                </div>
            </div>
        </div>
    </div>
{/if}
{#if expandedFooterPanel === 'crystals'}
    <div class="footer-expansion-panel" transition:slide={{ duration: 200 }}>
        <div class="expansion-content crystals-layout">
            <div class="expansion-crystal-card">
                <span class="crystal-card-label">Without Reduction</span>
                <span class="crystal-card-value">{rawCrystalCost.toLocaleString()}</span>
                <span class="crystal-card-note">Raw cost (no RC / CC)</span>
            </div>
            <div class="expansion-crystal-card savings">
                <span class="crystal-card-label">Reduction Savings</span>
                <span class="crystal-card-value">{crystalSavings.toLocaleString()}</span>
                <span class="crystal-card-note">Saved by RC + CC levels</span>
            </div>
        </div>
    </div>
{/if}

<style>
    @import '../../../styles/tech-simulator-shared.css';

    /* Responsive overrides */
    @media (max-width: 768px) {
        .crystal-tech-footer {
            height: 36px;
            padding: 0 12px;
        }

        .counter-icon {
            width: 22px;
            height: 22px;
        }

        .counter-label {
            font-size: 0.7rem;
        }

        .counter-value {
            font-size: 0.8rem;
        }

        .footer-expansion-panel {
            padding: 12px 16px;
        }

        .expansion-content {
            gap: 20px;
        }

        .expansion-inputs {
            min-width: 170px;
        }

        .expansion-crystal-card {
            min-width: 140px;
            padding: 10px 16px;
        }

        .crystal-card-value {
            font-size: 0.95rem;
        }

        .icon-chevron {
            display: none;
        }
    }

    @media (max-width: 480px) {
        .crystal-tech-footer {
            height: 32px;
            padding: 0 6px;
        }

        .footer-counter {
            gap: 3px;
        }

        .counter-icon {
            width: 18px;
            height: 18px;
        }

        .counter-label {
            display: none;
        }

        .counter-value {
            font-size: 0.7rem;
        }

        .footer-expansion-panel {
            padding: 10px 10px;
        }

        .expansion-content {
            flex-direction: column;
            gap: 12px;
        }

        .expansion-inputs {
            flex-direction: row;
            gap: 16px;
            min-width: 0;
        }

        .expansion-content.crystals-layout {
            flex-direction: row;
            gap: 12px;
        }

        .expansion-crystal-card {
            min-width: 0;
            flex: 1;
            padding: 8px 12px;
        }

        .crystal-card-value {
            font-size: 0.85rem;
        }
    }
</style>
