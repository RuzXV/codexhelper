import { Hono } from 'hono';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { parseAdminIds, EVENT_COLOR_MAP, TROOP_CYCLE } from '../_constants';
import { GoogleCalendarService, addDays } from '../services/googleCalendar';
import { CreateEventSchema, ShiftEventsSchema, UpdateEventSchema, validateBody } from '../_validation';

const events = new Hono<{ Bindings: Bindings, Variables: Variables }>();

events.get('/', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM events ORDER BY start_date ASC'
        ).all();

        c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        c.header('Pragma', 'no-cache');
        c.header('Expires', '0');

        return c.json(results || []);
    } catch (e) {
        console.error("Failed to fetch events:", e);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
});

events.post('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const calendarAdminIds = parseAdminIds(c.env.CALENDAR_ADMIN_IDS);

    if (!calendarAdminIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        const body = await c.req.json();
        const validation = validateBody(CreateEventSchema, body);

        if (!validation.success) {
            return c.json({ error: validation.error }, 400);
        }

        const { title, type, troop_type, start, duration, repeat_count, repeat_interval } = validation.data;

        const seriesId = crypto.randomUUID();
        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        
        const stmt = c.env.DB.prepare(
            `INSERT INTO events (series_id, title, type, troop_type, start_date, duration, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        const batch = [];
        const count = repeat_count || 1;
        const interval = repeat_interval || 0;

        let currentTroopIndex = troop_type ? TROOP_CYCLE.indexOf(troop_type) : -1;
        
        const colorId = EVENT_COLOR_MAP[type] || "8";
        const gcalPromises = [];

        for (let i = 0; i < count; i++) {
            const currentStart = addDays(start, i * interval);
            let thisTroop = null;
            if (currentTroopIndex !== -1) {
                thisTroop = TROOP_CYCLE[(currentTroopIndex + i) % TROOP_CYCLE.length];
            }

            const eventId = crypto.randomUUID();
            const eventData = {
                id: eventId,
                series_id: seriesId,
                title, 
                type, 
                troop_type: thisTroop || troop_type || null, 
                start_date: currentStart, 
                duration,
                created_by: user.id,
                colorId: colorId
            };

            batch.push(stmt.bind(
                eventData.series_id,
                eventData.title,
                eventData.type,
                eventData.troop_type,
                eventData.start_date,
                eventData.duration,
                eventData.created_by
            ));

            gcalPromises.push(gcal.createEvent(eventData, eventId));
        }

        await c.env.DB.batch(batch);
        c.executionCtx.waitUntil(Promise.all(gcalPromises));

        return c.json({ status: 'success', message: `Created ${count} events` }, 201);
    } catch (e) {
        console.error("Failed to create event:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

events.post('/shift', authMiddleware, async (c) => {
    const user = c.get('user');
    const calendarAdminIds = parseAdminIds(c.env.CALENDAR_ADMIN_IDS);
    if (!calendarAdminIds.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const body = await c.req.json();
        const validation = validateBody(ShiftEventsSchema, body);

        if (!validation.success) {
            return c.json({ error: validation.error }, 400);
        }

        const { series_id, shift_days } = validation.data;

        const { results } = await c.env.DB.prepare(
            'SELECT id, start_date, duration FROM events WHERE series_id = ?'
        ).bind(series_id).all();

        if (!results || results.length === 0) return c.json({ error: 'No events found' }, 404);

        const modifier = `${shift_days > 0 ? '+' : ''}${shift_days} days`;
        await c.env.DB.prepare(
            `UPDATE events SET start_date = date(start_date, ?) WHERE series_id = ?`
        ).bind(modifier, series_id).run();

        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        const gcalPromises = results.map(ev => {
            const newStartDate = addDays(ev.start_date as string, shift_days);
            return gcal.patchEventDate(ev.id as string, newStartDate, ev.duration as number);
        });

        c.executionCtx.waitUntil(Promise.all(gcalPromises));

        return c.json({ status: 'success', message: 'Events shifted' });
    } catch (e) {
        console.error("Failed to shift events:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

events.delete('/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const calendarAdminIds = parseAdminIds(c.env.CALENDAR_ADMIN_IDS);

    if (!calendarAdminIds.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const { success } = await c.env.DB.prepare(
            `DELETE FROM events WHERE id = ?`
        ).bind(id).run();

        if (success) {
            const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
            c.executionCtx.waitUntil(gcal.deleteEvent(id));
            return c.json({ status: 'success' });
        } else {
            return c.json({ error: 'Event not found' }, 404);
        }
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

events.patch('/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const calendarAdminIds = parseAdminIds(c.env.CALENDAR_ADMIN_IDS);
    if (!calendarAdminIds.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const body = await c.req.json();
        const validation = validateBody(UpdateEventSchema, body);

        if (!validation.success) {
            return c.json({ error: validation.error }, 400);
        }

        const { start_date, title, type, duration } = validation.data;

        const { success } = await c.env.DB.prepare(
            `UPDATE events SET start_date = ?, title = ?, type = ?, duration = ? WHERE id = ?`
        ).bind(start_date, title, type, duration, id).run();
        
        if (success) {
             const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
             c.executionCtx.waitUntil(gcal.patchEventDate(id, start_date, duration));
        }

        return success ? c.json({ status: 'success' }) : c.json({ error: 'Event not found' }, 404);
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default events;