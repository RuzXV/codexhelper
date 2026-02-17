// ── Types ──

export interface FlagRangeCost {
    start: number;
    end: number;
    food: number;
    wood: number;
    stone: number;
    gold: number;
    crystal: number;
}

export interface FlagCost {
    food: number;
    wood: number;
    stone: number;
    gold: number;
    crystal: number;
}

export interface ResourceSummary {
    current: number;
    production: number;
    totalCost: number;
    deficit: number; // positive = shortfall, 0 or negative = enough
    projectedGain: number;
    projectedTotal: number;
}

export interface CostBreakdownEntry {
    flagNum: number;
    food: number;
    wood: number;
    stone: number;
    gold: number;
    crystal: number;
}

export interface FlagResult {
    initialCrystal: number;
    currentFlags: number;
    projectedCrystal: number | null;
    futureGain: number | null;
    targetDate: Date | null;
    flagsBuilt: number;
    totalFlags: number;
    remainingCrystal: number;
    totalFoodCost: number;
    totalWoodCost: number;
    totalStoneCost: number;
    totalGoldCost: number;
    totalCrystalSpent: number;
    resourceSummaries: Record<string, ResourceSummary>;
    costBreakdown: CostBreakdownEntry[];
}

export interface ResourceDef {
    readonly key: string;
    readonly label: string;
    readonly colorClass: string;
    readonly imageSrc: string;
}

// ── Constants ──

export const FLAG_RANGE_COSTS: FlagRangeCost[] = [
    { start: 1, end: 10, food: 75000, wood: 75000, stone: 56250, gold: 37500, crystal: 0 },
    { start: 11, end: 20, food: 75000, wood: 75000, stone: 56250, gold: 37500, crystal: 0 },
    { start: 21, end: 30, food: 93750, wood: 93750, stone: 70350, gold: 46875, crystal: 7500 },
    { start: 31, end: 40, food: 93750, wood: 93750, stone: 70350, gold: 46875, crystal: 11250 },
    { start: 41, end: 50, food: 112500, wood: 112500, stone: 84375, gold: 56250, crystal: 15000 },
    { start: 51, end: 60, food: 112500, wood: 112500, stone: 84375, gold: 56250, crystal: 18750 },
    { start: 61, end: 70, food: 131250, wood: 131250, stone: 98475, gold: 65625, crystal: 22500 },
    { start: 71, end: 80, food: 131250, wood: 131250, stone: 98475, gold: 65625, crystal: 26250 },
    { start: 81, end: 90, food: 150000, wood: 150000, stone: 112500, gold: 75000, crystal: 30000 },
    { start: 91, end: 100, food: 150000, wood: 150000, stone: 112500, gold: 75000, crystal: 33750 },
    { start: 101, end: 110, food: 163750, wood: 168750, stone: 126600, gold: 84375, crystal: 37500 },
    { start: 111, end: 120, food: 168750, wood: 168750, stone: 126600, gold: 84375, crystal: 41250 },
    { start: 121, end: 130, food: 187500, wood: 137500, stone: 140625, gold: 93750, crystal: 45000 },
    { start: 131, end: 140, food: 187500, wood: 187500, stone: 140625, gold: 93750, crystal: 48750 },
    { start: 141, end: 150, food: 206250, wood: 206250, stone: 154725, gold: 103125, crystal: 52500 },
    { start: 151, end: 160, food: 206250, wood: 206250, stone: 154725, gold: 103125, crystal: 56250 },
    { start: 161, end: 170, food: 225000, wood: 225000, stone: 168750, gold: 112500, crystal: 60000 },
    { start: 171, end: 180, food: 225000, wood: 225000, stone: 168750, gold: 112500, crystal: 63750 },
    { start: 181, end: 190, food: 243750, wood: 243750, stone: 182850, gold: 121875, crystal: 67500 },
    { start: 191, end: 200, food: 243750, wood: 243750, stone: 182850, gold: 121875, crystal: 71250 },
    { start: 201, end: 210, food: 262500, wood: 262500, stone: 196875, gold: 131250, crystal: 75000 },
    { start: 211, end: 220, food: 262500, wood: 262500, stone: 196875, gold: 131250, crystal: 78750 },
    { start: 221, end: 230, food: 281250, wood: 281250, stone: 210975, gold: 140625, crystal: 82500 },
    { start: 231, end: 240, food: 281250, wood: 281250, stone: 210975, gold: 140625, crystal: 86250 },
    { start: 241, end: 250, food: 300000, wood: 300000, stone: 225000, gold: 150000, crystal: 90000 },
    { start: 251, end: 260, food: 300000, wood: 300000, stone: 225000, gold: 150000, crystal: 93750 },
    { start: 261, end: 270, food: 318750, wood: 318750, stone: 239100, gold: 159375, crystal: 97500 },
    { start: 271, end: 280, food: 318750, wood: 318750, stone: 239100, gold: 159375, crystal: 101250 },
    { start: 281, end: 290, food: 337500, wood: 337500, stone: 253125, gold: 168750, crystal: 105000 },
    { start: 291, end: 300, food: 337500, wood: 337500, stone: 253125, gold: 168750, crystal: 112500 },
    { start: 301, end: 310, food: 356250, wood: 356250, stone: 267225, gold: 178125, crystal: 187500 },
    { start: 311, end: 320, food: 356250, wood: 356250, stone: 267225, gold: 178125, crystal: 187500 },
    { start: 321, end: 330, food: 375000, wood: 375000, stone: 281250, gold: 187500, crystal: 187500 },
    { start: 331, end: 340, food: 375000, wood: 375000, stone: 281250, gold: 187500, crystal: 137500 },
    { start: 341, end: 350, food: 393750, wood: 393750, stone: 295350, gold: 196875, crystal: 187500 },
    { start: 351, end: 360, food: 393750, wood: 393750, stone: 295350, gold: 196375, crystal: 137500 },
    { start: 361, end: 370, food: 412500, wood: 412500, stone: 309375, gold: 206250, crystal: 187500 },
    { start: 371, end: 380, food: 412500, wood: 412500, stone: 309375, gold: 206250, crystal: 137500 },
    { start: 381, end: 390, food: 431250, wood: 431250, stone: 323475, gold: 215625, crystal: 187500 },
    { start: 391, end: 400, food: 431250, wood: 431250, stone: 323475, gold: 215625, crystal: 137500 },
    { start: 401, end: 410, food: 450000, wood: 450000, stone: 337500, gold: 225000, crystal: 225000 },
    { start: 411, end: 420, food: 450000, wood: 450000, stone: 337500, gold: 225000, crystal: 225000 },
    { start: 421, end: 430, food: 468750, wood: 468800, stone: 351600, gold: 234375, crystal: 225000 },
];

