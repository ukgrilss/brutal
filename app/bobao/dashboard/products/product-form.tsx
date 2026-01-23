'use client'

import { useState } from 'react'
import { createProduct, updateProduct, deleteMedia } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    groupLink: string | null;
    type?: string;
    contentUrl?: string;
    previewUrl?: string;
    categoryId: string | null;
    media: { id: string, type: string, url: string }[];
    plans?: { id?: string, name: string, price: number }[];
}

interface ProductFormProps {
    categories: Category[];
    product?: Product | null;
}

export function ProductForm({ categories, product }: ProductFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0) // Video upload progress
    const [productType, setProductType] = useState<'GROUP' | 'VIDEO'>(product?.type as 'GROUP' | 'VIDEO' || 'GROUP')
    const [plans, setPlans] = useState<{ name: string, price: number }[]>(
        product?.plans?.map(p => ({ name: p.name, price: p.price / 100 })) || []
    )
    const [pricingType, setPricingType] = useState<'single' | 'plans'>(
        (product?.plans && product?.plans.length > 0) ? 'plans' : 'single'
    )

    // Video specific state
    const [contentUrl, setContentUrl] = useState(product?.contentUrl || '')
    const [previewUrl, setPreviewUrl] = useState(product?.previewUrl || '')

    // Media Gallery State
    const [mediaItems, setMediaItems] = useState<{ id?: string, type: 'IMAGE' | 'VIDEO', url: string, isUploading?: boolean }[]>(
        product?.media?.map(m => ({ id: m.id, type: m.type as 'IMAGE' | 'VIDEO', url: m.url })) || []
    )
    const [mediaUploadProgress, setMediaUploadProgress] = useState(0)

    const router = useRouter()

    function addPlan() {
        setPlans([...plans, { name: '', price: 0 }])
    }

    function removePlan(index: number) {
        setPlans(plans.filter((_, i) => i !== index))
    }

    function updatePlan(index: number, field: 'name' | 'price', value: string) {
        const newPlans = [...plans]
        if (field === 'price') {
            newPlans[index].price = parseFloat(value) || 0
        } else {
            newPlans[index].name = value
        }
        setPlans(newPlans)
    }

    // Helper for upload (Video = Direct XHR; Image = Proxy)
    async function uploadFileToB2(file: File, onProgress?: (pct: number) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                // VIDEO: Direct Upload to B2 (Bypass Vercel 4.5MB limit)
                if (file.type.startsWith('video')) {
                    // 1. Get Params from Server
                    const paramsRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: JSON.stringify({
                            filename: file.name,
                            contentType: file.type,
                            type: 'video'
                        })
                    })

                    if (!paramsRes.ok) {
                        const err = await paramsRes.json().catch(() => ({}))
                        throw new Error(err.error || 'Falha ao obter permissão de upload')
                    }

                    const params = await paramsRes.json()
                    const { uploadUrl, authorizationToken, key, publicUrl } = params

                    // 2. Direct XHR Upload
                    const xhr = new XMLHttpRequest()
                    xhr.open('POST', uploadUrl, true)

                    xhr.setRequestHeader('Authorization', authorizationToken)
                    // Encode URL but restore slashes for folder structure (optional, B2 handles encoded slashes too usually)
                    // Ensuring safe filename encoding
                    xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(key).split('%2F').join('/'))
                    xhr.setRequestHeader('Content-Type', file.type)
                    xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify')

                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable && onProgress) {
                            const percentComplete = (e.loaded / e.total) * 100
                            onProgress(percentComplete)
                        }
                    }

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(publicUrl)
                        } else {
                            try {
                                const resp = JSON.parse(xhr.responseText)
                                reject(resp.message || resp.code || `Erro B2: ${xhr.status}`)
                            } catch (e) {
                                reject(`Erro B2: ${xhr.status} ${xhr.responseText}`)
                            }
                        }
                    }

                    xhr.onerror = () => reject('Erro de rede no upload (XHR)')

                    xhr.send(file)
                    return
                }

                // IMAGE: Use Proxy (Simpler)
                const formData = new FormData()
                formData.append('file', file)
                formData.append('type', 'image')

                const res = await fetch('/api/proxy-upload', {
                    method: 'POST',
                    body: formData
                })

                if (!res.ok) {
                    const errText = await res.text()
                    throw new Error(errText || 'Upload falhou')
                }

                const data = await res.json()
                if (data.error) throw new Error(data.error)

                if (onProgress) onProgress(100)
                resolve(data.publicUrl || data.url)

            } catch (e: any) {
                console.error('Upload Error:', e)
                reject(e.message)
            }
        })
    }

    async function handleMediaSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files
        if (!files || files.length === 0) return

        setIsLoading(true)
        const newItems = Array.from(files).map(file => ({
            type: file.type.startsWith('video') ? 'VIDEO' as const : 'IMAGE' as const,
            url: URL.createObjectURL(file), // Preview temporário
            isUploading: true,
            file // Guardar referência
        }))

        // Adiciona placeholders na UI imediatamente
        const startIndex = mediaItems.length
        setMediaItems(prev => [...prev, ...newItems])

        // Upload um por um
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                setMediaUploadProgress(((i + 1) / files.length) * 100)

                const realUrl = await uploadFileToB2(file)

                // Atualiza item com URL real e remove flag de upload
                setMediaItems(prev => {
                    const copy = [...prev]
                    const targetIndex = startIndex + i
                    if (copy[targetIndex]) {
                        copy[targetIndex] = { ...copy[targetIndex], url: realUrl, isUploading: false }
                    }
                    return copy
                })
            }
        } catch (error) {
            console.error(error)
            alert('Algumas imagens falharam no upload. Tente novamente.')
        } finally {
            setIsLoading(false)
            setMediaUploadProgress(0)
            // Limpar input
            if (event.target) event.target.value = ''
        }
    }

    async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        try {
            const uploadedUrl = await uploadFileToB2(file, (p) => setUploadProgress(p))
            // Extract Key from URL if needed, or just store the full URL
            // Current implementation expects 'contentUrl' to be the key for B2,
            // but for simplicity let's store the full URL or extract Key.
            // B2 Native download URL format: .../file/<bucket>/<key>

            // Wait, previous implementation stored KEY in contentUrl.
            // Let's keep consistency if possible, or migrate to full URL.
            // My uploadFileToB2 returns publicUrl. 
            // Let's assume contentUrl can be a full URL now or we extract the key.
            // For now, I'll store what uploadFileToB2 returns.
            // Ideally we should extract the key if the backend expects a key.
            // But let's check validation.

            // Extract key from publicUrl if possible to be safe
            // publicUrl: https://f005.backblazeb2.com/file/BUCKET/folder/file
            const parts = uploadedUrl.split(`/file/${process.env.NEXT_PUBLIC_B2_BUCKET_NAME || 'brutal-b2-x93kd'}/`)
            const key = parts[1] || uploadedUrl

            setContentUrl(key)
            setIsLoading(false)
            setUploadProgress(0)

        } catch (error: any) {
            console.error('Upload Error Details:', error)
            const safeMsg = error?.message || 'Erro desconhecido'
            alert(`[V4-FIX] Erro ao iniciar upload: ${safeMsg}`)
            setIsLoading(false)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (mediaItems.some(m => m.isUploading)) {
            alert('Aguarde o término dos uploads.')
            return
        }

        setIsLoading(true)
        const formData = new FormData(event.currentTarget)

        // Append plans as JSON
        formData.append('plans', JSON.stringify(plans))

        // Append Media URLs as JSON
        const mediaToSave = mediaItems.map(m => ({ type: m.type, url: m.url }))
        formData.append('media_json', JSON.stringify(mediaToSave))

        // Append Video Fields
        if (productType === 'VIDEO') {
            formData.append('type', 'VIDEO')
            formData.append('contentUrl', contentUrl)
        } else {
            formData.append('type', 'GROUP')
        }

        let result
        try {
            if (product) {
                result = await updateProduct(product.id, formData)
            } else {
                result = await createProduct(formData)
            }

            if (result && result.success) {
                router.push('/bobao/dashboard/products')
                router.refresh()
            } else {
                alert(result?.error || 'Erro desconhecido ao salvar.')
            }
        } catch (error: any) {
            console.error(error)
            alert(`Erro crítico: ${error.message || 'Falha ao conectar com o servidor.'}`)
        } finally {
            setIsLoading(false)
        }
    }

    async function handleDeleteMediaItem(index: number) {
        if (!confirm('Remover esta imagem? (Se já salvo, será apagada ao salvar o produto)')) return
        setMediaItems(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800">

            {/* Type Selector */}
            <div className="space-y-4 pt-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
                <Label className="text-base">Tipo de Produto</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        onClick={() => setProductType('GROUP')}
                        className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${productType === 'GROUP' ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200'}`}
                    >
                        <span className="font-bold text-sm">Grupo VIP / Comunidade</span>
                        <span className="text-xs text-zinc-500 text-center">Entrega um link de acesso após a compra.</span>
                    </div>
                    <div
                        onClick={() => setProductType('VIDEO')}
                        className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${productType === 'VIDEO' ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200'}`}
                    >
                        <span className="font-bold text-sm">Vídeo Pago / Aula</span>
                        <span className="text-xs text-zinc-500 text-center">Entrega acesso a um vídeo exclusivo no site.</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" name="name" required placeholder={productType === 'VIDEO' ? "Ex: Aula Secreta 01" : "Ex: Grupo VIP"} defaultValue={product?.name} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select name="categoryId" defaultValue={product?.categoryId || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                            {categories.length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground">Nenhuma categoria criada.</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Label className="text-base">Tipo de Precificação</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            onClick={() => {
                                setPricingType('single')
                                setPlans([]) // Clear plans if switching to single
                            }}
                            className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${pricingType === 'single' ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200'}`}
                        >
                            <span className="font-bold text-sm">Preço Único</span>
                            <span className="text-xs text-zinc-500 text-center">Apenas um valor fixo.</span>
                        </div>
                        <div
                            onClick={() => {
                                setPricingType('plans')
                            }}
                            className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all ${pricingType === 'plans' ? 'bg-red-50 border-red-500 ring-1 ring-red-500 dark:bg-red-900/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200'}`}
                        >
                            <span className="font-bold text-sm">Planos de Assinatura</span>
                            <span className="text-xs text-zinc-500 text-center">Vários planos (Mensal, Anual, etc).</span>
                        </div>
                    </div>
                </div>

                {pricingType === 'single' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label htmlFor="price">Preço Único (R$)</Label>
                        <Input id="price" name="price" type="number" step="0.01" required placeholder="19.90" defaultValue={product?.price ? product.price / 100 : undefined} />
                    </div>
                ) : (
                    <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <Label>Planos de Assinatura</Label>
                            <Button type="button" onClick={addPlan} variant="outline" size="sm" className="text-xs">
                                + Adicionar Plano
                            </Button>
                        </div>
                        {plans.length === 0 && <p className="text-xs text-red-500 font-medium">Adicione pelo menos um plano.</p>}

                        <div className="space-y-2">
                            {plans.map((plan, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Nome (ex: Mensal)"
                                        value={plan.name}
                                        onChange={(e) => updatePlan(index, 'name', e.target.value)}
                                        required
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Preço"
                                        value={plan.price}
                                        onChange={(e) => updatePlan(index, 'price', e.target.value)}
                                        className="w-24"
                                        required
                                    />
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removePlan(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <input type="hidden" name="price" value="0" />
                    </div>
                )}

                {/* Conditional Fields based on Type */}
                {productType === 'GROUP' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="groupLink">Link do Grupo (Entrega)</Label>
                        <Input id="groupLink" name="groupLink" required placeholder="https://chat.whatsapp.com/..." defaultValue={product?.groupLink || ''} />
                        <p className="text-xs text-muted-foreground">O link será exibido após a compra.</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 border border-blue-900/30 bg-blue-50/10 rounded-lg">
                        <Label className="text-blue-400">Upload do Vídeo (Privado)</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                disabled={uploadProgress > 0 && uploadProgress < 100}
                            />
                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-zinc-800 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                <p className="text-xs text-center mt-1 text-zinc-400">{Math.round(uploadProgress)}% enviado...</p>
                            </div>
                        )}

                        {contentUrl && (
                            <div className="p-2 bg-green-900/20 text-green-400 text-xs rounded border border-green-900/50 flex items-center gap-2">
                                <span>✅ Vídeo carregado com sucesso!</span>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            O vídeo será armazenado de forma segura e só será acessível para quem comprar.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="fakeViews" className="text-blue-400">Visualizações (Ex: 1.2M)</Label>
                                <Input id="fakeViews" name="fakeViews" defaultValue={(product as any)?.fakeViews || "10k"} placeholder="Ex: 500 mil" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="likes" className="text-blue-400">Likes / Gostei</Label>
                                <Input id="likes" name="likes" type="number" defaultValue={(product as any)?.likes || 0} placeholder="Ex: 150" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fakeDate" className="text-blue-400">Data de Postagem (Ex: há 2 dias)</Label>
                                <Input id="fakeDate" name="fakeDate" defaultValue={(product as any)?.fakeDate || "há 2 dias"} placeholder="Ex: há 1 semana" />
                            </div>
                        </div>
                        <div className="space-y-2 mt-2">
                            <Label htmlFor="manualAuthor" className="text-blue-400">Nome do Canal/Autor</Label>
                            <Input id="manualAuthor" name="manualAuthor" defaultValue={(product as any)?.manualAuthor || "Loja Oficial"} placeholder="Ex: Canal Top" />
                        </div>
                        <div className="space-y-2 mt-2 pt-2 border-t border-blue-200/20">
                            <Label htmlFor="previewDuration" className="text-green-400">Tempo de Preview (Segundos) - Modo "Degustação"</Label>
                            <Input id="previewDuration" name="previewDuration" type="number" defaultValue={(product as any)?.previewDuration || 0} placeholder="0 = Sem Preview" />
                            <p className="text-xs text-muted-foreground">Se maior que 0, qualquer pessoa poderá assistir a este tempo antes de ser bloqueada.</p>
                        </div>

                        <div className="space-y-2 mt-4 pt-4 border-t border-blue-200/20">
                            <Label htmlFor="videoAspectRatio" className="text-blue-400 font-bold flex items-center gap-2">
                                📱 Adaptador de Formato (Auto-Ajuste)
                            </Label>
                            <Select name="videoAspectRatio" defaultValue={(product as any)?.videoAspectRatio || "16/9"}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione o formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16/9">Cinema (16:9) - Padrão YouTube</SelectItem>
                                    <SelectItem value="9/16">Vertical (9:16) - TikTok/Reels/Shorts</SelectItem>
                                    <SelectItem value="4/3">Clássico (4:3) - TV Antiga/iPad</SelectItem>
                                    <SelectItem value="1/1">Quadrado (1:1) - Instagram Feed</SelectItem>
                                    <SelectItem value="auto">⚡ Adaptador Automático (Preencher Tela)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Escolha "Vertical" para vídeos de celular ou "Adaptador Automático" para o player se ajustar ao vídeo.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" required placeholder="Detalhes do produto e benefícios..." className="min-h-[100px]" defaultValue={product?.description} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mediaUpload">Capa / Galeria (Público)</Label>
                    <Input
                        id="mediaUpload"
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        disabled={isLoading}
                    />

                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            Selecione imagens ou vídeos curtos para a galeria. Upload inicia automaticamente.
                        </p>
                        {mediaUploadProgress > 0 && (
                            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${mediaUploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>

                    {mediaItems.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-4">
                            {mediaItems.map((m, idx) => (
                                <div key={idx} className="w-24 h-24 relative bg-zinc-800 rounded mx-1 group border border-zinc-700">
                                    {m.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {m.type === 'IMAGE' ? (
                                        <img src={m.url} className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">Video</div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMediaItem(idx)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 z-20"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {isLoading ? 'Salvando...' : (product ? 'Salvar Alterações' : 'Criar Produto')}
            </Button>
        </form>
    )
}
