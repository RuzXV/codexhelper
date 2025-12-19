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