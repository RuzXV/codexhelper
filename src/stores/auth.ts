/**
 * Auth Store — wraps window.auth into a reactive Svelte store.
 *
 * Components import { authUser, fetchWithAuth } from '../stores/auth'
 * instead of using window.auth directly.
 *
 * `authUser`        – readable store of the current user (or null)
 * `fetchWithAuth`   – the same fetch wrapper, just re-exported so imports are explicit
 * `getLoggedInUser` – synchronous getter (re-export for scripts that need it)
 */
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

// ── Types ───────────────────────────────────────────────────────────

export interface DiscordUser {
    id: string;
    username: string;
    discriminator?: string;
    avatar: string | null;
    global_name?: string | null;
    [key: string]: unknown;
}

interface AuthLoggedInEvent extends CustomEvent {
    detail: { user: DiscordUser };
}

declare global {
    interface Window {
        auth?: {
            getLoggedInUser: () => DiscordUser | null;
            fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<any>;
            [key: string]: unknown;
        };
    }
}

// ── Internal state ─────────────────────────────────────────────────
const _user: Writable<DiscordUser | null> = writable(null);

// ── Public stores ──────────────────────────────────────────────────

/** Readable store: current logged-in user object or null */
export const authUser: { subscribe: Writable<DiscordUser | null>['subscribe'] } = {
    subscribe: _user.subscribe,
};

/** Whether a user is currently authenticated */
export const isLoggedIn: Readable<boolean> = derived(_user, ($u) => $u !== null);

// ── Bridging from window.auth ──────────────────────────────────────

/**
 * Initialise the auth store from window.auth.
 * Call this once in your root layout / Dashboard onMount.
 */
export function initAuthStore(): void {
    // Listen for the custom event that auth.js fires after login
    document.addEventListener('auth:loggedIn', ((e: AuthLoggedInEvent) => {
        _user.set(e.detail.user);
    }) as EventListener);

    // Seed the store if auth.js already resolved before the store was created
    if (window.auth && typeof window.auth.getLoggedInUser === 'function') {
        const existing = window.auth.getLoggedInUser();
        if (existing) _user.set(existing);
    }
}

/**
 * Clear the user (logout). UI reacts automatically via the store.
 */
export function clearAuth(): void {
    _user.set(null);
}

// ── Re-exported helpers ────────────────────────────────────────────

/**
 * Authenticated fetch wrapper — delegates to window.auth.fetchWithAuth.
 * Using this import instead of window.auth.fetchWithAuth makes the
 * dependency explicit and unit-testable (you can mock this module).
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!window.auth || typeof window.auth.fetchWithAuth !== 'function') {
        throw new Error('Auth not initialised – call initAuthStore() first');
    }
    return window.auth.fetchWithAuth(endpoint, options);
}

/**
 * Synchronous getter for the current user — same as window.auth.getLoggedInUser
 */
export function getLoggedInUser(): DiscordUser | null {
    if (!window.auth || typeof window.auth.getLoggedInUser !== 'function') return null;
    return window.auth.getLoggedInUser();
}
