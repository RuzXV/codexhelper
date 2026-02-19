import { Hono, Context } from 'hono';
import type { D1PreparedStatement } from '@cloudflare/workers-types';
import {
    Bindings,
    Variables,
    DiscordUser,
    DiscordChannel,
    DiscordRole,
    AllowedChannelRow,
    ArkSetupRow,
    ArkTeamRow,
    ArkSignupRow,
    MgeSettingsRow,
    MgeApplicationRow,
} from '../_types';
import { errors } from '../_errors';
import { authMiddleware } from '../_middleware';
import { verifyGuildPatreonAccess, verifyGuildAdmin } from '../services/discord';
import {
    CalendarSettingsSchema,
    ChannelActionSchema,
    ReminderBulkSchema,
    ArkAllianceSchema,
    ArkTeamSchema,
    ArkSignupSchema,
    ArkSignupDeleteSchema,
    ArkTagSchema,
    MgeSettingsSchema,
    MgeAcceptSchema,
    validateBody,
} from '../_validation';

const guilds = new Hono<{ Bindings: Bindings; Variables: Variables }>();

guilds.use('*', authMiddleware);

/** Validate that a guildId is a valid Discord snowflake format */
function isValidSnowflake(id: string): boolean {
    return /^\d{17,20}$/.test(id);
}

/** Guild ID validation middleware — rejects requests with invalid snowflakes early */
guilds.use('/:guildId/*', async (c, next) => {
    const { guildId } = c.req.param();
    if (!isValidSnowflake(guildId)) {
        return c.json({ error: 'Invalid guild ID format' }, 400);
    }
    await next();
});

// Also validate bare /:guildId routes (no trailing path)
guilds.use('/:guildId', async (c, next) => {
    const { guildId } = c.req.param();
    if (!isValidSnowflake(guildId)) {
        return c.json({ error: 'Invalid guild ID format' }, 400);
    }
    await next();
});

/** Verify the authenticated user is an admin of the requested guild (for read endpoints) */
async function verifyGuildReadAccess(
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    guildId: string,
): Promise<boolean> {
    return verifyGuildAdmin(c, guildId);
}

guilds.get('/:guildId/calendar', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const [setup, personalization] = await Promise.all([
        c.env.BOT_DB.prepare('SELECT channel_id, create_discord_events FROM event_calendar_setups WHERE guild_id = ?')
            .bind(guildId)
            .first(),
        c.env.BOT_DB.prepare('SELECT anchor_date, anchor_cycle_id FROM egg_hammer_personalization WHERE guild_id = ?')
            .bind(guildId)
            .first(),
    ]);

    const config = {
        channel_id: setup?.channel_id ? String(setup.channel_id) : 'none',
        create_discord_events: setup?.create_discord_events === 1,
        is_personalized: !!personalization,
        anchor_date: personalization?.anchor_date || null,
        anchor_cycle_id: personalization?.anchor_cycle_id ?? 0,
        last_event: 'egg',
        last_egg_pattern: '',
    };

    return c.json({ config });
});

