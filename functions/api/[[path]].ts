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

app.use('/api/*', cors({
    origin: ['https://codexhelper.com', 'https://www.codexhelper.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

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
    const userData = await userResponse.json();

    const activePatrons: number[] | null = await c.env.API_CACHE.get('active_patrons', 'json');
    
    const isActivePatron = activePatrons ? activePatrons.includes(Number(user.id)) : false;

    const enrichedUserData = {
        ...(typeof userData === 'object' && userData !== null ? userData : {}),
        is_active_patron: isActivePatron
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
        console.error("Failed to get token from Discord:", await tokenResponse.text());
        return c.text('Failed to authenticate with Discord.', 500);
    }

    type TokenResponse = { access_token: string; };
    const tokenJson = await tokenResponse.json() as TokenResponse;
    const accessToken = tokenJson.access_token;

    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
        console.error("Failed to get user data from Discord:", await userResponse.text());
        return c.text('Failed to fetch user data from Discord.', 500);
    }

    type UserResponse = { id: string; };
    const userData = await userResponse.json() as UserResponse;
    const userId = userData.id;

    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const SESSION_DURATION_SECONDS = 86400 * 30; // 30 days
    const expiryDate = (Date.now() / 1000) + SESSION_DURATION_SECONDS;

    const encryptedAccessToken = await encryptFernetToken(c.env.DB_ENCRYPTION_KEY, accessToken);

    await c.env.DB.prepare(
        'INSERT INTO user_sessions (session_token, user_id, discord_access_token, expiry_date) VALUES (?, ?, ?, ?)'
    ).bind(sessionToken, userId, encryptedAccessToken, expiryDate).run();

    const cookieOptions = `Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
    c.header('Set-Cookie', `session_token=${sessionToken}; ${cookieOptions}`);
    
    return c.redirect('/');
});

export const onRequest = handle(app);