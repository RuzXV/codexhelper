// Tech Layout module
// Contains all layout constants, position generation, connection definitions,
// tech assignments, and canvas dimension calculations.

// ============================================================
// LAYOUT CONSTANTS
// ============================================================

/** Tile width in pixels */
export const NODE_WIDTH = 230;

/** Tile height in pixels */
export const NODE_HEIGHT = 80;

/** Horizontal gap between tiles */
export const H_GAP = 70;

/** Vertical spacing between the 4 main lines */
export const LINE_SPACING = 140;

/** Left padding of the canvas */
export const PADDING_LEFT = 40;

/** Top padding (extra for top pattern, centered with bottom) */
export const PADDING_TOP = 110;

/** Bottom padding (extra for bottom pattern + tooltip room) */
export const PADDING_BOTTOM = 110;

// ============================================================
// COLUMN PATTERN
// Pattern: 4-4-1-3-3-2-4-4-4-1-3-2-4-4-1-2-4-1
// - Even numbers (2,4): tiles ON the lines (rows 0, 1, 2, 3)
// - Odd numbers (1,3): tiles BETWEEN lines (rows 0.5, 1.5, 2.5)
// ============================================================

export const columnPattern = [4, 4, 1, 3, 3, 2, 4, 4, 4, 1, 3, 2, 4, 4, 1, 2, 4, 1] as const;

// ============================================================
// ROW GENERATION
// ============================================================

/**
 * For a given column tile count, returns the row positions.
 * Even count: rows 0, 1, 2, 3 (on lines)
 * Odd count: centered between lines
 *   - 1 tile: row 1.5 (center)
 *   - 3 tiles: rows 0.5, 1.5, 2.5 (between lines)
 */
export function getRowsForCount(count: number): number[] {
    if (count === 4) return [0, 1, 2, 3];
    if (count === 2) return [0.5, 2.5];
    if (count === 3) return [0.5, 1.5, 2.5];
    if (count === 1) return [1.5];
    return [];
}

// ============================================================
// GENERATED POSITIONS
// ============================================================

export interface SlotPosition {
    col: number;
    row: number;
    slot: string;
}

/** Build placeholder positions from the column pattern */
function buildGeneratedPositions(): SlotPosition[] {
    const positions: SlotPosition[] = [];
    columnPattern.forEach((count, colIndex) => {
        const rows = getRowsForCount(count);
        rows.forEach((row, slotIndex) => {
            positions.push({
                col: colIndex,
                row: row,
                slot: `col${colIndex}_slot${slotIndex}`,
            });
        });
    });
    return positions;
}

export const generatedPositions: SlotPosition[] = buildGeneratedPositions();

// ============================================================
// TECH ASSIGNMENTS
// Map slot positions to actual tech keys
// Format: 'col{X}_slot{Y}': 'techKeyName'
// Layout: 4 rows = Infantry (0), Archer (1), Cavalry (2), Siege (3)
// ============================================================

