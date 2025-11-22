import { Hono, Context, Next } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { getCookie } from 'hono/cookie';
import { encryptFernetToken, decryptFernetToken } from '../crypto';

type Bindings = {
    DB: D1Database;
    API_CACHE: KVNamespace;
    WEBSITE_APP_ID: string;
    WEBSITE_APP_SECRET: string;
    DB_ENCRYPTION_KEY: string;
    BOT_SECRET_KEY: string;
};
type Variables = {
    user: {
        id: string;
        accessToken: string;
    };
};
const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

const CALENDAR_ADMIN_IDS = [
    '285201373266575361', 
    '1121488445836103820',
    '593329463245144084',
    '545152090910228492'
];

const TROOP_CYCLE = ["Infantry", "Archer", "Cavalry", "Leadership"];

app.use('/api/*', cors({
    origin: ['https://codexhelper.com', 'https://www.codexhelper.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

const authMiddleware = async (c: Context, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');
    if (!sessionToken) {
        return c.json({ error: 'Authentication required. No session token provided.' }, 401);
    }

    type Session = {
        user_id: string;
        discord_access_token: string;
        expiry_date: number;
    };

    const session = await c.env.DB.prepare(
        'SELECT user_id, discord_access_token, expiry_date FROM user_sessions WHERE session_token = ?'
    ).bind(sessionToken).first() as Session | null;

    if (session && Date.now() / 1000 < session.expiry_date) {
        try {
            const decryptedToken = await decryptFernetToken(c.env.DB_ENCRYPTION_KEY, session.discord_access_token);
            c.set('user', { id: session.user_id, accessToken: decryptedToken });
            await next();
        } catch (e) {
            console.error("Token decryption failed:", e);
            return c.json({ error: 'Invalid session token (decryption failed)' }, 401);
        }
    } else {
        return c.json({ error: 'Invalid or expired session' }, 401);
    }
};

const botAuthMiddleware = async (c: Context, next: Next) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) {
        return c.json({ error: 'Unauthorized: Invalid secret key' }, 401);
    }
    await next();
};

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/api/stats', async (c) => {
    const stats = await c.env.API_CACHE.get('bot_stats', 'json');
    return c.json(stats || {});
});

app.get('/api/top-servers', async (c) => {
    const servers = await c.env.API_CACHE.get('top_servers', 'json');
    return c.json(servers || []);
});

app.post('/api/auth/logout', (c) => {
    c.header('Set-Cookie', 'session_token=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');
    return c.json({ status: 'success', message: 'Logged out.' });
});

app.get('/api/users/@me', authMiddleware, async (c) => {
    const user = c.get('user');
    
    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    if (!userResponse.ok) {
        return c.json({ error: 'Failed to fetch fresh user data from Discord.' }, 500);
    }
    const userData = await userResponse.json() as { id: string; [key: string]: any };

    const activePatrons: string[] | null = await c.env.API_CACHE.get('active_patrons', 'json');
    const isActivePatron = activePatrons ? activePatrons.includes(user.id) : false;

    const isCalendarAdmin = CALENDAR_ADMIN_IDS.includes(user.id);

    const enrichedUserData = {
        ...userData,
        is_active_patron: isActivePatron,
        is_calendar_admin: isCalendarAdmin
    };

    return c.json(enrichedUserData);
});

app.get('/api/templates', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        `SELECT template_id, template_name, content, char_count, date_saved, last_loaded 
         FROM user_templates WHERE user_id = ? ORDER BY date_saved DESC`
    ).bind(user.id).all();
    return c.json(results || []);
});

app.post('/api/templates', authMiddleware, async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    await c.env.DB.prepare(
        `INSERT INTO user_templates (user_id, template_name, content, char_count, date_saved) 
         VALUES (?, ?, ?, ?, ?)`
    ).bind(user.id, body.template_name, body.content, body.char_count, Date.now() / 1000).run();
    return c.json({ status: 'success' }, 201);
});

app.delete('/api/templates/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM user_templates WHERE template_id = ? AND user_id = ?`
    ).bind(id, user.id).run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Not Found' }, 404);
});

