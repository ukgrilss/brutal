import { NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/b2-native'

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
    // Await params in newer Next.js versions if needed, or just access directly if not dynamic io
    const { path } = await context.params
    const fileKey = path.join('/')

    try {
        // Get authorized URL from B2 (handles private buckets)
        const { finalUrl } = await getDownloadToken(fileKey, 86400) // 24h validity for the internal fetch, but we proxy stream immediately

        const response = await fetch(finalUrl)

        if (!response.ok) {
            return new NextResponse('File not found on storage', { status: 404 })
        }

        const headers = new Headers()
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream')
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')

        return new NextResponse(response.body, {
            status: 200,
            headers
        })

    } catch (error: any) {
        console.error('File Proxy Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
