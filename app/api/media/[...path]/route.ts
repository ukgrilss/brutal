import { NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/b2-native'

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        // Path comes as ['videos', 'filename.mp4'] or ['images', 'file.png']
        const filePath = params.path.join('/')

        // 1. Generate Signed URL (valid for 1 hour?)
        const { finalUrl } = await getDownloadToken(filePath, 3600)

        // 2. Stream (Avoid Redirect for maximum compatibility)
        const b2Res = await fetch(finalUrl)

        if (!b2Res.ok) {
            console.error('B2 Fetch Error:', b2Res.status, b2Res.statusText)
            return NextResponse.json({ error: 'Upstream Error' }, { status: b2Res.status })
        }

        const headers = new Headers()
        headers.set('Content-Type', b2Res.headers.get('Content-Type') || 'application/octet-stream')
        headers.set('Content-Length', b2Res.headers.get('Content-Length') || '')
        headers.set('Cache-Control', 'public, max-age=3600')
        // Important for video seeking
        headers.set('Accept-Ranges', 'bytes')

        return new NextResponse(b2Res.body as any, {
            status: 200,
            headers
        })

    } catch (error: any) {
        console.error('Media Proxy Error:', error)
        return NextResponse.json({ error: 'Media Error' }, { status: 500 })
    }
}
