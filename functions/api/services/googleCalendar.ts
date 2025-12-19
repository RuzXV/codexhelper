export function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
}

export class GoogleCalendarService {
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
        if (id.length < 5) id = id.padStart(5, '0');
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
            if (!updateRes.ok) throw new Error(`Google API Update Error: ${await updateRes.text()}`);
            return;
        }

        if (!res.ok) throw new Error(`Google API Create Error: ${await res.text()}`); 
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