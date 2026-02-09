import { Hono, Context } from 'hono';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { verifyGuildPatreonAccess } from '../services/discord';

const guilds = new Hono<{ Bindings: Bindings, Variables: Variables }>();

guilds.use('*', authMiddleware);

/**
 * Verify that the guild_id param is a valid Discord snowflake
 * and that the bot is actually present in that guild.
 */
async function verifyGuildExists(c: Context<{ Bindings: Bindings, Variables: Variables }>, guildId: string): Promise<boolean> {
    if (!/^\d{17,20}$/.test(guildId)) return false;

    const response = await fetch(`https://discord.com/api/guilds/${guildId}`, {
        headers: { 'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}` }
    });
    return response.ok;
}

guilds.get('/:guildId/calendar', async (c) => {
    const { guildId } = c.req.param();
    
    const setup = await c.env.BOT_DB.prepare(
        "SELECT channel_id, create_discord_events FROM event_calendar_setups WHERE guild_id = ?"
    ).bind(guildId).first();

    const personalization = await c.env.BOT_DB.prepare(
        "SELECT anchor_date, anchor_cycle_id FROM egg_hammer_personalization WHERE guild_id = ?"
    ).bind(guildId).first();

    const config = {
        channel_id: setup?.channel_id ? String(setup.channel_id) : 'none',
        create_discord_events: setup?.create_discord_events === 1,
        is_personalized: !!personalization,
        anchor_date: personalization?.anchor_date || null,
        anchor_cycle_id: personalization?.anchor_cycle_id ?? 0,
        last_event: 'egg',
        last_egg_pattern: ''
    };

    return c.json({ config });
});

guilds.post('/:guildId/calendar', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();

    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ 
             error: 'Unauthorized: Only the Patreon subscriber who authorized this server can modify settings.' 
        }, 403);
    }

    const { 
        channel_id, 
        create_discord_events, 
        is_personalized, 
        reference_date, 
        reference_type, 
        reference_cycle_id 
    } = body;

    const now = Date.now() / 1000;

    if (channel_id && channel_id !== 'none') {
        await c.env.BOT_DB.prepare(`
            INSERT INTO event_calendar_setups (guild_id, channel_id, message_id, create_discord_events, is_active)
            VALUES (?, ?, 0, ?, 1)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                create_discord_events = excluded.create_discord_events,
                is_active = 1
        `).bind(guildId, channel_id, create_discord_events ? 1 : 0).run();
    } else {
        await c.env.BOT_DB.prepare("UPDATE event_calendar_setups SET is_active = 0 WHERE guild_id = ?").bind(guildId).run();
    }

    if (is_personalized && reference_date) {
        const inputDate = new Date(reference_date);
        let anchorDate = new Date(inputDate);

        if (reference_type === 'hammer') {
            anchorDate.setUTCDate(anchorDate.getUTCDate() - 14);
        }

        const anchorDateStr = anchorDate.toISOString().split('T')[0];
        const anchorCycleId = reference_cycle_id ?? 0;

        await c.env.BOT_DB.prepare(`
            INSERT INTO egg_hammer_personalization (guild_id, anchor_date, anchor_cycle_id)
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                anchor_date = excluded.anchor_date,
                anchor_cycle_id = excluded.anchor_cycle_id
        `).bind(guildId, anchorDateStr, anchorCycleId).run();

    } else if (!is_personalized) {
        await c.env.BOT_DB.prepare("DELETE FROM egg_hammer_personalization WHERE guild_id = ?").bind(guildId).run();
        await c.env.BOT_DB.prepare("DELETE FROM guild_event_sequence WHERE guild_id = ?").bind(guildId).run();
    }

    const payload = JSON.stringify({ guild_id: guildId, action: "refresh_calendar" });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('CALENDAR_UPDATE', ?, ?)"
    ).bind(payload, now).run();

    return c.json({ success: true });
});

guilds.get('/:guildId/settings/channels', async (c) => {
    const { guildId } = c.req.param();
    try {
        const { results } = await c.env.BOT_DB.prepare(
            "SELECT command_group, channel_id FROM allowed_channels WHERE guild_id = ?"
        ).bind(guildId).all();

        const settings: Record<string, string> = {};
        if (results) {
            results.forEach((row: any) => {
                settings[row.command_group] = row.channel_id ? String(row.channel_id) : row.channel_id;
            });
        }
        return c.json({ settings });
    } catch (e) {
        console.error(`Failed to fetch channel settings for guild ${guildId}:`, e);
        return c.json({ error: 'Failed to load channel settings', settings: {} }, 500);
    }
});

