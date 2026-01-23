'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthenticatedVideoProps {
    src: string // The original B2 URL (unsigned)
    className?: string
}

export function AuthenticatedVideo({ src, className }: AuthenticatedVideoProps) {
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // If it's not a B2 URL, use it directly
        if (!src.includes('backblazeb2.com')) {
            setSignedUrl(src)
            return
        }

        // Fetch signed URL
        const controller = new AbortController()
        fetch('/api/sign-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: src }),
            signal: controller.signal
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
                if (err.name !== 'AbortError') {
                    console.error('Sign URL network error:', err)
                    setError(true)
                }
            })

        return () => controller.abort()
    }, [src])

    // Toggle Play
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    // Handle end of video
    useEffect(() => {
        const video = videoRef.current
        const onEnded = () => setIsPlaying(false)
        const onPause = () => setIsPlaying(false)
        const onPlay = () => setIsPlaying(true)

        if (video) {
            video.addEventListener('ended', onEnded)
            video.addEventListener('pause', onPause)
            video.addEventListener('play', onPlay)
        }

        return () => {
            if (video) {
                video.removeEventListener('ended', onEnded)
                video.removeEventListener('pause', onPause)
                video.removeEventListener('play', onPlay)
            }
        }
    }, [signedUrl]) // Re-attach when url changes and ref is populated

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
        <div className={`relative group ${className}`} onContextMenu={(e) => e.preventDefault()}>
            <video
                ref={videoRef}
                src={signedUrl}
                className="w-full h-full object-contain"
                playsInline
                preload="metadata"
                controlsList="nodownload"
                disablePictureInPicture
                onClick={togglePlay}
                onError={(e) => console.error('Video Error', e)}
            />
            {/* Custom Play Button Overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl transition-transform hover:scale-110">
                        <svg className="w-8 h-8 text-white fill-white ml-1" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    )
}
