'use client'
import { Button } from '@/components/ui/button'
import { deleteProduct } from './actions'
import { useTransition } from 'react'

export function DeleteProductButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={() => startTransition(() => deleteProduct(id))}
            disabled={isPending}
        >
            {isPending ? 'Excluindo...' : 'Excluir'}
        </Button>
    )
}
