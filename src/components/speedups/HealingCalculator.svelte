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

    let isT5 = true;
    let healingSpeed = 90;
    let resourceBuff = 10;
    const HELP_COUNT = 30; 

    let counts = { infantry: '', cavalry: '', archer: '', siege: '' };
    
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

    $: activeTier = isT5 ? 't5' : 't4';
    $: calculateHealing(counts, healingSpeed, resourceBuff, isT5, tradeRatio);

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

        const baseTimePerUnit = isT5 ? BASE_TIME_T5 : BASE_TIME_T4;
        const resTable = isT5 ? RESOURCES.t5 : RESOURCES.t4;
        const kpValue = isT5 ? KP_PER_UNIT.t5 : KP_PER_UNIT.t4;

        Object.entries(counts).forEach(([type, val]) => {
            const count = parseInt(val.replace(/,/g, '') || '0');
            if (count > 0) {
                hasInput = true;
                unitSum += count;
                
                totalBaseSeconds += (baseTimePerUnit * count) / speedMultiplier;

                const unitCost = resTable[type];
                currentRes.food += unitCost.food * count * costMultiplier;
                currentRes.wood += unitCost.wood * count * costMultiplier;
                currentRes.stone += unitCost.stone * count * costMultiplier;
                currentRes.gold += unitCost.gold * count * costMultiplier;
            }
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
                expectedKills = Math.floor(totalUnits * tradeRatio);
                expectedKP = Math.floor(totalUnits * kpValue * tradeRatio);
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

    function handleInput(e, obj, key) {
        let value = e.target.value.replace(/,/g, '').replace(/\D/g, '');
        if (value) {
            obj[key] = parseInt(value).toLocaleString();
        } else {
            obj[key] = '';
        }
        if (obj === counts) counts = counts;
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

    <div class="form-group header-group">
        <span class="label-text">Expected Units Healed</span>
        <div class="label-with-toggle">
            <label for="tier-toggle-heal" class="toggle-switch">
                <input type="checkbox" id="tier-toggle-heal" bind:checked={isT5}>
                <span class="toggle-slider" data-on="T5" data-off="T4"></span>
            </label>
        </div>
    </div>

    <div class="form-group" style="margin-top: -10px;">
        <div class="troop-grid" class:t5-group={isT5} class:t4-group={!isT5}>
            <div class="troop-item">
                <label for="inf-in">Infantry</label>
                <img src={images[`${activeTier}_inf.webp`]} alt="Infantry" />
                <input id="inf-in" type="text" placeholder="0" value={counts.infantry} on:input={(e) => handleInput(e, counts, 'infantry')} use:autoFontSize={counts.infantry}>
            </div>
            <div class="troop-item">
                <label for="cav-in">Cavalry</label>
                <img src={images[`${activeTier}_cav.webp`]} alt="Cavalry" />
                <input id="cav-in" type="text" placeholder="0" value={counts.cavalry} on:input={(e) => handleInput(e, counts, 'cavalry')} use:autoFontSize={counts.cavalry}>
            </div>
            <div class="troop-item">
                <label for="arch-in">Archer</label>
                <img src={images[`${activeTier}_arch.webp`]} alt="Archer" />
                <input id="arch-in" type="text" placeholder="0" value={counts.archer} on:input={(e) => handleInput(e, counts, 'archer')} use:autoFontSize={counts.archer}>
            </div>
            <div class="troop-item">
                <label for="siege-in">Siege</label>
                <img src={images[`${activeTier}_siege.webp`]} alt="Siege" />
                <input id="siege-in" type="text" placeholder="0" value={counts.siege} on:input={(e) => handleInput(e, counts, 'siege')} use:autoFontSize={counts.siege}>
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
                        <img src={images[`${isT5 ? 't5' : 't4'}_inf.webp`]} alt="Troops" style="transform: scale(1.2);" />
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

<style>
    .buff-inputs-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 20px;
    }
    .header-group.compact { 
        margin-bottom: 5px; 
        justify-content: flex-start; 
        gap: 1px;
        align-items: center; 
    }
    .header-group label { font-size: 0.8rem; white-space: nowrap; margin-bottom: 0; }

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

    .buff-inputs-grid input {
        width: 100%;
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px;
        color: var(--text-primary);
        text-align: center;
    }

    .label-text { display: block; font-weight: 500; color: var(--text-secondary); margin-bottom: var(--spacing-2); }
    .header-group { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-2); }
    .tooltip-wrapper { position: relative; display: flex; align-items: center; }
    .info-btn { background: none; border: none; color: var(--text-secondary); font-size: 1rem; cursor: pointer; padding: 0; display: flex; align-items: center; }
    
    .tooltip-container { position: absolute; left: 0; top: 100%; margin-top: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 15px; border-radius: var(--radius-md); width: 250px; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,0.6); text-align: left; }
    .tooltip-container h4 { margin: 0 0 10px 0; color: var(--text-primary); font-size: 0.9rem; }
    .tooltip-container p { font-size: 0.8rem; color: var(--text-secondary); margin: 5px 0; }
    .tooltip-img { width: 100%; border-radius: 4px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1); }
    .tooltip-img.square { aspect-ratio: 1/1; object-fit: cover; }
    .tooltip-img.wide { height: auto; }

    .ratio-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .ratio-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px 4px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: all 0.2s;
    }
    .ratio-btn:hover { border-color: var(--accent-blue); background: var(--bg-tertiary); }
    .ratio-btn.active {
        background: var(--accent-blue-light);
        border-color: var(--accent-blue);
    }
    .ratio-val { font-weight: 700; color: white; font-size: 0.9rem; }
    .ratio-lbl { font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px; text-align: center; white-space: nowrap; }
    .ratio-btn.active .ratio-val, .ratio-btn.active .ratio-lbl { color: white; }

    .troop-grid { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 4px; 
        position: relative; 
        padding: 4px; 
        border-radius: var(--radius-lg); 
        margin-bottom: 5px; 
    }
    .troop-grid::after { 
        content: ''; 
        position: absolute; 
        inset: 0; 
        border-radius: inherit; 
        z-index: 0; 
        opacity: 0.35; 
        pointer-events: none; 
    }
    .troop-grid.t4-group::after { background-image: radial-gradient(circle, #ca62e6 0%, #8113a7 100%); }
    .troop-grid.t5-group::after { background-image: radial-gradient(circle, #f28d00 0%, #d55800 100%); }

    .troop-item { background: var(--bg-tertiary); border: 1px solid var(--border-hover); border-radius: var(--radius-md); padding: var(--spacing-2); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-2); position: relative; z-index: 1; }
    .troop-item label { font-size: 0.75rem; margin: 0; color: var(--text-secondary); font-weight: 500; }
    .troop-item img { width: 48px; height: 48px; object-fit: contain; }
    .troop-item input { width: 100%; text-align: center; padding: 4px; font-size: 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); }
    .troop-item input:focus { border-color: var(--accent-blue); outline: none; }
    
    .res-grid { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; width: 100%; }
    .res-grid .cost-line { display: flex; align-items: center; gap: 5px; font-size: 1rem; color: white; }
    .res-grid .cost-line img { height: 24px; }
    
    .calc-result { min-height: 140px; position: relative; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .calc-result.result-success::after { content: ''; position: absolute; inset: 0; border-radius: inherit; border: 2px solid transparent; animation: glow-border 1.2s ease-out; }
    @keyframes glow-border { 0% { border-color: transparent; box-shadow: 0 0 0 0 transparent; } 25% { border-color: var(--accent-green); box-shadow: 0 0 15px 0 var(--accent-green); } 100% { border-color: transparent; box-shadow: 0 0 15px 0 transparent; } }

    .label-with-toggle { display: flex; align-items: center; }
    
    .toggle-switch { position: relative; width: 50px; height: 26px; display: inline-block; cursor: pointer; margin: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 26px; transition: .4s; display: flex; align-items: center; padding: 0; }
    .toggle-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s; z-index: 2; }
    
    .toggle-slider::after { 
        content: attr(data-off); 
        color: rgba(255,255,255,0.5); 
        position: absolute;
        right: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        transition: 0.3s;
    }
    
    input:checked + .toggle-slider::after { 
        content: attr(data-on); 
        right: auto;
        left: 8px;
        color: white; 
    }
    
    input:checked + .toggle-slider::before { 
        transform: translateX(24px); 
    }
    
    input:checked + .toggle-slider { 
        background-image: radial-gradient(circle, #f28d00 0%, #d55800 100%); 
        border-color: rgba(255, 255, 255, 0.7); 
    }

    @media (max-width: 600px) {
        .troop-grid { grid-template-columns: repeat(2, 1fr); }
        .buff-inputs-grid { grid-template-columns: 1fr; }
        .ratio-selector { grid-template-columns: repeat(2, 1fr); }
    }
</style>