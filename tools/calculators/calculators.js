document.addEventListener('DOMContentLoaded', function() {
    
    const calculateSkillBtn = document.getElementById('calculate-skill-btn');
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
        acc[rarity] = costs[rarity].reduce((a, c, i) => {
            a.push((a[i-1] || 0) + c);
            return a;
        }, []);
        return acc;
    }, {});
    
    function getSkillPoints(skillString) {
        return skillString.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) - 4;
    }

    calculateSkillBtn.addEventListener('click', () => {
        const start = startSkillInput.value;
        const desired = desiredSkillInput.value;
        const rarity = document.querySelector('input[name="rarity"]:checked').value;
        const sculptureImage = `/images/calculators/${rarity}_sculpture.png`;

        if (!/^[1-5]{4}$/.test(start) || !/^[1-5]{4}$/.test(desired)) {
            skillResultDiv.textContent = 'Please enter valid 4-digit skill levels (e.g., 1111, 5511).';
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
        
        skillResultDiv.innerHTML = `
            <img src="${sculptureImage}" alt="${rarity} sculpture">
            <span>Requires ${totalCost.toLocaleString()} Sculptures</span>
        `;
    });


    const calculatePassportBtn = document.getElementById('calculate-passport-btn');
    const powerInput = document.getElementById('power-input');
    const sameKvkCheckbox = document.getElementById('same-kvk-checkbox');
    const passportResultDiv = document.getElementById('passport-result');

    const passportBrackets = [
        { maxPower: 9999999, normal: 1, discount: 1 },
        { maxPower: 14999999, normal: 2, discount: 1 },
        { maxPower: 19999999, normal: 3, discount: 1 },
        { maxPower: 24999999, normal: 4, discount: 1 },
        { maxPower: 29999999, normal: 6, discount: 1 },
        { maxPower: 34999999, normal: 9, discount: 2 },
        { maxPower: 39999999, normal: 12, discount: 3 },
        { maxPower: 44999999, normal: 15, discount: 5 },
        { maxPower: 49999999, normal: 20, discount: 8 },
        { maxPower: 54999999, normal: 25, discount: 12 },
        { maxPower: 59999999, normal: 30, discount: 15 },
        { maxPower: 64999999, normal: 35, discount: 20 },
        { maxPower: 69999999, normal: 40, discount: 25 },
        { maxPower: 74999999, normal: 45, discount: 32 },
        { maxPower: 79999999, normal: 50, discount: 40 },
        { maxPower: 84999999, normal: 55, discount: 47 },
        { maxPower: 89999999, normal: 60, discount: 54 },
        { maxPower: 94999999, normal: 65, discount: 61 },
        { maxPower: 99999999, normal: 70, discount: 67 },
        { maxPower: Infinity, normal: 75, discount: 73 }
    ];

    calculatePassportBtn.addEventListener('click', () => {
        const powerString = powerInput.value.replace(/,/g, '');
        const power = parseInt(powerString, 10);

        if (isNaN(power) || power <= 0) {
            passportResultDiv.textContent = 'Please enter a valid, positive power.';
            passportResultDiv.classList.add('error');
            return;
        }
        
        passportResultDiv.classList.remove('error');

        const isDiscounted = sameKvkCheckbox.checked;
        const bracket = passportBrackets.find(b => power <= b.maxPower);
        const cost = isDiscounted ? bracket.discount : bracket.normal;

        passportResultDiv.innerHTML = `
            <img src="/images/calculators/passport.png" alt="Passport">
            <span>Requires ${cost} Passports</span>
        `;
    });

});