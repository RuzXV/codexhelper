<script lang="ts">
    import { onMount } from 'svelte';
    import techTreeData from '../../data/crystalTechTree.json';

    // Import tech icons
    import iconQuenchedBladesI from '../../assets/images/kvk_suite/tech_icons/Quenched Blades I.webp';
    import iconQuenchedBladesII from '../../assets/images/kvk_suite/tech_icons/Quenched Blades II.webp';
    import iconSwiftMarchingI from '../../assets/images/kvk_suite/tech_icons/Swift Marching I.webp';
    import iconSwiftMarchingII from '../../assets/images/kvk_suite/tech_icons/Swift Marching II.webp';
    import iconSwiftMarchingIII from '../../assets/images/kvk_suite/tech_icons/Swift Marching III.webp';
    import iconImprovedBowsI from '../../assets/images/kvk_suite/tech_icons/Improved Bows I.webp';
    import iconImprovedBowsII from '../../assets/images/kvk_suite/tech_icons/Improved Bows II.webp';
    import iconFleetOfFootI from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot I.webp';
    import iconFleetOfFootII from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot II.webp';
    import iconFleetOfFootIII from '../../assets/images/kvk_suite/tech_icons/Fleet of Foot III.webp';
    import iconMountedCombatTechniquesI from '../../assets/images/kvk_suite/tech_icons/Mounted Combat Techniques I.webp';
    import iconMountedCombatTechniquesII from '../../assets/images/kvk_suite/tech_icons/Mounted Combat Techniques II.webp';
    import iconSwiftSteedsI from '../../assets/images/kvk_suite/tech_icons/Swift Steeds I.webp';
    import iconSwiftSteedsII from '../../assets/images/kvk_suite/tech_icons/Swift Steeds II.webp';
    import iconSwiftSteedsIII from '../../assets/images/kvk_suite/tech_icons/Swift Steeds III.webp';
    import iconImprovedProjectilesI from '../../assets/images/kvk_suite/tech_icons/Improved Projectiles I.webp';
    import iconImprovedProjectilesII from '../../assets/images/kvk_suite/tech_icons/Improved Projectiles II.webp';
    import iconReinforcedAxlesI from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles I.webp';
    import iconReinforcedAxlesII from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles II.webp';
    import iconReinforcedAxlesIII from '../../assets/images/kvk_suite/tech_icons/Reinforced Axles III.webp';
    import iconCallToArmsI from '../../assets/images/kvk_suite/tech_icons/Call To Arms I.webp';
    import iconCallToArmsII from '../../assets/images/kvk_suite/tech_icons/Call To Arms II.webp';
    import iconCuttingCornersI from '../../assets/images/kvk_suite/tech_icons/Cutting Corners I.webp';
    import iconCuttingCornersII from '../../assets/images/kvk_suite/tech_icons/Cutting Corners II.webp';
    import iconLeadershipI from '../../assets/images/kvk_suite/tech_icons/Leadership I.webp';
    import iconLeadershipII from '../../assets/images/kvk_suite/tech_icons/Leadership II.webp';
    import iconCulturalExchange from '../../assets/images/kvk_suite/tech_icons/Cultural Exchange.webp';
    import iconBarbarianBounties from '../../assets/images/kvk_suite/tech_icons/Barbarian Bounties.webp';
    import iconKarakuReports from '../../assets/images/kvk_suite/tech_icons/Karaku Reports.webp';
    import iconStarmetalShields from '../../assets/images/kvk_suite/tech_icons/Starmetal Shields.webp';
    import iconStarmetalBracers from '../../assets/images/kvk_suite/tech_icons/Starmetal Bracers.webp';
    import iconStarmetalHarnesses from '../../assets/images/kvk_suite/tech_icons/Starmetal Barding.webp';
    import iconStarmetalAxles from '../../assets/images/kvk_suite/tech_icons/Starmetal Axles.webp';
    import iconLargerCamps from '../../assets/images/kvk_suite/tech_icons/Larger Camps.webp';
    import iconSpecialConcoctionsI from '../../assets/images/kvk_suite/tech_icons/Special Concoctions I.webp';
    import iconSpecialConcoctionsII from '../../assets/images/kvk_suite/tech_icons/Special Concoctions II.webp';
    import iconRunecraft from '../../assets/images/kvk_suite/tech_icons/Runecraft.webp';
    import iconEmergencySupport from '../../assets/images/kvk_suite/tech_icons/Emergency Support.webp';
    import iconExpandedFormationI from '../../assets/images/kvk_suite/tech_icons/Expanded Formation I.webp';
    import iconExpandedFormationII from '../../assets/images/kvk_suite/tech_icons/Expanded Formation II.webp';
    import iconRapidRetreat from '../../assets/images/kvk_suite/tech_icons/Rapid Retreat.webp';
    import iconIronInfantry from '../../assets/images/kvk_suite/tech_icons/Iron Infantry.webp';
    import iconArchersFocus from "../../assets/images/kvk_suite/tech_icons/Archer's Focus.webp";
    import iconRidersResilience from "../../assets/images/kvk_suite/tech_icons/Rider's Resilience.webp";
    import iconSiegeProvisions from '../../assets/images/kvk_suite/tech_icons/Siege Provisions.webp';
    import iconCelestialGuidance from '../../assets/images/kvk_suite/tech_icons/Celestial Guidance.webp';
    import iconInfantryExpert from '../../assets/images/kvk_suite/tech_icons/Infantry Expert.webp';
    import iconArcherExpert from '../../assets/images/kvk_suite/tech_icons/Archer Expert.webp';
    import iconCavalryExpert from '../../assets/images/kvk_suite/tech_icons/Cavalry Expert.webp';
    import iconSiegeExpert from '../../assets/images/kvk_suite/tech_icons/Siege Expert.webp';
    import iconSurpriseStrike from '../../assets/images/kvk_suite/tech_icons/Surprise Strike.webp';

    // Import counter icons
    import crystalIcon from '../../assets/images/kvk_suite/crystal.webp';
    import researchSpeedupIcon from '../../assets/images/kvk_suite/research_speedup.webp';
    import seasonCoinIcon from '../../assets/images/kvk_suite/season_coin.webp';

    // Import settings icons
    import versionIcon from '../../assets/images/kvk_suite/version.webp';
    import researchCenterIcon from '../../assets/images/kvk_suite/research_center.webp';

    // Tech icon mapping (techKey -> icon)
    const techIcons: Record<string, ImageMetadata> = {
        quenchedBladesI: iconQuenchedBladesI,
        quenchedBladesII: iconQuenchedBladesII,
        swiftMarchingI: iconSwiftMarchingI,
        swiftMarchingII: iconSwiftMarchingII,
        swiftMarchingIII: iconSwiftMarchingIII,
        improvedBowsI: iconImprovedBowsI,
        improvedBowsII: iconImprovedBowsII,
        fleetOfFootI: iconFleetOfFootI,
        fleetOfFootII: iconFleetOfFootII,
        fleetOfFootIII: iconFleetOfFootIII,
        mountedCombatTechniquesI: iconMountedCombatTechniquesI,
        mountedCombatTechniquesII: iconMountedCombatTechniquesII,
        swiftSteedsI: iconSwiftSteedsI,
        swiftSteedsII: iconSwiftSteedsII,
        swiftSteedsIII: iconSwiftSteedsIII,
        improvedProjectilesI: iconImprovedProjectilesI,
        improvedProjectilesII: iconImprovedProjectilesII,
        reinforcedAxlesI: iconReinforcedAxlesI,
        reinforcedAxlesII: iconReinforcedAxlesII,
        reinforcedAxlesIII: iconReinforcedAxlesIII,
        callToArmsI: iconCallToArmsI,
        callToArmsII: iconCallToArmsII,
        cuttingCornersI: iconCuttingCornersI,
        cuttingCornersII: iconCuttingCornersII,
        leadershipI: iconLeadershipI,
        leadershipII: iconLeadershipII,
        culturalExchange: iconCulturalExchange,
        barbarianBounties: iconBarbarianBounties,
        karakuReports: iconKarakuReports,
        starmetalShields: iconStarmetalShields,
        starmetalBracers: iconStarmetalBracers,
        starmetalBarding: iconStarmetalHarnesses,
        starmetalAxles: iconStarmetalAxles,
        largerCamps: iconLargerCamps,
        specialConcoctionsI: iconSpecialConcoctionsI,
        specialConcoctionsII: iconSpecialConcoctionsII,
        runecraft: iconRunecraft,
        emergencySupport: iconEmergencySupport,
        expandedFormationsI: iconExpandedFormationI,
        expandedFormationsII: iconExpandedFormationII,
        rapidRetreat: iconRapidRetreat,
        ironInfantry: iconIronInfantry,
        archersFocus: iconArchersFocus,
        ridersResilience: iconRidersResilience,
        siegeProvisions: iconSiegeProvisions,
        celestialGuidance: iconCelestialGuidance,
        infantryExpert: iconInfantryExpert,
        archerExpert: iconArcherExpert,
        cavalryExpert: iconCavalryExpert,
        siegeExpert: iconSiegeExpert,
        surpriseStrike: iconSurpriseStrike,
    };

    // Helper function to get icon for a tech key
    function getTechIcon(techKey: string | null): ImageMetadata | null {
        if (!techKey) return null;
        return techIcons[techKey] || null;
    }

    // Helper function to determine text size class based on name length
    function getTextSizeClass(name: string | undefined): string {
        if (!name) return '';
        // Exceptions that should use regular size
        if (name === 'Reinforced Axles II' || name === 'Reinforced Axles III') return '';
        const len = name.length;
        if (len > 24) return 'text-xs';
        if (len > 18) return 'text-sm';
        return '';
    }

    // Types - Updated for new JSON structure
    interface TechLevel {
        level: number;
        buff: string;
        time: string;
        crystals: number;
        seasonCoins: number;
    }

    interface TechTotals {
        buff: string;
        time: string;
        crystals: number;
        seasonCoins: number;
    }

    interface TechRequirement {
        level: number;
        tech?: string;
        techLevel?: number;
        anyOf?: string[];
        allOf?: string[];
    }

    interface Technology {
        name: string;
        description: string;
        buffType: string;
        category: string;
        maxLevel: number;
        levels: TechLevel[];
        totals: TechTotals;
        requirements: TechRequirement[];
    }

    interface TechNode {
        key: string;
        name: string;
        maxLevel: number;
        currentLevel: number;
        category: string;
        buffType: string;
        totalBuff: string;
        totalCrystals: number;
        position: { x: number; y: number };
        unlocked: boolean;
        technology: Technology;
    }

    // Build tech nodes from JSON data with proper grid layout
    // ============================================================
    // LAYOUT SYSTEM:
    // - 4 invisible horizontal lines: Infantry (0), Archer (1), Cavalry (2), Siege (3)
    // - Tiles can sit ON a line (row = 0, 1, 2, 3) or BETWEEN lines (row = 0.5, 1.5, 2.5)
    // - Column (col) determines horizontal position from left
    // - Fixed gap between tiles, with connection lines
    // ============================================================

    const NODE_WIDTH = 230;      // Tiles width
    const NODE_HEIGHT = 80;       // Slightly less tall
    const H_GAP = 70;             // Horizontal gap between tiles
    const LINE_SPACING = 140;     // Vertical spacing between the 4 main lines
    const PADDING_LEFT = 40;
    const PADDING_TOP = 110;      // Extra padding for top pattern (centered with bottom)
    const PADDING_BOTTOM = 110;   // Extra padding for bottom pattern + tooltip room

    // The 4 horizontal lines (Y positions will be calculated from these)
    // Line 0 = Infantry, Line 1 = Archer, Line 2 = Cavalry, Line 3 = Siege
    // Utility techs can go between/below these lines

    // ============================================================
    // TILE POSITIONS
    // Pattern: 4-4-1-3-3-2-4-4-4-1-3-2-4-4-1-2-4-1
    // - Even numbers (2,4): tiles ON the lines (rows 0, 1, 2, 3)
    // - Odd numbers (1,3): tiles BETWEEN lines (rows 0.5, 1.5, 2.5)
    // ============================================================

    // Column layout pattern
    const columnPattern = [4, 4, 1, 3, 3, 2, 4, 4, 4, 1, 3, 2, 4, 4, 1, 2, 4, 1];

    // Generate positions based on pattern
    // Even count: rows 0, 1, 2, 3 (on lines)
    // Odd count: centered between lines
    //   - 1 tile: row 1.5 (center)
    //   - 3 tiles: rows 0.5, 1.5, 2.5 (between lines)

    function getRowsForCount(count: number): number[] {
        if (count === 4) return [0, 1, 2, 3];           // On all 4 lines
        if (count === 2) return [0.5, 2.5];             // Top and bottom of 3-tile layout (middle is empty for line pass-through)
        if (count === 3) return [0.5, 1.5, 2.5];        // Between all lines
        if (count === 1) return [1.5];                  // Center (between Archer/Cavalry)
        return [];
    }

    // Build placeholder positions - will be filled with actual tech names later
    const generatedPositions: { col: number; row: number; slot: string }[] = [];
    columnPattern.forEach((count, colIndex) => {
        const rows = getRowsForCount(count);
        rows.forEach((row, slotIndex) => {
            generatedPositions.push({
                col: colIndex,
                row: row,
                slot: `col${colIndex}_slot${slotIndex}`
            });
        });
    });

    // TECH ASSIGNMENTS - Map slot positions to actual tech keys
    // Format: 'col{X}_slot{Y}': 'techKeyName'
    // Layout: 4 rows = Infantry (0), Archer (1), Cavalry (2), Siege (3)
    // Pattern: 4-4-1-3-3-2-4-4-4-1-3-2-4-4-1-2-4-1
    const techAssignments: Record<string, string> = {
        // Column 0 (4 tiles) - Tier 1 Attack Stats
        'col0_slot0': 'quenchedBladesI',           // Infantry Attack I
        'col0_slot1': 'improvedBowsI',             // Archer Attack I
        'col0_slot2': 'mountedCombatTechniquesI',  // Cavalry Attack I
        'col0_slot3': 'improvedProjectilesI',      // Siege Attack I

        // Column 1 (4 tiles) - Tier 1 March Speed
        'col1_slot0': 'swiftMarchingI',            // Infantry March I
        'col1_slot1': 'fleetOfFootI',              // Archer March I
        'col1_slot2': 'swiftSteedsI',              // Cavalry March I
        'col1_slot3': 'reinforcedAxlesI',          // Siege March I

        // Column 2 (1 tile) - Central utility
        'col2_slot0': 'callToArmsI',               // Call To Arms I

        // Column 3 (3 tiles) - Utility branches
        'col3_slot0': 'cuttingCornersI',           // Cutting Corners I
        'col3_slot1': 'culturalExchange',          // Cultural Exchange (swapped with Leadership I)
        'col3_slot2': 'leadershipI',               // Leadership I (swapped with Cultural Exchange)

        // Column 4 (3 tiles) - Utility branches continued
        'col4_slot0': 'barbarianBounties',         // Barbarian Bounties
        'col4_slot1': 'callToArmsII',              // Call To Arms II (swapped with Karaku Reports)
        'col4_slot2': 'karakuReports',             // Karaku Reports (swapped with Call To Arms II)

        // Column 5 (2 tiles) - positioned at rows 0.5, 2.5
        'col5_slot0': 'cuttingCornersII',          // Cutting Corners II
        'col5_slot1': 'leadershipII',              // Leadership II

        // Column 6 (4 tiles) - Tier 2 Attack Stats
        'col6_slot0': 'quenchedBladesII',          // Infantry Attack II
        'col6_slot1': 'improvedBowsII',            // Archer Attack II
        'col6_slot2': 'mountedCombatTechniquesII', // Cavalry Attack II
        'col6_slot3': 'improvedProjectilesII',     // Siege Attack II

        // Column 7 (4 tiles) - Defense Stats
        'col7_slot0': 'starmetalShields',          // Infantry Defense
        'col7_slot1': 'starmetalBracers',          // Archer Defense
        'col7_slot2': 'starmetalBarding',          // Cavalry Defense
        'col7_slot3': 'starmetalAxles',            // Siege Defense

        // Column 8 (4 tiles) - Tier 2 March Speed
        'col8_slot0': 'swiftMarchingII',           // Infantry March II
        'col8_slot1': 'fleetOfFootII',             // Archer March II
        'col8_slot2': 'swiftSteedsII',             // Cavalry March II
        'col8_slot3': 'reinforcedAxlesII',         // Siege March II

        // Column 9 (1 tile) - Central utility
        'col9_slot0': 'largerCamps',               // Larger Camps

        // Column 10 (3 tiles) - Utility branches
        'col10_slot0': 'runecraft',                // Runecraft (swapped with Special Concoctions I)
        'col10_slot1': 'specialConcoctionsI',      // Special Concoctions I (swapped with Runecraft)
        'col10_slot2': 'expandedFormationsI',      // Expanded Formations I (swapped with Emergency Support)

        // Column 11 (2 tiles) - positioned at rows 0.5, 2.5
        'col11_slot0': 'emergencySupport',         // Emergency Support (swapped with Expanded Formation I)
        'col11_slot1': 'rapidRetreat',             // Rapid Retreat

        // Column 12 (4 tiles) - Tier 3 Health/Specialty Stats
        'col12_slot0': 'ironInfantry',             // Iron Infantry
        'col12_slot1': 'archersFocus',             // Archer's Focus
        'col12_slot2': 'ridersResilience',         // Rider's Resilience
        'col12_slot3': 'siegeProvisions',          // Siege Provisions

        // Column 13 (4 tiles) - Tier 3 March Speed
        'col13_slot0': 'swiftMarchingIII',         // Infantry March III
        'col13_slot1': 'fleetOfFootIII',           // Archer March III
        'col13_slot2': 'swiftSteedsIII',           // Cavalry March III
        'col13_slot3': 'reinforcedAxlesIII',       // Siege March III

        // Column 14 (1 tile) - Central utility
        'col14_slot0': 'specialConcoctionsII',     // Special Concoctions II

        // Column 15 (2 tiles) - positioned at rows 0.5, 2.5
        'col15_slot0': 'celestialGuidance',        // Celestial Guidance
        'col15_slot1': 'expandedFormationsII',     // Expanded Formations II

        // Column 16 (4 tiles) - Expert Stats
        'col16_slot0': 'infantryExpert',           // Infantry Expert
        'col16_slot1': 'archerExpert',             // Archer Expert
        'col16_slot2': 'cavalryExpert',            // Cavalry Expert
        'col16_slot3': 'siegeExpert',              // Siege Expert

        // Column 17 (1 tile) - Final utility
        'col17_slot0': 'surpriseStrike',           // Surprise Strike
    };

    // Build final positions from assignments
    const techPositions: Record<string, { col: number; row: number }> = {};
    generatedPositions.forEach(pos => {
        const techKey = techAssignments[pos.slot];
        if (techKey) {
            techPositions[techKey] = { col: pos.col, row: pos.row };
        }
    });

    // ============================================================
    // CONNECTION DEFINITIONS
    // Format: [fromSlot, toSlot] - defines which tiles connect
    // Pattern: 4→4→1→3(mid)→3(mid)→2→4→4→4→1→3(mid)→2→4→4→1→2(mid)→4→1
    // ============================================================
    const connections: [string, string][] = [
        // Col 0 (4) → Col 1 (4): each to each
        ['col0_slot0', 'col1_slot0'],
        ['col0_slot1', 'col1_slot1'],
        ['col0_slot2', 'col1_slot2'],
        ['col0_slot3', 'col1_slot3'],

        // Col 1 (4) → Col 2 (1): all 4 converge to 1
        ['col1_slot0', 'col2_slot0'],
        ['col1_slot1', 'col2_slot0'],
        ['col1_slot2', 'col2_slot0'],
        ['col1_slot3', 'col2_slot0'],

        // Col 2 (1) → Col 3 (3): 1 goes to all 3
        ['col2_slot0', 'col3_slot0'],
        ['col2_slot0', 'col3_slot1'],
        ['col2_slot0', 'col3_slot2'],

        // Col 3 (3) → Col 4 (3): only middle continues to all 3
        ['col3_slot1', 'col4_slot0'],
        ['col3_slot1', 'col4_slot1'],
        ['col3_slot1', 'col4_slot2'],

        // Col 4 (3) → Col 5 (2): middle goes to both tiles
        ['col4_slot1', 'col5_slot0'],
        ['col4_slot1', 'col5_slot1'],

        // Col 4 middle → Col 6 (4): Line passes THROUGH the gap between col5 tiles (row 1.5) then fans to all 4
        // This is a special pass-through connection drawn separately

        // Col 6 (4) → Col 7 (4): each to each
        ['col6_slot0', 'col7_slot0'],
        ['col6_slot1', 'col7_slot1'],
        ['col6_slot2', 'col7_slot2'],
        ['col6_slot3', 'col7_slot3'],

        // Col 7 (4) → Col 8 (4): each to each
        ['col7_slot0', 'col8_slot0'],
        ['col7_slot1', 'col8_slot1'],
        ['col7_slot2', 'col8_slot2'],
        ['col7_slot3', 'col8_slot3'],

        // Col 8 (4) → Col 9 (1): all 4 converge to 1
        ['col8_slot0', 'col9_slot0'],
        ['col8_slot1', 'col9_slot0'],
        ['col8_slot2', 'col9_slot0'],
        ['col8_slot3', 'col9_slot0'],

        // Col 9 (1) → Col 10 (3): 1 goes to all 3
        ['col9_slot0', 'col10_slot0'],
        ['col9_slot0', 'col10_slot1'],
        ['col9_slot0', 'col10_slot2'],

        // Col 10 (3) → Col 11 (2): only middle goes to both tiles
        ['col10_slot1', 'col11_slot0'],
        ['col10_slot1', 'col11_slot1'],

        // Col 10 middle → Col 12 (4): Line passes THROUGH the gap between col11 tiles then fans to all 4
        // This is a special pass-through connection drawn separately

        // Col 12 (4) → Col 13 (4): each to each
        ['col12_slot0', 'col13_slot0'],
        ['col12_slot1', 'col13_slot1'],
        ['col12_slot2', 'col13_slot2'],
        ['col12_slot3', 'col13_slot3'],

        // Col 13 (4) → Col 14 (1): all 4 converge to 1
        ['col13_slot0', 'col14_slot0'],
        ['col13_slot1', 'col14_slot0'],
        ['col13_slot2', 'col14_slot0'],
        ['col13_slot3', 'col14_slot0'],

        // Col 14 (1) → Col 15 (2): 1 goes to both tiles
        ['col14_slot0', 'col15_slot0'],
        ['col14_slot0', 'col15_slot1'],

        // Col 14 → Col 16 (4): Line passes THROUGH the gap between col15 tiles then fans to all 4
        // This is a special pass-through connection drawn separately

        // Col 16 (4) → Col 17 (1): all 4 converge to 1
        ['col16_slot0', 'col17_slot0'],
        ['col16_slot1', 'col17_slot0'],
        ['col16_slot2', 'col17_slot0'],
        ['col16_slot3', 'col17_slot0'],
    ];

    // Special pass-through connections: line comes from previous column's middle slot,
    // passes through the empty middle of the 2-tile column, then fans out to 4
    // Format: { fromCol: number, fromSlot: number, throughCol: number, toCol: number }
    const passThroughConnections = [
        { fromCol: 4, fromSlot: 1, throughCol: 5, toCol: 6 },   // Col 4 mid → through Col 5 gap → Col 6 (4)
        { fromCol: 10, fromSlot: 1, throughCol: 11, toCol: 12 }, // Col 10 mid → through Col 11 gap → Col 12 (4)
        { fromCol: 14, fromSlot: 0, throughCol: 15, toCol: 16 }, // Col 14 (single) → through Col 15 gap → Col 16 (4)
    ];

    // Build a map of slot positions for connection drawing
    const slotPositionMap: Record<string, { x: number; y: number }> = {};
    generatedPositions.forEach(pos => {
        slotPositionMap[pos.slot] = {
            x: PADDING_LEFT + pos.col * (NODE_WIDTH + H_GAP),
            y: PADDING_TOP + pos.row * LINE_SPACING
        };
    });

    // User's current tech levels (will be made interactive later)
    let userTechLevels: Record<string, number> = {};

    // Build placeholder nodes to visualize the layout
    interface PlaceholderNode {
        slot: string;
        col: number;
        row: number;
        position: { x: number; y: number };
        techKey: string | null;
        technology: Technology | null;
    }

    // Tooltip state
    let hoveredNode: PlaceholderNode | null = null;
    let tooltipX = 0;
    let tooltipY = 0;

    // Highlighted tech state (for when clicking on a requirement)
    let highlightedTechKey: string | null = null;

    // Settings state
    let selectedVersion = 'v5';
    let researchCenterLevel = 25;
    let isVersionDropdownOpen = false;
    let isRCDropdownOpen = false;

    // Available versions (future-proofed for more versions)
    const availableVersions = [
        { id: 'v5', name: 'Version 5 (Current)' }
    ];

    // RC level requirements for specific techs
    const rcRequirements: Record<string, Record<number, number>> = {
        callToArmsI: { 9: 17 },
        callToArmsII: { 6: 18, 8: 21, 9: 24, 10: 25 }
    };

    // Get RC requirement for a specific tech and level
    function getRCRequirement(techKey: string, level: number): number | null {
        const techReqs = rcRequirements[techKey];
        if (!techReqs) return null;
        return techReqs[level] || null;
    }

    // Check if user meets RC requirement
    function meetsRCRequirement(techKey: string, level: number): boolean {
        const req = getRCRequirement(techKey, level);
        if (req === null) return true;
        return researchCenterLevel >= req;
    }

    // Toggle dropdowns
    function toggleVersionDropdown() {
        isVersionDropdownOpen = !isVersionDropdownOpen;
        isRCDropdownOpen = false;
    }

    function toggleRCDropdown() {
        isRCDropdownOpen = !isRCDropdownOpen;
        isVersionDropdownOpen = false;
    }

    function selectVersion(version: string) {
        selectedVersion = version;
        isVersionDropdownOpen = false;
    }

    function selectRCLevel(level: number) {
        researchCenterLevel = level;
        isRCDropdownOpen = false;
    }

    // Close dropdowns when clicking outside
    function handleSettingsOutsideClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-dropdown')) {
            isVersionDropdownOpen = false;
            isRCDropdownOpen = false;
        }
    }

    // Global click handler for closing dropdowns
    function handleGlobalClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.settings-dropdown')) {
            isVersionDropdownOpen = false;
            isRCDropdownOpen = false;
        }
    }

    // Get all techs for lookup - directly from the flat technologies object
    const allTechs: Record<string, Technology> = techTreeData.technologies as Record<string, Technology>;

    // Reactive counters for total crystals and speedups used
    $: totalCrystalsUsed = Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
        const tech = allTechs[techKey];
        if (!tech || level <= 0) return total;
        // Sum crystals for all levels up to current level
        const crystalsForLevels = tech.levels.slice(0, level).reduce((sum: number, lvl: TechLevel) => sum + lvl.crystals, 0);
        return total + crystalsForLevels;
    }, 0);

    $: totalSpeedupsUsed = Object.entries(userTechLevels).reduce((total, [techKey, level]) => {
        const tech = allTechs[techKey];
        if (!tech || level <= 0) return total;
        // Sum time for all levels up to current level (convert to days)
        const timeForLevels = tech.levels.slice(0, level).reduce((sum: number, lvl: TechLevel) => {
            // Parse time string like "1d 2h 30m" or "12h 30m" or "8d 4h"
            const timeStr = lvl.time;
            let days = 0;
            const dayMatch = timeStr.match(/(\d+)d/);
            const hourMatch = timeStr.match(/(\d+)h/);
            const minMatch = timeStr.match(/(\d+)m/);
            const secMatch = timeStr.match(/(\d+)s/);
            if (dayMatch) days += parseInt(dayMatch[1]);
            if (hourMatch) days += parseInt(hourMatch[1]) / 24;
            if (minMatch) days += parseInt(minMatch[1]) / 1440;
            if (secMatch) days += parseInt(secMatch[1]) / 86400;
            return sum + days;
        }, 0);
        return total + timeForLevels;
    }, 0);

    // Build placeholder nodes for visualization
    let placeholderNodes: PlaceholderNode[] = generatedPositions.map(pos => {
        const techKey = techAssignments[pos.slot] || null;
        const tech = techKey ? allTechs[techKey] : null;
        return {
            slot: pos.slot,
            col: pos.col,
            row: pos.row,
            position: {
                x: PADDING_LEFT + pos.col * (NODE_WIDTH + H_GAP),
                y: PADDING_TOP + pos.row * LINE_SPACING
            },
            techKey,
            technology: tech
        };
    });

    // Build the actual tech nodes (only for assigned techs)
    function buildTechNodes(): TechNode[] {
        const nodes: TechNode[] = [];

        Object.entries(techPositions).forEach(([techKey, pos]) => {
            const tech = allTechs[techKey];
            if (!tech) return;

            const currentLevel = userTechLevels[techKey] || 0;
            const x = PADDING_LEFT + pos.col * (NODE_WIDTH + H_GAP);
            const y = PADDING_TOP + pos.row * LINE_SPACING;

            nodes.push({
                key: techKey,
                name: tech.name,
                maxLevel: tech.maxLevel,
                currentLevel,
                category: tech.category,
                buffType: tech.buffType,
                totalBuff: tech.totals.buff,
                totalCrystals: tech.totals.crystals,
                position: { x, y },
                unlocked: currentLevel > 0,
                technology: tech
            });
        });

        return nodes;
    }

    let techNodes = buildTechNodes();

    // Calculate canvas dimensions
    const totalColumns = columnPattern.length;
    const canvasWidth = PADDING_LEFT + totalColumns * (NODE_WIDTH + H_GAP) + 50;
    // Height: 4 lines (0,1,2,3) = 3 gaps between them, plus node height, plus padding top/bottom
    const canvasHeight = PADDING_TOP + (3 * LINE_SPACING) + NODE_HEIGHT + PADDING_BOTTOM;

    // Category colors
    const categoryColors: Record<string, string> = {
        infantry: '#E63946',
        archer: '#2A9D8F',
        cavalry: '#E9C46A',
        siege: '#9B59B6',
        utility: '#3498DB'
    };

    // Viewport and dragging state
    let viewport: HTMLElement;
    let canvas: HTMLElement;
    let svg: SVGSVGElement;
    let containerEl: HTMLElement;

    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let currentTranslateX = 0;

    function getMaxScroll(): number {
        if (!viewport || !canvas) return 0;
        const viewportWidth = viewport.clientWidth;
        const canvasWidth = canvas.scrollWidth;
        return Math.max(0, canvasWidth - viewportWidth);
    }

    function setTransform(x: number): void {
        const maxScroll = getMaxScroll();
        currentTranslateX = Math.max(-maxScroll, Math.min(0, x));
        if (canvas) {
            canvas.style.transform = `translateX(${currentTranslateX}px)`;
        }
    }

    function handleMouseDown(e: MouseEvent): void {
        if ((e.target as HTMLElement).closest('.tech-node')) return;
        isDragging = true;
        startX = e.pageX;
        scrollLeft = currentTranslateX;
        if (viewport) viewport.style.cursor = 'grabbing';
        if (canvas) canvas.style.transition = 'none';
    }

    function handleMouseMove(e: MouseEvent): void {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX;
        const walk = x - startX;
        setTransform(scrollLeft + walk);
    }

    function handleMouseUp(): void {
        if (isDragging) {
            isDragging = false;
            if (viewport) viewport.style.cursor = 'grab';
            if (canvas) canvas.style.transition = 'transform 0.1s ease-out';
        }
    }

    function handleTouchStart(e: TouchEvent): void {
        if ((e.target as HTMLElement).closest('.tech-node')) return;
        isDragging = true;
        startX = e.touches[0].pageX;
        scrollLeft = currentTranslateX;
        if (canvas) canvas.style.transition = 'none';
    }

    function handleTouchMove(e: TouchEvent): void {
        if (!isDragging) return;
        const x = e.touches[0].pageX;
        const walk = x - startX;
        setTransform(scrollLeft + walk);
    }

    function handleTouchEnd(): void {
        isDragging = false;
        if (canvas) canvas.style.transition = 'transform 0.1s ease-out';
    }

    function handleWheel(e: WheelEvent): void {
        e.preventDefault();
        const delta = e.deltaY || e.deltaX;
        setTransform(currentTranslateX - delta);
    }

    // Helper function to create a path with rounded corners
    function createRoundedPath(points: {x: number, y: number}[], radius: number = 12): string {
        if (points.length < 2) return '';
        if (points.length === 2) {
            return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
        }

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            // Calculate direction vectors
            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            // Calculate distances
            const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            // Limit radius to half the shortest segment
            const r = Math.min(radius, dist1 / 2, dist2 / 2);

            // Calculate the start and end points of the arc
            const startX = curr.x - (dx1 / dist1) * r;
            const startY = curr.y - (dy1 / dist1) * r;
            const endX = curr.x + (dx2 / dist2) * r;
            const endY = curr.y + (dy2 / dist2) * r;

            // Line to the start of the arc, then quadratic curve to the end
            d += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
        }

        // Final line to the last point
        d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

        return d;
    }

    function drawConnections(): void {
        if (!svg) return;
        svg.innerHTML = '';

        const cornerRadius = 10;

        // Draw regular connections with slightly rounded corners
        connections.forEach(([fromSlot, toSlot]) => {
            const fromPos = slotPositionMap[fromSlot];
            const toPos = slotPositionMap[toSlot];
            if (!fromPos || !toPos) return;

            const x1 = fromPos.x + NODE_WIDTH;
            const y1 = fromPos.y + NODE_HEIGHT / 2;
            const x2 = toPos.x;
            const y2 = toPos.y + NODE_HEIGHT / 2;

            const midX = (x1 + x2) / 2;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

            if (y1 === y2) {
                // Same row - straight line
                path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
            } else {
                // Different rows - rounded corner at midpoint
                const points = [
                    { x: x1, y: y1 },
                    { x: midX, y: y1 },
                    { x: midX, y: y2 },
                    { x: x2, y: y2 }
                ];
                path.setAttribute('d', createRoundedPath(points, cornerRadius));
            }
            path.classList.add('connection-line');
            svg.appendChild(path);
        });

        // Draw pass-through connections: line from source, PAST the 2-tile col, then fans to 4
        passThroughConnections.forEach(({ fromCol, fromSlot, throughCol, toCol }) => {
            const fromPos = slotPositionMap[`col${fromCol}_slot${fromSlot}`];
            if (!fromPos) return;

            // The convergence point is AFTER the throughCol
            const convergenceX = PADDING_LEFT + throughCol * (NODE_WIDTH + H_GAP) + NODE_WIDTH + H_GAP / 2;
            const convergenceY = PADDING_TOP + 1.5 * LINE_SPACING + NODE_HEIGHT / 2;

            const x1 = fromPos.x + NODE_WIDTH;
            const y1 = fromPos.y + NODE_HEIGHT / 2;

            // Draw line from source to convergence point (with rounded corner)
            const pathToConverge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pointsToConverge = [
                { x: x1, y: y1 },
                { x: convergenceX, y: y1 },
                { x: convergenceX, y: convergenceY }
            ];
            pathToConverge.setAttribute('d', createRoundedPath(pointsToConverge, cornerRadius));
            pathToConverge.classList.add('connection-line');
            svg.appendChild(pathToConverge);

            // Draw lines from convergence point to each of the 4 tiles in toCol
            for (let i = 0; i < 4; i++) {
                const toPos = slotPositionMap[`col${toCol}_slot${i}`];
                if (!toPos) continue;

                const x2 = toPos.x;
                const y2 = toPos.y + NODE_HEIGHT / 2;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const points = [
                    { x: convergenceX, y: convergenceY },
                    { x: convergenceX, y: y2 },
                    { x: x2, y: y2 }
                ];
                path.setAttribute('d', createRoundedPath(points, cornerRadius));
                path.classList.add('connection-line');
                svg.appendChild(path);
            }
        });
    }

    // Store the info button element position for animation origin
    let tooltipOriginX = 0;
    let tooltipOriginY = 0;
    let tooltipMaxHeight = 0;
    let showTooltip = false;

    function handleInfoClick(node: PlaceholderNode, event: MouseEvent): void {
        event.stopPropagation();
        if (!node.technology) return;

        // If clicking the same node, close it
        if (hoveredNode === node && showTooltip) {
            closeTooltip();
            return;
        }

        hoveredNode = node;
        calculateTooltipPosition(event, node);
        showTooltip = true;
    }

    function closeTooltip(): void {
        showTooltip = false;
        // Small delay before clearing node to allow close animation
        setTimeout(() => {
            if (!showTooltip) {
                hoveredNode = null;
            }
        }, 200);
    }

    function handleOutsideClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        // Don't close if clicking inside the tooltip or on an info button
        if (target.closest('.tech-tooltip') || target.closest('.info-btn')) {
            return;
        }
        if (showTooltip) {
            closeTooltip();
        }
    }

    // Navigate to and highlight a specific tech when clicking on a requirement
    function navigateToTech(techKey: string): void {
        // Close the current tooltip
        closeTooltip();

        // Find the node for this tech
        const targetNode = placeholderNodes.find(n => n.techKey === techKey);
        if (!targetNode) return;

        // Calculate the scroll position to center the tech in the viewport
        const nodeX = targetNode.position.x;
        const viewportWidth = viewport?.clientWidth || 800;
        const targetScroll = Math.max(0, nodeX - viewportWidth / 2 + NODE_WIDTH / 2);

        // Animate scroll to the tech
        const maxScroll = getMaxScroll();
        const clampedScroll = Math.min(targetScroll, maxScroll);

        currentTranslateX = -clampedScroll;
        if (canvas) {
            canvas.style.transform = `translateX(${currentTranslateX}px)`;
        }

        // Highlight the tech
        highlightedTechKey = techKey;

        // Remove highlight after animation
        setTimeout(() => {
            highlightedTechKey = null;
        }, 2000);
    }

    // Tooltip Y anchor points for each row (relative to viewport top)
    // These define where the tooltip's TOP edge should be positioned
    // Rows 0, 0.5, 1 open downward (tooltip top at anchor)
    // Rows 1.5, 2, 2.5, 3 open upward (tooltip bottom at anchor)
    const TOOLTIP_ROW_ANCHORS: Record<number, { y: number; openDown: boolean }> = {
        0:   { y: 0,   openDown: true },   // Row 0: tooltip starts near top
        0.5: { y: 30,  openDown: true },   // Row 0.5: slightly lower
        1:   { y: 70,  openDown: true },   // Row 1: lower still
        1.5: { y: 430, openDown: false },  // Row 1.5: opens upward
        2:   { y: 400, openDown: false },  // Row 2: opens upward
        2.5: { y: 440, openDown: false },  // Row 2.5: opens upward
        3:   { y: 480, openDown: false },  // Row 3: opens upward, near bottom
    };

    function calculateTooltipPosition(event: MouseEvent, node: PlaceholderNode): void {
        const mainContainer = containerEl?.getBoundingClientRect();
        const viewportRect = viewport?.getBoundingClientRect();
        if (!mainContainer || !viewportRect) return;

        const tooltipWidth = 420;
        const tooltipHeight = 400;

        // Get the info button and tech node positions
        const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const techNode = (event.currentTarget as HTMLElement).closest('.tech-node');
        const nodeRect = techNode?.getBoundingClientRect() ?? buttonRect;

        // Get row-specific anchor settings
        const row = node.row;
        const rowAnchor = TOOLTIP_ROW_ANCHORS[row] || { y: 150, openDown: true };

        // Calculate origin point (center of info button) relative to main container
        tooltipOriginX = buttonRect.left + buttonRect.width / 2 - mainContainer.left;
        tooltipOriginY = buttonRect.top + buttonRect.height / 2 - mainContainer.top;

        let x: number;
        let y: number;

        // Horizontal: position to the right of the tech node (relative to main container)
        x = (nodeRect.right - mainContainer.left) + 10;

        // Check if tooltip goes off right edge of screen
        const screenWidth = window.innerWidth;
        if (mainContainer.left + x + tooltipWidth > screenWidth - 20) {
            // Position to the left of the tech node instead
            x = (nodeRect.left - mainContainer.left) - tooltipWidth - 10;
        }

        // Clamp X within main container bounds
        x = Math.max(10, Math.min(x, mainContainer.width - tooltipWidth - 10));

        // Vertical positioning based on row anchor
        // The anchor Y is relative to the viewport, so we need to add the header height
        const headerHeight = viewportRect.top - mainContainer.top;

        if (rowAnchor.openDown) {
            // Tooltip top at anchor position
            y = headerHeight + rowAnchor.y;
        } else {
            // Tooltip bottom at anchor position (so top = anchor - tooltipHeight)
            y = headerHeight + rowAnchor.y - tooltipHeight;
        }

        // Clamp Y to stay within main container bounds with 10px padding
        const maxY = mainContainer.height - tooltipHeight - 10;
        y = Math.max(10, Math.min(y, maxY));

        tooltipX = x;
        tooltipY = y;
    }

    function formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
        return num.toString();
    }

    function getCategoryColor(category: string): string {
        return categoryColors[category] || categoryColors.utility;
    }

    // Format a requirement for display - returns object with keyword and tech IDs for linking
    function getRequirementParts(req: TechRequirement): { keyword: string; techIds: string[] } {
        if (req.tech) {
            return { keyword: '', techIds: [req.tech] };
        } else if (req.anyOf && req.anyOf.length > 0) {
            return { keyword: 'Any of:', techIds: req.anyOf };
        } else if (req.allOf && req.allOf.length > 0) {
            return { keyword: 'All of:', techIds: req.allOf };
        }
        return { keyword: '', techIds: [] };
    }

    // Get tech name from ID
    function getTechName(techId: string): string {
        return allTechs[techId]?.name || techId;
    }

    onMount(() => {
        setTimeout(drawConnections, 100);

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleGlobalClick);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('click', handleGlobalClick);
        };
    });
