import { Hono, Context, Next } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { StatusCode } from 'hono/utils/http-status';
import { getCookie } from 'hono/cookie';
import { encryptFernetToken, decryptFernetToken } from '../crypto';

type Bindings = {
    DB: D1Database;
    BOT_DB: D1Database;
    API_CACHE: KVNamespace;
    BOT_DATA: KVNamespace;
    WEBSITE_APP_ID: string;
    WEBSITE_APP_SECRET: string;
    DB_ENCRYPTION_KEY: string;
    BOT_SECRET_KEY: string;
    GOOGLE_SERVICE_ACCOUNT_JSON: string;
    GOOGLE_CALENDAR_ID: string;
};

type Variables = {
    user: {
        id: string;
        username: string;
        accessToken: string;
    };
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

const MASTER_OVERRIDE_ID = '285201373266575361';

const CALENDAR_ADMIN_IDS = [
    '285201373266575361', 
    '1121488445836103820',
    '593329463245144084',
    '545152090910228492'
];

const MASTER_ADMIN_IDS = [
    '285201373266575361', 
    '388515288666210313'
];

const TROOP_CYCLE = ["Infantry", "Archer", "Leadership", "Cavalry"];

const EVENT_INTERVALS: Record<string, number> = {
    "mge": 14,
    "wof": 14,
    "mtg": 28,
    "gk": 14,
    "ceroli": 14,
    "rom": 14,
    "esm": 42,
    "arma": 42,
    "dhal": 42,
    "egg_hammer": 14,
    "goldhead": 14,
    "ark_battle": 14,
    "ark_registration": 14,
    "olympia": 14
};

const EVENT_COLOR_MAP: Record<string, string> = {
    "mge": "5",             // Yellow (Banana)
    "wof": "3",             // Purple (Grape)
    "mtg": "11",            // Red (Tomato)
    "gk": "6",              // Orange (Tangerine)
    "ceroli": "2",          // Green (Sage)
    "rom": "9",             // Blue (Blueberry)
    "esm": "4",             // Pink (Flamingo)
    "arma": "3",            // Purple (Grape)
    "dhal": "7",            // Teal/Cyan (Peacock)
    "egg_hammer": "7",      // Cyan (Peacock)
    "goldhead": "5",        // Yellow (Banana)
    "ark_battle": "6",      // Tan/Orange (Tangerine)
    "ark_registration": "6",
    "olympia": "5"          // Gold/Yellow (Banana)
};

app.use('/api/*', cors({
    origin: [
        'https://codexhelper.com', 
        'https://www.codexhelper.com',
        'http://127.0.0.1:8788'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
}));

function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

class GoogleCalendarService {
    private creds: any;
    private calendarId: string;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor(jsonKey: string, calendarId: string) {
        try {
            this.creds = JSON.parse(jsonKey);
        } catch (e) {
            console.error("Failed to parse Google Service Account JSON");
            this.creds = {};
        }
        this.calendarId = calendarId;
    }

    private async getAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        const header = { alg: 'RS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const claim = {
            iss: this.creds.client_email,
            scope: 'https://www.googleapis.com/auth/calendar',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedClaim = this.base64UrlEncode(JSON.stringify(claim));

        const key = await this.importPrivateKey(this.creds.private_key);
        const signature = await crypto.subtle.sign(
            { name: 'RSASSA-PKCS1-v1_5' },
            key,
            new TextEncoder().encode(`${encodedHeader}.${encodedClaim}`)
        );

        const signedJwt = `${encodedHeader}.${encodedClaim}.${this.base64UrlEncode(signature)}`;

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: signedJwt,
            }),
        });

        const data = await response.json() as any;
        this.token = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
        return this.token!;
    }

    private base64UrlEncode(input: string | ArrayBuffer): string {
        let base64;
        if (typeof input === 'string') {
            base64 = btoa(input);
        } else {
            base64 = btoa(String.fromCharCode(...new Uint8Array(input)));
        }
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private async importPrivateKey(pem: string): Promise<CryptoKey> {
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        const pemContents = pem.replace(/\\n/g, '\n'); 
        
        const pemBody = pemContents.substring(
            pemContents.indexOf(pemHeader) + pemHeader.length,
            pemContents.indexOf(pemFooter)
        ).replace(/\s/g, '');

        const binaryDerString = atob(pemBody);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        return crypto.subtle.importKey(
            'pkcs8',
            binaryDer.buffer,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );
    }

    private formatEventId(customId: string | number): string {
        let id = String(customId).toLowerCase();
        
        id = id.replace(/[^a-v0-9]/g, '');
        
        if (id.length < 5) {
            id = id.padStart(5, '0');
        }
        
        return id;
    }

    async createEvent(eventData: any, customId: string) {
        const token = await this.getAccessToken();
        const gcalId = this.formatEventId(customId);
        
        const gcalBody = {
            id: gcalId,
            summary: eventData.title + (eventData.troop_type ? ` (${eventData.troop_type})` : ''),
            start: { date: eventData.start_date },
            end: { date: addDays(eventData.start_date, eventData.duration) },
            description: `Type: ${eventData.type}\nDuration: ${eventData.duration} days`,
            colorId: eventData.colorId || "8",
            status: 'confirmed'
        };

        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(gcalBody)
        });
        
        if (res.status === 409) {
            console.warn(`Event ${gcalId} exists (likely in trash). Overwriting...`);
            
            const updateRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${gcalId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(gcalBody)
            });

            if (!updateRes.ok) {
                const errorText = await updateRes.text();
                console.error(`Failed to restore/update event ${eventData.title}:`, errorText);
                throw new Error(`Google API Update Error: ${errorText}`);
            }
            return;
        }

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Failed to create event ${eventData.title}:`, errorText);
            throw new Error(`Google API Create Error: ${errorText}`); 
        }
    }

    async deleteEvent(customId: string) {
        try {
            const token = await this.getAccessToken();
            const gcalId = this.formatEventId(customId);
            await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${gcalId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error("GCal Delete Exception", e);
        }
    }

    async patchEventDate(customId: string, newStartDate: string, duration: number) {
        try {
            const token = await this.getAccessToken();
            const gcalId = this.formatEventId(customId);
            
            const body = {
                start: { date: newStartDate },
                end: { date: addDays(newStartDate, duration) }
            };

            const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${gcalId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) console.error("GCal Patch Error", await res.text());
        } catch (e) {
            console.error("GCal Patch Exception", e);
        }
    }

    async listEvents(maxResults = 2500) {
        try {
            const token = await this.getAccessToken();
            let events: any[] = [];
            let pageToken = '';

            do {
                const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events`);
                url.searchParams.append('maxResults', String(maxResults));
                if (pageToken) url.searchParams.append('pageToken', pageToken);

                const res = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json() as any;
                if (data.items) events = events.concat(data.items);
                
                pageToken = data.nextPageToken;
            } while (pageToken && events.length < maxResults);

            return events;
        } catch (e) {
            console.error("GCal List Exception", e);
            return [];
        }
    }
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

