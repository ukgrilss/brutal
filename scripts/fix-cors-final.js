const https = require('https');

const ID = 'c9fcfa158581';
const KEY = '00533018bdb68dbdb201cae2c9ecddae9cfd42c308';
const BUCKET_NAME = 'brutal-b2-x93kd';

function b2Request(endpoint, method, headers, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint);
        const req = https.request({
            hostname: url.hostname,
            path: url.pathname + url.search,
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

async function run() {
    try {
        console.log('Authorizing B2...');
        const authString = Buffer.from(`${ID}:${KEY}`).toString('base64');
        const authData = await b2Request('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', 'GET', {
            'Authorization': `Basic ${authString}`
        });

        console.log('Finding bucket ID for:', BUCKET_NAME);
        const bucketsData = await b2Request(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, 'POST', {
            'Authorization': authData.authorizationToken
        }, {
            accountId: authData.accountId,
            bucketTypes: ['allPrivate', 'allPublic']
        });

        const bucket = bucketsData.buckets.find(b => b.bucketName === BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${BUCKET_NAME} not found`);

        console.log(`Setting CORS on bucket: ${bucket.bucketId}`);

        const result = await b2Request(`${authData.apiUrl}/b2api/v2/b2_update_bucket`, 'POST', {
            'Authorization': authData.authorizationToken
        }, {
            bucketId: bucket.bucketId,
            corsRules: [
                {
                    corsRuleName: "allowEverything",
                    allowedOrigins: ["https://*", "http://*"],
                    allowedOperations: [
                        "b2_upload_file",
                        "b2_download_file_by_name",
                        "b2_download_file_by_id",
                        "b2_upload_part"
                    ],
                    allowedHeaders: ["*"],
                    exposeHeaders: ["x-bz-content-sha1", "x-bz-file-name", "x-bz-file-id", "content-type", "content-length"],
                    maxAgeSeconds: 3600
                }
            ]
        });

        console.log('SUCCESS: CORS Updated!');
        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error('FAILED:', JSON.stringify(e, null, 2));
        process.exit(1);
    }
}

run();
