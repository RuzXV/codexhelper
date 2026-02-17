// Tech Requirements module
// Contains all TypeScript interfaces/types, prerequisite data,
// RC requirements, and requirement-checking functions.

import {
    connections,
    passThroughConnections,
    techAssignments,
} from './techLayout';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TechLevel {
    level: number;
    buff: string;
    time: string;
    crystals: number;
    seasonCoins: number;
}

export interface TechTotals {
    buff: string;
    time: string;
    crystals: number;
    seasonCoins: number;
}

export interface TechRequirement {
    level: number;
    tech?: string;
    techLevel?: number;
    anyOf?: string[];
    allOf?: string[];
}

export interface Technology {
    name: string;
    description: string;
    buffType: string;
    category: string;
    maxLevel: number;
    levels: TechLevel[];
    totals: TechTotals;
    requirements: TechRequirement[];
}

export interface TechNode {
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

export interface PlaceholderNode {
    slot: string;
    col: number;
    row: number;
    position: { x: number; y: number };
    techKey: string | null;
    technology: Technology | null;
}

export interface SimulatorMessage {
    type: 'error' | 'warning';
    text: string;
    techLink?: { techKey: string; techName: string; requiredLevel: number };
    multiTechLinks?: { techKey: string; techName: string }[];
    requiredLevel?: number;
    prefix?: string;
    rcRequirement?: number;
}

export type CombinedRequirement =
    | { type: 'tech'; level: number; req: TechRequirement }
    | { type: 'rc'; level: number; rcLevel: number };

// ============================================================
// LINE-BASED PREREQUISITES
// Built from connection definitions. A tech requires at least
// level 1 in ANY tech that has a line connecting TO it.
// ============================================================

export function buildLinePrerequisites(): Record<string, string[]> {
    const prereqs: Record<string, string[]> = {};

    // Regular connections
    connections.forEach(([fromSlot, toSlot]) => {
        const fromTech = techAssignments[fromSlot];
        const toTech = techAssignments[toSlot];
        if (fromTech && toTech) {
            if (!prereqs[toTech]) prereqs[toTech] = [];
            if (!prereqs[toTech].includes(fromTech)) {
                prereqs[toTech].push(fromTech);
            }
        }
    });

    // Pass-through connections
    passThroughConnections.forEach(({ fromCol, fromSlot, toCol }) => {
        const fromSlotKey = `col${fromCol}_slot${fromSlot}`;
        const fromTech = techAssignments[fromSlotKey];

        for (let slot = 0; slot < 4; slot++) {
            const toSlotKey = `col${toCol}_slot${slot}`;
            const toTech = techAssignments[toSlotKey];
            if (fromTech && toTech) {
                if (!prereqs[toTech]) prereqs[toTech] = [];
                if (!prereqs[toTech].includes(fromTech)) {
                    prereqs[toTech].push(fromTech);
                }
            }
        }
    });

    return prereqs;
}

/** Pre-built line prerequisites (computed once at module load) */
export const linePrerequisites: Record<string, string[]> = buildLinePrerequisites();

// ============================================================
// PREREQUISITE TECH RULES
// allOf: need at least 1 point in ALL listed techs
// anyOf: need at least 1 point in ANY ONE of the listed techs
// ============================================================

export type PrereqRule = { allOf: string[] } | { anyOf: string[] };

export const prerequisiteTechs: Record<string, PrereqRule> = {
    // March speed techs require their respective attack techs
    swiftMarchingI: { allOf: ['quenchedBladesI'] },
    fleetOfFootI: { allOf: ['improvedBowsI'] },
    swiftSteedsI: { allOf: ['mountedCombatTechniquesI'] },
    reinforcedAxlesI: { allOf: ['improvedProjectilesI'] },
    // Cutting Corners I requires Call to Arms I
    cuttingCornersI: { allOf: ['callToArmsI'] },
    // Leadership I requires Call to Arms I
    leadershipI: { allOf: ['callToArmsI'] },
    // Cultural Exchange requires Cutting Corners I
    culturalExchange: { allOf: ['cuttingCornersI'] },
    // Barbarian Bounties, Karaku Reports require Cultural Exchange
    barbarianBounties: { allOf: ['culturalExchange'] },
    karakuReports: { allOf: ['culturalExchange'] },
    // Starmetal techs require their respective march speed techs
    starmetalShields: { allOf: ['swiftMarchingI'] },
    starmetalBracers: { allOf: ['fleetOfFootI'] },
    starmetalBarding: { allOf: ['swiftSteedsI'] },
    starmetalAxles: { allOf: ['reinforcedAxlesI'] },
    // March speed II techs require Starmetal techs
    swiftMarchingII: { allOf: ['starmetalShields'] },
    fleetOfFootII: { allOf: ['starmetalBracers'] },
    swiftSteedsII: { allOf: ['starmetalBarding'] },
    reinforcedAxlesII: { allOf: ['starmetalAxles'] },
    // Cutting Corners II requires Call to Arms II
    cuttingCornersII: { allOf: ['callToArmsII'] },
    // Leadership II requires Leadership I
    leadershipII: { allOf: ['leadershipI'] },
    // March speed III techs require their respective II techs
    swiftMarchingIII: { allOf: ['swiftMarchingII'] },
    fleetOfFootIII: { allOf: ['fleetOfFootII'] },
    swiftSteedsIII: { allOf: ['swiftSteedsII'] },
    reinforcedAxlesIII: { allOf: ['reinforcedAxlesII'] },
    // Special Concoctions I requires Larger Camps
    specialConcoctionsI: { allOf: ['largerCamps'] },
    // Special Concoctions II requires Special Concoctions I
    specialConcoctionsII: { allOf: ['specialConcoctionsI'] },
    // Runecraft requires Larger Camps
    runecraft: { allOf: ['largerCamps'] },
    // Rapid Retreat requires Emergency Support
    rapidRetreat: { allOf: ['emergencySupport'] },
    // Expanded Formations I requires Larger Camps
    expandedFormationsI: { allOf: ['largerCamps'] },
    // Expanded Formations II requires Special Concoctions II
    expandedFormationsII: { allOf: ['specialConcoctionsII'] },
    // Celestial Guidance requires Special Concoctions II
    celestialGuidance: { allOf: ['specialConcoctionsII'] },
};

// ============================================================
// RC (Research Center) REQUIREMENTS
// ============================================================

/** RC level requirements for specific techs at specific tech levels */
export const rcRequirements: Record<string, Record<number, number>> = {
    callToArmsI: { 9: 17 },
    callToArmsII: { 6: 18, 8: 21, 9: 24, 10: 25 },
};

/** RC crystal costs per level (cost to upgrade TO that level) */
export const rcCrystalCosts: Record<number, number> = {
    2: 1000,
    3: 2500,
    4: 4000,
    5: 5500,
    6: 7000,
    7: 10000,
    8: 15000,
    9: 20000,
    10: 25000,
    11: 30000,
    12: 37500,
    13: 45000,
    14: 52500,
    15: 60000,
    16: 70000,
    17: 80000,
    18: 90000,
    19: 100000,
    20: 115000,
    21: 130000,
    22: 150000,
    23: 200000,
    24: 250000,
    25: 300000,
};

/**
 * Calculate total RC crystal cost up to a given level (cumulative).
 */
export function getTotalRCCrystalCost(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += rcCrystalCosts[i] || 0;
    }
    return total;
}