const masterAdminMiddleware = async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user || !MASTER_ADMIN_IDS.includes(user.id)) {
        return c.json({ error: 'Unauthorized: Master Admin access required' }, 403);
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

    if (userResponse.status === 401) {
        const sessionToken = getCookie(c, 'session_token');
        await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
        c.header('Set-Cookie', 'session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
        return c.json({ error: 'Session expired' }, 401);
    }

    if (!userResponse.ok) {
        return c.json({ error: 'Failed to fetch fresh user data from Discord.' }, 500);
    }
    const userData = await userResponse.json() as { id: string; username: string; [key: string]: any };
    
    const activePatrons: string[] | null = await c.env.API_CACHE.get('active_patrons', 'json');

    const isMasterOverride = user.id === MASTER_OVERRIDE_ID;

    const isActivePatron = (activePatrons ? activePatrons.includes(user.id) : false) || isMasterOverride;
    
    const isCalendarAdmin = CALENDAR_ADMIN_IDS.includes(user.id) || isMasterOverride;
    const isMasterAdmin = MASTER_ADMIN_IDS.includes(user.id) || isMasterOverride;

    user.username = userData.username;
    c.set('user', user);

    return c.json({
        ...userData,
        is_active_patron: isActivePatron,
        is_calendar_admin: isCalendarAdmin,
        is_master_admin: isMasterAdmin
    });
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

app.get('/api/bot/events/upcoming', botAuthMiddleware, async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT * FROM events 
             WHERE start_date >= date('now', '-2 days') 
             ORDER BY start_date ASC`
        ).all();

        return c.json(results || []);
    } catch (e) {
        console.error("Failed to fetch upcoming events for bot:", e);
        return c.json({ error: 'Failed to fetch events' }, 500);
    }
});

app.get('/api/bot/settings/:userId', botAuthMiddleware, async (c) => {
    const { userId } = c.req.param();
    try {
        const result = await c.env.DB.prepare(
            'SELECT settings FROM user_settings WHERE user_id = ?'
        ).bind(userId).first();

        return c.json(result ? JSON.parse(result.settings as string) : {});
    } catch (e) {
        console.error("Failed to fetch user settings for bot:", e);
        return c.json({ error: 'Failed to fetch settings' }, 500);
    }
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
    if (top_servers) promises.push(c.env.API_CACHE.put('top_servers', JSON.stringify(top_servers)));
    if (bot_stats) promises.push(c.env.API_CACHE.put('bot_stats', JSON.stringify(bot_stats)));
    if (active_patrons) promises.push(c.env.API_CACHE.put('active_patrons', JSON.stringify(active_patrons)));

    await Promise.all(promises);
    return c.json({ success: true });
});

app.post('/api/internal/extend-events', async (c) => {
    const secret = c.req.header('X-Internal-Secret');
    if (secret !== c.env.BOT_SECRET_KEY) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        
        const today = new Date();
        const targetYear = today.getUTCFullYear() + 1;
        const targetDate = new Date(Date.UTC(targetYear, 11, 31));

        const { results } = await c.env.DB.prepare(`
            SELECT series_id, title, type, troop_type, duration, created_by, MAX(start_date) as last_start_date 
            FROM events 
            GROUP BY series_id
        `).all();

        if (!results || results.length === 0) {
            return c.json({ message: 'No active event series found.' });
        }

        let totalCreated = 0;
        const dbBatch = [];
        const gcalPromises = [];

        for (const series of results) {
            const interval = EVENT_INTERVALS[series.type as string];

            if (!interval || interval <= 0 || !series.last_start_date) continue;

            let currentDate = new Date(series.last_start_date as string);
            
            let currentTroopIndex = -1;
            if (series.troop_type && TROOP_CYCLE.includes(series.troop_type as string)) {
                currentTroopIndex = TROOP_CYCLE.indexOf(series.troop_type as string);
            }

            let loopSafety = 0;
            while (currentDate < targetDate && loopSafety < 50) { 
                loopSafety++;
                
                currentDate.setUTCDate(currentDate.getUTCDate() + interval);
                
                if (currentDate > targetDate) break;

                const newStartDate = currentDate.toISOString().split('T')[0];

                let nextTroop = null;
                if (currentTroopIndex !== -1) {
                    currentTroopIndex = (currentTroopIndex + 1) % TROOP_CYCLE.length;
                    nextTroop = TROOP_CYCLE[currentTroopIndex];
                }

                const newEventId = crypto.randomUUID();
                const colorId = EVENT_COLOR_MAP[series.type as string] || "8";
                
                dbBatch.push(c.env.DB.prepare(
                    `INSERT INTO events (id, series_id, title, type, troop_type, start_date, duration, created_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    newEventId,
                    series.series_id,
                    series.title,
                    series.type,
                    nextTroop || null,
                    newStartDate,
                    series.duration,
                    series.created_by
                ));

                gcalPromises.push(gcal.createEvent({
                    title: series.title as string,
                    type: series.type,
                    troop_type: nextTroop || null,
                    start_date: newStartDate,
                    duration: series.duration,
                    colorId: colorId
                }, newEventId));

                totalCreated++;
            }
        }

        if (dbBatch.length > 0) {
            const chunkSize = 50; 
            for (let i = 0; i < dbBatch.length; i += chunkSize) {
                await c.env.DB.batch(dbBatch.slice(i, i + chunkSize));
            }
        }

        c.executionCtx.waitUntil(Promise.allSettled(gcalPromises));

        return c.json({ 
            status: 'success', 
            message: `Checked ${results.length} series. Generated ${totalCreated} new future events.` 
        });

    } catch (e) {
        console.error("Auto-extend error:", e);
        return c.json({ error: 'Failed to extend events', details: String(e) }, 500);
    }
});