guilds.post('/:guildId/settings/channels', async (c) => {
    const { guildId } = c.req.param();

    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ 
            error: 'Unauthorized: Only the Patreon subscriber who authorized this server can modify settings.' 
        }, 403);
    }

    const { command_group, channel_id, action } = await c.req.json();
    
    if (!command_group || typeof command_group !== 'string') return c.json({ error: 'Invalid command group' }, 400);

    const now = Date.now() / 1000;
    const eventPayload = JSON.stringify({ guild_id: guildId });
    const notifyStmt = c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('CHANNEL_UPDATE', ?, ?)"
    ).bind(eventPayload, now);

    if (action === 'Add Channel') {
        if (!channel_id || typeof channel_id !== 'string') return c.json({ error: 'Invalid channel ID' }, 400);
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "INSERT OR REPLACE INTO allowed_channels (guild_id, command_group, channel_id) VALUES (?, ?, ?)"
            ).bind(guildId, command_group, channel_id),
            notifyStmt
        ]);
    } else {
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "DELETE FROM allowed_channels WHERE guild_id = ? AND command_group = ?"
            ).bind(guildId, command_group),
            notifyStmt
        ]);
    }

    return c.json({ success: true });
});

guilds.get('/:guildId/channels', async (c) => {
    const { guildId } = c.req.param();
    
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: { 'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}` } 
    });

    if (!response.ok) {
        console.error(`Failed to fetch channels for guild ${guildId}: ${response.status}`);
        return c.json({ channels: [] });
    }

    const channels = await response.json() as any[];
    
    const validChannels = channels
        .filter((ch: any) => [0, 5, 15].includes(ch.type))
        .map((ch: any) => ({ id: ch.id, name: ch.name, type: ch.type, position: ch.position }))
        .sort((a: any, b: any) => a.position - b.position);

    return c.json({ channels: validChannels });
});

