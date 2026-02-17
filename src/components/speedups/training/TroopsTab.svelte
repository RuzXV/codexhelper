<script>
    import { tick, createEventDispatcher } from 'svelte';
    import '../../../styles/training-shared.css';
    import {
        BASE_TIME_T4,
        BASE_TIME_T5,
        BASE_TIME_UPGRADE,
        RESOURCES,
        POWER_PER_UNIT,
        MGE_POINTS_PER_UNIT,
        formatTime,
        formatNumber,
    } from '../../../lib/training/trainingData';

    export let images = {};
    export let trainingSpeed = '';

    const dispatch = createEventDispatcher();

    let sectionOpen = { t4: true, t5: true, upgrade: true };

    let troopInputs = {
        t4: { infantry: '', cavalry: '', archer: '', siege: '' },
        t5: { infantry: '', cavalry: '', archer: '', siege: '' },
        upgrade: { infantry: '', cavalry: '', archer: '', siege: '' },
    };

    let resultTime = null;
    let totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
    let totalPower = 0;
    let totalMge = 0;
    let hasResult = false;
    let resultAnimationTrigger = false;

    $: calculateAllTroops(troopInputs, trainingSpeed);

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
        return {
            update,
            destroy() {
                node.removeEventListener('input', update);
            },
        };
    }

    async function triggerAnimation() {
        resultAnimationTrigger = false;
        await tick();
        resultAnimationTrigger = true;
        setTimeout(() => {
            resultAnimationTrigger = false;
        }, 1200);
    }

    function calculateAllTroops() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;

        let totalSeconds = 0;
        let currentRes = { food: 0, wood: 0, stone: 0, gold: 0 };
        let power = 0;
        let mge = 0;
        let hasInput = false;

        const categories = [
            {
                key: 't4',
                baseTime: BASE_TIME_T4,
                res: RESOURCES.t4,
                power: POWER_PER_UNIT.t4,
                mge: MGE_POINTS_PER_UNIT.t4,
            },
            {
                key: 't5',
                baseTime: BASE_TIME_T5,
                res: RESOURCES.t5,
                power: POWER_PER_UNIT.t5,
                mge: MGE_POINTS_PER_UNIT.t5,
            },
            {
                key: 'upgrade',
                baseTime: BASE_TIME_UPGRADE,
                res: RESOURCES.upgrade,
                power: POWER_PER_UNIT.upgrade,
                mge: MGE_POINTS_PER_UNIT.upgrade,
            },
        ];

        categories.forEach((cat) => {
            Object.entries(troopInputs[cat.key]).forEach(([type, val]) => {
                const count = parseInt(val.replace(/\D/g, '') || '0');
                if (count > 0) {
                    hasInput = true;
                    totalSeconds += (cat.baseTime / speedMultiplier) * count;
                    const unitCost = cat.res[type];
                    currentRes.food += unitCost.food * count;
                    currentRes.wood += unitCost.wood * count;
                    currentRes.stone += unitCost.stone * count;
                    currentRes.gold += unitCost.gold * count;

                    power += count * cat.power;
                    mge += count * cat.mge;
                }
            });
        });

        if (hasInput) {
            resultTime = formatTime(totalSeconds);
            totalRes = currentRes;
            totalPower = power;
            totalMge = mge;
            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function resetResults() {
        resultTime = null;
        totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
        totalPower = 0;
        totalMge = 0;
        hasResult = false;
        resultAnimationTrigger = false;
    }

    function handleInput(e, category, type) {
        let value = e.target.value.replace(/,/g, '').replace(/\D/g, '');
        if (value) {
            troopInputs[category][type] = parseInt(value).toLocaleString('en-US');
        } else {
            troopInputs[category][type] = '';
        }
        troopInputs = troopInputs;
    }
</script>

<div class="form-group collapse-group">
    <div class="label-with-toggle">
        <span class="label-text">Train T4</span>
        <label class="toggle-switch">
            <input type="checkbox" bind:checked={sectionOpen.t4} />
            <span class="toggle-slider"></span>
        </label>
    </div>
    <div class="collapsible-content" class:is-open={sectionOpen.t4}>
        <div class="troop-grid t4-group">
            <div class="troop-item">
                <label for="t4-inf">Infantry</label>
                <img src={images['t4_inf.webp']} alt="Infantry" />
                <input
                    id="t4-inf"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t4.infantry}
                    on:input={(e) => handleInput(e, 't4', 'infantry')}
                    use:autoFontSize={troopInputs.t4.infantry}
                />
            </div>
            <div class="troop-item">
                <label for="t4-cav">Cavalry</label>
                <img src={images['t4_cav.webp']} alt="Cavalry" />
                <input
                    id="t4-cav"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t4.cavalry}
                    on:input={(e) => handleInput(e, 't4', 'cavalry')}
                    use:autoFontSize={troopInputs.t4.cavalry}
                />
            </div>
            <div class="troop-item">
                <label for="t4-arch">Archer</label>
                <img src={images['t4_arch.webp']} alt="Archer" />
                <input
                    id="t4-arch"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t4.archer}
                    on:input={(e) => handleInput(e, 't4', 'archer')}
                    use:autoFontSize={troopInputs.t4.archer}
                />
            </div>
            <div class="troop-item">
                <label for="t4-siege">Siege</label>
                <img src={images['t4_siege.webp']} alt="Siege" />
                <input
                    id="t4-siege"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t4.siege}
                    on:input={(e) => handleInput(e, 't4', 'siege')}
                    use:autoFontSize={troopInputs.t4.siege}
                />
            </div>
        </div>
    </div>
