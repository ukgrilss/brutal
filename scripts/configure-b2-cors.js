const { S3Client, ListBucketsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

// Inputs
const RAW_ENDPOINT = 'https://s3.us-east-005.backblazeb2.com';
const RAW_KEY_ID = '005c9fcfa158581000000003';
const RAW_SECRET = 'K0057JOHybpD0YkA+fB6ksvUGyCozMk';
const RAW_BUCKET = 'brutal-b2-x93kd';

// Cleanup
const B2_ENDPOINT = RAW_ENDPOINT.trim();
const B2_REGION = 'us-east-005';
const B2_ACCESS_KEY_ID = RAW_KEY_ID.trim();
const B2_SECRET_ACCESS_KEY = RAW_SECRET.trim();
const B2_BUCKET_NAME = RAW_BUCKET.trim();

console.log('--- Credential Debug ---');
console.log(`Endpoint: '${B2_ENDPOINT}'`);
console.log(`Region: '${B2_REGION}'`);
console.log(`Key ID: '${B2_ACCESS_KEY_ID}' (Length: ${B2_ACCESS_KEY_ID.length})`);
console.log(`Secret: '${B2_SECRET_ACCESS_KEY.substring(0, 5)}...' (Length: ${B2_SECRET_ACCESS_KEY.length})`);
console.log('------------------------\n');

const client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: 'us-east-1', // Force standard region to bypass SDK validation
    credentials: {
        accessKeyId: B2_ACCESS_KEY_ID,
        secretAccessKey: B2_SECRET_ACCESS_KEY
    }
});

async function main() {
    // 1. Test Connection with PutObject (Upload Test)
    console.log('1. Testing Connection (PutObject)...');
    try {
        const command = new PutBucketCorsCommand({
            Bucket: B2_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST'],
                        AllowedOrigins: ['*'],
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        });

        await client.send(command);
        console.log('✅ CORS configuration applied successfully!');
    } catch (error) {
        console.error('❌ Failed to set CORS:', error.message);
        console.log('Full Error:', JSON.stringify(error, null, 2));
    }
}

main();