/**
 * Research Center crystal cost reduction percentage by RC level.
 * Level 1-10: 0.1% per level (1% at 10)
 * Level 11-20: 0.2% per level (3% at 20)
 * Level 21-25: 3.3%, 3.6%, 4%, 4.5%, 5%
 */
export function getRCCostReduction(rcLevel: number): number {
    if (rcLevel <= 0) return 0;
    if (rcLevel <= 10) return rcLevel * 0.1;
    if (rcLevel <= 20) return 1 + (rcLevel - 10) * 0.2;
    const level21Plus = [3.3, 3.6, 4, 4.5, 5];
    return level21Plus[Math.min(rcLevel - 21, 4)];
}

/**
 * Get the RC requirement for a specific tech at a specific level.
 * Returns null if there is no RC requirement.
 */
export function getRCRequirement(techKey: string, level: number): number | null {
    const techReqs = rcRequirements[techKey];
    if (!techReqs) return null;
    return techReqs[level] || null;
}

/**
 * Check if the given RC level meets the requirement for a tech at a given level.
 */
export function meetsRCRequirement(techKey: string, level: number, researchCenterLevel: number): boolean {
    const req = getRCRequirement(techKey, level);
    if (req === null) return true;
    return researchCenterLevel >= req;
}

/**
 * Get all RC requirements for a tech (for displaying in the requirements box).
 */
