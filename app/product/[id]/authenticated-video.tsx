'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthenticatedVideoProps {
    src: string // The original B2 URL (unsigned)
    className?: string
}

export function AuthenticatedVideo({ src, className }: AuthenticatedVideoProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        // If it's not a B2 URL, use it directly
        if (!src.includes('backblazeb2.com')) {
            setSignedUrl(src)
            return
        }

        // Fetch signed URL
        fetch('/api/sign-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: src })
        })
            .then(res => res.json())
            .then(data => {
                if (data.signedUrl) {
                    setSignedUrl(data.signedUrl)
                } else {
                    console.error('Sign URL failed:', data)
                    setError(true)
                }
            })
            .catch(err => {
                console.error('Sign URL network error:', err)
                setError(true)
            })
    }, [src])

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-zinc-900 border border-red-900 text-red-500 text-xs p-4 text-center ${className}`}>
                Erro ao autenticar vídeo.
            </div>
        )
    }

    if (!signedUrl) {
        return (
            <div className={`flex items-center justify-center bg-zinc-900 text-zinc-500 ${className}`}>
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        )
    }

    return (
        <video
            src={signedUrl}
            controls
            playsInline
            preload="metadata"
            className={className}
            onError={(e) => {
                console.error('Video Playback Error', e)
                // Fallback UI handled by parent mostly, but we can show something
            }}
        />
    )
}
