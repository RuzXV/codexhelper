/**
 * Guild Store — shared state for the currently selected Discord server.
 *
 * Eliminates the need to prop-drill `guildId`, `selectedServer`,
 * `availableServers`, and `guildChannels` through every bot-config panel.
 *
 * Usage:
 *   import { selectedServer, guildId, guildChannels } from '../stores/guild';
 *   $selectedServer   → the full server object (or null)
 *   $guildId          → shorthand string id
 *   $guildChannels    → array of Discord channels for the selected guild
 */
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';

// ── Types ───────────────────────────────────────────────────────────

export interface DiscordServer {
    id: string;
    name: string;
    icon: string | null;
    [key: string]: unknown;
}

export interface DiscordChannel {
    id: string;
    name: string;
    type?: number;
    [key: string]: unknown;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: number;
    [key: string]: unknown;
}

// ── Writable stores ────────────────────────────────────────────────

/** Full server object: { id, name, icon, … } or null */
export const selectedServer: Writable<DiscordServer | null> = writable(null);

/** List of servers the user has access to */
export const availableServers: Writable<DiscordServer[]> = writable([]);

/** Discord channels for the currently selected guild */
export const guildChannels: Writable<DiscordChannel[]> = writable([]);

/** Current channel/command-group settings object for the guild */
export const guildSettings: Writable<Record<string, unknown>> = writable({});

/** Whether guild data is currently being fetched */
export const guildLoading: Writable<boolean> = writable(false);

// ── Derived ────────────────────────────────────────────────────────

/** Convenience: just the guild ID string, or null */
export const guildId: Readable<string | null> = derived(selectedServer, ($s) => ($s ? $s.id : null));

// ── Actions ────────────────────────────────────────────────────────

const STORAGE_KEY = 'codex_last_server_id';

/**
 * Select a server and persist the choice.
 * Pass null to deselect.
 */
export function selectServer(server: DiscordServer | null): void {
    selectedServer.set(server);
    if (server) {
        localStorage.setItem(STORAGE_KEY, server.id);
    } else {
        localStorage.removeItem(STORAGE_KEY);
    }
}

/**
 * Restore the previously-selected server from localStorage (if it
 * exists in the availableServers list).
 */
export function restoreLastServer(servers: DiscordServer[]): void {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) return;
    const match = servers.find((s) => s.id === storedId);
    if (match) selectServer(match);
}

type FetchFn = (endpoint: string, options?: RequestInit) => Promise<any>;

/**
 * Load channels + settings for the currently selected guild.
 * Called by BotConfigPanel whenever selectedServer changes.
 */
export async function loadGuildData(gId: string, fetchFn: FetchFn): Promise<void> {
    guildLoading.set(true);
    try {
        const [settingsRes, channelsRes] = await Promise.all([
            fetchFn(`/api/guilds/${gId}/settings/channels`),
            fetchFn(`/api/guilds/${gId}/channels`),
        ]);
        guildSettings.set(settingsRes?.settings || {});
        guildChannels.set(channelsRes?.channels || []);
    } catch (e) {
        console.error('Failed to load guild data', e);
        guildSettings.set({});
        guildChannels.set([]);
    } finally {
        guildLoading.set(false);
    }
}
