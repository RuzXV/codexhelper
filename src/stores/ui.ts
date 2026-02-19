/**
 * UI Store — lightweight shared state for common UI patterns.
 *
 * Instead of declaring `let saving = false; let error = '';` in every
 * panel, components can use short-lived per-operation helpers here,
 * or subscribe to global toast / notification state.
 *
 * Usage:
 *   import { toastMessage, showToast } from '../stores/ui';
 */
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

// ── Toast / notification ───────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

/** { message: string, type: 'success'|'error'|'info', visible: boolean } */
export const toastMessage: Writable<ToastState> = writable({ message: '', type: 'info', visible: false });

let _toastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Show a toast notification that auto-hides after `duration` ms.
 */
export function showToast(message: string, type: ToastType = 'success', duration: number = 3000): void {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message, type, visible: true });
    _toastTimer = setTimeout(() => {
        toastMessage.update((t) => ({ ...t, visible: false }));
    }, duration);
}

export function hideToast(): void {
    if (_toastTimer) clearTimeout(_toastTimer);
    toastMessage.set({ message: '', type: 'info', visible: false });
}

// ── Active dashboard tab ───────────────────────────────────────────

/** Which top-level dashboard view is active (config, master, changelog, recovery) */
export const activeDashboardView: Writable<string> = writable('');

/** Which bot-config sub-tab is active (overview, channels, calendar, reminders, mge, ark) */
export const activeBotTab: Writable<string> = writable('overview');
