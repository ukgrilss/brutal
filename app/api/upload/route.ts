import { NextResponse } from 'next/server'
import { getUploadParams } from '@/lib/b2-native'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { filename, contentType } = body

        // Create a Clean Filename
        const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `videos/${Date.now()}_${cleanName}`

        // Get Native B2 Upload Parameters
        const params = await getUploadParams()

        return NextResponse.json({
            uploadUrl: params.uploadUrl,
            authorizationToken: params.authorizationToken,
            key: key, // This is the file name we want frontend to use
            fileName: key
        })
    } catch (error: any) {
        console.error('Error generating B2 upload URL:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 })
    }
}
