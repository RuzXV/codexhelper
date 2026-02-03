import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { decryptFernetToken } from '../crypto';
import { Bindings, Variables } from './_types';
import { parseAdminIds } from './_constants';

export const authMiddleware = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
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
            c.set('user', { id: session.user_id, accessToken: decryptedToken, username: '' });
            await next();
        } catch (e) {
            console.error("Token decryption failed:", e);
            return c.json({ error: 'Invalid session token (decryption failed)' }, 401);
        }
    } else {
        return c.json({ error: 'Invalid or expired session' }, 401);
    }
};

export const botAuthMiddleware = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) {
        return c.json({ error: 'Unauthorized: Invalid secret key' }, 401);
    }
    await next();
};

export const masterAdminMiddleware = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const user = c.get('user');
    const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);
    if (!user || !masterAdminIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized: Master Admin access required' }, 403);
    }
    await next();
};