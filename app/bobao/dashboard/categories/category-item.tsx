'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, GripVertical } from 'lucide-react'
import { deleteCategory, updateCategoryOrder } from './actions'
import { useRouter } from 'next/navigation'

interface CategoryItemProps {
    category: {
        id: string
        name: string
        imageUrl: string | null
        order: number
        _count: { products: number }
    }
    hideOrderInput?: boolean
}

export function CategoryItem({ category, hideOrderInput }: CategoryItemProps) {
    const [loading, setLoading] = useState(false)
    const [order, setOrder] = useState(category.order)
    const router = useRouter() // Not strictly needed if actions revalidate, but good for focus management if needed

    async function handleDelete() {
        if (!confirm('Tem certeza? Isso pode afetar produtos desta categoria.')) return
        setLoading(true)
        await deleteCategory(category.id)
        setLoading(false)
    }

    async function handleOrderChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newOrder = parseInt(e.target.value)
        setOrder(newOrder)
    }

    async function saveOrder() {
        if (order === category.order) return
        await updateCategoryOrder(category.id, order)
    }

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-zinc-900 transition-all hover:border-zinc-500">
            <div className="flex items-center gap-3 flex-1">
                {/* Visual Drag Handle & Order Input (Only if NOT hidden) */}
                {!hideOrderInput && (
                    <>
                        <div title="Ordem definida pelo número">
                            <GripVertical className="text-zinc-400 w-4 h-4 cursor-help" />
                        </div>
                        <div className="w-16">
                            <Input
                                type="number"
                                value={order}
                                onChange={handleOrderChange}
                                onBlur={saveOrder}
                                className="h-8 text-center bg-white dark:bg-zinc-800"
                                title="Ordem de exibição (Menor = Primeiro)"
                            />
                        </div>
                    </>
                )}

                {category.imageUrl && (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-black shrink-0">
                        <img src={category.imageUrl} alt={category.name} className="object-cover w-full h-full" />
                    </div>
                )}

                <div className="flex flex-col">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category._count.products} produtos</p>
                </div>
            </div>

            <Button
                size="icon"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                onClick={handleDelete}
                disabled={loading}
            >
                {loading ? <span className="animate-spin">⏳</span> : <Trash2 className="w-4 h-4" />}
            </Button>
        </div>
    )
}
