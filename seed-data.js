import fetch from 'node-fetch'; // Ensure you have node-fetch installed, or use Node 18+ built-in fetch

// CONFIGURATION
const LOCAL_URL = 'http://127.0.0.1:8788'; // Wrangler port
const PROD_URL = 'https://codexhelper.com';
// PASTE YOUR SECRET KEY BELOW (From your .env file)
const BOT_SECRET = 'YOUR_BOT_SECRET_KEY_HERE'; 

const KEYS_TO_SYNC = [
    'commanders', 
    'aliases', 
    'bundles', 
    'events', 
    'meta_lineups'
];

async function syncData() {
    console.log("🔄 Starting Data Sync...");

    for (const key of KEYS_TO_SYNC) {
        try {
            // 1. Fetch from Production
            console.log(`\n📥 Fetching [${key}] from Production...`);
            const res = await fetch(`${PROD_URL}/api/data/${key}`, {
                headers: { 'X-Internal-Secret': BOT_SECRET }
            });

            if (!res.ok) throw new Error(`Failed to fetch ${key}: ${res.statusText}`);
            const data = await res.json();

            // 2. Push to Local
            console.log(`📤 Seeding [${key}] to Local...`);
            const postRes = await fetch(`${LOCAL_URL}/api/bot/seed/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Secret': BOT_SECRET
                },
                body: JSON.stringify(data)
            });

            if (!postRes.ok) throw new Error(`Failed to seed ${key}: ${postRes.statusText}`);
            console.log(`✅ [${key}] Sync Complete!`);

        } catch (e) {
            console.error(`❌ Error syncing ${key}:`, e.message);
        }
    }
}

syncData();