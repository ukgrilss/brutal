
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

const BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1/auth-token';

async function request(label, headers, body) {
    return new Promise((resolve) => {
        console.log(`\n--- TEST: ${label} ---`);
        const req = https.request(BASE_URL, {
            method: 'POST',
            headers: headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${data}`);
                resolve();
            });
        });

        if (body) req.write(body);
        req.end();
    });
}

async function main() {
    const config = await prisma.storeConfig.findFirst();
    if (!config) {
        console.error("No store config found!");
        return;
    }

    const { sincPayKey: clientId, sincPaySecret: clientSecret } = config;
    console.log(`Credentials: ${clientId.substring(0, 5)}... / ${clientSecret.substring(0, 5)}...`);

    // 1. JSON Body
    await request(
        'JSON Body',
        {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        JSON.stringify({ client_id: clientId, client_secret: clientSecret })
    );

    // 2. Form URL Encoded
    const formBody = `client_id=${clientId}&client_secret=${clientSecret}`;
    await request(
        'Form URL Encoded',
        {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Content-Length': formBody.length
        },
        formBody
    );

    // 3. Basic Auth
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    await request(
        'Basic Auth',
        {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json', // Sometimes empty body is enough or client_credentials grant type
            'Accept': 'application/json'
        },
        JSON.stringify({ grant_type: 'client_credentials' }) // Common OAuth body
    );
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
