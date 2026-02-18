import { Hono, Context } from 'hono';
import { getCookie } from 'hono/cookie';
import {
    Bindings,
    Variables,
    OnlineUser,
    BackupEntry,
    ChangelogEntry,
    DiscordUser,
    KVListKey,
    CalendarEventInput,
} from '../_types';
import { errors } from '../_errors';
import { authMiddleware, masterAdminMiddleware } from '../_middleware';
import { EVENT_INTERVALS, TROOP_CYCLE, EVENT_COLOR_MAP, parseAdminIds } from '../_constants';
import { GoogleCalendarService } from '../services/googleCalendar';

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

type AdminContext = Context<{ Bindings: Bindings; Variables: Variables }>;

async function manageBackups(c: AdminContext, key: string, oldData: string | null) {
    if (!oldData) return;

    const BACKUP_KEY = `backup_history:${key}`;
    const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let history: BackupEntry[] = (await c.env.BOT_DATA.get(BACKUP_KEY, 'json')) || [];
    if (!Array.isArray(history)) history = [];

    let parsedData: unknown = oldData;
    try {
        parsedData = JSON.parse(oldData);
    } catch (_e) {}

    history.push({
        timestamp: now,
        date: new Date(now).toISOString(),
        data: parsedData,
    });

    const cleanHistory = history.filter((entry) => now - entry.timestamp < RETENTION_MS);

    await c.env.BOT_DATA.put(BACKUP_KEY, JSON.stringify(cleanHistory));
}

admin.post('/internal/update-cache', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return errors.unauthorized(c);

    const { top_servers, bot_stats, active_patrons, approved_reviews } = await c.req.json();

    const promises = [];
    if (top_servers) promises.push(c.env.API_CACHE.put('top_servers', JSON.stringify(top_servers)));
    if (bot_stats) promises.push(c.env.API_CACHE.put('bot_stats', JSON.stringify(bot_stats)));
    if (active_patrons) promises.push(c.env.API_CACHE.put('active_patrons', JSON.stringify(active_patrons)));
    if (approved_reviews) promises.push(c.env.API_CACHE.put('approved_reviews', JSON.stringify(approved_reviews)));

    await Promise.all(promises);
    return c.json({ success: true });
});

admin.post('/internal/submit-review', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return errors.unauthorized(c);

    const { discord_user_id, discord_username, discord_avatar, review_text } = await c.req.json();

    if (!discord_user_id || !discord_username || !review_text) {
        return errors.badRequest(c, 'Missing required fields: discord_user_id, discord_username, review_text');
    }

    const result = await c.env.BOT_DB.prepare(
        `INSERT INTO pending_reviews (discord_user_id, discord_username, discord_avatar, review_text, submitted_at, status) VALUES (?, ?, ?, ?, ?, ?)`,
    )
        .bind(discord_user_id, discord_username, discord_avatar || null, review_text, Math.floor(Date.now() / 1000), 'pending')
        .run();

    return c.json({ success: true, review_id: result.meta.last_row_id });
});

admin.post('/internal/approve-review', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return errors.unauthorized(c);

    const { review_id, action } = await c.req.json();

    if (!review_id || !action || !['approved', 'rejected'].includes(action)) {
        return errors.badRequest(c, 'Missing or invalid fields: review_id, action (approved|rejected)');
    }

    await c.env.BOT_DB.prepare(`UPDATE pending_reviews SET status = ?, reviewed_at = ? WHERE id = ?`)
        .bind(action, Math.floor(Date.now() / 1000), review_id)
        .run();

    if (action === 'approved') {
        const { results } = await c.env.BOT_DB.prepare(
            `SELECT discord_username, discord_avatar, review_text, submitted_at FROM pending_reviews WHERE status = 'approved' ORDER BY reviewed_at DESC`,
        ).all();

        const payload = (results || []).map((r: Record<string, unknown>) => ({
            username: r.discord_username,
            avatar_url: r.discord_avatar,
            review_text: r.review_text,
            submitted_at: r.submitted_at,
        }));

        await c.env.API_CACHE.put('approved_reviews', JSON.stringify(payload));
    }

    return c.json({ success: true });
});

