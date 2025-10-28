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

    const EQUIPMENT_DATA = [
        { id: 'pride_of_the_khan', name: "Pride of the Khan", slot: 'helmet', image: '/images/materials/equipment/pride_of_the_khan.webp', cost: { leather: 50, ebony: 10 } },
        { id: 'frost_treads', name: "Frost Treads", slot: 'boots', image: '/images/materials/equipment/frost_treads.webp', cost: { iron: 30, bone: 30 } },
        { id: 'set_glove', name: "Dragon's Breath", slot: 'gloves', image: '/images/materials/equipment/set_glove.webp', cost: { leather: 20, bone: 40 } },
        { id: 'set_weapon', name: "Dragon's Fang", slot: 'weapon', image: '/images/materials/equipment/set_weapon.webp', cost: { iron: 50, bone: 10 } },
        { id: 'set_chest', name: "Dragon's Hide", slot: 'chest', image: '/images/materials/equipment/set_chest.webp', cost: { ebony: 20, leather: 40 } },
        { id: 'set_leg', name: "Dragon's Scales", slot: 'legs', image: '/images/materials/equipment/set_leg.webp', cost: { iron: 20, leather: 40 } },
        { id: 'ring_of_doom', name: "Ring of Doom", slot: 'accessory', image: '/images/materials/equipment/ring_of_doom.webp', cost: { bone: 30, ebony: 30 } },
        { id: 'horn_of_fury', name: "Horn of Fury", slot: 'accessory', image: '/images/materials/equipment/horn_of_fury.webp', cost: { iron: 30, ebony: 30 } },
    ];

    const MATERIALS = ['iron', 'leather', 'ebony', 'bone'];
    const CHEST_MATERIAL = 'chest';
    const RARITIES = ['common', 'advanced', 'elite', 'epic', 'legendary'];

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
    const LEGENDARY_DIVISOR = 256;

    let selectedEquipment = { helmet: null, chest: null, weapon: null, gloves: null, legs: null, boots: null, accessory1: null, accessory2: null };
    let activeSlotId = null;

    const getMaterialIconPath = (mat) => {
        const iconName = mat === 'iron' ? 'ore' : mat;
        return `/images/materials/${iconName}_legendary.webp`;
    };

    function performCalculation() {
        const playerMaterials = {};
        MATERIALS.forEach(mat => playerMaterials[mat] = calculateTotalForMaterial(mat));
        const playerChests = calculateTotalForMaterial(CHEST_MATERIAL);

        const totalCost = { iron: 0, leather: 0, ebony: 0, bone: 0 };
        let equipmentIsSelected = false;
        Object.values(selectedEquipment).forEach(itemId => {
            if (itemId) {
                equipmentIsSelected = true;
                const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                if (itemData && itemData.cost) {
                    for (const mat in itemData.cost) {
                        totalCost[mat] += itemData.cost[mat];
                    }
                }
            }
        });

        let materialsAreInput = Object.values(playerMaterials).some(val => val > 0) || playerChests > 0;

        if (materialsAreInput && !equipmentIsSelected) {
            displayMaterialTotals(playerMaterials, playerChests);
        } else if (!materialsAreInput && equipmentIsSelected) {
            displayEquipmentCost(totalCost);
        } else if (materialsAreInput && equipmentIsSelected) {
            analyzeAndDisplayCrafting(playerMaterials, playerChests, totalCost);
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
        return Math.floor(commonEquivalent / LEGENDARY_DIVISOR);
    }

    function displayMaterialTotals(playerMaterials, playerChests) {
        resultDiv.style.display = 'block';
        let html = `<h3 class="result-status">Your Available Materials</h3>`;
        let resultGridItems = '';
        MATERIALS.forEach(mat => {
            if (playerMaterials[mat] > 0) {
                 resultGridItems += `
                    <div class="result-item">
                        <img src="${getMaterialIconPath(mat)}" alt="${mat}">
                        <div class="label">Total Legendary:</div>
                        <span class="value">${playerMaterials[mat].toLocaleString()}</span>
                    </div>`;
            }
        });
        if (playerChests > 0) {
            resultGridItems += `
                <div class="result-item">
                    <img src="/images/materials/chest_legendary.webp" alt="Chests">
                    <div class="label">Total Choice Chests:</div>
                    <span class="value">${playerChests.toLocaleString()}</span>
                </div>`;
        }
        if (!resultGridItems) resultGridItems = `<p style="grid-column: 1 / -1; color: var(--text-secondary);">No materials entered.</p>`;
        html += `<div class="result-grid">${resultGridItems}</div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }

    function displayEquipmentCost(totalCost) {
        resultDiv.style.display = 'block';
        let html = `<h3 class="result-status">Selected Equipment Cost</h3>`;
        let resultGridItems = '';
        MATERIALS.forEach(mat => {
            if (totalCost[mat] > 0) {
                 resultGridItems += `
                    <div class="result-item">
                        <img src="${getMaterialIconPath(mat)}" alt="${mat}">
                        <div class="label">Total Needed:</div>
                        <span class="value">${totalCost[mat].toLocaleString()}</span>
                    </div>`;
            }
        });
        if (!resultGridItems) resultGridItems = `<p style="grid-column: 1 / -1; color: var(--text-secondary);">No equipment selected.</p>`;
        html += `<div class="result-grid">${resultGridItems}</div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }

    function analyzeAndDisplayCrafting(playerMaterials, playerChests, totalCost) {
        let neededFromChests = 0;
        let totalMaterialOwned = 0;
        let totalMaterialCost = 0;
    
        MATERIALS.forEach(mat => {
            const deficit = totalCost[mat] - playerMaterials[mat];
            if (deficit > 0) neededFromChests += deficit;
            totalMaterialCost += totalCost[mat];
            totalMaterialOwned += playerMaterials[mat];
        });
    
        totalMaterialOwned += playerChests;
    
        const canCraft = neededFromChests <= playerChests;
        
        resultDiv.style.display = 'block';
        let html = canCraft 
            ? `<h3 class="result-status craftable"><i class="fas fa-check-circle"></i> Loadout is Craftable</h3>`
            : `<h3 class="result-status not-craftable">Insufficient Materials</h3>`;
    
        let materialItemsHtml = '';
        MATERIALS.forEach(mat => {
            const have = playerMaterials[mat];
            const needed = totalCost[mat];
            if (have === 0 && needed === 0) return;
    
            const leftover = Math.max(0, have - needed);
            const shortBy = Math.max(0, needed - have);
    
            materialItemsHtml += `
                <div class="result-item">
                    <img src="${getMaterialIconPath(mat)}" alt="${mat}">
                    <div class="label">Your total: <span class="value">${have.toLocaleString()}</span></div>
                    <div class="label">Needed: <span class="value">${needed.toLocaleString()}</span></div>
                    <div class="label">Leftover: <span class="value surplus">${leftover.toLocaleString()}</span></div>
                    ${shortBy > 0 ? `<div class="label">Short by: <span class="value shortage">${shortBy.toLocaleString()}</span></div>` : ''}
                </div>`;
        });
        
        const leftoverChests = playerChests - neededFromChests;
        
        if (playerChests > 0 || neededFromChests > 0) {
            materialItemsHtml += `
                <div class="result-item">
                    <img src="/images/materials/chest_legendary.webp" alt="Chests">
                    <div class="label">Your total: <span class="value">${playerChests.toLocaleString()}</span></div>
                    <div class="label">Needed: <span class="value">${neededFromChests.toLocaleString()}</span></div>
                    <div class="label">Leftover: <span class="value ${leftoverChests < 0 ? 'shortage' : 'surplus'}">${Math.max(0, leftoverChests).toLocaleString()}</span></div>
                    ${leftoverChests < 0 ? `<div class="label">Short by: <span class="value shortage">${Math.abs(leftoverChests).toLocaleString()}</span></div>` : ''}
                </div>
            `;
        }
    
        let summaryHtml = `
            <div class="result-item">
                <img src="/images/materials/materials_icon.webp" alt="Total Materials">
                <div class="label">Total Mats Needed:</div>
                <span class="value">${totalMaterialCost.toLocaleString()}</span>
            </div>
            <div class="result-item">
                <img src="/images/materials/materials_icon.webp" alt="Total Materials">
                <div class="label">Total Mats Owned:</div>
                <span class="value">${totalMaterialOwned.toLocaleString()}</span>
            </div>
        `;

        html += `<div class="result-grid">${materialItemsHtml}<div class="result-separator"></div>${summaryHtml}</div>`;
        resultDiv.innerHTML = html;
        triggerSuccessAnimation(resultDiv);
    }


    function openModalForSlot(slotElement) {
        activeSlotId = slotElement.id;
        const slotType = slotElement.dataset.slot;
        
        modalTitle.textContent = `Select ${slotType.charAt(0).toUpperCase() + slotType.slice(1)}`;
        
        const relevantItems = EQUIPMENT_DATA.filter(item => item.slot === slotType);
        modalGrid.innerHTML = '';
        
        relevantItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'modal-item';
            itemEl.dataset.itemId = item.id;
            itemEl.innerHTML = `<img src="${item.image}" alt="${item.name}"><span>${item.name}</span>`;
            itemEl.addEventListener('click', () => selectItem(item.id));
            modalGrid.appendChild(itemEl);
        });
        
        modal.style.display = 'flex';
        modalSearch.value = '';
        modalSearch.focus();
    }

    function closeModal() {
        modal.style.display = 'none';
        activeSlotId = null;
    }

    function selectItem(itemId) {
        const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
        if (!itemData || !activeSlotId) return;
    
        const slotElement = document.getElementById(activeSlotId);
        if (!slotElement) return;
    
        const slotKey = activeSlotId.replace('slot-', '');
        selectedEquipment[slotKey] = itemId;
        
        slotElement.innerHTML = `<img src="${itemData.image}" alt="${itemData.name}">`;
        
        closeModal();
        updateSelectedItemsDisplay();
        if (calculateBtn.style.display === 'none') performCalculation();
    }

    function removeItem(slotKey) {
        selectedEquipment[slotKey] = null;
        const slotElement = document.getElementById(`slot-${slotKey}`);
        if(slotElement) {
            slotElement.innerHTML = `<img src="${SLOT_PLACEHOLDERS[slotKey]}" alt="${slotKey} Slot">`;
        }
        updateSelectedItemsDisplay();
        if (calculateBtn.style.display === 'none') performCalculation();
    }
    
    function updateSelectedItemsDisplay() {
        selectedItemsList.innerHTML = '';
        let hasSelection = false;
        for (const slotKey in selectedEquipment) {
            const itemId = selectedEquipment[slotKey];
            if (itemId) {
                hasSelection = true;
                const itemData = EQUIPMENT_DATA.find(item => item.id === itemId);
                if (itemData) {
                    let costHtml = '<div class="selected-item-cost">';
                    if(itemData.cost) {
                        for(const mat in itemData.cost) {
                            costHtml += `
                                <div class="cost-pair">
                                    <img src="${getMaterialIconPath(mat)}" alt="${mat}">
                                    <span>${itemData.cost[mat]}</span>
                                </div>
                            `;
                        }
                    }
                    costHtml += '</div>';

                    const itemEl = document.createElement('div');
                    itemEl.className = 'selected-item';
                    itemEl.innerHTML = `
                        <img src="${itemData.image}" alt="${itemData.name}" class="selected-item-icon">
                        <div class="selected-item-details">
                            <span class="selected-item-name">${itemData.name}</span>
                            ${costHtml}
                        </div>
                        <button class="remove-item-btn" data-slot-key="${slotKey}">&times;</button>
                    `;
                    selectedItemsList.appendChild(itemEl);
                }
            }
        }
        selectedItemsList.style.display = hasSelection ? 'flex' : 'none';
        
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeItem(e.currentTarget.dataset.slotKey));
        });
    }

    function filterModalItems() {
        const searchTerm = modalSearch.value.toLowerCase();
        const items = modalGrid.querySelectorAll('.modal-item');
        items.forEach(item => {
            const itemName = item.querySelector('span').textContent.toLowerCase();
            item.classList.toggle('hidden', !itemName.includes(searchTerm));
        });
    }
    
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

    loadoutSlots.forEach(slot => slot.addEventListener('click', () => openModalForSlot(slot)));
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    modalSearch.addEventListener('input', filterModalItems);

    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth;
        element.classList.add('result-success');
    }
});