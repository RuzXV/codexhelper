<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Technology, TechRequirement, CombinedRequirement } from '../../../lib/tech-simulator/techRequirements';
    import { getCombinedRequirements, meetsRCRequirement } from '../../../lib/tech-simulator/techRequirements';
    import { getCostReductionAtLevel, getReducedCost, formatNumber } from '../../../lib/tech-simulator/techCosts';

    export let techKey: string | null;
    export let technology: Technology | null;
    export let show: boolean;
    export let tooltipX: number;
    export let tooltipY: number;
    export let tooltipOriginX: number;
    export let tooltipOriginY: number;
    export let currentLevel: number;
    export let userTechLevels: Record<string, number>;
    export let researchCenterLevel: number;
    export let allTechs: Record<string, Technology>;
    export let techIcon: ImageMetadata | null;
    export let crystalIconSrc: string;
    export let seasonCoinIconSrc: string;

    const dispatch = createEventDispatcher<{
        navigateToTech: { techKey: string };
    }>();

    function getRequirementParts(req: TechRequirement): { keyword: string; techIds: string[] } {
        if (req.tech) {
            return { keyword: '', techIds: [req.tech] };
        } else if (req.anyOf && req.anyOf.length > 0) {
            return { keyword: 'Any of:', techIds: req.anyOf };
        } else if (req.allOf && req.allOf.length > 0) {
            return { keyword: 'All of:', techIds: req.allOf };
        }
        return { keyword: '', techIds: [] };
    }

    function getTechName(techId: string): string {
        return allTechs[techId]?.name || techId;
    }

    function handleNavigate(targetTechKey: string) {
        dispatch('navigateToTech', { techKey: targetTechKey });
    }

    $: combinedRequirements = techKey ? getCombinedRequirements(techKey, allTechs) : [];
</script>