app.put('/api/templates/:id/load', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    await c.env.DB.prepare(
        `UPDATE user_templates SET last_loaded = ? WHERE template_id = ? AND user_id = ?`
    ).bind(Date.now() / 1000, id, user.id).run();
    return c.json({ status: 'success' });
});

app.get('/api/bot/templates/list/:userId', botAuthMiddleware, async (c) => {
    const { userId } = c.req.param();
    const { results } = await c.env.DB.prepare(
      'SELECT template_name, date_saved, last_loaded FROM user_templates WHERE user_id = ? ORDER BY date_saved DESC'
    ).bind(userId).all();
    return c.json(results || []);
});

app.get('/api/bot/templates/autocomplete/:userId', botAuthMiddleware, async (c) => {
    const { userId } = c.req.param();
    const current = c.req.query('current') || '';
    const { results } = await c.env.DB.prepare(
        "SELECT template_id, template_name, date_saved FROM user_templates WHERE user_id = ? AND template_name LIKE ? ORDER BY date_saved DESC LIMIT 25"
    ).bind(userId, `%${current}%`).all();
    return c.json(results || []);
});

app.get('/api/bot/templates/load/:templateId/:userId', botAuthMiddleware, async (c) => {
    const { templateId, userId } = c.req.param();
    const result = await c.env.DB.prepare(
      'SELECT * FROM user_templates WHERE template_id = ? AND user_id = ?'
    ).bind(templateId, userId).first();
    return result ? c.json(result) : c.json({ error: 'Template not found' }, 404);
});

app.delete('/api/bot/templates/delete/:templateId/:userId', botAuthMiddleware, async (c) => {
    const { templateId, userId } = c.req.param();
    const { success } = await c.env.DB.prepare(
      'DELETE FROM user_templates WHERE template_id = ? AND user_id = ?'
    ).bind(templateId, userId).run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Deletion failed or template not found' }, 404);
});

app.post('/api/bot/templates/update-loaded/:templateId', botAuthMiddleware, async (c) => {
    const { templateId } = c.req.param();
    await c.env.DB.prepare(
      'UPDATE user_templates SET last_loaded = ? WHERE template_id = ?'
    ).bind(Date.now() / 1000, templateId).run();
    return c.json({ status: 'success' });
});

app.get('/api/scores', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        `SELECT score_id, pairing, formation, inscriptions, stats, total_score, date_saved 
         FROM user_scores WHERE user_id = ? ORDER BY total_score DESC`
    ).bind(user.id).all();

    const scores = (results || []).map(score => ({
        ...score,
        inscriptions: JSON.parse(score.inscriptions as string || '[]'),
        stats: JSON.parse(score.stats as string || '{}'),
    }));
    return c.json(scores);
});

