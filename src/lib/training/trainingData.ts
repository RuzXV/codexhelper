// Training Calculator - Constants and Helper Functions

export const BASE_TIME_T5 = 120;
export const BASE_TIME_T4 = 80;
export const BASE_TIME_UPGRADE = 40;

export const POWER_PER_UNIT: Record<string, number> = { t4: 4, t5: 10, upgrade: 6 };
export const MGE_POINTS_PER_UNIT: Record<string, number> = { t4: 40, t5: 100, upgrade: 60 };
export const PREKVK_POINTS_PER_UNIT: Record<string, number> = { t4: 8, t5: 20, upgrade: 12 };

export interface ResourceCost {
    food: number;
    wood: number;
    stone: number;
    gold: number;
}

export const RESOURCES: Record<string, Record<string, ResourceCost>> = {
    t4: {
        infantry: { food: 300, wood: 300, stone: 0, gold: 20 },
        archer: { food: 0, wood: 300, stone: 225, gold: 20 },
        cavalry: { food: 300, wood: 0, stone: 225, gold: 20 },
        siege: { food: 200, wood: 200, stone: 150, gold: 20 },
    },
    t5: {
        infantry: { food: 800, wood: 800, stone: 0, gold: 400 },
        archer: { food: 0, wood: 800, stone: 600, gold: 400 },
        cavalry: { food: 800, wood: 0, stone: 600, gold: 400 },
        siege: { food: 500, wood: 500, stone: 400, gold: 400 },
    },
    upgrade: {
        infantry: { food: 500, wood: 500, stone: 0, gold: 380 },
        archer: { food: 0, wood: 500, stone: 375, gold: 380 },
        cavalry: { food: 500, wood: 0, stone: 375, gold: 380 },
        siege: { food: 300, wood: 300, stone: 250, gold: 380 },
    },
};

export const BATCH_SIZE = 1000;

export interface MixRatio {
    t4: number;
    t5: number;
    upgrade: number;
}

export interface TroopBreakdown {
    t4: number;
    t5: number;
    upgrade: number;
}

export interface TotalResources {
    food: number;
    wood: number;
    stone: number;
    gold: number;
}

export interface SpeedupTime {
    d: string;
    h: string;
    m: string;
}

export interface TroopInputs {
    t4: { infantry: string; cavalry: string; archer: string; siege: string };
    t5: { infantry: string; cavalry: string; archer: string; siege: string };
    upgrade: { infantry: string; cavalry: string; archer: string; siege: string };
}

export interface ReserveSelection {
    tier: string;
    size: number;
}

export function formatTime(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}

export function formatNumber(num: number): string {
    if (num >= 1000000000) return parseFloat((num / 1000000000).toFixed(2)) + 'B';
    if (num >= 1000000) return parseFloat((num / 1000000).toFixed(1)) + 'M';
    if (num >= 1000) return parseFloat((num / 1000).toFixed(1)) + 'k';
    return num.toLocaleString('en-US');
}

export function distributeTroops(
    total: number,
    mixRatio: MixRatio
): { troopBreakdown: TroopBreakdown; maxTroops: number } {
    let troopBreakdown: TroopBreakdown = { t4: 0, t5: 0, upgrade: 0 };
    let maxTroops: number;

    if (total >= BATCH_SIZE) {
        troopBreakdown.t4 = Math.floor((total * mixRatio.t4) / BATCH_SIZE) * BATCH_SIZE;
        troopBreakdown.t5 = Math.floor((total * mixRatio.t5) / BATCH_SIZE) * BATCH_SIZE;
        troopBreakdown.upgrade = Math.floor((total * mixRatio.upgrade) / BATCH_SIZE) * BATCH_SIZE;
        maxTroops = troopBreakdown.t4 + troopBreakdown.t5 + troopBreakdown.upgrade;
    } else {
        maxTroops = total;
        troopBreakdown.t4 = Math.floor(maxTroops * mixRatio.t4);
        troopBreakdown.t5 = Math.floor(maxTroops * mixRatio.t5);
        troopBreakdown.upgrade = Math.floor(maxTroops * mixRatio.upgrade);
    }

    return { troopBreakdown, maxTroops };
}

export function parseSpeedupSeconds(speedupTime: SpeedupTime): number {
    const days = parseInt(speedupTime.d.replace(/,/g, '') || '0');
    const hours = parseInt(speedupTime.h.replace(/,/g, '') || '0');
    const minutes = parseInt(speedupTime.m.replace(/,/g, '') || '0');
    return days * 86400 + hours * 3600 + minutes * 60;
}

export function getAvgTime(mixRatio: MixRatio): number {
    return mixRatio.t4 * BASE_TIME_T4 + mixRatio.t5 * BASE_TIME_T5 + mixRatio.upgrade * BASE_TIME_UPGRADE;
}

export function getAvgMgePoints(mixRatio: MixRatio): number {
    return (
        mixRatio.t4 * MGE_POINTS_PER_UNIT.t4 +
        mixRatio.t5 * MGE_POINTS_PER_UNIT.t5 +
        mixRatio.upgrade * MGE_POINTS_PER_UNIT.upgrade
    );
}

export function calcPower(breakdown: TroopBreakdown): number {
    return (
        breakdown.t4 * POWER_PER_UNIT.t4 +
        breakdown.t5 * POWER_PER_UNIT.t5 +
        breakdown.upgrade * POWER_PER_UNIT.upgrade
    );
}

export function calcMgePoints(breakdown: TroopBreakdown): number {
    return (
        breakdown.t4 * MGE_POINTS_PER_UNIT.t4 +
        breakdown.t5 * MGE_POINTS_PER_UNIT.t5 +
        breakdown.upgrade * MGE_POINTS_PER_UNIT.upgrade
    );
}

export function calcPreKvkPoints(breakdown: TroopBreakdown): number {
    return (
        breakdown.t4 * PREKVK_POINTS_PER_UNIT.t4 +
        breakdown.t5 * PREKVK_POINTS_PER_UNIT.t5 +
        breakdown.upgrade * PREKVK_POINTS_PER_UNIT.upgrade
    );
}

export function handleFormattedInput(rawValue: string): string {
    let value = rawValue.replace(/,/g, '').replace(/\D/g, '');
    return value ? parseInt(value).toLocaleString('en-US') : '';
}
