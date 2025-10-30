document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate-btn');
    const allInputs = document.querySelectorAll('.material-input');
    const resultDiv = document.getElementById('materials-result');
    const loadoutSlots = document.querySelectorAll('.loadout-slot');
    const modal = document.getElementById('equipment-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalGrid = document.getElementById('modal-grid');
    const modalTitle = document.getElementById('modal-title');
    const modalSearch = document.getElementById('modal-search');
    const selectedItemsList = document.getElementById('selected-items-list');
    const clearShoppingListBtn = document.getElementById('clear-shopping-list-btn');

    const selectorSearch = document.getElementById('selector-search');
    const selectorFilterToggleBtn = document.getElementById('selector-filter-toggle-btn');
    const selectorFilterPanel = document.getElementById('selector-filter-panel');
    const equipmentSelectorGrid = document.getElementById('equipment-selector-grid');

    let EQUIPMENT_DATA = [];

    const MATERIALS = ['iron', 'leather', 'ebony', 'bone'];
    const CHEST_MATERIAL = 'chest';
    const RARITIES = ['common', 'advanced', 'elite', 'epic', 'legendary'];
    const RARITIES_ORDERED = ['Normal', 'Advanced', 'Elite', 'Epic', 'Legendary'];


    const SLOT_PLACEHOLDERS = {
        helmet: '/images/materials/helmet_slot.webp',
        weapon: '/images/materials/weapon_slot.webp',
        chest: '/images/materials/chest_slot.webp',
        gloves: '/images/materials/glove_slot.webp',
        legs: '/images/materials/leggings_slot.webp',
        boots: '/images/materials/boots_slot.webp',
        accessory1: '/images/materials/accessory1_slot.webp',
        accessory2: '/images/materials/accessory2_slot.webp'
    };

    const RARITY_MULTIPLIERS = { common: 1, advanced: 4, elite: 16, epic: 64, legendary: 256 };

    let craftingList = {};
    let selectedLoadoutSlots = { helmet: null, chest: null, weapon: null, gloves: null, legs: null, boots: null, accessory1: null, accessory2: null };
    let activeSlotId = null;

    const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                callback.apply(null, args);
            }, wait);
        };
    };

    const getMaterialIconPath = (mat, rarity = 'legendary') => {
        const iconName = mat === 'iron' ? 'ore' : mat;
        let rarityName = (rarity || 'legendary').toLowerCase();
        if (!RARITIES.includes(rarityName)) {
            rarityName = 'legendary';
        }
        return `/images/materials/${iconName}_${rarityName}.webp`;
    };
    
    const formatStatName = (key) => {
        return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };
    
    const getTroopTypeFromStat = (statKey) => {
        if (statKey.startsWith('cavalry')) return 'cavalry';
        if (statKey.startsWith('infantry')) return 'infantry';
        if (statKey.startsWith('archer')) return 'archer';
        if (statKey.startsWith('siege')) return 'siege';
        return 'general';
    }

    function getHighestSelectedRarity() {
        let highestRarityIndex = -1;
        for (const itemId in craftingList) {
            if (craftingList[itemId] > 0) {
                const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                if (itemData) {
                    const currentIndex = RARITIES_ORDERED.indexOf(itemData.quality);
                    if (currentIndex > highestRarityIndex) {
                        highestRarityIndex = currentIndex;
                    }
                }
            }
        }
        return highestRarityIndex > -1 ? RARITIES_ORDERED[highestRarityIndex] : null;
    }

    function performCalculation() {
        // All calculations are done in "common" equivalents
        const playerMaterialsCommon = {};
        MATERIALS.forEach(mat => playerMaterialsCommon[mat] = calculateTotalForMaterial(mat));
        const playerChestsCommon = calculateTotalForMaterial(CHEST_MATERIAL);

        const totalCostCommon = { iron: 0, leather: 0, ebony: 0, bone: 0 };
        let totalGoldCost = 0;
        let equipmentIsSelected = Object.values(craftingList).some(qty => qty > 0);

        for (const itemId in craftingList) {
            const quantity = craftingList[itemId];
            if (quantity > 0) {
                const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                if (itemData && itemData.cost) {
                    const multiplier = RARITY_MULTIPLIERS[(itemData.quality || 'Normal').toLowerCase()];
                    for (const mat in itemData.cost) {
                        totalCostCommon[mat] += itemData.cost[mat] * quantity * multiplier;
                    }
                    totalGoldCost += (itemData.gold_cost || 0) * quantity;
                }
            }
        }

        // Determine the rarity to display results in
        let displayRarity = 'Legendary';
        const highestRarity = getHighestSelectedRarity();
        if (highestRarity) {
            displayRarity = highestRarity;
        } else {
            // Special case: no equipment selected, default to Legendary unless amounts are fractional
            const legendaryDivisor = RARITY_MULTIPLIERS.legendary;
            const hasFractionalLegendary = MATERIALS.some(mat => (playerMaterialsCommon[mat] > 0 && playerMaterialsCommon[mat] < legendaryDivisor));
            if (hasFractionalLegendary) {
                displayRarity = 'Epic';
            }
        }

        const materialsAreInput = Object.values(playerMaterialsCommon).some(val => val > 0) || playerChestsCommon > 0;

        if (materialsAreInput && !equipmentIsSelected) {
            displayMaterialTotals(playerMaterialsCommon, playerChestsCommon, displayRarity);
        } else if (!materialsAreInput && equipmentIsSelected) {
            displayEquipmentCost(totalCostCommon, totalGoldCost, displayRarity);
        } else if (materialsAreInput && equipmentIsSelected) {
            analyzeAndDisplayCrafting(playerMaterialsCommon, playerChestsCommon, totalCostCommon, totalGoldCost, displayRarity);
        } else {
            resultDiv.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Enter your materials or select equipment to begin.</p>';
            resultDiv.style.display = 'block';
        }
    }

    function calculateTotalForMaterial(material) {
        let commonEquivalent = 0;
        RARITIES.forEach(rarity => {
            const input = document.getElementById(`${material}-${rarity}`);
            if(input && input.value) {
                const count = parseInt(input.value.replace(/,/g, ''), 10) || 0;
                commonEquivalent += count * RARITY_MULTIPLIERS[rarity];
            }
        });
        return commonEquivalent;
    }

    function displayMaterialTotals(playerMaterialsCommon, playerChestsCommon, displayRarity) {
        resultDiv.style.display = 'block';
        const divisor = RARITY_MULTIPLIERS[displayRarity.toLowerCase()];
        const rarityName = formatStatName(displayRarity);

        let html = `<h3 class="result-status">Your Available Materials</h3>`;
        let resultGridItems = '';
        MATERIALS.forEach(mat => {
            const total = Math.floor(playerMaterialsCommon[mat] / divisor);
            if (total > 0) {
                 resultGridItems += `
                    <div class="result-item">
                        <img src="${getMaterialIconPath(mat, displayRarity)}" alt="${mat}">
                        <div class="label">Total ${rarityName}:</div>
                        <span class="value">${total.toLocaleString()}</span>
                    </div>`;
            }
        });

        const totalChests = Math.floor(playerChestsCommon / divisor);
        if (totalChests > 0) {
            resultGridItems += `
                <div class="result-item">
                    <img src="/images/materials/chest_${displayRarity.toLowerCase()}.webp" alt="Chests">
                    <div class="label">Total ${rarityName} Chests:</div>
                    <span class="value">${totalChests.toLocaleString()}</span>
                </div>`;
        }
        if (!resultGridItems) resultGridItems = `<p style="grid-column: 1 / -1; color: var(--text-secondary);">No materials entered.</p>`;
        html += `<div class="result-grid">${resultGridItems}</div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }

    function displayEquipmentCost(totalCostCommon, totalGoldCost, displayRarity) {
        resultDiv.style.display = 'block';
        const divisor = RARITY_MULTIPLIERS[displayRarity.toLowerCase()];
        const rarityName = formatStatName(displayRarity);
        const rarityClass = `text-${displayRarity.toLowerCase()}`;

        let html = `<h3 class="result-status">Selected Equipment Cost</h3>`;
        let resultGridItems = '';
        MATERIALS.forEach(mat => {
            const total = Math.ceil(totalCostCommon[mat] / divisor);
            if (total > 0) {
                 resultGridItems += `
                    <div class="result-item">
                        <img src="${getMaterialIconPath(mat, displayRarity)}" alt="${mat}">
                        <div class="label">Total ${rarityName} Needed:</div>
                        <span class="value ${rarityClass}">${total.toLocaleString()}</span>
                    </div>`;
            }
        });
         if (totalGoldCost > 0) {
            resultGridItems += `
                <div class="result-item">
                    <img src="/images/materials/gold_icon.webp" alt="Gold">
                    <div class="label">Total Gold:</div>
                    <span class="value">${totalGoldCost.toLocaleString()}</span>
                </div>`;
        }
        if (!resultGridItems) resultGridItems = `<p style="grid-column: 1 / -1; color: var(--text-secondary);">No equipment selected.</p>`;
        html += `<div class="result-grid">${resultGridItems}</div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }

    function analyzeAndDisplayCrafting(playerMaterialsCommon, playerChestsCommon, totalCostCommon, totalGoldCost, displayRarity) {
        const divisor = RARITY_MULTIPLIERS[displayRarity.toLowerCase()];
        const rarityName = formatStatName(displayRarity);
        const rarityClass = displayRarity === 'Normal' ? 'text-normal' : `text-gradient text-${displayRarity.toLowerCase()}`;

        let neededFromChestsCommon = 0;
        let totalMaterialOwnedCommon = 0;
        let totalMaterialCostCommon = 0;
    
        MATERIALS.forEach(mat => {
            const deficit = totalCostCommon[mat] - playerMaterialsCommon[mat];
            if (deficit > 0) neededFromChestsCommon += deficit;
            totalMaterialCostCommon += totalCostCommon[mat];
            totalMaterialOwnedCommon += playerMaterialsCommon[mat];
        });
    
        const totalOwnedWithChestsCommon = totalMaterialOwnedCommon + playerChestsCommon;
        const canCraft = neededFromChestsCommon <= playerChestsCommon;
        
        resultDiv.style.display = 'block';
        let html = canCraft 
            ? `<h3 class="result-status craftable"><i class="fas fa-check-circle"></i> Loadout is Craftable</h3>`
            : `<h3 class="result-status not-craftable"><i class="fas fa-times-circle"></i> Insufficient Materials</h3>`;
    
        let materialItemsHtml = '';
        MATERIALS.forEach(mat => {
            const have = Math.floor(playerMaterialsCommon[mat] / divisor);
            const needed = Math.ceil(totalCostCommon[mat] / divisor);
            if (have === 0 && needed === 0) return;

            const totalAfterCraft = playerMaterialsCommon[mat] - totalCostCommon[mat];
            const leftover = totalAfterCraft > 0 ? Math.floor(totalAfterCraft / divisor) : 0;
            const shortBy = totalAfterCraft < 0 ? Math.ceil(Math.abs(totalAfterCraft) / divisor) : 0;
    
            materialItemsHtml += `
                <div class="result-item">
                    <img src="${getMaterialIconPath(mat, displayRarity)}" alt="${mat}">
                    <div class="label">Your total: <span class="value">${have.toLocaleString()}</span></div>
                    <div class="label">Needed: <span class="value ${rarityClass}">${needed.toLocaleString()}</span></div>
                    <div class="label">Leftover: <span class="value surplus">${leftover.toLocaleString()}</span></div>
                    ${shortBy > 0 ? `<div class="label">Short by: <span class="value shortage">${shortBy.toLocaleString()}</span></div>` : ''}
                </div>`;
        });
        
        const leftoverChests = Math.floor((playerChestsCommon - neededFromChestsCommon) / divisor);
        
        const neededChests = Math.ceil(neededFromChestsCommon / divisor);
        const haveChests = Math.floor(playerChestsCommon / divisor);

        if (haveChests > 0 || neededChests > 0) {
            materialItemsHtml += `
                <div class="result-item">
                    <img src="/images/materials/chest_${displayRarity.toLowerCase()}.webp" alt="Chests">
                    <div class="label">Your total: <span class="value">${haveChests.toLocaleString()}</span></div>
                    <div class="label">Needed: <span class="value ${rarityClass}">${neededChests.toLocaleString()}</span></div>
                    <div class="label">Leftover: <span class="value ${leftoverChests < 0 ? 'shortage' : 'surplus'}">${Math.max(0, leftoverChests).toLocaleString()}</span></div>
                    ${leftoverChests < 0 ? `<div class="label">Short by: <span class="value shortage">${Math.abs(leftoverChests).toLocaleString()}</span></div>` : ''}
                </div>
            `;
        }

        const totalMatCostDisplay = Math.ceil(totalMaterialCostCommon / divisor);
        const totalMatOwnedDisplay = Math.floor(totalOwnedWithChestsCommon / divisor);
    
        let summaryHtml = `
            <div class="summary-items">
                <div class="result-item">
                    <img src="/images/materials/materials_icon.webp" alt="Total Materials">
                    <div class="label">Total ${rarityName} Mats Needed:</div>
                    <span class="value">${totalMatCostDisplay.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <img src="/images/materials/materials_icon.webp" alt="Total Materials">
                    <div class="label">Total ${rarityName} Mats Owned:</div>
                    <span class="value">${totalMatOwnedDisplay.toLocaleString()}</span>
                </div>
                ${totalGoldCost > 0 ? `
                <div class="result-item">
                    <img src="/images/materials/gold_icon.webp" alt="Gold">
                    <div class="label">Total Gold Cost:</div>
                    <span class="value">${totalGoldCost.toLocaleString()}</span>
                </div>` : ''}
            </div>
        `;

        html += `<div class="result-layout">
                    <div class="material-items-grid">${materialItemsHtml}</div>
                    <div class="result-separator"></div>
                    ${summaryHtml}
                 </div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }

    function populateModalGrid(slotType, searchTerm = '') {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        const filteredItems = EQUIPMENT_DATA.filter(item => {
            const slotMatch = item.slot === slotType;
            const nameMatch = !searchTerm || item.name.toLowerCase().includes(lowerCaseSearchTerm);
            return slotMatch && nameMatch;
        });

        const html = filteredItems.map(item => `
            <div class="modal-item" data-item-id="${item.id}">
                <img src="/images/materials/equipment/${item.image}" alt="${item.name}">
                <span class="item-name ${item.quality}">${item.name}</span>
            </div>`
        ).join('');
        
        modalGrid.innerHTML = html;
    }

    function openModalForSlot(slotElement) {
        activeSlotId = slotElement.id;
        const slotType = slotElement.dataset.slot;
        const itemSlotType = (slotType === 'accessory1' || slotType === 'accessory2') ? 'accessory' : slotType;

        modalTitle.textContent = `Select ${formatStatName(slotType)}`;
        modalSearch.value = '';
        
        populateModalGrid(itemSlotType);
        
        modal.style.display = 'flex';
        modalSearch.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        activeSlotId = null;
        modalGrid.innerHTML = '';
    }

    function selectItem(itemId) {
        const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
        if (!itemData || !activeSlotId) return;
    
        const slotElement = document.getElementById(activeSlotId);
        if (!slotElement) return;
    
        const slotKey = activeSlotId.replace('slot-', '');
        
        const oldItemId = selectedLoadoutSlots[slotKey];
        if (oldItemId) {
            craftingList[oldItemId] = (craftingList[oldItemId] || 1) - 1;
            if (craftingList[oldItemId] <= 0) {
                delete craftingList[oldItemId];
            }
        }

        craftingList[itemId] = (craftingList[itemId] || 0) + 1;
        selectedLoadoutSlots[slotKey] = itemId;
        
        slotElement.innerHTML = `<img src="/images/materials/equipment/${itemData.image}" alt="${itemData.name}">`;
        
        closeModal();
        updateUIDisplays();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function addItemFromSelector(itemId) {
        craftingList[itemId] = (craftingList[itemId] || 0) + 1;
        updateUIDisplays();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function removeItem(itemId) {
        if (!craftingList[itemId]) return;
        craftingList[itemId]--;
        if (craftingList[itemId] <= 0) {
            delete craftingList[itemId];
        }

        for (const slotKey in selectedLoadoutSlots) {
            if (selectedLoadoutSlots[slotKey] === itemId) {
                selectedLoadoutSlots[slotKey] = null;
                const slotElement = document.getElementById(`slot-${slotKey}`);
                if (slotElement) {
                    slotElement.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${slotKey} Slot">`;
                }
                break; 
            }
        }

        updateUIDisplays();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function clearAllSelections() {
        craftingList = {};
        selectedLoadoutSlots = { helmet: null, chest: null, weapon: null, gloves: null, legs: null, boots: null, accessory1: null, accessory2: null };

        loadoutSlots.forEach(slot => {
            const slotKey = slot.dataset.slot;
            if (SLOT_PLACEHOLDERS[slotKey]) {
                slot.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${slotKey} Slot">`;
            }
        });
        
        updateUIDisplays();
        
        if (calculateBtn.style.display === 'none') {
            performCalculation();
        }
    }
    
    function updateSelectedItemsDisplay() {
        selectedItemsList.innerHTML = '';
        const hasSelection = Object.values(craftingList).some(qty => qty > 0);

        if (!hasSelection) {
            selectedItemsList.innerHTML = '<p class="no-items-placeholder" style="text-align: center; color: var(--text-secondary); padding: var(--spacing-4) 0;">No items selected.</p>';
            return;
        }

        for (const itemId in craftingList) {
            const quantity = craftingList[itemId];
            if (quantity <= 0) continue;

            const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
            if (itemData) {
                let costHtml = '<div class="selected-item-cost">';
                if (itemData.cost) {
                    const costs = Object.entries(itemData.cost).filter(([, amount]) => amount > 0);
                    if (costs.length > 0) {
                        costs.forEach(([mat, amount]) => {
                            let qualityClass = '';
                            const quality = itemData.quality || 'Normal';
                            if (quality !== 'Normal') {
                                qualityClass = `text-gradient text-${quality.toLowerCase()}`;
                            } else {
                                qualityClass = 'text-normal';
                            }
                             costHtml += `
                                <div class="cost-pair">
                                    <img src="${getMaterialIconPath(mat, itemData.quality)}" alt="${mat}">
                                    <span class="${qualityClass}">${amount}</span>
                                </div>`;
                        });
                    }
                }
                costHtml += '</div>';

                let statsHtml = '<div class="selected-item-stats">';
                if (itemData.stats) {
                    Object.entries(itemData.stats).forEach(([statKey, statValue]) => {
                        if (statValue > 0) {
                            const troopType = getTroopTypeFromStat(statKey);
                            statsHtml += `<div class="stat-pair ${troopType}">${formatStatName(statKey)} <span>+${statValue}%</span></div>`;
                        }
                    });
                }
                if (itemData.special_stats && itemData.special_stats.length > 0) {
                     itemData.special_stats.forEach(stat => {
                        statsHtml += `<div class="special-stat">${stat}</div>`;
                    });
                }
                statsHtml += '</div>';


                const itemEl = document.createElement('div');
                itemEl.className = 'selected-item';
                itemEl.innerHTML = `
                    <img src="/images/materials/equipment/${itemData.image}" alt="${itemData.name}" class="selected-item-icon">
                    <div class="selected-item-details">
                        <div class="selected-item-header">
                           <span class="item-name ${itemData.quality}">${itemData.name}</span>
                           ${quantity > 1 ? `<span class="item-quantity">x${quantity}</span>` : ''}
                        </div>
                        ${costHtml}
                        ${statsHtml}
                    </div>
                    <button class="remove-item-btn" data-item-id="${itemId}">&times;</button>`;
                selectedItemsList.appendChild(itemEl);
            }
        }
        
        selectedItemsList.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeItem(e.currentTarget.dataset.itemId));
        });
    }

    function calculateAndDisplayTotalStats() {
        const container = document.getElementById('total-stats-container');
        if (!container) return;
    
        const totalStats = {};
        const specialStats = new Set();
    
        for (const slotKey in selectedLoadoutSlots) {
            const itemId = selectedLoadoutSlots[slotKey];
            if (itemId) {
                const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                if (itemData) {
                    if (itemData.stats) {
                        for (const stat in itemData.stats) {
                            totalStats[stat] = (totalStats[stat] || 0) + itemData.stats[stat];
                        }
                    }
                    if (itemData.special_stats) {
                        itemData.special_stats.forEach(stat => specialStats.add(stat));
                    }
                }
            }
        }
    
        const groupedStats = {
            infantry: { total: 0, stats: {} },
            cavalry: { total: 0, stats: {} },
            archer: { total: 0, stats: {} },
            siege: { total: 0, stats: {} }
        };
    
        for (const stat in totalStats) {
            if (totalStats[stat] > 0) {
                const troopType = getTroopTypeFromStat(stat);
                if (groupedStats[troopType]) {
                    groupedStats[troopType].stats[stat] = totalStats[stat];
                    groupedStats[troopType].total += totalStats[stat];
                }
            }
        }
    
        const sortedTroopTypes = Object.keys(groupedStats).sort((a, b) => groupedStats[b].total - groupedStats[a].total);
    
        let html = '';
    
        sortedTroopTypes.forEach(troopType => {
            if (groupedStats[troopType].total > 0) {
                html += `<div class="stats-group">`;
                html += `<h5 class="stat-${troopType}">${formatStatName(troopType)}</h5>`;
                for (const stat in groupedStats[troopType].stats) {
                    html += `<div class="stat-pair ${troopType}">
                                ${formatStatName(stat)} <span>+${groupedStats[troopType].stats[stat].toFixed(1).replace('.0', '')}%</span>
                             </div>`;
                }
                html += `</div>`;
            }
        });
    
        if (specialStats.size > 0) {
            html += `<div class="stats-group"><h5 class="legendary-text">Extra Bonuses</h5>`;
            specialStats.forEach(stat => {
                html += `<div class="special-stat">${stat}</div>`;
            });
            html += `</div>`;
        }
    
        if (!html) {
            html = '<p class="no-items-placeholder" style="text-align: center; color: var(--text-secondary);">No loadout items selected.</p>';
        }
    
        container.innerHTML = html;
    }
    
    function updateUIDisplays() {
        updateSelectedItemsDisplay();
        calculateAndDisplayTotalStats();
    }
    
    function getActiveFilters(panel) {
        const active = {};
        panel.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
            const category = input.dataset.category;
            if (!active[category]) active[category] = [];
            active[category].push(input.value);
        });
        return active;
    }

    function filterItems(grid, filterPanel, searchTerm) {
        const activeFilters = getActiveFilters(filterPanel);
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        grid.querySelectorAll('.selector-item').forEach(item => {
            const itemData = EQUIPMENT_DATA.find(d => d.id === item.dataset.itemId);
            if (!itemData) {
                item.classList.add('hidden');
                return;
            }

            const nameMatch = itemData.name.toLowerCase().includes(lowerCaseSearchTerm);
            const slotMatch = !activeFilters.slot || activeFilters.slot.length === 0 || activeFilters.slot.includes(itemData.slot);
            const qualityMatch = !activeFilters.quality || activeFilters.quality.length === 0 || activeFilters.quality.includes(itemData.quality);
            const statsMatch = !activeFilters.stats || activeFilters.stats.length === 0 || 
                activeFilters.stats.some(statFilter =>
                    itemData.stats && Object.keys(itemData.stats).some(statKey => getTroopTypeFromStat(statKey) === statFilter && itemData.stats[statKey] > 0)
                );
            
            const isVisible = nameMatch && slotMatch && qualityMatch && statsMatch;
            item.classList.toggle('hidden', !isVisible);
        });
    }

    function populateFilters(panel) {
        const categories = {
            'Equipment Slot': {
                type: 'slot',
                options: ['weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory']
            },
            'Rarity': {
                type: 'quality',
                options: ['Legendary', 'Epic', 'Elite', 'Advanced', 'Normal']
            },
            'Troop Type Stats': {
                type: 'stats',
                options: ['infantry', 'cavalry', 'archer', 'siege']
            }
        };

        let html = `
            <div class="filter-panel-header">
                <h4>Filter Items</h4>
                <button class="btn-secondary filter-reset-btn">Reset</button>
            </div>
            <div class="filter-options">`;
        
        for(const title in categories) {
            const category = categories[title];
            html += `<div class="filter-category"><h5>${title}</h5>`;
            html += '<div class="filter-category-grid">';
            category.options.forEach(opt => {
                const className = category.type === 'stats' ? `stat-${opt}` : '';
                html += `<label class="filter-option ${className}">
                           <input type="checkbox" data-category="${category.type}" value="${opt}"> ${formatStatName(opt)}
                         </label>`;
            });
            html += `</div></div>`;
        }

        html += `</div>`;
        panel.innerHTML = html;
    }

    function setupFilterFunctionality(grid, toggleBtn, panel, searchInput) {
        populateFilters(panel);
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('visible');
        });

        const debouncedFilter = debounce(() => filterItems(grid, panel, searchInput.value), 250);

        panel.addEventListener('change', () => filterItems(grid, panel, searchInput.value));
        panel.querySelector('.filter-reset-btn').addEventListener('click', () => {
            panel.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
            filterItems(grid, panel, searchInput.value);
        });
        searchInput.addEventListener('input', debouncedFilter);
    }


    function initializeEquipmentSelector() {
        if (!equipmentSelectorGrid || EQUIPMENT_DATA.length === 0) { return; }
        
        let html = '';
        EQUIPMENT_DATA.forEach(item => {
            html += `
                <div class="selector-item" data-item-id="${item.id}" title="Add ${item.name}">
                    <img src="/images/materials/equipment/${item.image}" alt="${item.name}">
                    <span class="item-name ${item.quality}">${item.name}</span>
                </div>`;
        });
        equipmentSelectorGrid.innerHTML = html;

        equipmentSelectorGrid.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.selector-item');
            if (itemElement) {
                addItemFromSelector(itemElement.dataset.itemId);
            }
        });

        setupFilterFunctionality(equipmentSelectorGrid, selectorFilterToggleBtn, selectorFilterPanel, selectorSearch);
    }
    
    modalGrid.addEventListener('click', (e) => {
        const itemElement = e.target.closest('.modal-item');
        if (itemElement) {
            selectItem(itemElement.dataset.itemId);
        }
    });

    allInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/,/g, '');
            if (!isNaN(value) && value.length > 0) {
                e.target.value = parseInt(value, 10).toLocaleString('en-US');
            }
        });
    });

    calculateBtn.addEventListener('click', () => {
        performCalculation();
        allInputs.forEach(input => input.addEventListener('input', performCalculation));
        calculateBtn.style.display = 'none';
    });
    
    function removeItemFromSlot(slotKey) {
        const itemId = selectedLoadoutSlots[slotKey];
        if (!itemId) return;

        if (craftingList[itemId]) {
            craftingList[itemId]--;
            if (craftingList[itemId] <= 0) {
                delete craftingList[itemId];
            }
        }

        selectedLoadoutSlots[slotKey] = null;

        const slotElement = document.getElementById(`slot-${slotKey}`);
        if (slotElement) {
            slotElement.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${slotKey} Slot">`;
        }

        updateUIDisplays();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function handleSlotClick(slotElement) {
        const slotKey = slotElement.dataset.slot;
        if (selectedLoadoutSlots[slotKey]) {
            removeItemFromSlot(slotKey);
        } else {
            openModalForSlot(slotElement);
        }
    }

    loadoutSlots.forEach(slot => slot.addEventListener('click', () => handleSlotClick(slot)));
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    if (clearShoppingListBtn) {
        clearShoppingListBtn.addEventListener('click', clearAllSelections);
    }

    const debouncedModalSearch = debounce(() => {
        const slotType = document.getElementById(activeSlotId)?.dataset.slot;
        if (slotType) {
            const itemSlotType = (slotType === 'accessory1' || slotType === 'accessory2') ? 'accessory' : slotType;
            populateModalGrid(itemSlotType, modalSearch.value);
        }
    }, 250);
    modalSearch.addEventListener('input', debouncedModalSearch);


    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth;
        element.classList.add('result-success');
    }
    
    document.addEventListener('click', (e) => {
        if (selectorFilterPanel && !selectorFilterPanel.contains(e.target) && !selectorFilterToggleBtn.contains(e.target)) {
            selectorFilterPanel.classList.remove('visible');
        }
    });

    function adjustSelectorHeight() {
        const chestIsland = document.getElementById('chest-island');
        const selectorWrapper = document.getElementById('equipment-selector-wrapper');
    
        if (chestIsland && selectorWrapper && window.innerWidth > 1200) {
            const chestBottom = chestIsland.getBoundingClientRect().bottom;
            const selectorTop = selectorWrapper.getBoundingClientRect().top;
            const availableHeight = chestBottom - selectorTop;
    
            if (availableHeight > 200) {
                selectorWrapper.style.height = `${availableHeight}px`;
            } else {
                 selectorWrapper.style.height = 'auto';
            }
        } else if (selectorWrapper) {
            selectorWrapper.style.height = 'auto';
        }
    }

    function adjustLayoutHeights() {
        const loadoutContainer = document.querySelector('.loadout-container');
        const shoppingListIsland = document.getElementById('shopping-list-island');

        if (loadoutContainer && shoppingListIsland) {
            if (window.innerWidth > 1200) {
                const loadoutHeight = loadoutContainer.offsetHeight;
                shoppingListIsland.style.height = `${loadoutHeight}px`;
            } else {
                shoppingListIsland.style.height = 'auto';
            }
        }
    }
    
    window.addEventListener('resize', debounce(() => {
        adjustLayoutHeights();
        adjustSelectorHeight();
    }, 150));

    async function initializeCalculator() {
        try {
            const response = await fetch('equipment.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            EQUIPMENT_DATA = await response.json();
            
            initializeEquipmentSelector();

            setTimeout(() => {
                adjustLayoutHeights();
                adjustSelectorHeight();
            }, 150);

        } catch (error) {
            console.error("Could not initialize calculator:", error);
            if(equipmentSelectorGrid) {
                equipmentSelectorGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Error: Could not load equipment data.</p>`;
            }
        }
    }

    initializeCalculator();
    updateUIDisplays();
});