app.post('/api/scores', authMiddleware, async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    await c.env.DB.prepare(
        `INSERT INTO user_scores (user_id, pairing, formation, inscriptions, stats, total_score, date_saved)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(user.id, body.pairing, body.formation, JSON.stringify(body.inscriptions), JSON.stringify(body.stats), body.total_score, Date.now() / 1000).run();
    return c.json({ status: 'success' }, 201);
});

app.delete('/api/scores/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare(
        `DELETE FROM user_scores WHERE score_id = ? AND user_id = ?`
    ).bind(id, user.id).run();
    return success ? c.json({ status: 'success' }) : c.json({ error: 'Not Found' }, 404);
});

app.post('/api/internal/update-cache', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const { top_servers, bot_stats, active_patrons } = await c.req.json();
    
    const promises = [];
    if (top_servers) {
        promises.push(c.env.API_CACHE.put('top_servers', JSON.stringify(top_servers)));
    }
    if (bot_stats) {
        promises.push(c.env.API_CACHE.put('bot_stats', JSON.stringify(bot_stats)));
    }
    if (active_patrons) {
        promises.push(c.env.API_CACHE.put('active_patrons', JSON.stringify(active_patrons)));
    }

    await Promise.all(promises);

    return c.json({ success: true });
});

app.get('/api/auth/callback', async (c) => {
    const code = c.req.query('code');
    if (!code) {
        console.error("Auth callback error: Authorization code is missing.");
        return c.text('Authorization code is missing.', 400);
    }

    const tokenData = new URLSearchParams({
        client_id: c.env.WEBSITE_APP_ID,
        client_secret: c.env.WEBSITE_APP_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://codexhelper.com/api/auth/callback',
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenData,
    });

    if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error("Failed to get token from Discord. Status:", tokenResponse.status);
        console.error("Discord Response Body:", errorBody);
        return c.text('Failed to authenticate with Discord.', 500);
    }

    type TokenResponse = { access_token: string; };
    const tokenJson = await tokenResponse.json() as TokenResponse;
    const accessToken = tokenJson.access_token;

    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
        const errorBody = await userResponse.text();
        console.error("Failed to get user data from Discord. Status:", userResponse.status);
        console.error("Discord Response Body:", errorBody);
        return c.text('Failed to fetch user data from Discord.', 500);
    }

    type UserResponse = { id: string; };
    const userData = await userResponse.json() as UserResponse;
    const userId = userData.id;

    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const SESSION_DURATION_SECONDS = 86400 * 90;
    const expiryDate = (Date.now() / 1000) + SESSION_DURATION_SECONDS;

    const encryptedAccessToken = await encryptFernetToken(c.env.DB_ENCRYPTION_KEY, accessToken);

    await c.env.DB.prepare(
        'INSERT INTO user_sessions (session_token, user_id, discord_access_token, expiry_date) VALUES (?, ?, ?, ?)'
    ).bind(sessionToken, userId, encryptedAccessToken, expiryDate).run();

    const cookieOptions = `Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
    c.header('Set-Cookie', `session_token=${sessionToken}; ${cookieOptions}`);
    
    return c.redirect('/');
});

app.get('/api/events', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM events ORDER BY start_date ASC'
        ).all();
        return c.json(results || []);
    } catch (e) {
        console.error("Failed to fetch events:", e);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
});

app.post('/api/events', authMiddleware, async (c) => {
    const user = c.get('user'); 

    if (!CALENDAR_ADMIN_IDS.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        const body = await c.req.json();
        const { title, type, troop_type, start, duration, repeat_count, repeat_interval } = body;

        if (!title || !start || !duration) {
            return c.json({ error: 'Missing required fields' }, 400);
        }

        const seriesId = crypto.randomUUID();
        
        const stmt = c.env.DB.prepare(
            `INSERT INTO events (series_id, title, type, troop_type, start_date, duration, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        const batch = [];
        const count = repeat_count || 1;
        const interval = repeat_interval || 0;

        let currentTroopIndex = troop_type ? TROOP_CYCLE.indexOf(troop_type) : -1;

        for (let i = 0; i < count; i++) {
            const currentStart = addDays(start, i * interval);
            let thisTroop = null;

            if (currentTroopIndex !== -1) {
                thisTroop = TROOP_CYCLE[(currentTroopIndex + i) % TROOP_CYCLE.length];
            }
            
            batch.push(stmt.bind(seriesId, title, type, thisTroop || troop_type || null, currentStart, duration, user.id));
        }

        await c.env.DB.batch(batch);

        return c.json({ status: 'success', message: `Created ${count} events` }, 201);
    } catch (e) {
        console.error("Failed to create event:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.post('/api/events/shift', authMiddleware, async (c) => {
    const user = c.get('user');

    if (!CALENDAR_ADMIN_IDS.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        const { series_id, shift_days } = await c.req.json();

        if (!series_id || !shift_days) {
            return c.json({ error: 'Missing series_id or shift_days' }, 400);
        }

        const modifier = `${shift_days > 0 ? '+' : ''}${shift_days} days`;

        const { success } = await c.env.DB.prepare(
            `UPDATE events 
             SET start_date = date(start_date, ?) 
             WHERE series_id = ?`
        ).bind(modifier, series_id).run();

        return c.json({ status: 'success', message: 'Events shifted' });
    } catch (e) {
        console.error("Failed to shift events:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.delete('/api/events/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();

    if (!CALENDAR_ADMIN_IDS.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        const { success } = await c.env.DB.prepare(
            `DELETE FROM events WHERE id = ?`
        ).bind(id).run();

        return success 
            ? c.json({ status: 'success' }) 
            : c.json({ error: 'Event not found' }, 404);
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export const onRequest = handle(app);