guilds.get('/:guildId/features', async (c) => {
    const { guildId } = c.req.param();
    
    const [ark, mge, ruins, altar, bypassRecord, authRecord] = await Promise.all([
        c.env.BOT_DB.prepare("SELECT channel_id FROM ark_of_osiris_setups WHERE guild_id = ?").bind(guildId).first(),
        c.env.BOT_DB.prepare("SELECT signup_channel_id FROM mge_settings WHERE guild_id = ?").bind(guildId).first(),
        c.env.BOT_DB.prepare("SELECT channel_id, is_active FROM reminder_setups WHERE guild_id = ? AND reminder_type = 'ruins'").bind(guildId).first(),
        c.env.BOT_DB.prepare("SELECT channel_id, is_active FROM reminder_setups WHERE guild_id = ? AND reminder_type = 'altar'").bind(guildId).first(),
        c.env.BOT_DB.prepare("SELECT 1 FROM guild_bypass WHERE guild_id = ?").bind(guildId).first(),
        c.env.BOT_DB.prepare("SELECT authorized_by_discord_user_id FROM guild_authorizations WHERE guild_id = ?").bind(guildId).first()
    ]);

    let discordUserIdToFetch = null;
    let isBypass = false;

    if (bypassRecord) {
        discordUserIdToFetch = '285201373266575361';
        isBypass = true;
    } else if (authRecord && authRecord.authorized_by_discord_user_id) {
        discordUserIdToFetch = authRecord.authorized_by_discord_user_id;
    }

    let patron = null;
    if (discordUserIdToFetch) {
        try {
            const discordRes = await fetch(`https://discord.com/api/users/${discordUserIdToFetch}`, {
                headers: { 'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}` }
            });
            if (discordRes.ok) {
                const user = await discordRes.json() as any;
                patron = {
                    id: user.id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    is_bypass: isBypass
                };
            }
        } catch (e) {
            console.error("Failed to fetch user details", e);
        }
    }

    const toStr = (v: any) => v ? String(v) : null;
    const features = {
        ark: { enabled: !!ark, channel_id: toStr(ark?.channel_id) },
        mge: { enabled: !!mge, channel_id: toStr(mge?.signup_channel_id) },
        ruins: { enabled: !!(ruins && ruins.is_active), channel_id: toStr(ruins?.channel_id) },
        altar: { enabled: !!(altar && altar.is_active), channel_id: toStr(altar?.channel_id) }
    };

    return c.json({ features, patron });
});

guilds.get('/:guildId/reminders', async (c) => {
    const { guildId } = c.req.param();
    
    const [reminders, customReminders] = await Promise.all([
        c.env.BOT_DB.prepare("SELECT * FROM reminder_setups WHERE guild_id = ?").bind(guildId).all(),
        c.env.BOT_DB.prepare("SELECT * FROM custom_reminders WHERE guild_id = ?").bind(guildId).all()
    ]);

    const castIds = (rows: any[]) => rows.map((r: any) => ({
        ...r,
        channel_id: r.channel_id ? String(r.channel_id) : r.channel_id,
        role_id: r.role_id ? String(r.role_id) : r.role_id
    }));

    return c.json({
        reminders: castIds(reminders.results || []),
        customReminders: castIds(customReminders.results || [])
    });
});

guilds.post('/:guildId/reminders', async (c) => {
    const { guildId } = c.req.param();
    const { reminders, customReminders, deletedCustomIds } = await c.req.json();

    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ error: 'Unauthorized: Patreon access required.' }, 403);
    }

    const now = Date.now() / 1000;

    for (const r of reminders) {
        await c.env.BOT_DB.prepare(`
            INSERT INTO reminder_setups (
                guild_id, reminder_type, channel_id, is_active,
                first_instance_ts, last_instance_ts, create_discord_event,
                reminder_intervals_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, '14400')
            ON CONFLICT(guild_id, reminder_type) DO UPDATE SET
                channel_id = excluded.channel_id,
                is_active = excluded.is_active,
                first_instance_ts = excluded.first_instance_ts,
                last_instance_ts = excluded.last_instance_ts,
                create_discord_event = excluded.create_discord_event
        `).bind(
            guildId,
            r.reminder_type,
            r.channel_id,
            r.is_active ? 1 : 0,
            r.first_instance_ts,
            r.last_instance_ts,
            r.create_discord_event ? 1 : 0
        ).run();
    }

    if (deletedCustomIds && deletedCustomIds.length > 0) {
        const placeholders = deletedCustomIds.map(() => '?').join(',');
        await c.env.BOT_DB.prepare(
            `DELETE FROM custom_reminders WHERE guild_id = ? AND reminder_id IN (${placeholders})`
        ).bind(guildId, ...deletedCustomIds).run();
    }

    if (customReminders && Array.isArray(customReminders)) {
        for (const cr of customReminders) {
            if (cr.reminder_id) {
                await c.env.BOT_DB.prepare(`
                    UPDATE custom_reminders SET
                        channel_id = ?,
                        title = ?,
                        message = ?,
                        role_id = ?,
                        repeat_interval_seconds = ?,
                        first_instance_ts = ?
                    WHERE guild_id = ? AND reminder_id = ?
                `).bind(
                    cr.channel_id,
                    cr.title,
                    cr.message || '',
                    cr.role_id || null,
                    cr.repeat_interval_seconds,
                    cr.first_instance_ts,
                    guildId,
                    cr.reminder_id
                ).run();
            } else {
                await c.env.BOT_DB.prepare(`
                    INSERT INTO custom_reminders (
                        guild_id, created_by_user_id, channel_id, title, message, role_id,
                        repeat_interval_seconds, first_instance_ts, reminder_intervals_seconds, is_active, create_discord_event
                    ) VALUES (?, 0, ?, ?, ?, ?, ?, ?, '300', 1, 0)
                `).bind(
                    guildId,
                    cr.channel_id,
                    cr.title,
                    cr.message || '',
                    cr.role_id || null,
                    cr.repeat_interval_seconds,
                    cr.first_instance_ts
                ).run();
            }
        }
    }

    const payload = JSON.stringify({ guild_id: guildId, action: "refresh_reminders" });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('REMINDER_UPDATE', ?, ?)"
    ).bind(payload, now).run();

    return c.json({ success: true });
});

guilds.get('/:guildId/roles', async (c) => {
    const { guildId } = c.req.param();
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
        headers: { 'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}` }
    });
    if (!response.ok) return c.json({ roles: [] });
    const roles = await response.json() as any[];
    return c.json({ roles: roles.map((r: any) => ({ id: r.id, name: r.name, color: r.color })) });
});