guilds.post('/:guildId/calendar', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(CalendarSettingsSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json(
            {
                error: 'Unauthorized: Only the Patreon subscriber who authorized this server can modify settings.',
            },
            403,
        );
    }

    const { channel_id, create_discord_events, is_personalized, reference_date, reference_type, reference_cycle_id } =
        validation.data;

    const now = Date.now() / 1000;

    if (channel_id && channel_id !== 'none') {
        await c.env.BOT_DB.prepare(
            `
            INSERT INTO event_calendar_setups (guild_id, channel_id, message_id, create_discord_events, is_active)
            VALUES (?, ?, 0, ?, 1)
            ON CONFLICT(guild_id) DO UPDATE SET
                channel_id = excluded.channel_id,
                create_discord_events = excluded.create_discord_events,
                is_active = 1
        `,
        )
            .bind(guildId, channel_id, create_discord_events ? 1 : 0)
            .run();
    } else {
        await c.env.BOT_DB.prepare('UPDATE event_calendar_setups SET is_active = 0 WHERE guild_id = ?')
            .bind(guildId)
            .run();
    }

    const calendarAction = channel_id && channel_id !== 'none' ? 'refresh_calendar' : 'deactivate';

    if (is_personalized && reference_date) {
        const inputDate = new Date(reference_date);
        const anchorDate = new Date(inputDate);

        if (reference_type === 'hammer') {
            anchorDate.setUTCDate(anchorDate.getUTCDate() - 14);
        }

        const anchorDateStr = anchorDate.toISOString().split('T')[0];
        const anchorCycleId = reference_cycle_id ?? 0;

        await c.env.BOT_DB.prepare(
            `
            INSERT INTO egg_hammer_personalization (guild_id, anchor_date, anchor_cycle_id)
            VALUES (?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
                anchor_date = excluded.anchor_date,
                anchor_cycle_id = excluded.anchor_cycle_id
        `,
        )
            .bind(guildId, anchorDateStr, anchorCycleId)
            .run();

        // Also sync to the user's personal settings so the public calendar page reflects the rotation
        const user = c.get('user');
        if (user?.id) {
            const userSettings = JSON.stringify({ anchorDate: anchorDateStr, anchorCycleId });
            await c.env.DB.prepare(
                `INSERT INTO user_settings (user_id, settings) VALUES (?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings`,
            )
                .bind(user.id, userSettings)
                .run();
        }
    } else if (!is_personalized) {
        await c.env.BOT_DB.prepare('DELETE FROM egg_hammer_personalization WHERE guild_id = ?').bind(guildId).run();
        await c.env.BOT_DB.prepare('DELETE FROM guild_event_sequence WHERE guild_id = ?').bind(guildId).run();
    }

    const payload = JSON.stringify({ guild_id: guildId, action: calendarAction });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('CALENDAR_UPDATE', ?, ?)")
        .bind(payload, now)
        .run();

    return c.json({ success: true });
});

guilds.get('/:guildId/settings/channels', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return errors.forbidden(c);
    try {
        const { results } = await c.env.BOT_DB.prepare(
            'SELECT command_group, channel_id FROM allowed_channels WHERE guild_id = ?',
        )
            .bind(guildId)
            .all();

        const settings: Record<string, string> = {};
        if (results) {
            results.forEach((row) => {
                const r = row as unknown as AllowedChannelRow;
                settings[r.command_group] = r.channel_id ? String(r.channel_id) : '';
            });
        }
        return c.json({ settings });
    } catch (e) {
        console.error(`Failed to fetch channel settings for guild ${guildId}:`, e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/settings/channels', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ChannelActionSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json(
            {
                error: 'Unauthorized: Only the Patreon subscriber who authorized this server can modify settings.',
            },
            403,
        );
    }

    const { command_group, channel_id, action } = validation.data;

    const now = Date.now() / 1000;
    const eventPayload = JSON.stringify({ guild_id: guildId });
    const notifyStmt = c.env.BOT_DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('CHANNEL_UPDATE', ?, ?)",
    ).bind(eventPayload, now);

    if (action === 'Add Channel') {
        if (!channel_id || typeof channel_id !== 'string') return c.json({ error: 'Invalid channel ID' }, 400);
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                'INSERT OR REPLACE INTO allowed_channels (guild_id, command_group, channel_id) VALUES (?, ?, ?)',
            ).bind(guildId, command_group, channel_id),
            notifyStmt,
        ]);
    } else {
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare('DELETE FROM allowed_channels WHERE guild_id = ? AND command_group = ?').bind(
                guildId,
                command_group,
            ),
            notifyStmt,
        ]);
    }

    return c.json({ success: true });
});

