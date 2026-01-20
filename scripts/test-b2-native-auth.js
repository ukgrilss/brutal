const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser
const envPath = path.join(__dirname, '..', '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2 && !line.startsWith('#')) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim();
            env[key] = val;
        }
    });
}

const KEY_ID = env.B2_ACCESS_KEY_ID;
const APP_KEY = env.B2_SECRET_ACCESS_KEY;

console.log(`Testing B2 Native Auth...`);
console.log(`Key ID: '${KEY_ID}'`);
console.log(`App Key: '${APP_KEY ? APP_KEY.substring(0, 5) + '...' : 'MISSING'}'`);

if (!KEY_ID || !APP_KEY) {
    console.error('Missing credentials in .env');
    process.exit(1);
}

const authString = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64');

const options = {
    hostname: 'api.backblazeb2.com',
    path: '/b2api/v2/b2_authorize_account',
    method: 'GET', // Authorization is GET
    headers: {
        'Authorization': `Basic ${authString}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`\nStatus: ${res.statusCode} ${res.statusMessage}`);
        console.log('Response Body:', data);

        try {
            const json = JSON.parse(data);
            if (res.statusCode === 200) {
                console.log('✅ Auth Success!');
                console.log('Account ID:', json.accountId);
                console.log('API URL:', json.apiUrl);
                // Script reads from .env, so no code change needed here if .env is updated. 
                // However, I'll update the console log to hide the full key for security if I were editing it, but I'm not.
                // I can just run the script since it parses .env.
            } else {
                console.log('❌ Auth Failed.');
            }
        } catch (e) {
            console.log('Failed to parse JSON response.');
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.end();
