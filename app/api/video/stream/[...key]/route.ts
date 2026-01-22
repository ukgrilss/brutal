import { NextRequest, NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/b2-native'

export async function GET(req: NextRequest, context: { params: Promise<{ key: string[] }> }) {
    try {
        const { key } = await context.params
        const fileKey = key.join('/')

        // TODO: Add proper auth check here if strictly needed. 
        // Currently relies on the fact that the Key is known.

        // Get signed URL for the file
        const { finalUrl } = await getDownloadToken(fileKey)

        // Forward Range header for video seeking
        const range = req.headers.get('range')
        const fetchHeaders = new Headers()
        if (range) fetchHeaders.set('Range', range)

        const b2Res = await fetch(finalUrl, {
            headers: fetchHeaders
        })

        if (!b2Res.ok) {
            console.error('B2 Stream Error:', b2Res.status, b2Res.statusText)
            return new NextResponse('Video not found or access denied', { status: b2Res.status })
        }

        const resHeaders = new Headers()
        resHeaders.set('Content-Type', b2Res.headers.get('Content-Type') || 'video/mp4')
        resHeaders.set('Accept-Ranges', 'bytes')

        const contentLength = b2Res.headers.get('Content-Length')
        if (contentLength) resHeaders.set('Content-Length', contentLength)

        const contentRange = b2Res.headers.get('Content-Range')
        if (contentRange) resHeaders.set('Content-Range', contentRange)

        return new NextResponse(b2Res.body, {
            status: b2Res.status,
            headers: resHeaders
        })
    } catch (e: any) {
        console.error('Video Proxy Error:', e)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
