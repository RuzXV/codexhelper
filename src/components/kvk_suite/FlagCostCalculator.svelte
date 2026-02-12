<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    import crystalIcon from '../../assets/images/kvk_suite/crystal.webp';
    import foodIcon from '../../assets/images/calculators/shared/food_icon.webp';
    import woodIcon from '../../assets/images/calculators/shared/wood_icon.webp';
    import stoneIcon from '../../assets/images/calculators/shared/stone_icon.webp';
    import goldIcon from '../../assets/images/calculators/shared/gold_icon.webp';

    const FLAG_RANGE_COSTS: { start: number; end: number; food: number; wood: number; stone: number; gold: number; crystal: number }[] = [
        { start: 1,   end: 10,  food: 75000,  wood: 75000,  stone: 56250, gold: 37500, crystal: 0 },
        { start: 11,  end: 20,  food: 75000,  wood: 75000,  stone: 56250, gold: 37500, crystal: 0 },
        { start: 21,  end: 30,  food: 93750,  wood: 93750,  stone: 70350, gold: 46875, crystal: 7500 },
        { start: 31,  end: 40,  food: 93750,  wood: 93750,  stone: 70350, gold: 46875, crystal: 11250 },
        { start: 41,  end: 50,  food: 112500, wood: 112500, stone: 84375, gold: 56250, crystal: 15000 },
        { start: 51,  end: 60,  food: 112500, wood: 112500, stone: 84375, gold: 56250, crystal: 18750 },
        { start: 61,  end: 70,  food: 131250, wood: 131250, stone: 98475, gold: 65625, crystal: 22500 },
        { start: 71,  end: 80,  food: 131250, wood: 131250, stone: 98475, gold: 65625, crystal: 26250 },
        { start: 81,  end: 90,  food: 150000, wood: 150000, stone: 112500, gold: 75000, crystal: 30000 },
        { start: 91,  end: 100, food: 150000, wood: 150000, stone: 112500, gold: 75000, crystal: 33750 },
        { start: 101, end: 110, food: 163750, wood: 168750, stone: 126600, gold: 84375, crystal: 37500 },
        { start: 111, end: 120, food: 168750, wood: 168750, stone: 126600, gold: 84375, crystal: 41250 },
        { start: 121, end: 130, food: 187500, wood: 137500, stone: 140625, gold: 93750, crystal: 45000 },
        { start: 131, end: 140, food: 187500, wood: 187500, stone: 140625, gold: 93750, crystal: 48750 },
        { start: 141, end: 150, food: 206250, wood: 206250, stone: 154725, gold: 103125, crystal: 52500 },
        { start: 151, end: 160, food: 206250, wood: 206250, stone: 154725, gold: 103125, crystal: 56250 },
        { start: 161, end: 170, food: 225000, wood: 225000, stone: 168750, gold: 112500, crystal: 60000 },
        { start: 171, end: 180, food: 225000, wood: 225000, stone: 168750, gold: 112500, crystal: 63750 },
        { start: 181, end: 190, food: 243750, wood: 243750, stone: 182850, gold: 121875, crystal: 67500 },
        { start: 191, end: 200, food: 243750, wood: 243750, stone: 182850, gold: 121875, crystal: 71250 },
        { start: 201, end: 210, food: 262500, wood: 262500, stone: 196875, gold: 131250, crystal: 75000 },
        { start: 211, end: 220, food: 262500, wood: 262500, stone: 196875, gold: 131250, crystal: 78750 },
        { start: 221, end: 230, food: 281250, wood: 281250, stone: 210975, gold: 140625, crystal: 82500 },
        { start: 231, end: 240, food: 281250, wood: 281250, stone: 210975, gold: 140625, crystal: 86250 },
        { start: 241, end: 250, food: 300000, wood: 300000, stone: 225000, gold: 150000, crystal: 90000 },
        { start: 251, end: 260, food: 300000, wood: 300000, stone: 225000, gold: 150000, crystal: 93750 },
        { start: 261, end: 270, food: 318750, wood: 318750, stone: 239100, gold: 159375, crystal: 97500 },
        { start: 271, end: 280, food: 318750, wood: 318750, stone: 239100, gold: 159375, crystal: 101250 },
        { start: 281, end: 290, food: 337500, wood: 337500, stone: 253125, gold: 168750, crystal: 105000 },
        { start: 291, end: 300, food: 337500, wood: 337500, stone: 253125, gold: 168750, crystal: 112500 },
        { start: 301, end: 310, food: 356250, wood: 356250, stone: 267225, gold: 178125, crystal: 187500 },
        { start: 311, end: 320, food: 356250, wood: 356250, stone: 267225, gold: 178125, crystal: 187500 },
        { start: 321, end: 330, food: 375000, wood: 375000, stone: 281250, gold: 187500, crystal: 187500 },
        { start: 331, end: 340, food: 375000, wood: 375000, stone: 281250, gold: 187500, crystal: 137500 },
        { start: 341, end: 350, food: 393750, wood: 393750, stone: 295350, gold: 196875, crystal: 187500 },
        { start: 351, end: 360, food: 393750, wood: 393750, stone: 295350, gold: 196375, crystal: 137500 },
        { start: 361, end: 370, food: 412500, wood: 412500, stone: 309375, gold: 206250, crystal: 187500 },
        { start: 371, end: 380, food: 412500, wood: 412500, stone: 309375, gold: 206250, crystal: 137500 },
        { start: 381, end: 390, food: 431250, wood: 431250, stone: 323475, gold: 215625, crystal: 187500 },
        { start: 391, end: 400, food: 431250, wood: 431250, stone: 323475, gold: 215625, crystal: 137500 },
        { start: 401, end: 410, food: 450000, wood: 450000, stone: 337500, gold: 225000, crystal: 225000 },
        { start: 411, end: 420, food: 450000, wood: 450000, stone: 337500, gold: 225000, crystal: 225000 },
        { start: 421, end: 430, food: 468750, wood: 468800, stone: 351600, gold: 234375, crystal: 225000 },
    ];

    // Crystal costs per individual flag (from cog_flag_cost.py)
    const CRYSTAL_COSTS: number[] = [
        ...Array(20).fill(0),       // Flags 1-20
        ...Array(10).fill(7500),    // Flags 21-30
        ...Array(10).fill(11250),   // Flags 31-40
        ...Array(10).fill(15000),   // Flags 41-50
        ...Array(10).fill(18750),   // Flags 51-60
        ...Array(10).fill(22500),   // Flags 61-70
        ...Array(10).fill(26250),   // Flags 71-80
        ...Array(10).fill(30000),   // Flags 81-90
        ...Array(10).fill(33750),   // Flags 91-100
        ...Array(10).fill(37500),   // Flags 101-110
        ...Array(10).fill(41250),   // Flags 111-120
        ...Array(10).fill(45000),   // Flags 121-130
        ...Array(10).fill(48750),   // Flags 131-140
        ...Array(10).fill(52500),   // Flags 141-150
        ...Array(10).fill(56250),   // Flags 151-160
        ...Array(10).fill(60000),   // Flags 161-170
        ...Array(10).fill(63750),   // Flags 171-180
        ...Array(10).fill(67500),   // Flags 181-190
        ...Array(10).fill(71250),   // Flags 191-200
        ...Array(10).fill(75000),   // Flags 201-210
        ...Array(10).fill(78750),   // Flags 211-220
        ...Array(10).fill(82500),   // Flags 221-230
        ...Array(10).fill(86250),   // Flags 231-240
        ...Array(10).fill(90000),   // Flags 241-250
        ...Array(10).fill(93750),   // Flags 251-260
        ...Array(10).fill(97500),   // Flags 261-270
        ...Array(10).fill(101250),  // Flags 271-280
        ...Array(10).fill(105000),  // Flags 281-290
        ...Array(10).fill(112500),  // Flags 291-300
        ...Array(100).fill(187500), // Flags 301-400
        ...Array(30).fill(225000),  // Flags 401-430
    ];

    const MAX_FLAGS = CRYSTAL_COSTS.length; // 430

    /** Get the resource costs for a specific flag number (1-based) */
    function getCostsForFlag(flagNum: number): { food: number; wood: number; stone: number; gold: number; crystal: number } {
        const range = FLAG_RANGE_COSTS.find(r => flagNum >= r.start && flagNum <= r.end);
        if (range) {
            return { food: range.food, wood: range.wood, stone: range.stone, gold: range.gold, crystal: CRYSTAL_COSTS[flagNum - 1] };
        }
        return { food: 0, wood: 0, stone: 0, gold: 0, crystal: CRYSTAL_COSTS[flagNum - 1] || 0 };
    }

    // ── Helpers ──

    function parseNumber(val: string): number {
        if (!val) return NaN;
        const cleaned = val.replace(/[,\s]/g, '');
        return parseInt(cleaned, 10);
    }

    function formatNumber(n: number): string {
        return n.toLocaleString('en-US');
    }

    function formatNumberInput(value: string): string {
        const num = parseNumber(value);
        if (isNaN(num) || num === 0) {
            return value.replace(/[^0-9,\s]/g, '');
        }
        return formatNumber(num);
    }

    function parseDatetime(dateStr: string): Date | null {
        // Format: HH:MM DD/MM/YYYY
        const match = dateStr.trim().match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!match) return null;
        const [, hh, mm, dd, mo, yyyy] = match;
        const h = parseInt(hh); const m = parseInt(mm);
        const d = parseInt(dd); const month = parseInt(mo); const y = parseInt(yyyy);
        if (h < 0 || h > 23 || m < 0 || m > 59 || d < 1 || d > 31 || month < 1 || month > 12) return null;
        const date = new Date(Date.UTC(y, month - 1, d, h, m, 0, 0));
        if (isNaN(date.getTime())) return null;
        return date;
    }

    // ── Resource definitions (crystal first) ──
    const RESOURCES = [
        { key: 'crystal', label: 'Crystal', colorClass: 'crystal-res', imageSrc: crystalIcon.src },
        { key: 'food',    label: 'Food',    colorClass: 'food',        imageSrc: foodIcon.src },
        { key: 'wood',    label: 'Wood',    colorClass: 'wood',        imageSrc: woodIcon.src },
        { key: 'stone',   label: 'Stone',   colorClass: 'stone',       imageSrc: stoneIcon.src },
        { key: 'gold',    label: 'Gold',    colorClass: 'gold',        imageSrc: goldIcon.src },
    ] as const;

    // ── State ──

    let currentFlags = '';
    let endDate = '';

    // Resource current amounts & production rates
    let resourceAmounts: Record<string, string> = { crystal: '', food: '', wood: '', stone: '', gold: '' };
    let resourceProduction: Record<string, string> = { crystal: '', food: '', wood: '', stone: '', gold: '' };

    let error = '';

    type ResourceSummary = {
        current: number;
        production: number;
        totalCost: number;
        deficit: number; // positive = shortfall, 0 or negative = enough
        projectedGain: number;
        projectedTotal: number;
    };

    type FlagResult = {
        initialCrystal: number;
        currentFlags: number;
        projectedCrystal: number | null;
        futureGain: number | null;
        targetDate: Date | null;
        flagsBuilt: number;
        totalFlags: number;
        remainingCrystal: number;
        totalFoodCost: number;
        totalWoodCost: number;
        totalStoneCost: number;
        totalGoldCost: number;
        totalCrystalSpent: number;
        resourceSummaries: Record<string, ResourceSummary>;
        costBreakdown: { flagNum: number; food: number; wood: number; stone: number; gold: number; crystal: number }[];
    } | null;

    let result: FlagResult = null;

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
        let totalFood = 0, totalWood = 0, totalStone = 0, totalGold = 0, totalCrystalSpent = 0;
        let breakdown: { flagNum: number; food: number; wood: number; stone: number; gold: number; crystal: number }[] = [];

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
            costBreakdown: breakdown,
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

    function formatDateForDisplay(date: Date): string {
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const yyyy = date.getUTCFullYear();
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const min = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${min} ${dd}/${mm}/${yyyy} UTC`;
    }

    function formatRelativeTime(date: Date): string {
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

    // ── Tick for live relative time ──
    let tick = 0;
    let tickInterval: ReturnType<typeof setInterval>;

    onMount(() => {
        tickInterval = setInterval(() => { tick++; }, 15000);
        return () => clearInterval(tickInterval);
    });
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

        <!-- Top Inputs -->
        <div class="input-grid">
            <div class="input-group">
                <label for="flag-current">Current Flags Built</label>
                <input
                    id="flag-current"
                    type="text"
                    inputmode="numeric"
                    bind:value={currentFlags}
                    placeholder="Example: 50"
                    on:input={() => { currentFlags = formatNumberInput(currentFlags); }}
                />
            </div>
            <div class="input-group">
                <label for="flag-end-date">Target Date (UTC)</label>
                <input
                    id="flag-end-date"
                    type="text"
                    bind:value={endDate}
                    placeholder="HH:MM DD/MM/YYYY"
                />
                <span class="input-hint">Optional — projects resource gains over time</span>
            </div>
        </div>

        <!-- Resource Inputs (always visible) -->
        <div class="resource-inputs-section">
            <span class="section-label">Alliance Resources</span>
            <div class="resource-inputs-grid">
                {#each RESOURCES as res}
                    <div class="resource-input-row">
                        <div class="resource-input-icon {res.colorClass}">
                            <img src={res.imageSrc} alt={res.label} />
                        </div>
                        <div class="resource-input-label">{res.label}</div>
                        <div class="resource-input-fields">
                            <div class="input-group compact">
                                <label for="res-{res.key}-amount">Current</label>
                                <input
                                    id="res-{res.key}-amount"
                                    type="text"
                                    inputmode="numeric"
                                    bind:value={resourceAmounts[res.key]}
                                    placeholder="Amount"
                                    on:input={() => { resourceAmounts[res.key] = formatNumberInput(resourceAmounts[res.key]); }}
                                />
                            </div>
                            <div class="input-group compact">
                                <label for="res-{res.key}-prod">Production /hr</label>
                                <input
                                    id="res-{res.key}-prod"
                                    type="text"
                                    inputmode="numeric"
                                    bind:value={resourceProduction[res.key]}
                                    placeholder="/hr"
                                    on:input={() => { resourceProduction[res.key] = formatNumberInput(resourceProduction[res.key]); }}
                                />
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Actions -->
        <div class="action-row">
            <button class="btn-calculate" on:click={calculate}>
                <span>Calculate</span>
            </button>
            {#if result || error}
                <button class="btn-clear" on:click={clearAll}>
                    <i class="fas fa-times"></i> Clear
                </button>
            {/if}
        </div>

        <!-- Error -->
        {#if error}
            <div class="result-card error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{error}</span>
            </div>
        {/if}

        <!-- Results -->
        {#if result}
            <div class="result-card">
                <div class="result-title">
                    <i class="fas fa-flag flag-result-icon"></i>
                    Flag Cost Results
                </div>

                <!-- Current Status -->
                <div class="result-section">
                    <div class="result-section-header">Current Status</div>
                    <div class="stat-grid">
                        <div class="stat-item">
                            <span class="stat-label">Crystal Available</span>
                            <span class="stat-value crystal">{formatNumber(result.initialCrystal)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Flags Built</span>
                            <span class="stat-value">{formatNumber(result.currentFlags)}</span>
                        </div>
                    </div>
                </div>

                <!-- Projected Status (if target date was provided) -->
                {#if result.targetDate}
                    <div class="result-divider"></div>
                    <div class="result-section">
                        <div class="result-section-header">Projected Status</div>
                        <div class="stat-grid">
                            <div class="stat-item" style="grid-column: 1 / -1;">
                                <span class="stat-label">Target Date</span>
                                <span class="stat-value">{formatDateForDisplay(result.targetDate)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Crystal Gain</span>
                                <span class="stat-value crystal">+{formatNumber(result.futureGain ?? 0)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Projected Crystal</span>
                                <span class="stat-value crystal">{formatNumber(result.projectedCrystal ?? 0)}</span>
                            </div>
                        </div>
                    </div>
                {/if}

                <div class="result-divider"></div>

                <!-- Calculation Results -->
                <div class="result-section">
                    <div class="result-section-header">Calculation Results</div>
                    <div class="stat-grid wide">
                        <div class="stat-item highlight">
                            <span class="stat-label">Additional Flags</span>
                            <span class="stat-value large">{formatNumber(result.flagsBuilt)}</span>
                        </div>
                        <div class="stat-item highlight">
                            <span class="stat-label">Total Flags</span>
                            <span class="stat-value large">{formatNumber(result.totalFlags)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Remaining Crystal</span>
                            <span class="stat-value crystal">{formatNumber(result.remainingCrystal)}</span>
                        </div>
                    </div>
                </div>

                <!-- Resource Cost Breakdown -->
                {#if result.flagsBuilt > 0}
                    <div class="result-divider"></div>
                    <div class="result-section">
                        <div class="result-section-header">Total Resource Costs</div>
                        <div class="resource-table">
                            <div class="resource-table-header">
                                <span class="rt-col-resource">Resource</span>
                                <span class="rt-col">Cost</span>
                                <span class="rt-col">Available</span>
                                <span class="rt-col">Status</span>
                            </div>
                            {#each RESOURCES as res}
                                {@const summary = result.resourceSummaries[res.key]}
                                <div class="resource-table-row" class:deficit={summary.deficit > 0} class:surplus={summary.deficit === 0}>
                                    <span class="rt-col-resource">
                                        <span class="rt-icon {res.colorClass}">
                                            <img src={res.imageSrc} alt={res.label} />
                                        </span>
                                        {res.label}
                                    </span>
                                    <span class="rt-col">{formatNumber(summary.totalCost)}</span>
                                    <span class="rt-col">{formatNumber(summary.projectedTotal)}</span>
                                    <span class="rt-col">
                                        {#if summary.deficit > 0}
                                            <span class="status-deficit">-{formatNumber(summary.deficit)}</span>
                                        {:else}
                                            <span class="status-surplus"><i class="fas fa-check"></i></span>
                                        {/if}
                                    </span>
                                </div>
                            {/each}
                        </div>
                        <p class="resource-table-note">Status shows how much of each resource you still need to build all {result.flagsBuilt} flag{result.flagsBuilt !== 1 ? 's' : ''} your crystal allows.</p>
                    </div>
                {/if}

                <!-- Next Flag Cost Info -->
                {#if result.totalFlags < MAX_FLAGS}
                    <div class="result-divider"></div>
                    <div class="result-section">
                        <div class="next-flag-info">
                            <i class="fas fa-arrow-right"></i>
                            <span>
                                Next flag (#{result.totalFlags + 1}) costs <strong>{formatNumber(CRYSTAL_COSTS[result.totalFlags])}</strong> crystal
                                — you need <strong>{formatNumber(Math.max(0, CRYSTAL_COSTS[result.totalFlags] - result.remainingCrystal))}</strong> more
                            </span>
                        </div>
                    </div>
                {:else}
                    <div class="result-divider"></div>
                    <div class="result-section">
                        <div class="next-flag-info max">
                            <i class="fas fa-crown"></i>
                            <span>Maximum flag count reached! ({MAX_FLAGS} flags)</span>
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
    .flag-calculator-container {
        width: 100%;
        max-width: 700px;
        margin: 0 auto;
        padding: var(--spacing-4);
    }

    /* ================================================
       PANEL
       ================================================ */
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

    /* ================================================
       INPUTS
       ================================================ */
    .input-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-4);
    }


    .input-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2);
    }

    .input-group.compact {
        gap: 4px;
    }

    .input-group.compact label {
        font-size: 10px;
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

    .input-group.compact input {
        padding: var(--spacing-2) var(--spacing-3);
        font-size: var(--font-size-xs);
    }

    .input-group input::placeholder {
        color: var(--text-muted);
    }

    .input-group input:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .input-hint {
        font-size: 10px;
        color: var(--text-muted);
        font-style: italic;
    }

    /* ================================================
       RESOURCE INPUTS
       ================================================ */
    .resource-inputs-section {
        margin-bottom: var(--spacing-4);
    }

    .section-label {
        display: block;
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--spacing-3);
    }

    .resource-inputs-grid {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
        margin-bottom: var(--spacing-3);
    }

    .resource-input-row {
        display: grid;
        grid-template-columns: 32px 64px 1fr;
        gap: var(--spacing-3);
        align-items: center;
        padding: var(--spacing-2) var(--spacing-3);
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-md);
    }

    .resource-input-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .resource-input-icon img {
        width: 22px;
        height: 22px;
        object-fit: contain;
    }

    .resource-input-icon.food { color: #a3e635; background: rgba(163, 230, 53, 0.12); }
    .resource-input-icon.wood { color: #f97316; background: rgba(249, 115, 22, 0.12); }
    .resource-input-icon.stone { color: #94a3b8; background: rgba(148, 163, 184, 0.12); }
    .resource-input-icon.gold { color: #fbbf24; background: rgba(251, 191, 36, 0.12); }
    .resource-input-icon.crystal-res { color: #38bdf8; background: rgba(56, 189, 248, 0.12); }

    .resource-input-label {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .resource-input-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-3);
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

    .btn-calculate:hover::before { left: 100%; }

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

    .result-card.error i { flex-shrink: 0; }

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

    .flag-result-icon { color: #004cff; }

    .result-section { margin-bottom: var(--spacing-2); }

    .result-section-header {
        font-size: var(--font-size-xs);
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--spacing-3);
    }

    .result-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: var(--spacing-4) 0;
    }

    /* ── Stat Grid ── */
    .stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-3);
    }

    .stat-grid.wide {
        grid-template-columns: repeat(3, 1fr);
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: var(--spacing-3);
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius-md);
    }

    .stat-item.highlight {
        background: rgba(0, 76, 255, 0.08);
        border-color: rgba(0, 76, 255, 0.2);
    }

    .stat-label {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        font-weight: 500;
    }

    .stat-value {
        font-size: var(--font-size-sm);
        font-weight: 700;
        color: var(--text-primary);
    }

    .stat-value.large {
        font-size: var(--font-size-lg);
        color: var(--accent-blue-bright);
    }

    .stat-value.crystal {
        color: #38bdf8;
    }

    /* ── Resource Table (results) ── */
    .resource-table {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-md);
        overflow: hidden;
    }

    .resource-table-header {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 0.8fr;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-3);
        background: rgba(255, 255, 255, 0.04);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .resource-table-header span {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .resource-table-row {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 0.8fr;
        gap: var(--spacing-2);
        padding: var(--spacing-2) var(--spacing-3);
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        transition: background 0.15s ease;
    }

    .resource-table-row:last-child {
        border-bottom: none;
    }

    .resource-table-row:hover {
        background: rgba(255, 255, 255, 0.02);
    }

    .rt-col-resource {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--text-primary);
    }

    .rt-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 0.7rem;
        flex-shrink: 0;
    }

    .rt-icon img {
        width: 18px;
        height: 18px;
        object-fit: contain;
    }

    .rt-icon.food { color: #a3e635; background: rgba(163, 230, 53, 0.12); }
    .rt-icon.wood { color: #f97316; background: rgba(249, 115, 22, 0.12); }
    .rt-icon.stone { color: #94a3b8; background: rgba(148, 163, 184, 0.12); }
    .rt-icon.gold { color: #fbbf24; background: rgba(251, 191, 36, 0.12); }
    .rt-icon.crystal-res { color: #38bdf8; background: rgba(56, 189, 248, 0.12); }

    .rt-col {
        font-size: var(--font-size-xs);
        font-weight: 600;
        color: var(--text-secondary);
    }

    .status-deficit {
        color: #f87171;
        font-weight: 700;
        font-size: var(--font-size-xs);
    }

    .status-surplus {
        color: var(--accent-green);
        font-weight: 700;
        font-size: var(--font-size-xs);
    }

    .status-surplus i {
        font-size: 0.7rem;
    }

    .resource-table-note {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-top: var(--spacing-2);
        text-align: center;
    }

    /* ── Next Flag Info ── */
    .next-flag-info {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        padding: var(--spacing-3) var(--spacing-4);
        background: rgba(0, 76, 255, 0.06);
        border: 1px solid rgba(0, 76, 255, 0.15);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }

    .next-flag-info i {
        color: #004cff;
        flex-shrink: 0;
    }

    .next-flag-info strong {
        color: var(--text-primary);
    }

    .next-flag-info.max {
        background: rgba(251, 191, 36, 0.08);
        border-color: rgba(251, 191, 36, 0.2);
    }

    .next-flag-info.max i {
        color: #fbbf24;
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */
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

        .input-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-3);
        }

        .stat-grid, .stat-grid.wide {
            grid-template-columns: 1fr 1fr;
        }

        .result-card {
            padding: var(--spacing-4);
        }

        .resource-input-row {
            grid-template-columns: 28px 52px 1fr;
            gap: var(--spacing-2);
        }

        .resource-input-fields {
            gap: var(--spacing-2);
        }

        .resource-table-header,
        .resource-table-row {
            grid-template-columns: 1fr 1fr 1fr 0.7fr;
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

        .stat-grid, .stat-grid.wide {
            grid-template-columns: 1fr;
        }

        .resource-input-row {
            grid-template-columns: 1fr;
            gap: var(--spacing-2);
            padding: var(--spacing-3);
        }

        .resource-input-row .resource-input-icon {
            display: none;
        }

        .resource-input-label {
            font-size: var(--font-size-sm);
            margin-bottom: 2px;
        }

        .resource-table-header,
        .resource-table-row {
            grid-template-columns: 0.8fr 1fr 1fr 0.6fr;
            font-size: 11px;
        }

        .rt-col-resource {
            font-size: 11px;
        }
    }
</style>
