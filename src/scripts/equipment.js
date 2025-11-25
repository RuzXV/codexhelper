document.addEventListener('DOMContentLoaded', function() {
    function getImagePath(filename) {
        if (window.EQUIPMENT_IMAGE_PATHS && window.EQUIPMENT_IMAGE_PATHS[filename]) {
            return window.EQUIPMENT_IMAGE_PATHS[filename];
        }
        console.warn(`Image path for "${filename}" not found in map. Using a fallback path.`);
        
        if (filename.includes('slot')) {
            return `/images/materials/slots/${filename}`;
        }
        if (filename.includes('icon')) {
            return `/images/materials/icons/${filename}`;
        }
        return `/images/materials/equipment/${filename}`;
    }

    const craftingTabBtn = document.querySelector('.generator-tab-btn[data-tab="crafting-calculator"]');
    const compareTabBtn = document.querySelector('.generator-tab-btn[data-tab="compare-sets"]');
    const craftingView = document.getElementById('crafting-calculator-view');
    const compareView = document.getElementById('compare-sets-view');

    function switchView(tabName) {
        const views = { 'crafting-calculator': craftingView, 'compare-sets': compareView };
        const tabs = { 'crafting-calculator': craftingTabBtn, 'compare-sets': compareTabBtn };
        for (const key in views) {
            const isActive = key === tabName;
            if(views[key]) views[key].classList.toggle('active', isActive);
            if(tabs[key]) tabs[key].classList.toggle('active', isActive);
        }
    }
    if(craftingTabBtn) craftingTabBtn.addEventListener('click', () => switchView('crafting-calculator'));
    if(compareTabBtn) compareTabBtn.addEventListener('click', () => switchView('compare-sets'));

    const compareLoadoutASlots = document.querySelectorAll('#compare-a-loadout-grid .loadout-slot');
    const compareLoadoutBSlots = document.querySelectorAll('#compare-b-loadout-grid .loadout-slot');
    const comparisonStatsContainer = document.getElementById('comparison-stats-container');
    const awakenModeBtn = document.getElementById('awaken-mode-btn');
    const comparisonFilterToggleBtn = document.getElementById('comparison-filter-toggle-btn');
    const comparisonFilterPanel = document.getElementById('comparison-filter-panel');
    const refineModeBtn = document.getElementById('refine-mode-btn');
    const kvkSeasonSelector = document.getElementById('kvk-season-selector');
    const awakenLevelModal = document.getElementById('awaken-level-modal');
    const awakenItemName = document.getElementById('awaken-item-name');
    const loadoutViewSelector = document.getElementById('loadout-view-selector');
    const extraBonusesToggle = document.getElementById('extra-bonuses-toggle');
    let currentComparisonMode = 'none';
    let currentKvkSeason = 'soc';
    let activeComparisonSlot = null;

    let compareLoadoutA = {};
    let compareLoadoutB = {};

    const calculateBtn = document.getElementById('calculate-btn');
    const allInputs = document.querySelectorAll('.material-input');
    const resultDiv = document.getElementById('materials-result');
    const craftingLoadoutSlots = document.querySelectorAll('#crafting-calculator-view .loadout-slot');
    const modal = document.getElementById('equipment-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalGrid = document.getElementById('modal-grid');
    const modalTitle = document.getElementById('modal-title');
    const modalSearch = document.getElementById('modal-search');
    const selectedItemsList = document.getElementById('selected-items-list');
    const clearShoppingListBtn = document.getElementById('clear-shopping-list-btn');
    const equipmentTooltip = document.createElement('div');
    equipmentTooltip.id = 'equipment-tooltip';
    document.body.appendChild(equipmentTooltip);

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

    const MATERIALS = ['iron', 'leather', 'ebony', 'bone'];
    const CHEST_MATERIAL = 'chest';
    const RARITIES = ['common', 'advanced', 'elite', 'epic', 'legendary'];
    const RARITIES_ORDERED = ['Normal', 'Advanced', 'Elite', 'Epic', 'Legendary'];
    const MARCH_BASE_CAPACITY = 200000;

    const EQUIPMENT_DATA = window.equipmentData;
    const EQUIPMENT_SET_DATA = window.equipmentSetData;
    const ICONIC_DATA = window.iconicData;

    const SLOT_PLACEHOLDERS = {
        helmet: getImagePath('helmet_slot.webp'),
        weapon: getImagePath('weapon_slot.webp'),
        chest: getImagePath('chest_slot.webp'),
        gloves: getImagePath('glove_slot.webp'),
        legs: getImagePath('leggings_slot.webp'),
        boots: getImagePath('boots_slot.webp'),
        accessory1: getImagePath('accessory1_slot.webp'),
        accessory2: getImagePath('accessory2_slot.webp')
    };
    
    const compareLoadoutADetailsList = document.getElementById('details-list-a');
    const compareLoadoutBDetailsList = document.getElementById('details-list-b');

    const RARITY_MULTIPLIERS = { common: 1, advanced: 4, elite: 16, epic: 64, legendary: 256 };

    let craftingList = {};
    let selectedLoadoutSlots = { helmet: null, chest: null, weapon: null, gloves: null, legs: null, boots: null, accessory1: null, accessory2: null };
    let activeSlotElement = null;
    
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
        state.compareLoadoutA = compareLoadoutA;
        state.compareLoadoutB = compareLoadoutB;
        state.kvkSeason = currentKvkSeason;
    
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
                        slotElement.innerHTML = `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">`;
                    }
                }
            });
        }
        
        updateUIDisplays();
    
        if(savedState.compareLoadoutA) {
            compareLoadoutA = savedState.compareLoadoutA;
             Object.keys(compareLoadoutA).forEach(slotKey => {
                const item = compareLoadoutA[slotKey];
                if(item && item.id) {
                    const itemData = EQUIPMENT_DATA.find(i => i.id === item.id);
                    const slotElement = document.getElementById(`slot-a-${slotKey}`);
                    if(itemData && slotElement) slotElement.innerHTML = `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">`;
                }
            });
        }
        if(savedState.compareLoadoutB) {
            compareLoadoutB = savedState.compareLoadoutB;
             Object.keys(compareLoadoutB).forEach(slotKey => {
                const item = compareLoadoutB[slotKey];
                if(item && item.id) {
                    const itemData = EQUIPMENT_DATA.find(i => i.id === item.id);
                    const slotElement = document.getElementById(`slot-b-${slotKey}`);
                    if(itemData && slotElement) slotElement.innerHTML = `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">`;
                }
            });
        }

        if (savedState.kvkSeason) {
            currentKvkSeason = savedState.kvkSeason;
            const seasonRadio = document.querySelector(`#kvk-season-selector input[value="${currentKvkSeason}"]`);
            if (seasonRadio) seasonRadio.checked = true;
        }

        updateComparisonDisplays();
    }

    const getMaterialIconPath = (mat, rarity = 'legendary') => {
        const iconName = mat === 'iron' ? 'ore' : mat;
        let rarityName = (rarity || 'legendary').toLowerCase();
        if (rarityName === 'normal') rarityName = 'common';
        if (!RARITIES.includes(rarityName)) {
            rarityName = 'legendary';
        }
        return getImagePath(`${iconName}_${rarityName}.webp`);
    };
    
    const formatStatName = (key) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const getTroopTypeFromStat = (statKey) => {
        if (statKey.startsWith('cavalry')) return 'cavalry';
        if (statKey.startsWith('infantry')) return 'infantry';
        if (statKey.startsWith('archer')) return 'archer';
        if (statKey.startsWith('siege')) return 'siege';
        if (statKey.startsWith('troop')) return 'troop';
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
        return highestRarityIndex > -1 ? RARITIES_ORDERED[highestRarityIndex] : 'Legendary';
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

        let displayRarity = getHighestSelectedRarity();
        
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
                    <img src="${getImagePath(`chest_${displayRarity.toLowerCase()}.webp`)}" alt="Chests">
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
                    <img src="${getImagePath('gold_icon.webp')}" alt="Gold">
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
        const rarityClass = `text-${displayRarity.toLowerCase()}`;

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
            if (materialItemsHtml.trim().length > 0) {
                materialItemsHtml += `<div class="result-or-divider">OR</div>`;
            }
            materialItemsHtml += `
                <div class="result-item">
                    <img src="${getImagePath(`chest_${displayRarity.toLowerCase()}.webp`)}" alt="Chests">
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
                    <img src="${getImagePath('materials_icon.webp')}" alt="Total Materials">
                    <div class="label">Total ${rarityName} Mats Needed:</div>
                    <span class="value">${totalMatCostDisplay.toLocaleString()}</span>
                </div>
                <div class="result-item">
                    <img src="${getImagePath('materials_icon.webp')}" alt="Total Materials">
                    <div class="label">Total ${rarityName} Mats Owned:</div>
                    <span class="value">${totalMatOwnedDisplay.toLocaleString()}</span>
                </div>
                ${totalGoldCost > 0 ? `
                <div class="result-item">
                    <img src="${getImagePath('gold_icon.webp')}" alt="Gold">
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
                <img src="${getImagePath(item.image)}" alt="${item.name}" loading="lazy" width="48" height="48">
                <span class="item-name ${item.quality}">${item.name}</span>
            </div>`
        ).join('');
    
        modalGrid.innerHTML = html;
        modalGrid.scrollTop = 0;
    }


    function openModalForSlot(slotElement) {
        activeSlotElement = slotElement;
        const slotType = slotElement.dataset.slot;
        const itemSlotType = (slotType === 'accessory1' || slotType === 'accessory2') ? 'accessory' : slotType;
    
        modalTitle.textContent = `Select ${formatStatName(itemSlotType)}`;
        modalSearch.value = '';
        
        populateModalGrid(itemSlotType);
        
        const instructionP = document.querySelector('#equipment-modal .modal-body > p');
        const isMobile = window.innerWidth <= 768;
    
        if (instructionP) {
            if (isMobile) {
                instructionP.textContent = "Click once to preview stats, double-click to equip item.";
            } else {
                instructionP.textContent = "Hover to preview stats, click an item to equip it.";
            }
        }
        
        modal.style.display = 'flex';
        
        if (!isMobile) {
            modalSearch.focus();
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        activeSlotElement = null;
    }

    function selectItemForCrafting(itemId) {
        const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
        if (!itemData || !activeSlotElement) return;
    
        const slotElement = activeSlotElement;
        const slotKey = slotElement.dataset.slot;

        if (slotKey === 'accessory1' || slotKey === 'accessory2') {
            const otherSlot = slotKey === 'accessory1' ? 'accessory2' : 'accessory1';
            if (selectedLoadoutSlots[otherSlot] === itemId) {
                showAlert("You cannot equip two of the same accessory.", "Unique Item");
                return;
            }
        }
        
        const oldItemId = selectedLoadoutSlots[slotKey];
        if (oldItemId) {
            craftingList[oldItemId] = (craftingList[oldItemId] || 1) - 1;
            if (craftingList[oldItemId] <= 0) {
                delete craftingList[oldItemId];
            }
        }
    
        craftingList[itemId] = (craftingList[itemId] || 0) + 1;
        selectedLoadoutSlots[slotKey] = itemId;
        
        slotElement.innerHTML = `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">`;
        
        hideTooltip();
        closeModal();
        updateUIDisplays(itemId);
        saveCalculatorState();
        if (calculateBtn && calculateBtn.style.display === 'none') performCalculation();
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

        updateUIDisplays();
        
        try {
            if (craftingLoadoutSlots && craftingLoadoutSlots.length > 0) {
                craftingLoadoutSlots.forEach(slot => {
                    const slotKey = slot.dataset.slot;
                    if (slotKey && SLOT_PLACEHOLDERS[slotKey]) {
                        slot.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${formatStatName(slotKey)} Slot">`;
                    }
                });
            }
        } catch (e) {
            console.error("Error resetting loadout slots:", e);
        }

        saveCalculatorState();
        
        if (calculateBtn && calculateBtn.style.display === 'none') {
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
                                qualityClass = `text-${quality.toLowerCase()}`;
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
                    Object.entries(itemData.stats)
                        .sort(([,a], [,b]) => b - a) 
                        .forEach(([statKey, statValue]) => {
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
                    <img src="${getImagePath(itemData.image)}" alt="${itemData.name}" class="selected-item-icon">
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

    window.fitTextToContainer = function(container) {
        if (!container) return;
        
        container.style.fontSize = '';
        
        if (container.scrollHeight <= container.clientHeight) return;

        let size = 14;
        const minSize = 9;

        while (container.scrollHeight > container.clientHeight && size > minSize) {
            size--;
            container.style.fontSize = `${size}px`;
        }
    };

    function calculateAndDisplayTotalStats() {
        const container = document.getElementById('total-stats-container');
        if (!container) return;
    
        const totalStats = {};
        const specialStats = new Set();
        const equippedPieceIds = Object.values(selectedLoadoutSlots).filter(id => id !== null);
    
        equippedPieceIds.forEach(itemId => {
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
        });
        
        EQUIPMENT_SET_DATA.forEach(set => {
            const equippedCount = set.pieces.filter(pieceId => equippedPieceIds.includes(pieceId)).length;
            let highestBonus = null;
            set.bonuses.forEach(bonus => {
                if (equippedCount >= bonus.count) {
                    highestBonus = bonus;
                }
            });
    
            if (highestBonus) {
                const troopTypes = ['infantry', 'cavalry', 'archer', 'siege'];
                const statMatch = highestBonus.description.match(/Troop (Attack|Defense|Health|Defence)[\s\+]+([\d\.]+)%/i);
    
                if (statMatch) {
                    const statType = statMatch[1].toLowerCase().replace('defence', 'defense');
                    const statValue = parseFloat(statMatch[2]);
                    
                    troopTypes.forEach(troopType => {
                        const specificStatKey = `${troopType}_${statType}`;
                        totalStats[specificStatKey] = (totalStats[specificStatKey] || 0) + statValue;
                    });
                } else {
                    specialStats.add(highestBonus.description);
                }
            }
        });
    
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
                    const iconHtml = `<img src="${getImagePath(`${troopType}_icon_mini.webp`)}" alt="${troopType} icon">`;
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
        window.fitTextToContainer(container); 
    }
    
    function updateUIDisplays(newItemId = null) {
        updateSelectedItemsDisplay(newItemId);
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

    function getDominantTroopType(itemData) {
        if (!itemData.stats) return null;
        
        const troopTotals = { infantry: 0, cavalry: 0, archer: 0, siege: 0 };
        for (const stat in itemData.stats) {
            const troopType = getTroopTypeFromStat(stat);
            if (troopTotals.hasOwnProperty(troopType)) {
                troopTotals[troopType] += itemData.stats[stat];
            }
        }
        
        let dominantType = null;
        let maxStat = 0;
        for (const troopType in troopTotals) {
            if (troopTotals[troopType] > maxStat) {
                maxStat = troopTotals[troopType];
                dominantType = troopType;
            }
        }
        return dominantType;
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
            const dominantTroopType = getDominantTroopType(itemData);
            const troopTypeMatch = !activeFilters.troop_type || activeFilters.troop_type.length === 0 || activeFilters.troop_type.includes(dominantTroopType);
            
            const statsMatch = !activeFilters.stats || activeFilters.stats.length === 0 || 
                activeFilters.stats.some(statFilter =>
                    itemData.stats && itemData.stats[statFilter] > 0
                );
            
            const shouldBeVisible = nameMatch && slotMatch && qualityMatch && statsMatch && troopTypeMatch;

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
            'Troop Type': {
                type: 'troop_type',
                options: ['infantry', 'cavalry', 'archer', 'siege']
            },
            'Specific Stats': {
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
                if (category.type === 'stats' || category.type === 'troop_type') {
                    const troopType = getTroopTypeFromStat(opt);
                    className = `stat-${troopType}`;
                }
                html += `<label class="filter-option ${className}">
                           <input type="checkbox" data-category="${category.type}" value="${opt}"> ${formatStatName(opt)}
                         </label>`;
            });
            html += '</div>';
            html += `</div>`;
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
        EQUIPMENT_DATA.forEach((item, index) => {
            const loadingAttr = 'lazy';
            html += `
                <div class="selector-item" data-item-id="${item.id}" title="Add ${item.name}">
                    <img src="${getImagePath(item.image)}" alt="${item.name}" loading="${loadingAttr}" width="36" height="36">
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
        if (!itemElement || !activeSlotElement) return;
    
        const itemId = itemElement.dataset.itemId;
        const isMobile = window.innerWidth <= 768;
    
        const selectLogic = () => {
            if (activeSlotElement.dataset.loadout) {
                selectItemForComparison(itemId);
            } else {
                selectItemForCrafting(itemId);
            }
        };
    
        if (isMobile) {
            const clickTimestamp = new Date().getTime();
            const lastClick = parseInt(itemElement.dataset.lastClick || 0);
            
            if ((clickTimestamp - lastClick) < 300) {
                delete itemElement.dataset.lastClick;
                selectLogic();
            } else {
                itemElement.dataset.lastClick = clickTimestamp;
            }
        } else {
            selectLogic();
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
        if (slotElement.closest('#crafting-calculator-view')) {
            const slotKey = slotElement.dataset.slot;
            if (selectedLoadoutSlots[slotKey]) {
                removeItemFromSlot(slotKey);
            } else {
                openModalForSlot(slotElement);
            }
        } else {
            const loadoutIdentifier = slotElement.dataset.loadout;
            const slotKey = slotElement.dataset.slot;
            const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;
            const item = targetLoadout[slotKey];

            if (currentComparisonMode === 'refine') {
                if (item) toggleRefine(slotElement);
            } else if (currentComparisonMode === 'awaken') {
                if (item) openAwakenMenu(slotElement);
            } else {
                if (item) {
                    removeItemFromComparisonSlot(slotElement);
                } else {
                    openModalForSlot(slotElement);
                }
            }
        }
    }

    [...craftingLoadoutSlots, ...compareLoadoutASlots, ...compareLoadoutBSlots].forEach(slot => {
        slot.addEventListener('click', () => handleSlotClick(slot));
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    if (clearShoppingListBtn) {
        clearShoppingListBtn.addEventListener('click', clearAllSelections);
    }
    
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

        if (comparisonFilterPanel && !comparisonFilterPanel.contains(e.target) && !comparisonFilterToggleBtn.contains(e.target)) {
            comparisonFilterPanel.classList.remove('visible');
        }
    });

    function populateScreenshotLoadout() {
        let html = '';
        Object.keys(SLOT_PLACEHOLDERS).forEach(slotKey => {
            const slotId = `slot-${slotKey}`;
            const itemId = selectedLoadoutSlots[slotKey];
            const itemData = itemId ? EQUIPMENT_DATA.find(i => i.id === itemId) : null;
            
            html += `<div class="loadout-slot" id="screenshot-${slotId}" data-slot="${slotKey}">
                        ${itemData ? `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">` : ''}
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
                Object.entries(itemData.stats)
                    .sort(([,a], [,b]) => b - a)
                    .forEach(([statKey, statValue]) => {
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
                        <img src="${getImagePath(itemData.image)}" alt="${itemData.name}">
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
                    <img src="${getImagePath('gold_icon.webp')}" alt="Gold">
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
            showAlert("Please add at least one item to your equipment loadout first.");
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
                bgcolor: window.getComputedStyle(node).backgroundColor || 'transparent',
                cacheBust: true,
                quality: 0.95
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
            showAlert('Could not generate the image for download. Please try again.');
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
            showAlert('Could not generate the image. Please try again.');
        } finally {
            setTimeout(() => {
                copyImageBtn.innerHTML = originalButtonText;
                copyImageBtn.disabled = false;
            }, 3000);
        }
    }
    
    if (screenshotBtn) screenshotBtn.addEventListener('click', openScreenshotModal);
    if (screenshotModalCloseBtn) screenshotModalCloseBtn.addEventListener('click', closeScreenshotModal);
    if (screenshotModal) screenshotModal.addEventListener('click', (e) => {
        if (e.target === screenshotModal) closeScreenshotModal();
    });
    if (copyImageBtn) copyImageBtn.addEventListener('click', handleCopyImage);
    if (downloadImageBtn) {
        downloadImageBtn.addEventListener('click', handleDownloadImage);
    }
    
   if (screenshotViewToggle) screenshotViewToggle.addEventListener('change', () => {
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

    function showTooltip(itemId, event) {
        const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
        if (!itemData) return;

        let statsHtml = '';
        if (itemData.stats) {
            Object.entries(itemData.stats)
                .sort(([,a], [,b]) => b - a)
                .forEach(([key, value]) => {
                    if (value > 0) {
                        const troopType = getTroopTypeFromStat(key);
                        statsHtml += `<div class="stat-pair ${troopType}">${formatStatName(key)} <span>+${value}%</span></div>`;
                    }
                });
        }
        if(itemData.special_stats) itemData.special_stats.forEach(stat => statsHtml += `<div class="special-stat">${stat}</div>`);

        let costHtml = '';
        if (itemData.cost) {
            costHtml += '<div class="tooltip-cost">';
            Object.entries(itemData.cost).forEach(([mat, amount]) => {
                if (amount > 0) {
                    costHtml += `<div class="cost-pair"><img src="${getMaterialIconPath(mat, itemData.quality)}" alt="${mat}"> <span class="text-${itemData.quality.toLowerCase()}">${amount}</span></div>`;
                }
            });
            costHtml += '</div>';
        }

        let setHtml = '';
        const itemSet = EQUIPMENT_SET_DATA.find(set => set.pieces.includes(itemId));
        if (itemSet) {
            setHtml += `<div class="tooltip-set-info">
                <h5 class="set-name">${itemSet.name}</h5>`;
            itemSet.bonuses.forEach(bonus => {
                setHtml += `<div class="set-bonus">(${bonus.count}-piece): ${bonus.description}</div>`;
            });
            setHtml += `</div>`;
        }

        equipmentTooltip.innerHTML = `
            <h4 class="item-name ${itemData.quality}">${itemData.name}</h4>
            ${statsHtml ? `<div class="tooltip-section"><div class="tooltip-stats">${statsHtml}</div></div>` : ''}
            ${costHtml ? `<div class="tooltip-section">${costHtml}</div>` : ''}
            ${setHtml ? `<div class="tooltip-section">${setHtml}</div>` : ''}
        `;
        
        positionTooltip(event);
        equipmentTooltip.classList.add('visible');
    }

    function hideTooltip() {
        equipmentTooltip.classList.remove('visible');
    }

    function positionTooltip(event) {
        const tooltipRect = equipmentTooltip.getBoundingClientRect();
        let x = event.clientX + 15;
        let y = event.clientY + 15;
    
        if (x + tooltipRect.width > window.innerWidth) {
            x = event.clientX - tooltipRect.width - 15;
        }
        if (x < 0) {
            x = 5;
        }
        if (y + tooltipRect.height > window.innerHeight) {
            y = window.innerHeight - tooltipRect.height - 5;
        }
        if (y < 0) {
            y = 5;
        }
        
        equipmentTooltip.style.left = `${x}px`;
        equipmentTooltip.style.top = `${y}px`;
    }

    async function initializeCalculator() {
        try {
            const rarityOrder = { 'Legendary': 5, 'Epic': 4, 'Elite': 3, 'Advanced': 2, 'Normal': 1 };
            EQUIPMENT_DATA.sort((a, b) => {
                const orderA = rarityOrder[a.quality] || 0;
                const orderB = rarityOrder[b.quality] || 0;
                return orderB - orderA;
            });

            initializeEquipmentSelector();
            initializeComparisonFeatures();
            
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

            ['mouseover', 'mousemove', 'mouseout'].forEach(eventType => {
                document.body.addEventListener(eventType, e => {
                    const itemElement = e.target.closest('.modal-item, .selector-item');
                    if (eventType === 'mouseover' && itemElement) {
                        showTooltip(itemElement.dataset.itemId, e);
                    } else if (eventType === 'mousemove' && itemElement) {
                        positionTooltip(e);
                    } else if (eventType === 'mouseout' && itemElement) {
                        hideTooltip();
                    } else if (!itemElement) {
                        hideTooltip();
                    }
                });
            });

            if (loadoutViewSelector) {
                loadoutViewSelector.addEventListener('change', updateLoadoutViews);
            }

        } catch (error) {
            console.error("Could not initialize calculator:", error);
            if(equipmentSelectorGrid) {
                equipmentSelectorGrid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1 / -1; text-align: center;">Error: Could not load equipment data.</p>`;
            }
        }
    }

    function selectItemForComparison(itemId) {
        const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
        if (!itemData || !activeSlotElement) return;
        
        const slotElement = activeSlotElement;
        const slotKey = slotElement.dataset.slot;
        const loadoutIdentifier = slotElement.dataset.loadout;
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;

        if (slotKey === 'accessory1' || slotKey === 'accessory2') {
            const otherSlot = slotKey === 'accessory1' ? 'accessory2' : 'accessory1';
            const otherItem = targetLoadout[otherSlot];
            
            if (otherItem && otherItem.id === itemId) {
                showAlert("You cannot equip two of the same accessory.", "Unique Item");
                return;
            }
        }
    
        targetLoadout[slotKey] = {
            id: itemId,
            refined: false,
            awakenLevel: 0
        };
        slotElement.innerHTML = `<img src="${getImagePath(itemData.image)}" alt="${itemData.name}">`;
        
        hideTooltip();
        closeModal();
        updateComparisonDisplays();
        saveCalculatorState();
    }
    
    function removeItemFromComparisonSlot(slotElement) {
        const slotKey = slotElement.dataset.slot;
        const loadoutIdentifier = slotElement.dataset.loadout;
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;

        slotElement.classList.remove('refined');
        slotElement.querySelector('.awaken-level')?.remove();
    
        delete targetLoadout[slotKey];
        slotElement.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${slotKey} Slot">`;
        updateComparisonDisplays();
        saveCalculatorState();
    }

    function getRefinedBonus(value) {
        return Math.round(value * 0.3 * 2) / 2;
    }

    function calculateLoadoutStats(loadout) {
        const totalStats = {};
        const specialStats = {};
        const tempAggregates = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
        const iconicBonusesByTier = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
        
        let accumulatedUnitCapacity = 0;
        
        const equippedPieces = Object.values(loadout).filter(item => item && item.id);
        const equippedPieceIds = equippedPieces.map(item => item.id);

        equippedPieces.forEach(item => {
            const itemData = EQUIPMENT_DATA.find(d => d.id === item.id);
            if (!itemData) return;

            if (itemData.stats) {
                for (const stat in itemData.stats) {
                    totalStats[stat] = (totalStats[stat] || 0) + itemData.stats[stat];
                }
            }

            if (item.refined && itemData.stats) {
                for (const stat in itemData.stats) {
                    totalStats[stat] += getRefinedBonus(itemData.stats[stat]);
                }
            }
            
            let iconicInfo = ICONIC_DATA[itemData.name];
            if (!iconicInfo && itemData.quality === 'Legendary' && itemData.slot === 'accessory') {
                iconicInfo = ICONIC_DATA['Accessory'];
            }

            if (iconicInfo && item.awakenLevel > 0) {
                for (let i = 1; i <= item.awakenLevel; i++) {
                    const tier = iconicInfo.tiers[i];
                    if (!tier) continue;
                    
                    let tierValue = 0;
                    let critBuff = 0;
                    
                    let statName = null;
                    if (tier.stat) {
                        statName = formatStatName(tier.stat);
                        if (!tempAggregates[i][statName]) {
                            tempAggregates[i][statName] = { value: 0, isPercent: false, isSpecial: false };
                        }
                    }

                    switch (tier.type) {
                        case 'base_stat':
                            tierValue = tier.values[currentKvkSeason] || 0;
                            if (item.refined) critBuff = tier.crit_bonus || 0;
                            const baseVal = tierValue + critBuff;
                            
                            const baseStatKey = `base_${tier.stat}`;
                            totalStats[baseStatKey] = (totalStats[baseStatKey] || 0) + baseVal;

                            if (statName) tempAggregates[i][statName].value += baseVal;
                            break;

                            case 'percent_stat':
                                tierValue = tier.value || 0;
                                if (item.refined) critBuff = tier.crit_buff || 0;
                                const percentVal = tierValue + critBuff;
                                
                                let stat_key = tier.stat.toLowerCase().replace(/ /g, '_');
                                let flatAmountToAdd = 0;
    
                                if (stat_key === 'unit_cap' || stat_key === 'unit_capacity') {
                                    flatAmountToAdd = percentVal * 2000;
                                    accumulatedUnitCapacity += flatAmountToAdd;
                                }
    
                                if (statName) {
                                    if (stat_key === 'unit_cap' || stat_key === 'unit_capacity') {
                                        tempAggregates[i][statName].value += flatAmountToAdd;
                                        tempAggregates[i][statName].isPercent = false; 
                                    } else {
                                        tempAggregates[i][statName].value += percentVal;
                                        tempAggregates[i][statName].isPercent = true;
                                    }
                                }
                                break;

                        case 'flat_stat':
                            tierValue = tier.value || 0;
                            if (item.refined) critBuff = Math.round((tier.crit_buff || 0) / 10) * 10;
                            const flatVal = tierValue + critBuff;

                            if (statName) {
                                tempAggregates[i][statName].value += flatVal;
                                tempAggregates[i][statName].isPercent = false;
                            }

                            if (tier.stat.toLowerCase().includes('capacity') || tier.stat.toLowerCase().includes('cap')) {
                                accumulatedUnitCapacity += flatVal;
                            } else {
                                totalStats['unit_capacity_flat'] = (totalStats['unit_capacity_flat'] || 0) + flatVal;
                            }
                            break;

                        case 'special':
                            let desc = tier.description;
                            if (tier.values) {
                                for (const key in tier.values) {
                                    let val = tier.values[key];
                                    if (item.refined && tier.crit_bonus && tier.crit_bonus[key]) {
                                        val += tier.crit_bonus[key];
                                    }
                                    desc = desc.replace(`{${key}}`, val);
                                }
                            }
                            iconicBonusesByTier[i][desc] = true;
                            break;
                    }
                }
            }
            
            if (itemData.special_stats) {
                itemData.special_stats.forEach(stat => {
                    let finalStat = stat;
                    if (item.refined) {
                        if (stat.includes("Horn of Fury") || stat.includes("Karuak's War Drums")) {
                            finalStat = stat.replace("50", "65 <span class='refined-bonus'>(50 + 15)</span>");
                        } else if (stat.includes("Ring of Doom")) {
                            finalStat = stat.replace("50%", "65% <span class='refined-bonus'>(50% + 15%)</span>");
                        } else if (stat.includes("Greatest Glory")) {
                            finalStat = stat.replace("5%", "6.5% <span class='refined-bonus'>(5% + 1.5%)</span>");
                        }
                    }
                     specialStats[finalStat] = true;
                });
            }
        });

        for (let i = 1; i <= 5; i++) {
            for (const [name, data] of Object.entries(tempAggregates[i])) {
                if (data.value > 0) {
                    let formattedValue = '';
                    
                    const isUnitCap = name.toLowerCase().includes('cap');
                    
                    if (data.isPercent && !isUnitCap) {
                        formattedValue = `+${parseFloat(data.value.toFixed(1))}%`;
                    } else {
                        formattedValue = `+${data.value.toLocaleString()}`;
                    }
                    iconicBonusesByTier[i][name] = formattedValue;
                }
            }
        }

        EQUIPMENT_SET_DATA.forEach(set => {
            const equippedCount = set.pieces.filter(pieceId => equippedPieceIds.includes(pieceId)).length;
            set.bonuses.forEach(bonus => {
                if (equippedCount >= bonus.count) {
                     const troopTypes = ['infantry', 'cavalry', 'archer', 'siege'];
                     const statMatch = bonus.description.match(/(Troop|Infantry|Cavalry|Archer|Siege) (Attack|Defense|Health|Defence)[\s\+]+([\d\.]+)%/i);
                     if(statMatch){
                         const scope = statMatch[1].toLowerCase();
                         const type = statMatch[2].toLowerCase().replace('defence', 'defense');
                         const value = parseFloat(statMatch[3]);

                         if(scope === 'troop'){
                            troopTypes.forEach(troop => {
                                totalStats[`${troop}_${type}`] = (totalStats[`${troop}_${type}`] || 0) + value;
                            });
                         } else {
                            totalStats[`${scope}_${type}`] = (totalStats[`${scope}_${type}`] || 0) + value;
                         }
                     } else {
                         specialStats[bonus.description] = true;
                     }
                }
            });
        });
        
        const troopTypes = ['infantry', 'cavalry', 'archer', 'siege'];
        ['attack', 'defense', 'health'].forEach(statType => {
            const universalStat = `troop_${statType}`;
            if (totalStats[universalStat]) {
                troopTypes.forEach(troop => {
                    totalStats[`${troop}_${statType}`] = (totalStats[`${troop}_${statType}`] || 0) + totalStats[universalStat];
                });
            }
        });
        
        const baseStats = Object.keys(totalStats).filter(k => k.startsWith('base_'));
        baseStats.forEach(key => {
            const value = totalStats[key];
            delete totalStats[key];
            let statName = key.substring(5);
            
            if (statName.startsWith('Troop')) {
                const statSuffix = statName.substring(5).toLowerCase().replace(/ /g, '_');
                ['infantry', 'cavalry', 'archer', 'siege'].forEach(troop => {
                    const newKey = `${troop}${statSuffix}`;
                    totalStats[newKey] = (totalStats[newKey] || 0) + value;
                });
            } else {
                const newKey = statName.toLowerCase().replace(/ /g, '_');
                totalStats[newKey] = (totalStats[newKey] || 0) + value;
            }
        });
        
        if (totalStats['unit_capacity_flat']) delete totalStats['unit_capacity_flat'];

        return { stats: totalStats, special: specialStats, iconicBonusesByTier };
    }
    
    function updateComparisonStats() {
        if (!comparisonStatsContainer) return;
        const statsA = calculateLoadoutStats(compareLoadoutA);
        const statsB = calculateLoadoutStats(compareLoadoutB);
    
        const allStatKeys = [...new Set([...Object.keys(statsA.stats), ...Object.keys(statsB.stats)])].filter(key => !key.startsWith('troop_'));

        const allSpecialStatKeys = [...new Set([...Object.keys(statsA.special),...Object.keys(statsB.special)])];
        let hasIconicBonuses = false;
        for(let i = 1; i <= 5; i++){
            if(Object.keys(statsA.iconicBonusesByTier[i]).length > 0 || Object.keys(statsB.iconicBonusesByTier[i]).length > 0) {
                hasIconicBonuses = true; break;
            }
        }
        if (allStatKeys.length === 0 && allSpecialStatKeys.length === 0 && !hasIconicBonuses) {
            comparisonStatsContainer.innerHTML = '<p class="no-items-placeholder">Select equipment in a loadout to see its stats.</p>';
            return;
        }
    
        const groupedStats = {};
        const groupTotals = {};

        allStatKeys.forEach(key => {
            const troopType = getTroopTypeFromStat(key);
            if (!groupedStats[troopType]) {
                groupedStats[troopType] = [];
                groupTotals[troopType] = 0;
            }
            groupedStats[troopType].push(key);
            
            const valA = statsA.stats[key] || 0;
            const valB = statsB.stats[key] || 0;
            groupTotals[troopType] += (valA + valB);
        });
        
        for (const troop in groupedStats) {
            groupedStats[troop].sort((a, b) => {
                const isBaseA = a.includes('_base_');
                const isBaseB = b.includes('_base_');
                if (isBaseA !== isBaseB) {
                    return isBaseA ? 1 : -1;
                }

                const getPriority = (key) => {
                    if (key.includes('attack')) return 1;
                    if (key.includes('defense') || key.includes('defence')) return 2;
                    if (key.includes('health')) return 3;

                    return 4;
                };

                const priorityA = getPriority(a);
                const priorityB = getPriority(b);

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                const totalA = (statsA.stats[a] || 0) + (statsB.stats[a] || 0);
                const totalB = (statsA.stats[b] || 0) + (statsB.stats[b] || 0);
                
                return totalB - totalA;
            });
        }
        
        const sortedTroopTypes = Object.keys(groupedStats).sort((a, b) => {
            return groupTotals[b] - groupTotals[a];
        });

        let mainStatsHtml = '';
        sortedTroopTypes.forEach(troopType => {
            groupedStats[troopType].forEach(key => {
                const valA = statsA.stats[key] || 0;
                const valB = statsB.stats[key] || 0;
                if (valA === 0 && valB === 0) return;
    
                const delta = valB - valA;
                const isPercentage = !key.includes('_base_');
                const suffix = isPercentage ? '%' : '';
                
                let deltaHtml = (delta !== 0)
                    ? `<span class="${delta > 0 ? 'stat-increase' : 'stat-decrease'}"><i class="fas ${delta > 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> <span class="delta-number">${delta.toFixed(isPercentage ? 1 : 0).replace('.0', '')}${suffix}</span></span>`
                    : `<span class="stat-no-change">-</span>`;
                
                let iconHtml = '';
                if (troopType !== 'general') {
                    iconHtml = `<img src="${getImagePath(`${troopType}_icon_mini.webp`)}" alt="${troopType} icon" class="stat-icon-mini">`;
                }

                const formattedStatName = formatStatName(key);

                mainStatsHtml += `
                    <div class="comparison-stat-row ${troopType}">
                        <div class="stat-name">${iconHtml}${formattedStatName}</div>
                        <div class="stat-value">${valA.toFixed(isPercentage ? 1 : 0).replace('.0', '')}${suffix}</div>
                        <div class="stat-value">${valB.toFixed(isPercentage ? 1 : 0).replace('.0', '')}${suffix}</div>
                        <div class="delta-value">${deltaHtml}</div>
                    </div>
                `;
            });
        });

        let specialStatsHtml = '';

        const allSpecialKeys = Object.keys(statsA.special).concat(Object.keys(statsB.special));
        const uniqueSpecialKeys = [...new Set(allSpecialKeys)];

        if (uniqueSpecialKeys.length > 0) {
            specialStatsHtml += '<div class="comparison-special-row"><div class="comparison-special-title" style="border-bottom: 1px solid var(--border-color);">Extra Bonuses</div></div>';
            uniqueSpecialKeys.forEach(key => {
                const valA = statsA.special[key];
                const valB = statsB.special[key];
                
                const valueA_html = valA === true ? '<i class="fas fa-check"></i>' : (valA ? valA.toLocaleString() : '');
                const valueB_html = valB === true ? '<i class="fas fa-check"></i>' : (valB ? valB.toLocaleString() : '');

                 specialStatsHtml += `
                    <div class="comparison-special-row">
                        <div class="special-stat-name" style="grid-column: 1 / 2;">${key.replace(/<[^>]*>/g, '')}</div>
                        <div class="stat-value" style="grid-column: 2 / 3;">${valueA_html}</div>
                        <div class="stat-value" style="grid-column: 3 / 4;">${valueB_html}</div>
                        <div class="delta-value" style="grid-column: 4 / 5;"></div>
                    </div>
                `;
            });
        }
        
        for (let tier = 1; tier <= 5; tier++) {
            const allTierBonuses = [...new Set([...Object.keys(statsA.iconicBonusesByTier[tier]), ...Object.keys(statsB.iconicBonusesByTier[tier])])];
            
            if (allTierBonuses.length > 0) {
                 specialStatsHtml += `<div class="comparison-special-row"><div class="comparison-special-title" style="border-bottom: 1px solid var(--border-color);">Tier ${tier} Iconic Bonuses</div></div>`;
                 
                 allTierBonuses.forEach(bonusName => {
                    const valA = statsA.iconicBonusesByTier[tier][bonusName];
                    const valB = statsB.iconicBonusesByTier[tier][bonusName];
                    
                    const displayA = valA === true ? '<i class="fas fa-check"></i>' : (valA || '');
                    const displayB = valB === true ? '<i class="fas fa-check"></i>' : (valB || '');

                    specialStatsHtml += `<div class="comparison-special-row">
                        <div class="special-stat-name" style="grid-column: 1 / 2;">${bonusName}</div>
                        <div class="special-stat-value" style="grid-column: 2 / 3;">${displayA}</div>
                        <div class="special-stat-value" style="grid-column: 3 / 4;">${displayB}</div>
                        <div class="delta-value" style="grid-column: 4 / 5;"></div>
                    </div>`;
                 });
            }
        }

        const showExtraBonuses = extraBonusesToggle.checked;
        
        comparisonStatsContainer.innerHTML = `
        <div class="comparison-grid" id="comparison-main-stats-grid" style="opacity: ${showExtraBonuses ? 0 : 1}; pointer-events: ${showExtraBonuses ? 'none' : 'auto'};">
            <div class="comparison-header">Stats</div>
            <div class="comparison-header">Loadout A</div>
            <div class="comparison-header">Loadout B</div>
            <div class="comparison-header">Delta</div>
            ${mainStatsHtml}
        </div>
        <div class="comparison-grid" id="comparison-extra-bonuses-grid" style="opacity: ${showExtraBonuses ? 1 : 0}; pointer-events: ${showExtraBonuses ? 'auto' : 'none'}; grid-template-columns: 2fr 1fr 1fr 0.8fr;">
            <!-- Fixed headers to align 1-to-1 with columns -->
            <div class="comparison-header">Extra Bonuses</div>
            <div class="comparison-header">Loadout A</div>
            <div class="comparison-header">Loadout B</div>
            <div class="comparison-header"></div>
            ${specialStatsHtml ? specialStatsHtml : '<p class="no-items-placeholder" style="grid-column: 1 / -1;">No extra bonuses to display.</p>'}
        </div>`;
    }

    function initializeComparisonFeatures() {
        const filterOptions = `
            <button class="filter-option-btn" data-filter-type="all">All Stats</button>
            <button class="filter-option-btn stat-infantry" data-filter-type="infantry">Infantry</button>
            <button class="filter-option-btn stat-cavalry" data-filter-type="cavalry">Cavalry</button>
            <button class="filter-option-btn stat-archer" data-filter-type="archer">Archer</button>
            <button class="filter-option-btn stat-siege" data-filter-type="siege">Siege</button>`;
        if(comparisonFilterPanel) comparisonFilterPanel.querySelector('.filter-options').innerHTML = filterOptions;

        if(comparisonFilterToggleBtn) comparisonFilterToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            comparisonFilterPanel.classList.toggle('visible');
        });

        if(comparisonFilterPanel) comparisonFilterPanel.addEventListener('click', (e) => {
            if(e.target.matches('.filter-option-btn')) {
                const filterType = e.target.dataset.filterType;
                document.querySelectorAll('#comparison-main-stats-grid .comparison-stat-row').forEach(row => {
                    const isVisible = filterType === 'all' || Array.from(row.classList).includes(filterType);
                    row.style.display = isVisible ? 'contents' : 'none';
                });
                comparisonFilterPanel.querySelectorAll('.filter-option-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        if (!awakenModeBtn || !refineModeBtn || !kvkSeasonSelector) return;

        awakenModeBtn.addEventListener('click', () => setComparisonMode('awaken'));
        refineModeBtn.addEventListener('click', () => setComparisonMode('refine'));

        kvkSeasonSelector.addEventListener('change', (e) => {
            currentKvkSeason = e.target.value;
            updateComparisonDisplays();
            saveCalculatorState();
        });

        awakenLevelModal.addEventListener('click', (e) => {
            if (e.target.matches('.awaken-level-menu button')) {
                const level = parseInt(e.target.dataset.level, 10);
                setAwakenLevel(level);
            }
             if (e.target === awakenLevelModal) {
                awakenLevelModal.style.display = 'none';
            }
        });
        
        extraBonusesToggle.addEventListener('change', () => {
            const mainGrid = document.getElementById('comparison-main-stats-grid');
            const extraGrid = document.getElementById('comparison-extra-bonuses-grid');
            if (!mainGrid || !extraGrid) return;

            comparisonFilterToggleBtn.style.display = extraBonusesToggle.checked ? 'none' : 'flex';

            if (extraBonusesToggle.checked) {
                mainGrid.style.opacity = 0;
                mainGrid.style.pointerEvents = 'none';
                extraGrid.style.opacity = 1;
                extraGrid.style.pointerEvents = 'auto';
                comparisonFilterPanel.classList.remove('visible');
            } else {
                extraGrid.style.opacity = 0;
                extraGrid.style.pointerEvents = 'none';
                mainGrid.style.opacity = 1;
                mainGrid.style.pointerEvents = 'auto';
            }
        });
    }

    function setComparisonMode(mode) {
        if (currentComparisonMode === mode) {
            currentComparisonMode = 'none';
        } else {
            currentComparisonMode = mode;
        }
        awakenModeBtn.classList.toggle('active', currentComparisonMode === 'awaken');
        refineModeBtn.classList.toggle('active', currentComparisonMode === 'refine');
    }
    
    function toggleRefine(slotElement) {
        const loadoutIdentifier = slotElement.dataset.loadout;
        const slotKey = slotElement.dataset.slot;
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;

        if (targetLoadout[slotKey]) {
            targetLoadout[slotKey].refined = !targetLoadout[slotKey].refined;
            updateComparisonDisplays();
            saveCalculatorState();
        }
    }

    function openAwakenMenu(slotElement) {
        const loadoutIdentifier = slotElement.dataset.loadout;
        const slotKey = slotElement.dataset.slot;
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;

        const item = targetLoadout[slotKey];
        if (!item) return;

        const itemData = EQUIPMENT_DATA.find(d => d.id === item.id);
        let iconicInfo = ICONIC_DATA[itemData.name];
        
        if (!iconicInfo && itemData.quality === 'Legendary' && itemData.slot === 'accessory') {
            iconicInfo = ICONIC_DATA['Accessory'];
        }
        
        if (!iconicInfo) {
            showAlert("This item cannot be awakened.", "Notice");
            return;
        }

        activeComparisonSlot = slotElement;
        awakenItemName.textContent = `Awaken: ${itemData.name}`;
        awakenLevelModal.style.display = 'flex';
    }

    function setAwakenLevel(level) {
        if (!activeComparisonSlot) return;

        const loadoutIdentifier = activeComparisonSlot.dataset.loadout;
        const slotKey = activeComparisonSlot.dataset.slot;
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;

        if (targetLoadout[slotKey]) {
            targetLoadout[slotKey].awakenLevel = level;
            updateComparisonDisplays();
            saveCalculatorState();
        }
        awakenLevelModal.style.display = 'none';
        activeComparisonSlot = null;
    }

    function toRoman(num) {
        if (num < 1 || num > 5) return '';
        return ['I', 'II', 'III', 'IV', 'V'][num - 1];
    }

    function updateComparisonVisuals(loadoutIdentifier) {
        const loadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;
        
        Object.keys(SLOT_PLACEHOLDERS).forEach(slotKey => {
            const slotElement = document.getElementById(`slot-${loadoutIdentifier.toLowerCase()}-${slotKey}`);
            if (!slotElement) return;
    
            const item = loadout[slotKey];
            
            slotElement.classList.toggle('refined', !!(item && item.refined));
    
            let awakenEl = slotElement.querySelector('.awaken-level');
            if (item && item.awakenLevel > 0) {
                if (!awakenEl) {
                    awakenEl = document.createElement('span');
                    awakenEl.className = 'awaken-level';
                    slotElement.appendChild(awakenEl);
                }
                awakenEl.textContent = toRoman(item.awakenLevel);
            } else if (awakenEl) {
                awakenEl.remove();
            }
        });
    }

    function updateComparisonDisplays() {
        updateComparisonStats();
        updateComparisonVisuals('A');
        updateComparisonVisuals('B');
        updateLoadoutViews();
    }

    function updateLoadoutViews() {
        const viewMode = document.querySelector('#loadout-view-selector input:checked').value;
        handleDetailsToggle('A', viewMode);
        handleDetailsToggle('B', viewMode);
    }

    function handleDetailsToggle(loadoutIdentifier, viewMode) {
        const detailsList = loadoutIdentifier === 'A' ? compareLoadoutADetailsList : compareLoadoutBDetailsList;
        const grid = loadoutIdentifier === 'A' ? document.getElementById('compare-a-loadout-grid') : document.getElementById('compare-b-loadout-grid');

        if (viewMode !== 'default') {
            populateDetailsList(loadoutIdentifier, viewMode);
            grid.style.opacity = '0';
            grid.style.pointerEvents = 'none';
            detailsList.style.opacity = '1';
            detailsList.style.pointerEvents = 'auto';
        } else {
            grid.style.opacity = '1';
            grid.style.pointerEvents = 'auto';
            detailsList.style.opacity = '0';
            detailsList.style.pointerEvents = 'none';
        }
    }

    function populateDetailsList(loadoutIdentifier, viewMode) {
        const loadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;
        const detailsListElement = loadoutIdentifier === 'A' ? compareLoadoutADetailsList : compareLoadoutBDetailsList;
        
        detailsListElement.innerHTML = '';
        
        const slotOrder = ['helmet', 'weapon', 'chest', 'gloves', 'legs', 'boots', 'accessory1', 'accessory2'];
        const equippedItems = slotOrder
            .map(slot => loadout[slot])
            .filter(item => item && item.id);

        if (equippedItems.length === 0) {
            detailsListElement.innerHTML = '<p class="no-items-placeholder" style="text-align: center; color: var(--text-secondary); padding: var(--spacing-8) 0;">No items in this loadout.</p>';;
            return;
        }

        equippedItems.forEach(item => {
            const itemData = EQUIPMENT_DATA.find(i => i.id === item.id);
            if (!itemData) return;
            
            const individualStats = calculateLoadoutStats({ [itemData.slot]: item });

            let statsHtml = '<div class="details-item-stats">';
            if (viewMode === 'stats') {
                if(itemData.stats) {
                    Object.entries(itemData.stats)
                        .sort(([,a], [,b]) => b - a)
                        .forEach(([statKey, statValue]) => {
                            if(statValue > 0) {
                                const troopType = getTroopTypeFromStat(statKey);
                                statsHtml += `<div class="stat-pair ${troopType}"><span>${formatStatName(statKey)}</span> <span>+${statValue.toFixed(1).replace('.0','')}%</span></div>`;
                            }
                        });
                }
                if(itemData.special_stats) {
                     itemData.special_stats.forEach(stat => {
                        statsHtml += `<div class="special-stat">${stat}</div>`;
                    });
                }
            } else if (viewMode === 'iconic') {
                for (let tier = 1; tier <= 5; tier++) {
                   const tierEntries = Object.entries(individualStats.iconicBonusesByTier[tier]);
                   
                   if (tierEntries.length > 0) {
                       tierEntries.forEach(([statName, statValue]) => {
                          let fullText = '';

                          if (statValue === true) {
                              fullText = statName;
                          } 
                          else {
                              fullText = `${statName} ${statValue}`;
                          }
                          
                          const highlightedText = fullText.replace(
                              /([±+]?[\d,]+(?:\.\d+)?%?)/g, 
                              '<span style="color: #57f287;">$1</span>'
                          );

                          statsHtml += `
                              <div class="special-stat" style="color: #ffffff;">
                                   <strong style="color: var(--accent-yellow); margin-right: 4px;">Tier ${toRoman(tier)}:</strong> ${highlightedText}
                              </div>`;
                      });
                   }
                }
           }
            statsHtml += '</div>';

            if (statsHtml === '<div class="details-item-stats"></div>') {
                statsHtml = `<div class="details-item-stats"><p class="no-items-placeholder" style="font-size: 0.8em; text-align: left;">No ${viewMode === 'stats' ? 'standard stats' : 'iconic buffs'} on this item.</p></div>`;
            }

            const itemEl = document.createElement('div');
            itemEl.className = 'details-item';
            itemEl.innerHTML = `
                <img src="${getImagePath(itemData.image)}" alt="${itemData.name}" class="details-item-icon">
                <div class="details-item-details">
                    <span class="item-name ${itemData.quality}">${itemData.name}</span>
                    ${statsHtml}
                </div>`;
            detailsListElement.appendChild(itemEl);
        });
    }

    const clearLoadoutABtn = document.getElementById('clear-loadout-a-btn');
    const clearLoadoutBBtn = document.getElementById('clear-loadout-b-btn');

    function clearCompareLoadout(loadoutIdentifier) {
        const targetLoadout = loadoutIdentifier === 'A' ? compareLoadoutA : compareLoadoutB;
        
        for (const key in targetLoadout) delete targetLoadout[key];

        Object.keys(SLOT_PLACEHOLDERS).forEach(slotKey => {
            const slotElement = document.getElementById(`slot-${loadoutIdentifier.toLowerCase()}-${slotKey}`);
            if (slotElement) {
                slotElement.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${formatStatName(slotKey)} Slot">`;
                slotElement.classList.remove('refined');
                const awakenBadge = slotElement.querySelector('.awaken-level');
                if (awakenBadge) awakenBadge.remove();
            }
        });

        updateComparisonDisplays();
        saveCalculatorState();
    }

    if (clearLoadoutABtn) {
        clearLoadoutABtn.addEventListener('click', () => {
             clearCompareLoadout('A');
        });
    }

    if (clearLoadoutBBtn) {
        clearLoadoutBBtn.addEventListener('click', () => {
             clearCompareLoadout('B');
        });
    }

    initializeCalculator();
    
    window.restoreToolState = function(state) {
        if (state) {
            loadCalculatorState(state);
        }
    };
});