guilds.get('/:guildId/ark/all', async (c) => {
    const { guildId } = c.req.param();
    try {
        const { results: setups } = await c.env.BOT_DB.prepare(
            "SELECT * FROM ark_of_osiris_setups WHERE guild_id = ?"
        ).bind(guildId).all();

        const { results: teams } = await c.env.BOT_DB.prepare(
            "SELECT * FROM ark_of_osiris_teams WHERE guild_id = ? ORDER BY team_number ASC"
        ).bind(guildId).all();

        const { results: signups } = await c.env.BOT_DB.prepare(
            "SELECT * FROM ark_of_osiris_signups WHERE guild_id = ? ORDER BY signup_timestamp ASC"
        ).bind(guildId).all();

        const alliances: Record<string, any> = {};

        if (setups) {
            setups.forEach((s: any) => {
                alliances[s.alliance_tag] = {
                    config: {
                        channel_id: s.channel_id ? String(s.channel_id) : null,
                        admin_role_id: s.admin_role_id ? String(s.admin_role_id) : null,
                        notification_role_id: s.tag_role_id ? String(s.tag_role_id) : null,
                        reminder_interval: s.reminder_interval_seconds,
                        is_active: s.is_active
                    },
                    teams: {},
                    signups: []
                };
            });
        }

        if (teams) {
            teams.forEach((t: any) => {
                if (alliances[t.alliance_tag]) {
                    alliances[t.alliance_tag].teams[t.team_number] = {
                        name: t.team_name,
                        match_timestamp: t.next_match_timestamp,
                        cap: t.signup_cap,
                        role_id: t.role_id ? String(t.role_id) : null
                    };
                }
            });
        }

        if (signups) {
            signups.forEach((su: any) => {
                if (alliances[su.alliance_tag]) {
                    alliances[su.alliance_tag].signups.push(su);
                }
            });
        }

        return c.json({ alliances });
    } catch (e) {
        console.error("Failed to fetch Ark data:", e);
        return c.json({ error: 'Failed to load Ark of Osiris data', alliances: {} }, 500);
    }
});

guilds.post('/:guildId/ark/alliance', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, channel_id, admin_role_id, notification_role_id, reminder_interval } = await c.req.json();

    try {
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(`
                INSERT INTO ark_of_osiris_setups (guild_id, alliance_tag, channel_id, admin_role_id, tag_role_id, reminder_interval_seconds, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(guild_id, alliance_tag) DO UPDATE SET
                    channel_id = excluded.channel_id,
                    admin_role_id = excluded.admin_role_id,
                    tag_role_id = excluded.tag_role_id,
                    reminder_interval_seconds = excluded.reminder_interval_seconds,
                    is_active = 1
            `).bind(
                guildId, alliance_tag,
                channel_id || null,
                admin_role_id || null,
                notification_role_id || null,
                reminder_interval || 3600
            ),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
            ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000)
        ]);

        return c.json({ success: true });
    } catch (e) {
        return c.json({ error: String(e) }, 500);
    }
});

guilds.delete('/:guildId/ark/alliance/:tag', async (c) => {
    const { guildId, tag } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare("DELETE FROM ark_of_osiris_setups WHERE guild_id = ? AND alliance_tag = ?").bind(guildId, tag),
        c.env.BOT_DB.prepare("DELETE FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ?").bind(guildId, tag),
        c.env.BOT_DB.prepare("DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ?").bind(guildId, tag),
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
        ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000)
    ]);

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/team', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, team_number, team_name, match_timestamp, signup_cap } = await c.req.json();

    const teamNum = parseInt(team_number);
    const cap = signup_cap ? parseInt(signup_cap) : null;

    try {
        const existing = await c.env.BOT_DB.prepare(
            "SELECT 1 FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?"
        ).bind(guildId, alliance_tag, teamNum).first();

        const teamStmt = existing
            ? c.env.BOT_DB.prepare(`
                UPDATE ark_of_osiris_teams
                SET team_name = ?, next_match_timestamp = ?, signup_cap = ?
                WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?
            `).bind(team_name, match_timestamp, cap, guildId, alliance_tag, teamNum)
            : c.env.BOT_DB.prepare(`
                INSERT INTO ark_of_osiris_teams (guild_id, alliance_tag, team_number, team_name, next_match_timestamp, signup_cap, role_id)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `).bind(guildId, alliance_tag, teamNum, team_name, match_timestamp, cap);

        await c.env.BOT_DB.batch([
            teamStmt,
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
            ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000)
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error("Failed to update ark team:", e);
        return c.json({ error: String(e) }, 500);
    }
});

