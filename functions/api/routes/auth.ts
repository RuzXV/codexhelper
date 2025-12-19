import { Hono } from 'hono';
import { encryptFernetToken } from '../../crypto';
import { Bindings, Variables } from '../_types';

const auth = new Hono<{ Bindings: Bindings, Variables: Variables }>();

auth.get('/callback', async (c) => {
    const code = c.req.query('code');
    if (!code) return c.text('Authorization code is missing.', 400);

    const url = new URL(c.req.url);
    const origin = url.origin;

    const tokenData = new URLSearchParams({
        client_id: c.env.WEBSITE_APP_ID,
        client_secret: c.env.WEBSITE_APP_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${origin}/api/auth/callback`,
    })

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenData,
    });

    if (!tokenResponse.ok) return c.text('Failed to authenticate with Discord.', 500);

    const tokenJson = await tokenResponse.json() as { access_token: string };
    const accessToken = tokenJson.access_token;

    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) return c.text('Failed to fetch user data from Discord.', 500);

    const userData = await userResponse.json() as { id: string };
    const userId = userData.id;

    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const SESSION_DURATION_SECONDS = 86400 * 90;
    const expiryDate = (Date.now() / 1000) + SESSION_DURATION_SECONDS;

    const encryptedAccessToken = await encryptFernetToken(c.env.DB_ENCRYPTION_KEY, accessToken);

    await c.env.DB.prepare(
        'INSERT INTO user_sessions (session_token, user_id, discord_access_token, expiry_date) VALUES (?, ?, ?, ?)'
    ).bind(sessionToken, userId, encryptedAccessToken, expiryDate).run();

    const cookieOptions = `Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax; Path=/`;
    c.header('Set-Cookie', `session_token=${sessionToken}; ${cookieOptions}`);
    
    return c.redirect('/');
});

auth.post('/logout', (c) => {
    c.header('Set-Cookie', 'session_token=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');
    return c.json({ status: 'success', message: 'Logged out.' });
});

export default auth;