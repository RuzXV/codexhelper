import { Hono } from 'hono';
import { Bindings } from '../_types';
import { botAuthMiddleware } from '../_middleware';

const bot = new Hono<{ Bindings: Bindings }>();

bot.use('*', botAuthMiddleware);

bot.get('/templates/list/:userId', async (c) => {
    const { userId } = c.req.param();
    const { results } = await c.env.DB.prepare(
      'SELECT template_name, date_saved, last_loaded FROM user_templates WHERE user_id = ? ORDER BY date_saved DESC'
    ).bind(userId).all();
    return c.json(results || []);
});

bot.get('/templates/autocomplete/:userId', async (c) => {
    const { userId } = c.req.param();
    const current = c.req.query('current') || '';
    const { results } = await c.env.DB.prepare(
        "SELECT template_id, template_name, date_saved FROM user_templates WHERE user_id = ? AND template_name LIKE ? ORDER BY date_saved DESC LIMIT 25"
    ).bind(userId, `%${current}%`).all();
    return c.json(results || []);
});

bot.get('/templates/load/:templateId/:userId', async (c) => {
    const { templateId, userId } = c.req.param();
    const result = await c.env.DB.prepare(
      'SELECT * FROM user_templates WHERE template_id = ? AND user_id = ?'
    ).bind(templateId, userId).first();
    return result ? c.json(result) : c.json({ error: 'Template not found' }, 404);
});

bot.delete('/templates/delete/:templateId/:userId', async (c) => {
    const { templateId, userId } = c.req.param();
    const { success } = await c.env.DB.prepare(
      'DELETE FROM user_templates WHERE template_id = ? AND user_id = ?'
    ).bind(templateId, userId).run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Deletion failed or template not found' }, 404);
});

bot.post('/templates/update-loaded/:templateId', async (c) => {
    const { templateId } = c.req.param();
    await c.env.DB.prepare(
      'UPDATE user_templates SET last_loaded = ? WHERE template_id = ?'
    ).bind(Date.now() / 1000, templateId).run();
    return c.json({ status: 'success' });
});

bot.get('/events/upcoming', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT * FROM events 
             WHERE start_date >= date('now', '-2 days') 
             ORDER BY start_date ASC`
        ).all();

        return c.json(results || []);
    } catch (e) {
        console.error("Failed to fetch upcoming events for bot:", e);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
});

bot.get('/settings/:userId', async (c) => {
    const { userId } = c.req.param();
    try {
        const result = await c.env.DB.prepare(
            'SELECT settings FROM user_settings WHERE user_id = ?'
        ).bind(userId).first();

        return c.json(result ? JSON.parse(result.settings as string) : {});
    } catch (e) {
        console.error("Failed to fetch user settings for bot:", e);
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

bot.post('/query', async (c) => {
    const { sql, params, method } = await c.req.json();
    try {
        const stmt = c.env.BOT_DB.prepare(sql).bind(...(params || [])); 
        if (method === 'execute') {
            const res = await stmt.run();
            return c.json({ rowcount: res.meta.changes, lastrowid: res.meta.last_row_id });
        } else if (method === 'one') {
            return c.json(await stmt.first());
        } else {
            const { results } = await stmt.all();
            return c.json(results || []);
        }
    } catch (e) {
        return c.json({ error: String(e) }, 500);
    }
});

bot.get('/sync/feed', async (c) => {
    const lastTimestamp = c.req.query('since') || 0;
    const { results } = await c.env.BOT_DB.prepare(
        "SELECT * FROM system_events WHERE created_at > ? ORDER BY created_at ASC LIMIT 50"
    ).bind(lastTimestamp).all();
    return c.json(results || []);
});

bot.post('/batch', async (c) => {
    try {
        const body = await c.req.json();
        const operations = body.batch;

        if (!operations || !Array.isArray(operations)) {
            return c.json({ error: 'Invalid batch format. Expected array in "batch" key.' }, 400);
        }

        const statements = operations.map((op: any) => 
            c.env.BOT_DB.prepare(op.sql).bind(...(op.params || []))
        );

        const results = await c.env.BOT_DB.batch(statements);

        return c.json(results);
    } catch (e) {
        console.error("Batch Execution Error:", e);
        return c.json({ error: String(e) }, 500);
    }
});

export default bot;