guilds.get('/:guildId/channels', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    // Check KV cache first (5-min TTL)
    const cacheKey = `discord:channels:${guildId}`;
    try {
        const cached = await c.env.API_CACHE.get(cacheKey);
        if (cached) return c.json(JSON.parse(cached));
    } catch (_) {
        /* cache miss */
    }

    const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
    });

    if (!response.ok) {
        console.error(`Failed to fetch channels for guild ${guildId}: ${response.status}`);
        return c.json({ channels: [] });
    }

    const channels = (await response.json()) as DiscordChannel[];

    const validChannels = channels
        .filter((ch) => [0, 5, 15].includes(ch.type))
        .map((ch) => ({ id: ch.id, name: ch.name, type: ch.type, position: ch.position }))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const result = { channels: validChannels };

    // Cache for 5 minutes (non-blocking)
    const putPromise = c.env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    if (c.executionCtx && 'waitUntil' in c.executionCtx) {
        c.executionCtx.waitUntil(putPromise);
    }

    return c.json(result);
});

guilds.get('/:guildId/features', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const [ark, mge, ruins, altar, bypassRecord, authRecord] = await Promise.all([
        c.env.BOT_DB.prepare('SELECT channel_id FROM ark_of_osiris_setups WHERE guild_id = ?').bind(guildId).first(),
        c.env.BOT_DB.prepare('SELECT signup_channel_id FROM mge_settings WHERE guild_id = ?').bind(guildId).first(),
        c.env.BOT_DB.prepare(
            "SELECT channel_id, is_active FROM reminder_setups WHERE guild_id = ? AND reminder_type = 'ruins'",
        )
            .bind(guildId)
            .first(),
        c.env.BOT_DB.prepare(
            "SELECT channel_id, is_active FROM reminder_setups WHERE guild_id = ? AND reminder_type = 'altar'",
        )
            .bind(guildId)
            .first(),
        c.env.BOT_DB.prepare('SELECT 1 FROM guild_bypass WHERE guild_id = ?').bind(guildId).first(),
        c.env.BOT_DB.prepare('SELECT authorized_by_discord_user_id FROM guild_authorizations WHERE guild_id = ?')
            .bind(guildId)
            .first(),
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
                headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
            });
            if (discordRes.ok) {
                const user = (await discordRes.json()) as DiscordUser;
                patron = {
                    id: user.id,
                    username: user.username,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                    is_bypass: isBypass,
                };
            }
        } catch (e) {
            console.error('Failed to fetch user details', e);
        }
    }

    const toStr = (v: unknown) => (v ? String(v) : null);
    const features = {
        ark: { enabled: !!ark, channel_id: toStr(ark?.channel_id) },
        mge: { enabled: !!mge, channel_id: toStr(mge?.signup_channel_id) },
        ruins: { enabled: !!(ruins && ruins.is_active), channel_id: toStr(ruins?.channel_id) },
        altar: { enabled: !!(altar && altar.is_active), channel_id: toStr(altar?.channel_id) },
    };

    return c.json({ features, patron });
});

guilds.get('/:guildId/reminders', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const [reminders, customReminders] = await Promise.all([
        c.env.BOT_DB.prepare('SELECT * FROM reminder_setups WHERE guild_id = ?').bind(guildId).all(),
        c.env.BOT_DB.prepare('SELECT * FROM custom_reminders WHERE guild_id = ?').bind(guildId).all(),
    ]);

    const castIds = (rows: Record<string, unknown>[]) =>
        rows.map((r) => ({
            ...r,
            channel_id: r.channel_id ? String(r.channel_id) : r.channel_id,
            role_id: r.role_id ? String(r.role_id) : r.role_id,
        }));

    return c.json({
        reminders: castIds(reminders.results || []),
        customReminders: castIds(customReminders.results || []),
    });
});

