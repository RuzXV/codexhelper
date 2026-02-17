<script lang="ts">
    import { onMount } from 'svelte';

    import crystalIcon from '../../assets/images/kvk_suite/crystal.webp';
    import foodIcon from '../../assets/images/calculators/shared/food_icon.webp';
    import woodIcon from '../../assets/images/calculators/shared/wood_icon.webp';
    import stoneIcon from '../../assets/images/calculators/shared/stone_icon.webp';
    import goldIcon from '../../assets/images/calculators/shared/gold_icon.webp';

    import {
        CRYSTAL_COSTS,
        MAX_FLAGS,
        getCostsForFlag,
        parseNumber,
        parseDatetime,
    } from '../../lib/kvk-suite/flagCostData';
    import type { FlagResult, ResourceDef, ResourceSummary } from '../../lib/kvk-suite/flagCostData';

    import FlagInputSection from './flag_calculator/FlagInputSection.svelte';
    import FlagResultSection from './flag_calculator/FlagResultSection.svelte';

    // ── Resource definitions (crystal first) ──
    const RESOURCES: readonly ResourceDef[] = [
        { key: 'crystal', label: 'Crystal', colorClass: 'crystal-res', imageSrc: crystalIcon.src },
        { key: 'food', label: 'Food', colorClass: 'food', imageSrc: foodIcon.src },
        { key: 'wood', label: 'Wood', colorClass: 'wood', imageSrc: woodIcon.src },
        { key: 'stone', label: 'Stone', colorClass: 'stone', imageSrc: stoneIcon.src },
        { key: 'gold', label: 'Gold', colorClass: 'gold', imageSrc: goldIcon.src },
    ];

    // ── State ──
    let currentFlags = '';
    let endDate = '';
    let resourceAmounts: Record<string, string> = { crystal: '', food: '', wood: '', stone: '', gold: '' };
    let resourceProduction: Record<string, string> = { crystal: '', food: '', wood: '', stone: '', gold: '' };
    let error = '';
    let result: FlagResult | null = null;

    // ── Dropdown logic ──
    let openDropdown: string | null = null;

    function handleClickOutside(event: MouseEvent) {
        if (openDropdown && !(event.target as HTMLElement).closest('.custom-select-container')) {
            openDropdown = null;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    // ── Tick for live relative time ──
    let tick = 0;
    let tickInterval: ReturnType<typeof setInterval>;

    onMount(() => {
        tickInterval = setInterval(() => {
            tick++;
        }, 15000);
        return () => clearInterval(tickInterval);
    });

    // ── Calculate ──
    function calculate() {
        error = '';
        result = null;

        const crystal = parseNumber(resourceAmounts.crystal);
        const flags = parseNumber(currentFlags);

        if (isNaN(crystal) || crystal < 0) {
            error = 'Please enter a valid crystal amount.';
            return;
        }

        if (isNaN(flags) || flags < 0) {
            error = 'Please enter a valid current flag count.';
            return;
        }

        if (flags >= MAX_FLAGS) {
            error = `Flag cost data only covers up to ${MAX_FLAGS} flags.`;
            return;
        }

        let projectedCrystal: number | null = null;
        let futureGain: number | null = null;
        let targetDate: Date | null = null;
        let totalCrystal = crystal;
        let hoursDiff = 0;

        // If a target date is provided, use per-resource production rates for projections
        if (endDate.trim()) {
            const date = parseDatetime(endDate);

            if (date === null) {
                error = 'Invalid date format. Use HH:MM DD/MM/YYYY (Example: 14:00 25/12/2025).';
                return;
            }

            const now = new Date();
            if (date.getTime() <= now.getTime()) {
                error = 'The target date must be in the future.';
                return;
            }

            hoursDiff = (date.getTime() - now.getTime()) / 3600000;
            const crystalProd = parseNumber(resourceProduction.crystal) || 0;
            futureGain = Math.floor(hoursDiff * crystalProd);
            totalCrystal = crystal + futureGain;
            projectedCrystal = totalCrystal;
            targetDate = date;
        }

        // Simulate flag building
        let currentCrystal = totalCrystal;
        let flagsBuilt = 0;
        let totalFood = 0,
            totalWood = 0,
            totalStone = 0,
            totalGold = 0,
            totalCrystalSpent = 0;

        for (let i = flags; i < MAX_FLAGS; i++) {
            const crystalCost = CRYSTAL_COSTS[i];
            if (currentCrystal < crystalCost) break;

            currentCrystal -= crystalCost;
            flagsBuilt++;

            const costs = getCostsForFlag(i + 1); // 1-based flag number
            totalFood += costs.food;
            totalWood += costs.wood;
            totalStone += costs.stone;
            totalGold += costs.gold;
            totalCrystalSpent += crystalCost;
        }

        // Build resource summaries
        const totalCosts: Record<string, number> = {
            food: totalFood,
            wood: totalWood,
            stone: totalStone,
            gold: totalGold,
            crystal: totalCrystalSpent,
        };

        let resourceSummaries: Record<string, ResourceSummary> = {};
        for (const res of RESOURCES) {
            const current = parseNumber(resourceAmounts[res.key]) || 0;
            const prod = parseNumber(resourceProduction[res.key]) || 0;
            const projGain = hoursDiff > 0 ? Math.floor(hoursDiff * prod) : 0;
            const projTotal = current + projGain;
            const cost = totalCosts[res.key];
            const deficit = Math.max(0, cost - projTotal);

            resourceSummaries[res.key] = {
                current,
                production: prod,
                totalCost: cost,
                deficit,
                projectedGain: projGain,
                projectedTotal: projTotal,
            };
        }

        result = {
            initialCrystal: crystal,
            currentFlags: flags,
            projectedCrystal,
            futureGain,
            targetDate,
            flagsBuilt,
            totalFlags: flags + flagsBuilt,
            remainingCrystal: currentCrystal,
            totalFoodCost: totalFood,
            totalWoodCost: totalWood,
            totalStoneCost: totalStone,
            totalGoldCost: totalGold,
            totalCrystalSpent,
            resourceSummaries,
            costBreakdown: [],
        };
    }

    function clearAll() {
        result = null;
        error = '';
        currentFlags = '';
        endDate = '';
        resourceAmounts = { crystal: '', food: '', wood: '', stone: '', gold: '' };
        resourceProduction = { crystal: '', food: '', wood: '', stone: '', gold: '' };
    }

    // ── Event handlers for child updates ──
    function handleUpdateCurrentFlags(e: CustomEvent<string>) {
        currentFlags = e.detail;
    }

    function handleUpdateEndDate(e: CustomEvent<string>) {
        endDate = e.detail;
    }

    function handleUpdateResourceAmount(e: CustomEvent<{ key: string; value: string }>) {
        resourceAmounts[e.detail.key] = e.detail.value;
        resourceAmounts = resourceAmounts; // trigger reactivity
    }

    function handleUpdateResourceProduction(e: CustomEvent<{ key: string; value: string }>) {
        resourceProduction[e.detail.key] = e.detail.value;
        resourceProduction = resourceProduction; // trigger reactivity
    }
</script>

<div class="flag-calculator-container">
    <div class="flag-panel">
        <div class="panel-header">
            <i class="fas fa-flag panel-icon flag"></i>
            <div>
                <h3>Flag Cost Calculator</h3>
                <p>Calculate how many flags your alliance can build and the total resource costs.</p>
            </div>
        </div>

        <FlagInputSection
            bind:currentFlags
            bind:endDate
            bind:resourceAmounts
            bind:resourceProduction
            resources={RESOURCES}
            {error}
            hasResult={result !== null}
            on:calculate={calculate}
            on:clear={clearAll}
            on:updateCurrentFlags={handleUpdateCurrentFlags}
            on:updateEndDate={handleUpdateEndDate}
            on:updateResourceAmount={handleUpdateResourceAmount}
            on:updateResourceProduction={handleUpdateResourceProduction}
        />

        {#if result}
            <FlagResultSection {result} resources={RESOURCES} />
        {/if}
    </div>
</div>

<style>
    /* ── Container ── */
    .flag-calculator-container {
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
        padding: var(--spacing-4);
    }

    /* ── Panel ── */
    .flag-panel {
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

    .panel-icon.flag {
        background: rgba(0, 76, 255, 0.15);
        border: 1px solid rgba(0, 76, 255, 0.3);
        color: #004cff;
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

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
        .flag-calculator-container {
            padding: var(--spacing-2);
        }

        .flag-panel {
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
    }

    @media (max-width: 480px) {
        .panel-header {
            gap: var(--spacing-3);
        }

        .panel-header p {
            display: none;
        }
    }
</style>
