<script lang="ts">
    import '../../../styles/flag-calculator-shared.css';
    import {
        CRYSTAL_COSTS,
        MAX_FLAGS,
        formatNumber,
        formatDateForDisplay,
    } from '../../../lib/kvk-suite/flagCostData';
    import type { FlagResult, ResourceDef } from '../../../lib/kvk-suite/flagCostData';

    export let result: FlagResult;
    export let resources: readonly ResourceDef[];
</script>

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
                {#each resources as res}
                    {@const summary = result.resourceSummaries[res.key]}
                    <div
                        class="resource-table-row"
                        class:deficit={summary.deficit > 0}
                        class:surplus={summary.deficit === 0}
                    >
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
            <p class="resource-table-note">
                Status shows how much of each resource you still need to build all {result.flagsBuilt} flag{result.flagsBuilt !==
                1
                    ? 's'
                    : ''} your crystal allows.
            </p>
        </div>
    {/if}

    <!-- Next Flag Cost Info -->
    {#if result.totalFlags < MAX_FLAGS}
        <div class="result-divider"></div>
        <div class="result-section">
            <div class="next-flag-info">
                <i class="fas fa-arrow-right"></i>
                <span>
                    Next flag (#{result.totalFlags + 1}) costs
                    <strong>{formatNumber(CRYSTAL_COSTS[result.totalFlags])}</strong>
                    crystal — you need
                    <strong
                        >{formatNumber(
                            Math.max(0, CRYSTAL_COSTS[result.totalFlags] - result.remainingCrystal),
                        )}</strong
                    > more
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

<style>
    /* ── Result Card ── */
    .result-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-lg);
        padding: var(--spacing-6);
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

    .flag-result-icon {
        color: #004cff;
    }

    .result-section {
        margin-bottom: var(--spacing-2);
    }

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

    .rt-icon.food {
        color: #a3e635;
        background: rgba(163, 230, 53, 0.12);
    }
    .rt-icon.wood {
        color: #f97316;
        background: rgba(249, 115, 22, 0.12);
    }
    .rt-icon.stone {
        color: #94a3b8;
        background: rgba(148, 163, 184, 0.12);
    }
    .rt-icon.gold {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.12);
    }
    .rt-icon.crystal-res {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
    }

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

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
        .stat-grid,
        .stat-grid.wide {
            grid-template-columns: 1fr 1fr;
        }

        .result-card {
            padding: var(--spacing-4);
        }

        .resource-table-header,
        .resource-table-row {
            grid-template-columns: 1fr 1fr 1fr 0.7fr;
        }
    }

    @media (max-width: 480px) {
        .stat-grid,
        .stat-grid.wide {
            grid-template-columns: 1fr;
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
