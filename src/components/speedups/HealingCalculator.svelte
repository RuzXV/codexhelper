<script>
    import { tick } from 'svelte';
    export let images = {};

    const BASE_TIME_T4 = 3.0;
    const BASE_TIME_T5 = 4.0;

    const KP_PER_UNIT = { t4: 10, t5: 20 };
    const RESOURCES = {
        t4: {
            infantry: { food: 120, wood: 120, stone: 0, gold: 8 },
            archer:   { food: 0, wood: 120, stone: 90, gold: 8 },
            cavalry:  { food: 120, wood: 0, stone: 90, gold: 8 },
            siege:    { food: 80, wood: 80, stone: 60, gold: 8 }
        },
        t5: {
            infantry: { food: 320, wood: 320, stone: 0, gold: 160 },
            archer:   { food: 0, wood: 320, stone: 240, gold: 160 },
            cavalry:  { food: 320, wood: 0, stone: 240, gold: 160 },
            siege:    { food: 200, wood: 200, stone: 160, gold: 160 }
        }
    };
    let healingSpeed = 90;
    let resourceBuff = 10;
    const HELP_COUNT = 30;
    let counts = {
        t4: { infantry: '', cavalry: '', archer: '', siege: '' },
        t5: { infantry: '', cavalry: '', archer: '', siege: '' }
    };
    let tradeRatio = null;
    const RATIO_OPTIONS = [
        { label: 'Farm Killer', value: 3, ratioLabel: '3:1' },
        { label: 'Optimistic', value: 2, ratioLabel: '2:1' },
        { label: 'Balanced', value: 1, ratioLabel: '1:1' },
        { label: 'Tanking', value: 0.5, ratioLabel: '0.5:1' }
    ];
    let finalTimeStr = null;
    let totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
    let totalUnits = 0;
    let expectedKills = 0;
    let expectedKP = 0;

    let hasResult = false;
    let resultAnimationTrigger = false;
    let activeTooltip = null; 

    $: calculateHealing(counts, healingSpeed, resourceBuff, tradeRatio);

    function autoFontSize(node, value) {
        const update = () => {
            const initialSize = 16;
            node.style.fontSize = `${initialSize}px`;
            let currentSize = initialSize;
            while (node.scrollWidth > node.clientWidth && currentSize > 10) {
                currentSize--;
                node.style.fontSize = `${currentSize}px`;
            }
        };
        node.addEventListener('input', update);
        return { update, destroy() { node.removeEventListener('input', update); } };
    }

    async function triggerAnimation() {
        resultAnimationTrigger = false;
        await tick();
        resultAnimationTrigger = true;
        setTimeout(() => {
            resultAnimationTrigger = false;
        }, 1200);
    }

    function calculateHealing() {
        const speedMultiplier = 1 + (parseFloat(healingSpeed || '0') / 100);
        const costMultiplier = 1 - (parseFloat(resourceBuff || '0') / 100);

        let totalBaseSeconds = 0;
        let currentRes = { food: 0, wood: 0, stone: 0, gold: 0 };
        let hasInput = false;
        let unitSum = 0;
        
        let t4Sum = 0;
        let t5Sum = 0;
        ['t4', 't5'].forEach(tier => {
            const baseTimePerUnit = tier === 't5' ? BASE_TIME_T5 : BASE_TIME_T4;
            const resTable = RESOURCES[tier];

            Object.entries(counts[tier]).forEach(([type, val]) => {
                const count = parseInt(val.replace(/,/g, '') || '0');
                if (count > 0) {
                    hasInput = true;
                    unitSum += count;
                    if (tier === 't4') t4Sum += count;
                    if (tier === 't5') t5Sum += count;
                    
                    totalBaseSeconds += (baseTimePerUnit * count) / speedMultiplier;

                    const unitCost = resTable[type];
                    currentRes.food += unitCost.food * count * costMultiplier;
                    currentRes.wood += unitCost.wood * count * costMultiplier;
                    currentRes.stone += unitCost.stone * count * costMultiplier;
                    currentRes.gold += unitCost.gold * count * costMultiplier;
                }
            });
        });
        if (hasInput) {
            const originalSeconds = Math.max(3, Math.ceil(totalBaseSeconds));
            let tempSeconds = originalSeconds;

            for (let i = 0; i < HELP_COUNT; i++) {
                if (tempSeconds <= 0) break;
                const reduction = Math.max(180, tempSeconds * 0.01);
                tempSeconds = Math.max(0, tempSeconds - reduction);
            }

            const finalSeconds = Math.floor(tempSeconds);
            finalTimeStr = formatTime(finalSeconds);
            totalRes = {
                food: Math.ceil(currentRes.food),
                wood: Math.ceil(currentRes.wood),
                stone: Math.ceil(currentRes.stone),
                gold: Math.ceil(currentRes.gold)
            };
            totalUnits = unitSum;
            
            if (tradeRatio !== null) {
                const projectedT4Kills = t4Sum * tradeRatio;
                const projectedT5Kills = t5Sum * tradeRatio;
                
                expectedKills = Math.floor(projectedT4Kills + projectedT5Kills);
                expectedKP = Math.floor(
                    (projectedT4Kills * KP_PER_UNIT.t4) + 
                    (projectedT5Kills * KP_PER_UNIT.t5)
                );
            } else {
                expectedKills = 0;
                expectedKP = 0;
            }

            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function resetResults() {
        finalTimeStr = null;
        totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
        totalUnits = 0;
        expectedKills = 0;
        expectedKP = 0;
        hasResult = false;
        resultAnimationTrigger = false;
    }

    function formatTime(totalSeconds) {
        if (totalSeconds <= 0) return '0s';
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(' ');
    }

    function formatNumber(num) {
        if (num >= 1000000000) return parseFloat((num / 1000000000).toFixed(2)) + 'B';
        if (num >= 1000000) return parseFloat((num / 1000000).toFixed(1)) + 'M';
        if (num >= 1000) return parseFloat((num / 1000).toFixed(1)) + 'k';
        return num.toLocaleString();
    }

    function handleInput(e, tier, key) {
        let value = e.target.value.replace(/,/g, '').replace(/\D/g, '');
        if (value) {
            counts[tier][key] = parseInt(value).toLocaleString();
        } else {
            counts[tier][key] = '';
        }
        counts = counts;
    }

    function toggleTooltip(type) { 
        if (activeTooltip === type) {
            activeTooltip = null;
        } else {
            activeTooltip = type;
        }
    }

    function closeTooltip() { 
        activeTooltip = null;
    }
</script>

<svelte:window on:click={closeTooltip} />

<div class="calculator-island">
    <div class="island-content">
        
        <div class="buff-inputs-grid">
            <div class="form-group">
                <div class="header-group compact">
                    <div class="tooltip-wrapper">
                       
                        <button class="info-btn" on:click|stopPropagation={() => toggleTooltip('speed')} aria-label="Help" type="button">
                            <i class="fas fa-question-circle"></i>
                        </button>
                        {#if activeTooltip === 'speed'}
            
                            <div class="tooltip-container" on:click|stopPropagation on:keydown|stopPropagation role="button" tabindex="0">
                                <h4>Finding Healing Speed</h4>
                                <p>1. Tap City Hall -> Stats</p>
                                <img src={images['buff_showcase1.webp']} alt="Step 1" class="tooltip-img square" />
                                <p>2. Scroll to "Healing Speed"</p>
                                <img src={images['buff_healing_speed.webp']} alt="Step 2" class="tooltip-img wide" />
                            </div>
                        {/if}
       
                    </div>
                    <label for="heal-speed">Healing Speed (%)</label>
                </div>
                <input type="number" id="heal-speed" placeholder="90" bind:value={healingSpeed}>
            </div>

            <div class="form-group">
   
                <div class="header-group compact">
                    <div class="tooltip-wrapper">
                        <button class="info-btn" on:click|stopPropagation={() => toggleTooltip('cost')} aria-label="Help" type="button">
                            <i class="fas fa-question-circle"></i>
    
                    </button>
                        {#if activeTooltip === 'cost'}
                            <div class="tooltip-container" on:click|stopPropagation on:keydown|stopPropagation role="button" tabindex="0">
                    
                                <h4>Finding Cost Reduction</h4>
                                <p>1. Tap City Hall -> Stats</p>
                                <img src={images['buff_showcase1.webp']} alt="Step 1" class="tooltip-img square" />
                                <p>2. Scroll to "Healing Resource Cost"</p>
                                <img src={images['buff_healing_cost.webp']} alt="Step 2" class="tooltip-img wide" />
                            </div>
                        {/if}
      
                    </div>
                    <label for="res-buff">Resource Cost Reduction (%)</label>
                </div>
                <input type="number" id="res-buff" placeholder="10" bind:value={resourceBuff}>
            </div>
        </div>

      
        <div class="form-group">
            <span class="label-text-small">Tier 4 Healed</span>
            <div class="troop-grid t4-group">
                <div class="troop-item">
                    <label for="t4-inf">Infantry</label>
                    <img src={images['t4_inf.webp']} alt="Infantry" />
                    <input id="t4-inf" type="text" placeholder="0" value={counts.t4.infantry} on:input={(e) => handleInput(e, 't4', 'infantry')} use:autoFontSize={counts.t4.infantry}>
                </div>
                <div class="troop-item">
                    <label for="t4-cav">Cavalry</label>
                    <img src={images['t4_cav.webp']} alt="Cavalry" />
                    <input id="t4-cav" type="text" placeholder="0" value={counts.t4.cavalry} on:input={(e) => handleInput(e, 't4', 'cavalry')} use:autoFontSize={counts.t4.cavalry}>
                </div>
                <div class="troop-item">
                    <label for="t4-arch">Archer</label>
                    <img src={images['t4_arch.webp']} alt="Archer" />
                    <input id="t4-arch" type="text" placeholder="0" value={counts.t4.archer} on:input={(e) => handleInput(e, 't4', 'archer')} use:autoFontSize={counts.t4.archer}>
                </div>
                <div class="troop-item">
                    <label for="t4-siege">Siege</label>
                    <img src={images['t4_siege.webp']} alt="Siege" />
                    <input id="t4-siege" type="text" placeholder="0" value={counts.t4.siege} on:input={(e) => handleInput(e, 't4', 'siege')} use:autoFontSize={counts.t4.siege}>
                </div>
            </div>
        </div>

        <div class="form-group" style="margin-top: 10px;">
         
            <span class="label-text-small">Tier 5 Healed</span>
            <div class="troop-grid t5-group">
                <div class="troop-item">
                    <label for="t5-inf">Infantry</label>
                    <img src={images['t5_inf.webp']} alt="Infantry" />
                    <input id="t5-inf" type="text" placeholder="0" value={counts.t5.infantry} on:input={(e) => handleInput(e, 't5', 'infantry')} use:autoFontSize={counts.t5.infantry}>
                </div>
                <div class="troop-item">
                    <label for="t5-cav">Cavalry</label>
                    <img src={images['t5_cav.webp']} alt="Cavalry" />
                    <input id="t5-cav" type="text" placeholder="0" value={counts.t5.cavalry} on:input={(e) => handleInput(e, 't5', 'cavalry')} use:autoFontSize={counts.t5.cavalry}>
                </div>
                <div class="troop-item">
                    <label for="t5-arch">Archer</label>
                    <img src={images['t5_arch.webp']} alt="Archer" />
                    <input id="t5-arch" type="text" placeholder="0" value={counts.t5.archer} on:input={(e) => handleInput(e, 't5', 'archer')} use:autoFontSize={counts.t5.archer}>
                </div>
                <div class="troop-item">
                    <label for="t5-siege">Siege</label>
                    <img src={images['t5_siege.webp']} alt="Siege" />
                    <input id="t5-siege" type="text" placeholder="0" value={counts.t5.siege} on:input={(e) => handleInput(e, 't5', 'siege')} use:autoFontSize={counts.t5.siege}>
                </div>
            </div>
        </div>
        
        <div class="form-group" style="margin-top: 20px; margin-bottom: 20px;">
            <span class="label-text" style="font-size: 0.85rem; margin-bottom: 8px;">Expected KP Trade Ratio (Optional)</span>
            <div class="ratio-selector">
                {#each RATIO_OPTIONS as option}
                    <button 
                        class="ratio-btn" 
                        class:active={tradeRatio === option.value}
                        on:click={() => tradeRatio = tradeRatio === option.value ? null : option.value}
                    >
                        <span class="ratio-val">{option.ratioLabel}</span>
                        <span class="ratio-lbl">{option.label}</span>
                    </button>
                {/each}
            </div>
        </div>

        {#if hasResult}
            <div class="result-disclaimer">
                Speedup cost assumes maximum helps (30) on all troops healed.
            </div>
        {/if}

        <div class="calc-result" class:result-success={hasResult && resultAnimationTrigger} class:has-value={hasResult} style="flex-direction: column; gap: 10px; padding: 20px;">
            {#if hasResult}
                <div class="healing-time-display">
                    <div class="time-row main">
                        <img src={images['healing_speedup.webp']} alt="Clock" on:error={(e) => e.target.src = images['training_speedup.webp']}/>
                        <span class="label">Total:</span>
                        <strong style="color: var(--accent-blue-bright);">{finalTimeStr}</strong>
                    </div>
                </div>

                <div class="res-grid">
                    {#if totalRes.food > 0} <div class="cost-line"><img src={images['food.webp']} alt="Food"/> <span>{formatNumber(totalRes.food)}</span></div> {/if}
                    {#if totalRes.wood > 0} <div class="cost-line"><img src={images['wood.webp']} alt="Wood"/> <span>{formatNumber(totalRes.wood)}</span></div> {/if}
                    {#if totalRes.stone > 0} <div class="cost-line"><img src={images['stone.webp']} alt="Stone"/> <span>{formatNumber(totalRes.stone)}</span></div> {/if}
                    {#if totalRes.gold > 0} <div class="cost-line"><img src={images['gold.webp']} alt="Gold"/> <span>{formatNumber(totalRes.gold)}</span></div> {/if}
                </div>

                {#if tradeRatio !== null && expectedKills > 0}
                    <div class="result-divider"></div>
                    <div class="stats-row">
                        <div class="stat-item">
                            <img src={images['t5_inf.webp']} alt="Troops" style="transform: scale(1.2);" />
                            <div class="stat-info">
                                <span class="stat-label">Total Kills</span>
                                <span class="stat-value" style="color: var(--accent-blue-bright);">{expectedKills.toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="stat-item">
                            <img src={images['kills_icon.webp']} alt="Killpoints" />
                            <div class="stat-info">
                                <span class="stat-label" style="font-size: 0.65rem; white-space: nowrap;">Killpoints Expected</span>
                                <span class="stat-value" style="color: var(--accent-blue-bright);">{expectedKP.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                {/if}

            {:else}
                <div style="opacity: 0;">&nbsp;</div>
            {/if}
        </div>
    </div>
</div>

<style>
    .healing-time-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin-bottom: 10px;
    }
    .time-row { display: flex; align-items: center; gap: 8px; }
    .time-row.main { font-size: 1.3rem; margin-bottom: 4px; }
    .time-row.main img { height: 32px; }

    .result-disclaimer {
        font-size: 0.75rem;
        font-style: italic;
        color: var(--text-secondary);
        margin-bottom: 6px;
        text-align: center;
        width: 100%;
    }

    .result-divider { width: 100%; height: 1px; background: rgba(255,255,255,0.1); margin: 15px 0; }
    
    .stats-row { display: flex; justify-content: space-around; width: 100%; gap: 10px; }
    .stat-item { display: flex; align-items: center; gap: 12px; }
    .stat-item img { width: 36px; height: 36px; object-fit: contain; }
    .stat-info { display: flex; flex-direction: column; text-align: left; }
    .stat-label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
    .stat-value { font-size: 1.1rem; font-weight: 700; color: white; }

    .label-text { display: block; font-weight: 500; color: var(--text-secondary); margin-bottom: var(--spacing-2); }
    .label-text-small { 
        display: block;
        font-weight: 500; 
        font-size: 1rem;
        color: var(--text-secondary); 
        margin-bottom: 5px; 
        margin-left: 5px;
    }
    
    @media (max-width: 600px) {
        .time-row.main {
            font-size: 1.1rem;
        }
        .time-row.main img {
            height: 28px;
        }
        .stats-row {
            gap: 5px;
        }
        .stat-item {
            gap: 8px;
        }
        .stat-item img {
            width: 28px;
            height: 28px;
        }
        .stat-value {
            font-size: 1rem;
        }
    }
</style>