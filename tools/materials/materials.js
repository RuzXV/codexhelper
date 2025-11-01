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

    const screenshotBtn = document.getElementById('screenshot-btn');
    const screenshotModal = document.getElementById('screenshot-modal');
    const screenshotModalCloseBtn = document.getElementById('screenshot-modal-close-btn');
    const copyImageBtn = document.getElementById('copy-image-btn');
    const downloadImageBtn = document.getElementById('download-image-btn');
    const screenshotCaptureArea = document.getElementById('screenshot-capture-area');
    const screenshotLoadoutGrid = document.getElementById('screenshot-loadout-grid');
    const screenshotShoppingList = document.getElementById('screenshot-shopping-list');
    const screenshotTotalStats = document.getElementById('screenshot-total-stats');
    const screenshotTotalCost = document.getElementById('screenshot-total-cost');
    const screenshotViewToggle = document.getElementById('screenshot-view-toggle');
    const screenshotToggleLabel = document.getElementById('screenshot-toggle-label');
    const screenshotTotalStatsWrapper = document.querySelector('.screenshot-total-stats-wrapper');
    const screenshotTotalCostWrapper = document.querySelector('.screenshot-total-cost-wrapper');

    const customAlertModal = document.getElementById('custom-alert-modal');
    const customAlertCloseBtn = document.getElementById('custom-alert-close-btn');
    const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');
    const customAlertMessage = document.getElementById('custom-alert-message');

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

    let currentVirtualScrollItems = [];
    let virtualScrollListener = null;

    const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                callback.apply(null, args);
            }, wait);
        };
    };
    
    window.getPreLoginState = function() {
        const state = {};
        let hasInput = false;
    
        document.querySelectorAll('.material-input').forEach(input => {
            state[input.id] = input.value;
            if (input.value) hasInput = true;
        });
        
        state.craftingList = craftingList;
        state.selectedLoadoutSlots = selectedLoadoutSlots;
    
        if (Object.keys(craftingList).length > 0) hasInput = true;
    
        return hasInput ? state : null;
    };

    const MATERIALS_CACHE_KEY = 'materialsCalculatorState';

    const saveCalculatorState = debounce(() => {
        const state = {};
        document.querySelectorAll('.material-input').forEach(input => {
            state[input.id] = input.value;
        });
        
        state.craftingList = craftingList;
        state.selectedLoadoutSlots = selectedLoadoutSlots;
    
        window.saveUserData(MATERIALS_CACHE_KEY, state);
    }, 500);
    
    function loadCalculatorState(stateToLoad = null) {
        const savedState = stateToLoad || window.loadUserData(MATERIALS_CACHE_KEY);
        if (!savedState) return;
    
        document.querySelectorAll('.material-input').forEach(input => {
            if (savedState[input.id]) {
                input.value = savedState[input.id];
            }
        });
        
        if (savedState.craftingList) {
            craftingList = savedState.craftingList;
        }
        
        if (savedState.selectedLoadoutSlots) {
            selectedLoadoutSlots = savedState.selectedLoadoutSlots;
            Object.keys(selectedLoadoutSlots).forEach(slotKey => {
                const itemId = selectedLoadoutSlots[slotKey];
                if (itemId) {
                    const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                    const slotElement = document.getElementById(`slot-${slotKey}`);
                    if (itemData && slotElement) {
                        slotElement.innerHTML = `<img src="/images/materials/equipment/${itemData.image}" alt="${itemData.name}">`;
                    }
                }
            });
        }
        
        updateUIDisplays();
    }

    const getMaterialIconPath = (mat, rarity = 'legendary') => {
        const iconName = mat === 'iron' ? 'ore' : mat;
        let rarityName = (rarity || 'legendary').toLowerCase();
        if (rarityName === 'normal') rarityName = 'common';
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
        if (statKey.startsWith('troop')) return 'troop';
        return 'general';
    }

    function showCustomAlert(message) {
        if (customAlertModal && customAlertMessage) {
            customAlertMessage.textContent = message;
            customAlertModal.style.display = 'flex';
        }
    }

    function closeCustomAlert() {
        if (customAlertModal) {
            customAlertModal.style.display = 'none';
        }
    }
    
    if (customAlertModal) {
        customAlertModal.addEventListener('click', (e) => {
            if (e.target === customAlertModal) {
                closeCustomAlert();
            }
        });
    }
    if (customAlertCloseBtn) {
        customAlertCloseBtn.addEventListener('click', closeCustomAlert);
    }
    if (customAlertOkBtn) {
        customAlertOkBtn.addEventListener('click', closeCustomAlert);
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
                    
                    let qualityKey = (itemData.quality || 'Normal').toLowerCase();
                    if (qualityKey === 'normal') {
                        qualityKey = 'common';
                    }
                    const multiplier = RARITY_MULTIPLIERS[qualityKey];

                    if (multiplier) {
                        for (const mat in itemData.cost) {
                            totalCostCommon[mat] += itemData.cost[mat] * quantity * multiplier;
                        }
                    }
                    totalGoldCost += (itemData.gold_cost || 0) * quantity;
                }
            }
        }

        let displayRarity = 'Legendary';
        const highestRarity = getHighestSelectedRarity();
        if (highestRarity) {
            displayRarity = highestRarity;
        } else {
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
    
        if (virtualScrollListener) {
            modalGrid.removeEventListener('scroll', virtualScrollListener);
            virtualScrollListener = null;
        }
    
        const html = filteredItems.map(item => `
            <div class="modal-item" data-item-id="${item.id}">
                <img src="/images/materials/equipment/${item.image}" alt="${item.name}">
                <span class="item-name ${item.quality}">${item.name}</span>
            </div>`
        ).join('');
    
        modalGrid.innerHTML = html;
        modalGrid.scrollTop = 0;
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
        
        if (virtualScrollListener) {
            modalGrid.removeEventListener('scroll', virtualScrollListener);
            virtualScrollListener = null;
        }
        modalGrid.innerHTML = '';
        currentVirtualScrollItems = [];
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
        updateUIDisplays(itemId);
        saveCalculatorState();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function addItemFromSelector(itemId) {
        craftingList[itemId] = (craftingList[itemId] || 0) + 1;

        const itemElement = equipmentSelectorGrid.querySelector(`.selector-item[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('item-added-glow');
            setTimeout(() => {
                itemElement.classList.remove('item-added-glow');
            }, 1200);
        }

        updateUIDisplays(itemId);
        saveCalculatorState();
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
        saveCalculatorState();
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
        saveCalculatorState();
        
        if (calculateBtn.style.display === 'none') {
            performCalculation();
        }
    }
    
    function updateSelectedItemsDisplay(newItemId = null) {
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
                if (itemId === newItemId) {
                    itemEl.classList.add('item-just-added');
                }
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

    function adjustStatsFontSize(container) {
        if (!container || !container.hasChildNodes()) {
            return;
        }
    
        requestAnimationFrame(() => {
            container.style.fontSize = ''; 
            
            requestAnimationFrame(() => {
                if (container.scrollHeight <= container.clientHeight) {
                    return;
                }
                
                let currentSize = parseFloat(window.getComputedStyle(container).fontSize);
                const minSize = 8;
                let iterations = 0;
    
                while (container.scrollHeight > container.clientHeight && currentSize > minSize && iterations < 30) {
                    currentSize -= 0.5; 
                    container.style.fontSize = currentSize + 'px';
                    iterations++;
                }
            });
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
    
        const troopTypes = ['infantry', 'cavalry', 'archer', 'siege'];
        const statTypes = ['attack', 'defense', 'health', 'march_speed'];
    
        statTypes.forEach(statType => {
            const universalStatKey = `troop_${statType}`;
            const universalValue = totalStats[universalStatKey] || 0;
    
            if (universalValue > 0) {
                troopTypes.forEach(troopType => {
                    const specificStatKey = `${troopType}_${statType}`;
                    totalStats[specificStatKey] = (totalStats[specificStatKey] || 0) + universalValue;
                });
            }
        });
    
        const groupedStats = {
            infantry: { total: 0, stats: {} },
            cavalry: { total: 0, stats: {} },
            archer: { total: 0, stats: {} },
            siege: { total: 0, stats: {} }
        };
    
        for (const stat in totalStats) {
            if (totalStats[stat] > 0 && !stat.startsWith('troop_')) {
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
                    const iconHtml = `<img src="/images/materials/${troopType}_icon_mini.webp" alt="${troopType} icon">`;
                    html += `<div class="stat-pair ${troopType}">
                                <div class="stat-name-wrapper">${iconHtml}${formatStatName(stat)}</div>
                                <span>+${totalStats[stat].toFixed(1).replace('.0', '')}%</span>
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
    
    function updateUIDisplays(newItemId = null) {
        updateSelectedItemsDisplay(newItemId);
        calculateAndDisplayTotalStats();
        adjustStatsFontSize(document.getElementById('total-stats-container'));
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
        const transitionDuration = 300; 

        grid.querySelectorAll('.selector-item').forEach(item => {
            const itemData = EQUIPMENT_DATA.find(d => d.id === item.dataset.itemId);
            if (!itemData) return;

            const nameMatch = itemData.name.toLowerCase().includes(lowerCaseSearchTerm);
            const slotMatch = !activeFilters.slot || activeFilters.slot.length === 0 || activeFilters.slot.includes(itemData.slot);
            const qualityMatch = !activeFilters.quality || activeFilters.quality.length === 0 || activeFilters.quality.includes(itemData.quality);
            
            const statsMatch = !activeFilters.stats || activeFilters.stats.length === 0 || 
                activeFilters.stats.some(statFilter =>
                    itemData.stats && itemData.stats[statFilter] > 0
                );
            
            const shouldBeVisible = nameMatch && slotMatch && qualityMatch && statsMatch;

            if (shouldBeVisible) {
                item.style.display = 'flex';
                setTimeout(() => {
                    item.classList.remove('hidden');
                }, 10);
            } else {
                item.classList.add('hidden');
                setTimeout(() => {
                    if (item.classList.contains('hidden')) {
                        item.style.display = 'none';
                    }
                }, transitionDuration);
            }
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
                options: [
                    'infantry_attack', 'cavalry_attack',
                    'infantry_defense', 'cavalry_defense',
                    'infantry_health', 'cavalry_health',
                    'archer_attack', 'siege_attack',
                    'archer_defense', 'siege_defense',
                    'archer_health', 'siege_health'
                ]
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
                let className = '';
                if (category.type === 'stats') {
                    const troopType = getTroopTypeFromStat(opt);
                    className = `stat-${troopType}`;
                }
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
            saveCalculatorState();
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
        saveCalculatorState();
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
        const loadoutColumn = document.querySelector('.equipment-loadout-column');
        const shoppingListColumn = document.querySelector('.shopping-list-column');
    
        if (window.innerWidth > 1200 && loadoutColumn && shoppingListColumn) {
            requestAnimationFrame(() => {
                const loadoutHeight = loadoutColumn.offsetHeight;
                shoppingListColumn.style.height = `${loadoutHeight}px`;
            });
        } else if (shoppingListColumn) {
            shoppingListColumn.style.height = 'auto';
        }
    }
    
    window.addEventListener('resize', debounce(() => {
        adjustSelectorHeight();
        adjustLayoutHeights();
        adjustStatsFontSize(document.getElementById('total-stats-container'));
    }, 150));

    window.addEventListener('load', () => {
        adjustSelectorHeight();
        adjustLayoutHeights();
    });

    function populateScreenshotLoadout() {
        let html = '';
        Object.keys(SLOT_PLACEHOLDERS).forEach(slotKey => {
            const slotId = `slot-${slotKey}`;
            const itemId = selectedLoadoutSlots[slotKey];
            const itemData = itemId ? EQUIPMENT_DATA.find(i => i.id === itemId) : null;
            const imgSrc = itemData ? `/images/materials/equipment/${itemData.image}` : '';
            const altText = itemData ? itemData.name : `${slotKey} slot`;
            
            html += `<div class="loadout-slot" id="screenshot-${slotId}" data-slot="${slotKey}">
                        ${itemData ? `<img src="/images/materials/equipment/${itemData.image}" alt="${itemData.name}">` : ''}
                    </div>`;
        });
        screenshotLoadoutGrid.innerHTML = html;
    }

    function populateScreenshotShoppingList() {
        let html = '';
        const uniqueItems = new Set(Object.values(selectedLoadoutSlots).filter(id => id !== null));
    
        if (uniqueItems.size === 0) {
            screenshotShoppingList.innerHTML = '<p class="no-items-placeholder" style="text-align: center; color: var(--text-secondary);">No items in loadout.</p>';
            return;
        }

        uniqueItems.forEach(itemId => {
            const itemData = EQUIPMENT_DATA.find(i => i.id === itemId);
            if (!itemData) return;
    
            let statsHtml = '';
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

            let costHtml = '';
            if (itemData.cost) {
                const costs = Object.entries(itemData.cost).filter(([, amount]) => amount > 0);
                if (costs.length > 0) {
                    costs.forEach(([mat, amount]) => {
                        let qualityClass = `text-${(itemData.quality || 'Normal').toLowerCase()}`;
                        costHtml += `
                            <div class="cost-pair">
                                <img src="${getMaterialIconPath(mat, itemData.quality)}" alt="${mat}">
                                <span class="${qualityClass}">${amount}</span>
                            </div>`;
                    });
                }
            }
    
            html += `<div class="screenshot-list-item">
                        <img src="/images/materials/equipment/${itemData.image}" alt="${itemData.name}">
                        <div class="screenshot-item-details">
                            <span class="item-name ${itemData.quality}">${itemData.name}</span>
                            <div class="screenshot-item-stats">${statsHtml}</div>
                            <div class="screenshot-item-cost">${costHtml}</div>
                        </div>
                     </div>`;
        });
        screenshotShoppingList.innerHTML = html;
    }

    function populateScreenshotTotalStats() {
        screenshotTotalStats.innerHTML = document.getElementById('total-stats-container').innerHTML;
    }

    function populateScreenshotTotalCost() {
        const totalCost = { iron: 0, leather: 0, ebony: 0, bone: 0 };
        let totalGoldCost = 0;
        const materialNames = {
            iron: "Iron Ore",
            leather: "Leather",
            ebony: "Ebony",
            bone: "Animal Bone"
        };
    
        const uniqueItems = new Set(Object.values(selectedLoadoutSlots).filter(id => id !== null));
    
        uniqueItems.forEach(itemId => {
            const itemData = EQUIPMENT_DATA.find(i => i.id === itemId);
            if (itemData && itemData.cost) {
                for (const mat in itemData.cost) {
                    totalCost[mat] += itemData.cost[mat];
                }
                totalGoldCost += itemData.gold_cost || 0;
            }
        });
    
        let html = '';
        Object.entries(totalCost).forEach(([mat, amount]) => {
            if (amount > 0) {
                html += `
                    <div class="screenshot-cost-item">
                        <img src="${getMaterialIconPath(mat, 'legendary')}" alt="${materialNames[mat]}">
                        <span class="value text-legendary">${materialNames[mat]}: ${amount.toLocaleString()}</span>
                    </div>`;
            }
        });
    
        if (totalGoldCost > 0) {
            html += `
                <div class="screenshot-cost-item">
                    <img src="/images/materials/gold_icon.webp" alt="Gold">
                    <span class="value">Gold: ${totalGoldCost.toLocaleString()}</span>
                </div>`;
        }
    
        if (!html) {
            html = '<p class="no-items-placeholder" style="text-align: center; color: var(--text-secondary);">No materials required.</p>';
        }
    
        screenshotTotalCost.innerHTML = html;
    }
    
    function openScreenshotModal() {
        const hasLoadoutItems = Object.values(selectedLoadoutSlots).some(id => id !== null);
        if (!hasLoadoutItems) {
            showCustomAlert("Please add at least one item to your equipment loadout first.");
            return;
        }

        screenshotViewToggle.checked = false;
        screenshotCaptureArea.classList.remove('view-materials');
        screenshotToggleLabel.textContent = "Stats Overview";
        screenshotTotalStatsWrapper.style.display = 'flex';
        screenshotTotalCostWrapper.style.display = 'none';
        screenshotTotalStatsWrapper.classList.remove('fade-out-down', 'fade-in-up');
        screenshotTotalCostWrapper.classList.remove('fade-out-down', 'fade-in-up');


        populateScreenshotLoadout();
        populateScreenshotShoppingList();
        populateScreenshotTotalStats();
        populateScreenshotTotalCost();
        screenshotModal.style.display = 'flex';
    }

    function closeScreenshotModal() {
        screenshotModal.style.display = 'none';
    }

    function waitForImagesToLoad(containerElement) {
        const images = Array.from(containerElement.getElementsByTagName('img'));
        const promises = images.map(img => {
            return new Promise((resolve, reject) => {
                if (img.complete && img.naturalHeight !== 0) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error(`Could not load image: ${img.src}`));
                }
            });
        });
        return Promise.all(promises);
    }

    async function generateImageBlob() {
        const node = screenshotCaptureArea;
        const watermark = document.querySelector('.screenshot-watermark');
        if (watermark) watermark.classList.add('visible');
    
        try {
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));
            await waitForImagesToLoad(node);
    
            const scale = 2;
            const dataUrl = await domtoimage.toPng(node, {
                width: node.clientWidth * scale,
                height: node.clientHeight * scale,
                style: {
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left'
                },
                bgcolor: window.getComputedStyle(node).backgroundColor || 'transparent'
            });
            
            const blob = await (await fetch(dataUrl)).blob();
            if (!blob) {
                throw new Error('Data URL to Blob conversion failed.');
            }
            return blob;
        } finally {
            if (watermark) watermark.classList.remove('visible');
        }
    }

    async function handleDownloadImage(e) {
        e.stopPropagation();
        const originalButtonText = downloadImageBtn.innerHTML;
        downloadImageBtn.disabled = true;
    
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Image generation timed out')), 10000)
            );
            const blob = await Promise.race([generateImageBlob(), timeoutPromise]);

            const link = document.createElement('a');
            link.download = 'rok-loadout-summary.png';
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            downloadImageBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        } catch (err) {
            console.error('Failed to generate or download image: ', err);
            downloadImageBtn.innerHTML = '<i class="fas fa-times"></i> Failed!';
            showCustomAlert('Could not generate the image for download. Please try again.');
        } finally {
            setTimeout(() => {
                downloadImageBtn.innerHTML = originalButtonText;
                downloadImageBtn.disabled = false;
            }, 3000);
        }
    }

    async function handleCopyImage(e) {
        e.stopPropagation();
        const originalButtonText = copyImageBtn.innerHTML;
        copyImageBtn.disabled = true;
    
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Image generation timed out')), 10000)
            );
            const blob = await Promise.race([generateImageBlob(), timeoutPromise]);
    
            try {
                if (!navigator.clipboard || !navigator.clipboard.write) {
                    throw new Error('Clipboard API not available.');
                }
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                copyImageBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    
            } catch (clipboardError) {
                console.warn('Clipboard API failed, falling back to download:', clipboardError);
                const link = document.createElement('a');
                link.download = 'rok-loadout-summary.png';
                link.href = URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                copyImageBtn.innerHTML = '<i class="fas fa-download"></i> Downloaded!';
            }
    
        } catch (err) {
            console.error('Failed to generate or copy image: ', err);
            copyImageBtn.innerHTML = '<i class="fas fa-times"></i> Failed!';
            showCustomAlert('Could not generate the image. Please try again.');
        } finally {
            setTimeout(() => {
                copyImageBtn.innerHTML = originalButtonText;
                copyImageBtn.disabled = false;
            }, 3000);
        }
    }
    
    screenshotBtn.addEventListener('click', openScreenshotModal);
    screenshotModalCloseBtn.addEventListener('click', closeScreenshotModal);
    screenshotModal.addEventListener('click', (e) => {
        if (e.target === screenshotModal) closeScreenshotModal();
    });
    copyImageBtn.addEventListener('click', handleCopyImage);
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', handleDownloadImage);
    }
    
    screenshotViewToggle.addEventListener('change', () => {
        const isCostView = screenshotViewToggle.checked;
        screenshotTotalStatsWrapper.classList.remove('fade-in-up', 'fade-out-down');
        screenshotTotalCostWrapper.classList.remove('fade-in-up', 'fade-out-down');

        if (isCostView) {
            screenshotCaptureArea.classList.add('view-materials');
            screenshotToggleLabel.textContent = "Material Cost";
            
            screenshotTotalStatsWrapper.classList.add('fade-out-down');
            screenshotTotalCostWrapper.style.display = 'flex';
            screenshotTotalCostWrapper.classList.add('fade-in-up');
            
            setTimeout(() => {
                if(screenshotViewToggle.checked) {
                    screenshotTotalStatsWrapper.style.display = 'none';
                }
            }, 400);

        } else {
            screenshotCaptureArea.classList.remove('view-materials');
            screenshotToggleLabel.textContent = "Stats Overview";
            
            screenshotTotalCostWrapper.classList.add('fade-out-down');
            screenshotTotalStatsWrapper.style.display = 'flex';
            screenshotTotalStatsWrapper.classList.add('fade-in-up');

            setTimeout(() => {
                if(!screenshotViewToggle.checked) {
                    screenshotTotalCostWrapper.style.display = 'none';
                }
            }, 400);
        }
    });


    async function initializeCalculator() {
        try {
            const response = await fetch('equipment.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            const rarityOrder = { 'Legendary': 5, 'Epic': 4, 'Elite': 3, 'Advanced': 2, 'Normal': 1 };
            EQUIPMENT_DATA = data.sort((a, b) => {
                const orderA = rarityOrder[a.quality] || 0;
                const orderB = rarityOrder[b.quality] || 0;
                return orderB - orderA;
            });

            initializeEquipmentSelector();
            
            const preLoginPath = sessionStorage.getItem('preLoginToolPath');
            if (preLoginPath === window.location.pathname) {
                const preLoginState = JSON.parse(sessionStorage.getItem('preLoginState'));
                if (preLoginState) {
                    loadCalculatorState(preLoginState);
                }
                sessionStorage.removeItem('preLoginState');
                sessionStorage.removeItem('preLoginToolPath');
            } else {
                loadCalculatorState();
            }

            updateUIDisplays();

            requestAnimationFrame(() => {
                adjustSelectorHeight();
                adjustLayoutHeights();
            });

        } catch (error) {
            console.error("Could not initialize calculator:", error);
            if(equipmentSelectorGrid) {
                equipmentSelectorGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Error: Could not load equipment data.</p>`;
            }
        }
    }

    initializeCalculator();
});