guilds.delete('/:guildId/ark/signup', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, in_game_name } = await c.req.json();

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?"
        ).bind(guildId, alliance_tag, in_game_name),
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
        ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000)
    ]);

    return c.json({ success: true });
});

guilds.delete('/:guildId/ark/team/:alliance_tag/:team_number', async (c) => {
    const { guildId, alliance_tag, team_number } = c.req.param();

    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            "DELETE FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?"
        ).bind(guildId, alliance_tag, team_number),
        c.env.BOT_DB.prepare(
            "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?"
        ).bind(guildId, alliance_tag, team_number),
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
        ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000)
    ]);

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/signup', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, team_number, in_game_name } = await c.req.json();

    if (!alliance_tag || !in_game_name) {
        return c.json({ error: 'alliance_tag and in_game_name are required' }, 400);
    }

    const placeholderUserId = `web_${Date.now()}`;
    const nowTs = Date.now() / 1000;

    // Delete any existing signup for this player name in this alliance (prevents duplicates
    // across teams AND handles the case where the bot signed them up concurrently).
    // Then insert the new signup + system event atomically via batch.
    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?"
        ).bind(guildId, alliance_tag, in_game_name),
        c.env.BOT_DB.prepare(
            "INSERT INTO ark_of_osiris_signups (guild_id, alliance_tag, team_number, user_id, in_game_name, signup_timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(guildId, alliance_tag, team_number, placeholderUserId, in_game_name, nowTs),
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
        ).bind(JSON.stringify({ guild_id: guildId }), nowTs)
    ]);

    return c.json({ success: true });
});

guilds.get('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    try {
        // Cast coordinator_role_id to TEXT in SQL to avoid JavaScript integer precision loss on Discord snowflake IDs
        const setup = await c.env.BOT_DB.prepare(
            "SELECT *, CAST(coordinator_role_id AS TEXT) as coordinator_role_id FROM mge_settings WHERE guild_id = ?"
        ).bind(guildId).first() as any;

        if (setup) {
            // Cast remaining Discord IDs to strings to match Discord API format
            const idFields = ['signup_channel_id', 'posted_signups_channel_id', 'ping_role_id', 'signup_message_id'];
            for (const field of idFields) {
                if (setup[field]) setup[field] = String(setup[field]);
            }
        }

        return c.json({ config: setup || {} });
    } catch (e) {
        console.error("Failed to load MGE settings:", e);
        return c.json({ error: 'Failed to load MGE settings', config: {} }, 500);
    }
});

guilds.post('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();

    const mgePayload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(`
            UPDATE mge_settings SET
                signup_channel_id = ?,
                posted_signups_channel_id = ?,
                ping_role_id = ?,
                coordinator_role_id = ?
            WHERE guild_id = ?
        `).bind(
            body.signup_channel_id || null,
            body.posted_signups_channel_id || null,
            body.ping_role_id || null,
            body.coordinator_role_id || null,
            guildId
        ),
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_UPDATE', ?, ?)"
        ).bind(mgePayload, Date.now() / 1000)
    ]);

    return c.json({ success: true });
});

// --- MGE Applications ---

guilds.get('/:guildId/mge/applications', async (c) => {
    const { guildId } = c.req.param();
    try {
        const settings = await c.env.BOT_DB.prepare(
            "SELECT current_mge_name, placement_points FROM mge_settings WHERE guild_id = ?"
        ).bind(guildId).first() as any;

        if (!settings || !settings.current_mge_name) {
            return c.json({ mge_name: null, placement_points: '', applications: [], questions: [], rankings: [] });
        }

        const mgeName = settings.current_mge_name;

        const [appsResult, questionsResult, rankingsResult] = await Promise.all([
            c.env.BOT_DB.prepare(
                "SELECT * FROM mge_applications WHERE guild_id = ? AND mge_name = ? ORDER BY submitted_at DESC"
            ).bind(guildId, mgeName).all(),
            c.env.BOT_DB.prepare(
                "SELECT question_key, question_text, input_type, display_order, is_enabled FROM mge_questions WHERE guild_id = ? ORDER BY display_order ASC"
            ).bind(guildId).all(),
            c.env.BOT_DB.prepare(
                "SELECT rank_spot, application_id, ingame_name, is_published, custom_score FROM mge_rankings WHERE guild_id = ? AND mge_name = ? ORDER BY rank_spot ASC"
            ).bind(guildId, mgeName).all()
        ]);

        return c.json({
            mge_name: mgeName,
            placement_points: settings.placement_points || '',
            applications: appsResult.results || [],
            questions: questionsResult.results || [],
            rankings: rankingsResult.results || []
        });
    } catch (e) {
        console.error("Failed to fetch MGE applications:", e);
        return c.json({ error: 'Failed to load MGE applications', mge_name: null, placement_points: '', applications: [], questions: [], rankings: [] }, 500);
    }
});

