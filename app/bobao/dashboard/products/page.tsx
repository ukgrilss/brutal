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
import { ProductSortingActions } from './product-list-actions'
import { ProductTabs } from './product-tabs'

export default async function ProductsPage() {
    const products = await prisma.product.findMany({
        orderBy: [
            { featured: 'desc' },
            { order: 'desc' },
            { createdAt: 'desc' }
        ],
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

            <ProductTabs products={products as any} />
        </div>
    )
}
