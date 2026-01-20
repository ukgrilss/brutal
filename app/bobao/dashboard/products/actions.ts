'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const priceStr = formData.get('price') as string
    const price = Math.round(parseFloat(priceStr.replace(',', '.') || '0') * 100)
    const categoryId = formData.get('categoryId') as string || null

    const type = formData.get('type') as string || 'GROUP'
    const groupLink = formData.get('groupLink') as string || null
    const contentUrl = formData.get('contentUrl') as string || null

    // Social Stats
    const views = parseInt(formData.get('views') as string || '0')
    const likes = parseInt(formData.get('likes') as string || '0')
    const previewDuration = parseInt(formData.get('previewDuration') as string || '0')

    // Parse plans
    const plansJson = formData.get('plans') as string
    let plansData: { name: string, price: number }[] = []
    try {
        if (plansJson) {
            const parsed = JSON.parse(plansJson)
            plansData = parsed.map((p: any) => ({
                name: p.name,
                price: Math.round((Number(p.price) || 0) * 100)
            }))
        }
    } catch (e) {
        console.error("Error parsing plans:", e)
    }

    const files = formData.getAll('media') as File[]
    const mediaData = []

    for (const file of files) {
        if (file instanceof File && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const filename = Date.now() + '_' + file.name.replace(/\s+/g, '_')
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')

            try {
                await mkdir(uploadDir, { recursive: true })
                await writeFile(path.join(uploadDir, filename), buffer)

                const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                mediaData.push({ type, url: `/uploads/${filename}` })
            } catch (e) {
                console.error('Error uploading file:', e)
            }
        }
    }

    try {
        await prisma.product.create({
            data: {
                name,
                description,
                price,
                type,
                groupLink,
                contentUrl,
                fakeViews: formData.get('fakeViews') as string || null,
                fakeDate: formData.get('fakeDate') as string || null,
                manualAuthor: formData.get('manualAuthor') as string || null,
                previewDuration,
                views,
                likes,
                categoryId,
                media: {
                    create: mediaData
                },
                plans: {
                    create: plansData
                }
            }
        })
        revalidatePath('/bobao/dashboard/products')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error("Failed to create product:", e)
        return { success: false, error: `Erro ao criar produto: ${e.message || 'Erro interno'}` }
    }
}

export async function deleteProduct(id: string) {
    await prisma.product.delete({ where: { id } })
    revalidatePath('/bobao/dashboard/products')
    revalidatePath('/')
}

export async function updateProduct(id: string, formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const priceStr = formData.get('price') as string
    const price = Math.round(parseFloat(priceStr.replace(',', '.') || '0') * 100)
    const categoryId = formData.get('categoryId') as string || null

    const type = formData.get('type') as string || 'GROUP'
    const groupLink = formData.get('groupLink') as string || null
    const contentUrl = formData.get('contentUrl') as string || null

    // Social Stats
    const views = parseInt(formData.get('views') as string || '0')
    const likes = parseInt(formData.get('likes') as string || '0')
    const previewDuration = parseInt(formData.get('previewDuration') as string || '0')


    // Parse plans
    const plansJson = formData.get('plans') as string
    let plansData: { name: string, price: number }[] = []
    try {
        if (plansJson) {
            const parsed = JSON.parse(plansJson)
            plansData = parsed.map((p: any) => ({
                name: p.name,
                price: Math.round((Number(p.price) || 0) * 100)
            }))
        }
    } catch (e) {
        console.error("Error parsing plans:", e)
    }

    const files = formData.getAll('media') as File[]
    const mediaData = []

    for (const file of files) {
        if (file instanceof File && file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer())
            const filename = Date.now() + '_' + file.name.replace(/\s+/g, '_')
            const uploadDir = path.join(process.cwd(), 'public', 'uploads')

            try {
                await mkdir(uploadDir, { recursive: true })
                await writeFile(path.join(uploadDir, filename), buffer)

                const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                mediaData.push({ type, url: `/uploads/${filename}` })
            } catch (e) {
                console.error('Error uploading file:', e)
            }
        }
    }

    try {
        await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price,
                type,
                groupLink,
                contentUrl,
                fakeViews: formData.get('fakeViews') as string || null,
                fakeDate: formData.get('fakeDate') as string || null,
                manualAuthor: formData.get('manualAuthor') as string || null,
                previewDuration,
                views,
                likes,
                categoryId,
                media: {
                    create: mediaData
                },
                plans: {
                    deleteMany: {}, // Delete existing plans
                    create: plansData // Create new set
                }
            }
        })
        revalidatePath('/bobao/dashboard/products')
        revalidatePath('/')
        return { success: true }
    } catch (e: any) {
        console.error("Failed to update product:", e)
        return { success: false, error: `Erro ao atualizar produto: ${e.message || 'Erro interno'}` }
    }
}

export async function deleteMedia(mediaId: string) {
    try {
        // Optional: Delete file from disk if needed, for now just DB
        await prisma.media.delete({ where: { id: mediaId } })
        revalidatePath('/bobao/dashboard/products')
        return { success: true }
    } catch (e) {
        console.error('Failed to delete media:', e)
        return { success: false, error: 'Erro ao deletar mídia.' }
    }
}
