// Tech Costs module
// Contains cost calculation functions, cost reduction logic,
// time parsing, and formatting utilities.

import { getRCCostReduction } from './techRequirements';

// ============================================================
// RESEARCH ORDER ENTRY TYPE
// ============================================================

export interface ResearchOrderEntry {
    techKey: string;
    level: number;
    cc1AtTime: number;
    cc2AtTime: number;
}

// ============================================================
// CUTTING CORNERS COST REDUCTION
// ============================================================

/**
 * Get Cutting Corners reduction based on user's CC1 and CC2 tech levels.
 * CC1: 1% per level up to 5%.
 * CC2: 1% per level up to 10%.
 */
export function getCuttingCornersReduction(
    cc1Level: number,
    cc2Level: number,
): number {
    return cc1Level + cc2Level;
}

// ============================================================
// CRYSTAL COST CALCULATIONS
// ============================================================

/**
 * Calculate reduced crystal cost after applying a reduction percentage.
 */
export function getReducedCost(baseCost: number, reductionPercent: number): number {
    return Math.round(baseCost * (1 - reductionPercent / 100));
}

/**
 * Get the cost reduction that was active when a specific level was researched.
 * This accounts for Cutting Corners applying proactively.
 *
 * @param techKey - The tech being researched
 * @param targetLevel - The level being calculated
 * @param researchCenterLevel - Current RC level
 * @param userTechLevels - Current tech levels map
 */
export function getCostReductionAtLevel(
    techKey: string,
    targetLevel: number,
    researchCenterLevel: number,
    userTechLevels: Record<string, number>,
): number {
    const rcReduction = getRCCostReduction(researchCenterLevel);

    let cc1Reduction = 0;
    let cc2Reduction = 0;

    if (techKey === 'cuttingCornersI') {
        // CC1 level N applies CC1 levels 1 to N-1
        cc1Reduction = Math.max(0, targetLevel - 1);
    } else if (techKey === 'cuttingCornersII') {
        // CC2 uses full CC1 reduction + CC2 levels 1 to N-1
        cc1Reduction = userTechLevels['cuttingCornersI'] || 0;
        cc2Reduction = Math.max(0, targetLevel - 1);
    } else {
        // Other techs use current CC1 and CC2 levels
        cc1Reduction = userTechLevels['cuttingCornersI'] || 0;
        cc2Reduction = userTechLevels['cuttingCornersII'] || 0;
    }

    return rcReduction + cc1Reduction + cc2Reduction;
}

/**
 * Calculate the actual crystal cost for a tech level based on the research order history.
 * Uses the CC levels that were active at the time of research.
 * Falls back to current CC levels for legacy data without research order.
 *
 * @param techKey - The tech key
 * @param level - The tech level
 * @param baseCost - The base crystal cost for this level
 * @param researchOrder - The recorded research order history
 * @param researchCenterLevel - Current RC level
 * @param userTechLevels - Current tech levels map
 */
export function calculateActualCrystalCostFromHistory(
    techKey: string,
    level: number,
    baseCost: number,
    researchOrder: ResearchOrderEntry[],
    researchCenterLevel: number,
    userTechLevels: Record<string, number>,
): number {
    const entry = researchOrder.find((e) => e.techKey === techKey && e.level === level);
    if (entry) {
        const ccReduction = entry.cc1AtTime + entry.cc2AtTime;
        const rcReduction = getRCCostReduction(researchCenterLevel);
        return getReducedCost(baseCost, rcReduction + ccReduction);
    }
    // Fallback for legacy data without research order - use current CC levels
    const reductionPercent = getCostReductionAtLevel(techKey, level, researchCenterLevel, userTechLevels);
    return getReducedCost(baseCost, reductionPercent);
}

// ============================================================
// TIME PARSING & FORMATTING
// ============================================================

/**
 * Parse a time string like "1d 2h 30m 15s" into total seconds.
 */
export function parseTimeToSeconds(timeStr: string): number {
    let seconds = 0;
    const dayMatch = timeStr.match(/(\d+)d/);
    const hourMatch = timeStr.match(/(\d+)h/);
    const minMatch = timeStr.match(/(\d+)m/);
    const secMatch = timeStr.match(/(\d+)s/);
    if (dayMatch) seconds += parseInt(dayMatch[1]) * 86400;
    if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    if (secMatch) seconds += parseInt(secMatch[1]);
    return seconds;
}

/**
 * Format a speedup value (in days) for display.
 */
export function formatSpeedups(days: number): string {
    if (days === 0) return '0 Days';
    if (days < 1) {
        const hours = days * 24;
        if (hours < 1) {
            const mins = hours * 60;
            return `${mins.toFixed(0)}m`;
        }
        return `${hours.toFixed(1)}h`;
    }
    return `${days.toFixed(1)} Days`;
}

// ============================================================
// NUMBER FORMATTING
// ============================================================

/**
 * Format a number with abbreviated suffix (k, M).
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
}
