'use server'

import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email-service"

export type CustomerFilter = 'all' | 'video_buyers' | 'group_buyers' | 'pending_pix'

export async function getCustomers(filter: CustomerFilter = 'all') {
    try {
        let whereClause: any = {}

        switch (filter) {
            case 'video_buyers':
                whereClause = {
                    status: 'PAID',
                    product: { type: 'VIDEO' }
                }
                break
            case 'group_buyers':
                whereClause = {
                    status: 'PAID',
                    product: { type: 'GROUP' }
                }
                break
            case 'pending_pix':
                whereClause = {
                    status: 'PENDING'
                }
                break
            case 'all':
            default:
                whereClause = {} // Fetch all orders to get unique customers
                break
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                product: true,
                user: true
            },
            orderBy: { createdAt: 'desc' }
        })

        // Deduplicate by email if 'all' or simple list, but keep latest order info for context
        // For this simple CRM while filtering by order status, returning orders is safer
        // allowing sending emails related to specific transaction.
        return { success: true, data: orders }

    } catch (error: any) {
        console.error('Error fetching customers:', error)
        return { success: false, error: 'Erro ao buscar clientes: ' + error.message }
    }
}

export async function sendBulkEmail(
    orderIds: string[],
    subject: string,
    messageTemplate: string
) {
    try {
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            include: { product: true }
        })

        let successCount = 0
        let failCount = 0

        // Process in chunks to avoid overwhelming SMTP
        const chunkSize = 5
        for (let i = 0; i < orders.length; i += chunkSize) {
            const chunk = orders.slice(i, i + chunkSize)

            await Promise.all(chunk.map(async (order) => {
                try {
                    // Variable Replacement
                    let content = messageTemplate
                    content = content.replace(/<nome_cliente>/g, order.customerName || 'Cliente')
                    content = content.replace(/<nome_produto>/g, order.productName || 'Produto')
                    content = content.replace(/<pix_code>/g, order.pixCode || '(Código PIX expirado ou indisponível)')

                    // Simple tracking replacement (if implemented later)
                    // content = content.replace(/<tracking_link>/g, `...`)

                    const emailSent = await sendEmail({
                        to: order.customerEmail,
                        subject: subject.replace(/<nome_cliente>/g, order.customerName || 'Cliente'),
                        html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${content}</div>` // Preserve formatting
                    })

                    if (emailSent) successCount++
                    else failCount++

                } catch (err) {
                    console.error(`Failed to send to ${order.customerEmail}:`, err)
                    failCount++
                }
            }))
        }

        return {
            success: true,
            message: `Disparo finalizado: ${successCount} enviados, ${failCount} falhas.`
        }

    } catch (error: any) {
        return { success: false, error: 'Erro no disparo em massa: ' + error.message }
    }
}
