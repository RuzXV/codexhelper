import { Context } from 'hono';
import { Bindings, Variables } from '../_types';
import { parseAdminIds } from '../_constants';

export async function verifyGuildAdmin(c: Context<{ Bindings: Bindings, Variables: Variables }>, guildId: string): Promise<boolean> {
    const user = c.get('user');
    const response = await fetch(`https://discord.com/api/users/@me/guilds`, {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    if (!response.ok) return false;
    const guilds = await response.json() as any[];

    const targetGuild = guilds.find((g: any) => g.id === guildId);
    if (!targetGuild) return false;

    const perms = BigInt(targetGuild.permissions);
    const ADMIN = 0x8n;
    const MANAGE_GUILD = 0x20n;
    return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}

export async function verifyGuildPatreonAccess(c: Context<{ Bindings: Bindings, Variables: Variables }>, guildId: string): Promise<boolean> {
    const user = c.get('user');
    const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);

    if (masterAdminIds.includes(user.id)) return true;

    const isDiscordAdmin = await verifyGuildAdmin(c, guildId);
    if (!isDiscordAdmin) return false;

    const authRecord = await c.env.BOT_DB.prepare(
        'SELECT authorized_by_discord_user_id FROM guild_authorizations WHERE guild_id = ?'
    ).bind(guildId).first();

    if (authRecord) {
        return true; 
    }

    const bypassRecord = await c.env.BOT_DB.prepare(
        'SELECT 1 FROM guild_bypass WHERE guild_id = ?'
    ).bind(guildId).first();

    if (bypassRecord) return true;

    return false;
}