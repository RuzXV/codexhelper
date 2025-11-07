// --- START OF FILE davor_toolkit.js ---

document.addEventListener('DOMContentLoaded', () => {
    if (!window.weightingData || !window.scorePairings) {
        console.error("Critical data (weightingData or scorePairings) not found on window object. Aborting script initialization.");
        document.querySelector('.tool-content').innerHTML = '<h2 style="text-align: center; color: var(--text-secondary);">Error: Tool data could not be loaded. Please refresh the page.</h2>';
        return;
    }

    const equipmentData = window.equipmentData || [];
    const { equipmentSets, commanderPairings, scalingData } = window.weightingData;
    const { armamentPairingScalings, armamentPairingsByTroop } = window.scorePairings;

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
    let state = { troopType: 'cavalry', pairing: null, equipmentSet: null, equipmentSetIndex: 0, totalScore: 0 };
    
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

    const armamentToolTabBtn = document.querySelector('.generator-tab-btn[data-tab="armament-tool"]');
    const savedScoresTabBtn = document.querySelector('.generator-tab-btn[data-tab="saved-scores"]');
    const armamentToolView = document.getElementById('armament-tool-view');
    const savedScoresView = document.getElementById('saved-scores-view');

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
    const saveScoreSection = document.getElementById('save-score-section');
    const savedScoresContent = document.getElementById('saved-scores-content');
    const savedScoresHeader = document.getElementById('saved-scores-header');
    const loggedOutOverlayScores = document.getElementById('logged-out-overlay-scores');
    const savedScoresAuthContainer = document.getElementById('saved-scores-auth-container');
    const inscriptionsData = window.inscriptionsData;
    const INSCRIPTION_STATS_DATA = window.inscriptionStats || {}; 
    let isArmamentCalculatorInitialized = false;
    let selectedInscriptions = new Set();
    let inscriptionCache = new Map();
    let savedScoresCache = null;

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

        armamentToolTabBtn.addEventListener('click', () => switchArmamentView('armament-tool'));
        savedScoresTabBtn.addEventListener('click', () => switchArmamentView('saved-scores'));
        
        updateArmamentPairingSelector('cavalry');
        updateSaveScoreSection();
        isArmamentCalculatorInitialized = true;
    }

    function switchArmamentView(tabName) {
        const views = {
            'armament-tool': armamentToolView,
            'saved-scores': savedScoresView
        };
        const tabs = {
            'armament-tool': armamentToolTabBtn,
            'saved-scores': savedScoresTabBtn
        };

        for (const key in views) {
            const isActive = key === tabName;
            views[key].classList.toggle('active', isActive);
            tabs[key].classList.toggle('active', isActive);
        }

        if (tabName === 'saved-scores') {
            renderSavedScoresView();
        }
    }

    function updateArmamentPairingSelector(troopType) {
        if (!armamentPairingSelector) return;
        armamentPairingSelector.classList.add('fade-out');
        
        setTimeout(() => {
            armamentPairingSelector.innerHTML = '';
            const pairings = armamentPairingsByTroop[troopType] || [];
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
            state.totalScore = 0;
            updateSaveScoreSection();
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
        
        const scaling = armamentPairingScalings[pairing];
        if (!scaling) {
            armamentScoreResult.innerHTML = '<span>Error: Scaling data not found for this pairing.</span>';
            state.totalScore = 0;
            updateSaveScoreSection();
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
        
        state.totalScore = totalScore.toFixed(2);
        armamentScoreResult.innerHTML = `<span>Total Armament Score: <strong>${state.totalScore}</strong></span>`;
        triggerSuccessAnimation(armamentScoreResult);
        updateSaveScoreSection();
    }
    
    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth; 
        element.classList.add('result-success');
    }

    function updateSaveScoreSection() {
        if (!saveScoreSection) return;
        const user = window.auth.getLoggedInUser();

        if (user) {
            saveScoreSection.innerHTML = `<button id="save-score-btn" class="btn-primary">Save Score</button>`;
            document.getElementById('save-score-btn').addEventListener('click', handleSaveScore);
        } else {
            saveScoreSection.innerHTML = `
                <span>Log into</span> 
                <div id="save-score-auth-container"></div>
                <span>to save your scores!</span>`;
            const authContainer = document.getElementById('save-score-auth-container');
            authContainer.innerHTML = `<button class="discord-login-btn"><i class="fa-brands fa-discord"></i><span>Discord</span></button>`;
            if (window.auth && typeof window.auth.init === 'function') {
                window.auth.init('#save-score-auth-container');
            }
        }
    }

    async function handleSaveScore() {
        const btn = document.getElementById('save-score-btn');
        if (!btn) return;

        const activePairingEl = armamentPairingSelector.querySelector('.pairing-item.active');
        const pairing = activePairingEl ? activePairingEl.dataset.pairing : null;
        const activeFormationBtn = formationSelector.querySelector('.formation-btn.active');
        const formation = activeFormationBtn ? activeFormationBtn.dataset.formation : null;

        if (!pairing || !formation) {
            window.showAlert("Please select a pairing and formation before saving.");
            return;
        }

        const scoreData = {
            pairing: pairing,
            formation: formation,
            inscriptions: Array.from(selectedInscriptions),
            stats: {
                attack: parseFloat(armamentAttackInput.value) || 0,
                defense: parseFloat(armamentDefenseInput.value) || 0,
                health: parseFloat(armamentHealthInput.value) || 0,
                allDamage: parseFloat(armamentAllDamageInput.value) || 0,
            },
            total_score: parseFloat(state.totalScore)
        };
        
        btn.disabled = true;
        btn.textContent = 'Saving...';

        try {
            await window.auth.fetchWithAuth('/api/scores', {
                method: 'POST',
                body: JSON.stringify(scoreData)
            });
            btn.textContent = 'Saved!';
            savedScoresCache = null;
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = 'Save Score';
            }, 2000);
        } catch (error) {
            console.error('Failed to save score:', error);
            window.showAlert(`Could not save score: ${error.message}`, "Save Error");
            btn.disabled = false;
            btn.textContent = 'Save Score';
        }
    }
    
    async function renderSavedScoresView() {
        const user = window.auth.getLoggedInUser();

        if (user) {
            savedScoresHeader.style.display = 'flex';
            loggedOutOverlayScores.style.display = 'none';
            if (savedScoresCache) {
                populateSavedScoresTable(savedScoresCache);
                return;
            }

            savedScoresContent.innerHTML = `<p>Loading your saved scores...</p>`;
            try {
                const scores = await window.auth.fetchWithAuth('/api/scores');
                savedScoresCache = scores;
                populateSavedScoresTable(scores);
            } catch (error) {
                console.error('Failed to fetch saved scores:', error);
                savedScoresContent.innerHTML = `<p class="error-message">Could not load your scores. Please try logging in again.</p>`;
                savedScoresCache = null;
            }
        } else {
            savedScoresContent.innerHTML = '';
            savedScoresHeader.style.display = 'none';
            loggedOutOverlayScores.style.display = 'flex';
            if (savedScoresAuthContainer && !savedScoresAuthContainer.hasChildNodes() && window.auth) {
                window.auth.init('#saved-scores-auth-container');
            }
            savedScoresCache = null;
        }
    }

    function populateSavedScoresTable(scores) {
        if (!scores || scores.length === 0) {
            savedScoresContent.innerHTML = `<p>You have no saved scores. Use the "Save Score" button in the tool to add one!</p>`;
            return;
        }
        
        const isMobile = window.innerWidth <= 768;

        let tableHtml = `<div class="saved-scores-grid">
            <div class="grid-header">Pairing</div>
            <div class="grid-header">Formation</div>
            <div class="grid-header">Inscriptions</div>
            <div class="grid-header">Stats</div>
            <div class="grid-header">Score</div>
            <div class="grid-header">Actions</div>
        `;
        
        scores.forEach(score => {
            const [primary, secondary] = score.pairing.split(' / ');
            const primaryFilename = `${primary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
            const secondaryFilename = `${secondary.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_')}.webp`;
            const primaryImg = getImagePath(primaryFilename);
            const secondaryImg = getImagePath(secondaryFilename);
            
            const formationFilename = score.formation.toLowerCase().replace(/ /g, '_') + '.webp';
            const formationImg = getImagePath(formationFilename);

            let inscriptionsHtml = '<div class="inscription-grid">';
            if (score.inscriptions && score.inscriptions.length > 0) {
                score.inscriptions.forEach(name => {
                    let tagClass = 'inscription-tag';
                    if (SPECIAL_INSCRIPTIONS.includes(name)) tagClass += ' special';
                    else if (RARE_INSCRIPTIONS.includes(name)) tagClass += ' rare';
                    inscriptionsHtml += `<div class="${tagClass}" data-name="${name}">${name.replace(/_/g, ' ')}</div>`;
                });
            } else {
                inscriptionsHtml += '<span>None</span>';
            }
            inscriptionsHtml += '</div>';

            const statsHtml = `
                Attack: <strong>${score.stats.attack}%</strong><br>
                Defense: <strong>${score.stats.defense}%</strong><br>
                Health: <strong>${score.stats.health}%</strong><br>
                All Dmg: <strong>${score.stats.allDamage}%</strong>
            `;

            if (isMobile) {
                tableHtml += `<div class="grid-row-container" data-score-id="${score.score_id}">`;
            } else {
                 tableHtml += `<div class="grid-row" data-score-id="${score.score_id}">`;
            }

            tableHtml += `
                <div class="score-pairing pairing-images">
                    <img src="${primaryImg}" alt="${primary}" class="commander-icon">
                    <img src="${secondaryImg}" alt="${secondary}" class="commander-icon secondary">
                </div>
                <div class="score-formation">
                    <img src="${formationImg}" alt="${score.formation}" class="formation-icon">
                    <span>${score.formation}</span>
                </div>
                <div class="score-inscriptions">${inscriptionsHtml}</div>
                <div class="score-stats">${statsHtml}</div>
                <div class="total-score"><strong>${score.total_score.toFixed(2)}</strong></div>
                <div class="score-actions">
                    <button class="btn-danger delete-score-btn" title="Delete Score"><i class="fas fa-trash"></i></button>
                </div>
            `;

            if (isMobile) {
                tableHtml += `</div>`;
            }
        });

        if (!isMobile) {
            tableHtml += '</div>';
        }
        tableHtml += '</div>';
        savedScoresContent.innerHTML = tableHtml;

        savedScoresContent.querySelectorAll('.delete-score-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteScore);
        });
    }

    async function handleDeleteScore(e) {
        const btn = e.currentTarget;
        const row = btn.closest('[data-score-id]');
        const scoreId = row.dataset.scoreId;

        window.showConfirm(
            'Are you sure you want to delete this saved score?', 
            'Confirm Deletion', 
            async () => {
                try {
                    await window.auth.fetchWithAuth(`/api/scores/${scoreId}`, { method: 'DELETE' });
                    savedScoresCache = null;
                    renderSavedScoresView();
                } catch (error) {
                    console.error('Failed to delete score:', error);
                    window.showAlert(`Could not delete score: ${error.message}`, "Delete Error");
                }
            }
        );
    }
    
    const initAndResize = () => {
        const troopButtons = document.querySelectorAll('#troop-type-selector .selector-btn, #armament-troop-selector .selector-btn');
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