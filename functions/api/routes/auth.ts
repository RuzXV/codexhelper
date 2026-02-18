import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { encryptFernetToken } from '../../crypto';
import { Bindings, Variables } from '../_types';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const SESSION_DURATION_SECONDS = 86400 * 30; // 30 days

auth.get('/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (!code) return c.text('Authorization code is missing.', 400);

    // Verify OAuth2 state parameter to prevent CSRF login attacks
    const storedState = getCookie(c, 'oauth_state');
    if (!state || !storedState || state !== storedState) {
        return c.text('Invalid or missing state parameter. Please try logging in again.', 403);
    }

    // Clear the state cookie now that it's been verified
    c.header('Set-Cookie', 'oauth_state=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');

    const url = new URL(c.req.url);
    const origin = url.origin;

    const tokenData = new URLSearchParams({
        client_id: c.env.WEBSITE_APP_ID,
        client_secret: c.env.WEBSITE_APP_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${origin}/api/auth/callback`,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenData,
    });

    if (!tokenResponse.ok) return c.text('Failed to authenticate with Discord.', 500);

    const tokenJson = (await tokenResponse.json()) as { access_token: string; refresh_token: string };
    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;

    const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) return c.text('Failed to fetch user data from Discord.', 500);

    const userData = (await userResponse.json()) as { id: string };
    const userId = userData.id;

    const sessionToken = crypto.randomUUID().replace(/-/g, '');
    const expiryDate = Date.now() / 1000 + SESSION_DURATION_SECONDS;

    const encryptedAccessToken = await encryptFernetToken(c.env.DB_ENCRYPTION_KEY, accessToken);
    const encryptedRefreshToken = await encryptFernetToken(c.env.DB_ENCRYPTION_KEY, refreshToken);

    await c.env.DB.prepare(
        'INSERT INTO user_sessions (session_token, user_id, discord_access_token, discord_refresh_token, expiry_date) VALUES (?, ?, ?, ?, ?)',
    )
        .bind(sessionToken, userId, encryptedAccessToken, encryptedRefreshToken, expiryDate)
        .run();

    const cookieOptions = `Max-Age=${SESSION_DURATION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
    c.header('Set-Cookie', `session_token=${sessionToken}; ${cookieOptions}`);

    return c.redirect('/');
});

// Generate OAuth2 state and redirect to Discord
auth.get('/login', (c) => {
    const state = crypto.randomUUID().replace(/-/g, '');
    const url = new URL(c.req.url);
    const origin = url.origin;
    const redirectUri = `${origin}/api/auth/callback`;
    const scope = 'identify guilds';

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${c.env.WEBSITE_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    // Store state in a short-lived cookie (10 minutes)
    c.header('Set-Cookie', `oauth_state=${state}; Max-Age=600; HttpOnly; Secure; SameSite=Lax; Path=/`);
    return c.redirect(authUrl);
});

auth.post('/logout', async (c) => {
    // Invalidate session server-side by deleting from DB
    const sessionToken = getCookie(c, 'session_token');
    if (sessionToken) {
        await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
    }

    c.header('Set-Cookie', 'session_token=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');
    return c.json({ status: 'success', message: 'Logged out.' });
});

export default auth;
