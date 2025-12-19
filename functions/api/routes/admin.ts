import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { Bindings, Variables, OnlineUser } from '../_types';
import { authMiddleware, masterAdminMiddleware } from '../_middleware';
import { EVENT_INTERVALS, TROOP_CYCLE, EVENT_COLOR_MAP, MASTER_ADMIN_IDS } from '../_constants';
import { GoogleCalendarService, addDays } from '../services/googleCalendar';

const admin = new Hono<{ Bindings: Bindings, Variables: Variables }>();

admin.post('/internal/update-cache', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return c.json({ error: 'Unauthorized' }, 401);

    const { top_servers, bot_stats, active_patrons } = await c.req.json();
    
    const promises = [];
    if (top_servers) promises.push(c.env.API_CACHE.put('top_servers', JSON.stringify(top_servers)));
    if (bot_stats) promises.push(c.env.API_CACHE.put('bot_stats', JSON.stringify(bot_stats)));
    if (active_patrons) promises.push(c.env.API_CACHE.put('active_patrons', JSON.stringify(active_patrons)));

    await Promise.all(promises);
    return c.json({ success: true });
});

admin.post('/internal/extend-events', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) return c.json({ error: 'Unauthorized' }, 401);

    try {
        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        
        const today = new Date();
        const targetYear = today.getUTCFullYear() + 1;
        const targetDate = new Date(Date.UTC(targetYear, 11, 31));

        const { results } = await c.env.DB.prepare(`
            SELECT series_id, title, type, troop_type, duration, created_by, MAX(start_date) as last_start_date 
            FROM events 
            GROUP BY series_id
        `).all();

        if (!results || results.length === 0) return c.json({ message: 'No active event series found.' });

        let totalCreated = 0;
        const dbBatch = [];
        const gcalPromises = [];

        for (const series of results) {
            const interval = EVENT_INTERVALS[series.type as string];
            if (!interval || interval <= 0 || !series.last_start_date) continue;

            let currentDate = new Date(series.last_start_date as string);
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
                const colorId = EVENT_COLOR_MAP[series.type as string] || "8";
                
                dbBatch.push(c.env.DB.prepare(
                    `INSERT INTO events (id, series_id, title, type, troop_type, start_date, duration, created_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(newEventId, series.series_id, series.title, series.type, nextTroop || null, newStartDate, series.duration, series.created_by));

                gcalPromises.push(gcal.createEvent({
                    title: series.title as string,
                    type: series.type,
                    troop_type: nextTroop || null,
                    start_date: newStartDate,
                    duration: series.duration,
                    colorId: colorId
                }, newEventId));

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
        return c.json({ status: 'success', message: `Checked ${results.length} series. Generated ${totalCreated} new future events.` });

    } catch (e) {
        console.error("Auto-extend error:", e);
        return c.json({ error: 'Failed to extend events', details: String(e) }, 500);
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
    return c.json({ version: version || "0" });
});

admin.get('/data/:key', async (c) => {
    const key = c.req.param('key');
    const secret = c.req.header('X-Internal-Secret');
    
    const isBot = secret === c.env.BOT_SECRET_KEY;
    if (!isBot) {
        const sessionToken = getCookie(c, 'session_token');
        if (!sessionToken) return c.json({ error: 'Unauthorized' }, 401);
        
        const session = await c.env.DB.prepare('SELECT user_id FROM user_sessions WHERE session_token = ?').bind(sessionToken).first();
        if (!session || !MASTER_ADMIN_IDS.includes(session.user_id as string)) {
             return c.json({ error: 'Unauthorized' }, 401);
        }
    }

    const data = await c.env.BOT_DATA.get(key, 'json');
    return c.json(data || {}); 
});


admin.use('/admin/*', authMiddleware, masterAdminMiddleware);

admin.post('/admin/heartbeat', async (c) => {
    const user = c.get('user');
    const { username, avatar } = await c.req.json().catch(() => ({ username: user.username, avatar: null }));
    const NOW = Date.now();
    const TIMEOUT_MS = 60 * 1000;

    let onlineMap: Record<string, OnlineUser> = await c.env.API_CACHE.get('panel_online_users', 'json') || {};

    onlineMap[user.id] = {
        id: user.id,
        username: username || user.username || 'Admin',
        avatar: avatar || null,
        last_seen: NOW
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
        users: activeUsers.sort((a, b) => b.last_seen - a.last_seen) 
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

    let username = "Unknown Admin";
    let adminId = c.get('user').id;
    let adminAvatar = null;

    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${c.get('user').accessToken}` }
        });
        const uData = await userRes.json() as any;
        username = uData.username || uData.global_name || c.get('user').id;
        adminId = uData.id;
        adminAvatar = uData.avatar;
    } catch(e) {}

    await c.env.BOT_DATA.put(key, JSON.stringify(bodyData));
    await c.env.BOT_DATA.put('data_version', Date.now().toString());

    const logEntry = {
        timestamp: Date.now(),
        user: username,
        userId: adminId,
        userAvatar: adminAvatar,
        action: `Updated ${key}`,
        details: details
    };

    let logs: any[] = await c.env.BOT_DATA.get('system_changelog', 'json') || [];
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
                await Promise.all(gcalEvents.map(e => gcal.deleteEvent(e.id)));
                return c.json({ status: 'partial', phase: 'cleanup', offset: 0, message: `Deleted batch of ${gcalEvents.length} events.` });
            } else {
                return c.json({ status: 'partial', phase: 'create', offset: 0, message: 'Cleanup complete. Switching to creation.' });
            }
        } 
        
        if (phase === 'create') {
            const { results } = await c.env.DB.prepare(
                `SELECT * FROM events WHERE start_date >= '2024-01-01' LIMIT ? OFFSET ?`
            ).bind(BATCH_SIZE, offset).all();

            const eventsToCreate = results || [];

            if (eventsToCreate.length > 0) {
                const createPromises = eventsToCreate.map(ev => {
                    const colorId = EVENT_COLOR_MAP[ev.type as string] || "8";
                    return gcal.createEvent({
                        title: ev.title,
                        type: ev.type,
                        troop_type: ev.troop_type,
                        start_date: ev.start_date,
                        duration: ev.duration,
                        colorId: colorId
                    }, ev.id as string);
                });
                await Promise.all(createPromises);
                return c.json({ status: 'partial', phase: 'create', offset: offset + eventsToCreate.length, message: `Created batch of ${eventsToCreate.length} events.` });
            } else {
                return c.json({ status: 'complete', message: 'Full reset and sync completed successfully.' });
            }
        }
        return c.json({ error: 'Invalid phase' }, 400);
    } catch(e) {
        console.error("GCal Sync Error", e);
        return c.json({ error: 'Sync failed', details: String(e) }, 500);
    }
});

export default admin;