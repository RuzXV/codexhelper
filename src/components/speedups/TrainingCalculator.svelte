<script>
    import { tick } from 'svelte';
    export let images = {};

    const BASE_TIME_T5 = 120;
    const BASE_TIME_T4 = 80;
    const BASE_TIME_UPGRADE = 40;

    const POWER_PER_UNIT = { t4: 4, t5: 10, upgrade: 6 };
    const MGE_POINTS_PER_UNIT = { t4: 40, t5: 100, upgrade: 60 };
    const PREKVK_POINTS_PER_UNIT = { t4: 8, t5: 20, upgrade: 12 };

    const RESOURCES = {
        t4: {
            infantry: { food: 300, wood: 300, stone: 0, gold: 20 },
            archer: { food: 0, wood: 300, stone: 225, gold: 20 },
            cavalry: { food: 300, wood: 0, stone: 225, gold: 20 },
            siege: { food: 200, wood: 200, stone: 150, gold: 20 },
        },
        t5: {
            infantry: { food: 800, wood: 800, stone: 0, gold: 400 },
            archer: { food: 0, wood: 800, stone: 600, gold: 400 },
            cavalry: { food: 800, wood: 0, stone: 600, gold: 400 },
            siege: { food: 500, wood: 500, stone: 400, gold: 400 },
        },
        upgrade: {
            infantry: { food: 500, wood: 500, stone: 0, gold: 380 },
            archer: { food: 0, wood: 500, stone: 375, gold: 380 },
            cavalry: { food: 500, wood: 0, stone: 375, gold: 380 },
            siege: { food: 300, wood: 300, stone: 250, gold: 380 },
        },
    };

    export let activeTab = 'troops';
    let trainingSpeed = '';

    let sliderThumb1 = 0;
    let sliderThumb2 = 100;
    let activeThumb = null;
    $: mixRatio = {
        t4: sliderThumb1 / 100,
        t5: (sliderThumb2 - sliderThumb1) / 100,
        upgrade: (100 - sliderThumb2) / 100,
    };

    let troopInputs = {
        t4: { infantry: '', cavalry: '', archer: '', siege: '' },
        t5: { infantry: '', cavalry: '', archer: '', siege: '' },
        upgrade: { infantry: '', cavalry: '', archer: '', siege: '' },
    };

    let sectionOpen = { t4: true, t5: true, upgrade: true };
    let reserveSectionOpen = true;
    let speedupTime = { d: '', h: '', m: '' };
    let targetMgePoints = '';

    let reserveSelection = { tier: 't5', size: 50000 };
    let reserveTargetDate = '';
    let reserveResultStr = null;

    let resultTime = null;
    let totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
    let totalPower = 0;
    let totalMge = 0;
    let totalPreKvkPoints = 0;
    let maxTroops = 0;

    let troopBreakdown = { t4: 0, t5: 0, upgrade: 0 };

    let showTooltip = false;
    let hasResult = false;
    let resultAnimationTrigger = false;

    let dateInputRef;

    $: if (activeTab === 'troops') calculateAllTroops(troopInputs, trainingSpeed);
    $: if (activeTab === 'speedups') calculateSpeedups(speedupTime, trainingSpeed, sliderThumb1, sliderThumb2);
    $: if (activeTab === 'mge') calculateMge(targetMgePoints, trainingSpeed, sliderThumb1, sliderThumb2);
    $: if (activeTab === 'prekvk')
        calculatePreKvk(speedupTime, trainingSpeed, sliderThumb1, sliderThumb2, reserveSelection, reserveTargetDate);

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

    let sliderNode;
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
    }

    function setReserveSelection(tier, size) {
        reserveSelection = { tier, size };
    }

    function openDatePicker() {
        if (dateInputRef) {
            try {
                dateInputRef.showPicker();
            } catch (e) {
                dateInputRef.focus();
            }
        }
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

    function calculateSpeedups() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;

        const days = parseInt(speedupTime.d.replace(/,/g, '') || '0');
        const hours = parseInt(speedupTime.h.replace(/,/g, '') || '0');
        const minutes = parseInt(speedupTime.m.replace(/,/g, '') || '0');
        const totalInputSeconds = days * 86400 + hours * 3600 + minutes * 60;

        if (totalInputSeconds <= 0) {
            resetResults();
            return;
        }

        const avgTime = mixRatio.t4 * BASE_TIME_T4 + mixRatio.t5 * BASE_TIME_T5 + mixRatio.upgrade * BASE_TIME_UPGRADE;

        let calculatedTotalTroops = Math.floor((totalInputSeconds * speedMultiplier) / avgTime);

        if (calculatedTotalTroops > 0) {
            distributeTroops(calculatedTotalTroops);

            totalPower =
                troopBreakdown.t4 * POWER_PER_UNIT.t4 +
                troopBreakdown.t5 * POWER_PER_UNIT.t5 +
                troopBreakdown.upgrade * POWER_PER_UNIT.upgrade;

            totalMge =
                troopBreakdown.t4 * MGE_POINTS_PER_UNIT.t4 +
                troopBreakdown.t5 * MGE_POINTS_PER_UNIT.t5 +
                troopBreakdown.upgrade * MGE_POINTS_PER_UNIT.upgrade;

            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function calculateMge() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;
        const target = parseInt(targetMgePoints.replace(/,/g, '') || '0');

        if (target <= 0) {
            resetResults();
            return;
        }

        const avgPoints =
            mixRatio.t4 * MGE_POINTS_PER_UNIT.t4 +
            mixRatio.t5 * MGE_POINTS_PER_UNIT.t5 +
            mixRatio.upgrade * MGE_POINTS_PER_UNIT.upgrade;

        let calculatedTotalTroops = Math.ceil(target / avgPoints);

        const avgTime = mixRatio.t4 * BASE_TIME_T4 + mixRatio.t5 * BASE_TIME_T5 + mixRatio.upgrade * BASE_TIME_UPGRADE;

        if (calculatedTotalTroops > 0) {
            distributeTroops(calculatedTotalTroops);

            const totalSeconds = (avgTime / speedMultiplier) * maxTroops;

            totalPower =
                troopBreakdown.t4 * POWER_PER_UNIT.t4 +
                troopBreakdown.t5 * POWER_PER_UNIT.t5 +
                troopBreakdown.upgrade * POWER_PER_UNIT.upgrade;

            totalMge =
                troopBreakdown.t4 * MGE_POINTS_PER_UNIT.t4 +
                troopBreakdown.t5 * MGE_POINTS_PER_UNIT.t5 +
                troopBreakdown.upgrade * MGE_POINTS_PER_UNIT.upgrade;

            resultTime = formatTime(totalSeconds);
            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function calculatePreKvk() {
        const speed = parseFloat(trainingSpeed || '0');
        const speedMultiplier = 1 + speed / 100;

        reserveResultStr = null;
        if (reserveTargetDate) {
            const baseTime = reserveSelection.tier === 't5' ? BASE_TIME_T5 : BASE_TIME_T4;
            const troopCount = reserveSelection.size + 2000;
            const totalSecondsNeeded = (baseTime * troopCount) / speedMultiplier;

            const [year, month, day] = reserveTargetDate.split('-').map(Number);
            const targetDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

            if (!isNaN(targetDateObj.getTime())) {
                const startTimestamp = targetDateObj.getTime() - totalSecondsNeeded * 1000;
                const startDate = new Date(startTimestamp);

                const utcYear = startDate.getUTCFullYear();
                const utcMonth = String(startDate.getUTCMonth() + 1).padStart(2, '0');
                const utcDay = String(startDate.getUTCDate()).padStart(2, '0');
                const utcHours = String(startDate.getUTCHours()).padStart(2, '0');
                const utcMinutes = String(startDate.getUTCMinutes()).padStart(2, '0');

                reserveResultStr = `Start your reserves on <strong>${utcDay}/${utcMonth}/${utcYear} at ${utcHours}:${utcMinutes} UTC</strong>`;
            }
        }

        const days = parseInt(speedupTime.d.replace(/,/g, '') || '0');
        const hours = parseInt(speedupTime.h.replace(/,/g, '') || '0');
        const minutes = parseInt(speedupTime.m.replace(/,/g, '') || '0');
        const totalInputSeconds = days * 86400 + hours * 3600 + minutes * 60;

        if (totalInputSeconds > 0) {
            const avgTime =
                mixRatio.t4 * BASE_TIME_T4 + mixRatio.t5 * BASE_TIME_T5 + mixRatio.upgrade * BASE_TIME_UPGRADE;

            let calculatedTotalTroops = Math.floor((totalInputSeconds * speedMultiplier) / avgTime);

            if (calculatedTotalTroops > 0) {
                distributeTroops(calculatedTotalTroops);

                totalPreKvkPoints =
                    troopBreakdown.t4 * PREKVK_POINTS_PER_UNIT.t4 +
                    troopBreakdown.t5 * PREKVK_POINTS_PER_UNIT.t5 +
                    troopBreakdown.upgrade * PREKVK_POINTS_PER_UNIT.upgrade;

                totalPower =
                    troopBreakdown.t4 * POWER_PER_UNIT.t4 +
                    troopBreakdown.t5 * POWER_PER_UNIT.t5 +
                    troopBreakdown.upgrade * POWER_PER_UNIT.upgrade;

                hasResult = true;
                triggerAnimation();
            }
        } else if (reserveResultStr) {
            hasResult = true;
            triggerAnimation();
        } else {
            resetResults();
        }
    }

    function distributeTroops(total) {
        const BATCH_SIZE = 1000;
        if (total >= BATCH_SIZE) {
            troopBreakdown.t4 = Math.floor((total * mixRatio.t4) / BATCH_SIZE) * BATCH_SIZE;
            troopBreakdown.t5 = Math.floor((total * mixRatio.t5) / BATCH_SIZE) * BATCH_SIZE;
            troopBreakdown.upgrade = Math.floor((total * mixRatio.upgrade) / BATCH_SIZE) * BATCH_SIZE;
            maxTroops = troopBreakdown.t4 + troopBreakdown.t5 + troopBreakdown.upgrade;
        } else {
            maxTroops = total;
            troopBreakdown.t4 = Math.floor(maxTroops * mixRatio.t4);
            troopBreakdown.t5 = Math.floor(maxTroops * mixRatio.t5);
            troopBreakdown.upgrade = Math.floor(maxTroops * mixRatio.upgrade);
        }
    }

    function resetResults() {
        resultTime = null;
        maxTroops = 0;
        troopBreakdown = { t4: 0, t5: 0, upgrade: 0 };
        totalRes = { food: 0, wood: 0, stone: 0, gold: 0 };
        totalPower = 0;
        totalMge = 0;
        totalPreKvkPoints = 0;
        reserveResultStr = null;
        hasResult = false;
        resultAnimationTrigger = false;
    }

    function formatTime(totalSeconds) {
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
        return num.toLocaleString('en-US');
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

    function handleSingleInput(e, setFunc) {
        let value = e.target.value.replace(/,/g, '').replace(/\D/g, '');
        let formatted = value ? parseInt(value).toLocaleString('en-US') : '';
        setFunc(formatted);
    }

    function handleSpeedupInput(e, key) {
        let value = e.target.value.replace(/,/g, '').replace(/\D/g, '');
        speedupTime[key] = value ? parseInt(value).toLocaleString('en-US') : '';
    }

    function toggleTooltip() {
        showTooltip = !showTooltip;
    }
    function closeTooltip() {
        showTooltip = false;
    }

    function switchTab(tab) {
        activeTab = tab;
        resetResults();
    }
</script>

<svelte:window on:click={closeTooltip} />

<div class="calculator-island">
    <div class="island-content">
        <div class="generator-tabs">
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'troops'}
                on:click={() => switchTab('troops')}
            >
                Troops
            </button>
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'speedups'}
                on:click={() => switchTab('speedups')}
            >
                Speedups
            </button>
            <button class="generator-tab-btn" class:active={activeTab === 'mge'} on:click={() => switchTab('mge')}>
                MGE Points
            </button>
            <button
                class="generator-tab-btn"
                class:active={activeTab === 'prekvk'}
                on:click={() => switchTab('prekvk')}
            >
                Pre-KvK
            </button>
        </div>

        <div class="form-group header-group">
            <label for="train-speed">Training Speed (%)</label>
            <div class="tooltip-wrapper">
                <button class="info-btn" on:click|stopPropagation={toggleTooltip} aria-label="Help" type="button">
                    <i class="fas fa-question-circle"></i>
                </button>
                {#if showTooltip}
                    <div
                        class="tooltip-container"
                        on:click|stopPropagation
                        on:keydown|stopPropagation
                        role="button"
                        tabindex="0"
                    >
                        <h4>Finding Training Speed</h4>
                        <p>1. Tap City Hall -> Stats</p>
                        <img src={images['buff_showcase1.webp']} alt="Step 1" class="tooltip-img square" />
                        <p>2. Scroll to "Training Speed"</p>
                        <img src={images['buff_showcase2.webp']} alt="Step 2" class="tooltip-img wide" />
                    </div>
                {/if}
            </div>
        </div>

        <div class="form-group" style="margin-top: -10px; margin-bottom: 25px;">
            <input type="number" id="train-speed" placeholder="Example: 95" bind:value={trainingSpeed} />
        </div>

        {#if activeTab === 'troops'}
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
        {:else}
            <div class="form-group">
                <div class="mix-control-header">
                    <span class="label-text">Training Mix</span>
                    <span class="mix-readout">
                        <span style="color: #ca62e6">{Math.round(mixRatio.t4 * 100)}% T4</span> /
                        <span style="color: #f28d00">{Math.round(mixRatio.t5 * 100)}% T5</span> /
                        <span style="color: #4ade80">{Math.round(mixRatio.upgrade * 100)}% Upgrade</span>
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

            <div class="dynamic-input-container">
                {#if activeTab === 'prekvk'}
                    <div class="form-group fade-in-panel">
                        <span class="label-text">Points from Speedups</span>
                        <div class="time-input-row" style="margin-bottom: 20px;">
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.d}
                                    on:input={(e) => handleSpeedupInput(e, 'd')}
                                /><span>Days</span>
                            </div>
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.h}
                                    on:input={(e) => handleSpeedupInput(e, 'h')}
                                /><span>Hours</span>
                            </div>
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.m}
                                    on:input={(e) => handleSpeedupInput(e, 'm')}
                                /><span>Mins</span>
                            </div>
                        </div>

                        <div
                            class="collapse-group"
                            style="margin-bottom: {reserveSectionOpen
                                ? '0'
                                : '-40px'}; transition: margin-bottom 0.3s ease;"
                        >
                            <div class="label-with-toggle">
                                <span class="label-text">When to start your reserves?</span>
                                <label class="toggle-switch">
                                    <input type="checkbox" bind:checked={reserveSectionOpen} />
                                    <span class="toggle-slider"></span>
                                </label>
                            </div>

                            <div class="collapsible-content" class:is-open={reserveSectionOpen}>
                                <div class="reserve-container">
                                    <div class="reserve-grid">
                                        <button
                                            class="reserve-btn t4"
                                            class:active={reserveSelection.tier === 't4' &&
                                                reserveSelection.size === 20000}
                                            on:click={() => setReserveSelection('t4', 20000)}
                                        >
                                            <div class="reserve-icon-wrapper">
                                                <img
                                                    src={images['20k_reserve.webp']}
                                                    alt="20k"
                                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                                />
                                                <div class="reserve-badge t4">T4</div>
                                            </div>
                                            <span>20k</span>
                                        </button>

                                        <button
                                            class="reserve-btn t4"
                                            class:active={reserveSelection.tier === 't4' &&
                                                reserveSelection.size === 50000}
                                            on:click={() => setReserveSelection('t4', 50000)}
                                        >
                                            <div class="reserve-icon-wrapper">
                                                <img
                                                    src={images['50k_reserve.webp']}
                                                    alt="50k"
                                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                                />
                                                <div class="reserve-badge t4">T4</div>
                                            </div>
                                            <span>50k</span>
                                        </button>

                                        <button
                                            class="reserve-btn t5"
                                            class:active={reserveSelection.tier === 't5' &&
                                                reserveSelection.size === 20000}
                                            on:click={() => setReserveSelection('t5', 20000)}
                                        >
                                            <div class="reserve-icon-wrapper">
                                                <img
                                                    src={images['20k_reserve.webp']}
                                                    alt="20k"
                                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                                />
                                                <div class="reserve-badge t5">T5</div>
                                            </div>
                                            <span>20k</span>
                                        </button>

                                        <button
                                            class="reserve-btn t5"
                                            class:active={reserveSelection.tier === 't5' &&
                                                reserveSelection.size === 50000}
                                            on:click={() => setReserveSelection('t5', 50000)}
                                        >
                                            <div class="reserve-icon-wrapper">
                                                <img
                                                    src={images['50k_reserve.webp']}
                                                    alt="50k"
                                                    on:error={(e) => (e.target.src = images['training_speedup.webp'])}
                                                />
                                                <div class="reserve-badge t5">T5</div>
                                            </div>
                                            <span>50k</span>
                                        </button>
                                    </div>

                                    <div class="date-trigger">
                                        <label for="kvk-date">Training Stage Date (00:00 UTC)</label>
                                        <button
                                            class="input-fake-wrapper"
                                            type="button"
                                            on:click={openDatePicker}
                                            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openDatePicker()}
                                            aria-label="Open date picker"
                                        >
                                            <input
                                                type="date"
                                                id="kvk-date"
                                                bind:value={reserveTargetDate}
                                                bind:this={dateInputRef}
                                            />
                                            <i class="fas fa-calendar-alt calendar-icon"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === 'speedups'}
                    <div class="form-group fade-in-panel">
                        <span class="label-text">Total Speedups Available</span>
                        <div class="time-input-row">
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.d}
                                    on:input={(e) => handleSpeedupInput(e, 'd')}
                                /><span>Days</span>
                            </div>
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.h}
                                    on:input={(e) => handleSpeedupInput(e, 'h')}
                                /><span>Hours</span>
                            </div>
                            <div class="time-input-group">
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={speedupTime.m}
                                    on:input={(e) => handleSpeedupInput(e, 'm')}
                                /><span>Mins</span>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === 'mge'}
                    <div class="form-group fade-in-panel">
                        <span class="label-text">Desired Training Stage MGE Points</span>
                        <div class="mge-input-row">
                            <input
                                type="text"
                                class="standalone-input"
                                placeholder="Example: 50,000,000"
                                value={targetMgePoints}
                                on:input={(e) => handleSingleInput(e, (v) => (targetMgePoints = v))}
                            />
                            <span class="mge-text-label">points</span>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}

        <div
            class="calc-result"
            class:result-success={hasResult && resultAnimationTrigger}
            class:has-value={hasResult}
            style="flex-direction: column; gap: 10px; padding: 20px; justify-content: center;"
        >
            {#if hasResult}
                {#if activeTab === 'prekvk'}
                    {#if reserveResultStr}
                        <div style="text-align: center; margin-bottom: 10px; line-height: 1.4;">
                            <span style="color: white; font-size: 1rem;"
                                ><img
                                    src={images['reserve_icon.webp']}
                                    alt=""
                                    style="height: 36px; vertical-align: middle; margin-right: 8px;"
                                />{@html reserveResultStr}</span
                            >
                        </div>
                    {/if}

                    {#if totalPreKvkPoints > 0}
                        {#if reserveResultStr}<div class="result-divider"></div>{/if}
                        <div class="stats-row">
                            <div class="stat-item">
                                <img
                                    src={images['prekvk_icon.webp']}
                                    alt="Pre-KvK"
                                    on:error={(e) => (e.target.src = images['power_icon.webp'])}
                                />
                                <div class="stat-info">
                                    <span class="stat-label">Pre-KvK Points</span>
                                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                                        >{totalPreKvkPoints.toLocaleString()}</span
                                    >
                                </div>
                            </div>
                            <div class="stat-item">
                                <img src={images['troop_t5.webp']} alt="Troops" />
                                <div class="stat-info">
                                    <span class="stat-label">Total Troops</span>
                                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                                        >{maxTroops.toLocaleString()}</span
                                    >
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                            ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
                            Upgrades)
                        </div>
                    {/if}
                {:else if activeTab === 'troops'}
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
                    <div
                        class="cost-line"
                        style="font-size: 1.2rem; margin-bottom: 5px; flex-direction: column; align-items: center; gap: 2px;"
                    >
                        {#if activeTab === 'mge'}
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <img src={images['training_speedup.webp']} alt="Clock" style="height: 32px;" />
                                <span
                                    >Requires: <strong style="color: var(--accent-blue-bright);">{resultTime}</strong
                                    ></span
                                >
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
                                Upgrades)
                            </div>
                        {/if}
                    </div>

                    {#if activeTab !== 'mge'}
                        <div class="cost-line" style="font-size: 1.1rem;">
                            <img
                                src={images[
                                    mixRatio.t5 > 0 || mixRatio.upgrade > 0 ? 'troop_t5.webp' : 'troop_t4.webp'
                                ]}
                                alt="Troop"
                                style="height: 28px; margin-right: 8px;"
                            />
                            <span
                                >Total Troops: <strong style="color: var(--accent-blue-bright);"
                                    >{maxTroops.toLocaleString()}</strong
                                ></span
                            >
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: -5px;">
                            ({troopBreakdown.t4.toLocaleString()} T4 / {troopBreakdown.t5.toLocaleString()} T5 / {troopBreakdown.upgrade.toLocaleString()}
                            Upgrades)
                        </div>
                    {/if}

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
                            {#if activeTab === 'mge'}
                                <img src={images['troop_t5.webp']} alt="Troops" />
                                <div class="stat-info">
                                    <span class="stat-label">Total Troops</span>
                                    <span class="stat-value" style="color: var(--accent-blue-bright);"
                                        >{maxTroops.toLocaleString()}</span
                                    >
                                </div>
                            {:else}
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
                            {/if}
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
    .label-text {
        display: block;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-2);
    }
    .generator-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: var(--spacing-4);
    }
    .generator-tab-btn {
        flex: 1;
        padding: var(--spacing-3) 4px;
        cursor: pointer;
        background: none;
        border: none;
        color: var(--text-secondary);
        font-weight: 600;
        position: relative;
        transition: color 0.2s ease;
        font-size: 0.95rem;
        white-space: nowrap;
    }
    .generator-tab-btn:hover {
        color: var(--text-primary);
    }
    .generator-tab-btn.active {
        color: var(--accent-blue);
    }
    .generator-tab-btn.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-blue);
    }

    .time-input-row {
        display: flex;
        gap: 10px;
    }
    .time-input-group {
        flex: 1;
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        overflow: hidden;
    }
    .time-input-group input {
        flex: 1;
        border: none;
        background: transparent;
        text-align: center;
        padding: 8px;
        font-size: 1rem;
        color: var(--text-primary);
        min-width: 0;
        border-radius: var(--radius-sm) 0 0 var(--radius-sm) !important;
        -webkit-appearance: none;
        appearance: none;
    }
    .time-input-group span {
        padding: 0 10px;
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        font-size: 0.8rem;
        height: 100%;
        display: flex;
        align-items: center;
        border-left: 1px solid var(--border-hover);
    }

    .dynamic-input-container {
        min-height: 85px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .fade-in-panel {
        animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .result-divider {
        width: 100%;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 10px 0;
    }

    .header-group {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-2);
    }
    .header-group label {
        margin-bottom: 0;
    }
    .tooltip-wrapper {
        position: relative;
    }
    .info-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 4px;
        transition: color 0.2s;
    }
    .info-btn:hover {
        color: var(--accent-blue);
    }
    .tooltip-container {
        position: absolute;
        right: 0;
        top: 100%;
        margin-top: 10px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        padding: 15px;
        border-radius: var(--radius-md);
        width: 300px;
        z-index: 200;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    .tooltip-container h4 {
        margin: 0 0 10px 0;
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    .tooltip-container p {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin: 5px 0;
    }
    .tooltip-img {
        width: 100%;
        border-radius: 4px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .tooltip-img.square {
        aspect-ratio: 1/1;
        object-fit: cover;
    }
    .tooltip-img.wide {
        height: auto;
    }

    .form-group.collapse-group {
        margin-bottom: 12px !important;
    }
    .label-with-toggle {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
        padding-bottom: 5px;
    }
    .collapsible-content {
        max-height: 0;
        overflow: hidden;
        transition:
            max-height 0.4s ease-in-out,
            opacity 0.4s ease-in-out;
        opacity: 0;
    }
    .collapsible-content.is-open {
        max-height: 500px;
        opacity: 1;
    }

    .calc-result {
        min-height: 140px;
        position: relative;
    }

    .mge-input-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .standalone-input {
        flex: 1;
        border: 1px solid var(--border-hover);
        background: var(--bg-primary);
        border-radius: var(--radius-sm);
        padding: 8px;
        font-size: 1rem;
        color: var(--text-primary);
        text-align: center;
    }
    .standalone-input:focus {
        border-color: var(--accent-blue);
        outline: none;
    }
    .mge-text-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
    }

    .toggle-switch {
        width: 36px;
        height: 20px;
    }
    .toggle-slider {
        border-radius: 20px;
    }
    .toggle-slider:before {
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 2px;
    }
    .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(16px);
    }

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

    .reserve-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-top: 5px;
        background: var(--bg-card);
        padding: 10px;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
    }

    .reserve-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
    }

    .reserve-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        padding: 8px 4px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
    }

    .reserve-btn:hover {
        border-color: var(--text-secondary);
        transform: translateY(-2px);
    }

    .reserve-icon-wrapper {
        position: relative;
    }
    .reserve-icon-wrapper img {
        height: 32px;
        width: auto;
    }

    .reserve-badge {
        position: absolute;
        bottom: -2px;
        right: -5px;
        font-size: 9px;
        font-weight: 700;
        padding: 1px 3px;
        border-radius: 3px;
        color: white;
        text-shadow: 0 1px 2px black;
    }
    .reserve-badge.t4 {
        background: #ca62e6;
    }
    .reserve-badge.t5 {
        background: #f28d00;
    }

    .reserve-btn span {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 500;
        z-index: 1;
    }

    .reserve-btn.t4.active {
        border-color: #ca62e6;
        background-image: radial-gradient(circle at center, rgba(202, 98, 230, 0.2) 0%, rgba(129, 19, 167, 0.4) 100%);
    }
    .reserve-btn.t4.active span {
        color: white;
    }

    .reserve-btn.t5.active {
        border-color: #f28d00;
        background-image: radial-gradient(circle at center, rgba(242, 141, 0, 0.2) 0%, rgba(213, 88, 0, 0.4) 100%);
    }
    .reserve-btn.t5.active span {
        color: white;
    }

    .date-trigger {
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .date-trigger label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        cursor: pointer;
    }
    .input-fake-wrapper {
        position: relative;
        width: 100%;
    }
    .input-fake-wrapper input {
        width: 100%;
        padding: 10px;
        background: var(--bg-primary);
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        cursor: pointer;
    }
    .input-fake-wrapper .calendar-icon {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary);
        pointer-events: none;
    }

    @media (max-width: 600px) {
        .reserve-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
