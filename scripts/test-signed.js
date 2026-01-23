const https = require('https');

// HARDCODED CREDENTIALS
const KEY_ID = 'c9fcfa158581';
const APP_KEY = '00533018bdb68dbdb201cae2c9ecddae9cfd42c308';
const BUCKET_NAME = 'brutal-b2-x93kd';
const FILE_NAME = 'videos/1769199850504_1000080360.mp4'; // O arquivo que encontrei antes

async function request(url, method, headers, body) {
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

        const { apiUrl, authorizationToken, downloadUrl, accountId } = auth;

        console.log('2. Get Bucket ID...');
        const buckets = await request(`${apiUrl}/b2api/v2/b2_list_buckets`, 'POST', { 'Authorization': authorizationToken }, { accountId });
        const bucket = buckets.buckets.find(b => b.bucketName === BUCKET_NAME);

        console.log('3. Get Download Auth...');
        const tokenRes = await request(`${apiUrl}/b2api/v2/b2_get_download_authorization`, 'POST', { 'Authorization': authorizationToken }, {
            bucketId: bucket.bucketId,
            fileNamePrefix: FILE_NAME,
            validDurationInSeconds: 3600
        });

        const finalUrl = `${downloadUrl}/file/${BUCKET_NAME}/${FILE_NAME}?Authorization=${tokenRes.authorizationToken}`;
        console.log('--- SIGNED URL ---');
        console.log(finalUrl);

        console.log('4. Head Check Signed URL...');
        https.get(finalUrl, (res) => {
            console.log('Status:', res.statusCode);
            console.log('Headers:', res.headers);
        }).on('error', console.error);

    } catch (e) {
        console.error(e);
    }
}

main();