export const techAssignments: Record<string, string> = {
    // Column 0 (4 tiles) - Tier 1 Attack Stats
    col0_slot0: 'quenchedBladesI',
    col0_slot1: 'improvedBowsI',
    col0_slot2: 'mountedCombatTechniquesI',
    col0_slot3: 'improvedProjectilesI',

    // Column 1 (4 tiles) - Tier 1 March Speed
    col1_slot0: 'swiftMarchingI',
    col1_slot1: 'fleetOfFootI',
    col1_slot2: 'swiftSteedsI',
    col1_slot3: 'reinforcedAxlesI',

    // Column 2 (1 tile) - Central utility
    col2_slot0: 'callToArmsI',

    // Column 3 (3 tiles) - Utility branches
    col3_slot0: 'cuttingCornersI',
    col3_slot1: 'culturalExchange',
    col3_slot2: 'leadershipI',

    // Column 4 (3 tiles) - Utility branches continued
    col4_slot0: 'barbarianBounties',
    col4_slot1: 'callToArmsII',
    col4_slot2: 'karakuReports',

    // Column 5 (2 tiles) - positioned at rows 0.5, 2.5
    col5_slot0: 'cuttingCornersII',
    col5_slot1: 'leadershipII',

    // Column 6 (4 tiles) - Tier 2 Attack Stats
    col6_slot0: 'quenchedBladesII',
    col6_slot1: 'improvedBowsII',
    col6_slot2: 'mountedCombatTechniquesII',
    col6_slot3: 'improvedProjectilesII',

    // Column 7 (4 tiles) - Defense Stats
    col7_slot0: 'starmetalShields',
    col7_slot1: 'starmetalBracers',
    col7_slot2: 'starmetalBarding',
    col7_slot3: 'starmetalAxles',

    // Column 8 (4 tiles) - Tier 2 March Speed
    col8_slot0: 'swiftMarchingII',
    col8_slot1: 'fleetOfFootII',
    col8_slot2: 'swiftSteedsII',
    col8_slot3: 'reinforcedAxlesII',

    // Column 9 (1 tile) - Central utility
    col9_slot0: 'largerCamps',

    // Column 10 (3 tiles) - Utility branches
    col10_slot0: 'runecraft',
    col10_slot1: 'specialConcoctionsI',
    col10_slot2: 'expandedFormationsI',

    // Column 11 (2 tiles) - positioned at rows 0.5, 2.5
    col11_slot0: 'emergencySupport',
    col11_slot1: 'rapidRetreat',

    // Column 12 (4 tiles) - Tier 3 Health/Specialty Stats
    col12_slot0: 'ironInfantry',
    col12_slot1: 'archersFocus',
    col12_slot2: 'ridersResilience',
    col12_slot3: 'siegeProvisions',

    // Column 13 (4 tiles) - Tier 3 March Speed
    col13_slot0: 'swiftMarchingIII',
    col13_slot1: 'fleetOfFootIII',
    col13_slot2: 'swiftSteedsIII',
    col13_slot3: 'reinforcedAxlesIII',

    // Column 14 (1 tile) - Central utility
    col14_slot0: 'specialConcoctionsII',

    // Column 15 (2 tiles) - positioned at rows 0.5, 2.5
    col15_slot0: 'celestialGuidance',
    col15_slot1: 'expandedFormationsII',

    // Column 16 (4 tiles) - Expert Stats
    col16_slot0: 'infantryExpert',
    col16_slot1: 'archerExpert',
    col16_slot2: 'cavalryExpert',
    col16_slot3: 'siegeExpert',

    // Column 17 (1 tile) - Final utility
    col17_slot0: 'surpriseStrike',
};

// ============================================================
// TECH POSITIONS (derived from assignments + generated positions)
// ============================================================

function buildTechPositions(): Record<string, { col: number; row: number }> {
    const positions: Record<string, { col: number; row: number }> = {};
    generatedPositions.forEach((pos) => {
        const techKey = techAssignments[pos.slot];
        if (techKey) {
            positions[techKey] = { col: pos.col, row: pos.row };
        }
    });
    return positions;
}

export const techPositions: Record<string, { col: number; row: number }> = buildTechPositions();

// ============================================================
// CONNECTION DEFINITIONS
// Format: [fromSlot, toSlot] - defines which tiles connect
// ============================================================