{#if technology && show}
    {@const tech = technology}
    <div
        class="tech-tooltip"
        class:show
        style="left: {tooltipX}px; top: {tooltipY}px; --origin-x: {tooltipOriginX - tooltipX}px; --origin-y: {tooltipOriginY - tooltipY}px;"
    >
        <div class="tooltip-header">
            <div class="tooltip-icon">
                {#if techIcon}
                    <img src={techIcon.src} alt={tech.name} width="48" height="48" />
                {:else}
                    <span class="icon-placeholder">{tech.name.charAt(0)}</span>
                {/if}
            </div>
            <div class="tooltip-title">
                <h3>{tech.name}</h3>
                <p class="tooltip-description">{tech.description}</p>
            </div>
        </div>
        <div class="tooltip-summary">
            <div class="summary-item">
                <span class="summary-label">Current Level</span>
                <span class="summary-value">{currentLevel} / {tech.maxLevel}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Max Buff</span>
                <span class="summary-value buff">{tech.totals.buff}</span>
            </div>
        </div>
        <div class="tooltip-table-container">
            <table class="tooltip-table">
                <thead>
                    <tr>
                        <th>Lvl</th>
                        <th>Buff</th>
                        <th>Time</th>
                        <th><img src={crystalIconSrc} alt="Crystals" width="16" height="16" /></th>
                        <th><img src={seasonCoinIconSrc} alt="Season Coins" width="16" height="16" /></th>
                    </tr>
                </thead>
                <tbody>
                    {#each tech.levels as level}
                        {@const meetsRC = techKey
                            ? meetsRCRequirement(techKey, level.level, researchCenterLevel)
                            : true}
                        {@const displayCost = techKey
                            ? getReducedCost(
                                  level.crystals,
                                  getCostReductionAtLevel(techKey, level.level, researchCenterLevel, userTechLevels),
                              )
                            : level.crystals}
                        <tr
                            class:completed={level.level <= currentLevel}
                            class:next={level.level === currentLevel + 1}
                            class:rc-locked={!meetsRC}
                        >
                            <td class="level-col">{level.level}</td>
                            <td class="buff-col">{level.buff}</td>
                            <td class="time-col">{level.time}</td>
                            <td class="crystal-col">{formatNumber(displayCost)}</td>
                            <td class="coin-col">{formatNumber(level.seasonCoins)}</td>
                        </tr>
                    {/each}
                </tbody>
                <tfoot>
                    <tr class="totals-row">
                        <td>Total</td>
                        <td class="buff-col">{tech.totals.buff}</td>
                        <td class="time-col">{tech.totals.time}</td>
                        <td class="crystal-col"
                            >{formatNumber(
                                techKey
                                    ? tech.levels.reduce(
                                          (sum, lvl, i) =>
                                              sum +
                                              getReducedCost(
                                                  lvl.crystals,
                                                  getCostReductionAtLevel(techKey, i + 1, researchCenterLevel, userTechLevels),
                                              ),
                                          0,
                                      )
                                    : tech.totals.crystals,
                            )}</td
                        >
                        <td class="coin-col">{formatNumber(tech.totals.seasonCoins)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
        {#if combinedRequirements.length > 0}
            <div class="tooltip-requirements">
                <span class="req-label">Requirements:</span>
                {#each combinedRequirements as combinedReq}
                    {#if combinedReq.type === 'tech'}
                        {@const parts = getRequirementParts(combinedReq.req)}
                        <span class="req-item"
                            ><span class="req-unlock-level">Lvl {combinedReq.level}:</span>
                            {#if parts.keyword}<span class="req-keyword">{parts.keyword}</span
                                >&nbsp;{/if}{#each parts.techIds as techId, i}<span
                                    class="req-tech-link"
                                    on:click={() => handleNavigate(techId)}
                                    on:keydown={(e) => e.key === 'Enter' && handleNavigate(techId)}
                                    role="button"
                                    tabindex="0">{getTechName(techId)}</span
                                >{#if i < parts.techIds.length - 1},&nbsp;{/if}{/each}
                            <span class="req-arrow">-></span>
                            <span class="req-tech-level">Lvl {combinedReq.req.techLevel || 0}</span></span
                        >
                    {:else}
                        {@const meetsRC = researchCenterLevel >= combinedReq.rcLevel}
                        <span class="req-item"
                            ><span class="req-unlock-level">Lvl {combinedReq.level}:</span>
                            <span class="rc-req-name" class:rc-met={meetsRC} class:rc-not-met={!meetsRC}
                                >Research Center</span
                            > <span class="req-arrow">-></span>
                            <span class="req-tech-level">Lvl {combinedReq.rcLevel}</span></span
                        >
                    {/if}
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    /* ================================================
       CLICK TOOLTIP
       ================================================ */

    .tech-tooltip {
        position: absolute;
        width: 420px;
        background: linear-gradient(135deg, rgba(15, 25, 35, 0.98) 0%, rgba(25, 40, 55, 0.98) 100%);
        border: 1px solid rgba(100, 180, 220, 0.3);
        border-radius: 12px;
        padding: 16px;
        z-index: 99999;
        backdrop-filter: blur(12px);
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(100, 180, 220, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        pointer-events: auto;
        overflow: visible;
        transform-origin: var(--origin-x, 0) var(--origin-y, 0);
        animation: tooltipAppear 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes tooltipAppear {
        0% {
            opacity: 0;
            transform: scale(0.3);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    .tooltip-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(100, 180, 220, 0.2);
    }

    .tooltip-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tooltip-icon img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .tooltip-icon .icon-placeholder {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(100, 180, 220, 0.6);
    }

    .tooltip-title {
        flex: 1;
        min-width: 0;
    }

    .tooltip-title h3 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #fff;
        line-height: 1.2;
    }

    .tooltip-description {
        margin: 0;
        font-size: 0.75rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.4;
    }

    .tooltip-summary {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
    }

    .summary-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .summary-label {
        font-size: 0.65rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .summary-value {
        font-size: 0.95rem;
        font-weight: 700;
        font-family: 'NotoSansHans', sans-serif;
        color: #fff;
    }

    .summary-value.buff {
        color: #7dd87d;
    }

    .tooltip-table-container {
        max-height: 230px;
        overflow-y: auto;
        margin-bottom: 10px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.15);
    }

    .tooltip-table-container::-webkit-scrollbar {
        width: 6px;
    }

    .tooltip-table-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }

    .tooltip-table-container::-webkit-scrollbar-thumb {
        background: rgba(100, 180, 220, 0.4);
        border-radius: 3px;
    }

    .tooltip-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'NotoSansHans', sans-serif;
        font-size: 0.75rem;
    }

    .tooltip-table thead {
        position: sticky;
        top: 0;
        background: rgba(20, 35, 50, 0.98);
        z-index: 1;
    }

    .tooltip-table tfoot {
        position: sticky;
        bottom: 0;
        background: rgba(20, 35, 50, 0.98);
        z-index: 1;
    }

    .tooltip-table th {
        padding: 8px 6px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        border-bottom: 1px solid rgba(100, 180, 220, 0.2);
    }

    .tooltip-table th img {
        display: inline-block;
        vertical-align: middle;
    }

    .tooltip-table td {
        padding: 6px;
        text-align: center;
        color: rgba(255, 255, 255, 0.85);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tooltip-table tbody tr:hover {
        background: rgba(100, 180, 220, 0.1);
    }

    .tooltip-table tbody tr.completed {
        background: rgba(100, 180, 100, 0.1);
    }

    .tooltip-table tbody tr.completed td {
        color: rgba(125, 216, 125, 0.9);
    }

    .tooltip-table tbody tr.next {
        background: rgba(100, 180, 220, 0.15);
    }

    .tooltip-table tbody tr.next td {
        color: #64b4dc;
        font-weight: 600;
    }

    .tooltip-table .level-col {
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
        width: 35px;
    }

    .tooltip-table tbody tr.rc-locked {
        opacity: 0.5;
    }

    .tooltip-table .buff-col {
        color: #7dd87d;
        font-weight: 600;
    }

    .tooltip-table .time-col {
        color: rgba(255, 255, 255, 0.7);
    }

    .tooltip-table .crystal-col {
        color: #64d4f4;
    }

    .tooltip-table .coin-col {
        color: #f4c764;
    }

    .tooltip-table tfoot tr {
        background: rgba(20, 35, 50, 0.95);
    }

    .tooltip-table tfoot td {
        padding: 8px 6px;
        font-weight: 700;
        border-top: 1px solid rgba(100, 180, 220, 0.3);
        border-bottom: none;
    }

    .tooltip-requirements {
        padding: 8px 10px;
        background: rgba(255, 200, 100, 0.1);
        border-radius: 6px;
        border: 1px solid rgba(255, 200, 100, 0.2);
    }

    .req-label {
        display: block;
        font-size: 0.65rem;
        font-weight: 700;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 200, 100, 0.8);
        text-transform: uppercase;
        margin-bottom: 4px;
    }

    .req-item {
        display: block;
        font-size: 0.7rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.7);
        padding: 2px 0;
    }

    .req-unlock-level {
        color: #7dd87d;
        font-weight: 600;
    }

    .req-arrow {
        color: rgba(255, 200, 100, 0.8);
        font-weight: 700;
    }

    .req-tech-level {
        color: #fcd34d;
        font-weight: 700;
    }

    .req-keyword {
        color: #fcd34d;
        font-weight: 600;
    }

    .req-tech-link {
        color: #7dd3fc;
        cursor: pointer;
        transition: color 0.15s ease;
    }

    .req-tech-link:hover {
        color: #bae6fd;
        text-decoration: underline;
    }

    .rc-req-name {
        font-weight: 600;
        color: #e8a0a0;
    }

    .rc-req-name.rc-met {
        color: #e8a0a0;
    }

    .rc-req-name.rc-not-met {
        color: #f87171;
    }
</style>
