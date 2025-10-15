document.addEventListener('DOMContentLoaded', function() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const container = document.querySelector('.carousel-container');
    const slides = Array.from(track.children);
    const nextButton = document.getElementById('next-slide');
    const prevButton = document.getElementById('prev-slide');
    const quickNav = document.getElementById('quick-access-nav');
    const mainTitle = document.getElementById('calculator-main-title');
    const mainDescription = document.getElementById('calculator-main-description');
    
    let currentIndex = 0;

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
            case 2: initPassportCalculator(); break;
            case 3: initVipCalculator(); break;
            case 4: initBuildingCalculator(); break;
        }
        
        targetSlide.dataset.initialized = 'true';
    }

    function initSkillCalculator() {
        const calculateSkillBtn = document.getElementById('calculate-skill-btn');
        if (!calculateSkillBtn) return;
        
        const startSkillInput = document.getElementById('start-skill');
        const desiredSkillInput = document.getElementById('desired-skill');
        const skillResultDiv = document.getElementById('skill-result');
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
        calculateSkillBtn.addEventListener('click', () => {
            const start = startSkillInput.value;
            const desired = desiredSkillInput.value;
            const rarity = document.querySelector('input[name="rarity"]:checked').value;
            const sculptureImage = `/images/calculators/${rarity}_sculpture.webp`;
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
        });
    }

    function initExpCalculator() {
        const calculateExpBtn = document.getElementById('calculate-exp-btn');
        if (!calculateExpBtn) return;
    
        const currentLevelInput = document.getElementById('current-exp-level');
        const currentExpInput = document.getElementById('current-exp-amount');
        const expResultDiv = document.getElementById('exp-result');
        const expTomeToggle = document.getElementById('exp-tome-toggle');
        const expTomeGrid = document.getElementById('exp-tome-grid-container');
    
        const expCosts = {
            legendary: [120, 360, 720, 1200, 3600, 7200, 10800, 14400, 18000, 22200, 27000, 32400, 38400, 45000, 52200, 60000, 67800, 75600, 84000, 90000, 96000, 103200, 110400, 117600, 126000, 134400, 142800, 151200, 162000, 180000, 204000, 234000, 270000, 312000, 360000, 414000, 474000, 540000, 660000, 810000, 960000, 1140000, 1320000, 1530000, 1740000, 1980000, 2220000, 2520000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000, 2820000],
            epic: [100, 300, 600, 1000, 3000, 6000, 9000, 12000, 15000, 18500, 22500, 27000, 32000, 37500, 43500, 50000, 56500, 63000, 70000, 75000, 80000, 86000, 92000, 98000, 105000, 112000, 119000, 126000, 135000, 150000, 170000, 195000, 225000, 260000, 300000, 345000, 395000, 450000, 550000, 675000, 800000, 950000, 1100000, 1275000, 1450000, 1650000, 1850000, 2100000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000, 2350000],
            elite: [80, 240, 480, 800, 2400, 4800, 7200, 9600, 12000, 14800, 18000, 21600, 25600, 30000, 34800, 40000, 45200, 50400, 56000, 60000, 64000, 68800, 73600, 78400, 84000, 89600, 95200, 100800, 108000, 120000, 136000, 156000, 180000, 208000, 240000, 276000, 316000, 360000, 440000, 540000, 640000, 760000, 880000, 1020000, 1160000, 1320000, 1480000, 1680000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000, 1880000],
            advanced: [60, 180, 360, 600, 1800, 3600, 5400, 7200, 9000, 11100, 13500, 16200, 19200, 22500, 26100, 30000, 33900, 37800, 42000, 45000, 48000, 51600, 55200, 58800, 63000, 67200, 71400, 75600, 81000, 90000, 102000, 117000, 135000, 156000, 180000, 207000, 237000, 270000, 330000, 405000, 480000, 570000, 660000, 765000, 870000, 990000, 1110000, 1260000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000, 1410000]
        };
    
        const cumulativeExp = Object.keys(expCosts).reduce((acc, rarity) => {
            acc[rarity] = expCosts[rarity].reduce((a, c, i) => { a.push((a[i-1] || 0) + c); return a; }, []);
            return acc;
        }, {});
    
        expTomeToggle.addEventListener('change', () => expTomeGrid.classList.toggle('visible', expTomeToggle.checked));
    
        calculateExpBtn.addEventListener('click', () => {
            expResultDiv.innerHTML = '';
            expResultDiv.classList.remove('error');
    
            const rarity = document.querySelector('input[name="exp-rarity"]:checked').value;
            const currentLevel = parseInt(currentLevelInput.value, 10);
            const currentExp = parseFloat(currentExpInput.value.replace(/,/g, '')) || 0;
            
            const maxLevel = 60;
    
            if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > maxLevel) {
                expResultDiv.textContent = `Please enter a valid level between 1 and ${maxLevel}.`;
                expResultDiv.classList.add('error'); 
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
            
            let expNeeded = totalExpToReachMaxLevel - totalCurrentExp;
    
            let totalTomeExp = 0;
            if (expTomeToggle.checked) {
                const expTomeInputs = document.querySelectorAll('.exp-tome-input');
                expTomeInputs.forEach(input => {
                    totalTomeExp += (parseInt(input.value, 10) || 0) * (parseInt(input.dataset.value, 10));
                });
                expNeeded -= totalTomeExp;
            }
    
            if (expNeeded <= 0) {
                const extraExp = Math.abs(expNeeded);
                expResultDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>You have enough EXP to reach level ${maxLevel}! You will have <strong id="exp-needed-value">${extraExp.toLocaleString()}</strong> EXP left over.</span>`;
    
            } else {
                expResultDiv.innerHTML = `<img src="/images/calculators/experience_book.webp" alt="EXP Book"><span>Requires <strong id="exp-needed-value">0</strong> more EXP to max</span>`;
                animateCounter(document.getElementById('exp-needed-value'), Math.round(expNeeded), 700);
            }
            triggerSuccessAnimation(expResultDiv);
        });
    }

    function initPassportCalculator() {
        const calculatePassportBtn = document.getElementById('calculate-passport-btn');
        if (!calculatePassportBtn) return;
        
        const powerInput = document.getElementById('power-input');
        const sameKvkCheckbox = document.getElementById('same-kvk-checkbox');
        const passportResultDiv = document.getElementById('passport-result');
        const currentPassportsInput = document.getElementById('current-passports-input');
        const costResultDiv = document.getElementById('cost-result');
        const passportBrackets = [ { maxPower: 9999999, normal: 1, discount: 1 }, { maxPower: 14999999, normal: 2, discount: 1 }, { maxPower: 19999999, normal: 3, discount: 1 }, { maxPower: 24999999, normal: 4, discount: 1 }, { maxPower: 29999999, normal: 6, discount: 1 }, { maxPower: 34999999, normal: 9, discount: 2 }, { maxPower: 39999999, normal: 12, discount: 3 }, { maxPower: 44999999, normal: 15, discount: 5 }, { maxPower: 49999999, normal: 20, discount: 8 }, { maxPower: 54999999, normal: 25, discount: 12 }, { maxPower: 59999999, normal: 30, discount: 15 }, { maxPower: 64999999, normal: 35, discount: 20 }, { maxPower: 69999999, normal: 40, discount: 25 }, { maxPower: 74999999, normal: 45, discount: 32 }, { maxPower: 79999999, normal: 50, discount: 40 }, { maxPower: 84999999, normal: 55, discount: 47 }, { maxPower: 89999999, normal: 60, discount: 54 }, { maxPower: 94999999, normal: 65, discount: 61 }, { maxPower: 99999999, normal: 70, discount: 67 }, { maxPower: Infinity, normal: 75, discount: 73 } ];
        
        function calculateBundleCost(passportsNeeded) {
            if (passportsNeeded <= 0) return 0;

            let cost = 0;
            let passportsObtained = 0;
            const tiers = [
                { cost: 5, passports: 1 },
                { cost: 10, passports: 2 },
                { cost: 20, passports: 3 },
                { cost: 50, passports: 4 },
            ];

            for (const tier of tiers) {
                if (passportsObtained < passportsNeeded) {
                    cost += tier.cost;
                    passportsObtained += tier.passports;
                } else {
                    break;
                }
            }

            if (passportsObtained < passportsNeeded) {
                const remainingPassports = passportsNeeded - passportsObtained;
                const hundredDollarBundlesNeeded = Math.ceil(remainingPassports / 5);
                cost += hundredDollarBundlesNeeded * 100;
            }
            return cost;
        }

        calculatePassportBtn.addEventListener('click', () => {
            passportResultDiv.innerHTML = ''; costResultDiv.innerHTML = ''; passportResultDiv.classList.remove('error'); costResultDiv.classList.remove('error');
            const power = parseInt(powerInput.value.replace(/,/g, ''), 10);
            if (isNaN(power) || power <= 0) { passportResultDiv.textContent = 'Please enter a valid, positive power.'; passportResultDiv.classList.add('error'); return; }
            const isDiscounted = sameKvkCheckbox.checked;
            const bracket = passportBrackets.find(b => power <= b.maxPower);
            const requiredPassports = isDiscounted ? bracket.discount : bracket.normal;
            const currentPassports = parseInt(currentPassportsInput.value.trim(), 10) || 0;
            if (isNaN(currentPassports) || currentPassports < 0) { costResultDiv.textContent = 'Current passports must be a positive number.'; costResultDiv.classList.add('error'); return; }
            const passportsNeeded = requiredPassports - currentPassports;

            if (passportsNeeded <= 0 && currentPassportsInput.value.trim()) { 
                passportResultDiv.innerHTML = `<i class="fas fa-check-circle"></i><span>You have enough passports!</span>`; 
            } else { 
                passportResultDiv.innerHTML = `<img src="/images/calculators/passport.webp" alt="Passport"><span>Requires <strong id="passport-value">0</strong> Passports</span>`; 
                animateCounter(document.getElementById('passport-value'), passportsNeeded > 0 ? passportsNeeded : requiredPassports, 700); 
            }

            if (passportsNeeded <= 0) { 
                costResultDiv.innerHTML = `<span>No additional cost required.</span>`; 
            } else {
                costResultDiv.innerHTML = `<div class="cost-line"><span>Credit Cost: <strong id="credit-cost-value">0</strong></span><img src="/images/calculators/alliance_credit.webp" alt="Alliance Credit"></div><div class="cost-line"><span>New World Cost: <strong id="usd-cost-value">0</strong></span><img src="/images/calculators/bundle.webp" alt="Bundle"></div>`;
                const totalPassportsFromBundles = (1 + 2 + 3 + 4) + (15 * 5); // 85
                if (passportsNeeded > totalPassportsFromBundles) { 
                    costResultDiv.innerHTML += `<small style='color: var(--text-secondary); margin-top: 5px;'>Note: Max passports from bundles per month is ${totalPassportsFromBundles}.</small>`; 
                }
                const bundleCost = calculateBundleCost(passportsNeeded);
                animateCounter(document.getElementById('credit-cost-value'), passportsNeeded * 600000, 700);
                animateCounter(document.getElementById('usd-cost-value'), bundleCost, 700, '$');
                triggerSuccessAnimation(costResultDiv);
            }
            triggerSuccessAnimation(passportResultDiv);
        });
    }

    function initVipCalculator() {
        const calculateVipBtn = document.getElementById('calculate-vip-btn');
        if(!calculateVipBtn) return;
        
        const currentVipPointsInput = document.getElementById('current-vip-points');
        const desiredVipLevelSelect = document.getElementById('desired-vip-level');
        const vipResultDiv = document.getElementById('vip-result');
        const vipTokenToggle = document.getElementById('vip-token-toggle');
        const vipTokenGrid = document.getElementById('vip-token-grid-container');
        
        const vipLevels = [ { level: 1, points: 200 }, { level: 2, points: 400 }, { level: 3, points: 1200 }, { level: 4, points: 3500 }, { level: 5, points: 6000 }, { level: 6, points: 11500 }, { level: 7, points: 17500 }, { level: 8, points: 35000 }, { level: 9, points: 75000 }, { level: 10, points: 150000 }, { level: 11, points: 250000 }, { level: 12, points: 350000 }, { level: 13, points: 500000 }, { level: 14, points: 750000 }, { level: 15, points: 1000000 }, { level: 16, points: 1500000 }, { level: 17, points: 2500000 }, { level: 18, points: 4000000 }, { level: 19, points: 6000000 }, { level: 'SVIP', points: 9000000 } ];

        vipTokenToggle.addEventListener('change', () => vipTokenGrid.classList.toggle('visible', vipTokenToggle.checked));

        calculateVipBtn.addEventListener('click', () => {
            vipResultDiv.classList.remove('error');
            let totalPoints = parseInt(currentVipPointsInput.value.replace(/,/g, ''), 10) || 0;
            
            if(vipTokenToggle.checked) {
                document.querySelectorAll('.vip-token-input').forEach(input => {
                    const count = parseInt(input.value, 10) || 0;
                    const value = parseInt(input.dataset.value, 10);
                    totalPoints += count * value;
                });
            }

            const targetPoints = parseInt(desiredVipLevelSelect.value, 10);
            if (isNaN(targetPoints)) { vipResultDiv.textContent = 'Please select a desired VIP level.'; vipResultDiv.classList.add('error'); return; }

            const pointsNeeded = targetPoints - totalPoints;

            if(pointsNeeded <= 0) {
                vipResultDiv.innerHTML = `<i class="fas fa-check-circle"></i> <span>You have reached or surpassed this level!</span>`;
            } else {
                const selectedOption = desiredVipLevelSelect.options[desiredVipLevelSelect.selectedIndex];
                const levelName = selectedOption.dataset.level;
                const levelImage = `/images/calculators/vip/${levelName.toLowerCase() === 'svip' ? 'svip' : 'vip' + levelName}.webp`;
                const levelText = levelName === 'SVIP' ? 'SVIP' : `VIP ${levelName}`;
                vipResultDiv.innerHTML = `<img src="${levelImage}" alt="${levelText}"><span>Needs <strong id="vip-points-needed">0</strong> more points for ${levelText}</span>`;
                animateCounter(document.getElementById('vip-points-needed'), pointsNeeded, 700);
            }
            triggerSuccessAnimation(vipResultDiv);
        });

        const customSelectContainer = document.querySelector('.carousel-slide.is-active .custom-select-container');
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
                const iconPath = `/images/calculators/vip/${iconName === 'svip' ? 'svip' : 'vip' + iconName}.webp`;
                itemDiv.innerHTML = `<img src="${iconPath}" alt="${levelName}">${levelName}`;
                itemDiv.addEventListener("click", function() {
                    selectEl.selectedIndex = index;
                    selectedDiv.innerHTML = this.innerHTML;
                    Array.from(optionsDiv.getElementsByClassName("same-as-selected")).forEach(el => el.classList.remove("same-as-selected"));
                    this.classList.add("same-as-selected");
                    closeAllSelect();
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
    }

    function initBuildingCalculator() {
        const calculateBuildingBtn = document.getElementById('calculate-building-btn');
        if(!calculateBuildingBtn) return;
        
        const buildingSelectors = document.querySelectorAll('input[name="building"]');
        const currentLevelInput = document.getElementById('current-level');
        const desiredLevelInput = document.getElementById('desired-level');
        const currentCurrencyInput = document.getElementById('current-currency');
        const buildingResultDiv = document.getElementById('building-cost-result');
        const currencyLabelText = document.getElementById('currency-label-text');
        const currencyLabelIcon = document.getElementById('currency-label-icon');

        const buildingData = {
            castle: { currencyName: "Books of Covenant", currencyImage: "/images/calculators/book_of_covenant.webp", costs: [0, 2, 5, 8, 15, 20, 30, 40, 50, 70, 80, 100, 125, 150, 300, 500, 700, 900, 1200, 1500, 1750, 2000, 2500, 3000, 5000] },
            watchtower: { currencyName: "Arrows of Resistance", currencyImage: "/images/calculators/arrow_of_resistance.webp", costs: [0, 2, 5, 8, 15, 20, 30, 40, 50, 70, 80, 100, 125, 150, 300, 500, 700, 900, 1200, 1500, 1800, 2000, 2500, 3000, 5000] },
            stateForum: { currencyName: "Sage's Testimony", currencyImage: "/images/calculators/sages_testimony.webp", costs: [0, 0, 10, 15, 15, 20, 25, 40, 50, 60, 90, 120, 170, 205, 250, 310, 390, 450, 620, 540, 1000, 1400, 2400, 4400, 7430] }
        };

        for (const building in buildingData) {
            buildingData[building].cumulativeCosts = buildingData[building].costs.reduce((acc, cost, i) => { acc.push((acc[i-1] || 0) + cost); return acc; }, []);
        }

        buildingSelectors.forEach(selector => {
            selector.addEventListener('change', () => {
                const selectedBuilding = document.querySelector('input[name="building"]:checked').value;
                const data = buildingData[selectedBuilding];
                if(currencyLabelText) currencyLabelText.textContent = `Current ${data.currencyName}`;
                if(currencyLabelIcon) {
                    currencyLabelIcon.src = data.currencyImage;
                    currencyLabelIcon.alt = data.currencyName;
                }
            });
        });

        calculateBuildingBtn.addEventListener('click', () => {
            buildingResultDiv.innerHTML = ''; buildingResultDiv.classList.remove('error');
            const selectedBuilding = document.querySelector('input[name="building"]:checked').value;
            const currentLevel = parseInt(currentLevelInput.value, 10);
            const desiredLevel = parseInt(desiredLevelInput.value, 10);
            const currentCurrency = parseInt(currentCurrencyInput.value, 10) || 0;
            
            if (isNaN(currentLevel) || isNaN(desiredLevel) || currentLevel < 1 || desiredLevel > 25) { buildingResultDiv.textContent = 'Please enter valid levels between 1 and 25.'; buildingResultDiv.classList.add('error'); return; }
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
                    <div class="cost-line"><span>Gem Cost: <strong id="building-gem-value">0</strong></span><img src="/images/calculators/gem.webp" alt="Gem"></div>`;
                animateCounter(document.getElementById('building-currency-value'), neededCurrency, 700);
                animateCounter(document.getElementById('building-gem-value'), gemCost, 700);
            }
            triggerSuccessAnimation(buildingResultDiv);
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
        let current = 0;
        const range = target - current;
        if (range === 0) {
            element.textContent = prefix + target.toLocaleString();
            element.classList.remove('counting-blur');
            return;
        }
        const increment = target > current ? 1 : -1;
        const stepTime = 16;
        const totalSteps = duration / stepTime;
        const incrementAmount = Math.max(1, Math.ceil(Math.abs(range) / totalSteps));
        const timer = setInterval(() => {
            current += increment * incrementAmount;
            if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                current = target;
                clearInterval(timer);
                element.textContent = prefix + Math.floor(current).toLocaleString();
                element.classList.remove('counting-blur');
            } else {
                element.textContent = prefix + Math.floor(current).toLocaleString();
            }
        }, stepTime);
    }
    
    const initAndResize = () => {
        moveToSlide(currentIndex, false);
    };

    window.requestAnimationFrame(() => {
        initAndResize();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initAndResize, 100);
    });
});