guilds.post('/:guildId/reminders', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ReminderBulkSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json({ error: 'Unauthorized: Patreon access required.' }, 403);
    }

    const { reminders, customReminders, deletedCustomIds } = validation.data;

    const now = Date.now() / 1000;
    const statements: D1PreparedStatement[] = [];

    for (const r of reminders) {
        const intervals = r.reminder_intervals_seconds || '14400';
        statements.push(
            c.env.BOT_DB.prepare(
                `
                INSERT INTO reminder_setups (
                    guild_id, reminder_type, channel_id, is_active,
                    first_instance_ts, last_instance_ts, create_discord_event,
                    reminder_intervals_seconds
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(guild_id, reminder_type) DO UPDATE SET
                    channel_id = excluded.channel_id,
                    is_active = excluded.is_active,
                    first_instance_ts = excluded.first_instance_ts,
                    last_instance_ts = excluded.last_instance_ts,
                    create_discord_event = excluded.create_discord_event,
                    reminder_intervals_seconds = excluded.reminder_intervals_seconds
            `,
            ).bind(
                guildId,
                r.reminder_type,
                r.channel_id || null,
                r.is_active ? 1 : 0,
                r.first_instance_ts || null,
                r.last_instance_ts || null,
                r.create_discord_event ? 1 : 0,
                intervals,
            ),
        );
    }

    if (deletedCustomIds && deletedCustomIds.length > 0) {
        const placeholders = deletedCustomIds.map(() => '?').join(',');
        statements.push(
            c.env.BOT_DB.prepare(
                `DELETE FROM custom_reminders WHERE guild_id = ? AND reminder_id IN (${placeholders})`,
            ).bind(guildId, ...deletedCustomIds),
        );
    }

    if (customReminders && Array.isArray(customReminders)) {
        for (const cr of customReminders) {
            if (cr.reminder_id) {
                statements.push(
                    c.env.BOT_DB.prepare(
                        `
                        UPDATE custom_reminders SET
                            channel_id = ?,
                            title = ?,
                            message = ?,
                            role_id = ?,
                            repeat_interval_seconds = ?,
                            first_instance_ts = ?
                        WHERE guild_id = ? AND reminder_id = ?
                    `,
                    ).bind(
                        cr.channel_id,
                        cr.title,
                        cr.message || '',
                        cr.role_id || null,
                        cr.repeat_interval_seconds,
                        cr.first_instance_ts,
                        guildId,
                        cr.reminder_id,
                    ),
                );
            } else {
                statements.push(
                    c.env.BOT_DB.prepare(
                        `
                        INSERT INTO custom_reminders (
                            guild_id, created_by_user_id, channel_id, title, message, role_id,
                            repeat_interval_seconds, first_instance_ts, reminder_intervals_seconds, is_active, create_discord_event
                        ) VALUES (?, 0, ?, ?, ?, ?, ?, ?, '300', 1, 0)
                    `,
                    ).bind(
                        guildId,
                        cr.channel_id,
                        cr.title,
                        cr.message || '',
                        cr.role_id || null,
                        cr.repeat_interval_seconds,
                        cr.first_instance_ts,
                    ),
                );
            }
        }
    }

    // Check if any reminders need initial setup (role + role menu creation by the bot)
    const setupTypes = reminders
        .filter((r: Record<string, unknown>) => r.is_new_setup && r.is_active)
        .map((r: Record<string, unknown>) => r.reminder_type);

    if (setupTypes.length > 0) {
        const setupPayload = JSON.stringify({ guild_id: guildId, setup_types: setupTypes });
        statements.push(
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('REMINDER_SETUP', ?, ?)",
            ).bind(setupPayload, now),
        );
    }

    const payload = JSON.stringify({ guild_id: guildId, action: 'refresh_reminders' });
    statements.push(
        c.env.BOT_DB.prepare(
            "INSERT INTO system_events (type, payload, created_at) VALUES ('REMINDER_UPDATE', ?, ?)",
        ).bind(payload, now),
    );

    await c.env.BOT_DB.batch(statements);

    return c.json({ success: true });
});

