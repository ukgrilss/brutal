const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const https = require('https');

// Config
const B2_ENDPOINT = 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = 'us-east-005';
const B2_ACCESS_KEY_ID = '005c9fcfa158581000000003';
const B2_SECRET_ACCESS_KEY = 'K0057JOHybpD0YkA+fB6ksvUGyCozMk';
const B2_BUCKET_NAME = 'brutal-b2-x93kd';

const client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_ACCESS_KEY_ID,
        secretAccessKey: B2_SECRET_ACCESS_KEY
    }
});

async function run() {
    console.log('--- Upload Simulation ---');

    // 1. Generate Signed URL
    const key = `test-upload-${Date.now()}.txt`;
    console.log(`Generating signed URL for key: ${key}`);

    const command = new PutObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: key,
        ContentType: 'text/plain'
    });

    try {
        const url = await getSignedUrl(client, command, { expiresIn: 3600 });
        console.log('Signed URL generated successfully.');

        // 2. Perform PUT request
        const data = 'Hello Backblaze B2!';

        const req = https.request(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`\nResponse Status: ${res.statusCode} ${res.statusMessage}`);
                console.log('Response Body:', body);

                if (res.statusCode === 200) {
                    console.log('✅ Upload Success! The credentials work.');
                    console.log('If browser fails, it IS purely a CORS/Client code issue.');
                } else {
                    console.log('❌ Upload Failed!');
                    console.log('This means the credential/signature is rejected by B2.');
                }
            });
        });

        req.on('error', e => console.error('Request Error:', e));
        req.write(data);
        req.end();

    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

run();
