import { NextResponse } from 'next/server'
import { getDownloadToken } from '@/lib/b2-native'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params
        const filePath = path.join('/')

        // 1. Generate Signed URL
        const { finalUrl } = await getDownloadToken(filePath, 3600)

        // 2. Redirect (307)
        // Since Direct Signed URL works (verified manually), Redirect should work too.
        return NextResponse.redirect(finalUrl)

    } catch (error: any) {
        console.error('Media Proxy Error:', error)
        return NextResponse.json({ error: 'Media Error' }, { status: 500 })
    }
}
