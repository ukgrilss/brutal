const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env
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
const BUCKET_NAME = env.B2_BUCKET_NAME;

async function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('--- Checking CORS Status ---');

    try {
        const authString = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64');
        const authData = await request({
            hostname: 'api.backblazeb2.com',
            path: '/b2api/v2/b2_authorize_account',
            method: 'GET',
            headers: { 'Authorization': `Basic ${authString}` }
        });

        const { apiUrl, authorizationToken, accountId } = authData;
        const apiHost = apiUrl.replace('https://', '');

        const listData = await request({
            hostname: apiHost,
            path: '/b2api/v2/b2_list_buckets',
            method: 'POST',
            headers: { 'Authorization': authorizationToken },
        }, { accountId, bucketTypes: ['allPrivate', 'allPublic'] });

        const bucket = listData.buckets.find(b => b.bucketName === BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${BUCKET_NAME} not found!`);

        console.log('Bucket ID:', bucket.bucketId);
        console.log('Revision:', bucket.revision);

        if (bucket.corsRules && bucket.corsRules.length > 0) {
            console.log('✅ CORS Rules Found:');
            console.log(JSON.stringify(bucket.corsRules, null, 2));
        } else {
            console.log('❌ NO CORS RULES FOUND (Empty).');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
