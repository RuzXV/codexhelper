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