export function getTechRCRequirements(techKey: string): { level: number; rcLevel: number }[] {
    const techReqs = rcRequirements[techKey];
    if (!techReqs) return [];
    return Object.entries(techReqs)
        .map(([level, rcLevel]) => ({ level: parseInt(level), rcLevel }))
        .sort((a, b) => a.level - b.level);
}

/**
 * Get all requirements (tech + RC) merged and sorted by level.
 */
export function getCombinedRequirements(
    techKey: string,
    allTechs: Record<string, Technology>,
): CombinedRequirement[] {
    const tech = allTechs[techKey];
    if (!tech) return [];

    const combined: CombinedRequirement[] = [];

    for (const req of tech.requirements) {
        combined.push({ type: 'tech', level: req.level, req });
    }

    const rcReqs = getTechRCRequirements(techKey);
    for (const rcReq of rcReqs) {
        combined.push({ type: 'rc', level: rcReq.level, rcLevel: rcReq.rcLevel });
    }

    combined.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        if (a.type === 'tech' && b.type === 'rc') return -1;
        if (a.type === 'rc' && b.type === 'tech') return 1;
        return 0;
    });

    return combined;
}

// ============================================================
// PREREQUISITE CHECKING FUNCTIONS
// ============================================================

/**
 * Check if line-based prerequisites are met (any connecting tech at level 1+).
 */
export function checkLinePrerequisites(
    techKey: string,
    userTechLevels: Record<string, number>,
): { met: boolean; missingTechs?: string[] } {
    const prereqs = linePrerequisites[techKey];
    if (!prereqs || prereqs.length === 0) return { met: true };

    const anyMet = prereqs.some((prereqKey) => (userTechLevels[prereqKey] || 0) >= 1);
    if (!anyMet) {
        return { met: false, missingTechs: prereqs };
    }
    return { met: true };
}

/**
 * Check if prerequisite techs are met (allOf / anyOf rules).
 */
export function checkPrerequisites(
    techKey: string,
    userTechLevels: Record<string, number>,
): { met: boolean; missingTechs?: string[]; isAnyOf?: boolean } {
    const prereqRule = prerequisiteTechs[techKey];
    if (!prereqRule) return { met: true };

    if ('anyOf' in prereqRule) {
        const anyMet = prereqRule.anyOf.some((prereqKey) => (userTechLevels[prereqKey] || 0) >= 1);
        if (!anyMet) {
            return { met: false, missingTechs: prereqRule.anyOf, isAnyOf: true };
        }
    } else if ('allOf' in prereqRule) {
        const missingTechs: string[] = [];
        for (const prereqKey of prereqRule.allOf) {
            const prereqLevel = userTechLevels[prereqKey] || 0;
            if (prereqLevel < 1) {
                missingTechs.push(prereqKey);
            }
        }
        if (missingTechs.length > 0) {
            return { met: false, missingTechs, isAnyOf: false };
        }
    }

    return { met: true };
}

/**
 * Check if a single tech requirement is met for a target upgrade level.
 */
