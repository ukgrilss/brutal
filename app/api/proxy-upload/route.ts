import { NextResponse } from 'next/server'
import { uploadToB2 } from '@/lib/b2-native'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const typeStr = formData.get('type') as string || 'image' // 'image' | 'video'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const folder = typeStr === 'video' ? 'videos' : 'images'

        // Use the native upload function which handles auth and B2 API
        const result = await uploadToB2(file, folder)

        return NextResponse.json({
            url: result.url,
            // Return compatibility format for frontend
            publicUrl: result.url,
            key: result.key
        })

    } catch (error: any) {
        console.error('Proxy Upload Error:', error)
        return NextResponse.json(
            { error: error.message || 'Upload failed' },
            { status: 500 }
        )
    }
}