app.get('/api/auth/callback', async (c) => {
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

app.get('/api/events', async (c) => {
    try {
        const { results } = await c.env.DB.prepare(
            'SELECT * FROM events ORDER BY start_date ASC'
        ).all();

        c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        c.header('Pragma', 'no-cache');
        c.header('Expires', '0');

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
        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        
        const stmt = c.env.DB.prepare(
            `INSERT INTO events (series_id, title, type, troop_type, start_date, duration, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        const batch = [];
        const count = repeat_count || 1;
        const interval = repeat_interval || 0;

        let currentTroopIndex = troop_type ? TROOP_CYCLE.indexOf(troop_type) : -1;
        
        const colorId = EVENT_COLOR_MAP[type] || "8";

        const gcalPromises = [];

        for (let i = 0; i < count; i++) {
            const currentStart = addDays(start, i * interval);
            let thisTroop = null;
            if (currentTroopIndex !== -1) {
                thisTroop = TROOP_CYCLE[(currentTroopIndex + i) % TROOP_CYCLE.length];
            }

            const eventId = crypto.randomUUID();
            
            const eventData = {
                id: eventId,
                series_id: seriesId,
                title, 
                type, 
                troop_type: thisTroop || troop_type || null, 
                start_date: currentStart, 
                duration,
                created_by: user.id,
                colorId: colorId
            };

            batch.push(stmt.bind(
                eventData.series_id,
                eventData.title,
                eventData.type,
                eventData.troop_type,
                eventData.start_date,
                eventData.duration,
                eventData.created_by
            ));

            gcalPromises.push(gcal.createEvent(eventData, eventId));
        }

        await c.env.DB.batch(batch);

        c.executionCtx.waitUntil(Promise.all(gcalPromises));

        return c.json({ status: 'success', message: `Created ${count} events` }, 201);
    } catch (e) {
        console.error("Failed to create event:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.post('/api/events/shift', authMiddleware, async (c) => {
    const user = c.get('user');
    if (!CALENDAR_ADMIN_IDS.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const { series_id, shift_days } = await c.req.json();
        if (!series_id || !shift_days) return c.json({ error: 'Missing series_id or shift_days' }, 400);

        const { results } = await c.env.DB.prepare(
            'SELECT id, start_date, duration FROM events WHERE series_id = ?'
        ).bind(series_id).all();

        if (!results || results.length === 0) return c.json({ error: 'No events found' }, 404);

        const modifier = `${shift_days > 0 ? '+' : ''}${shift_days} days`;
        await c.env.DB.prepare(
            `UPDATE events SET start_date = date(start_date, ?) WHERE series_id = ?`
        ).bind(modifier, series_id).run();

        const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
        const gcalPromises = results.map(ev => {
            const newStartDate = addDays(ev.start_date as string, shift_days);
            return gcal.patchEventDate(ev.id as string, newStartDate, ev.duration as number);
        });

        c.executionCtx.waitUntil(Promise.all(gcalPromises));

        return c.json({ status: 'success', message: 'Events shifted' });
    } catch (e) {
        console.error("Failed to shift events:", e);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.delete('/api/events/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();

    if (!CALENDAR_ADMIN_IDS.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const { success } = await c.env.DB.prepare(
            `DELETE FROM events WHERE id = ?`
        ).bind(id).run();

        if (success) {
            const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
            c.executionCtx.waitUntil(gcal.deleteEvent(id));
            return c.json({ status: 'success' });
        } else {
            return c.json({ error: 'Event not found' }, 404);
        }
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.patch('/api/events/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    if (!CALENDAR_ADMIN_IDS.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    try {
        const body = await c.req.json();
        const { start_date, title, type, duration } = body;
        
        const { success } = await c.env.DB.prepare(
            `UPDATE events SET start_date = ?, title = ?, type = ?, duration = ? WHERE id = ?`
        ).bind(start_date, title, type, duration, id).run();
        
        if (success) {
             const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);
             c.executionCtx.waitUntil(gcal.patchEventDate(id, start_date, duration));
        }

        return success ? c.json({ status: 'success' }) : c.json({ error: 'Event not found' }, 404);
    } catch (e) {
        return c.json({ error: 'Internal server error' }, 500);
    }
});

app.post('/api/admin/gcal/reset', authMiddleware, async (c) => {
    const user = c.get('user');
    if (!CALENDAR_ADMIN_IDS.includes(user.id)) return c.json({ error: 'Unauthorized' }, 403);

    const { phase = 'cleanup', offset = 0 } = await c.req.json().catch(() => ({}));
    
    const BATCH_SIZE = 5;

    const gcal = new GoogleCalendarService(c.env.GOOGLE_SERVICE_ACCOUNT_JSON, c.env.GOOGLE_CALENDAR_ID);

    try {
        if (phase === 'cleanup') {
            const gcalEvents = await gcal.listEvents(BATCH_SIZE);
            
            if (gcalEvents.length > 0) {
                console.log(`[Batch Cleanup] Deleting ${gcalEvents.length} events...`);
                await Promise.all(gcalEvents.map(e => gcal.deleteEvent(e.id)));
                
                return c.json({ 
                    status: 'partial', 
                    phase: 'cleanup', 
                    offset: 0, 
                    message: `Deleted batch of ${gcalEvents.length} events.` 
                });
            } else {
                return c.json({ 
                    status: 'partial', 
                    phase: 'create', 
                    offset: 0, 
                    message: 'Cleanup complete. Switching to creation.' 
                });
            }
        } 
        
        if (phase === 'create') {
            const { results } = await c.env.DB.prepare(
                `SELECT * FROM events WHERE start_date >= '2024-01-01' LIMIT ? OFFSET ?`
            ).bind(BATCH_SIZE, offset).all();

            const eventsToCreate = results || [];

            if (eventsToCreate.length > 0) {
                console.log(`[Batch Create] Creating ${eventsToCreate.length} events (Offset: ${offset})...`);
                
                const createPromises = eventsToCreate.map(ev => {
                    const colorId = EVENT_COLOR_MAP[ev.type as string] || "8";
                    return gcal.createEvent({
                        title: ev.title,
                        type: ev.type,
                        troop_type: ev.troop_type,
                        start_date: ev.start_date,
                        duration: ev.duration,
                        colorId: colorId
                    }, ev.id as string);
                });

                await Promise.all(createPromises);

                return c.json({ 
                    status: 'partial', 
                    phase: 'create', 
                    offset: offset + eventsToCreate.length, 
                    message: `Created batch of ${eventsToCreate.length} events.` 
                });
            } else {
                return c.json({ 
                    status: 'complete', 
                    message: 'Full reset and sync completed successfully.' 
                });
            }
        }

        return c.json({ error: 'Invalid phase' }, 400);

    } catch(e) {
        console.error("GCal Sync Error", e);
        return c.json({ error: 'Sync failed', details: String(e) }, 500);
    }
});

app.get('/api/users/settings', authMiddleware, async (c) => {
    const user = c.get('user');
    const result = await c.env.DB.prepare(
        'SELECT settings FROM user_settings WHERE user_id = ?'
    ).bind(user.id).first();
    
    return c.json(result ? JSON.parse(result.settings as string) : {});
});

app.post('/api/users/settings', authMiddleware, async (c) => {
    const user = c.get('user');
    const body = await c.req.json();
    
    await c.env.DB.prepare(
        `INSERT INTO user_settings (user_id, settings) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET settings = excluded.settings`
    ).bind(user.id, JSON.stringify(body)).run();

    return c.json({ status: 'success' });
});

app.get('/api/data/version', async (c) => {
    const version = await c.env.BOT_DATA.get('data_version');
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    
    return c.json({ version: version || "0" });
});

app.get('/api/data/:key', async (c) => {
    const key = c.req.param('key');
    const secret = c.req.header('X-Internal-Secret');
    const user = c.get('user');

    const isBot = secret === c.env.BOT_SECRET_KEY;
    const isAdmin = user && MASTER_ADMIN_IDS.includes(user.id);

    if (!isBot && !isAdmin) {
        const sessionToken = getCookie(c, 'session_token');
        if (sessionToken) {
             const session = await c.env.DB.prepare('SELECT user_id FROM user_sessions WHERE session_token = ?').bind(sessionToken).first();
             if (session && MASTER_ADMIN_IDS.includes(session.user_id as string)) {
             } else {
                 return c.json({ error: 'Unauthorized' }, 401);
             }
        } else {
             return c.json({ error: 'Unauthorized' }, 401);
        }
    }

    const data = await c.env.BOT_DATA.get(key, 'json');
    return c.json(data || {}); 
});

app.post('/api/admin/data/:key', authMiddleware, masterAdminMiddleware, async (c) => {
    const key = c.req.param('key');
    const rawBody = await c.req.json();
    
    let bodyData = rawBody;
    let details = `Modified data for key: ${key}`;

    if (rawBody && typeof rawBody === 'object' && 'data' in rawBody && 'logDetails' in rawBody) {
        bodyData = rawBody.data;
        details = rawBody.logDetails;
    }

    let username = "Unknown Admin";
    let adminId = c.get('user').id;
    let adminAvatar = null;

    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${c.get('user').accessToken}` }
        });
        const uData = await userRes.json() as any;
        username = uData.username || uData.global_name || c.get('user').id;
        adminId = uData.id;
        adminAvatar = uData.avatar;
    } catch(e) {}

    await c.env.BOT_DATA.put(key, JSON.stringify(bodyData));
    await c.env.BOT_DATA.put('data_version', Date.now().toString());

    const logEntry = {
        timestamp: Date.now(),
        user: username,
        userId: adminId,
        userAvatar: adminAvatar,
        action: `Updated ${key}`,
        details: details
    };

    let logs: any[] = await c.env.BOT_DATA.get('system_changelog', 'json') || [];
    logs.unshift(logEntry);
    if (logs.length > 200) logs = logs.slice(0, 200); 
    await c.env.BOT_DATA.put('system_changelog', JSON.stringify(logs));

    return c.json({ status: 'success', message: `Updated ${key}` });
});

