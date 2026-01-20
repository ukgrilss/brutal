
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

const BASE_URL = 'https://api.syncpayments.com.br/api/partner/v1/auth-token';

async function request(label, headers, body) {
    return new Promise((resolve) => {
        console.log(`\n----------------------------------------`);
        console.log(`TEST: ${label}`);
        console.log(`Headers:`, JSON.stringify(headers));
        console.log(`Body:`, body);

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

    // Trim credentials aggressively
    const clientId = config.sincPayKey ? config.sincPayKey.trim() : '';
    const clientSecret = config.sincPaySecret ? config.sincPaySecret.trim() : '';

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
    const formBody = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
    await request(
        'Form URL Encoded',
        {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Content-Length': Buffer.byteLength(formBody)
        },
        formBody
    );

    // 3. Basic Auth (Empty Body)
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    await request(
        'Basic Auth (Empty Body)',
        {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        JSON.stringify({})
    );
    // 4. Basic Auth (Grant Type Body)
    await request(
        'Basic Auth (Grant Type)',
        {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        JSON.stringify({ grant_type: 'client_credentials' })
    );
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
