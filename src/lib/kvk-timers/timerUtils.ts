// KvK Timer Utilities
// Shared date formatting, HP parsing, and time conversion helpers
// used by all 4 timer sub-components (Burn, Shield, Heal, Buff).

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatDateUTC(date: Date): string {
    const day = ordinal(date.getUTCDate());
    const month = shortMonths[date.getUTCMonth()];
    const hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day} of ${month}, ${hours}:${minutes} UTC`;
}

export function formatDateLocal(date: Date): string {
    const day = ordinal(date.getDate());
    const month = shortMonths[date.getMonth()];
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${day} of ${month}, ${time}`;
}

export function formatRelative(date: Date): string {
    const now = new Date();
    let diffMs = date.getTime() - now.getTime();
    const past = diffMs < 0;
    diffMs = Math.abs(diffMs);
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const parts: string[] = [];
    if (days > 0) {
        parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
    } else if (hours > 0) {
        parts.push(`${hours}h`);
        parts.push(`${mins}m`);
    } else if (mins > 0) {
        parts.push(`${mins}m`);
        parts.push(`${secs}s`);
    } else {
        parts.push(`${secs}s`);
    }
    const str = parts.join(' ');
    return past ? `${str} ago` : `in ${str}`;
}

/** Convert separate D/H/M fields to total milliseconds */
export function dhmToMs(d: string, h: string, m: string): number {
    const days = parseInt(d) || 0;
    const hours = parseInt(h) || 0;
    const mins = parseInt(m) || 0;
    return (days * 86400 + hours * 3600 + mins * 60) * 1000;
}

/** Parse an HP string that may contain , or . as thousand separators */
export function parseHP(val: string): number {
    if (!val) return NaN;
    const cleaned = val.replace(/[,.\s]/g, '');
    return parseInt(cleaned, 10);
}

/** Format a number with commas for display */
export function formatHP(n: number): string {
    return n.toLocaleString('en-US');
}

/** Auto-format an HP input value with commas as user types */
export function formatHPInput(value: string): string {
    const num = parseHP(value);
    if (isNaN(num) || num === 0) {
        return value.replace(/[^0-9.,\s]/g, '');
    }
    return formatHP(num);
}