app.get('/api/admin/logs', authMiddleware, masterAdminMiddleware, async (c) => {
    const logs = await c.env.BOT_DATA.get('system_changelog', 'json');
    return c.json(logs || []);
});

app.post('/api/bot/query', botAuthMiddleware, async (c) => {
    const { sql, params, method } = await c.req.json();
    
    try {
        const stmt = c.env.BOT_DB.prepare(sql).bind(...(params || [])); 
        
        if (method === 'execute') {
            const res = await stmt.run();
            return c.json({ rowcount: res.meta.changes, lastrowid: res.meta.last_row_id });
        } else if (method === 'one') {
            return c.json(await stmt.first());
        } else {
            const { results } = await stmt.all();
            return c.json(results || []);
        }
    } catch (e) {
        return c.json({ error: String(e) }, 500);
    }
});

app.get('/api/bot/sync/feed', botAuthMiddleware, async (c) => {
    const lastTimestamp = c.req.query('since') || 0;
    
    const { results } = await c.env.BOT_DB.prepare(
        "SELECT * FROM system_events WHERE created_at > ? ORDER BY created_at ASC LIMIT 50"
    ).bind(lastTimestamp).all();

    return c.json(results || []);
});

app.post('/api/guilds/:guildId/settings/channels', authMiddleware, async (c) => {
    const { guildId } = c.req.param();
    const { command_group, channel_id, action } = await c.req.json();
    
    if (action === 'Add Channel') {
        await c.env.DB.prepare("INSERT OR REPLACE INTO allowed_channels (guild_id, command_group, channel_id) VALUES (?, ?, ?)").bind(guildId, command_group, channel_id).run();
    } else {
        await c.env.DB.prepare("DELETE FROM allowed_channels WHERE guild_id = ? AND command_group = ?").bind(guildId, command_group).run();
    }

    const payload = JSON.stringify({ guild_id: guildId });
    await c.env.DB.prepare(
        "INSERT INTO system_events (type, payload, created_at) VALUES ('CHANNEL_UPDATE', ?, ?)"
    ).bind(payload, Date.now() / 1000).run();

    return c.json({ success: true });
});

