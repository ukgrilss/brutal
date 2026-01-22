const https = require('https');

// Load env vars manually since we are running simpler node script
// In a real environment, we'd use dotenv, but let's try to assume envs are loaded or I will read .env file content helper
require('dotenv').config();

const ID = process.env.B2_APPLICATION_KEY_ID;
const KEY = process.env.B2_APPLICATION_KEY;
const BUCKET_NAME = process.env.B2_BUCKET_NAME;

if (!ID || !KEY || !BUCKET_NAME) {
    console.error('Missing B2 credentials in .env');
    process.exit(1);
}

function b2Request(endpoint, method, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(endpoint, {
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
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

async function authorize() {
    const authString = Buffer.from(`${ID}:${KEY}`).toString('base64');
    return b2Request('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', 'GET', {
        'Authorization': `Basic ${authString}`
    });
}

async function run() {
    try {
        console.log('Authorizing...');
        const authData = await authorize();
        const apiUrl = authData.apiUrl;
        const authToken = authData.authorizationToken;
        const accountId = authData.accountId;

        console.log('Finding bucket...', BUCKET_NAME);
        const bucketsRes = await b2Request(`${apiUrl}/b2api/v2/b2_list_buckets`, 'POST', {
            'Authorization': authToken
        }, {
            accountId: accountId
        });

        const bucket = bucketsRes.buckets.find(b => b.bucketName === BUCKET_NAME);
        if (!bucket) {
            throw new Error(`Bucket ${BUCKET_NAME} not found`);
        }

        console.log(`Found bucket: ${bucket.bucketId}. Setting CORS rules...`);

        const corsRules = [
            {
                corsRuleName: "allowAny",
                allowedOrigins: ["https://*", "http://localhost:3000", "http://localhost:3001"],
                allowedOperations: ["b2_upload_file", "b2_download_file_by_name", "b2_download_file_by_id", "s3_put"],
                allowedHeaders: ["*"],
                exposeHeaders: ["x-bz-content-sha1", "x-bz-file-name", "x-bz-file-id", "content-type", "content-length"],
                maxAgeSeconds: 3600
            }
        ];

        // Update Bucket
        // Note: We must provide the bucketId and the type to update it, along with corsRules
        const updateRes = await b2Request(`${apiUrl}/b2api/v2/b2_update_bucket`, 'POST', {
            'Authorization': authToken
        }, {
            bucketId: bucket.bucketId,
            corsRules: corsRules,
            // We must preserve the bucket type if we don't want to change it. usually 'allPrivate' or 'allPublic'.
            // However, b2_update_bucket allows omitting fields to keep them.
            // But checking docs, 'bucketType' might be required or if omitted it stays same?
            // Docs say: "If a field is not present in the request connection, it will not be changed."
        });

        console.log('CORS Updated Successfully!');
        console.log(JSON.stringify(updateRes, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

run();
