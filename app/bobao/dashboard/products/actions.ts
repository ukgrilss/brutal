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

    const files = formData.getAll('media') as File[]
    const mediaData = []

    for (const file of files) {
        if (file instanceof File && file.size > 0) {
            try {
                const fileType = file.type.startsWith('video') ? 'video' : 'image'

                // 1. Get B2 upload URL
                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        type: fileType
                    })
                })

                if (!uploadRes.ok) {
                    console.error('Failed to get B2 upload URL:', await uploadRes.text())
                    continue
                }

                const { uploadUrl, authorizationToken, key } = await uploadRes.json()

                // 2. Upload file to B2
                const buffer = Buffer.from(await file.arrayBuffer())
                const b2UploadRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': authorizationToken,
                        'X-Bz-File-Name': encodeURIComponent(key),
                        'Content-Type': file.type,
                        'X-Bz-Content-Sha1': 'do_not_verify'
                    },
                    body: buffer
                })

                if (!b2UploadRes.ok) {
                    console.error('B2 upload failed:', await b2UploadRes.text())
                    continue
                }

                // 3. Generate public URL
                const bucketName = process.env.B2_BUCKET_NAME
                const publicUrl = `https://f005.backblazeb2.com/file/${bucketName}/${key}`

                const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                mediaData.push({ type, url: publicUrl })
            } catch (e) {
                console.error('Error uploading file to B2:', e)
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
            try {
                const fileType = file.type.startsWith('video') ? 'video' : 'image'

                // 1. Get B2 upload URL
                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type,
                        type: fileType
                    })
                })

                if (!uploadRes.ok) {
                    console.error('Failed to get B2 upload URL:', await uploadRes.text())
                    continue
                }

                const { uploadUrl, authorizationToken, key } = await uploadRes.json()

                // 2. Upload file to B2
                const buffer = Buffer.from(await file.arrayBuffer())
                const b2UploadRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': authorizationToken,
                        'X-Bz-File-Name': encodeURIComponent(key),
                        'Content-Type': file.type,
                        'X-Bz-Content-Sha1': 'do_not_verify'
                    },
                    body: buffer
                })

                if (!b2UploadRes.ok) {
                    console.error('B2 upload failed:', await b2UploadRes.text())
                    continue
                }

                // 3. Generate public URL
                const bucketName = process.env.B2_BUCKET_NAME
                const publicUrl = `https://f005.backblazeb2.com/file/${bucketName}/${key}`

                const type = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE'
                mediaData.push({ type, url: publicUrl })
            } catch (e) {
                console.error('Error uploading file to B2:', e)
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
