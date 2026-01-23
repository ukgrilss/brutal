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

        // 2. Redirect
        return NextResponse.redirect(finalUrl)

    } catch (error: any) {
        console.error('Media Proxy Error:', error)
        return NextResponse.json({ error: 'Media Error' }, { status: 500 })
    }
}
