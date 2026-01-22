'use client'

import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Star, Loader2 } from "lucide-react"
import { useTransition } from "react"
import { toggleProductFeatured, updateProductOrder } from "./actions"
import { useRouter } from "next/navigation"

export function ProductSortingActions({ id, order, featured, isFirst, isLast }: { id: string, order: number, featured: boolean, isFirst: boolean, isLast: boolean }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleFeature = () => {
        startTransition(async () => {
            await toggleProductFeatured(id)
        })
    }

    const handleOrder = (direction: 'up' | 'down') => {
        startTransition(async () => {
            await updateProductOrder(id, direction)
        })
    }

    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${featured ? 'text-yellow-400 hover:text-yellow-500' : 'text-zinc-400 hover:text-yellow-400'}`}
                onClick={handleFeature}
                disabled={isPending}
            >
                <Star className={`w-4 h-4 ${featured ? 'fill-current' : ''}`} />
            </Button>

            <div className="flex flex-col gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => handleOrder('up')}
                    disabled={isPending} // Removed isFirst check to allow forcing
                >
                    <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => handleOrder('down')}
                    disabled={isPending} // Removed isLast check
                >
                    <ArrowDown className="w-3 h-3" />
                </Button>
            </div>
            {isPending && <Loader2 className="w-3 h-3 animate-spin text-zinc-500 ml-1" />}
        </div>
    )
}
