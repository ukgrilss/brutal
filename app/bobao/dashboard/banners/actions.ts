'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function createBanner(formData: FormData) {
    const file = formData.get('image') as File
    const title = formData.get('title') as string || ''

    if (!file || file.size === 0) return

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = Date.now() + '_banner_' + file.name.replace(/\s+/g, '_')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    try {
        await mkdir(uploadDir, { recursive: true })
        await writeFile(path.join(uploadDir, filename), buffer)

        await prisma.banner.create({
            data: {
                title,
                imageUrl: `/uploads/${filename}`,
                active: true
            }
        })

        revalidatePath('/bobao/dashboard/banners')
        revalidatePath('/')
    } catch (e) {
        console.error('Error uploading banner:', e)
    }
}

export async function deleteBanner(id: string) {
    await prisma.banner.delete({ where: { id } })
    revalidatePath('/bobao/dashboard/banners')
    revalidatePath('/')
}

export async function getBanners() {
    return await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } })
}
