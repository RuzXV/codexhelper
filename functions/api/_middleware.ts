import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { decryptFernetToken } from '../crypto';
import { Bindings, Variables } from './_types';
import { parseAdminIds } from './_constants';

export const authMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const sessionToken = getCookie(c, 'session_token');
    if (!sessionToken) {
        return c.json({ error: 'Authentication required. No session token provided.' }, 401);
    }

    type Session = {
        user_id: string;
        discord_access_token: string;
        discord_refresh_token: string | null;
        expiry_date: number;
    };

    // Check KV cache first to avoid D1 query on every request
    const cacheKey = `session:${sessionToken}`;
    let session: Session | null = null;

    try {
        const cached = await c.env.API_CACHE.get(cacheKey);
        if (cached) {
            session = JSON.parse(cached) as Session;
        }
    } catch (_) {
        /* cache miss or parse error, fall through to D1 */
    }

    if (!session) {
        session = (await c.env.DB.prepare(
            'SELECT user_id, discord_access_token, discord_refresh_token, expiry_date FROM user_sessions WHERE session_token = ?',
        )
            .bind(sessionToken)
            .first()) as Session | null;

        // Cache session in KV for 3 minutes (non-blocking)
        if (session) {
            const putPromise = c.env.API_CACHE.put(cacheKey, JSON.stringify(session), { expirationTtl: 180 });
            if (c.executionCtx && 'waitUntil' in c.executionCtx) {
                c.executionCtx.waitUntil(putPromise);
            }
        }
    }

    if (session && Date.now() / 1000 < session.expiry_date) {
        try {
            const decryptedToken = await decryptFernetToken(c.env.DB_ENCRYPTION_KEY, session.discord_access_token);
            let decryptedRefresh = '';
            if (session.discord_refresh_token) {
                decryptedRefresh = await decryptFernetToken(c.env.DB_ENCRYPTION_KEY, session.discord_refresh_token);
            }
            c.set('user', {
                id: session.user_id,
                accessToken: decryptedToken,
                refreshToken: decryptedRefresh,
                sessionToken: sessionToken,
                username: '',
            });
            await next();
        } catch (e) {
            console.error('Token decryption failed:', e);
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

export const masterAdminMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const user = c.get('user');
    const masterAdminIds = parseAdminIds(c.env.MASTER_ADMIN_IDS);
    if (!user || !masterAdminIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized: Master Admin access required' }, 403);
    }
    await next();
};
