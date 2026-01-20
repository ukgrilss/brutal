import { prisma } from '@/lib/db'
import { ProductForm } from '../../product-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id },
        include: { media: true }
    })

    if (!product) notFound()

    const categories = await prisma.category.findMany()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/bobao/dashboard/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Editar Produto</h1>
            </div>
            <ProductForm categories={categories} product={product} />
        </div>
    )
}