</script>

<!-- Settings Island -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="settings-island" on:click={handleSettingsOutsideClick}>
    <div class="settings-info">
        <p class="settings-info-text">
            Currently <strong>ALL</strong> KvK modes feature the "New" Crystal Tech changes (v5) including kingdoms entering KvK 4. When new, major crystal tech adjustments occur in-game, they are not always immediately accessible in every KvK mode, therefore please choose the version that matches your situation.
        </p>
    </div>
    <div class="settings-controls">
        <div class="settings-dropdown">
            <label class="settings-label">
                <img src={versionIcon.src} alt="Version" class="settings-icon" />
                <span>Crystal Tech Version</span>
            </label>
            <div class="custom-select-container">
                <button
                    class="select-trigger"
                    class:active={isVersionDropdownOpen}
                    on:click={toggleVersionDropdown}
                >
                    <span>{availableVersions.find(v => v.id === selectedVersion)?.name || selectedVersion}</span>
                    <span class="select-arrow"></span>
                </button>
                {#if isVersionDropdownOpen}
                    <div class="select-dropdown">
                        {#each availableVersions as version}
                            <button
                                class="select-option"
                                class:selected={selectedVersion === version.id}
                                on:click={() => selectVersion(version.id)}
                            >
                                {version.name}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>

        <div class="settings-dropdown">
            <label class="settings-label">
                <img src={researchCenterIcon.src} alt="Research Center" class="settings-icon" />
                <span>Research Center Level</span>
            </label>
            <div class="custom-select-container">
                <button
                    class="select-trigger"
                    class:active={isRCDropdownOpen}
                    on:click={toggleRCDropdown}
                >
                    <span>Level {researchCenterLevel}</span>
                    <span class="select-arrow"></span>
                </button>
                {#if isRCDropdownOpen}
                    <div class="select-dropdown rc-dropdown">
                        {#each Array.from({ length: 25 }, (_, i) => i + 1) as level}
                            <button
                                class="select-option"
                                class:selected={researchCenterLevel === level}
                                on:click={() => selectRCLevel(level)}
                            >
                                Level {level}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="crystal-tech-container" bind:this={containerEl} on:click={handleOutsideClick}>
    <!-- Header Bar -->
    <div class="crystal-tech-header">
        <div class="greek-key-border left"></div>
        <h2 class="crystal-tech-title">CRYSTAL TECHNOLOGIES</h2>
        <div class="greek-key-border right"></div>
    </div>

    <!-- Tech Tree Viewport -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
    <div
        class="tech-tree-viewport"
        bind:this={viewport}
        on:mousedown={handleMouseDown}
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
        on:wheel={handleWheel}
        role="application"
        tabindex="0"
        aria-label="Crystal Technology Tree - drag to scroll"
        style="height: {canvasHeight}px;"
    >
        <div class="tech-tree-canvas" bind:this={canvas} style="width: {canvasWidth}px; height: {canvasHeight}px;">
            <!-- SVG for connection lines -->
            <svg class="tech-connections" bind:this={svg}></svg>

            <!-- Tech nodes / Placeholder tiles -->
            <div class="tech-nodes">
                {#each placeholderNodes as node (node.slot)}
                    {@const currentLevel = node.techKey ? (userTechLevels[node.techKey] || 0) : 0}
                    {@const maxLevel = node.technology?.maxLevel || 10}
                    {@const progress = (currentLevel / maxLevel) * 100}
                    {@const isMaxed = currentLevel >= maxLevel}
                    {@const techIcon = getTechIcon(node.techKey)}
                    <div
                        class="tech-node"
                        class:placeholder-tile={!node.techKey}
                        class:unlocked={node.technology && currentLevel > 0}
                        class:locked={!node.technology || currentLevel === 0}
                        class:maxed={isMaxed}
                        class:highlighted={highlightedTechKey === node.techKey}
                        style="left: {node.position.x}px; top: {node.position.y}px;"
                        data-slot={node.slot}
                        data-col={node.col}
                        data-row={node.row}
                    >
                        <div class="tech-icon-frame">
                            {#if techIcon}
                                <img src={techIcon.src} alt={node.technology?.name || ''} class="tech-icon-img" width="64" height="64" loading="lazy" />
                            {:else}
                                <div class="tech-icon placeholder">
                                    <span class="icon-placeholder">{node.technology ? node.technology.name.charAt(0) : node.col}</span>
                                </div>
                            {/if}
                        </div>
                        <div class="tech-info">
                            <span class="tech-name {getTextSizeClass(node.technology?.name)}">{node.technology?.name || node.slot}</span>
                            <div class="tech-level" style="--progress: {progress}%">
                                <span>{currentLevel}/{maxLevel}</span>
                            </div>
                        </div>
                        {#if node.technology}
                            <button
                                class="info-btn"
                                class:active={hoveredNode === node && showTooltip}
                                on:click={(e) => handleInfoClick(node, e)}
                                aria-label="Show tech details"
                            >
                                <i class="fas fa-info"></i>
                            </button>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <!-- Click Tooltip -->
    {#if hoveredNode && hoveredNode.technology && showTooltip}
        {@const tech = hoveredNode.technology}
        {@const techIcon = getTechIcon(hoveredNode.techKey)}
        {@const currentLevel = hoveredNode.techKey ? (userTechLevels[hoveredNode.techKey] || 0) : 0}
        <div
            class="tech-tooltip"
            class:show={showTooltip}
            style="left: {tooltipX}px; top: {tooltipY}px; --origin-x: {tooltipOriginX - tooltipX}px; --origin-y: {tooltipOriginY - tooltipY}px;"
        >
            <div class="tooltip-header">
                <div class="tooltip-icon">
                    {#if techIcon}
                        <img src={techIcon.src} alt={tech.name} width="48" height="48" />
                    {:else}
                        <span class="icon-placeholder">{tech.name.charAt(0)}</span>
                    {/if}
                </div>
                <div class="tooltip-title">
                    <h3>{tech.name}</h3>
                    <p class="tooltip-description">{tech.description}</p>
                </div>
            </div>
            <div class="tooltip-summary">
                <div class="summary-item">
                    <span class="summary-label">Current Level</span>
                    <span class="summary-value">{currentLevel} / {tech.maxLevel}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Max Buff</span>
                    <span class="summary-value buff">{tech.totals.buff}</span>
                </div>
            </div>
            <div class="tooltip-table-container">
                <table class="tooltip-table">
                    <thead>
                        <tr>
                            <th>Lvl</th>
                            <th>Buff</th>
                            <th>Time</th>
                            <th><img src={crystalIcon.src} alt="Crystals" width="16" height="16" /></th>
                            <th><img src={seasonCoinIcon.src} alt="Season Coins" width="16" height="16" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tech.levels as level}
                            {@const rcReq = hoveredNode?.techKey ? getRCRequirement(hoveredNode.techKey, level.level) : null}
                            {@const meetsRC = hoveredNode?.techKey ? meetsRCRequirement(hoveredNode.techKey, level.level) : true}
                            <tr class:completed={level.level <= currentLevel} class:next={level.level === currentLevel + 1} class:rc-locked={!meetsRC}>
                                <td class="level-col">
                                    {level.level}
                                    {#if rcReq}
                                        <span class="rc-req" class:rc-met={meetsRC} class:rc-not-met={!meetsRC} title="Requires Research Center Level {rcReq}">
                                            RC{rcReq}
                                        </span>
                                    {/if}
                                </td>
                                <td class="buff-col">{level.buff}</td>
                                <td class="time-col">{level.time}</td>
                                <td class="crystal-col">{formatNumber(level.crystals)}</td>
                                <td class="coin-col">{formatNumber(level.seasonCoins)}</td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot>
                        <tr class="totals-row">
                            <td>Total</td>
                            <td class="buff-col">{tech.totals.buff}</td>
                            <td class="time-col">{tech.totals.time}</td>
                            <td class="crystal-col">{formatNumber(tech.totals.crystals)}</td>
                            <td class="coin-col">{formatNumber(tech.totals.seasonCoins)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {#if tech.requirements.length > 0}
                <div class="tooltip-requirements">
                    <span class="req-label">Requirements:</span>
                    {#each tech.requirements as req}
                        {@const parts = getRequirementParts(req)}
                        <span class="req-item"><span class="req-unlock-level">Lvl {req.level}:</span> {#if parts.keyword}<span class="req-keyword">{parts.keyword}</span>&nbsp;{/if}{#each parts.techIds as techId, i}<span class="req-tech-link" on:click={() => navigateToTech(techId)} on:keydown={(e) => e.key === 'Enter' && navigateToTech(techId)} role="button" tabindex="0">{getTechName(techId)}</span>{#if i < parts.techIds.length - 1},&nbsp;{/if}{/each} <span class="req-arrow">→</span> <span class="req-tech-level">Lvl {req.techLevel || 0}</span></span>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Footer Bar with Counters and Scroll Hint -->
    <div class="crystal-tech-footer">
        <div class="footer-counter speedups">
            <img src={researchSpeedupIcon.src} alt="Speedup" class="counter-icon" width="28" height="28" />
            <span class="counter-label">Total Speedups Spent:</span>
            <span class="counter-value">{totalSpeedupsUsed.toFixed(1)}d</span>
        </div>
        <div class="scroll-hint">
            <i class="fas fa-arrows-alt-h"></i>
            <span>Drag to scroll</span>
        </div>
        <div class="footer-counter crystals">
            <img src={crystalIcon.src} alt="Crystal" class="counter-icon" width="28" height="28" />
            <span class="counter-label">Total Crystals Used:</span>
            <span class="counter-value">{totalCrystalsUsed.toLocaleString()}</span>
        </div>
    </div>
</div>

<style>
    /* ================================================
       SETTINGS ISLAND STYLES
       ================================================ */

    .settings-island {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 16px 20px;
        margin-bottom: 15px;
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border-color, rgba(100, 180, 220, 0.2));
        border-radius: var(--radius-lg, 12px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .settings-info {
        flex: 1;
        min-width: 0;
    }

    .settings-info-text {
        margin: 0;
        font-size: 0.8rem;
        line-height: 1.5;
        color: var(--text-secondary, rgba(255, 255, 255, 0.6));
    }

    .settings-info-text strong {
        color: var(--text-primary, #fff);
    }

    .settings-controls {
        display: flex;
        gap: 16px;
        flex-shrink: 0;
    }

    .settings-dropdown {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 200px;
    }

    .settings-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-secondary, rgba(255, 255, 255, 0.6));
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .settings-icon {
        width: 18px;
        height: 18px;
        object-fit: contain;
    }

    .settings-dropdown .custom-select-container {
        position: relative;
        width: 100%;
    }

    .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 10px 14px;
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border-color, rgba(100, 180, 220, 0.2));
        border-radius: var(--radius-md, 8px);
        color: var(--text-primary, #fff);
        font-size: 0.85rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .select-trigger:hover {
        border-color: var(--accent-blue, #3b82f6);
    }

    .select-trigger.active {
        border-color: var(--accent-blue, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .select-arrow {
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid rgba(255, 255, 255, 0.6);
        transition: transform 0.2s ease;
    }

    .select-trigger.active .select-arrow {
        transform: rotate(180deg);
    }

    .select-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--bg-tertiary, #1e293b);
        border: 1px solid var(--border-color, rgba(100, 180, 220, 0.2));
        border-radius: var(--radius-md, 8px);
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }

    .select-dropdown.rc-dropdown {
        max-height: 250px;
    }

    .select-option {
        display: block;
        width: 100%;
        padding: 10px 14px;
        background: transparent;
        border: none;
        color: var(--text-secondary, rgba(255, 255, 255, 0.7));
        font-size: 0.85rem;
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .select-option:hover {
        background: var(--accent-blue-light, rgba(59, 130, 246, 0.1));
        color: var(--text-primary, #fff);
    }

    .select-option.selected {
        background: var(--accent-blue-light, rgba(59, 130, 246, 0.15));
        color: var(--accent-blue, #3b82f6);
    }

    .select-dropdown::-webkit-scrollbar {
        width: 6px;
    }

    .select-dropdown::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }

    .select-dropdown::-webkit-scrollbar-thumb {
        background: rgba(100, 180, 220, 0.4);
        border-radius: 3px;
    }

    /* ================================================
       CRYSTAL TECH SIMULATOR STYLES
       ================================================ */

    /* Font face for NotoSansHans */
    @font-face {
        font-family: 'NotoSansHans';
        src: url('/fonts/NotoSansHans-Black.otf') format('opentype');
        font-weight: 900;
        font-style: normal;
    }

    @font-face {
        font-family: 'NotoSansHans';
        src: url('/fonts/NotoSansHans-Bold.otf') format('opentype');
        font-weight: 700;
        font-style: normal;
    }

    @font-face {
        font-family: 'NotoSansHans';
        src: url('/fonts/NotoSansHans-DemiLight.otf') format('opentype');
        font-weight: 300;
        font-style: normal;
    }

    .crystal-tech-container {
        width: 100%;
        border-radius: 8px;
        overflow: visible;
        position: relative;
        border: 4px solid;
        border-color: #a8a498 #b0a89c #9c9488 #a4a094;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.35);
    }

    /* Header Bar */
    .crystal-tech-header {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        background: linear-gradient(to bottom, #c4c0b5, #b8b4a9);
        border-bottom: 1px solid #9a968b;
        position: relative;
        z-index: 2;
    }

    .crystal-tech-title {
        font-size: 1rem;
        font-weight: 900;
        color: #4a4a4a;
        letter-spacing: 0.1em;
        margin: 0;
        font-family: 'NotoSansHans', sans-serif;
        text-transform: uppercase;
    }

    /* Greek Key Border Pattern */
    .greek-key-border {
        flex: 1;
        height: 24px;
        max-width: 120px;
        opacity: 0.5;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath fill='none' stroke='%238A867C' stroke-width='2' d='M0 10h10v-10h10v10h10v10h-10v-10h-10v10h-10z'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        background-position: center;
    }

    .greek-key-border.left {
        margin-right: 20px;
        mask-image: linear-gradient(to right, transparent, black);
        -webkit-mask-image: linear-gradient(to right, transparent, black);
    }

    .greek-key-border.right {
        margin-left: 20px;
        mask-image: linear-gradient(to left, transparent, black);
        -webkit-mask-image: linear-gradient(to left, transparent, black);
    }

    /* Footer Bar with Counters */
    .crystal-tech-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;
        background: linear-gradient(to bottom, #b8b4a9, #c4c0b5);
        padding: 0 20px;
        position: relative;
        z-index: 2;
    }

    .footer-counter {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .counter-icon {
        width: 26px;
        height: 26px;
        object-fit: contain;
    }

    .counter-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #4a4a4a;
        font-family: 'NotoSansHans', sans-serif;
    }

    .counter-value {
        font-size: 0.9rem;
        font-weight: 900;
        color: #2a5a7a;
        font-family: 'NotoSansHans', sans-serif;
    }

    .crystal-tech-footer .scroll-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #4a4a4a;
        font-size: 0.7rem;
        font-family: 'NotoSansHans', sans-serif;
        background: none;
        border: none;
        padding: 0;
    }

    /* Main Panel - Tech Tree Viewport */
    .tech-tree-viewport {
        width: 100%;
        /* Height set via inline style based on calculated canvasHeight */
        overflow: hidden;
        position: relative;
        cursor: grab;
        background: radial-gradient(ellipse at center, #0872a0 0%, #044560 100%);
    }


    .tech-tree-viewport:active {
        cursor: grabbing;
    }

    .tech-tree-canvas {
        position: absolute;
        top: 0;
        left: 0;
        /* Height set via inline style */
        padding: 0;
        box-sizing: border-box;
        transition: transform 0.1s ease-out;
    }

    /* SVG Connection Lines */
    .tech-connections {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    :global(.tech-connections .connection-line) {
        fill: none;
        stroke: #84dfff;
        stroke-width: 5;
        stroke-linecap: round;
    }

    :global(.tech-connections .connection-line.unlocked) {
        stroke: #84dfff;
        stroke-width: 5;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));
    }

    /* Tech Nodes Container */
    .tech-nodes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
    }

    /* ================================================
       TECHNOLOGY NODE TILES
       ================================================ */

    .tech-node {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 230px;
        height: 80px;
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        background: radial-gradient(circle at 38% 50%, #d2f7fd 0%, #6bc9f0 70%);
        border: 2px solid #9FC2DA;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 3px 6px rgba(0, 0, 0, 0.25);
        font-family: 'NotoSansHans', sans-serif;
        text-align: left;
        overflow: hidden;
    }

    .tech-node:hover {
        transform: translateY(-2px);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.25);
        z-index: 10;
    }

    .tech-node.selected {
        border-color: #FFD700;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 0 0 3px rgba(255, 215, 0, 0.5),
            0 3px 6px rgba(0, 0, 0, 0.2);
        z-index: 11;
    }

    .tech-node.highlighted {
        animation: highlight-glow 2s ease-out;
        z-index: 100;
    }

    @keyframes highlight-glow {
        0% {
            border-color: transparent;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 0 0 transparent,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
        20% {
            border-color: #4ade80;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 25px 5px #4ade80,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
        100% {
            border-color: transparent;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.4),
                0 0 25px 5px transparent,
                0 3px 6px rgba(0, 0, 0, 0.25);
        }
    }

    .tech-node.placeholder-tile {
        background: radial-gradient(circle at 30% 50%, #5a7a8a 0%, #3a5a6a 70%);
        border-color: #5A7B8C;
        opacity: 0.6;
    }

    .tech-node.placeholder-tile .tech-name {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.5rem;
    }

    .tech-node.placeholder-tile .icon-placeholder {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .tech-node.placeholder-tile .tech-icon-frame {
        background: linear-gradient(to bottom, #5A7B8C, #4A6B7C);
        border-color: #6A8B9C;
    }

    .tech-node.maxed {
        border-color: #7AB8D6;
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            0 0 6px rgba(100, 180, 220, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.15);
    }

    .category-indicator {
        display: none;
    }

    /* ================================================
       ICON CONTAINER
       ================================================ */

    .tech-icon-frame {
        width: 72px;
        height: 72px;
        border-radius: 8px;
        flex-shrink: 0;
        overflow: hidden;
    }

    .tech-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tech-icon.placeholder {
        background: rgba(0, 0, 0, 0.1);
    }

    .tech-icon-img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .icon-placeholder {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(44, 79, 102, 0.5);
    }

    .tech-node.unlocked .icon-placeholder,
    .tech-node.maxed .icon-placeholder {
        color: #8B6914;
    }

    /* ================================================
       TECHNOLOGY INFO
       ================================================ */

    .tech-info {
        display: flex;
        flex-direction: column;
        padding: 2px 6px 2px 10px;
        flex: 1;
        min-width: 0;
    }

    .tech-name {
        font-size: 0.95rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #255273;
        line-height: 1.2;
        margin-bottom: 6px;
        white-space: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
    }

    .tech-name.text-sm {
        font-size: 0.8rem;
    }

    .tech-name.text-xs {
        font-size: 0.7rem;
    }

    /* ================================================
       PROGRESS BAR
       ================================================ */

    .tech-level {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 20px;
        width: 100%;
        max-width: 100px;
        border-radius: 10px;
        overflow: hidden;
        background: #AFC3D2;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .tech-level::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: var(--progress, 0%);
        border-radius: 9px;
        background: linear-gradient(to top, #014e80, #007cb0);
        box-shadow: 0 0 4px rgba(0, 124, 176, 0.4);
        transition: width 0.3s ease;
    }

    .tech-level span {
        position: relative;
        z-index: 1;
        font-size: 0.85rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #FFFFFF;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
    }

    .tech-node.locked .tech-level::before {
        background: linear-gradient(to top, #5a6a76, #7a8a96);
        box-shadow: none;
    }

    /* ================================================
       INFO BUTTON
       ================================================ */

    .info-btn {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 24px !important;
        height: 24px !important;
        min-width: 24px !important;
        min-height: 24px !important;
        max-width: 24px !important;
        max-height: 24px !important;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(100, 180, 220, 0.9) 0%, rgba(60, 140, 180, 0.9) 100%);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
        padding: 0;
        font-size: 12px !important;
        line-height: 1;
    }

    .info-btn:hover {
        transform: scale(1.15);
        background: linear-gradient(135deg, rgba(120, 200, 240, 1) 0%, rgba(80, 160, 200, 1) 100%);
        box-shadow: 0 2px 4px rgba(100, 180, 220, 0.4);
    }

    .info-btn.active {
        background: linear-gradient(135deg, rgba(255, 200, 100, 1) 0%, rgba(220, 160, 60, 1) 100%);
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.1);
    }

    .info-btn :global(i) {
        font-size: 12px !important;
        line-height: 1;
    }

    /* ================================================
       CLICK TOOLTIP
       ================================================ */

    .tech-tooltip {
        position: absolute;
        width: 420px;
        /* No max-height needed - table scrolls internally */
        background: linear-gradient(135deg, rgba(15, 25, 35, 0.98) 0%, rgba(25, 40, 55, 0.98) 100%);
        border: 1px solid rgba(100, 180, 220, 0.3);
        border-radius: 12px;
        padding: 16px;
        z-index: 99999;
        backdrop-filter: blur(12px);
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(100, 180, 220, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        pointer-events: auto;
        overflow: visible;

        /* Animation */
        transform-origin: var(--origin-x, 0) var(--origin-y, 0);
        animation: tooltipAppear 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes tooltipAppear {
        0% {
            opacity: 0;
            transform: scale(0.3);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }

    .tooltip-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(100, 180, 220, 0.2);
    }

    .tooltip-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
        background: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tooltip-icon img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .tooltip-icon .icon-placeholder {
        font-size: 1.5rem;
        font-weight: 700;
        color: rgba(100, 180, 220, 0.6);
    }

    .tooltip-title {
        flex: 1;
        min-width: 0;
    }

    .tooltip-title h3 {
        margin: 0 0 4px 0;
        font-size: 1.1rem;
        font-weight: 900;
        font-family: 'NotoSansHans', sans-serif;
        color: #fff;
        line-height: 1.2;
    }

    .tooltip-description {
        margin: 0;
        font-size: 0.75rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.4;
    }

    .tooltip-summary {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
        padding: 10px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
    }

    .summary-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .summary-label {
        font-size: 0.65rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .summary-value {
        font-size: 0.95rem;
        font-weight: 700;
        font-family: 'NotoSansHans', sans-serif;
        color: #fff;
    }

    .summary-value.buff {
        color: #7dd87d;
    }

    .tooltip-table-container {
        max-height: 230px;
        overflow-y: auto;
        margin-bottom: 10px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.15);
    }

    .tooltip-table-container::-webkit-scrollbar {
        width: 6px;
    }

    .tooltip-table-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
    }

    .tooltip-table-container::-webkit-scrollbar-thumb {
        background: rgba(100, 180, 220, 0.4);
        border-radius: 3px;
    }

    .tooltip-table {
        width: 100%;
        border-collapse: collapse;
        font-family: 'NotoSansHans', sans-serif;
        font-size: 0.75rem;
    }

    .tooltip-table thead {
        position: sticky;
        top: 0;
        background: rgba(20, 35, 50, 0.98);
        z-index: 1;
    }

    .tooltip-table tfoot {
        position: sticky;
        bottom: 0;
        background: rgba(20, 35, 50, 0.98);
        z-index: 1;
    }

    .tooltip-table th {
        padding: 8px 6px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        border-bottom: 1px solid rgba(100, 180, 220, 0.2);
    }

    .tooltip-table th img {
        display: inline-block;
        vertical-align: middle;
    }

    .tooltip-table td {
        padding: 6px;
        text-align: center;
        color: rgba(255, 255, 255, 0.85);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tooltip-table tbody tr:hover {
        background: rgba(100, 180, 220, 0.1);
    }

    .tooltip-table tbody tr.completed {
        background: rgba(100, 180, 100, 0.1);
    }

    .tooltip-table tbody tr.completed td {
        color: rgba(125, 216, 125, 0.9);
    }

    .tooltip-table tbody tr.next {
        background: rgba(100, 180, 220, 0.15);
    }

    .tooltip-table tbody tr.next td {
        color: #64b4dc;
        font-weight: 600;
    }

    .tooltip-table .level-col {
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
        width: 70px;
        white-space: nowrap;
    }

    .tooltip-table tbody tr.rc-locked {
        opacity: 0.5;
    }

    .rc-req {
        display: inline-block;
        font-size: 0.55rem;
        font-weight: 600;
        padding: 1px 4px;
        border-radius: 3px;
        margin-left: 4px;
        vertical-align: middle;
    }

    .rc-req.rc-met {
        background: rgba(100, 200, 100, 0.2);
        color: #7dd87d;
        border: 1px solid rgba(100, 200, 100, 0.3);
    }

    .rc-req.rc-not-met {
        background: rgba(239, 68, 68, 0.2);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .tooltip-table .buff-col {
        color: #7dd87d;
        font-weight: 600;
    }

    .tooltip-table .time-col {
        color: rgba(255, 255, 255, 0.7);
    }

    .tooltip-table .crystal-col {
        color: #64d4f4;
    }

    .tooltip-table .coin-col {
        color: #f4c764;
    }

    .tooltip-table tfoot tr {
        background: rgba(20, 35, 50, 0.95);
    }

    .tooltip-table tfoot td {
        padding: 8px 6px;
        font-weight: 700;
        border-top: 1px solid rgba(100, 180, 220, 0.3);
        border-bottom: none;
    }

    .tooltip-requirements {
        padding: 8px 10px;
        background: rgba(255, 200, 100, 0.1);
        border-radius: 6px;
        border: 1px solid rgba(255, 200, 100, 0.2);
    }

    .req-label {
        display: block;
        font-size: 0.65rem;
        font-weight: 700;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 200, 100, 0.8);
        text-transform: uppercase;
        margin-bottom: 4px;
    }

    .req-item {
        display: block;
        font-size: 0.7rem;
        font-family: 'NotoSansHans', sans-serif;
        color: rgba(255, 255, 255, 0.7);
        padding: 2px 0;
    }

    .req-unlock-level {
        color: #7dd87d;
        font-weight: 600;
    }

    .req-arrow {
        color: rgba(255, 200, 100, 0.8);
        font-weight: 700;
    }

    .req-tech-level {
        color: #fcd34d;
        font-weight: 700;
    }

    .req-keyword {
        color: #fcd34d;
        font-weight: 600;
    }

    .req-tech-link {
        color: #7dd3fc;
        cursor: pointer;
        transition: color 0.15s ease;
    }

    .req-tech-link:hover {
        color: #bae6fd;
        text-decoration: underline;
    }

    /* ================================================
       SCROLL HINT
       ================================================ */

    .scroll-hint :global(i) {
        animation: scroll-hint-pulse 2s ease-in-out infinite;
    }

    @keyframes scroll-hint-pulse {
        0%, 100% { transform: translateX(0); opacity: 0.6; }
        50% { transform: translateX(5px); opacity: 1; }
    }

    /* ================================================
       MOBILE RESPONSIVE
       ================================================ */

    @media (max-width: 768px) {
        .crystal-tech-container {
            border-width: 4px;
        }

        .crystal-tech-header {
            height: 46px;
        }

        .crystal-tech-title {
            font-size: 0.95rem;
            letter-spacing: 0.08em;
        }

        .greek-key-border {
            display: none;
        }

        .tech-node {
            width: 190px;
            height: 70px;
            padding: 6px;
        }

        .tech-icon-frame {
            width: 56px;
            height: 56px;
        }

        .tech-icon {
            width: 46px;
            height: 46px;
        }

        .icon-placeholder {
            font-size: 1.2rem;
        }

        .tech-name {
            font-size: 0.75rem;
        }

        .tech-level {
            height: 16px;
            max-width: 85px;
        }

        .tech-level span {
            font-size: 0.7rem;
        }

        .tech-info-panel {
            bottom: 45px;
            padding: 12px;
        }

        .info-stats {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
        }

        .crystal-tech-footer {
            height: 36px;
            padding: 0 12px;
        }

        .counter-icon {
            width: 22px;
            height: 22px;
        }

        .counter-label {
            font-size: 0.7rem;
        }

        .counter-value {
            font-size: 0.8rem;
        }

        .crystal-tech-footer .scroll-hint {
            font-size: 0.65rem;
        }
    }

    @media (max-width: 480px) {
        .tech-node {
            width: 170px;
            height: 60px;
            padding: 5px;
        }

        .tech-icon-frame {
            width: 48px;
            height: 48px;
        }

        .tech-icon {
            width: 40px;
            height: 40px;
        }

        .tech-name {
            font-size: 0.65rem;
        }

        .tech-level {
            height: 14px;
            max-width: 75px;
        }

        .tech-level span {
            font-size: 0.6rem;
        }

        .crystal-tech-footer {
            height: 32px;
            padding: 0 6px;
        }

        .footer-counter {
            gap: 3px;
        }

        .counter-icon {
            width: 18px;
            height: 18px;
        }

        .counter-label {
            display: none;
        }

        .counter-value {
            font-size: 0.7rem;
        }

        .crystal-tech-footer .scroll-hint {
            font-size: 0.6rem;
        }
    }
</style>
