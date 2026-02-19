import { Hono } from 'hono';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { TemplateCreateSchema, validateBody } from '../_validation';
import { errors } from '../_errors';

const templates = new Hono<{ Bindings: Bindings; Variables: Variables }>();

templates.use('*', authMiddleware);

templates.get('/', async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        `SELECT template_id, template_name, content, char_count, date_saved, last_loaded
         FROM user_templates WHERE user_id = ? ORDER BY date_saved DESC`,
    )
        .bind(user.id)
        .all();
    return c.json(results || []);
});

templates.post('/', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = validateBody(TemplateCreateSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    const { template_name, content, char_count } = validation.data;
    await c.env.DB.prepare(
        `INSERT INTO user_templates (user_id, template_name, content, char_count, date_saved)
         VALUES (?, ?, ?, ?, ?)`,
    )
        .bind(user.id, template_name, content, char_count, Date.now() / 1000)
        .run();
    return c.json({ status: 'success' }, 201);
});

templates.delete('/:id', async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(`DELETE FROM user_templates WHERE template_id = ? AND user_id = ?`)
        .bind(id, user.id)
        .run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Not Found' }, 404);
});

templates.put('/:id/load', async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    await c.env.DB.prepare(`UPDATE user_templates SET last_loaded = ? WHERE template_id = ? AND user_id = ?`)
        .bind(Date.now() / 1000, id, user.id)
        .run();
    return c.json({ status: 'success' });
});

export default templates;
