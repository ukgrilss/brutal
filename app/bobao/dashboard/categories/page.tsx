import { prisma } from '@/lib/db'
import { createCategory } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryReorderList } from './category-reorder-list'

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        orderBy: [
            { order: 'asc' }, // Respect manual order
            { createdAt: 'desc' } // Fallback to newest
        ],
        include: { _count: { select: { products: true } } }
    })

    async function handleCreate(formData: FormData) {
        'use server'
        await createCategory(formData)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-zinc-400">Arraste as categorias para reordenar.</p>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Create Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Nova Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={handleCreate} className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome da Categoria</Label>
                                <Input id="name" name="name" placeholder="Ex: VIP, Lançamentos..." required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="image">Imagem (Opcional - Ideal para o Carrossel)</Label>
                                <Input id="image" name="image" type="file" accept="image/*" />
                            </div>
                            <Button type="submit">Adicionar Categoria</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Reorder List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Categorias Existentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryReorderList initialCategories={categories} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
