import { describe, it, expect } from 'vitest';
import { parseAdminIds, TROOP_CYCLE, EVENT_INTERVALS, EVENT_COLOR_MAP } from '../functions/api/_constants';

describe('parseAdminIds', () => {
    it('splits comma-separated IDs', () => {
        expect(parseAdminIds('111,222,333')).toEqual(['111', '222', '333']);
    });

    it('trims whitespace', () => {
        expect(parseAdminIds(' 111 , 222 ')).toEqual(['111', '222']);
    });

    it('filters empty strings', () => {
        expect(parseAdminIds('111,,222,')).toEqual(['111', '222']);
    });

    it('returns empty array for undefined', () => {
        expect(parseAdminIds(undefined)).toEqual([]);
    });

    it('returns empty array for empty string', () => {
        expect(parseAdminIds('')).toEqual([]);
    });
});

describe('TROOP_CYCLE', () => {
    it('contains exactly 4 troop types', () => {
        expect(TROOP_CYCLE).toHaveLength(4);
    });

    it('includes expected types', () => {
        expect(TROOP_CYCLE).toContain('Infantry');
        expect(TROOP_CYCLE).toContain('Archer');
        expect(TROOP_CYCLE).toContain('Leadership');
        expect(TROOP_CYCLE).toContain('Cavalry');
    });
});

describe('EVENT_INTERVALS', () => {
    it('has matching keys with EVENT_COLOR_MAP', () => {
        const intervalKeys = Object.keys(EVENT_INTERVALS).sort();
        const colorKeys = Object.keys(EVENT_COLOR_MAP).sort();
        expect(intervalKeys).toEqual(colorKeys);
    });

    it('all intervals are positive integers', () => {
        for (const [key, val] of Object.entries(EVENT_INTERVALS)) {
            expect(val, `${key} interval`).toBeGreaterThan(0);
            expect(Number.isInteger(val), `${key} is integer`).toBe(true);
        }
    });
});
