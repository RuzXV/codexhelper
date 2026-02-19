import { Hono } from 'hono';
import { Bindings, Variables } from '../_types';
import { authMiddleware } from '../_middleware';
import { ScoreCreateSchema, validateBody } from '../_validation';
import { errors } from '../_errors';

const scores = new Hono<{ Bindings: Bindings; Variables: Variables }>();

scores.use('*', authMiddleware);

scores.get('/', async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        `SELECT score_id, pairing, formation, inscriptions, stats, total_score, date_saved
         FROM user_scores WHERE user_id = ? ORDER BY total_score DESC`,
    )
        .bind(user.id)
        .all();

    const scoresList = (results || []).map((score) => ({
        ...score,
        inscriptions: JSON.parse((score.inscriptions as string) || '[]'),
        stats: JSON.parse((score.stats as string) || '{}'),
    }));
    return c.json(scoresList);
});

scores.post('/', async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = validateBody(ScoreCreateSchema, body);
    if (!validation.success) return errors.validation(c, validation.error);

    const { pairing, formation, inscriptions, stats, total_score } = validation.data;
    await c.env.DB.prepare(
        `INSERT INTO user_scores (user_id, pairing, formation, inscriptions, stats, total_score, date_saved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
        .bind(
            user.id,
            pairing,
            formation,
            JSON.stringify(inscriptions),
            JSON.stringify(stats),
            total_score,
            Date.now() / 1000,
        )
        .run();
    return c.json({ status: 'success' }, 201);
});

scores.delete('/:id', async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(`DELETE FROM user_scores WHERE score_id = ? AND user_id = ?`)
        .bind(id, user.id)
        .run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Not Found' }, 404);
});

export default scores;
