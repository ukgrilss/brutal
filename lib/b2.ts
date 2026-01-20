import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const B2_ENDPOINT = process.env.B2_ENDPOINT || ''
const B2_REGION = process.env.B2_REGION || 'us-east-005'
const B2_ACCESS_KEY_ID = process.env.B2_ACCESS_KEY_ID || ''
const B2_SECRET_ACCESS_KEY = process.env.B2_SECRET_ACCESS_KEY || ''
export const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || ''

export const s3Client = new S3Client({
    endpoint: B2_ENDPOINT,
    region: B2_REGION,
    credentials: {
        accessKeyId: B2_ACCESS_KEY_ID,
        secretAccessKey: B2_SECRET_ACCESS_KEY
    }
})

// Generate URL for Uploading (PUT)
export async function generatePresignedUploadUrl(key: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: key,
        ContentType: contentType
    })
    return getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

// Generate URL for Viewing (GET)
export async function generateSignedPlaybackUrl(key: string) {
    const command = new GetObjectCommand({
        Bucket: B2_BUCKET_NAME,
        Key: key
    })
    return getSignedUrl(s3Client, command, { expiresIn: 3600 * 3 }) // 3 hours valid
}
