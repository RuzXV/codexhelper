document.addEventListener('DOMContentLoaded', () => {
    function getImagePath(filename) {
        if (window.CALCULATOR_IMAGE_PATHS && window.CALCULATOR_IMAGE_PATHS[filename]) {
            return window.CALCULATOR_IMAGE_PATHS[filename];
        }
        console.warn(`Image path for "${filename}" not found in map. Using a fallback path.`);
        if (filename.startsWith('vip')) {
            return `/images/calculators/vip/${filename}`;
        }
        return `/images/calculators/${filename}`;
    }
    
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const container = document.querySelector('.carousel-container');
    const slides = Array.from(track.children);
    const nextButton = document.getElementById('next-slide');
    const prevButton = document.getElementById('prev-slide');
    const quickNav = document.getElementById('quick-access-nav');
    const mainTitle = document.getElementById('calculator-main-title');
    const mainDescription = document.getElementById('calculator-main-description');

    const calendarIconLabel = document.querySelector('.calendar-icon-label');
    const migrationDateInputJs = document.getElementById('migration-date');

    if (calendarIconLabel && migrationDateInputJs) {
        const openDatePicker = () => {
            try {
                migrationDateInputJs.showPicker();
            } catch (error) {
                console.error("showPicker() is not supported by this browser.", error);
                migrationDateInputJs.focus();
            }
        };

        calendarIconLabel.addEventListener('click', openDatePicker);
        migrationDateInputJs.addEventListener('click', openDatePicker);
    }

    window.getPreLoginState = function() {
        const state = {};
        const allInputs = document.querySelectorAll('.calculator-island input, .calculator-island select');
        let hasInput = false;
        
        allInputs.forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) {
                    state[input.name] = input.value;
                    if (input.value) hasInput = true;
                }
            } else if (input.type === 'checkbox') {
                state[input.id] = input.checked;
                if (input.checked) hasInput = true;
            } else {
                state[input.id] = input.value;
                if (input.value) hasInput = true;
            }
        });

        return hasInput ? state : null;
    };

    let currentIndex = 0;
    let hohReturnedPower = 0;

    const CALCULATORS_CACHE_KEY = 'generalCalculatorsState';

    const debounce = (callback, wait) => {
        let timeoutId = null;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                callback.apply(null, args);
            }, wait);
        };
    };

    const saveAllCalculatorsState = debounce(() => {
        const state = {};
        const allInputs = document.querySelectorAll('.calculator-island input, .calculator-island select');
        
        allInputs.forEach(input => {
            if (input.type === 'radio') {
                if (input.checked) {
                    state[input.name] = input.value;
                }
            } else if (input.type === 'checkbox') {
                state[input.id] = input.checked;
            } else {
                state[input.id] = input.value;
            }
        });

        window.saveUserData(CALCULATORS_CACHE_KEY, state);
    }, 500);

    function loadAllCalculatorsState(stateToLoad = null) {
        const savedState = stateToLoad || window.loadUserData(CALCULATORS_CACHE_KEY);
        if (!savedState) return;

        const allInputs = document.querySelectorAll('.calculator-island input, .calculator-island select');
        
        allInputs.forEach(input => {
            if (input.type === 'radio') {
                if (savedState[input.name] === input.value) {
                    input.checked = true;
                }
            } else if (input.type === 'checkbox') {
                if (typeof savedState[input.id] !== 'undefined') {
                    input.checked = savedState[input.id];
                }
            } else {
                    if (typeof savedState[input.id] !== 'undefined') {
                    input.value = savedState[input.id];
                }
            }
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    const moveToSlide = (targetIndex, animate = true) => {
        if (!slides.length || !slides[targetIndex]) return;

        let newTransform;
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            const slideWidth = container.clientWidth;
            newTransform = -(targetIndex * slideWidth);
        } else {
            const containerWidth = container.clientWidth;
            const targetSlide = slides[targetIndex];
            const slideWidth = targetSlide.clientWidth;
            const targetLeft = targetSlide.offsetLeft;
            newTransform = -(targetLeft - (containerWidth / 2) + (slideWidth / 2));
        }
        
        track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
        track.style.transform = `translateX(${newTransform}px)`;
        
        slides.forEach((slide, index) => {
            slide.classList.toggle('is-active', index === targetIndex);
        });
        
        currentIndex = targetIndex;
        updateUI();
        initializeCalculator(targetIndex);
    };

    const updateUI = () => {
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return;

        mainTitle.innerHTML = `<img src="${currentSlide.dataset.icon}" alt=""> ${currentSlide.dataset.title}`;
        mainDescription.textContent = currentSlide.dataset.description;

        Array.from(quickNav.children).forEach((btn, index) => {
            btn.classList.toggle('active', index === currentIndex);
        });
        
        prevButton.classList.toggle('disabled', currentIndex === 0);
        nextButton.classList.toggle('disabled', currentIndex === slides.length - 1);
    };

    nextButton.addEventListener('click', () => {
        if (currentIndex < slides.length - 1) moveToSlide(currentIndex + 1);
    });

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) moveToSlide(currentIndex - 1);
    });

    slides.forEach((slide, index) => {
        const button = document.createElement('button');
        button.classList.add('quick-access-btn');
        button.innerHTML = `<img src="${slide.dataset.icon}" alt=""><span>${slide.dataset.title}</span>`;
        button.addEventListener('click', () => moveToSlide(index));
        quickNav.appendChild(button);
    });

    function initializeCalculator(index) {
        const targetSlide = slides[index];
        if (!targetSlide || targetSlide.dataset.initialized === 'true') return;

        switch(index) {
            case 0: initSkillCalculator(); break;
            case 1: initExpCalculator(); break;
            case 2: initVipCalculator(); break;
            case 3: initBuildingCalculator(); break;
            case 4: initPassportCalculator(); break;
            case 5: initHohCalculator(); break;
        }
        
        targetSlide.dataset.initialized = 'true';
    }

    function setupAutoCalculation(formElements, calculationFunction) {
        formElements.forEach(element => {
            const eventType = (element.type === 'radio' || element.type === 'checkbox') ? 'change' : 'input';
            element.addEventListener(eventType, calculationFunction);
        });
    }

    function formatNumberInput(input) {
        const format = () => {
            let value = input.value;
            let cursorPosition = input.selectionStart;
            let originalLength = value.length;

            let rawValue = value.replace(/,/g, '');
            if (isNaN(rawValue) || rawValue.trim() === '') {
                input.value = rawValue.replace(/\D/g, '');
                return;
            }

            let formattedValue = Number(rawValue).toLocaleString('en-US');
            
            if (value === formattedValue) return;

            input.value = formattedValue;

            let newLength = formattedValue.length;
            let lengthDiff = newLength - originalLength;
            
            if (cursorPosition > 0 && lengthDiff !== 0) {
                let newCursorPosition = cursorPosition + lengthDiff;
                if (lengthDiff < 0 && value.charAt(cursorPosition-1) === ',') {
                    newCursorPosition++;
                }
                input.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        };
        input.addEventListener('input', format);
    }


    function initSkillCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="Skill Upgrades"]');
        const calculateSkillBtn = document.getElementById('calculate-skill-btn');
        if (!calculateSkillBtn) return;
        
        const startSkillInput = document.getElementById('start-skill');
        const desiredSkillInput = document.getElementById('desired-skill');
        const skillResultDiv = document.getElementById('skill-result');
        const rarityInputs = form.querySelectorAll('input[name="rarity"]');

        const costs = {
            legendary: [10, 10, 15, 15, 30, 30, 40, 40, 45, 45, 50, 50, 75, 75, 80, 80],
            epic: [10, 10, 10, 20, 20, 20, 20, 30, 30, 30, 30, 40, 40, 40, 40, 50],
            elite: [10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 40],
            advanced: [10, 10, 10, 10, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 20, 30]
        };
        const cumulativeCosts = Object.keys(costs).reduce((acc, rarity) => {
            acc[rarity] = costs[rarity].reduce((a, c, i) => { a.push((a[i-1] || 0) + c); return a; }, []);
            return acc;
        }, {});
        function getSkillPoints(skillString) {
            return skillString.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) - 4;
        }
        const performCalculation = () => {
            const start = startSkillInput.value;
            const desired = desiredSkillInput.value;
            const rarity = document.querySelector('input[name="rarity"]:checked').value;
            const sculptureImage = getImagePath(`${rarity}_sculpture.webp`);

            if (!/^[1-5]{4}$/.test(start) || !/^[1-5]{4}$/.test(desired)) {
                skillResultDiv.textContent = 'Please enter valid 4-digit skill levels (Example: 1111, 5511).';
                skillResultDiv.classList.add('error');
                return;
            }
            const startPoints = getSkillPoints(start);
            const desiredPoints = getSkillPoints(desired);
            if (desiredPoints <= startPoints) {
                skillResultDiv.textContent = 'Desired skill level must be higher than starting level.';
                skillResultDiv.classList.add('error');
                return;
            }
            skillResultDiv.classList.remove('error');
            const totalCost = cumulativeCosts[rarity][desiredPoints - 1] - (startPoints > 0 ? cumulativeCosts[rarity][startPoints - 1] : 0);
            skillResultDiv.innerHTML = `<img src="${sculptureImage}" alt="${rarity} sculpture"><span>Requires <strong id="skill-cost-value">0</strong> Sculptures</span>`;
            animateCounter(document.getElementById('skill-cost-value'), totalCost, 700);
            triggerSuccessAnimation(skillResultDiv);
        };
        
        calculateSkillBtn.addEventListener('click', () => {
            performCalculation();
            calculateSkillBtn.style.display = 'none';
            const formElements = [startSkillInput, desiredSkillInput, ...rarityInputs];
            setupAutoCalculation(formElements, performCalculation);
        });
    }

    function initExpCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="Commander EXP"]');
        const calculateExpBtn = document.getElementById('calculate-exp-btn');
        if (!calculateExpBtn) return;

        const currentLevelInput = document.getElementById('current-exp-level');
        const currentExpInput = document.getElementById('current-exp-amount');
        const expResultDiv = document.getElementById('exp-result');
        const expTomeToggle = document.getElementById('exp-tome-toggle');
        const expTomeGrid = document.getElementById('exp-tome-grid-container');
        const expTomeInputs = form.querySelectorAll('.exp-tome-input');
        const rarityInputs = form.querySelectorAll('input[name="exp-rarity"]');
        
        formatNumberInput(currentExpInput);
        expTomeInputs.forEach(formatNumberInput);
        
        const expCosts = {
            legendary: [120, 360, 720, 1200, 3600, 7200, 10800, 14400, 18000, 22200, 27000, 32400, 38400, 45000, 52200, 60000, 67800, 75600, 84000, 90000, 96000, 103200, 110400, 117600, 126000, 134400, 142800, 151200, 162000, 180000, 204000, 234000, 270000, 312000, 360000, 414000, 474000, 540000, 660000, 810000, 960000, 1140000, 1320000, 1530000, 1740000, 1980000, 2220000, 2520000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000],
            epic: [100, 300, 600, 1000, 3000, 6000, 9000, 12000, 15000, 18500, 22500, 27000, 32000, 37500, 43500, 50000, 56500, 63000, 70000, 75000, 80000, 86000, 92000, 98000, 105000, 112000, 119000, 126000, 135000, 150000, 170000, 195000, 225000, 260000, 300000, 345000, 395000, 450000, 550000, 675000, 800000, 950000, 1100000, 1275000, 1450000, 1650000, 1850000, 2100000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000],
            elite: [80, 240, 480, 800, 2400, 4800, 7200, 9600, 12000, 14800, 18000, 21600, 25600, 30000, 34800, 40000, 45200, 50400, 56000, 60000, 64000, 68800, 73600, 78400, 84000, 89600, 95200, 100800, 108000, 120000, 136000, 156000, 180000, 208000, 240000, 276000, 316000, 360000, 440000, 540000, 640000, 760000, 880000, 1020000, 1160000, 1320000, 1480000, 1680000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000],
            advanced: [60, 180, 360, 600, 1800, 3600, 5400, 7200, 9000, 11100, 13500, 16200, 19200, 22500, 26100, 30000, 33900, 37800, 42000, 45000, 48000, 51600, 55200, 58800, 63000, 67200, 71400, 75600, 81000, 90000, 102000, 117000, 135000, 156000, 180000, 207000, 237000, 270000, 330000, 405000, 480000, 570000, 660000, 765000, 870000, 990000, 1110000, 1260000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000]
        };

        const cumulativeExp = Object.keys(expCosts).reduce((acc, rarity) => {
            acc[rarity] = expCosts[rarity].reduce((a, c, i) => { a.push((a[i-1] || 0) + c); return a; }, []);
            return acc;
        }, {});

        expTomeToggle.addEventListener('change', () => expTomeGrid.classList.toggle('visible', expTomeToggle.checked));

        const performCalculation = () => {
            expResultDiv.innerHTML = '';
            expResultDiv.classList.remove('error');

            const rarity = document.querySelector('input[name="exp-rarity"]:checked').value;
            const currentLevel = parseInt(currentLevelInput.value, 10);
            const currentExp = parseFloat(currentExpInput.value.replace(/,/g, '')) || 0;
            const maxLevel = 60;
            const isTomeOnlyMode = expTomeToggle.checked && !currentLevelInput.value && !currentExpInput.value;

            let totalTomeExp = 0;
            expTomeInputs.forEach(input => {
                totalTomeExp += (parseInt(input.value.replace(/,/g, ''), 10) || 0) * (parseInt(input.dataset.value, 10));
            });

            if (isTomeOnlyMode) {
                const totalExpToMax = cumulativeExp[rarity][maxLevel - 2];
                const commandersToMax = totalTomeExp > 0 && totalExpToMax > 0 ? Math.floor(totalTomeExp / totalExpToMax) : 0;
                
                expResultDiv.innerHTML = `
                    <div class="cost-line"><img src="${getImagePath('experience_book.webp')}" alt="EXP Book"> You have <strong>${totalTomeExp.toLocaleString()}</strong> total EXP in tomes.</div>
                    <div class="cost-line">This can max <strong>${commandersToMax}</strong> ${rarity} commanders.</div>`;
                triggerSuccessAnimation(expResultDiv);
                return;
            }

            if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > maxLevel) {
                if(currentLevelInput.value) {
                    expResultDiv.textContent = `Please enter a valid level between 1 and ${maxLevel}.`;
                    expResultDiv.classList.add('error'); 
                }
                return;
            }

            if (currentLevel === maxLevel) {
                expResultDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>This commander is already at max level!</span>`;
                triggerSuccessAnimation(expResultDiv);
                return;
            }

            const totalExpToReachCurrentLevel = currentLevel > 1 ? cumulativeExp[rarity][currentLevel - 2] : 0;
            const totalCurrentExp = totalExpToReachCurrentLevel + currentExp;
            const totalExpToReachMaxLevel = cumulativeExp[rarity][maxLevel - 2];
            
            if (typeof totalExpToReachMaxLevel === 'undefined' || typeof totalCurrentExp === 'undefined') {
                expResultDiv.textContent = 'Error in calculation. Please check commander data.';
                expResultDiv.classList.add('error'); 
                return;
            }

            let expNeeded = totalExpToReachMaxLevel - totalCurrentExp;

            if (expTomeToggle.checked) {
                expNeeded -= totalTomeExp;
            }

            if (expNeeded <= 0) {
                expResultDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>You have enough EXP to reach level ${maxLevel}!</span>`;
            } else {
                expResultDiv.innerHTML = `<img src="${getImagePath('experience_book.webp')}" alt="EXP Book"><span>Requires <strong id="exp-needed-value">0</strong> more EXP to max</span>`;
                animateCounter(document.getElementById('exp-needed-value'), Math.round(expNeeded), 700);
            }
            triggerSuccessAnimation(expResultDiv);
        };

        calculateExpBtn.addEventListener('click', () => {
            performCalculation();
            calculateExpBtn.style.display = 'none';
            const formElements = [currentLevelInput, currentExpInput, expTomeToggle, ...expTomeInputs, ...rarityInputs];
            setupAutoCalculation(formElements, performCalculation);
        });
    }

    function initPassportCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="Passports"]');
        const calculatePassportBtn = document.getElementById('calculate-passport-btn');
        if (!calculatePassportBtn) return;
        
        const powerInput = document.getElementById('power-input');
        const sameKvkCheckbox = document.getElementById('same-kvk-checkbox');
        const powerBreakdownDiv = document.getElementById('passport-power-breakdown');
        const passportNeededDiv = document.getElementById('passport-needed-result');
        const currentPassportsInput = document.getElementById('current-passports-input');
        const costResultDiv = document.getElementById('cost-result');
        const migrationDateInput = document.getElementById('migration-date');
        const hospitalCapacityInput = document.getElementById('hospital-capacity');
        const hospitalTierToggle = document.getElementById('hospital-tier-toggle');
        const hohLinkToggle = document.getElementById('hoh-link-toggle');
        const hohHyperlink = document.getElementById('hoh-hyperlink');
        
        formatNumberInput(powerInput);
        formatNumberInput(hospitalCapacityInput);
        formatNumberInput(currentPassportsInput);

        const passportBrackets = [ { maxPower: 9999999, normal: 1, discount: 1 }, { maxPower: 14999999, normal: 2, discount: 1 }, { maxPower: 19999999, normal: 3, discount: 1 }, { maxPower: 24999999, normal: 4, discount: 1 }, { maxPower: 29999999, normal: 6, discount: 1 }, { maxPower: 34999999, normal: 9, discount: 2 }, { maxPower: 39999999, normal: 12, discount: 3 }, { maxPower: 44999999, normal: 15, discount: 5 }, { maxPower: 49999999, normal: 20, discount: 8 }, { maxPower: 54999999, normal: 25, discount: 12 }, { maxPower: 59999999, normal: 30, discount: 15 }, { maxPower: 64999999, normal: 35, discount: 20 }, { maxPower: 69999999, normal: 40, discount: 25 }, { maxPower: 74999999, normal: 45, discount: 32 }, { maxPower: 79999999, normal: 50, discount: 40 }, { maxPower: 84999999, normal: 55, discount: 47 }, { maxPower: 89999999, normal: 60, discount: 54 }, { maxPower: 94999999, normal: 65, discount: 61 }, { maxPower: 99999999, normal: 70, discount: 67 }, { maxPower: Infinity, normal: 75, discount: 73 } ];
        
        hospitalCapacityInput.addEventListener('input', () => {
            hospitalTierToggle.disabled = !hospitalCapacityInput.value;
        });

        hohHyperlink.addEventListener('click', (e) => {
            e.preventDefault();
            const hohSlideIndex = slides.findIndex(slide => slide.dataset.title === "Hall of Heroes");
            if (hohSlideIndex !== -1) {
                moveToSlide(hohSlideIndex);
            }
        });

        function calculateBundleCost(passportsNeeded, months) {
            if (passportsNeeded <= 0) return { cost: 0, details: "No bundles needed." };
        
            const bundles = [
                { cost: 5, passports: 1 }, { cost: 10, passports: 2 },
                { cost: 20, passports: 3 }, { cost: 50, passports: 4 }, { cost: 100, passports: 5 }
            ];
        
            let availableBundles = [];
            for (let i = 0; i < months; i++) {
                availableBundles.push(...bundles);
            }
        
            availableBundles.sort((a, b) => (a.cost / a.passports) - (b.cost / b.passports));
        
            let cost = 0;
            let passportsObtained = 0;
            let purchased = {};
        
            let tempPassportsNeeded = passportsNeeded;
            
            for (const bundle of availableBundles) {
                if (tempPassportsNeeded <= 0) break;
                
                cost += bundle.cost;
                passportsObtained += bundle.passports;
                tempPassportsNeeded -= bundle.passports;

                const key = `$${bundle.cost}`;
                purchased[key] = (purchased[key] || 0) + 1;
            }
        
            const detailStr = Object.entries(purchased)
                .sort((a,b) => parseInt(a[0].substring(1)) - parseInt(b[0].substring(1)))
                .map(([key, val]) => `${val}x ${key} bundle`).join(', ');
            return { cost: cost, details: `Optimal purchase: ${detailStr}` };
        }

        const performCalculation = () => {
            powerBreakdownDiv.innerHTML = ''; passportNeededDiv.innerHTML = ''; costResultDiv.innerHTML = ''; 
            powerBreakdownDiv.classList.remove('error'); passportNeededDiv.classList.remove('error'); costResultDiv.classList.remove('error');
            
            const power = parseInt(powerInput.value.replace(/,/g, ''), 10);
            if (isNaN(power) || power <= 0) { 
                if (powerInput.value) {
                    powerBreakdownDiv.textContent = 'Please enter a valid, positive power.'; 
                    powerBreakdownDiv.classList.add('error');
                }
                return; 
            }
            
            let breakdownLines = [];
            let effectivePower = power;
            breakdownLines.push(`Starting Power: <strong>${power.toLocaleString()}</strong>`);
            
            const hospitalCapacity = parseInt(hospitalCapacityInput.value.replace(/,/g, ''), 10) || 0;
            if (hospitalCapacity > 0 && !hospitalTierToggle.disabled) {
                const isT5 = hospitalTierToggle.checked;
                const troopPower = isT5 ? 10 : 4;
                const powerReduction = hospitalCapacity * troopPower;
                effectivePower -= powerReduction;
                breakdownLines.push(`Delta w/ Full Hospital: <strong style="color: #ef4444;">-${powerReduction.toLocaleString()}</strong>`);
            }
            
            if(hohLinkToggle.checked && hohReturnedPower > 0) {
                effectivePower += hohReturnedPower;
                breakdownLines.push(`Delta w/ HoH Return: <strong style="color: #4ade80;">+${hohReturnedPower.toLocaleString()}</strong>`);
            }

            breakdownLines.push(`Final Migrating Power: <strong>${effectivePower.toLocaleString()}</strong>`);

            const isDiscounted = sameKvkCheckbox.checked;
            const bracket = passportBrackets.find(b => effectivePower <= b.maxPower);
            if(!bracket) { powerBreakdownDiv.textContent = 'Could not determine passport bracket.'; powerBreakdownDiv.classList.add('error'); return; }

            const requiredPassports = isDiscounted ? bracket.discount : bracket.normal;
            breakdownLines.push(`Required Passports: <strong>${requiredPassports}</strong>`);

            const currentBracketIndex = passportBrackets.findIndex(b => effectivePower <= b.maxPower);
            if (currentBracketIndex > 0) {
                const previousBracket = passportBrackets[currentBracketIndex - 1];
                const powerToDrop = effectivePower - previousBracket.maxPower;
                const passportsSaved = requiredPassports - (isDiscounted ? previousBracket.discount : previousBracket.normal);
                if (powerToDrop > 0 && passportsSaved > 0) {
                        breakdownLines.push(`<span style="font-size: var(--font-size-sm); color: var(--text-secondary);">Drop <strong>${powerToDrop.toLocaleString()}</strong> more power to save <strong>${passportsSaved}</strong> passports.</span>`);
                }
            }

            powerBreakdownDiv.innerHTML = breakdownLines.map(line => `<span>${line}</span>`).join('');

            const currentPassports = parseInt(currentPassportsInput.value.replace(/,/g, ''), 10) || 0;
            if (isNaN(currentPassports) || currentPassports < 0) { costResultDiv.textContent = 'Current passports must be a positive number.'; costResultDiv.classList.add('error'); return; }
            const passportsNeeded = requiredPassports - currentPassports;

            if (passportsNeeded <= 0) { 
                passportNeededDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>You have enough passports!</span>`; 
            } else { 
                passportNeededDiv.innerHTML = `<img src="${getImagePath('passport.webp')}" alt="Passport"><span>Requires <strong id="passport-value">0</strong> more Passports</span>`; 
                animateCounter(document.getElementById('passport-value'), passportsNeeded, 700); 
            }

            const today = new Date();
            today.setHours(0,0,0,0);
            const migrationDateVal = migrationDateInput.value;
            const migrationDate = migrationDateVal ? new Date(migrationDateVal + 'T00:00:00') : today;
            let monthsAvailable = 0;

            if (migrationDateVal) {
                if(migrationDate < today) {
                    monthsAvailable = 0;
                } else {
                    let startMonth = today.getMonth();
                    let startYear = today.getFullYear();
                    let endMonth = migrationDate.getMonth();
                    let endYear = migrationDate.getFullYear();
                    monthsAvailable = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
                }
            } else {
                monthsAvailable = 1;
            }

            if (passportsNeeded <= 0) { 
                costResultDiv.innerHTML = `<span>No additional cost required.</span>`; 
            } else {
                const bundleResult = calculateBundleCost(passportsNeeded, monthsAvailable);
                costResultDiv.innerHTML = `
                    <div class="cost-line"><span>Credit Cost: <strong id="credit-cost-value">0</strong></span><img src="${getImagePath('alliance_credit.webp')}" alt="Alliance Credit"></div>
                    <div class="cost-line"><span>New World Cost: <strong id="usd-cost-value">0</strong></span><img src="${getImagePath('bundle.webp')}" alt="Bundle"></div>
                    <small style='color: var(--text-secondary); margin-top: 5px;'>${bundleResult.details}</small>`;

                animateCounter(document.getElementById('credit-cost-value'), passportsNeeded * 600000, 700);
                animateCounter(document.getElementById('usd-cost-value'), bundleResult.cost, 700, '$');
                triggerSuccessAnimation(costResultDiv);
            }
            triggerSuccessAnimation(powerBreakdownDiv);
            triggerSuccessAnimation(passportNeededDiv);
        };

        calculatePassportBtn.addEventListener('click', () => {
            performCalculation();
            calculatePassportBtn.style.display = 'none';
            const formElements = [powerInput, sameKvkCheckbox, currentPassportsInput, migrationDateInput, hospitalCapacityInput, hospitalTierToggle, hohLinkToggle];
            setupAutoCalculation(formElements, performCalculation);
        });
    }

    function initVipCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="VIP Level"]');
        const calculateVipBtn = document.getElementById('calculate-vip-btn');
        if(!calculateVipBtn) return;
        
        const currentVipPointsInput = document.getElementById('current-vip-points');
        const desiredVipLevelSelect = document.getElementById('desired-vip-level');
        const vipResultDiv = document.getElementById('vip-result');
        const vipTokenToggle = document.getElementById('vip-token-toggle');
        const vipTokenGrid = document.getElementById('vip-token-grid-container');
        const vipTokenInputs = form.querySelectorAll('.vip-token-input');
        
        formatNumberInput(currentVipPointsInput);
        vipTokenInputs.forEach(formatNumberInput);
        
        const vipLevels = [ { level: 1, points: 200 }, { level: 2, points: 400 }, { level: 3, points: 1200 }, { level: 4, points: 3500 }, { level: 5, points: 6000 }, { level: 6, points: 11500 }, { level: 7, points: 17500 }, { level: 8, points: 35000 }, { level: 9, points: 75000 }, { level: 10, points: 150000 }, { level: 11, points: 250000 }, { level: 12, points: 350000 }, { level: 13, points: 500000 }, { level: 14, points: 750000 }, { level: 15, points: 1000000 }, { level: 16, points: 1500000 }, { level: 17, points: 2500000 }, { level: 18, points: 4000000 }, { level: 19, points: 6000000 }, { level: 'SVIP', points: 9000000 } ];

        vipTokenToggle.addEventListener('change', () => vipTokenGrid.classList.toggle('visible', vipTokenToggle.checked));

        const performCalculation = () => {
            vipResultDiv.classList.remove('error');
            const isTokenOnlyMode = !currentVipPointsInput.value && vipTokenToggle.checked;
            
            let totalTokenPoints = 0;
            if (vipTokenToggle.checked) {
                vipTokenInputs.forEach(input => {
                    const count = parseInt(input.value.replace(/,/g, ''), 10) || 0;
                    const value = parseInt(input.dataset.value, 10);
                    totalTokenPoints += count * value;
                });
            }

            if (isTokenOnlyMode) {
                vipResultDiv.innerHTML = `<img src="${getImagePath('vip_icon.webp')}" alt="VIP Icon"><span>You have <strong>${totalTokenPoints.toLocaleString()}</strong> total VIP points in tokens.</span>`;
                triggerSuccessAnimation(vipResultDiv);
                return;
            }

            let totalPoints = (parseInt(currentVipPointsInput.value.replace(/,/g, ''), 10) || 0) + totalTokenPoints;
            
            const targetPoints = parseInt(desiredVipLevelSelect.value, 10);
            if (isNaN(targetPoints)) { vipResultDiv.textContent = 'Please select a desired VIP level.'; vipResultDiv.classList.add('error'); return; }

            const pointsNeeded = targetPoints - totalPoints;
            const selectedOption = desiredVipLevelSelect.options[desiredVipLevelSelect.selectedIndex];
            const levelName = selectedOption.dataset.level;
            const levelImage = getImagePath(levelName.toLowerCase() === 'svip' ? 'svip.webp' : `vip${levelName}.webp`);
            const levelText = levelName === 'SVIP' ? 'SVIP' : `VIP ${levelName}`;

            if(pointsNeeded <= 0) {
                const overflow = -pointsNeeded;
                vipResultDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>You have enough points for ${levelText}, with <strong>${overflow.toLocaleString()}</strong> points left over!</span>`;
            } else {
                vipResultDiv.innerHTML = `<img src="${levelImage}" alt="${levelText}"><span>Needs <strong id="vip-points-needed">0</strong> more points for ${levelText}</span>`;
                animateCounter(document.getElementById('vip-points-needed'), pointsNeeded, 700);
            }
            triggerSuccessAnimation(vipResultDiv);
        };
        
        const customSelectContainer = document.querySelector('.carousel-slide[data-title="VIP Level"] .custom-select-container');
        if (customSelectContainer && !customSelectContainer.querySelector('.select-selected')) {
            const selectEl = customSelectContainer.querySelector('select');
            const selectedDiv = document.createElement("DIV");
            selectedDiv.setAttribute("class", "select-selected");
            customSelectContainer.appendChild(selectedDiv);
            const optionsDiv = document.createElement("DIV");
            optionsDiv.setAttribute("class", "select-items select-hide");

            vipLevels.forEach((vip, index) => {
                const option = document.createElement('option');
                option.value = vip.points;
                option.dataset.level = vip.level;
                selectEl.appendChild(option);

                const itemDiv = document.createElement("DIV");
                const levelName = vip.level === 'SVIP' ? 'SVIP' : `VIP ${vip.level}`;
                const iconName = vip.level.toString().toLowerCase();
                const iconPath = getImagePath(iconName === 'svip' ? 'svip.webp' : 'vip' + iconName + '.webp');
                itemDiv.innerHTML = `<img src="${iconPath}" alt="${levelName}">${levelName}`;
                itemDiv.addEventListener("click", function() {
                    selectEl.selectedIndex = index;
                    selectedDiv.innerHTML = this.innerHTML;
                    Array.from(optionsDiv.getElementsByClassName("same-as-selected")).forEach(el => el.classList.remove("same-as-selected"));
                    this.classList.add("same-as-selected");
                    closeAllSelect();
                    if (calculateVipBtn.style.display === 'none') performCalculation();
                });
                optionsDiv.appendChild(itemDiv);
            });
            
            customSelectContainer.appendChild(optionsDiv);
            selectedDiv.innerHTML = optionsDiv.querySelector('div:last-child').innerHTML;
            selectEl.selectedIndex = vipLevels.length - 1;
            
            selectedDiv.addEventListener("click", function(e) {
                e.stopPropagation();
                closeAllSelect(this);
                optionsDiv.classList.toggle("select-hide");
                this.classList.toggle("select-arrow-active");
            });

            function closeAllSelect(elmnt) {
                const allSelectItems = document.querySelectorAll(".select-items");
                const allSelectSelected = document.querySelectorAll(".select-selected");
                for (let i = 0; i < allSelectSelected.length; i++) {
                    if (elmnt != allSelectSelected[i]) allSelectSelected[i].classList.remove("select-arrow-active");
                }
                for (let i = 0; i < allSelectItems.length; i++) {
                    if (elmnt == null || allSelectItems[i].previousElementSibling != elmnt) allSelectItems[i].classList.add("select-hide");
                }
            }
            document.addEventListener("click", closeAllSelect);
        }

        calculateVipBtn.addEventListener('click', () => {
            performCalculation();
            calculateVipBtn.style.display = 'none';
            const formElements = [currentVipPointsInput, vipTokenToggle, ...vipTokenInputs, desiredVipLevelSelect];
            setupAutoCalculation(formElements, performCalculation);
        });
    }

    function initBuildingCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="Buildings"]');
        const calculateBuildingBtn = document.getElementById('calculate-building-btn');
        if(!calculateBuildingBtn) return;
        
        const buildingSelectors = document.querySelectorAll('input[name="building"]');
        const currentLevelInput = document.getElementById('current-level');
        const desiredLevelInput = document.getElementById('desired-level');
        const currentCurrencyInput = document.getElementById('current-currency');
        const buildingResultDiv = document.getElementById('building-cost-result');
        const currencyLabelText = document.getElementById('currency-label-text');
        const currencyLabelIcon = document.getElementById('currency-label-icon');

        formatNumberInput(currentCurrencyInput);

        const buildingData = {
            castle: { currencyName: "Books of Covenant", currencyImage: getImagePath("book_of_covenant.webp"), costs: [0, 2, 5, 8, 15, 20, 30, 40, 50, 70, 80, 100, 125, 150, 300, 500, 700, 900, 1200, 1500, 1750, 2000, 2500, 3000, 5000] },
            watchtower: { currencyName: "Arrows of Resistance", currencyImage: getImagePath("arrow_of_resistance.webp"), costs: [0, 2, 5, 8, 15, 20, 30, 40, 50, 70, 80, 100, 125, 150, 300, 500, 700, 900, 1200, 1500, 1800, 2000, 2500, 3000, 5000] },
            stateForum: { currencyName: "Sage's Testimony", currencyImage: getImagePath("sages_testimony.webp"), costs: [0, 0, 10, 15, 15, 20, 25, 40, 50, 60, 90, 120, 170, 205, 250, 310, 390, 450, 620, 540, 1000, 1400, 2400, 4400, 7430] }
        };

        for (const building in buildingData) {
            buildingData[building].cumulativeCosts = buildingData[building].costs.reduce((acc, cost, i) => { acc.push((acc[i-1] || 0) + cost); return acc; }, []);
        }

        const performCalculation = () => {
            buildingResultDiv.innerHTML = ''; buildingResultDiv.classList.remove('error');
            const selectedBuilding = document.querySelector('input[name="building"]:checked').value;
            const currentLevel = parseInt(currentLevelInput.value, 10);
            const desiredLevel = parseInt(desiredLevelInput.value, 10);
            const currentCurrency = parseInt(currentCurrencyInput.value.replace(/,/g, ''), 10) || 0;
            
            if (isNaN(currentLevel) || isNaN(desiredLevel) || currentLevel < 1 || desiredLevel > 25) { if(currentLevelInput.value || desiredLevelInput.value) {buildingResultDiv.textContent = 'Please enter valid levels between 1 and 25.'; buildingResultDiv.classList.add('error');} return; }
            if (desiredLevel <= currentLevel) { buildingResultDiv.textContent = 'Desired level must be higher than the current level.'; buildingResultDiv.classList.add('error'); return; }
            if (isNaN(currentCurrency) || currentCurrency < 0) { buildingResultDiv.textContent = 'Current currency must be a positive number.'; buildingResultDiv.classList.add('error'); return; }

            const data = buildingData[selectedBuilding];
            const totalCost = data.cumulativeCosts[desiredLevel - 1] - data.cumulativeCosts[currentLevel - 1];
            const neededCurrency = Math.max(0, totalCost - currentCurrency);

            if (neededCurrency <= 0) {
                buildingResultDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>You have enough currency to reach level ${desiredLevel}!</span>`;
            } else {
                const gemCost = neededCurrency * 10;
                buildingResultDiv.innerHTML = `
                    <div class="cost-line"><span>${data.currencyName}: <strong id="building-currency-value">0</strong></span><img src="${data.currencyImage}" alt="${data.currencyName}"></div>
                    <div class="cost-line"><span>Gem Cost: <strong id="building-gem-value">0</strong></span><img src="${getImagePath('gem.webp')}" alt="Gem"></div>`;
                animateCounter(document.getElementById('building-currency-value'), neededCurrency, 700);
                animateCounter(document.getElementById('building-gem-value'), gemCost, 700);
            }
            triggerSuccessAnimation(buildingResultDiv);
        };
        
        buildingSelectors.forEach(selector => {
            selector.addEventListener('change', () => {
                const selectedBuilding = document.querySelector('input[name="building"]:checked').value;
                const data = buildingData[selectedBuilding];
                if(currencyLabelText) currencyLabelText.textContent = `Current ${data.currencyName}`;
                if(currencyLabelIcon) {
                    currencyLabelIcon.src = data.currencyImage;
                    currencyLabelIcon.alt = data.currencyName;
                }
                if (calculateBuildingBtn.style.display === 'none') performCalculation();
            });
        });

        calculateBuildingBtn.addEventListener('click', () => {
            performCalculation();
            calculateBuildingBtn.style.display = 'none';
            const formElements = [currentLevelInput, desiredLevelInput, currentCurrencyInput, ...buildingSelectors];
            setupAutoCalculation(formElements, performCalculation);
        });
    }

    function initHohCalculator() {
        const form = document.querySelector('.carousel-slide[data-title="Hall of Heroes"]');
        const calculateBtn = document.getElementById('calculate-hoh-btn');
        if(!calculateBtn) return;

        const resultDiv = document.getElementById('hoh-result');
        const troopInputs = form.querySelectorAll('.hoh-input');
        const returnRateInputs = form.querySelectorAll('input[name="hoh-return-rate"]');
        
        const adjustInputFontSize = (input) => {
            const initialFontSize = parseFloat(getComputedStyle(input).fontSize);
            if (!input.dataset.initialFontSize) {
                input.dataset.initialFontSize = initialFontSize;
            }
            
            input.style.fontSize = `${input.dataset.initialFontSize}px`;
            let currentFontSize = parseFloat(input.dataset.initialFontSize);

            while (input.scrollWidth > input.clientWidth && currentFontSize > 8) {
                currentFontSize -= 1;
                input.style.fontSize = `${currentFontSize}px`;
            }
        };

        troopInputs.forEach(input => {
            formatNumberInput(input);
            input.addEventListener('input', () => adjustInputFontSize(input));
            if(input.value) adjustInputFontSize(input);
        });

        const performCalculation = () => {
            const returnRate = parseFloat(document.querySelector('input[name="hoh-return-rate"]:checked').value);
            let totalPower = 0;

            troopInputs.forEach(input => {
                const count = parseInt(input.value.replace(/,/g, ''), 10) || 0;
                const tier = input.dataset.tier;
                
                const returnedTroops = Math.round(count * returnRate);
                const powerPerTroop = tier === 't4' ? 4 : 10;
                totalPower += returnedTroops * powerPerTroop;
            });

            hohReturnedPower = totalPower;
            resultDiv.innerHTML = `<img src="${getImagePath('power_icon.webp')}" alt="Power Icon"><span>Total Power Returned: <strong>${totalPower.toLocaleString()}</strong></span>`;
            triggerSuccessAnimation(resultDiv);
            
            const hohLinkToggle = document.getElementById('hoh-link-toggle');
            if(hohLinkToggle && hohLinkToggle.checked) {
                const passportPowerInput = document.getElementById('power-input');
                if (passportPowerInput) passportPowerInput.dispatchEvent(new Event('input'));
            }
        };

        calculateBtn.addEventListener('click', () => {
            performCalculation();
            calculateBtn.style.display = 'none';
            const formElements = [...troopInputs, ...returnRateInputs];
            setupAutoCalculation(formElements, performCalculation);
        });
    }


    function triggerSuccessAnimation(element) {
        if (!element) return;
        element.classList.remove('result-success');
        void element.offsetWidth; 
        element.classList.add('result-success');
    }

    function animateCounter(element, target, duration, prefix = '') {
        if (!element) return;
        element.classList.add('counting-blur');
        
        const start = 0;
        const range = target - start;
        let startTime = null;

        if (range === 0) {
            element.textContent = prefix + target.toLocaleString();
            element.classList.remove('counting-blur');
            return;
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            const current = Math.floor(start + range * percentage);
            element.textContent = prefix + current.toLocaleString();

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = prefix + target.toLocaleString();
                element.classList.remove('counting-blur');
            }
        }

        window.requestAnimationFrame(step);
    }

    const initAndResize = () => {
        moveToSlide(currentIndex, false);
    };

    window.requestAnimationFrame(() => {
        initAndResize();

        const preLoginPath = sessionStorage.getItem('preLoginToolPath');
        if (preLoginPath === window.location.pathname) {
            const preLoginState = JSON.parse(sessionStorage.getItem('preLoginState'));
            if (preLoginState) {
                loadAllCalculatorsState(preLoginState);
            }
            sessionStorage.removeItem('preLoginState');
            sessionStorage.removeItem('preLoginToolPath');
        } else {
            loadAllCalculatorsState();
        }

        document.querySelectorAll('.calculator-island input, .calculator-island select').forEach(input => {
            const eventType = (input.type === 'radio' || input.type === 'checkbox' || input.tagName === 'SELECT') ? 'change' : 'input';
            input.addEventListener(eventType, saveAllCalculatorsState);
        });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initAndResize, 100);
    });
});