app.get('/api/users/guilds', authMiddleware, async (c) => {
    const user = c.get('user');

    const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { 'Authorization': `Bearer ${user.accessToken}` }
    });

    if (response.status === 401) {
        const sessionToken = getCookie(c, 'session_token');
        await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?').bind(sessionToken).run();
        c.header('Set-Cookie', 'session_token=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
        return c.json({ error: 'Session expired (Discord token invalid)' }, 401);
    }

    if (!response.ok) {
        return c.json({ error: 'Failed to fetch guilds from Discord' }, response.status as any);
    }

    const discordGuilds = await response.json() as any[];

    const adminGuilds = discordGuilds.filter(g => {
        const perms = BigInt(g.permissions);
        const ADMIN = 0x8n;
        const MANAGE_GUILD = 0x20n;
        return (perms & ADMIN) === ADMIN || (perms & MANAGE_GUILD) === MANAGE_GUILD;
    });

    if (adminGuilds.length === 0) {
        return c.json([]);
    }

    if (user.id === MASTER_OVERRIDE_ID) {
        return c.json(adminGuilds.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon
        })));
    }
    
    const guildIds = adminGuilds.map(g => g.id);
    const placeholders = guildIds.map(() => '?').join(',');
    
    try {
        const { results } = await c.env.BOT_DB.prepare(
            `SELECT guild_id FROM guild_authorizations WHERE guild_id IN (${placeholders}) AND is_active = 1`
        ).bind(...guildIds).all();

        const activeBotGuildIds = new Set((results || []).map((r: any) => r.guild_id.toString()));

        const validServers = adminGuilds
            .filter(g => activeBotGuildIds.has(g.id))
            .map(g => ({
                id: g.id,
                name: g.name,
                icon: g.icon
            }));

        return c.json(validServers);

    } catch (e) {
        console.error("Database error fetching guilds:", e);
        return c.json({ error: 'Internal server error checking guild status' }, 500);
    }
});

app.get('/api/guilds/:guildId/settings/channels', authMiddleware, async (c) => {
    const { guildId } = c.req.param();
    
    try {
        const { results } = await c.env.DB.prepare(
            "SELECT command_group, channel_id FROM allowed_channels WHERE guild_id = ?"
        ).bind(guildId).all();

        const settings: Record<string, string> = {};
        if (results) {
            results.forEach((row: any) => {
                settings[row.command_group] = row.channel_id;
            });
        }

        return c.json({ settings });
    } catch (e) {
        console.error("Failed to fetch channel settings:", e);
        return c.json({ settings: {} });
    }
});

export const onRequest = handle(app);