admin.post('/internal/extend-events', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return errors.unauthorized(c);

    try {
        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);

        const today = new Date();
        const targetYear = today.getUTCFullYear() + 1;
        const targetDate = new Date(Date.UTC(targetYear, 11, 31));

        const { results } = await c.env.DB.prepare(
            `
            SELECT series_id, title, type, troop_type, duration, created_by, MAX(start_date) as last_start_date 
            FROM events 
            GROUP BY series_id
        `,
        ).all();

        if (!results || results.length === 0) return c.json({ message: 'No active event series found.' });

        let totalCreated = 0;
        const dbBatch = [];
        const gcalPromises = [];

        for (const series of results) {
            const interval = EVENT_INTERVALS[series.type as string];
            if (!interval || interval <= 0 || !series.last_start_date) continue;

            const currentDate = new Date(series.last_start_date as string);
            let currentTroopIndex = -1;
            if (series.troop_type && TROOP_CYCLE.includes(series.troop_type as string)) {
                currentTroopIndex = TROOP_CYCLE.indexOf(series.troop_type as string);
            }

            let loopSafety = 0;
            while (currentDate < targetDate && loopSafety < 50) {
                loopSafety++;
                currentDate.setUTCDate(currentDate.getUTCDate() + interval);
                if (currentDate > targetDate) break;

                const newStartDate = currentDate.toISOString().split('T')[0];
                let nextTroop = null;
                if (currentTroopIndex !== -1) {
                    currentTroopIndex = (currentTroopIndex + 1) % TROOP_CYCLE.length;
                    nextTroop = TROOP_CYCLE[currentTroopIndex];
                }

                const newEventId = crypto.randomUUID();
                const colorId = EVENT_COLOR_MAP[series.type as string] || '8';

                dbBatch.push(
                    c.env.DB.prepare(
                        `INSERT INTO events (id, series_id, title, type, troop_type, start_date, duration, created_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    ).bind(
                        newEventId,
                        series.series_id,
                        series.title,
                        series.type,
                        nextTroop || null,
                        newStartDate,
                        series.duration,
                        series.created_by,
                    ),
                );

                gcalPromises.push(
                    gcal.createEvent(
                        {
                            title: series.title as string,
                            type: series.type as string | null,
                            troop_type: nextTroop || null,
                            start_date: newStartDate,
                            duration: series.duration as number,
                            colorId: colorId,
                        } as CalendarEventInput,
                        newEventId,
                    ),
                );

                totalCreated++;
            }
        }

        if (dbBatch.length > 0) {
            const chunkSize = 50;
            for (let i = 0; i < dbBatch.length; i += chunkSize) {
                await c.env.DB.batch(dbBatch.slice(i, i + chunkSize));
            }
        }

        c.executionCtx.waitUntil(Promise.allSettled(gcalPromises));
        return c.json({
            status: 'success',
            message: `Checked ${results.length} series. Generated ${totalCreated} new future events.`,
        });
    } catch (e) {
        console.error('Auto-extend error:', e);
        return errors.internal(c, e);
    }
});

admin.get('/stats', async (c) => {
    const stats = await c.env.API_CACHE.get('bot_stats', 'json');
    return c.json(stats || {});
});

admin.get('/top-servers', async (c) => {
    const servers = await c.env.API_CACHE.get('top_servers', 'json');
    return c.json(servers || []);
});

admin.get('/data/version', async (c) => {
    const version = await c.env.BOT_DATA.get('data_version');
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return c.json({ version: version || '0' });
});

admin.get('/data/:key', async (c) => {
    const key = c.req.param('key');
    const secret = c.req.header('X-Internal-Secret');

    const isBot = secret === c.env.BOT_SECRET_KEY;
    if (!isBot) {
        const sessionToken = getCookie(c, 'session_token');
        if (!sessionToken) return errors.unauthorized(c);

        const session = await c.env.DB.prepare('SELECT user_id FROM user_sessions WHERE session_token = ?')
            .bind(sessionToken)
            .first();
        const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);
        if (!session || !masterAdminIds.includes(session.user_id as string)) {
            return errors.unauthorized(c);
        }
    }

    const data = await c.env.BOT_DATA.get(key, 'json');
    return c.json(data || {});
});

admin.get('/reviews', async (c) => {
    const reviews = await c.env.API_CACHE.get('approved_reviews', 'json');
    return c.json(reviews || []);
});

admin.use('/admin/*', authMiddleware, masterAdminMiddleware);

admin.post('/admin/heartbeat', async (c) => {
    const user = c.get('user');
    const { username, avatar } = await c.req.json().catch(() => ({ username: user.username, avatar: null }));
    const NOW = Date.now();
    const TIMEOUT_MS = 60 * 1000;

    const onlineMap: Record<string, OnlineUser> = (await c.env.API_CACHE.get('panel_online_users', 'json')) || {};

    onlineMap[user.id] = {
        id: user.id,
        username: username || user.username || 'Admin',
        avatar: avatar || null,
        last_seen: NOW,
    };

    const activeUsers: OnlineUser[] = [];
    const cleanMap: Record<string, OnlineUser> = {};

    for (const [id, data] of Object.entries(onlineMap)) {
        if (NOW - data.last_seen < TIMEOUT_MS) {
            cleanMap[id] = data;
            activeUsers.push(data);
        }
    }

    c.executionCtx.waitUntil(c.env.API_CACHE.put('panel_online_users', JSON.stringify(cleanMap)));

    return c.json({
        online_count: activeUsers.length,
        users: activeUsers.sort((a, b) => b.last_seen - a.last_seen),
    });
});

admin.post('/admin/data/:key', async (c) => {
    const key = c.req.param('key');
    const rawBody = await c.req.json();

    let bodyData = rawBody;
    let details = `Modified data for key: ${key}`;

    if (rawBody && typeof rawBody === 'object' && 'data' in rawBody && 'logDetails' in rawBody) {
        bodyData = rawBody.data;
        details = rawBody.logDetails;
    }

    let username = 'Unknown Admin';
    let adminId = c.get('user').id;
    let adminAvatar = null;

    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${c.get('user').accessToken}` },
        });
        const uData = (await userRes.json()) as DiscordUser;
        username = uData.username || uData.global_name || c.get('user').id;
        adminId = uData.id;
        adminAvatar = uData.avatar;
    } catch (_e) {}

    const currentData = await c.env.BOT_DATA.get(key);

    c.executionCtx.waitUntil(manageBackups(c, key, currentData));

    await Promise.all([
        c.env.BOT_DATA.put(key, JSON.stringify(bodyData)),
        c.env.BOT_DATA.put('data_version', Date.now().toString()),
    ]);

    const logEntry = {
        timestamp: Date.now(),
        user: username,
        userId: adminId,
        userAvatar: adminAvatar,
        action: `Updated ${key}`,
        details: details,
    };

    let logs: ChangelogEntry[] = (await c.env.BOT_DATA.get('system_changelog', 'json')) || [];
    logs.unshift(logEntry);
    if (logs.length > 200) logs = logs.slice(0, 200);
    await c.env.BOT_DATA.put('system_changelog', JSON.stringify(logs));

    return c.json({ status: 'success', message: `Updated ${key}` });
});

