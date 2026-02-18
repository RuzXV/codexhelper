import { D1Database, KVNamespace } from '@cloudflare/workers-types';

export type Bindings = {
    DB: D1Database;
    BOT_DB: D1Database;
    API_CACHE: KVNamespace;
    BOT_DATA: KVNamespace;
    WEBSITE_APP_ID: string;
    WEBSITE_APP_SECRET: string;
    DISCORD_BOT_TOKEN: string;
    DB_ENCRYPTION_KEY: string;
    BOT_SECRET_KEY: string;
    GOOGLE_SERVICE_ACCOUNT_JSON: string;
    GOOGLE_CALENDAR_ID: string;
    MASTER_OVERRIDE_ID: string;
    MASTER_ADMIN_IDS: string;
    CALENDAR_ADMIN_IDS: string;
};

export type Variables = {
    user: {
        id: string;
        username: string;
        accessToken: string;
        refreshToken: string;
        sessionToken: string;
    };
};

export type OnlineUser = {
    id: string;
    username: string;
    avatar: string | null;
    last_seen: number;
};

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    global_name: string | null;
    avatar: string | null;
    bot?: boolean;
    system?: boolean;
    mfa_enabled?: boolean;
    banner?: string | null;
    accent_color?: number | null;
    locale?: string;
    verified?: boolean;
    email?: string | null;
    flags?: number;
    premium_type?: number;
    public_flags?: number;
}

export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner?: boolean;
    permissions?: string;
    features?: string[];
}

export interface DiscordChannel {
    id: string;
    type: number;
    guild_id?: string;
    position?: number;
    name?: string;
    topic?: string | null;
    nsfw?: boolean;
    parent_id?: string | null;
}

export interface EventRecord {
    id: string;
    series_id: string;
    title: string;
    type: string | null;
    troop_type: string | null;
    start_date: string;
    duration: number;
    created_by: string;
}

export interface UserSession {
    user_id: string;
    discord_access_token: string;
    discord_refresh_token: string | null;
    expiry_date: number;
}

export interface GuildSettings {
    guild_id: string;
    settings: string;
}

export interface UserTemplate {
    template_id: string;
    user_id: string;
    template_name: string;
    template_data: string;
    date_saved: number;
    last_loaded: number | null;
}

export interface ApiErrorResponse {
    error: string;
    timestamp?: string;
    details?: unknown;
}

export interface ApiSuccessResponse {
    status: 'success';
    message?: string;
}

// Admin types
export interface BackupEntry {
    timestamp: number;
    date: string;
    data: unknown;
}

export interface ChangelogEntry {
    timestamp: number;
    user: string;
    userId: string;
    userAvatar: string | null;
    action: string;
    details: string;
}

// Google Calendar types
export interface GoogleServiceAccountCredentials {
    client_email: string;
    private_key: string;
    project_id?: string;
    token_uri?: string;
}

export interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export interface CalendarEventInput {
    title: string;
    type: string | null;
    troop_type: string | null;
    start_date: string;
    duration: number;
    colorId: string;
}

export interface GoogleCalendarEvent {
    id: string;
    summary?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
    status?: string;
}

export interface GoogleCalendarListResponse {
    items?: GoogleCalendarEvent[];
    nextPageToken?: string;
}

// Guild / Ark / MGE types
export interface AllowedChannelRow {
    command_group: string;
    channel_id: string | number;
}

export interface ArkSetupRow {
    guild_id: string;
    alliance_tag: string;
    channel_id: string | number | null;
    admin_role_id: string | number | null;
    tag_role_id: string | number | null;
    reminder_interval_seconds: number | null;
    is_active: number;
}

export interface ArkTeamRow {
    guild_id: string;
    alliance_tag: string;
    team_number: number;
    team_name: string;
    next_match_timestamp: number | null;
    signup_cap: number | null;
    role_id: string | number | null;
}

export interface ArkSignupRow {
    guild_id: string;
    alliance_tag: string;
    team_number: number;
    user_id: string;
    in_game_name: string;
    signup_timestamp: number;
}

export interface MgeSettingsRow {
    guild_id: string;
    current_mge_name: string | null;
    placement_points: string | null;
    signup_channel_id: string | number | null;
    posted_signups_channel_id: string | number | null;
    ping_role_id: string | number | null;
    coordinator_role_id: string | number | null;
    signup_message_id: string | number | null;
}

export interface MgeApplicationRow {
    application_id: number;
    guild_id: string;
    mge_name: string;
    ingame_name: string;
    application_status: string;
    rank_spot: number | null;
    submitted_at: number;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: number;
    position?: number;
}

export interface ReminderSetupRow {
    guild_id: string;
    reminder_type: string;
    channel_id: string | number | null;
    is_active: number;
    first_instance_ts: number | null;
    last_instance_ts: number | null;
    create_discord_event: number;
    reminder_intervals_seconds: string;
    role_id?: string | number | null;
}

// Bot types
export interface BatchOperation {
    sql: string;
    params?: unknown[];
}

// KV key types
export interface KVListKey {
    name: string;
    expiration?: number;
    metadata?: unknown;
}
