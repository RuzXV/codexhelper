import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { parseAdminIds } from '../_constants';

const users = new Hono<{ Bindings: Bindings, Variables: Variables }>();

users.use('*', authMiddleware);

users.get('/@me', async (c) => {
    const user = c.get('user');
    
    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    if (userResponse.status === 401) {
        const sessionToken = getCookie(c, 'session_token');
        await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
        c.header('Set-Cookie', 'session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
        return c.json({ error: 'Session expired' }, 401);
    }

    if (!userResponse.ok) {
        return c.json({ error: 'Failed to fetch fresh user data from Discord.' }, 500);
    }
    const userData = await userResponse.json() as { id: string; username: string; [key: string]: any };
    
    const activePatrons: string[] | null = await c.env.API_CACHE.get('active_patrons', 'json');

    const calendarAdminIds = parseAdminIds(c.env.CALENDAR_ADMIN_IDS);
    const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);

    const isMasterOverride = user.id === c.env.MASTER_OVERRIDE_ID;
    const isActivePatron = (activePatrons ? activePatrons.includes(user.id) : false) || isMasterOverride;
    const isCalendarAdmin = calendarAdminIds.includes(user.id) || isMasterOverride;
    const isMasterAdmin = masterAdminIds.includes(user.id) || isMasterOverride;

    user.username = userData.username;
    c.set('user', user);

    return c.json({
        ...userData,
        is_active_patron: isActivePatron,
        is_calendar_admin: isCalendarAdmin,
        is_master_admin: isMasterAdmin
    });
});

users.get('/settings', async (c) => {
    const user = c.get('user');
    const result = await c.env.DB.prepare(
        'SELECT settings FROM user_settings WHERE user_id = ?'
    ).bind(user.id).first();
    
    return c.json(result ? JSON.parse(result.settings as string) : {});
});

users.post('/settings', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    
    await c.env.DB.prepare(
        `INSERT INTO user_settings (user_id, settings) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings`
    ).bind(user.id, JSON.stringify(body)).run();

    return c.json({ status: 'success' });
});

users.get('/guilds', async (c) => {
    const user = c.get('user');

    const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    if (response.status === 401) {
        const sessionToken = getCookie(c, 'session_token');
        await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
        c.header('Set-Cookie', 'session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
        return c.json({ error: 'Session expired (Discord token invalid)' }, 401);
    }

    if (!response.ok) {
        return c.json({ error: 'Failed to fetch guilds from Discord' }, response.status as any);
    }

    const discordGuilds = await response.json() as any[];
    let activeBotGuildIds = new Set<string>();

    try {
        const { results: authResults } = await c.env.BOT_DB.prepare(
            `SELECT guild_id FROM guild_authorizations WHERE is_active = 1`
        ).all();
        if (authResults) authResults.forEach((r: any) => activeBotGuildIds.add(r.guild_id.toString()));

        const { results: bypassResults } = await c.env.BOT_DB.prepare(
            `SELECT guild_id FROM guild_bypass`
        ).all();
        if (bypassResults) bypassResults.forEach((r: any) => activeBotGuildIds.add(r.guild_id.toString()));

    } catch (e) {
        console.error("Database error fetching guilds:", e);
        return c.json({ error: 'Internal server error checking guild status' }, 500);
    }

    if (user.id === c.env.MASTER_OVERRIDE_ID) {
        const discordGuildMap = new Map(discordGuilds.map(g => [g.id, g]));
        const allBotGuilds = Array.from(activeBotGuildIds);

        const promises = allBotGuilds.map(async (gid) => {
            if (discordGuildMap.has(gid)) {
                const g = discordGuildMap.get(gid);
                return { id: g.id, name: g.name, icon: g.icon };
            }
            try {
                const res = await fetch(`https://discord.com/api/guilds/${gid}`, {
                    headers: { 'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}` }
                });
                if (res.ok) {
                    const g = await res.json() as any;
                    return { id: g.id, name: g.name, icon: g.icon };
                }
            } catch (e) {}
            return { id: gid, name: `Unknown Server (${gid})`, icon: null };
        });

        const fullList = await Promise.all(promises);
        fullList.sort((a, b) => a.name.localeCompare(b.name));
        return c.json(fullList);
    }

    const adminGuilds = discordGuilds.filter(g => {
        const perms = BigInt(g.permissions);
        const ADMIN = 0x8n;
        const MANAGE_GUILD = 0x20n;
        return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
    });

    const validServers = adminGuilds
        .filter(g => activeBotGuildIds.has(g.id))
        .map(g => ({ id: g.id, name: g.name, icon: g.icon }));

    validServers.sort((a, b) => a.name.localeCompare(b.name));
    return c.json(validServers);
});

export default users;