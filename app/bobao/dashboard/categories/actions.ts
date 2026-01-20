'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function createCategory(formData: FormData) {
    const name = formData.get('name') as string
    if (!name) return

    let imageUrl = null

    const file = formData.get('image') as File
    if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = Date.now() + '_cat_' + file.name.replace(/\s+/g, '_')
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')

        try {
            await mkdir(uploadDir, { recursive: true })
            await writeFile(path.join(uploadDir, filename), buffer)
            imageUrl = `/uploads/${filename}`
        } catch (e) {
            console.error('Error uploading category image:', e)
        }
    }

    const order = parseInt(formData.get('order') as string || '0')

    await prisma.category.create({
        data: {
            name,
            imageUrl,
            order
        }
    })

    revalidatePath('/bobao/dashboard/categories')
    revalidatePath('/') // Update storefront
}

export async function deleteCategory(id: string) {
    await prisma.category.delete({ where: { id } })
    revalidatePath('/bobao/dashboard/categories')
    revalidatePath('/')
}

export async function updateCategoryOrder(id: string, order: number) {
    if (isNaN(order)) return

    await prisma.category.update({
        where: { id },
        data: { order }
    })
    revalidatePath('/bobao/dashboard/categories')
    revalidatePath('/')
}

export async function updateCategoryOrderBulk(items: { id: string, order: number }[]) {
    try {
        const updates = items.map(item =>
            prisma.category.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )

        await prisma.$transaction(updates)
        revalidatePath('/bobao/dashboard/categories')
        revalidatePath('/')
        return { success: true }
    } catch (e) {
        console.error("Bulk update failed:", e)
        return { success: false }
    }
}

export async function getCategories() {
    return await prisma.category.findMany({ orderBy: { createdAt: 'desc' } })
}
