import { NextResponse } from 'next/server'
import { getUploadParams } from '@/lib/b2-native'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { filename, contentType, type = 'video' } = body // type: 'image' | 'video'

        // Create a Clean Filename
        const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Organize by type: images/ or videos/
        const folder = type === 'image' ? 'images' : 'videos'
        const key = `${folder}/${Date.now()}_${cleanName}`

        // Get Native B2 Upload Parameters
        const params = await getUploadParams()

        return NextResponse.json({
            uploadUrl: params.uploadUrl,
            authorizationToken: params.authorizationToken,
            key: key,
            fileName: key,
            publicUrl: `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`
        })
    } catch (error: any) {
        console.error('Error generating B2 upload URL:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 })
    }
}
