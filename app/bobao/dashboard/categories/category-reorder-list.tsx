'use client'

import { useState, useEffect } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { CategoryItem } from './category-item' // We can reuse the inner look
import { GripVertical } from 'lucide-react'
import { updateCategoryOrderBulk } from './actions'

interface Category {
    id: string
    name: string
    imageUrl: string | null
    order: number
    _count: { products: number }
}

export function CategoryReorderList({ initialCategories }: { initialCategories: Category[] }) {
    const [items, setItems] = useState(initialCategories)

    // Sync state if server data changes (e.g. new category added)
    useEffect(() => {
        setItems(initialCategories)
    }, [initialCategories])

    async function handleReorder(newOrder: Category[]) {
        setItems(newOrder)

        // Prepare bulk update: index in array = new order
        const updates = newOrder.map((item, index) => ({
            id: item.id,
            order: index
        }))

        // Call server action
        await updateCategoryOrderBulk(updates)
    }

    return (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
            {items.map((item) => (
                <Reorder.Item key={item.id} value={item} className="cursor-grab active:cursor-grabbing">
                    {/* We wrap CategoryItem to add the drag handle context if needed, or just rely on the whole item being draggable */}
                    {/* To make it cleaner, we can remove the 'order' input from the visual item here since we are dragging */}
                    <div className="flex items-center gap-2">
                        <GripVertical className="text-zinc-400 w-5 h-5" />
                        <div className="flex-1">
                            <CategoryItem category={item} hideOrderInput={true} />
                        </div>
                    </div>
                </Reorder.Item>
            ))}
            {items.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma categoria criada.</p>
            )}
        </Reorder.Group>
    )
}
