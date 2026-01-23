export function getMediaUrl(originalUrl: string | null | undefined): string {
    if (!originalUrl) return '/placeholder.png'

    // If it's a B2 URL, convert to Proxy
    if (originalUrl.includes('backblazeb2.com')) {
        // Extract path after /file/<bucket>/
        // Example: https://f005.backblazeb2.com/file/brutal-b2-x93kd/videos/123.mp4
        // We want: /api/media/videos/123.mp4

        const parts = originalUrl.split('/file/')
        if (parts.length === 2) {
            const pathParts = parts[1].split('/')
            // pathParts = ['bucket-name', 'videos', '123.mp4']
            // Remove bucket name (first element)
            const filePath = pathParts.slice(1).join('/')
            return `/api/media/${filePath}`
        }
    }

    // If already local or external non-B2, return as is
    return originalUrl
}