guilds.post('/:guildId/mge/applications/:appId/accept', async (c) => {
    const { guildId, appId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { rank_spot } = await c.req.json();
    if (!rank_spot || rank_spot < 1) return c.json({ error: 'Invalid rank_spot' }, 400);

    try {
        const settings = await c.env.BOT_DB.prepare(
            "SELECT current_mge_name FROM mge_settings WHERE guild_id = ?"
        ).bind(guildId).first() as any;
        if (!settings?.current_mge_name) return c.json({ error: 'No active MGE' }, 400);

        const app = await c.env.BOT_DB.prepare(
            "SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?"
        ).bind(appId, guildId).first() as any;
        if (!app) return c.json({ error: 'Application not found' }, 404);

        const taken = await c.env.BOT_DB.prepare(
            "SELECT ingame_name FROM mge_rankings WHERE guild_id = ? AND mge_name = ? AND rank_spot = ?"
        ).bind(guildId, settings.current_mge_name, rank_spot).first() as any;
        if (taken) return c.json({ error: `Rank ${rank_spot} is already taken by ${taken.ingame_name}` }, 409);

        const acceptPayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId), rank_spot });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'ACCEPTED', rank_spot = ? WHERE application_id = ?"
            ).bind(rank_spot, appId),
            c.env.BOT_DB.prepare(
                "INSERT INTO mge_rankings (guild_id, rank_spot, application_id, mge_name, ingame_name, is_published) VALUES (?, ?, ?, ?, ?, 0)"
            ).bind(guildId, rank_spot, appId, settings.current_mge_name, app.ingame_name),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_ACCEPT', ?, ?)"
            ).bind(acceptPayload, Date.now() / 1000)
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error("MGE accept error:", e);
        return c.json({ error: String(e) }, 500);
    }
});

guilds.post('/:guildId/mge/applications/:appId/reject', async (c) => {
    const { guildId, appId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const app = await c.env.BOT_DB.prepare(
            "SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?"
        ).bind(appId, guildId).first();
        if (!app) return c.json({ error: 'Application not found' }, 404);

        const rejectPayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId) });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'REJECTED', rank_spot = NULL WHERE application_id = ?"
            ).bind(appId),
            c.env.BOT_DB.prepare(
                "DELETE FROM mge_rankings WHERE application_id = ?"
            ).bind(appId),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_REJECT', ?, ?)"
            ).bind(rejectPayload, Date.now() / 1000)
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error("MGE reject error:", e);
        return c.json({ error: String(e) }, 500);
    }
});

guilds.post('/:guildId/mge/applications/:appId/restore', async (c) => {
    const { guildId, appId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const app = await c.env.BOT_DB.prepare(
            "SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?"
        ).bind(appId, guildId).first();
        if (!app) return c.json({ error: 'Application not found' }, 404);

        const restorePayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId) });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'PENDING', rank_spot = NULL WHERE application_id = ?"
            ).bind(appId),
            c.env.BOT_DB.prepare(
                "DELETE FROM mge_rankings WHERE application_id = ?"
            ).bind(appId),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_RESTORE', ?, ?)"
            ).bind(restorePayload, Date.now() / 1000)
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error("MGE restore error:", e);
        return c.json({ error: String(e) }, 500);
    }
});

// --- Ark Embed Controls ---

guilds.post('/:guildId/ark/refresh-embed', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag } = await c.req.json();
    if (!alliance_tag) return c.json({ error: 'alliance_tag required' }, 400);

    const payload = JSON.stringify({ guild_id: guildId, alliance_tag });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/post-signup', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag } = await c.req.json();
    if (!alliance_tag) return c.json({ error: 'alliance_tag required' }, 400);

    const payload = JSON.stringify({ guild_id: guildId, alliance_tag });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_POST_SIGNUP', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

export default guilds;