admin.get('/admin/logs', async (c) => {
    const logs = await c.env.BOT_DATA.get('system_changelog', 'json');
    return c.json(logs || []);
});

admin.post('/admin/gcal/reset', async (c) => {
    const { phase = 'cleanup', offset = 0 } = await c.req.json().catch(() => ({}));
    const BATCH_SIZE = 5;
    const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);

    try {
        if (phase === 'cleanup') {
            const gcalEvents = await gcal.listEvents(BATCH_SIZE);
            if (gcalEvents.length > 0) {
                await Promise.all(gcalEvents.map((e) => gcal.deleteEvent(e.id)));
                return c.json({
                    status: 'partial',
                    phase: 'cleanup',
                    offset: 0,
                    message: `Deleted batch of ${gcalEvents.length} events.`,
                });
            } else {
                return c.json({
                    status: 'partial',
                    phase: 'create',
                    offset: 0,
                    message: 'Cleanup complete. Switching to creation.',
                });
            }
        }

        if (phase === 'create') {
            const { results } = await c.env.DB.prepare(
                `SELECT * FROM events WHERE start_date >= '2024-01-01' LIMIT ? OFFSET ?`,
            )
                .bind(BATCH_SIZE, offset)
                .all();

            const eventsToCreate = results || [];

            if (eventsToCreate.length > 0) {
                const createPromises = eventsToCreate.map((ev) => {
                    const colorId = EVENT_COLOR_MAP[ev.type as string] || '8';
                    return gcal.createEvent(
                        {
                            title: ev.title as string,
                            type: ev.type as string | null,
                            troop_type: ev.troop_type as string | null,
                            start_date: ev.start_date as string,
                            duration: ev.duration as number,
                            colorId: colorId,
                        } as CalendarEventInput,
                        ev.id as string,
                    );
                });
                await Promise.all(createPromises);
                return c.json({
                    status: 'partial',
                    phase: 'create',
                    offset: offset + eventsToCreate.length,
                    message: `Created batch of ${eventsToCreate.length} events.`,
                });
            } else {
                return c.json({ status: 'complete', message: 'Full reset and sync completed successfully.' });
            }
        }
        return errors.badRequest(c, 'Invalid phase');
    } catch (e) {
        console.error('GCal Sync Error', e);
        return errors.internal(c, e);
    }
});

admin.get('/admin/backups/:key', async (c) => {
    const key = c.req.param('key');
    const list = await c.env.BOT_DATA.list({ prefix: `backup:${key}:` });

    const backups = list.keys
        .map((k: KVListKey) => {
            const parts = k.name.split(':');
            const ts = parseInt(parts[parts.length - 1]);
            return {
                key: k.name,
                timestamp: ts,
                date: new Date(ts).toLocaleString(),
            };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

    return c.json(backups);
});

admin.post('/admin/restore', async (c) => {
    const user = c.get('user');

    if (user.id !== c.env.MASTER_OVERRIDE_ID) {
        return errors.forbidden(c, 'Only the Master Admin can perform restores.');
    }

    const { targetKey, backupKey } = await c.req.json();

    const backupData = await c.env.BOT_DATA.get(backupKey);
    if (!backupData) return errors.notFound(c, 'Backup');

    const currentBrokenState = await c.env.BOT_DATA.get(targetKey);
    if (currentBrokenState) {
        await c.env.BOT_DATA.put(`backup:${targetKey}:autorescued_${Date.now()}`, currentBrokenState);
    }

    await c.env.BOT_DATA.put(targetKey, backupData);

    return c.json({ success: true, message: 'Restored successfully' });
});

export default admin;
