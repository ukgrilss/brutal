import { getDownloadToken } from '@/lib/b2-native'

export default async function TestVideoPage() {
    const fileName = 'videos/1769199850504_1000080360.mp4' // Vídeo que sei que existe
    const { finalUrl } = await getDownloadToken(fileName, 3600)
    const proxyUrl = `/api/media/${fileName}`

    return (
        <div className="p-10 space-y-10 bg-black text-white min-h-screen">
            <h1 className="text-3xl font-bold">Teste de Diagnóstico de Vídeo</h1>

            <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-green-500">1. Link Direto (Assinado)</h2>
                    <p className="text-xs text-zinc-500 break-all">{finalUrl}</p>
                    <video
                        src={finalUrl}
                        controls
                        className="w-full aspect-video bg-zinc-900 border border-green-500"
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-blue-500">2. Link via Proxy (Streaming)</h2>
                    <p className="text-xs text-zinc-500 break-all">{proxyUrl}</p>
                    <video
                        src={proxyUrl}
                        controls
                        className="w-full aspect-video bg-zinc-900 border border-blue-500"
                    />
                </div>
            </div>

            <div className="p-4 bg-zinc-800 rounded">
                <p>Se o Vídeo 1 funcionar e o 2 não, o problema é o PROXY.</p>
                <p>Se nenhum funcionar, o problema é o ARQUIVO ou B2.</p>
            </div>
        </div>
    )
}
