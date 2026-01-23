'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
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

    // Parse media from JSON (Client-side upload)
    const mediaJson = formData.get('media_json') as string
    let mediaData: { type: string, url: string }[] = []

    try {
        if (mediaJson) {
            mediaData = JSON.parse(mediaJson)
        }
    } catch (e) {
        console.error("Error parsing media_json:", e)
    }

    // Fallback: If no JSON, try old file method
    if (mediaData.length === 0) {
        const files = formData.getAll('media') as File[]
        if (files.length > 0 && files[0].size > 0) {
            const { uploadToB2 } = await import('@/lib/b2-native')
            for (const file of files) {
                if (file instanceof File && file.size > 0) {
                    try {
                        const folder = file.type.startsWith('video') ? 'videos' : 'images'
                        const result = await uploadToB2(file, folder)
                        const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                        mediaData.push({ type, url: result.url })
                    } catch (e) {
                        console.error(`Fallback upload failed for ${file.name}:`, e)
                    }
                }
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
    const videoAspectRatio = formData.get('videoAspectRatio') as string || '16/9'

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

    // Parse media from JSON (Client-side upload)
    const mediaJson = formData.get('media_json') as string
    let mediaData: { type: string, url: string }[] = []

    try {
        if (mediaJson) {
            mediaData = JSON.parse(mediaJson)
        }
    } catch (e) {
        console.error("Error parsing media_json:", e)
    }

    // Fallback: If no JSON, try old file method (should not happen with new form, but keep safe)
    if (mediaData.length === 0) {
        const files = formData.getAll('media') as File[]
        // Import direct upload helper only if needed
        if (files.length > 0 && files[0].size > 0) {
            const { uploadToB2 } = await import('@/lib/b2-native')
            for (const file of files) {
                if (file instanceof File && file.size > 0) {
                    try {
                        const folder = file.type.startsWith('video') ? 'videos' : 'images'
                        const result = await uploadToB2(file, folder)
                        const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                        mediaData.push({ type, url: result.url })
                    } catch (e) {
                        console.error(`Fallback upload failed for ${file.name}:`, e)
                    }
                }
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
                    deleteMany: {}, // Delete existing media to sync with form state
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

export async function toggleProductFeatured(id: string) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return { success: false }

    await prisma.product.update({
        where: { id },
        data: { featured: !product.featured }
    })
    revalidatePath('/bobao/dashboard/products')
    revalidatePath('/')
    return { success: true }
}

export async function updateProductOrder(id: string, direction: 'up' | 'down') {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return { success: false }

    // Logic: Higher order = Shows first.
    // "Up" button -> Increase order value
    // "Down" button -> Decrease order value

    // Find adjacent product to swap with
    const comparison = direction === 'up' ? { gt: product.order } : { lt: product.order }
    const orderDirection = direction === 'up' ? 'asc' : 'desc'

    const neighbor = await prisma.product.findFirst({
        where: {
            // Only swap with products that have the same 'featured' status to keep groups clean
            featured: product.featured,
            order: comparison
        },
        orderBy: { order: orderDirection as any }
    })

    if (neighbor) {
        // Swap orders
        await prisma.$transaction([
            prisma.product.update({ where: { id }, data: { order: neighbor.order } }),
            prisma.product.update({ where: { id: neighbor.id }, data: { order: product.order } })
        ])
    } else {
        // Edge case: No neighbor (top or bottom of list). 
        // Force increment/decrement to ensure it moves if logic allows (or just ignore)
        // For 'Up' at top, do nothing.
        // For 'Down' at bottom, do nothing.

        // However, if there are products with SAME order, we need to break ties.
        // Let's just create a gap.
        if (direction === 'up') {
            await prisma.product.update({ where: { id }, data: { order: { increment: 1 } } })
        } else {
            await prisma.product.update({ where: { id }, data: { order: { decrement: 1 } } })
        }
    }

    revalidatePath('/bobao/dashboard/products')
    revalidatePath('/')
    return { success: true }
}
