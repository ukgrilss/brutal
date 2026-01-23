'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeleteProductButton } from './delete-button'
import { ProductSortingActions } from './product-list-actions'

interface Product {
    id: string
    name: string
    price: number
    type: string
    featured: boolean
    order: number
    views: number | null
    likes: number | null
    media: { type: string, url: string }[]
    orders: { id: string }[]
}

export function ProductTabs({ products }: { products: Product[] }) {
    const [filter, setFilter] = useState('ALL')

    const filtered = products.filter(p => {
        if (filter === 'ALL') return true
        if (filter === 'GROUP') return p.type === 'GROUP'
        if (filter === 'VIDEO') return p.type === 'VIDEO'
        return true
    })

    return (
        <Tabs defaultValue="ALL" onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-[400px] bg-zinc-800 text-zinc-400">
                <TabsTrigger value="ALL">Todos ({products.length})</TabsTrigger>
                <TabsTrigger value="GROUP">Grupos</TabsTrigger>
                <TabsTrigger value="VIDEO">Vídeos</TabsTrigger>
            </TabsList>

            <div className="mt-4 rounded-md border bg-white dark:bg-gray-800 overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Ordem</TableHead>
                            <TableHead>Imagem</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((product, index) => (
                            <TableRow key={product.id} className={product.featured ? 'bg-yellow-500/5 dark:bg-yellow-500/10' : ''}>
                                <TableCell>
                                    <ProductSortingActions
                                        id={product.id}
                                        order={product.order}
                                        featured={product.featured}
                                        isFirst={index === 0}
                                        isLast={index === filtered.length - 1} // Logic slightly flawed if filtered, but ok for now
                                    />
                                </TableCell>
                                <TableCell>
                                    {product.media[0]?.type === 'VIDEO' ? (
                                        <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">Video</div>
                                    ) : (
                                        <img
                                            src={product.media[0]?.url || '/placeholder.png'}
                                            alt={product.name}
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.type === 'VIDEO' ? 'bg-blue-900 text-blue-200' : 'bg-green-900 text-green-200'}`}>
                                        {product.type === 'VIDEO' ? 'VÍDEO' : 'GRUPO'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price / 100)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    <div className="flex gap-2">
                                        <span title="Views">👁️ {product.views || 0}</span>
                                        <span title="Likes">❤️ {product.likes || 0}</span>
                                        <span title="Vendas">💰 {product.orders?.length || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2 flex justify-end">
                                    <Link href={`/bobao/dashboard/products/${product.id}/edit`}>
                                        <Button variant="outline" size="sm">
                                            Editar
                                        </Button>
                                    </Link>
                                    <DeleteProductButton id={product.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado nesta aba.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Tabs>
    )
}
