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
            "Huo Qubing / Arthur Pendragon", "Huo Qubing / Joan of Arc Prime", "Huo Qubing / Belisarius Prime", "Alexander Nevsky / Joan of Arc Prime",
            "Joan of Arc Prime / Arthur Pendragon", "Arthur Pendragon / William I", "Arthur Pendragon / Philip II", "Arthur Pendragon / Achilles",
            "Arthur Pendragon / Hector", "Attila / Philip II"
        ],
        infantry: ["Bai Qi / Liu Che", "Bai Qi / William Wallace", "Liu Che / Philip II", "Liu Che / Alexander the Great", "Ragnar Lodbrok Prime / Scipio Africanus Prime"],
        archer: [
            "Qin Shi Huang / Zhuge Liang", "Qin Shi Huang / Yi Seong-Gye", "Zhuge Liang / Hermann Prime", "Zhuge Liang / Philip II",
            "Ashurbanipal / Hermann Prime", "Shajar al-Durr / Yi Seong-Gye"
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

    let state = {
        troopType: 'cavalry',
        pairing: null,
        equipmentSet: null,
        equipmentSetIndex: 0
    };

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
    const track = document.querySelector('.carousel-track');

    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = document.getElementById('next-slide');
    const prevButton = document.getElementById('prev-slide');
    const quickNav = document.getElementById('quick-access-nav');
    const mainTitle = document.getElementById('calculator-main-title');
    const mainDescription = document.getElementById('calculator-main-description');
    let currentIndex = 0;

    const moveToSlide = (targetIndex, animate = true) => {
        if (!slides.length || !slides[targetIndex]) return;
        const slideWidth = slides[targetIndex].getBoundingClientRect().width;
        const newTransform = -(targetIndex * slideWidth);
        track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        track.style.transform = `translateX(${newTransform}px)`;
        
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === targetIndex);
        });
        currentIndex = targetIndex;
        updateCarouselUI();
    };

    const updateCarouselUI = () => {
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;
        
        const davorIconHtml = `<img src="${window.davorIconPath}" alt="Davor Icon" class="davor-title-icon">`;
        mainTitle.innerHTML = `${currentSlide.dataset.title} by Davor ${davorIconHtml}`;
        
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
            button.innerHTML = `<img src="${slide.dataset.icon}" alt=""><span>${slide.dataset.title}</span>`;
            button.addEventListener('click', () => moveToSlide(index));
            quickNav.appendChild(button);
        });
    }

    function updatePairingSelector() {
        pairingSelector.classList.add('fade-out');
    
        setTimeout(() => {
            pairingSelector.innerHTML = '';
            const pairings = commanderPairings[state.troopType] || [];
            pairings.forEach(pairing => {
                const [primary, secondary] = pairing.split(' / ');
                const primaryFilename = `${primary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
                const secondaryFilename = `${secondary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
    
                const primaryImg = getImagePath(primaryFilename);
                const secondaryImg = getImagePath(secondaryFilename);
                
                const div = document.createElement('div');
                div.className = 'pairing-item';
                div.dataset.pairing = pairing;
                div.innerHTML = `
                    <div class="pairing-images">
                        <img src="${primaryImg}" alt="${primary}" class="commander-icon">
                        <img src="${secondaryImg}" alt="${secondary}" class="commander-icon secondary">
                    </div>
                    <span>${pairing}</span>
                `;
                pairingSelector.appendChild(div);
            });
            
            pairingSelector.classList.remove('fade-out');
        }, 150);
    }

    function showEquipmentSet(index) {
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
        
            for (const slot in slotMap) {
                const piece = slotMap[slot];
                if (piece) {
                    const imageSrc = getImagePath(piece.image);
                    equipmentHtml += `<div class="equipment-slot" data-slot="${slot}"><img src="${imageSrc}" alt="${piece.name}"></div>`;
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

    function updateUI() {
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
        if (!state.pairing || state.equipmentSet === null) {
            resultDisplay.classList.add('fade-out');
            conversionResultEl.classList.add('fade-out');
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

    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth; 
        element.classList.add('result-success');
    }

    troopTypeSelector.addEventListener('click', e => {
        const button = e.target.closest('.selector-btn');
        if (button) {
            troopTypeSelector.querySelector('.active').classList.remove('active');
            button.classList.add('active');
            state.troopType = button.dataset.type;
            updateUI();
        }
    });

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

    prevSetBtn.addEventListener('click', () => {
        const numSets = Object.keys(equipmentSets[state.troopType]).length;
        const newIndex = (state.equipmentSetIndex - 1 + numSets) % numSets;
        showEquipmentSet(newIndex);
    });

    nextSetBtn.addEventListener('click', () => {
        const numSets = Object.keys(equipmentSets[state.troopType]).length;
        const newIndex = (state.equipmentSetIndex + 1) % numSets;
        showEquipmentSet(newIndex);
    });

    allDamageInput.addEventListener('input', () => {
        if (allDamageInput.value) healthInput.value = '';
        calculateAndDisplay();
    });

    healthInput.addEventListener('input', () => {
        if (healthInput.value) allDamageInput.value = '';
        calculateAndDisplay();
    });

    const initAndResize = () => {
        if(slides.length > 0 && slides[currentIndex]) {
            moveToSlide(currentIndex, false);
        }
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initAndResize, 100);
    });

    initAndResize();
    updateUI();
});