/**
 * UI Store — lightweight shared state for common UI patterns.
 *
 * Instead of declaring `let saving = false; let error = '';` in every
 * panel, components can use short-lived per-operation helpers here,
 * or subscribe to global toast / notification state.
 *
 * Usage:
 *   import { toastMessage, showToast } from '../stores/ui.js';
 */
import { writable } from 'svelte/store';

// ── Toast / notification ───────────────────────────────────────────

/** { message: string, type: 'success'|'error'|'info', visible: boolean } */
export const toastMessage = writable({ message: '', type: 'info', visible: false });

let _toastTimer = null;

/**
 * Show a toast notification that auto-hides after `duration` ms.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='success']
 * @param {number} [duration=3000]
 */
export function showToast(message, type = 'success', duration = 3000) {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message, type, visible: true });
    _toastTimer = setTimeout(() => {
        toastMessage.update((t) => ({ ...t, visible: false }));
    }, duration);
}

export function hideToast() {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message: '', type: 'info', visible: false });
}

// ── Active dashboard tab ───────────────────────────────────────────

/** Which top-level dashboard view is active (config, master, changelog, recovery) */
export const activeDashboardView = writable('');

/** Which bot-config sub-tab is active (overview, channels, calendar, reminders, mge, ark) */
export const activeBotTab = writable('overview');
