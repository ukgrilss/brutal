import { NextResponse } from 'next/server'

const ID = process.env.B2_ACCESS_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
const KEY = process.env.B2_SECRET_ACCESS_KEY || process.env.B2_APPLICATION_KEY;
const BUCKET_NAME = process.env.B2_BUCKET_NAME;

async function b2Authorize() {
    const authString = Buffer.from(`${ID}:${KEY}`).toString('base64');
    const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { 'Authorization': `Basic ${authString}` },
        cache: 'no-store'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function b2ListBuckets(authData: any) {
    const res = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
        method: 'POST',
        headers: { 'Authorization': authData.authorizationToken },
        body: JSON.stringify({ accountId: authData.accountId })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

async function b2UpdateBucket(authData: any, bucketId: string) {
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

    const res = await fetch(`${authData.apiUrl}/b2api/v2/b2_update_bucket`, {
        method: 'POST',
        headers: { 'Authorization': authData.authorizationToken },
        body: JSON.stringify({
            bucketId: bucketId,
            corsRules: corsRules
        })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function GET() {
    try {
        if (!ID || !KEY || !BUCKET_NAME) {
            return NextResponse.json({ error: 'Missing creds' }, { status: 500 });
        }

        const auth = await b2Authorize();
        const buckets = await b2ListBuckets(auth);
        const bucket = buckets.buckets.find((b: any) => b.bucketName === BUCKET_NAME);

        if (!bucket) {
            return NextResponse.json({ error: 'Bucket not found' }, { status: 404 });
        }

        const result = await b2UpdateBucket(auth, bucket.bucketId);

        return NextResponse.json({ success: true, result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
