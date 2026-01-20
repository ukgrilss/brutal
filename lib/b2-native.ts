import { NextResponse } from "next/server";

// Configuration from Env
const KEY_ID = process.env.B2_ACCESS_KEY_ID!;
const APP_KEY = process.env.B2_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.B2_BUCKET_NAME!;

// Cache for Auth Data (Simple in-memory for warm lambdas)
let authCache: {
    apiUrl: string;
    authorizationToken: string;
    downloadUrl: string;
    recommendedPartSize: number;
    absoluteMinimumPartSize: number;
    s3ApiUrl: string;
    bucketId?: string; // We might need to look this up
} | null = null;

async function authorize() {
    if (authCache) return authCache;

    const authString = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64');

    const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: {
            'Authorization': `Basic ${authString}`
        },
        cache: 'no-store'
    });

    if (!res.ok) {
        const err = await res.json();
        console.error('B2 Auth Error:', err);
        throw new Error(`Failed to authorize B2: ${err.message || res.statusText}`);
    }

    const data = await res.json();

    authCache = {
        apiUrl: data.apiUrl,
        authorizationToken: data.authorizationToken,
        downloadUrl: data.downloadUrl,
        recommendedPartSize: data.recommendedPartSize,
        absoluteMinimumPartSize: data.absoluteMinimumPartSize,
        s3ApiUrl: data.s3ApiUrl,
        bucketId: data.allowed?.bucketId // Might be undefined if key is not restricted
    };

    return authCache;
}

async function getBucketId() {
    const auth = await authorize();
    if (auth?.bucketId) return auth.bucketId;

    // If key is master or has access to all buckets, we need to find our bucket ID
    const res = await fetch(`${auth!.apiUrl}/b2api/v2/b2_list_buckets`, {
        method: 'POST',
        headers: { 'Authorization': auth!.authorizationToken },
        body: JSON.stringify({
            accountId: KEY_ID.substring(0, 12) // Usually account ID is prefix, but for list_buckets usually accountId is required parameter. Wait. 
            // In b2_authorize_account response, accountId is returned. 
            // Let's check authorize response structure more carefully or just rely on 'accountId' from response if possible.
            // Actually, for list_buckets, we need 'accountId'. 
        })
    });

    // Correction: accountId is returned in authorize response.
    // Hack: We don't have accountID in cache. Let's add it or simpler:
    // We can just iterate if we can or pass accountId.
    // Actually, `b2_authorize_account` returns `accountId`. Let's assume we can get it.

    // Better strategy for MVP: 
    // Just use `b2_list_buckets` with the accountId derived from KEY_ID? 
    // Legacy keys: KeyID is AccountID (12 chars). 
    // App Keys (Master): KeyID is AccountID (12 chars).
    // App Keys (Non-Master): KeyID is 'K' + ... or longer.
    // Actually, let's look at the B2 response again. `accountId` IS returned.

    // Re-doing authorize to return accountId
    throw new Error("Bucket ID resolution needed and not implemented fully without accountId. Please ensure Key is restricted to bucket OR implement list_buckets with accountId.");
}

// Improved Authorize to include accountId
async function authorizeWithAccountId() {
    if (!KEY_ID || !APP_KEY) {
        throw new Error('Missing B2_ACCESS_KEY_ID or B2_SECRET_ACCESS_KEY env vars');
    }

    // Basic Auth Header
    const authString = Buffer.from(`${KEY_ID}:${APP_KEY}`).toString('base64');

    try {
        const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
            headers: { 'Authorization': `Basic ${authString}` },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('B2 Auth Failed. Status:', res.status);
            console.error('B2 Auth Response:', errorText);
            console.error('Using KeyID:', KEY_ID.substring(0, 4) + '...');
            throw new Error(`B2 Auth Failed: ${res.status} ${res.statusText} - ${errorText}`);
        }

        return await res.json();
    } catch (error: any) {
        console.error('B2 Authorization Network/Logic Error:', error);
        throw error;
    }
}

export async function getUploadParams() {
    const auth = await authorizeWithAccountId();

    let targetBucketId = auth.allowed?.bucketId;

    if (!targetBucketId) {
        // Find bucket by name
        const listRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
            method: 'POST',
            headers: { 'Authorization': auth.authorizationToken },
            body: JSON.stringify({
                accountId: auth.accountId,
                bucketTypes: ['allPrivate', 'allPublic']
            })
        });

        const listData = await listRes.json();
        const bucket = listData.buckets?.find((b: any) => b.bucketName === BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${BUCKET_NAME} not found`);
        targetBucketId = bucket.bucketId;
    }

    // Get Upload URL
    const uploadRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: { 'Authorization': auth.authorizationToken },
        body: JSON.stringify({ bucketId: targetBucketId })
    });

    if (!uploadRes.ok) throw new Error('Failed to get upload URL');

    const uploadData = await uploadRes.json();

    return {
        uploadUrl: uploadData.uploadUrl,
        authorizationToken: uploadData.authorizationToken,
        bucketId: targetBucketId
    };
}

export async function getDownloadToken(fileName: string, durationInSeconds = 10800) { // 3 hours
    const auth = await authorizeWithAccountId();
    let targetBucketId = auth.allowed?.bucketId;

    if (!targetBucketId) {
        // Resolve bucket ID again (optimize this with cache in prod)
        const listRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets`, {
            method: 'POST',
            headers: { 'Authorization': auth.authorizationToken },
            body: JSON.stringify({
                accountId: auth.accountId,
                bucketTypes: ['allPrivate', 'allPublic']
            })
        });
        const listData = await listRes.json();
        const bucket = listData.buckets?.find((b: any) => b.bucketName === BUCKET_NAME);
        if (!bucket) throw new Error(`Bucket ${BUCKET_NAME} not found`);
        targetBucketId = bucket.bucketId;
    }

    const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
        method: 'POST',
        headers: { 'Authorization': auth.authorizationToken },
        body: JSON.stringify({
            bucketId: targetBucketId,
            fileNamePrefix: fileName,
            validDurationInSeconds: durationInSeconds
        })
    });

    if (!res.ok) throw new Error('Failed to get download token');
    const data = await res.json();

    // Construct the final download URL
    // Format: https://f002.backblazeb2.com/file/<bucket_name>/<file_name>?Authorization=<token>
    const finalUrl = `${auth.downloadUrl}/file/${BUCKET_NAME}/${fileName}?Authorization=${data.authorizationToken}`;

    return {
        authorizationToken: data.authorizationToken,
        downloadUrl: auth.downloadUrl,
        bucketName: BUCKET_NAME,
        finalUrl: finalUrl // Return constructed URL directly
    };
}
