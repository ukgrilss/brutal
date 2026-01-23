const https = require('https');

// HARDCODED CREDENTIALS (FROM PREVIOUS SCRIPT)
const KEY_ID = 'c9fcfa158581';
const APP_KEY = '00533018bdb68dbdb201cae2c9ecddae9cfd42c308';
const BUCKET_NAME = 'brutal-b2-x93kd';

function request(url, method, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject({ status: res.statusCode, error: json });
                    }
                } catch (e) {
                    reject({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('1. Authorizing B2...');
    const authString = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64');

    try {
        const auth = await request('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', 'GET', {
            'Authorization': `Basic ${authString}`
        });

        console.log('✅ Authorized!');
        const { apiUrl, authorizationToken, accountId } = auth;

        console.log('2. Finding Bucket ID...');
        const listBuckets = await request(`${apiUrl}/b2api/v2/b2_list_buckets`, 'POST', {
            'Authorization': authorizationToken
        }, {
            accountId: accountId,
            bucketTypes: ['allPrivate', 'allPublic']
        });

        const bucket = listBuckets.buckets.find(b => b.bucketName === BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${BUCKET_NAME} not found`);

        console.log(`✅ Bucket Found: ${bucket.bucketId}`);

        console.log('3. Updating Bucket CORS...');
        const updateRes = await request(`${apiUrl}/b2api/v2/b2_update_bucket`, 'POST', {
            'Authorization': authorizationToken
        }, {
            accountId: accountId,
            bucketId: bucket.bucketId,
            corsRules: [
                {
                    corsRuleName: "allowAny",
                    allowedOrigins: ["*"], // Allow ALL for now (localhost + production)
                    allowedOperations: [
                        "b2_download_file_by_name",
                        "b2_download_file_by_id",
                        "b2_upload_file",
                        "b2_upload_part"
                    ],
                    allowedHeaders: ["authorization", "range", "x-bz-file-name", "x-bz-content-sha1", "content-type", "x-bz-part-number"],
                    exposeHeaders: ["x-bz-content-sha1"],
                    maxAgeSeconds: 3600
                }
            ]
        });

        console.log('✅ CORS Applied Successfully via Native API!');
        console.log('Revision:', updateRes.revision);

    } catch (e) {
        console.error('❌ Error:', JSON.stringify(e, null, 2));
    }
}

main();
