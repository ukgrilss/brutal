'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { updateCategory } from './actions'

interface Category {
    id: string
    name: string
    imageUrl: string | null
}

export function EditCategoryDialog({ category }: { category: Category }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)
        await updateCategory(category.id, formData)
        setIsLoading(false)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Pencil className="h-4 w-4 text-zinc-500" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Categoria</Label>
                        <Input id="name" name="name" defaultValue={category.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="image">Nova Imagem (Opcional)</Label>
                        <Input id="image" name="image" type="file" accept="image/*" />
                        {category.imageUrl && (
                            <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Imagem Atual:</p>
                                <img src={category.imageUrl} className="w-16 h-16 object-cover rounded" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
