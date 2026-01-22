import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DeleteProductButton } from './delete-button'

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { media: true, orders: true }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">Produtos</h1>
                <Link href="/bobao/dashboard/products/new">
                    <Button className="w-full md:w-auto">Novo Produto</Button>
                </Link>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-800 overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imagem</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Views/Likes</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    {product.media[0]?.type === 'VIDEO' ? (
                                        <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-xs">VÍDEO</div>
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
                                        {product.type}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    <div>👁️ {product.views || 0}</div>
                                    <div>❤️ {product.likes || 0}</div>
                                    <div>💰 {product.orders?.length || 0}</div>
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
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-4">Nenhum produto cadastrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
