
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

const BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1/auth-token';

async function request(label, headers, body) {
    return new Promise((resolve) => {
        console.log(`\n----------------------------------------`);
        console.log(`TEST: ${label}`);
        console.log(`Headers:`, JSON.stringify(headers));
        // Hide secret in body log
        const safeBody = body.replace(/client_secret=[^&"]+/, 'client_secret=***').replace(/"client_secret":"[^"]+"/, '"client_secret":"***"');
        console.log(`Body:`, safeBody);

        const req = https.request(BASE_URL, {
            method: 'POST',
            headers: headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\nStatus: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve();
        });

        if (body) req.write(body);
        req.end();
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const config = await prisma.storeConfig.findFirst();
    if (!config) {
        console.error("No store config found!");
        return;
    }

    // CHECK FOR INVISIBLE CHARACTERS
    const clientId = config.sincPayKey || '';
    const clientSecret = config.sincPaySecret || '';

    console.log(`\n[CREDENTIALS CHECK]`);
    console.log(`ClientID: '${clientId}' (Length: ${clientId.length})`);
    console.log(`ClientSecret: '${clientSecret.substring(0, 5)}...' (Length: ${clientSecret.length})`);

    const cleanClientId = clientId.trim();
    const cleanClientSecret = clientSecret.trim();

    if (clientId.length !== cleanClientId.length || clientSecret.length !== cleanClientSecret.length) {
        console.warn(`⚠️ WARNING: Whitespace detected! Trimming for tests...`);
    }

    // 1. JSON Body
    await request(
        'JSON Body',
        {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        JSON.stringify({ client_id: cleanClientId, client_secret: cleanClientSecret })
    );
    await delay(1000);

    // 2. Form URL Encoded
    const formBody = `client_id=${encodeURIComponent(cleanClientId)}&client_secret=${encodeURIComponent(cleanClientSecret)}`;
    await request(
        'Form URL Encoded',
        {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(formBody)
        },
        formBody
    );
    await delay(1000);

    // 3. Basic Auth (Empty Body)
    const auth = Buffer.from(`${cleanClientId}:${cleanClientSecret}`).toString('base64');
    await request(
        'Basic Auth (Empty Body)',
        {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        JSON.stringify({})
    );
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