export function checkTechRequirement(
    req: TechRequirement,
    targetLevel: number,
    userTechLevels: Record<string, number>,
): {
    met: boolean;
    failedTech?: string;
    failedTechs?: string[];
    requiredLevel?: number;
    isAnyOf?: boolean;
} {
    if (req.level > targetLevel) return { met: true };

    const requiredLevel = req.techLevel || 0;

    if (req.tech) {
        const currentLevel = userTechLevels[req.tech] || 0;
        if (currentLevel < requiredLevel) {
            return { met: false, failedTech: req.tech, requiredLevel };
        }
    } else if (req.anyOf) {
        const anyMet = req.anyOf.some((techKey) => (userTechLevels[techKey] || 0) >= requiredLevel);
        if (!anyMet) {
            return {
                met: false,
                failedTech: req.anyOf[0],
                failedTechs: req.anyOf,
                requiredLevel,
                isAnyOf: true,
            };
        }
    } else if (req.allOf) {
        const failedTechs: string[] = [];
        for (const techKey of req.allOf) {
            const currentLevel = userTechLevels[techKey] || 0;
            if (currentLevel < requiredLevel) {
                failedTechs.push(techKey);
            }
        }
        if (failedTechs.length > 0) {
            return {
                met: false,
                failedTech: failedTechs[0],
                failedTechs,
                requiredLevel,
            };
        }
    }

    return { met: true };
}

/**
 * Check all requirements for upgrading a tech to a specific level.
 */
export function canUpgradeToLevel(
    techKey: string,
    targetLevel: number,
    userTechLevels: Record<string, number>,
    researchCenterLevel: number,
    allTechs: Record<string, Technology>,
): {
    canUpgrade: boolean;
    blockingReq?: TechRequirement;
    failedTech?: string;
    failedTechs?: string[];
    requiredLevel?: number;
    rcRequired?: number;
    missingPrereqs?: string[];
    isAnyOf?: boolean;
    isPrereqAnyOf?: boolean;
    isLinePrereq?: boolean;
} {
    const tech = allTechs[techKey];
    if (!tech) return { canUpgrade: false };

    // Check prerequisite techs (need at least 1 point in previous tech to unlock)
    if (targetLevel === 1) {
        // First check line-based prerequisites (from connections)
        const lineCheck = checkLinePrerequisites(techKey, userTechLevels);
        if (!lineCheck.met && lineCheck.missingTechs) {
            return {
                canUpgrade: false,
                missingPrereqs: lineCheck.missingTechs,
                isPrereqAnyOf: true,
                isLinePrereq: true,
            };
        }

        // Then check explicit prerequisite rules
        const prereqCheck = checkPrerequisites(techKey, userTechLevels);
        if (!prereqCheck.met && prereqCheck.missingTechs) {
            return {
                canUpgrade: false,
                missingPrereqs: prereqCheck.missingTechs,
                isPrereqAnyOf: prereqCheck.isAnyOf,
            };
        }
    }

    // Check RC requirements
    const rcReq = getRCRequirement(techKey, targetLevel);
    if (rcReq && researchCenterLevel < rcReq) {
        return { canUpgrade: false, rcRequired: rcReq };
    }

    // Check tech requirements
    for (const req of tech.requirements) {
        if (req.level <= targetLevel) {
            const result = checkTechRequirement(req, targetLevel, userTechLevels);
            if (!result.met) {
                return {
                    canUpgrade: false,
                    blockingReq: req,
                    failedTech: result.failedTech,
                    failedTechs: result.failedTechs,
                    requiredLevel: result.requiredLevel,
                    isAnyOf: result.isAnyOf,
                };
            }
        }
    }

    return { canUpgrade: true };
}

/**
 * Find the maximum level a tech can be upgraded to given current requirements.
 */
export function findMaxUpgradeableLevel(
    techKey: string,
    userTechLevels: Record<string, number>,
    researchCenterLevel: number,
    allTechs: Record<string, Technology>,
): number {
    const tech = allTechs[techKey];
    if (!tech) return 0;

    const currentLevel = userTechLevels[techKey] || 0;
    let maxLevel = currentLevel;

    for (let level = currentLevel + 1; level <= tech.maxLevel; level++) {
        const check = canUpgradeToLevel(techKey, level, userTechLevels, researchCenterLevel, allTechs);
        if (check.canUpgrade) {
            maxLevel = level;
        } else {
            break;
        }
    }

    return maxLevel;
}

/**
 * Check if removing a level from a tech would break any dependencies.
 * Returns info about what tech depends on this level being maintained.
 */