guilds.get('/:guildId/roles', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    // Check KV cache first (5-min TTL)
    const cacheKey = `discord:roles:${guildId}`;
    try {
        const cached = await c.env.API_CACHE.get(cacheKey);
        if (cached) return c.json(JSON.parse(cached));
    } catch (_) {
        /* cache miss */
    }

    const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bot ${c.env.DISCORD_BOT_TOKEN}` },
    });
    if (!response.ok) return c.json({ roles: [] });
    const roles = (await response.json()) as DiscordRole[];
    const result = { roles: roles.map((r) => ({ id: r.id, name: r.name, color: r.color })) };

    // Cache for 5 minutes (non-blocking)
    const putPromise = c.env.API_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    if (c.executionCtx && 'waitUntil' in c.executionCtx) {
        c.executionCtx.waitUntil(putPromise);
    }

    return c.json(result);
});

guilds.get('/:guildId/ark/all', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);
    try {
        const [{ results: setups }, { results: teams }, { results: signups }] = await Promise.all([
            c.env.BOT_DB.prepare('SELECT * FROM ark_of_osiris_setups WHERE guild_id = ?').bind(guildId).all(),
            c.env.BOT_DB.prepare('SELECT * FROM ark_of_osiris_teams WHERE guild_id = ? ORDER BY team_number ASC')
                .bind(guildId)
                .all(),
            c.env.BOT_DB.prepare('SELECT * FROM ark_of_osiris_signups WHERE guild_id = ? ORDER BY signup_timestamp ASC')
                .bind(guildId)
                .all(),
        ]);

        interface AllianceData {
            config: {
                channel_id: string | null;
                admin_role_id: string | null;
                notification_role_id: string | null;
                reminder_interval: unknown;
                is_active: unknown;
            };
            teams: Record<number, { name: unknown; match_timestamp: unknown; cap: unknown; role_id: string | null }>;
            signups: Record<string, unknown>[];
        }
        const alliances: Record<string, AllianceData> = {};

        if (setups) {
            setups.forEach((s) => {
                const row = s as unknown as ArkSetupRow;
                alliances[row.alliance_tag] = {
                    config: {
                        channel_id: row.channel_id ? String(row.channel_id) : null,
                        admin_role_id: row.admin_role_id ? String(row.admin_role_id) : null,
                        notification_role_id: row.tag_role_id ? String(row.tag_role_id) : null,
                        reminder_interval: row.reminder_interval_seconds,
                        is_active: row.is_active,
                    },
                    teams: {},
                    signups: [],
                };
            });
        }

        if (teams) {
            teams.forEach((t) => {
                const row = t as unknown as ArkTeamRow;
                if (alliances[row.alliance_tag]) {
                    alliances[row.alliance_tag].teams[row.team_number] = {
                        name: row.team_name,
                        match_timestamp: row.next_match_timestamp,
                        cap: row.signup_cap,
                        role_id: row.role_id ? String(row.role_id) : null,
                    };
                }
            });
        }

        if (signups) {
            signups.forEach((su) => {
                const row = su as unknown as ArkSignupRow;
                if (alliances[row.alliance_tag]) {
                    alliances[row.alliance_tag].signups.push(su as unknown as Record<string, unknown>);
                }
            });
        }

        return c.json({ alliances });
    } catch (e) {
        console.error('Failed to fetch Ark data:', e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/ark/alliance', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ArkAllianceSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, channel_id, admin_role_id, notification_role_id, reminder_interval } = validation.data;

    try {
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                `
                INSERT INTO ark_of_osiris_setups (guild_id, alliance_tag, channel_id, admin_role_id, tag_role_id, reminder_interval_seconds, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(guild_id, alliance_tag) DO UPDATE SET
                    channel_id = excluded.channel_id,
                    admin_role_id = excluded.admin_role_id,
                    tag_role_id = excluded.tag_role_id,
                    reminder_interval_seconds = excluded.reminder_interval_seconds,
                    is_active = 1
            `,
            ).bind(
                guildId,
                alliance_tag,
                channel_id || null,
                admin_role_id || null,
                notification_role_id || null,
                reminder_interval || 3600,
            ),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)",
            ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000),
        ]);

        return c.json({ success: true });
    } catch (e) {
        return errors.internal(c, e);
    }
});

guilds.delete('/:guildId/ark/alliance/:tag', async (c) => {
    const { guildId, tag } = c.req.param();
    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare('DELETE FROM ark_of_osiris_setups WHERE guild_id = ? AND alliance_tag = ?').bind(
            guildId,
            tag,
        ),
        c.env.BOT_DB.prepare('DELETE FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ?').bind(
            guildId,
            tag,
        ),
        c.env.BOT_DB.prepare('DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ?').bind(
            guildId,
            tag,
        ),
        c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(
            JSON.stringify({ guild_id: guildId }),
            Date.now() / 1000,
        ),
    ]);

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/team', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ArkTeamSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, team_number, team_name, match_timestamp, signup_cap } = validation.data;

    const teamNum = parseInt(team_number);
    const cap = signup_cap ? parseInt(signup_cap) : null;

    try {
        const existing = await c.env.BOT_DB.prepare(
            'SELECT 1 FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?',
        )
            .bind(guildId, alliance_tag, teamNum)
            .first();

        const teamStmt = existing
            ? c.env.BOT_DB.prepare(
                  `
                UPDATE ark_of_osiris_teams
                SET team_name = ?, next_match_timestamp = ?, signup_cap = ?
                WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?
            `,
              ).bind(team_name, match_timestamp, cap, guildId, alliance_tag, teamNum)
            : c.env.BOT_DB.prepare(
                  `
                INSERT INTO ark_of_osiris_teams (guild_id, alliance_tag, team_number, team_name, next_match_timestamp, signup_cap, role_id)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `,
              ).bind(guildId, alliance_tag, teamNum, team_name, match_timestamp, cap);

        await c.env.BOT_DB.batch([
            teamStmt,
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)",
            ).bind(JSON.stringify({ guild_id: guildId }), Date.now() / 1000),
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error('Failed to update ark team:', e);
        return errors.internal(c, e);
    }
});

guilds.delete('/:guildId/ark/signup', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const body = await c.req.json();
    const validation = validateBody(ArkSignupDeleteSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    const { alliance_tag, in_game_name } = validation.data;

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            'DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?',
        ).bind(guildId, alliance_tag, in_game_name),
        c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(
            JSON.stringify({ guild_id: guildId }),
            Date.now() / 1000,
        ),
    ]);

    return c.json({ success: true });
});

guilds.delete('/:guildId/ark/team/:alliance_tag/:team_number', async (c) => {
    const { guildId, alliance_tag, team_number } = c.req.param();

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            'DELETE FROM ark_of_osiris_teams WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?',
        ).bind(guildId, alliance_tag, team_number),
        c.env.BOT_DB.prepare(
            'DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND team_number = ?',
        ).bind(guildId, alliance_tag, team_number),
        c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(
            JSON.stringify({ guild_id: guildId }),
            Date.now() / 1000,
        ),
    ]);

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/signup', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ArkSignupSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag, team_number, in_game_name } = validation.data;

    const placeholderUserId = `web_${Date.now()}`;
    const nowTs = Date.now() / 1000;

    // Delete any existing signup for this player name in this alliance (prevents duplicates
    // across teams AND handles the case where the bot signed them up concurrently).
    // Then insert the new signup + system event atomically via batch.
    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            'DELETE FROM ark_of_osiris_signups WHERE guild_id = ? AND alliance_tag = ? AND in_game_name = ?',
        ).bind(guildId, alliance_tag, in_game_name),
        c.env.BOT_DB.prepare(
            'INSERT INTO ark_of_osiris_signups (guild_id, alliance_tag, team_number, user_id, in_game_name, signup_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(guildId, alliance_tag, team_number, placeholderUserId, in_game_name, nowTs),
        c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)").bind(
            JSON.stringify({ guild_id: guildId }),
            nowTs,
        ),
    ]);

    return c.json({ success: true });
});

guilds.get('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);
    try {
        // Cast coordinator_role_id to TEXT in SQL to avoid JavaScript integer precision loss on Discord snowflake IDs
        const setup = (await c.env.BOT_DB.prepare(
            'SELECT *, CAST(coordinator_role_id AS TEXT) as coordinator_role_id FROM mge_settings WHERE guild_id = ?',
        )
            .bind(guildId)
            .first()) as Record<string, unknown> | null;

        if (setup) {
            // Cast remaining Discord IDs to strings to match Discord API format
            const idFields = ['signup_channel_id', 'posted_signups_channel_id', 'ping_role_id', 'signup_message_id'];
            for (const field of idFields) {
                if (setup[field]) setup[field] = String(setup[field]);
            }
        }

        return c.json({ config: setup || {} });
    } catch (e) {
        console.error('Failed to load MGE settings:', e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/mge', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(MgeSettingsSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const { signup_channel_id, posted_signups_channel_id, ping_role_id, coordinator_role_id } = validation.data;

    const mgePayload = JSON.stringify({ guild_id: guildId });
    await c.env.BOT_DB.batch([
        c.env.BOT_DB.prepare(
            `
            UPDATE mge_settings SET
                signup_channel_id = ?,
                posted_signups_channel_id = ?,
                ping_role_id = ?,
                coordinator_role_id = ?
            WHERE guild_id = ?
        `,
        ).bind(
            signup_channel_id || null,
            posted_signups_channel_id || null,
            ping_role_id || null,
            coordinator_role_id || null,
            guildId,
        ),
        c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_UPDATE', ?, ?)").bind(
            mgePayload,
            Date.now() / 1000,
        ),
    ]);

    return c.json({ success: true });
});

// --- MGE Applications ---

guilds.get('/:guildId/mge/applications', async (c) => {
    const { guildId } = c.req.param();
    if (!(await verifyGuildReadAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);
    try {
        const settings = (await c.env.BOT_DB.prepare(
            'SELECT current_mge_name, placement_points FROM mge_settings WHERE guild_id = ?',
        )
            .bind(guildId)
            .first()) as MgeSettingsRow | null;

        if (!settings || !settings.current_mge_name) {
            return c.json({ mge_name: null, placement_points: '', applications: [], questions: [], rankings: [] });
        }

        const mgeName = settings.current_mge_name;

        const [appsResult, questionsResult, rankingsResult] = await Promise.all([
            c.env.BOT_DB.prepare(
                'SELECT * FROM mge_applications WHERE guild_id = ? AND mge_name = ? ORDER BY submitted_at DESC',
            )
                .bind(guildId, mgeName)
                .all(),
            c.env.BOT_DB.prepare(
                'SELECT question_key, question_text, input_type, display_order, is_enabled FROM mge_questions WHERE guild_id = ? ORDER BY display_order ASC',
            )
                .bind(guildId)
                .all(),
            c.env.BOT_DB.prepare(
                'SELECT rank_spot, application_id, ingame_name, is_published, custom_score FROM mge_rankings WHERE guild_id = ? AND mge_name = ? ORDER BY rank_spot ASC',
            )
                .bind(guildId, mgeName)
                .all(),
        ]);

        return c.json({
            mge_name: mgeName,
            placement_points: settings.placement_points || '',
            applications: appsResult.results || [],
            questions: questionsResult.results || [],
            rankings: rankingsResult.results || [],
        });
    } catch (e) {
        console.error('Failed to fetch MGE applications:', e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/mge/applications/:appId/accept', async (c) => {
    const { guildId, appId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(MgeAcceptSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { rank_spot } = validation.data;

    try {
        const settings = (await c.env.BOT_DB.prepare('SELECT current_mge_name FROM mge_settings WHERE guild_id = ?')
            .bind(guildId)
            .first()) as MgeSettingsRow | null;
        if (!settings?.current_mge_name) return errors.badRequest(c, 'No active MGE');

        const app = (await c.env.BOT_DB.prepare(
            'SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?',
        )
            .bind(appId, guildId)
            .first()) as MgeApplicationRow | null;
        if (!app) return errors.notFound(c, 'Application');

        const taken = (await c.env.BOT_DB.prepare(
            'SELECT ingame_name FROM mge_rankings WHERE guild_id = ? AND mge_name = ? AND rank_spot = ?',
        )
            .bind(guildId, settings.current_mge_name, rank_spot)
            .first()) as { ingame_name: string } | null;
        if (taken) return errors.conflict(c, `Rank ${rank_spot} is already taken by ${taken.ingame_name}`);

        const acceptPayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId), rank_spot });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'ACCEPTED', rank_spot = ? WHERE application_id = ?",
            ).bind(rank_spot, appId),
            c.env.BOT_DB.prepare(
                'INSERT INTO mge_rankings (guild_id, rank_spot, application_id, mge_name, ingame_name, is_published) VALUES (?, ?, ?, ?, ?, 0)',
            ).bind(guildId, rank_spot, appId, settings.current_mge_name, app.ingame_name),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_ACCEPT', ?, ?)",
            ).bind(acceptPayload, Date.now() / 1000),
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error('MGE accept error:', e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/mge/applications/:appId/reject', async (c) => {
    const { guildId, appId } = c.req.param();
    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const app = await c.env.BOT_DB.prepare(
            'SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?',
        )
            .bind(appId, guildId)
            .first();
        if (!app) return errors.notFound(c, 'Application');

        const rejectPayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId) });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'REJECTED', rank_spot = NULL WHERE application_id = ?",
            ).bind(appId),
            c.env.BOT_DB.prepare('DELETE FROM mge_rankings WHERE application_id = ?').bind(appId),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_REJECT', ?, ?)",
            ).bind(rejectPayload, Date.now() / 1000),
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error('MGE reject error:', e);
        return errors.internal(c, e);
    }
});

guilds.post('/:guildId/mge/applications/:appId/restore', async (c) => {
    const { guildId, appId } = c.req.param();
    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const app = await c.env.BOT_DB.prepare(
            'SELECT * FROM mge_applications WHERE application_id = ? AND guild_id = ?',
        )
            .bind(appId, guildId)
            .first();
        if (!app) return errors.notFound(c, 'Application');

        const restorePayload = JSON.stringify({ guild_id: guildId, application_id: parseInt(appId) });
        await c.env.BOT_DB.batch([
            c.env.BOT_DB.prepare(
                "UPDATE mge_applications SET application_status = 'PENDING', rank_spot = NULL WHERE application_id = ?",
            ).bind(appId),
            c.env.BOT_DB.prepare('DELETE FROM mge_rankings WHERE application_id = ?').bind(appId),
            c.env.BOT_DB.prepare(
                "INSERT INTO system_events (type, payload, created_at) VALUES ('MGE_APP_RESTORE', ?, ?)",
            ).bind(restorePayload, Date.now() / 1000),
        ]);

        return c.json({ success: true });
    } catch (e) {
        console.error('MGE restore error:', e);
        return errors.internal(c, e);
    }
});

// --- Ark Embed Controls ---

guilds.post('/:guildId/ark/refresh-embed', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ArkTagSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag } = validation.data;

    const payload = JSON.stringify({ guild_id: guildId, alliance_tag });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_UPDATE', ?, ?)")
        .bind(payload, Date.now() / 1000)
        .run();

    return c.json({ success: true });
});

guilds.post('/:guildId/ark/post-signup', async (c) => {
    const { guildId } = c.req.param();
    const body = await c.req.json();
    const validation = validateBody(ArkTagSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    if (!(await verifyGuildPatreonAccess(c, guildId))) return c.json({ error: 'Unauthorized' }, 403);

    const { alliance_tag } = validation.data;

    const payload = JSON.stringify({ guild_id: guildId, alliance_tag });
    await c.env.BOT_DB.prepare("INSERT INTO system_events (type, payload, created_at) VALUES ('ARK_POST_SIGNUP', ?, ?)")
        .bind(payload, Date.now() / 1000)
        .run();

    return c.json({ success: true });
});

guilds.delete('/:guildId/authorization', async (c) => {
    const { guildId } = c.req.param();

    if (!(await verifyGuildPatreonAccess(c, guildId))) {
        return c.json(
            {
                error: 'Unauthorized: Only the Patreon subscriber who authorized this server can deauthorize it.',
            },
            403,
        );
    }

    try {
        await c.env.BOT_DB.prepare('DELETE FROM guild_authorizations WHERE guild_id = ?').bind(guildId).run();

        return c.json({ success: true });
    } catch (e) {
        console.error('Failed to deauthorize guild:', e);
        return errors.internal(c, e);
    }
});

export default guilds;
