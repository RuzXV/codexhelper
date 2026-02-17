import { Hono } from 'hono';
import { Bindings, BatchOperation } from '../_types';
import { errors } from '../_errors';
import { botAuthMiddleware } from '../_middleware';
import { BotQuerySchema, BotBatchSchema, validateBody } from '../_validation';

const bot = new Hono<{ Bindings: Bindings }>();

bot.use('*', botAuthMiddleware);

// SQL whitelist for the /query endpoint — only these prefixes are allowed.
const ALLOWED_SQL_PREFIXES = ['SELECT ', 'INSERT ', 'UPDATE ', 'DELETE ', 'INSERT OR REPLACE ', 'INSERT OR IGNORE '];

// Table-level whitelist — only these tables can be accessed via the bot SQL API
const ALLOWED_TABLES = [
    'system_events',
    'guild_authorizations',
    'guild_bypass',
    'patron_users',
    'ark_of_osiris_setups',
    'ark_of_osiris_teams',
    'ark_of_osiris_signups',
    'mge_settings',
    'mge_applications',
    'mge_rankings',
    'mge_questions',
    'event_calendar_setups',
    'tracked_events',
    'reminder_setups',
    'custom_reminders',
    'allowed_channels',
    'command_usage',
    'egg_hammer_personalization',
    'guild_event_sequence',
];

function isSqlAllowed(sql: string): boolean {
    const trimmed = sql.trim().toUpperCase();
    if (!ALLOWED_SQL_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) return false;

    // Verify the SQL only references allowed tables
    // Extract table names from common SQL patterns (FROM, INTO, UPDATE, JOIN, etc.)
    const tablePattern = /(?:FROM|INTO|UPDATE|JOIN|TABLE)\s+(\w+)/gi;
    let match;
    const referencedTables: string[] = [];
    while ((match = tablePattern.exec(sql)) !== null) {
        referencedTables.push(match[1].toLowerCase());
    }

    // Also check DELETE FROM pattern
    const deletePattern = /DELETE\s+FROM\s+(\w+)/gi;
    while ((match = deletePattern.exec(sql)) !== null) {
        referencedTables.push(match[1].toLowerCase());
    }

    // If we found table references, verify they're all allowed
    if (referencedTables.length > 0) {
        const allowedLower = ALLOWED_TABLES.map((t) => t.toLowerCase());
        return referencedTables.every((t) => allowedLower.includes(t));
    }

    return true;
}

bot.get('/templates/list/:userId', async (c) => {
    const { userId } = c.req.param();
    const { results } = await c.env.DB.prepare(
        'SELECT template_name, date_saved, last_loaded FROM user_templates WHERE user_id = ? ORDER BY date_saved DESC',
    )
        .bind(userId)
        .all();
    return c.json(results || []);
});

bot.get('/templates/autocomplete/:userId', async (c) => {
    const { userId } = c.req.param();
    const current = c.req.query('current') || '';
    const { results } = await c.env.DB.prepare(
        'SELECT template_id, template_name, date_saved FROM user_templates WHERE user_id = ? AND template_name LIKE ? ORDER BY date_saved DESC LIMIT 25',
    )
        .bind(userId, `%${current}%`)
        .all();
    return c.json(results || []);
});

bot.get('/templates/load/:templateId/:userId', async (c) => {
    const { templateId, userId } = c.req.param();
    const result = await c.env.DB.prepare('SELECT * FROM user_templates WHERE template_id = ? AND user_id = ?')
        .bind(templateId, userId)
        .first();
    return result ? c.json(result) : c.json({ error: 'Template not found' }, 404);
});

bot.delete('/templates/delete/:templateId/:userId', async (c) => {
    const { templateId, userId } = c.req.param();
    const { success } = await c.env.DB.prepare('DELETE FROM user_templates WHERE template_id = ? AND user_id = ?')
        .bind(templateId, userId)
        .run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Deletion failed or template not found' }, 404);
});

bot.post('/templates/update-loaded/:templateId', async (c) => {
    const { templateId } = c.req.param();
    await c.env.DB.prepare('UPDATE user_templates SET last_loaded = ? WHERE template_id = ?')
        .bind(Date.now() / 1000, templateId)
        .run();
    return c.json({ status: 'success' });
});

bot.get('/events/upcoming', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT * FROM events 
             WHERE start_date >= date('now', '-2 days') 
             ORDER BY start_date ASC`,
        ).all();

        return c.json(results || []);
    } catch (e) {
        console.error('Failed to fetch upcoming events for bot:', e);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
});

bot.get('/settings/:userId', async (c) => {
    const { userId } = c.req.param();
    try {
        const result = await c.env.DB.prepare('SELECT settings FROM user_settings WHERE user_id = ?')
            .bind(userId)
            .first();

        return c.json(result ? JSON.parse(result.settings as string) : {});
    } catch (e) {
        console.error('Failed to fetch user settings for bot:', e);
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
});

bot.post('/query', async (c) => {
    const body = await c.req.json();
    const validation = validateBody(BotQuerySchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    const { sql, params, method } = validation.data;

    if (!isSqlAllowed(sql)) {
        console.error(`Blocked disallowed SQL: ${sql.substring(0, 100)}`);
        return errors.forbidden(c, 'SQL statement not allowed. Only SELECT/INSERT/UPDATE/DELETE are permitted.');
    }

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
        console.error(`SQL execution error: ${String(e)} | SQL: ${sql.substring(0, 200)}`);
        return errors.internal(c, e);
    }
});

bot.get('/sync/feed', async (c) => {
    const lastTimestamp = c.req.query('since') || 0;
    const { results } = await c.env.BOT_DB.prepare(
        'SELECT * FROM system_events WHERE created_at > ? ORDER BY created_at ASC LIMIT 50',
    )
        .bind(lastTimestamp)
        .all();
    return c.json(results || []);
});

bot.post('/batch', async (c) => {
    try {
        const body = await c.req.json();
        const validation = validateBody(BotBatchSchema, body);
        if (!validation.success) return errors.validation(c, validation.error);

        const operations = validation.data.batch;

        for (const op of operations) {
            if (!op.sql || typeof op.sql !== 'string' || !isSqlAllowed(op.sql)) {
                console.error(`Blocked disallowed batch SQL: ${String(op.sql).substring(0, 100)}`);
                return errors.forbidden(c, 'One or more SQL statements in the batch are not allowed.');
            }
        }

        const statements = (operations as BatchOperation[]).map((op) =>
            c.env.BOT_DB.prepare(op.sql).bind(...(op.params || [])),
        );

        const results = await c.env.BOT_DB.batch(statements);

        return c.json(results);
    } catch (e) {
        console.error('Batch Execution Error:', e);
        return errors.internal(c, e);
    }
});

export default bot;
