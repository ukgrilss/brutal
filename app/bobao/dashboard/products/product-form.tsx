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
    const [uploadProgress, setUploadProgress] = useState(0)
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

    async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        try {
            // 1. Get Authentication & Upload URL from Backend
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: JSON.stringify({ filename: file.name, contentType: file.type })
            })
            const { uploadUrl, authorizationToken, key, fileName } = await res.json()

            if (!uploadUrl) throw new Error('Falha ao obter URL de upload do B2.')

            // 2. Upload to B2 (Native API)
            // Native B2 uses POST, not PUT. And specific headers.
            const xhr = new XMLHttpRequest()
            xhr.open('POST', uploadUrl, true)

            xhr.setRequestHeader('Authorization', authorizationToken)
            // Critical: B2 Native API requires the filename to be URL Encoded in the header
            xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(fileName))
            xhr.setRequestHeader('Content-Type', file.type)
            xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify') // Optimization for browser uploads

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100
                    setUploadProgress(percentComplete)
                }
            }

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText)
                    setContentUrl(key)
                    // B2 returns the fileId and fileName. We trust our key from step 1 or response.fileName
                    // Let's use the key we generated in step 1 as contentUrl

                    setIsLoading(false)
                    setUploadProgress(0)
                } else {
                    console.error('B2 Upload Error:', xhr.responseText)
                    alert('Erro no upload do vídeo: ' + xhr.status)
                    setIsLoading(false)
                }
            }

            xhr.onerror = () => {
                alert('Erro de rede no upload.')
                setIsLoading(false)
            }

            xhr.send(file)

        } catch (error: any) {
            console.error(error)
            alert('Erro ao iniciar upload: ' + error.message)
            setIsLoading(false)
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)

        // Append plans as JSON
        formData.append('plans', JSON.stringify(plans))

        // Append Video Fields (explicitly managed by state because file input is for upload not form submit)
        if (productType === 'VIDEO') {
            formData.append('type', 'VIDEO')
            formData.append('contentUrl', contentUrl)
            // formData.append('previewUrl', previewUrl) // If implemented later
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

    async function handleDeleteMedia(mediaId: string) {
        if (!confirm('Tem certeza que deseja apagar esta imagem?')) return
        await deleteMedia(mediaId)
        router.refresh()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-800">

            {/* Type Selector */}
            <div className="space-y-4 pt-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6">
                <Label className="text-base">Tipo de Produto</Label>
                <div className="grid grid-cols-2 gap-4">
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
                        {/* Hidden input to ensure price is 0 when saving plans only, or handled by server action defaulting */}
                        <input type="hidden" name="price" value="0" />
                    </div>
                )}

                {/* Conditional Fields based on Type */}
                {productType === 'GROUP' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="groupLink">Link do Grupo (Entrega)</Label>
                        <Input id="groupLink" name="groupLink" required placeholder="https://chat.whatsapp.com/..." defaultValue={product?.groupLink} />
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
                                <span>✅ Vídeo carregado com sucesso! (ID: {contentUrl.substring(0, 20)}...)</span>
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
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" required placeholder="Detalhes do produto e benefícios..." className="min-h-[100px]" defaultValue={product?.description} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="media">Capa / Thumbnail (Público)</Label>
                    <Input id="media" name="media" type="file" multiple accept="image/*,video/*" required={!product} />
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-muted-foreground">
                            {product ? 'Selecione para adicionar mais arquivos.' : 'Selecione a imagem de capa do produto.'}
                        </p>
                        <p className={`text-xs font-medium ${productType === 'VIDEO' ? 'text-blue-400' : 'text-green-400'}`}>
                            {productType === 'VIDEO'
                                ? '⚠️ Recomendado: 16:9 (Horizontal) - Ex: 1280x720px'
                                : '⚠️ Recomendado: 4:5 (Vertical) - Ex: 1080x1350px'}
                        </p>
                    </div>

                    {product && product.media.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-4">
                            {product.media.map(m => (
                                <div key={m.id} className="w-24 h-24 relative bg-zinc-800 rounded mx-1 group">
                                    {m.type === 'IMAGE' ? (
                                        <img src={m.url} className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 border border-zinc-700 rounded">Video</div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteMedia(m.id)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={isLoading || (productType === 'VIDEO' && uploadProgress > 0 && uploadProgress < 100)} className="w-full bg-red-600 hover:bg-red-700 text-white">
                {isLoading ? (uploadProgress > 0 ? 'Enviando Vídeo...' : 'Salvando...') : (product ? 'Salvar Alterações' : 'Criar Produto')}
            </Button>
        </form>
    )
}