export function checkRemovalDependencies(
    techKey: string,
    newLevel: number,
    userTechLevels: Record<string, number>,
    allTechs: Record<string, Technology>,
): {
    canRemove: boolean;
    blockingTech?: string;
    blockingTechName?: string;
    blockingTechLevel?: number;
    requiredLevel?: number;
    isAnyOf?: boolean;
    otherOptions?: string[];
} {
    for (const [otherTechKey, otherTech] of Object.entries(allTechs)) {
        const otherTechLevel = userTechLevels[otherTechKey] || 0;
        if (otherTechLevel === 0) continue;

        // Check this tech's requirements
        for (const req of otherTech.requirements) {
            if (req.level > otherTechLevel) continue;

            const requiredLevel = req.techLevel || 0;

            // Single tech requirement
            if (req.tech === techKey) {
                if (newLevel < requiredLevel) {
                    return {
                        canRemove: false,
                        blockingTech: otherTechKey,
                        blockingTechName: otherTech.name,
                        blockingTechLevel: otherTechLevel,
                        requiredLevel,
                    };
                }
            }

            // anyOf requirement - only blocks if this is the ONLY tech meeting the requirement
            if (req.anyOf && req.anyOf.includes(techKey)) {
                const currentLevel = userTechLevels[techKey] || 0;
                if (currentLevel >= requiredLevel && newLevel < requiredLevel) {
                    const othersMeetReq = req.anyOf.some(
                        (altKey) => altKey !== techKey && (userTechLevels[altKey] || 0) >= requiredLevel,
                    );
                    if (!othersMeetReq) {
                        return {
                            canRemove: false,
                            blockingTech: otherTechKey,
                            blockingTechName: otherTech.name,
                            blockingTechLevel: otherTechLevel,
                            requiredLevel,
                            isAnyOf: true,
                            otherOptions: req.anyOf.filter((k) => k !== techKey),
                        };
                    }
                }
            }

            // allOf requirement
            if (req.allOf && req.allOf.includes(techKey)) {
                if (newLevel < requiredLevel) {
                    return {
                        canRemove: false,
                        blockingTech: otherTechKey,
                        blockingTechName: otherTech.name,
                        blockingTechLevel: otherTechLevel,
                        requiredLevel,
                    };
                }
            }
        }

        // Check prerequisite techs (for level 1 unlock)
        const prereqRule = prerequisiteTechs[otherTechKey];
        if (prereqRule && otherTechLevel >= 1) {
            if ('allOf' in prereqRule && prereqRule.allOf.includes(techKey)) {
                if (newLevel < 1) {
                    return {
                        canRemove: false,
                        blockingTech: otherTechKey,
                        blockingTechName: otherTech.name,
                        blockingTechLevel: otherTechLevel,
                        requiredLevel: 1,
                    };
                }
            }
            if ('anyOf' in prereqRule && prereqRule.anyOf.includes(techKey)) {
                const currentLevel = userTechLevels[techKey] || 0;
                if (currentLevel >= 1 && newLevel < 1) {
                    const othersMeetReq = prereqRule.anyOf.some(
                        (altKey) => altKey !== techKey && (userTechLevels[altKey] || 0) >= 1,
                    );
                    if (!othersMeetReq) {
                        return {
                            canRemove: false,
                            blockingTech: otherTechKey,
                            blockingTechName: otherTech.name,
                            blockingTechLevel: otherTechLevel,
                            requiredLevel: 1,
                            isAnyOf: true,
                            otherOptions: prereqRule.anyOf.filter((k) => k !== techKey),
                        };
                    }
                }
            }
        }

        // Check line-based prerequisites (for level 1 unlock)
        const linePrereqs = linePrerequisites[otherTechKey];
        if (linePrereqs && linePrereqs.includes(techKey) && otherTechLevel >= 1 && newLevel < 1) {
            const othersMeetReq = linePrereqs.some(
                (altKey) => altKey !== techKey && (userTechLevels[altKey] || 0) >= 1,
            );
            if (!othersMeetReq) {
                return {
                    canRemove: false,
                    blockingTech: otherTechKey,
                    blockingTechName: otherTech.name,
                    blockingTechLevel: otherTechLevel,
                    requiredLevel: 1,
                    isAnyOf: true,
                    otherOptions: linePrereqs.filter((k) => k !== techKey),
                };
            }
        }
    }

    return { canRemove: true };
}
