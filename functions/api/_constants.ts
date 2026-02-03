export function parseAdminIds(envValue: string | undefined): string[] {
    return envValue ? envValue.split(',').map(id => id.trim()).filter(Boolean) : [];
}

export const TROOP_CYCLE = ["Infantry", "Archer", "Leadership", "Cavalry"];

export const EVENT_INTERVALS: Record<string, number> = {
    "mge": 14,
    "wof": 14,
    "mtg": 28,
    "gk": 14,
    "ceroli": 14,
    "rom": 14,
    "esm": 42,
    "arma": 42,
    "dhal": 42,
    "egg_hammer": 14,
    "goldhead": 14,
    "ark_battle": 14,
    "ark_registration": 14,
    "olympia": 14
};

export const EVENT_COLOR_MAP: Record<string, string> = {
    "mge": "5",             // Yellow (Banana)
    "wof": "3",             // Purple (Grape)
    "mtg": "11",            // Red (Tomato)
    "gk": "6",              // Orange (Tangerine)
    "ceroli": "2",          // Green (Sage)
    "rom": "9",             // Blue (Blueberry)
    "esm": "4",             // Pink (Flamingo)
    "arma": "3",            // Purple (Grape)
    "dhal": "7",            // Teal/Cyan (Peacock)
    "egg_hammer": "7",      // Cyan (Peacock)
    "goldhead": "5",        // Yellow (Banana)
    "ark_battle": "6",      // Tan/Orange (Tangerine)
    "ark_registration": "6",
    "olympia": "5"          // Gold/Yellow (Banana)
};