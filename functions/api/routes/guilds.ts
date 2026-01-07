import { Hono } from 'hono';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { verifyGuildPatreonAccess } from '../services/discord';

const guilds = new Hono<{ Bindings: Bindings, Variables: Variables }>();

guilds.use('*', authMiddleware);

guilds.get('/:guildId/calendar', async (c) => {
    const { guildId } = c.req.param();
    
    const setup = await c.env.BOT_DB.prepare(
        "SELECT channel_id, create_discord_events FROM event_calendar_setups WHERE guild_id = ?"
    ).bind(guildId).first();

    const personalization = await c.env.BOT_DB.prepare(
        "SELECT anchor_date, anchor_cycle_id FROM egg_hammer_personalization WHERE guild_id = ?"
    ).bind(guildId).first();

    const config = {
        channel_id: setup?.channel_id || 'none',
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
                settings[row.command_group] = row.channel_id;
            });
        }
        return c.json({ settings });
    } catch (e) {
        return c.json({ settings: {} });
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

    if (action === 'Add Channel') {
        if (!channel_id || typeof channel_id !== 'string') return c.json({ error: 'Invalid channel ID' }, 400);
        await c.env.BOT_DB.prepare(
            "INSERT OR REPLACE INTO allowed_channels (guild_id, command_group, channel_id) VALUES (?, ?, ?)"
        ).bind(guildId, command_group, channel_id).run();
    } else {
        await c.env.BOT_DB.prepare(
            "DELETE FROM allowed_channels WHERE guild_id = ? AND command_group = ?"
        ).bind(guildId, command_group).run();
    }

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('CHANNEL_UPDATE', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

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

    const features = {
        ark: { enabled: !!ark, channel_id: ark?.channel_id || null },
        mge: { enabled: !!mge, channel_id: mge?.signup_channel_id || null },
        ruins: { enabled: !!(ruins && ruins.is_active), channel_id: ruins?.channel_id || null },
        altar: { enabled: !!(altar && altar.is_active), channel_id: altar?.channel_id || null }
    };

    return c.json({ features, patron });
});

guilds.get('/:guildId/reminders', async (c) => {
    const { guildId } = c.req.param();
    
    const [reminders, customReminders] = await Promise.all([
        c.env.BOT_DB.prepare("SELECT * FROM reminder_setups WHERE guild_id = ?").bind(guildId).all(),
        c.env.BOT_DB.prepare("SELECT * FROM custom_reminders WHERE guild_id = ?").bind(guildId).all()
    ]);

    return c.json({ 
        reminders: reminders.results || [], 
        customReminders: customReminders.results || [] 
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
                first_instance_ts, last_instance_ts, create_discord_events,
                reminder_intervals_seconds
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, '14400')
            ON CONFLICT(guild_id, reminder_type) DO UPDATE SET
                channel_id = excluded.channel_id,
                is_active = excluded.is_active,
                first_instance_ts = excluded.first_instance_ts,
                last_instance_ts = excluded.last_instance_ts,
                create_discord_events = excluded.create_discord_events
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
                        channel_id: s.channel_id,
                        admin_role_id: s.admin_role_id,
                        notification_role_id: s.tag_role_id,
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
                        role_id: t.role_id
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
        return c.json({ alliances: {} });
    }
});

guilds.post('/:guildId/ark/alliance', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, channel_id, admin_role_id, notification_role_id, reminder_interval } = await c.req.json();

    try {
        await c.env.BOT_DB.prepare(`
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
        ).run();

        const payload = JSON.stringify({ guild_id: guildId });
        await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(payload, Date.now() / 1000).run();

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
        c.env.BOT_DB.prepare("DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ?").bind(guildId, tag)
    ]);

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(payload, Date.now() / 1000).run();

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

        if (existing) {
            await c.env.BOT_DB.prepare(`
                UPDATE ark_of_osiris_teams 
                SET team_name = ?, next_match_timestamp = ?, signup_cap = ?
                WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?
            `).bind(team_name, match_timestamp, cap, guildId, alliance_tag, teamNum).run();
        } else {
            await c.env.BOT_DB.prepare(`
                INSERT INTO ark_of_osiris_teams (guild_id, alliance_tag, team_number, team_name, next_match_timestamp, signup_cap, role_id)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `).bind(guildId, alliance_tag, teamNum, team_name, match_timestamp, cap).run();
        }

        const payload = JSON.stringify({ guild_id: guildId });
        await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(payload, Date.now() / 1000).run();

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

    await c.env.BOT_DB.prepare(
        "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?"
    ).bind(guildId, alliance_tag, in_game_name).run();

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

guilds.delete('/:guildId/ark/team/:alliance_tag/:team_number', async (c) => {
    const { guildId, alliance_tag, team_number } = c.req.param();
    
    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.BOT_DB.prepare(
        "DELETE FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?"
    ).bind(guildId, alliance_tag, team_number).run();

    await c.env.BOT_DB.prepare(
        "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?"
    ).bind(guildId, alliance_tag, team_number).run();

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/signup', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, team_number, in_game_name } = await c.req.json();

    await c.env.BOT_DB.prepare(
        "DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?"
    ).bind(guildId, alliance_tag, in_game_name).run();

    const placeholderUserId = -Math.floor(Math.random() * 1000000);
    const nowTs = Date.now() / 1000;

    await c.env.BOT_DB.prepare(`
        INSERT INTO ark_of_osiris_signups (guild_id, alliance_tag, team_number, user_id, in_game_name, signup_timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(guildId, alliance_tag, team_number, placeholderUserId, in_game_name, nowTs).run();

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(payload, nowTs).run();

    return c.json({ success: true });
});

guilds.get('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    try {
        const setup = await c.env.BOT_DB.prepare(
            "SELECT signup_channel_id, admin_role_id, log_channel_id, is_active FROM mge_settings WHERE guild_id = ?"
        ).bind(guildId).first();

        return c.json({ config: setup || {} });
    } catch (e) {
        return c.json({ config: {} });
    }
});

guilds.post('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    if (!await verifyGuildPatreonAccess(c, guildId)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const { signup_channel_id, admin_role_id, log_channel_id } = await c.req.json();
    const isActive = 1;

    await c.env.BOT_DB.prepare(`
        INSERT INTO mge_settings (guild_id, signup_channel_id, admin_role_id, log_channel_id, is_active)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            signup_channel_id = excluded.signup_channel_id,
            admin_role_id = excluded.admin_role_id,
            log_channel_id = excluded.log_channel_id,
            is_active = excluded.is_active
    `).bind(
        guildId, 
        signup_channel_id || null, 
        admin_role_id || null, 
        log_channel_id || null, 
        isActive
    ).run();

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_UPDATE', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

export default guilds;