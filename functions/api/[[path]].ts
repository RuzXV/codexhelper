import { Hono, Context, Next } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

import { Bindings, Variables } from './_types';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import botRoutes from './routes/bot';
import templateRoutes from './routes/templates';
import guildRoutes from './routes/guilds';
import scoreRoutes from './routes/scores';
import adminRoutes from './routes/admin';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
    '/api/*',
    cors({
        origin: ['https://codexhelper.com', 'https://www.codexhelper.com', 'http://127.0.0.1:8788'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    }),
);

/**
 * Security headers middleware — adds standard security headers to all API responses.
 */
app.use('/api/*', async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

/**
 * CSRF protection middleware — requires application/json content-type for state-changing requests.
 * Forms cannot send application/json cross-origin, so this blocks CSRF attacks.
 * Bot/internal/auth endpoints are exempt (authenticated via secret key or OAuth flow).
 */
app.use('/api/*', async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const method = c.req.method;
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) return next();

    const path = new URL(c.req.url).pathname;
    if (path.startsWith('/api/bot') || path.startsWith('/api/internal') || path.startsWith('/api/auth')) return next();

    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('application/json')) {
        return c.json({ error: 'Invalid content type' }, 415);
    }
    await next();
});

/**
 * Rate limiting middleware using KV.
 * - Bot endpoints: exempt (authenticated via secret key, trusted internal service)
 * - Auth endpoints: 10 req/min (prevent brute-force)
 * - General API: 60 req/min
 */
app.use('/api/*', async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const path = new URL(c.req.url).pathname;

    // Bot endpoints are authenticated via secret key — skip rate limiting entirely.
    // The bot is a trusted internal service and needs burst capacity on startup.
    if (path.startsWith('/api/bot')) {
        await next();
        return;
    }

    let limit = 60;
    const window = 60;
    let prefix = 'rl:api';

    if (path.startsWith('/api/auth')) {
        limit = 10;
        prefix = 'rl:auth';
    }

    const key = `${prefix}:${ip}`;

    try {
        const current = await c.env.API_CACHE.get(key);
        const count = current ? parseInt(current, 10) : 0;

        if (count >= limit) {
            return c.json({ error: 'Too many requests. Please try again later.' }, 429);
        }

        // Non-blocking KV write
        const putPromise = c.env.API_CACHE.put(key, String(count + 1), { expirationTtl: window });
        if (c.executionCtx && 'waitUntil' in c.executionCtx) {
            c.executionCtx.waitUntil(putPromise);
        } else {
            await putPromise;
        }
    } catch (e) {
        // If rate limiting fails, allow the request through
        console.error('Rate limit check failed:', e);
    }

    await next();
});

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/events', eventRoutes);
app.route('/api/bot', botRoutes);
app.route('/api/templates', templateRoutes);
app.route('/api/guilds', guildRoutes);
app.route('/api/scores', scoreRoutes);

app.route('/api', adminRoutes);

app.get('/health', (c) => c.json({ status: 'ok' }));

export const onRequest = handle(app);
