import { NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/b2-native'

export async function POST(request: Request) {
    try {
        const { path } = await request.json()
        if (!path) return NextResponse.json({ error: 'Path required' }, { status: 400 })

        // Remove leading slash if any
        const cleanPath = path.startsWith('/') ? path.substring(1) : path

        // Clean potentially full URL inputs if passed
        // If path is "https://f005.backblazeb2.com/file/bucket/videos/123.mp4"
        // Extract "videos/123.mp4"
        let filePath = cleanPath
        if (cleanPath.includes('/file/')) {
            const parts = cleanPath.split('/file/')
            if (parts[1]) {
                const subParts = parts[1].split('/') // [bucket, folder, file]
                filePath = subParts.slice(1).join('/')
            }
        }

        // Generate Token
        const { finalUrl } = await getDownloadToken(filePath, 3600)

        return NextResponse.json({ signedUrl: finalUrl })

    } catch (error: any) {
        console.error('Sign URL Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
