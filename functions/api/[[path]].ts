import { Hono } from 'hono';
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

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

app.use('/api/*', cors({
    origin: [
        'https://codexhelper.com', 
        'https://www.codexhelper.com',
        'http://127.0.0.1:8788'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
}));

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