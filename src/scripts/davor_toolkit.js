document.addEventListener('DOMContentLoaded', () => {

    const equipmentSets = {
        cavalry: {
            "Budget": ["Expedition War Helm", "Heart of the Saint", "Heavy Armor of the Hellish Wasteland", "Navar's Control", "Gladiator", "Boots of the Hellish Wasteland"],
            "4 Piece Set": ["War Helm of the Hellish Wasteland", "Lance of the Hellish Wasteland", "Heavy Armor of the Hellish Wasteland", "Navar's Control", "Ash of the Dawn", "Boots of the Hellish Wasteland"],
            "2/2/2": ["Pride of the Khan", "Sacred Dominion", "Heavy Armor of the Hellish Wasteland", "Navar's Control", "Ash of the Dawn", "Boots of the Hellish Wasteland"],
        },
        infantry: {
            "Budget": ["Gold Helm of the Eternal Empire", "Gatekeeper's Shield", "Hope Cloak", "Vambraces of the Eternal Empire", "Karuak's Humility", "Sturdy Boots of the Eternal Empire"],
            "Budget+": ["Gold Helm of the Eternal Empire", "Gatekeeper's Shield", "Hope Cloak", "Vambraces of the Eternal Empire", "Eternal Night", "Sturdy Boots of the Eternal Empire"],
            "2/2/2": ["Helm of the Conqueror", "Hammer of the Sun and Moon", "Hope Cloak", "Vambraces of the Eternal Empire", "Eternal Night", "Sturdy Boots of the Eternal Empire"],
            "4 Piece Set + KvK": ["Helm of the Conqueror", "Hammer of the Sun and Moon", "Plate of the Eternal Empire", "Vambraces of the Eternal Empire", "Greaves of the Eternal Empire", "Sturdy Boots of the Eternal Empire"],
        },
        archer: {
            "Budget": ["Revival Helm", "Golden Age", "Revival Plate", "Revival Gauntlets", "Revival Greaves", "Flame Treads"],
            "6 Piece Set": ["Dragon's Breath Helm", "Dragon's Breath Bow", "Dragon's Breath Plate", "Dragon's Breath Vambraces", "Dragon's Breath Tassets", "Dragon's Breath Boots"],
            "4 Piece Set": ["Dragon's Breath Helm", "Dragon's Breath Bow", "Dragon's Breath Plate", "Dragon's Breath Vambraces", "Chausses of the Glorious Goddess", "Greaves of the Glorious Goddess"],
            "4 Piece Set Alternate": ["Dragon's Breath Helm", "Dragon's Breath Bow", "Dragon's Breath Plate", "Gauntlets of the Glorious Goddess", "Chausses of the Glorious Goddess", "Dragon's Breath Boots"],
            "4 Piece Set + KvK": ["Ancestral Mask of Night", "The Hydra's Blast", "Dragon's Breath Plate", "Dragon's Breath Vambraces", "Dragon's Breath Tassets", "Dragon's Breath Boots"],
        },
        engineering: {
            "Budget": ["Knight's Steel Diadem", "Knight's Oathsworn Bow", "Knight's Valorous Cloak", "Knight's Battleworn Gauntlets", "Knight's Triumphant Tassets", "Knight's Winter Sabatons"],
            "Legendary Set": ["Fierce Wolf's Helmet", "Twilight Epiphany", "Vigilant Wolf's Leather Armor", "Wailing Wolf's Gauntlets", "Lone Wolf's Leather Tassets", "Roaring Wolf's Claws"],
        }
    };

    const commanderPairings = {
        cavalry: [
            "Alexander Nevsky / Joan of Arc Prime", "Arthur Pendragon / Achilles", "Arthur Pendragon / Hector", "Arthur Pendragon / Philip II", "Arthur Pendragon / William I", "Attila / Philip II", "Huo Qubing / Arthur Pendragon", "Huo Qubing / Belisarius Prime", "Huo Qubing / Joan of Arc Prime", "Joan of Arc Prime / Arthur Pendragon"
        ],
        infantry: ["Bai Qi / Liu Che", "Bai Qi / William Wallace", "Liu Che / Alexander the Great", "Liu Che / Philip II", "Ragnar Lodbrok Prime / Scipio Africanus Prime"],
        archer: [
            "Ashurbanipal / Hermann Prime", "Qin Shi Huang / Yi Seong-Gye", "Qin Shi Huang / Zhuge Liang", "Shajar al-Durr / Yi Seong-Gye", "Zhuge Liang / Hermann Prime", "Zhuge Liang / Philip II"
        ],
        engineering: ["Gajah Mada / Gonzalo de Cordoba"]
    };

    const scalingData = {
        "Huo Qubing / Arthur Pendragon": {
            "Cavalry Set 1": { allDamage: 1, health: 2.4, defense: 2.75, attack: 2.9 },
            "Cavalry Set 2": { allDamage: 1, health: 2.4, defense: 2.6, attack: 3.1 },
            "Cavalry Set 3": { allDamage: 1, health: 2.4, defense: 2.65, attack: 3.1 }
        },
        "Huo Qubing / Joan of Arc Prime": {
            "Cavalry Set 1": { allDamage: 1, health: 2.3, defense: 2.75, attack: 2.8 },
            "Cavalry Set 2": { allDamage: 1, health: 2.3, defense: 2.6, attack: 2.95 },
            "Cavalry Set 3": { allDamage: 1, health: 2.3, defense: 2.6, attack: 3 }
        },
        "Huo Qubing / Belisarius Prime": {
            "Cavalry Set 1": { allDamage: 1, health: 1.95, defense: 2.65, attack: 2.55 },
            "Cavalry Set 2": { allDamage: 1, health: 2, defense: 2.55, attack: 2.75 },
            "Cavalry Set 3": { allDamage: 1, health: 2, defense: 2.6, attack: 2.8 }
        },
        "Alexander Nevsky / Joan of Arc Prime": {
            "Cavalry Set 1": { allDamage: 1, health: 2.3, defense: 2.35, attack: 2.35 },
            "Cavalry Set 2": { allDamage: 1, health: 2.35, defense: 2.25, attack: 2.5 },
            "Cavalry Set 3": { allDamage: 1, health: 2.35, defense: 2.3, attack: 2.6 }
        },
        "Joan of Arc Prime / Arthur Pendragon": {
            "Cavalry Set 1": { allDamage: 1, health: 2.5, defense: 2.4, attack: 2.7 },
            "Cavalry Set 2": { allDamage: 1, health: 2.5, defense: 2.25, attack: 2.9 },
            "Cavalry Set 3": { allDamage: 1, health: 2.45, defense: 2.3, attack: 2.9 }
        },
        "Arthur Pendragon / William I": {
            "Cavalry Set 1": { allDamage: 1, health: 2.15, defense: 2.35, attack: 2.65 },
            "Cavalry Set 2": { allDamage: 1, health: 2.15, defense: 2.25, attack: 2.8 },
            "Cavalry Set 3": { allDamage: 1, health: 2.2, defense: 2.25, attack: 2.8 }
        },
        "Arthur Pendragon / Philip II": {
            "Cavalry Set 1": { allDamage: 1, health: 1.85, defense: 1.85, attack: 2.2 },
            "Cavalry Set 2": { allDamage: 1, health: 1.85, defense: 1.75, attack: 2.35 },
            "Cavalry Set 3": { allDamage: 1, health: 1.85, defense: 1.8, attack: 2.4 }
        },
        "Arthur Pendragon / Achilles": {
            "Cavalry Set 1": { allDamage: 1, health: 2.46, defense: 2.39, attack: 2.87 },
            "Cavalry Set 2": { allDamage: 1, health: 2.47, defense: 2.26, attack: 3.06 },
            "Cavalry Set 3": { allDamage: 1, health: 2.47, defense: 2.29, attack: 3.11 }
        },
        "Arthur Pendragon / Hector": {
            "Cavalry Set 1": { allDamage: 1, health: 2.25, defense: 2.44, attack: 2.28 },
            "Cavalry Set 2": { allDamage: 1, health: 2.26, defense: 2.32, attack: 2.45 },
            "Cavalry Set 3": { allDamage: 1, health: 2.26, defense: 2.36, attack: 2.49 }
        },
        "Attila / Philip II": {
            "Cavalry Set 1": { allDamage: 1, health: 1.55, defense: 1.75, attack: 2.1 },
            "Cavalry Set 2": { allDamage: 1, health: 1.6, defense: 1.65, attack: 2.25 },
            "Cavalry Set 3": { allDamage: 1, health: 1.6, defense: 1.7, attack: 2.35 }
        },
        "Bai Qi / Liu Che": {
            "Infantry Set 1": { allDamage: 1, health: 2.2, defense: 2.75, attack: 2.7 },
            "Infantry Set 2": { allDamage: 1, health: 2, defense: 2.9, attack: 2.9 },
            "Infantry Set 3": { allDamage: 1, health: 2, defense: 2.9, attack: 2.95 },
            "Infantry Set 4": { allDamage: 1, health: 2, defense: 2.7, attack: 3.15 }
        },
        "Bai Qi / William Wallace": {
            "Infantry Set 1": { allDamage: 1, health: 2.25, defense: 2.55, attack: 2.8 },
            "Infantry Set 2": { allDamage: 1, health: 2.05, defense: 2.7, attack: 3 },
            "Infantry Set 3": { allDamage: 1, health: 2.05, defense: 2.7, attack: 3.05 },
            "Infantry Set 4": { allDamage: 1, health: 2.05, defense: 2.5, attack: 3.2 }
        },
        "Liu Che / Philip II": {
            "Infantry Set 1": { allDamage: 1, health: 1.6, defense: 2.4, attack: 1.8 },
            "Infantry Set 2": { allDamage: 1, health: 1.45, defense: 2.5, attack: 1.95 },
            "Infantry Set 3": { allDamage: 1, health: 1.45, defense: 2.55, attack: 2 },
            "Infantry Set 4": { allDamage: 1, health: 1.45, defense: 2.35, attack: 2.15 }
        },
        "Liu Che / Alexander the Great": {
            "Infantry Set 1": { allDamage: 1, health: 2.05, defense: 2.95, attack: 2.6 },
            "Infantry Set 2": { allDamage: 1, health: 1.85, defense: 3, attack: 2.8 },
            "Infantry Set 3": { allDamage: 1, health: 1.85, defense: 3.1, attack: 2.8 },
            "Infantry Set 4": { allDamage: 1, health: 1.85, defense: 2.9, attack: 3.05 }
        },
        "Ragnar Lodbrok Prime / Scipio Africanus Prime": {
            "Infantry Set 1": { allDamage: 1, health: 2.3, defense: 2.95, attack: 2.6 },
            "Infantry Set 2": { allDamage: 1, health: 2.1, defense: 3.1, attack: 2.8 },
            "Infantry Set 3": { allDamage: 1, health: 2.1, defense: 3.1, attack: 2.85 },
            "Infantry Set 4": { allDamage: 1, health: 2.1, defense: 2.9, attack: 3.1 }
        },
        "Qin Shi Huang / Zhuge Liang": {
            "Archer Set 1": { allDamage: 1, health: 2.1, defense: 2.25, attack: 2.05 },
            "Archer Set 2": { allDamage: 1, health: 2.2, defense: 2.2, attack: 2.15 },
            "Archer Set 3": { allDamage: 1, health: 2.25, defense: 2.15, attack: 2.1 },
            "Archer Set 4": { allDamage: 1, health: 2.2, defense: 2.25, attack: 2 },
            "Archer Set 5": { allDamage: 1, health: 2.1, defense: 2.2, attack: 2.2 }
        },
        "Qin Shi Huang / Yi Seong-Gye": {
            "Archer Set 1": { allDamage: 1, health: 1.4, defense: 1.8, attack: 1.6 },
            "Archer Set 2": { allDamage: 1, health: 1.45, defense: 1.75, attack: 1.7 },
            "Archer Set 3": { allDamage: 1, health: 1.5, defense: 1.7, attack: 1.6 },
            "Archer Set 4": { allDamage: 1, health: 1.45, defense: 1.8, attack: 1.6 },
            "Archer Set 5": { allDamage: 1, health: 1.4, defense: 1.8, attack: 1.7 }
        },
        "Zhuge Liang / Hermann Prime": {
            "Archer Set 1": { allDamage: 1, health: 2.2, defense: 2.7, attack: 2.65 },
            "Archer Set 2": { allDamage: 1, health: 2.3, defense: 2.6, attack: 2.7 },
            "Archer Set 3": { allDamage: 1, health: 2.4, defense: 2.55, attack: 2.65 },
            "Archer Set 4": { allDamage: 1, health: 2.3, defense: 2.7, attack: 2.6 },
            "Archer Set 5": { allDamage: 1, health: 2.25, defense: 2.65, attack: 2.8 }
        },
        "Zhuge Liang / Philip II": {
            "Archer Set 1": { allDamage: 1, health: 2, defense: 1.95, attack: 1.9 },
            "Archer Set 2": { allDamage: 1, health: 2.05, defense: 1.85, attack: 2 },
            "Archer Set 3": { allDamage: 1, health: 2.1, defense: 1.85, attack: 1.9 },
            "Archer Set 4": { allDamage: 1, health: 2.1, defense: 1.9, attack: 1.85 },
            "Archer Set 5": { allDamage: 1, health: 2, defense: 1.9, attack: 2 }
        },
        "Ashurbanipal / Hermann Prime": {
            "Archer Set 1": { allDamage: 1, health: 1.9, defense: 2.9, attack: 2.75 },
            "Archer Set 2": { allDamage: 1, health: 2, defense: 2.75, attack: 2.85 },
            "Archer Set 3": { allDamage: 1, health: 2.1, defense: 2.75, attack: 2.75 },
            "Archer Set 4": { allDamage: 1, health: 2.05, defense: 2.85, attack: 2.7 },
            "Archer Set 5": { allDamage: 1, health: 1.95, defense: 2.8, attack: 2.9 }
        },
        "Shajar al-Durr / Yi Seong-Gye": {
            "Archer Set 1": { allDamage: 1, health: 2.25, defense: 2.7, attack: 2.55 },
            "Archer Set 2": { allDamage: 1, health: 2.3, defense: 2.6, attack: 2.65 },
            "Archer Set 3": { allDamage: 1, health: 2.45, defense: 2.55, attack: 2.55 },
            "Archer Set 4": { allDamage: 1, health: 2.4, defense: 2.7, attack: 2.5 },
            "Archer Set 5": { allDamage: 1, health: 2.3, defense: 2.6, attack: 2.7 }
        },
        "Gajah Mada / Gonzalo de Cordoba": {
            "Engineering Set 1": { allDamage: 1, health: 2, defense: 2.1, attack: 2.45 },
            "Engineering Set 2": { allDamage: 1, health: 2, defense: 2.2, attack: 2.65 }
        }
    };

    const equipmentData = window.equipmentData || [];

    function getImagePath(filename) {
        if (window.DAVOR_IMAGE_PATHS && window.DAVOR_IMAGE_PATHS[filename]) {
            return window.DAVOR_IMAGE_PATHS[filename];
        }
        console.warn(`Image path for "${filename}" not found.`);
        return '';
    }

    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = document.getElementById('next-slide');
    const prevButton = document.getElementById('prev-slide');
    const quickNav = document.getElementById('quick-access-nav');
    const mainTitle = document.getElementById('calculator-main-title');
    const mainDescription = document.getElementById('calculator-main-description');
    let currentIndex = 0;

    const moveToSlide = (targetIndex) => {
        if (!slides.length || !slides[targetIndex]) return;
        
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === targetIndex);
        });
        currentIndex = targetIndex;
        updateCarouselUI();
        if(slides[currentIndex].dataset.title === "Score my Armaments") {
            initArmamentCalculator();
        }
    };

    const updateCarouselUI = () => {
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;
        
        const davorIconHtml = `<img src="${window.davorIconPath}" width="${window.davorIconWidth}" height="${window.davorIconHeight}" alt="Davor Icon" class="davor-title-icon" loading="eager">`;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            mainTitle.innerHTML = `${currentSlide.dataset.title}<span class="davor-byline">by Davor ${davorIconHtml}</span>`;
        } else {
            mainTitle.innerHTML = `${currentSlide.dataset.title} by Davor ${davorIconHtml}`;
        }
        
        mainDescription.textContent = currentSlide.dataset.description;

        if(quickNav){
            Array.from(quickNav.children).forEach((btn, index) => btn.classList.toggle('active', index === currentIndex));
        }
        if(prevButton && nextButton){
            prevButton.classList.toggle('disabled', currentIndex === 0);
            nextButton.classList.toggle('disabled', currentIndex === slides.length - 1);
        }
    };
    
    if (nextButton && prevButton) {
        nextButton.addEventListener('click', () => { if (currentIndex < slides.length - 1) moveToSlide(currentIndex + 1); });
        prevButton.addEventListener('click', () => { if (currentIndex > 0) moveToSlide(currentIndex - 1); });
    }

    if (quickNav) {
        slides.forEach((slide, index) => {
            const button = document.createElement('button');
            button.classList.add('quick-access-btn');
            const loadingAttr = index === 0 ? 'loading="eager"' : 'loading="lazy"';
            
            let iconHtml = '';
            if (slide.dataset.icon) {
                iconHtml = `<img src="${slide.dataset.icon}" alt="" ${loadingAttr}>`;
            }

            button.innerHTML = `${iconHtml}<span>${slide.dataset.title}</span>`;
            button.addEventListener('click', () => moveToSlide(index));
            quickNav.appendChild(button);
        });
    }

    const troopTypeSelector = document.getElementById('troop-type-selector');
    const pairingSelector = document.getElementById('pairing-selector');
    const equipmentDisplay = document.getElementById('equipment-display');
    const prevSetBtn = document.getElementById('prev-set');
    const nextSetBtn = document.getElementById('next-set');
    const paginationDots = document.getElementById('pagination-dots');
    const resultDisplay = document.getElementById('result-display');
    const statWeightsTitle = document.getElementById('stat-weights-title');
    const statWeightsEl = document.getElementById('stat-weights');
    const allDamageInput = document.getElementById('all-damage-input');
    const healthInput = document.getElementById('health-input');
    const conversionLabel = document.getElementById('conversion-label');
    const conversionResultEl = document.getElementById('conversion-result');
    const conversionOutputEl = document.getElementById('conversion-output');
    let state = { troopType: 'cavalry', pairing: null, equipmentSet: null, equipmentSetIndex: 0 };
    
    function updatePairingSelector() {
        if (!pairingSelector) return;
        pairingSelector.classList.add('fade-out');
    
        setTimeout(() => {
            pairingSelector.innerHTML = '';
            const pairings = commanderPairings[state.troopType] || [];
            pairings.forEach((pairing, index) => {
                const [primary, secondary] = pairing.split(' / ');
                const primaryFilename = `${primary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
                const secondaryFilename = `${secondary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
    
                const primaryImg = getImagePath(primaryFilename);
                const secondaryImg = getImagePath(secondaryFilename);
                
                const div = document.createElement('div');
                div.className = 'pairing-item';
                div.dataset.pairing = pairing;
                const loadingAttr = index < 3 ? 'loading="eager"' : 'loading="lazy"';

                div.innerHTML = `
                    <div class="pairing-images">
                        <img src="${primaryImg}" alt="${primary}" class="commander-icon" ${loadingAttr}>
                        <img src="${secondaryImg}" alt="${secondary}" class="commander-icon secondary" ${loadingAttr}>
                    </div>
                    <span>${pairing}</span>
                `;
                pairingSelector.appendChild(div);
            });
            
            pairingSelector.classList.remove('fade-out');
        }, 150);
    }

    function showEquipmentSet(index) {
        if (!equipmentDisplay) return;
        equipmentDisplay.classList.add('fade-out');
    
        setTimeout(() => {
            const sets = equipmentSets[state.troopType];
            const setNames = Object.keys(sets);
            if (index < 0 || index >= setNames.length) return;
    
            state.equipmentSetIndex = index;
            const setName = setNames[index];
            state.equipmentSet = setName;
    
            const pieceNames = sets[setName];
            const setPieces = pieceNames.map(name => equipmentData.find(p => p.name === name)).filter(Boolean);
    
            let equipmentHtml = `<div class="equipment-loadout-shape">`;
            const slotMap = { helmet: null, weapon: null, chest: null, gloves: null, legs: null, boots: null, accessory1: null, accessory2: null };
            
            setPieces.forEach(piece => {
                if (piece.slot === 'accessory') {
                    if (!slotMap.accessory1) slotMap.accessory1 = piece;
                    else if (!slotMap.accessory2) slotMap.accessory2 = piece;
                } else {
                    slotMap[piece.slot] = piece;
                }
            });

            const isFirstCavSet = state.troopType === 'cavalry' && setName === 'Budget';
        
            for (const slot in slotMap) {
                const piece = slotMap[slot];
                if (piece) {
                    const imageSrc = getImagePath(piece.image);
                    const loadingAttr = (isFirstCavSet && slot === 'helmet') ? 'loading="eager"' : 'loading="lazy"';
                    equipmentHtml += `<div class="equipment-slot" data-slot="${slot}"><img src="${imageSrc}" alt="${piece.name}" ${loadingAttr}></div>`;
                }
            }
        
            equipmentHtml += `</div><span class="equipment-set-name">${setName}</span>`;
            equipmentDisplay.innerHTML = equipmentHtml;
            equipmentDisplay.dataset.setName = setName;
            
            equipmentDisplay.classList.remove('fade-out');
            
            updatePaginationDots();
            calculateAndDisplay();
        }, 150);
    }
    
    function updatePaginationDots() {
        if (!paginationDots) return;
        const setNames = Object.keys(equipmentSets[state.troopType]);
        paginationDots.innerHTML = '';
        setNames.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = 'dot';
            if (index === state.equipmentSetIndex) {
                dot.classList.add('active');
            }
            paginationDots.appendChild(dot);
        });
    }

    function updateWeightingUI() {
        if(!pairingSelector) return;
        state.pairing = null;
        state.equipmentSetIndex = 0;
        updatePairingSelector();
        showEquipmentSet(0);
    
        const firstPairingItem = pairingSelector.querySelector('.pairing-item');
        if (firstPairingItem) {
            firstPairingItem.classList.add('active');
            state.pairing = firstPairingItem.dataset.pairing;
        }
    
        resultDisplay.style.display = 'none';
        conversionOutputEl.innerHTML = '';
        conversionLabel.textContent = '';
        allDamageInput.value = '';
        healthInput.value = '';
    
        if (state.pairing && (allDamageInput.value || healthInput.value)) {
            calculateAndDisplay();
        }
    }

    function calculateAndDisplay() {
        if (!state.pairing || state.equipmentSet === null || !resultDisplay) {
            if(resultDisplay) resultDisplay.classList.add('fade-out');
            if(conversionResultEl) conversionResultEl.classList.add('fade-out');
            return;
        }
    
        const troopType = state.troopType;
        const capitalizedTroopType = troopType.charAt(0).toUpperCase() + troopType.slice(1);
        const setIndex = state.equipmentSetIndex + 1;
        const scaleKey = `${capitalizedTroopType} Set ${setIndex}`;
        const scales = scalingData[state.pairing]?.[scaleKey];
    
        if (!scales) {
            resultDisplay.classList.add('fade-out');
            conversionResultEl.classList.add('fade-out');
            return;
        }
        
        statWeightsTitle.textContent = `Stat Weights for ${state.pairing}:`;
        statWeightsEl.innerHTML = `<strong>1%</strong> All Damage = <strong>${scales.health}%</strong> Health = <strong>${scales.defense}%</strong> Defense = <strong>${scales.attack}%</strong> Attack`;
        
        resultDisplay.style.display = 'block';
        resultDisplay.classList.remove('fade-out');
    
        const allDamage = parseFloat(allDamageInput.value);
        const health = parseFloat(healthInput.value);
        let outputHtml = '';
        let labelText = '';
    
        if (!isNaN(allDamage) && allDamageInput.value) {
            labelText = "What is the minimum Health needed for an upgrade?";
            const equivalentHealth = (allDamage * scales.health + 0.1).toFixed(1);
            outputHtml = `To upgrade from <strong>${allDamage}%</strong> All Damage, you will need <strong id="result-value">${equivalentHealth}%</strong> Health or higher.`;
        } else if (!isNaN(health) && healthInput.value) {
            labelText = "What is the minimum All Damage needed for an upgrade?";
            const equivalentDamage = (health / scales.health + 0.1).toFixed(1);
            outputHtml = `To upgrade from <strong>${health}%</strong> Health, you will need <strong id="result-value">${equivalentDamage}%</strong> All Damage or higher.`;
        }
    
        conversionLabel.textContent = labelText;
        conversionOutputEl.innerHTML = outputHtml ? `<span>${outputHtml}</span>` : '';
    
        if (outputHtml) {
            conversionResultEl.classList.remove('fade-out');
            triggerSuccessAnimation(conversionResultEl);
        } else {
            conversionResultEl.classList.add('fade-out');
        }
    }

    if (troopTypeSelector) {
        troopTypeSelector.addEventListener('click', e => {
            const button = e.target.closest('.selector-btn');
            if (button) {
                troopTypeSelector.querySelector('.active').classList.remove('active');
                button.classList.add('active');
                state.troopType = button.dataset.type;
                updateWeightingUI();
            }
        });
    }

    if (pairingSelector) {
        pairingSelector.addEventListener('click', e => {
            const item = e.target.closest('.pairing-item');
            if (item) {
                const currentActive = pairingSelector.querySelector('.active');
                if (currentActive) currentActive.classList.remove('active');
                item.classList.add('active');
                state.pairing = item.dataset.pairing;
                calculateAndDisplay();
            }
        });
    }
    
    if(prevSetBtn) prevSetBtn.addEventListener('click', () => {
        const numSets = Object.keys(equipmentSets[state.troopType]).length;
        const newIndex = (state.equipmentSetIndex - 1 + numSets) % numSets;
        showEquipmentSet(newIndex);
    });

    if(nextSetBtn) nextSetBtn.addEventListener('click', () => {
        const numSets = Object.keys(equipmentSets[state.troopType]).length;
        const newIndex = (state.equipmentSetIndex + 1) % numSets;
        showEquipmentSet(newIndex);
    });

    if (allDamageInput) allDamageInput.addEventListener('input', () => {
        if (allDamageInput.value) healthInput.value = '';
        calculateAndDisplay();
    });

    if (healthInput) healthInput.addEventListener('input', () => {
        if (healthInput.value) allDamageInput.value = '';
        calculateAndDisplay();
    });

    const armamentTroopSelector = document.getElementById('armament-troop-selector');
    const armamentPairingSelector = document.getElementById('armament-pairing-selector');
    const formationSelector = document.getElementById('formation-selector');
    const inscriptionSearch = document.getElementById('inscription-search');
    const inscriptionSelector = document.getElementById('inscription-selector');
    const selectedInscriptionsDisplay = document.getElementById('selected-inscriptions-display');
    const armamentAttackInput = document.getElementById('armament-attack');
    const armamentDefenseInput = document.getElementById('armament-defense');
    const armamentHealthInput = document.getElementById('armament-health');
    const armamentAllDamageInput = document.getElementById('armament-all-damage');
    const armamentScoreResult = document.getElementById('armament-score-result');
    const inscriptionsData = window.inscriptionsData;
    const INSCRIPTION_STATS_DATA = window.inscriptionStats || {}; 
    let isArmamentCalculatorInitialized = false;
    let selectedInscriptions = new Set();
    let inscriptionCache = new Map();

    const ARMAMENT_PAIRING_SCALINGS = {
        'Huo Qubing / Arthur Pendragon': { attack: 1, defense: 1.16, health: 1.21, allDamage: 3.09, na: 0.62, ca: 0.31, skillDamage: 2.47, smiteDamage: 0, comboDamage: 0 },
        'Huo Qubing / Joan of Arc Prime': { attack: 1, defense: 1.12, health: 1.23, allDamage: 3, na: 0.6, ca: 0.3, skillDamage: 2.4, smiteDamage: 0, comboDamage: 0 },
        'Huo Qubing / Belisarius Prime': { attack: 1, defense: 1.04, health: 1.24, allDamage: 2.8, na: 0.56, ca: 0.28, skillDamage: 2.24, smiteDamage: 0, comboDamage: 0 },
        'Alexander Nevsky / Joan of Arc Prime': { attack: 1, defense: 1.03, health: 1, allDamage: 2.62, na: 0.66, ca: 0.33, skillDamage: 1.96, smiteDamage: 0, comboDamage: 0 },
        'Joan of Arc Prime / Belisarius Prime': { attack: 1, defense: 1.16, health: 1.23, allDamage: 2.7, na: 0.8, ca: 0.4, skillDamage: 1.9, smiteDamage: 0, comboDamage: 0 },
        'Arthur Pendragon / William I': { attack: 1, defense: 1.25, health: 1.3, allDamage: 2.83, na: 0.8, ca: 0.4, skillDamage: 0.6, smiteDamage: 0, comboDamage: 1.12 },
        'Arthur Pendragon / Philip II': { attack: 1, defense: 1.33, health: 1.25, allDamage: 2.31, na: 0.85, ca: 0.42, skillDamage: 0.31, smiteDamage: 0, comboDamage: 1.15 },
        'Arthur Pendragon / Achilles': { attack: 1, defense: 1.2, health: 1.28, allDamage: 3.16, na: 3.16, ca: 0.4, skillDamage: 0, smiteDamage: 0, comboDamage: 2.45 },
        'Attila / Achilles': { attack: 1, defense: 1.4, health: 1.44, allDamage: 2.53, na: 2.53, ca: 0.6, skillDamage: 0, smiteDamage: 0, comboDamage: 1.35 },
        'Bai Qi / Liu Che': { attack: 1, defense: 0.95, health: 1.47, allDamage: 2.96, na: 2.96, ca: 0.37, skillDamage: 0, smiteDamage: 2.22, comboDamage: 0.1 },
        'Bai Qi / William Wallace': { attack: 1, defense: 0.88, health: 1.44, allDamage: 2.87, na: 2.87, ca: 0.41, skillDamage: 0, smiteDamage: 2.15, comboDamage: 0 },
        'Bai Qi / Cheok Jun Gyeong': { attack: 1, defense: 1.16, health: 1.57, allDamage: 3, na: 3, ca: 0.47, skillDamage: 0, smiteDamage: 2.06, comboDamage: 0 },
        'Liu Che / Alexander the Great': { attack: 1, defense: 0.85, health: 1.53, allDamage: 2.85, na: 1.47, ca: 0.3, skillDamage: 0.8, smiteDamage: 1.07, comboDamage: 0.1 },
        'Liu Che / Philip II': { attack: 1, defense: 0.77, health: 1.46, allDamage: 2.08, na: 1.32, ca: 0.3, skillDamage: 0.32, smiteDamage: 0.92, comboDamage: 0.1 },
        'Ragnar Lodbrok Prime / Scipio Africanus Prime': { attack: 1, defense: 0.88, health: 1.36, allDamage: 2.87, na: 0.72, ca: 0.36, skillDamage: 2.15, smiteDamage: 0, comboDamage: 0 },
        'Zhuge Liang / Hermann Prime': { attack: 1, defense: 1.08, health: 1.24, allDamage: 2.77, na: 0.73, ca: 0.36, skillDamage: 2.04, smiteDamage: 0, comboDamage: 0 },
        'Zhuge Liang / Philip II': { attack: 1, defense: 1.04, health: 0.98, allDamage: 2.04, na: 0.76, ca: 0.38, skillDamage: 1.29, smiteDamage: 0, comboDamage: 0 },
        'Ashurbanipal / Yi Seong-Gye': { attack: 1, defense: 1.02, health: 1.54, allDamage: 2.96, na: 0.71, ca: 0.36, skillDamage: 2.25, smiteDamage: 0, comboDamage: 0 },
        'Ashurbanipal / Hermann Prime': { attack: 1, defense: 1.02, health: 1.55, allDamage: 2.94, na: 0.71, ca: 0.36, skillDamage: 2.25, smiteDamage: 0, comboDamage: 0 },
        'Shajar al-Durr / Yi Seong-Gye': { attack: 1, defense: 1.05, health: 1.2, allDamage: 2.79, na: 0.56, ca: 0.28, skillDamage: 2.23, smiteDamage: 0, comboDamage: 0 },
        'Qin Shi Huang / Zhuge Liang': { attack: 1, defense: 0.94, health: 0.94, allDamage: 2.41, na: 0.36, ca: 0.36, skillDamage: 2.41, smiteDamage: 0, comboDamage: 0 },
        'Qin Shi Huang / Yi Seong-Gye': { attack: 1, defense: 0.96, health: 1.16, allDamage: 2.1, na: 0.36, ca: 0.36, skillDamage: 2.1, smiteDamage: 0, comboDamage: 0 }
    };
    
    const ARMAMENT_PAIRINGS_BY_TROOP = {
        cavalry: ['Alexander Nevsky / Joan of Arc Prime', 'Arthur Pendragon / Achilles', 'Arthur Pendragon / Philip II', 'Arthur Pendragon / William I', 'Attila / Achilles', 'Huo Qubing / Arthur Pendragon', 'Huo Qubing / Belisarius Prime', 'Huo Qubing / Joan of Arc Prime', 'Joan of Arc Prime / Belisarius Prime'],
        infantry: ['Bai Qi / Cheok Jun Gyeong', 'Bai Qi / Liu Che', 'Bai Qi / William Wallace', 'Liu Che / Alexander the Great', 'Liu Che / Philip II', 'Ragnar Lodbrok Prime / Scipio Africanus Prime'],
        archer: ['Ashurbanipal / Hermann Prime', 'Ashurbanipal / Yi Seong-Gye', 'Qin Shi Huang / Yi Seong-Gye', 'Qin Shi Huang / Zhuge Liang', 'Shajar al-Durr / Yi Seong-Gye', 'Zhuge Liang / Hermann Prime', 'Zhuge Liang / Philip II']
    };

    const SPECIAL_INSCRIPTIONS = ["Destructive", "Straight to the Point", "Invincible", "Fearless", "Hunter", "Unstoppable", "Balanced", "Intrepid", "Cocoon", "Inviolable", "Crowned", "Rounded", "Thrasher", "Butterfly Effect", "Steelskin", "Flurry", "Toppler", "Demolisher", "Airtight", "Thundering"];
    const RARE_INSCRIPTIONS = ["Battle Ready", "Even Keeled", "Unswerving", "Forceful", "Crazed", "Boiling Blood", "Defiant", "Focus Fire", "Self Defense", "Aegis", "Reinforced", "Tenacious", "Pummeler", "Causative", "Determined", "Relentless", "Imploder", "Raider", "Hardheaded", "Rattling"];

    function initArmamentCalculator() {
        if (isArmamentCalculatorInitialized) return;
        
        const formations = [{ name: "Arch", id: "arch" }, { name: "Wedge", id: "wedge" }, { name: "Hollow Square", id: "hollow_square" }, { name: "Delta", id: "delta" }, { name: "Pincer", id: "pincer" }];
        formations.sort((a, b) => a.name.localeCompare(b.name));
        formationSelector.innerHTML = '';
        formations.forEach(f => {
            const btn = document.createElement('button');
            btn.className = 'formation-btn';
            btn.dataset.formation = f.name;
            btn.innerHTML = `<img src="${getImagePath(f.id + '.webp')}" alt="${f.name}" loading="eager"><span>${f.name}</span>`;
            formationSelector.appendChild(btn);
        });

        armamentTroopSelector.addEventListener('click', e => {
            const button = e.target.closest('.selector-btn');
            if (button) {
                armamentTroopSelector.querySelector('.active').classList.remove('active');
                button.classList.add('active');
                updateArmamentPairingSelector(button.dataset.type);
            }
        });

        armamentPairingSelector.addEventListener('click', e => {
            const item = e.target.closest('.pairing-item');
            if(item) {
                const currentActive = armamentPairingSelector.querySelector('.active');
                if(currentActive) currentActive.classList.remove('active');
                item.classList.add('active');
                calculateArmamentScore();
            }
        });

        formationSelector.addEventListener('click', handleFormationClick);
        inscriptionSelector.addEventListener('click', handleInscriptionClick);
        inscriptionSearch.addEventListener('input', () => filterInscriptions(inscriptionSearch.value));

        selectedInscriptionsDisplay.addEventListener('click', (e) => {
            const tag = e.target.closest('.inscription-tag');
            if (!tag) return;
        
            const inscriptionName = tag.dataset.name;
            if (selectedInscriptions.has(inscriptionName)) {
                selectedInscriptions.delete(inscriptionName);
        
                const mainListTag = inscriptionSelector.querySelector(`.inscription-tag[data-name="${inscriptionName}"]`);
                if (mainListTag) {
                    mainListTag.classList.remove('active');
                }
        
                updateSelectedInscriptionsDisplay();
                calculateArmamentScore();
            }
        });

        [armamentAttackInput, armamentDefenseInput, armamentHealthInput, armamentAllDamageInput].forEach(input => {
            input.addEventListener('input', calculateArmamentScore);
        });
        
        updateArmamentPairingSelector('cavalry');
        isArmamentCalculatorInitialized = true;
    }

    function updateArmamentPairingSelector(troopType) {
        if (!armamentPairingSelector) return;
        armamentPairingSelector.classList.add('fade-out');
        
        setTimeout(() => {
            armamentPairingSelector.innerHTML = '';
            const pairings = ARMAMENT_PAIRINGS_BY_TROOP[troopType] || [];
            pairings.forEach((pairing, index) => {
                const [primary, secondary] = pairing.split(' / ');
                const primaryFilename = `${primary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
                const secondaryFilename = `${secondary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
    
                const primaryImg = getImagePath(primaryFilename);
                const secondaryImg = getImagePath(secondaryFilename);
                
                const div = document.createElement('div');
                div.className = 'pairing-item';
                div.dataset.pairing = pairing;
                const loadingAttr = index < 2 ? 'loading="eager"' : 'loading="lazy"';

                div.innerHTML = `
                    <div class="pairing-images">
                        <img src="${primaryImg}" alt="${primary}" class="commander-icon" ${loadingAttr}>
                        <img src="${secondaryImg}" alt="${secondary}" class="commander-icon secondary" ${loadingAttr}>
                    </div>
                    <span>${pairing}</span>
                `;
                armamentPairingSelector.appendChild(div);
            });
            armamentPairingSelector.classList.remove('fade-out');
            
            const firstPairing = armamentPairingSelector.querySelector('.pairing-item');
            if (firstPairing) {
                firstPairing.classList.add('active');
            }
            calculateArmamentScore();

        }, 150);
    }

    function handleFormationClick(e) {
        const btn = e.target.closest('.formation-btn');
        if (!btn) return;

        const alreadyActive = btn.classList.contains('active');
        formationSelector.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
        
        if (!alreadyActive) {
            btn.classList.add('active');
        }
        
        inscriptionSelector.classList.add('fade-out');
        setTimeout(() => {
            updateInscriptionSelector();
            inscriptionSelector.classList.remove('fade-out');
            calculateArmamentScore();
        }, 150);
    }

    function handleInscriptionClick(e) {
        const tag = e.target.closest('.inscription-tag');
        if (!tag) return;
    
        const inscriptionName = tag.dataset.name;
        tag.classList.toggle('active');
    
        if (selectedInscriptions.has(inscriptionName)) {
            selectedInscriptions.delete(inscriptionName);
        } else {
            selectedInscriptions.add(inscriptionName);
        }
    
        updateSelectedInscriptionsDisplay();
        calculateArmamentScore();
    }
    
    function updateInscriptionSelector() {
        selectedInscriptions.clear();
        inscriptionCache.clear();
        const activeFormationBtn = formationSelector.querySelector('.formation-btn.active');
        inscriptionSearch.value = '';

        if (!activeFormationBtn) {
            inscriptionSelector.innerHTML = '<p class="inscription-placeholder">Select a formation to see available inscriptions.</p>';
            updateSelectedInscriptionsDisplay();
            return;
        }
        const formationName = activeFormationBtn.dataset.formation;
        const availableInscriptions = inscriptionsData[formationName];

        if (!availableInscriptions) {
            inscriptionSelector.innerHTML = `<p class="inscription-placeholder">No inscriptions found for ${formationName}.</p>`;
            return;
        }

        const rarityOrder = { "Special": 3, "Rare": 2, "Common": 1 };

        const sortedInscriptions = [...availableInscriptions].sort((a, b) => {
            const rarityA = SPECIAL_INSCRIPTIONS.includes(a) ? "Special" : RARE_INSCRIPTIONS.includes(a) ? "Rare" : "Common";
            const rarityB = SPECIAL_INSCRIPTIONS.includes(b) ? "Special" : RARE_INSCRIPTIONS.includes(b) ? "Rare" : "Common";
            
            if (rarityOrder[rarityA] !== rarityOrder[rarityB]) {
                return rarityOrder[rarityB] - rarityOrder[rarityA];
            }
            return a.localeCompare(b);
        });

        const grid = document.createElement('div');
        grid.className = 'inscription-grid';
        sortedInscriptions.forEach(name => {
            const tag = document.createElement('div');
            tag.className = 'inscription-tag';
            tag.dataset.name = name;
            tag.textContent = name.replace(/_/g, ' ');

            if (SPECIAL_INSCRIPTIONS.includes(name)) tag.classList.add('special');
            else if (RARE_INSCRIPTIONS.includes(name)) tag.classList.add('rare');
            
            inscriptionCache.set(name, tag);
            grid.appendChild(tag);
        });
        inscriptionSelector.innerHTML = '';
        inscriptionSelector.appendChild(grid);
        updateSelectedInscriptionsDisplay();
    }

    function filterInscriptions(searchTerm) {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const grid = inscriptionSelector.querySelector('.inscription-grid');
        if (!grid) return;

        grid.querySelectorAll('.inscription-tag').forEach(tag => {
            const name = tag.dataset.name.toLowerCase().replace(/_/g, ' ');
            const shouldShow = name.includes(lowerCaseSearch);
            
            if (shouldShow) {
                tag.style.display = 'block';
                setTimeout(() => tag.style.opacity = '1', 10);
            } else {
                tag.style.opacity = '0';
                setTimeout(() => {
                    if (tag.style.opacity === '0') {
                        tag.style.display = 'none';
                    }
                }, 300);
            }
        });
    }

    function updateSelectedInscriptionsDisplay() {
        if (!selectedInscriptionsDisplay) return;
    
        if (selectedInscriptions.size === 0) {
            selectedInscriptionsDisplay.innerHTML = '<p class="inscription-placeholder">No inscriptions selected.</p>';
            return;
        }
    
        let html = '<div class="inscription-grid">';
        selectedInscriptions.forEach(inscriptionName => {
            const cachedTag = inscriptionCache.get(inscriptionName);
            if (cachedTag) {
                const newTag = cachedTag.cloneNode(true);
                newTag.classList.remove('active');
                newTag.removeAttribute('style');
                html += newTag.outerHTML;
            }
        });
        html += '</div>';
        selectedInscriptionsDisplay.innerHTML = html;
    }

    function calculateArmamentScore() {
        const activePairingEl = armamentPairingSelector.querySelector('.pairing-item.active');
        const pairing = activePairingEl ? activePairingEl.dataset.pairing : null;
        const activeFormationBtn = formationSelector.querySelector('.formation-btn.active');

        if (!pairing || !activeFormationBtn) {
            armamentScoreResult.innerHTML = '<span>Select a pairing and formation to calculate your score.</span>';
            return;
        }

        const formationName = activeFormationBtn.dataset.formation;
        
        const totalBonuses = {
            attack: parseFloat(armamentAttackInput.value) || 0,
            defense: parseFloat(armamentDefenseInput.value) || 0,
            health: parseFloat(armamentHealthInput.value) || 0,
            allDamage: parseFloat(armamentAllDamageInput.value) || 0,
            na: 0, ca: 0, skillDamage: 0, smiteDamage: 0, comboDamage: 0
        };

        const totalMultipliers = { allDamage: 0, na: 0, skillDamage: 0, smiteDamage: 0, comboDamage: 0 };

        const formationData = INSCRIPTION_STATS_DATA[formationName] || { bonuses: {}, multipliers: {} };
        for (const stat in formationData.bonuses) {
            totalBonuses[stat] = (totalBonuses[stat] || 0) + formationData.bonuses[stat];
        }

        selectedInscriptions.forEach(inscriptionName => {
            const inscriptionData = INSCRIPTION_STATS_DATA[inscriptionName] || { bonuses: {}, multipliers: {} };
            for (const stat in inscriptionData.bonuses) {
                totalBonuses[stat] = (totalBonuses[stat] || 0) + inscriptionData.bonuses[stat];
            }
            for (const stat in inscriptionData.multipliers) {
                totalMultipliers[stat] = (totalMultipliers[stat] || 0) + inscriptionData.multipliers[stat];
            }
        });
        
        const scaling = ARMAMENT_PAIRING_SCALINGS[pairing];
        if (!scaling) {
            armamentScoreResult.innerHTML = '<span>Error: Scaling data not found for this pairing.</span>';
            return;
        }

        let totalScore = 0;
        for (const stat in totalBonuses) {
            if (scaling.hasOwnProperty(stat)) {
                let statScore = totalBonuses[stat] * scaling[stat];

                if (totalMultipliers.hasOwnProperty(stat) && totalMultipliers[stat] !== 0) {
                     statScore *= (1 + totalMultipliers[stat]);
                }
                totalScore += statScore;
            }
        }

        armamentScoreResult.innerHTML = `<span>Total Armament Score: <strong>${totalScore.toFixed(2)}</strong></span>`;
        triggerSuccessAnimation(armamentScoreResult);
    }
    
    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth; 
        element.classList.add('result-success');
    }

    const initAndResize = () => {

        const troopButtons = document.querySelectorAll('#troop-type-selector .selector-btn');
        const textMap = {
            'cavalry': { long: 'Cavalry', short: 'Cav' },
            'infantry': { long: 'Infantry', short: 'Inf' },
            'archer': { long: 'Archer', short: 'Arch' },
            'engineering': { long: 'Engineering', short: 'Siege' }
        };

        const isMobile = window.innerWidth <= 768;
        troopButtons.forEach(btn => {
            const type = btn.dataset.type;
            const span = btn.querySelector('span');
            if (span && textMap[type]) {
                span.textContent = isMobile ? textMap[type].short : textMap[type].long;
            }
        });
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initAndResize, 100);
    });

    initAndResize();
    moveToSlide(0);
    if(document.querySelector('.carousel-slide[data-title="Stats Weighting"]')) {
        updateWeightingUI();
    }
});