import { Context } from 'hono';
import { Bindings, Variables, DiscordGuild } from '../_types';
import { parseAdminIds } from '../_constants';
import { encryptFernetToken } from '../../crypto';

/**
 * Invalidate a user session — deletes from DB and clears cookie.
 * Used when a refresh token is revoked or invalid.
 */
async function invalidateSession(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
): Promise<void> {
    const user = c.get('user');
    await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?')
        .bind(user.sessionToken)
        .run();
    c.header('Set-Cookie', 'session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
}

/**
 * Refresh the Discord access token using the stored refresh token.
 * On success: encrypts and persists new tokens, updates request context.
 * On failure: invalidates the session entirely.
 */
async function refreshDiscordToken(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
): Promise<boolean> {
    const user = c.get('user');

    const tokenData = new URLSearchParams({
        client_id: c.env.WEBSITE_APP_ID,
        client_secret: c.env.WEBSITE_APP_SECRET,
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenData,
    });

    if (!tokenResponse.ok) {
        console.error('Discord token refresh failed:', tokenResponse.status);
        await invalidateSession(c);
        return false;
    }

    const tokenJson = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token: string;
    };

    // Encrypt and persist new tokens
    const [encryptedAccess, encryptedRefresh] = await Promise.all([
        encryptFernetToken(c.env.DB_ENCRYPTION_KEY, tokenJson.access_token),
        encryptFernetToken(c.env.DB_ENCRYPTION_KEY, tokenJson.refresh_token),
    ]);

    await c.env.DB.prepare(
        'UPDATE user_sessions SET discord_access_token = ?, discord_refresh_token = ? WHERE session_token = ?',
    )
        .bind(encryptedAccess, encryptedRefresh, user.sessionToken)
        .run();

    // Update context for the rest of this request
    c.set('user', {
        ...user,
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token,
    });

    // Invalidate stale guild cache so next lookup uses fresh token
    const guildCacheKey = `discord:guilds:${user.id}`;
    try {
        await c.env.API_CACHE.delete(guildCacheKey);
    } catch (_) {
        /* best-effort cache clear */
    }

    return true;
}

/**
 * Fetch from Discord API with automatic token refresh on 401.
 * All Discord user-token API calls should route through this function.
 * On a 401 response, attempts one refresh and retries the request.
 */
export async function discordFetchWithRefresh(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    url: string,
    options?: RequestInit,
): Promise<Response> {
    const user = c.get('user');

    // First attempt with current access token
    const headers = { ...(options?.headers || {}), Authorization: `Bearer ${user.accessToken}` };
    let response = await fetch(url, { ...options, headers });

    // If 401 and we have a refresh token, try refreshing
    if (response.status === 401 && user.refreshToken) {
        const refreshed = await refreshDiscordToken(c);
        if (refreshed) {
            // Retry with new access token
            const newUser = c.get('user');
            const retryHeaders = { ...(options?.headers || {}), Authorization: `Bearer ${newUser.accessToken}` };
            response = await fetch(url, { ...options, headers: retryHeaders });
        }
    }

    return response;
}

/**
 * Fetch the user's guild list from Discord, with a 10-minute KV cache
 * to reduce redundant API calls during dashboard navigation.
 * Short TTL ensures token refresh is triggered before tokens go fully stale.
 */
async function fetchUserGuilds(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
): Promise<DiscordGuild[] | null> {
    const user = c.get('user');
    const cacheKey = `discord:guilds:${user.id}`;

    // Try cache first
    try {
        const cached = await c.env.API_CACHE.get(cacheKey);
        if (cached) return JSON.parse(cached) as DiscordGuild[];
    } catch (_) {
        /* cache miss, proceed to API */
    }

    const response = await discordFetchWithRefresh(c, 'https://discord.com/api/users/@me/guilds');
    if (!response.ok) return null;
    const guilds = (await response.json()) as DiscordGuild[];

    // Cache for 10 minutes (non-blocking write)
    const putPromise = c.env.API_CACHE.put(cacheKey, JSON.stringify(guilds), { expirationTtl: 600 });
    if (c.executionCtx && 'waitUntil' in c.executionCtx) {
        c.executionCtx.waitUntil(putPromise);
    } else {
        await putPromise;
    }

    return guilds;
}

export async function verifyGuildAdmin(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    guildId: string,
): Promise<boolean> {
    const guilds = await fetchUserGuilds(c);
    if (!guilds) return false;

    const targetGuild = guilds.find((g) => g.id === guildId);
    if (!targetGuild || !targetGuild.permissions) return false;

    const perms = BigInt(targetGuild.permissions);
    const ADMIN = 0x8n;
    const MANAGE_GUILD = 0x20n;
    return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}

export async function verifyGuildPatreonAccess(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    guildId: string,
): Promise<boolean> {
    const user = c.get('user');
    const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);

    if (masterAdminIds.includes(user.id)) return true;

    const isDiscordAdmin = await verifyGuildAdmin(c, guildId);
    if (!isDiscordAdmin) return false;

    const authRecord = await c.env.BOT_DB.prepare(
        'SELECT authorized_by_discord_user_id FROM guild_authorizations WHERE guild_id = ?',
    )
        .bind(guildId)
        .first();

    if (authRecord) {
        return true;
    }

    const bypassRecord = await c.env.BOT_DB.prepare('SELECT 1 FROM guild_bypass WHERE guild_id = ?')
        .bind(guildId)
        .first();

    if (bypassRecord) return true;

    return false;
}
