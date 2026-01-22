'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { startVideoSession } from './actions'
import { incrementVideoView, toggleVideoLike } from './metrics'
import { Loader2, Lock, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

import 'vidstack/styles/defaults.css';
import 'vidstack/styles/community-skin/video.css';
import { MediaPlayer, MediaOutlet, MediaCommunitySkin, MediaPoster } from '@vidstack/react';

export function VideoPlayer({ product, hasAccess = false }: { product: any, hasAccess?: boolean }) {
    const playerRef = useRef<any>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [likes, setLikes] = useState(product.likes || 0)
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        // Increment View
        incrementVideoView(product.id)

        // Fetch signed URL on mount
        startVideoSession(product.id)
            .then(res => {
                if (res.success && res.url) {
                    setVideoUrl(res.url)
                } else {
                    setError(res.error || 'Erro ao carregar vídeo.')
                }
            })
            .catch(() => setError('Falha na conexão.'))
    }, [product.id])

    async function handleLike() {
        setLikes((p: number) => p + 1) // Optimistic update
        await toggleVideoLike(product.id)
    }

    // Force video to start at 0s for preview users to prevent "stuck at end" loops
    const onProviderChange = useCallback((provider: any) => {
        if (!hasAccess && provider) {
            provider.currentTime = 0
        }
    }, [hasAccess])

    const handleTimeUpdate = useCallback((event: any) => {
        if (hasAccess) return

        try {
            const previewLimit = product.previewDuration || 0
            // Vidstack sends detailed events, but let's be safe extracting time
            let currentTime = 0
            if (typeof event === 'number') {
                currentTime = event
            } else if (event?.currentTime !== undefined) {
                currentTime = event.currentTime
            } else if (event?.detail?.currentTime !== undefined) {
                currentTime = event.detail.currentTime
            } else if (playerRef.current) {
                currentTime = playerRef.current.currentTime
            }

            if (previewLimit > 0 && currentTime >= previewLimit) {
                if (!isLocked) {
                    setIsLocked(true)
                    if (playerRef.current) {
                        playerRef.current.pause()
                        // Optional: Reset to 0?
                        // playerRef.current.currentTime = 0;
                    }
                }
            }
        } catch (err) {
            console.error('TimeUpdate Error:', err)
        }
    }, [hasAccess, product.previewDuration, isLocked])

    if (error) {
        return (
            <div className="w-full aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center text-red-500 border border-red-900/30">
                <Lock className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-bold">{error}</p>
                <p className="text-sm text-zinc-500 mt-2">Tente recarregar a página.</p>
            </div>
        )
    }

    if (!videoUrl) {
        return (
            <div className="w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
        )
    }

    // Attempt to find a poster image
    const posterUrl = product.media.find((m: any) => m.type === 'IMAGE')?.url

    return (
        <div className="space-y-4">
            <div className="w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group relative bg-black">
                <MediaPlayer
                    ref={playerRef}
                    title={product.name}
                    src={videoUrl}
                    className="w-full h-full aspect-video"
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onContextMenu={(e: any) => e.preventDefault()}
                    onProviderChange={onProviderChange}
                    onLoadStart={() => console.log('Video Loading Started:', videoUrl)}
                    onCanPlay={() => console.log('Video Can Play!')}
                    onWaiting={() => console.log('Video Buffering/Waiting...')}
                    onError={(e: any) => {
                        console.error('Video Player Error:', e)
                        // Show error on screen for debugging
                        const msg = e?.detail?.message || e?.type || 'Erro desconhecido';
                        setError(`Erro no Player: ${msg}. (Tente recarregar)`)
                    }}
                    storage={null} // Disable Vidstack local storage persistence
                >
                    <MediaOutlet>
                        {posterUrl && <MediaPoster src={posterUrl} alt={product.name} />}
                    </MediaOutlet>
                    <MediaCommunitySkin />
                </MediaPlayer>

                {/* Locking Overlay - OUTSIDE PLAYER */}
                {isLocked && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-red-600/20 flex items-center justify-center mb-3 md:mb-4 border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                            <Lock className="w-5 h-5 md:w-8 md:h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Fim da Degustação</h2>
                        <p className="text-xs md:text-base text-zinc-400 mb-4 md:mb-6 max-w-[280px] md:max-w-md leading-relaxed">
                            Você assistiu ao tempo gratuito permitido. Para continuar, adquira o acesso completo.
                        </p>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm md:text-lg px-6 py-4 md:px-8 md:py-6 rounded-xl shadow-xl hover:scale-105 transition-all h-auto"
                            onClick={() => {
                                document.getElementById('checkout-area')?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            Comprar Acesso Completo
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span>{product.fakeViews || product.views || 0} visualizações</span>
                </div>

                <Button
                    variant="ghost"
                    onClick={handleLike}
                    className="text-white hover:text-red-500 hover:bg-white/5 flex items-center gap-2"
                >
                    <Heart className="w-5 h-5" />
                    Curtir ({likes})
                </Button>
            </div>
        </div>
    )
}