export const connections: [string, string][] = [
    // Col 0 (4) -> Col 1 (4): each to each
    ['col0_slot0', 'col1_slot0'],
    ['col0_slot1', 'col1_slot1'],
    ['col0_slot2', 'col1_slot2'],
    ['col0_slot3', 'col1_slot3'],

    // Col 1 (4) -> Col 2 (1): all 4 converge to 1
    ['col1_slot0', 'col2_slot0'],
    ['col1_slot1', 'col2_slot0'],
    ['col1_slot2', 'col2_slot0'],
    ['col1_slot3', 'col2_slot0'],

    // Col 2 (1) -> Col 3 (3): 1 goes to all 3
    ['col2_slot0', 'col3_slot0'],
    ['col2_slot0', 'col3_slot1'],
    ['col2_slot0', 'col3_slot2'],

    // Col 3 (3) -> Col 4 (3): only middle continues to all 3
    ['col3_slot1', 'col4_slot0'],
    ['col3_slot1', 'col4_slot1'],
    ['col3_slot1', 'col4_slot2'],

    // Col 4 (3) -> Col 5 (2): middle goes to both tiles
    ['col4_slot1', 'col5_slot0'],
    ['col4_slot1', 'col5_slot1'],

    // Col 4 middle -> Col 6 (4): Line passes THROUGH the gap between col5 tiles
    // This is a special pass-through connection drawn separately

    // Col 6 (4) -> Col 7 (4): each to each
    ['col6_slot0', 'col7_slot0'],
    ['col6_slot1', 'col7_slot1'],
    ['col6_slot2', 'col7_slot2'],
    ['col6_slot3', 'col7_slot3'],

    // Col 7 (4) -> Col 8 (4): each to each
    ['col7_slot0', 'col8_slot0'],
    ['col7_slot1', 'col8_slot1'],
    ['col7_slot2', 'col8_slot2'],
    ['col7_slot3', 'col8_slot3'],

    // Col 8 (4) -> Col 9 (1): all 4 converge to 1
    ['col8_slot0', 'col9_slot0'],
    ['col8_slot1', 'col9_slot0'],
    ['col8_slot2', 'col9_slot0'],
    ['col8_slot3', 'col9_slot0'],

    // Col 9 (1) -> Col 10 (3): 1 goes to all 3
    ['col9_slot0', 'col10_slot0'],
    ['col9_slot0', 'col10_slot1'],
    ['col9_slot0', 'col10_slot2'],

    // Col 10 (3) -> Col 11 (2): only middle goes to both tiles
    ['col10_slot1', 'col11_slot0'],
    ['col10_slot1', 'col11_slot1'],

    // Col 10 middle -> Col 12 (4): Line passes THROUGH the gap between col11 tiles
    // This is a special pass-through connection drawn separately

    // Col 12 (4) -> Col 13 (4): each to each
    ['col12_slot0', 'col13_slot0'],
    ['col12_slot1', 'col13_slot1'],
    ['col12_slot2', 'col13_slot2'],
    ['col12_slot3', 'col13_slot3'],

    // Col 13 (4) -> Col 14 (1): all 4 converge to 1
    ['col13_slot0', 'col14_slot0'],
    ['col13_slot1', 'col14_slot0'],
    ['col13_slot2', 'col14_slot0'],
    ['col13_slot3', 'col14_slot0'],

    // Col 14 (1) -> Col 15 (2): 1 goes to both tiles
    ['col14_slot0', 'col15_slot0'],
    ['col14_slot0', 'col15_slot1'],

    // Col 14 -> Col 16 (4): Line passes THROUGH the gap between col15 tiles
    // This is a special pass-through connection drawn separately

    // Col 16 (4) -> Col 17 (1): all 4 converge to 1
    ['col16_slot0', 'col17_slot0'],
    ['col16_slot1', 'col17_slot0'],
    ['col16_slot2', 'col17_slot0'],
    ['col16_slot3', 'col17_slot0'],
];

// ============================================================
// PASS-THROUGH CONNECTIONS
// Line comes from previous column's middle slot, passes through
// the empty middle of the 2-tile column, then fans out to 4.
// ============================================================

export interface PassThroughConnection {
    fromCol: number;
    fromSlot: number;
    throughCol: number;
    toCol: number;
}

export const passThroughConnections: PassThroughConnection[] = [
    { fromCol: 4, fromSlot: 1, throughCol: 5, toCol: 6 },
    { fromCol: 10, fromSlot: 1, throughCol: 11, toCol: 12 },
    { fromCol: 14, fromSlot: 0, throughCol: 15, toCol: 16 },
];

// ============================================================
// SLOT POSITION MAP (pixel coordinates for connection drawing)
// ============================================================

function buildSlotPositionMap(): Record<string, { x: number; y: number }> {
    const map: Record<string, { x: number; y: number }> = {};
    generatedPositions.forEach((pos) => {
        map[pos.slot] = {
            x: PADDING_LEFT + pos.col * (NODE_WIDTH + H_GAP),
            y: PADDING_TOP + pos.row * LINE_SPACING,
        };
    });
    return map;
}

export const slotPositionMap: Record<string, { x: number; y: number }> = buildSlotPositionMap();

// ============================================================
// CANVAS DIMENSIONS
// ============================================================

export const totalColumns = columnPattern.length;
export const canvasWidth = PADDING_LEFT + totalColumns * (NODE_WIDTH + H_GAP) + 50;
/** Height: 4 lines (0,1,2,3) = 3 gaps between them, plus node height, plus padding top/bottom */
export const canvasHeight = PADDING_TOP + 3 * LINE_SPACING + NODE_HEIGHT + PADDING_BOTTOM;

// ============================================================
// CATEGORY COLORS
// ============================================================

export const categoryColors: Record<string, string> = {
    infantry: '#E63946',
    archer: '#2A9D8F',
    cavalry: '#E9C46A',
    siege: '#9B59B6',
    utility: '#3498DB',
};
