/**
 * Auth Store — wraps window.auth into a reactive Svelte store.
 *
 * Components import { authUser, fetchWithAuth } from '../stores/auth.js'
 * instead of using window.auth directly.
 *
 * `authUser`        – readable store of the current user (or null)
 * `fetchWithAuth`   – the same fetch wrapper, just re-exported so imports are explicit
 * `getLoggedInUser` – synchronous getter (re-export for scripts that need it)
 */
import { writable, derived } from 'svelte/store';

// ── Internal state ─────────────────────────────────────────────────
const _user = writable(null);

// ── Public stores ──────────────────────────────────────────────────

/** Readable store: current logged-in user object or null */
export const authUser = { subscribe: _user.subscribe };

/** Whether a user is currently authenticated */
export const isLoggedIn = derived(_user, ($u) => $u !== null);

// ── Bridging from window.auth ──────────────────────────────────────

/**
 * Initialise the auth store from window.auth.
 * Call this once in your root layout / Dashboard onMount.
 */
export function initAuthStore() {
    // Listen for the custom event that auth.js fires after login
    document.addEventListener('auth:loggedIn', (e) => {
        _user.set(e.detail.user);
    });

    // Seed the store if auth.js already resolved before the store was created
    if (window.auth && typeof window.auth.getLoggedInUser === 'function') {
        const existing = window.auth.getLoggedInUser();
        if (existing) _user.set(existing);
    }
}

/**
 * Clear the user (logout). UI reacts automatically via the store.
 */
export function clearAuth() {
    _user.set(null);
}

// ── Re-exported helpers ────────────────────────────────────────────

/**
 * Authenticated fetch wrapper — delegates to window.auth.fetchWithAuth.
 * Using this import instead of window.auth.fetchWithAuth makes the
 * dependency explicit and unit-testable (you can mock this module).
 */
export async function fetchWithAuth(endpoint, options = {}) {
    if (!window.auth || typeof window.auth.fetchWithAuth !== 'function') {
        throw new Error('Auth not initialised – call initAuthStore() first');
    }
    return window.auth.fetchWithAuth(endpoint, options);
}

/**
 * Synchronous getter for the current user — same as window.auth.getLoggedInUser
 */
export function getLoggedInUser() {
    if (!window.auth || typeof window.auth.getLoggedInUser !== 'function') return null;
    return window.auth.getLoggedInUser();
}
