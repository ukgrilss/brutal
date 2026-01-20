import { ProductForm } from '../product-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCategories } from '../../categories/actions'

export default async function NewProductPage() {
    const categories = await getCategories()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/bobao/dashboard/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Novo Produto</h1>
            </div>
            <ProductForm categories={categories} />
        </div>
    )
}
