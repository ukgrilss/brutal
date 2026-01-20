import { prisma } from '@/lib/db'
import { createBanner, deleteBanner } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, ImagePlus } from 'lucide-react'

export default async function BannersPage() {
    const banners = await prisma.banner.findMany({
        orderBy: { createdAt: 'desc' }
    })

    async function handleDelete(id: string) {
        'use server'
        await deleteBanner(id)
    }

    async function handleCreate(formData: FormData) {
        'use server'
        await createBanner(formData)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Banners da Loja</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Adicionar Banner</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título (Opcional)</Label>
                                <Input id="title" name="title" placeholder="Ex: Promoção de Natal" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image">Imagem do Banner</Label>
                                <Input id="image" name="image" type="file" accept="image/*" required />
                                <p className="text-xs text-muted-foreground">Recomendado: 1920x600px</p>
                            </div>

                            <Button type="submit" className="w-full">
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Upload Banner
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Banners Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {banners.map(banner => (
                                <div key={banner.id} className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover opacity-80" />

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <form action={handleDelete.bind(null, banner.id)}>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remover
                                            </Button>
                                        </form>
                                    </div>

                                    {banner.title && (
                                        <div className="absolute bottom-0 left-0 w-full p-2 bg-black/60 text-white text-xs font-bold truncate">
                                            {banner.title}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {banners.length === 0 && (
                                <div className="text-center py-8 text-zinc-500">
                                    Nenhum banner ativo.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
