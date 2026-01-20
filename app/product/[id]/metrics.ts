'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function incrementVideoView(productId: string) {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: {
                views: {
                    increment: 1
                }
            }
        })
        return { success: true }
    } catch (e) {
        console.error("Failed to increment view:", e)
        return { success: false }
    }
}

export async function toggleVideoLike(productId: string) {
    // In a real app we would track user likes to prevent duplicates,
    // but for now we just increment for simplicity or cookie-based?
    // User didn't specify strict unique like per user, but let's just increment.

    try {
        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                likes: {
                    increment: 1
                }
            }
        })
        revalidatePath(`/product/${productId}`)
        return { success: true, likes: product.likes }
    } catch (e) {
        console.error("Failed to like:", e)
        return { success: false }
    }
}
