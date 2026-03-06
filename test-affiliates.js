const fs = require('fs');
const configContent = fs.readFileSync('c:/Users/hp/Downloads/nasiiba/supabase-config.js', 'utf-8');
const urlMatch = configContent.match(/const\s+supabaseUrl\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/const\s+supabaseAnonKey\s*=\s*['"]([^'"]+)['"]/);

const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];
const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };

async function testFetch() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/affiliates?select=*&limit=1`, { headers });
        console.log("Status:", res.status);
        console.log("Response:", await res.text());
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}
testFetch();
