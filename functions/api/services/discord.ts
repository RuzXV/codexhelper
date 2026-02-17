import { Context } from 'hono';
import { Bindings, Variables, DiscordGuild } from '../_types';
import { parseAdminIds } from '../_constants';

/**
 * Fetch the user's guild list from Discord, with a 60-second KV cache
 * to reduce redundant API calls during dashboard navigation.
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

    const response = await fetch(`https://discord.com/api/users/@me/guilds`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    if (!response.ok) return null;
    const guilds = (await response.json()) as DiscordGuild[];

    // Cache for 60 seconds (non-blocking write)
    const putPromise = c.env.API_CACHE.put(cacheKey, JSON.stringify(guilds), { expirationTtl: 60 });
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