// Crystal costs per individual flag (from cog_flag_cost.py)
export const CRYSTAL_COSTS: number[] = [
    ...Array(20).fill(0), // Flags 1-20
    ...Array(10).fill(7500), // Flags 21-30
    ...Array(10).fill(11250), // Flags 31-40
    ...Array(10).fill(15000), // Flags 41-50
    ...Array(10).fill(18750), // Flags 51-60
    ...Array(10).fill(22500), // Flags 61-70
    ...Array(10).fill(26250), // Flags 71-80
    ...Array(10).fill(30000), // Flags 81-90
    ...Array(10).fill(33750), // Flags 91-100
    ...Array(10).fill(37500), // Flags 101-110
    ...Array(10).fill(41250), // Flags 111-120
    ...Array(10).fill(45000), // Flags 121-130
    ...Array(10).fill(48750), // Flags 131-140
    ...Array(10).fill(52500), // Flags 141-150
    ...Array(10).fill(56250), // Flags 151-160
    ...Array(10).fill(60000), // Flags 161-170
    ...Array(10).fill(63750), // Flags 171-180
    ...Array(10).fill(67500), // Flags 181-190
    ...Array(10).fill(71250), // Flags 191-200
    ...Array(10).fill(75000), // Flags 201-210
    ...Array(10).fill(78750), // Flags 211-220
    ...Array(10).fill(82500), // Flags 221-230
    ...Array(10).fill(86250), // Flags 231-240
    ...Array(10).fill(90000), // Flags 241-250
    ...Array(10).fill(93750), // Flags 251-260
    ...Array(10).fill(97500), // Flags 261-270
    ...Array(10).fill(101250), // Flags 271-280
    ...Array(10).fill(105000), // Flags 281-290
    ...Array(10).fill(112500), // Flags 291-300
    ...Array(100).fill(187500), // Flags 301-400
    ...Array(30).fill(225000), // Flags 401-430
];

export const MAX_FLAGS = CRYSTAL_COSTS.length; // 430

// ── Helper functions ──

/** Get the resource costs for a specific flag number (1-based) */
export function getCostsForFlag(flagNum: number): FlagCost {
    const range = FLAG_RANGE_COSTS.find((r) => flagNum >= r.start && flagNum <= r.end);
    if (range) {
        return {
            food: range.food,
            wood: range.wood,
            stone: range.stone,
            gold: range.gold,
            crystal: CRYSTAL_COSTS[flagNum - 1],
        };
    }
    return { food: 0, wood: 0, stone: 0, gold: 0, crystal: CRYSTAL_COSTS[flagNum - 1] || 0 };
}

export function parseNumber(val: string): number {
    if (!val) return NaN;
    const cleaned = val.replace(/[,\s]/g, '');
    return parseInt(cleaned, 10);
}

export function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

export function formatNumberInput(value: string): string {
    const num = parseNumber(value);
    if (isNaN(num) || num === 0) {
        return value.replace(/[^0-9,\s]/g, '');
    }
    return formatNumber(num);
}

export function parseDatetime(dateStr: string): Date | null {
    // Format: HH:MM DD/MM/YYYY
    const match = dateStr.trim().match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const [, hh, mm, dd, mo, yyyy] = match;
    const h = parseInt(hh);
    const m = parseInt(mm);
    const d = parseInt(dd);
    const month = parseInt(mo);
    const y = parseInt(yyyy);
    if (h < 0 || h > 23 || m < 0 || m > 59 || d < 1 || d > 31 || month < 1 || month > 12) return null;
    const date = new Date(Date.UTC(y, month - 1, d, h, m, 0, 0));
    if (isNaN(date.getTime())) return null;
    return date;
}

export function formatDateForDisplay(date: Date): string {
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${min} ${dd}/${mm}/${yyyy} UTC`;
}

export function formatRelativeTime(date: Date): string {
    const now = new Date();
    let diffMs = date.getTime() - now.getTime();
    const past = diffMs < 0;
    diffMs = Math.abs(diffMs);
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (parts.length === 0) parts.push('< 1m');
    const str = parts.join(' ');
    return past ? `${str} ago` : `in ${str}`;
}
