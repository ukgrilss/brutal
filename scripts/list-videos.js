const https = require('https');

// HARDCODED CREDENTIALS
const KEY_ID = 'c9fcfa158581';
const APP_KEY = '00533018bdb68dbdb201cae2c9ecddae9cfd42c308';
const BUCKET_NAME = 'brutal-b2-x93kd';

function request(url, method, headers, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
                    else reject({ status: res.statusCode, error: json });
                } catch (e) { reject({ status: res.statusCode, raw: data }); }
            });
        });
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    try {
        console.log('1. Auth...');
        const auth = await request('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', 'GET', {
            'Authorization': 'Basic ' + Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64')
        });

        const { apiUrl, authorizationToken, accountId, downloadUrl } = auth;

        console.log('2. List Buckets...');
        const buckets = await request(`${apiUrl}/b2api/v2/b2_list_buckets`, 'POST', { 'Authorization': authorizationToken }, { accountId });
        const bucket = buckets.buckets.find(b => b.bucketName === BUCKET_NAME);

        console.log('3. List Videos...');
        const files = await request(`${apiUrl}/b2api/v2/b2_list_file_names`, 'POST', { 'Authorization': authorizationToken }, {
            bucketId: bucket.bucketId,
            startFileName: 'videos/', // Prefix? No, B2 uses startFileName for pagination. But we can iterate.
            prefix: 'videos/',
            maxFileCount: 20
        });

        console.log('--- RECENT VIDEOS ---');
        files.files.forEach(f => {
            console.log(`[${f.contentType}] ${f.fileName} (${(f.contentLength / 1024 / 1024).toFixed(2)} MB)`);
            const url = `${downloadUrl}/file/${BUCKET_NAME}/${f.fileName}`;
            console.log(`   URL: ${url}`);
        });

    } catch (e) {
        console.error(e);
    }
}

main();
