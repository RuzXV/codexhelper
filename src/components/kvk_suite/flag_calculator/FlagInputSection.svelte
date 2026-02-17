<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import '../../../styles/flag-calculator-shared.css';
    import { formatNumberInput } from '../../../lib/kvk-suite/flagCostData';
    import type { ResourceDef } from '../../../lib/kvk-suite/flagCostData';

    export let currentFlags: string;
    export let endDate: string;
    export let resourceAmounts: Record<string, string>;
    export let resourceProduction: Record<string, string>;
    export let resources: readonly ResourceDef[];
    export let error: string;
    export let hasResult: boolean;

    const dispatch = createEventDispatcher<{
        calculate: void;
        clear: void;
        updateCurrentFlags: string;
        updateEndDate: string;
        updateResourceAmount: { key: string; value: string };
        updateResourceProduction: { key: string; value: string };
    }>();

    function handleCurrentFlagsInput() {
        dispatch('updateCurrentFlags', formatNumberInput(currentFlags));
    }

    function handleResourceAmountInput(key: string) {
        dispatch('updateResourceAmount', { key, value: formatNumberInput(resourceAmounts[key]) });
    }

    function handleResourceProductionInput(key: string) {
        dispatch('updateResourceProduction', { key, value: formatNumberInput(resourceProduction[key]) });
    }
</script>

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
            on:input={handleCurrentFlagsInput}
        />
    </div>
    <div class="input-group">
        <label for="flag-end-date">Target Date (UTC)</label>
        <input
            id="flag-end-date"
            type="text"
            bind:value={endDate}
            placeholder="HH:MM DD/MM/YYYY"
            on:input={() => dispatch('updateEndDate', endDate)}
        />
        <span class="input-hint">Optional — projects resource gains over time</span>
    </div>
</div>

<!-- Resource Inputs (always visible) -->
<div class="resource-inputs-section">
    <span class="section-label">Alliance Resources</span>
    <div class="resource-inputs-grid">
        {#each resources as res}
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
                            on:input={() => handleResourceAmountInput(res.key)}
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
                            on:input={() => handleResourceProductionInput(res.key)}
                        />
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- Actions -->
<div class="action-row">
    <button class="btn-calculate" on:click={() => dispatch('calculate')}>
        <span>Calculate</span>
    </button>
    {#if hasResult || error}
        <button class="btn-clear" on:click={() => dispatch('clear')}>
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

<style>
    /* ── Input Grid ── */
    .input-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-4);
        margin-bottom: var(--spacing-4);
    }

    .input-hint {
        font-size: 10px;
        color: var(--text-muted);
        font-style: italic;
    }

    /* ── Resource Inputs ── */
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

    .resource-input-icon.food {
        color: #a3e635;
        background: rgba(163, 230, 53, 0.12);
    }
    .resource-input-icon.wood {
        color: #f97316;
        background: rgba(249, 115, 22, 0.12);
    }
    .resource-input-icon.stone {
        color: #94a3b8;
        background: rgba(148, 163, 184, 0.12);
    }
    .resource-input-icon.gold {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.12);
    }
    .resource-input-icon.crystal-res {
        color: #38bdf8;
        background: rgba(56, 189, 248, 0.12);
    }

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

    /* ── Actions ── */
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

    /* ── Error Card ── */
    .result-card.error {
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: var(--radius-lg);
        padding: var(--spacing-4);
        color: #f87171;
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-4);
    }

    .result-card.error i {
        flex-shrink: 0;
    }

    /* ── Input Group (scoped) ── */
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
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
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

    /* ── Mobile Responsive ── */
    @media (max-width: 768px) {
        .input-grid {
            grid-template-columns: 1fr;
            gap: var(--spacing-3);
        }

        .resource-input-row {
            grid-template-columns: 28px 52px 1fr;
            gap: var(--spacing-2);
        }

        .resource-input-fields {
            gap: var(--spacing-2);
        }
    }

    @media (max-width: 480px) {
        .btn-calculate {
            flex: 1;
            justify-content: center;
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
    }
</style>