</div>

<div class="form-group collapse-group">
    <div class="label-with-toggle">
        <span class="label-text">Train T5</span>
        <label class="toggle-switch">
            <input type="checkbox" bind:checked={sectionOpen.t5} />
            <span class="toggle-slider"></span>
        </label>
    </div>
    <div class="collapsible-content" class:is-open={sectionOpen.t5}>
        <div class="troop-grid t5-group">
            <div class="troop-item">
                <label for="t5-inf">Infantry</label>
                <img src={images['t5_inf.webp']} alt="Infantry" />
                <input
                    id="t5-inf"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t5.infantry}
                    on:input={(e) => handleInput(e, 't5', 'infantry')}
                    use:autoFontSize={troopInputs.t5.infantry}
                />
            </div>
            <div class="troop-item">
                <label for="t5-cav">Cavalry</label>
                <img src={images['t5_cav.webp']} alt="Cavalry" />
                <input
                    id="t5-cav"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t5.cavalry}
                    on:input={(e) => handleInput(e, 't5', 'cavalry')}
                    use:autoFontSize={troopInputs.t5.cavalry}
                />
            </div>
            <div class="troop-item">
                <label for="t5-arch">Archer</label>
                <img src={images['t5_arch.webp']} alt="Archer" />
                <input
                    id="t5-arch"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t5.archer}
                    on:input={(e) => handleInput(e, 't5', 'archer')}
                    use:autoFontSize={troopInputs.t5.archer}
                />
            </div>
            <div class="troop-item">
                <label for="t5-siege">Siege</label>
                <img src={images['t5_siege.webp']} alt="Siege" />
                <input
                    id="t5-siege"
                    type="text"
                    placeholder="0"
                    value={troopInputs.t5.siege}
                    on:input={(e) => handleInput(e, 't5', 'siege')}
                    use:autoFontSize={troopInputs.t5.siege}
                />
            </div>
        </div>
    </div>
</div>

<div class="form-group collapse-group">
    <div class="label-with-toggle">
        <span class="label-text">Upgrade T4 -> T5</span>
        <label class="toggle-switch">
            <input type="checkbox" bind:checked={sectionOpen.upgrade} />
            <span class="toggle-slider"></span>
        </label>
    </div>
    <div class="collapsible-content" class:is-open={sectionOpen.upgrade}>
        <div class="troop-grid upgrade-group">
            <div class="troop-item">
                <label for="upg-inf">Infantry</label>
                <img src={images['t5_inf.webp']} alt="Infantry" />
                <input
                    id="upg-inf"
                    type="text"
                    placeholder="0"
                    value={troopInputs.upgrade.infantry}
                    on:input={(e) => handleInput(e, 'upgrade', 'infantry')}
                    use:autoFontSize={troopInputs.upgrade.infantry}
                />
            </div>
            <div class="troop-item">
                <label for="upg-cav">Cavalry</label>
                <img src={images['t5_cav.webp']} alt="Cavalry" />
                <input
                    id="upg-cav"
                    type="text"
                    placeholder="0"
                    value={troopInputs.upgrade.cavalry}
                    on:input={(e) => handleInput(e, 'upgrade', 'cavalry')}
                    use:autoFontSize={troopInputs.upgrade.cavalry}
                />
            </div>
            <div class="troop-item">
                <label for="upg-arch">Archer</label>
                <img src={images['t5_arch.webp']} alt="Archer" />
                <input
                    id="upg-arch"
                    type="text"
                    placeholder="0"
                    value={troopInputs.upgrade.archer}
                    on:input={(e) => handleInput(e, 'upgrade', 'archer')}
                    use:autoFontSize={troopInputs.upgrade.archer}
                />
            </div>
            <div class="troop-item">
                <label for="upg-siege">Siege</label>
                <img src={images['t5_siege.webp']} alt="Siege" />
                <input
                    id="upg-siege"
                    type="text"
                    placeholder="0"
                    value={troopInputs.upgrade.siege}
                    on:input={(e) => handleInput(e, 'upgrade', 'siege')}
                    use:autoFontSize={troopInputs.upgrade.siege}
                />
            </div>
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
        <div class="cost-line" style="font-size: 1.2rem; margin-bottom: 5px;">
            <img src={images['training_speedup.webp']} alt="Clock" style="height: 32px;" />
            <span>Time: <strong style="color: var(--accent-blue-bright);">{resultTime}</strong></span>
        </div>

        <div class="res-grid">
            {#if totalRes.food > 0}
                <div class="cost-line">
                    <img src={images['food.webp']} alt="Food" /> <span>{formatNumber(totalRes.food)}</span>
                </div>
            {/if}
            {#if totalRes.wood > 0}
                <div class="cost-line">
                    <img src={images['wood.webp']} alt="Wood" /> <span>{formatNumber(totalRes.wood)}</span>
                </div>
            {/if}
            {#if totalRes.stone > 0}
                <div class="cost-line">
                    <img src={images['stone.webp']} alt="Stone" />
                    <span>{formatNumber(totalRes.stone)}</span>
                </div>
            {/if}
            {#if totalRes.gold > 0}
                <div class="cost-line">
                    <img src={images['gold.webp']} alt="Gold" /> <span>{formatNumber(totalRes.gold)}</span>
                </div>
            {/if}
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
                <img
                    src={images['mge_icon.webp']}
                    alt="MGE"
                    on:error={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div class="stat-info">
                    <span class="stat-label">MGE Points</span>
                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                        >{totalMge.toLocaleString()}</span
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

    .res-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px 16px;
    }
</style>
