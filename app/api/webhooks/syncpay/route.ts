
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Log for debugging
        console.log("SyncPay Webhook:", body)

        const { id_transaction, status } = body

        // Adjust status check based on real payload examples. 
        // Common patterns: "PAID", "CONFIRMED", "SUCCEEDED"
        // User doc says "status da transação"
        if (id_transaction) {
            let orderStatus = 'PENDING'
            if (status === 'PAID' || status === 'CONFIRMED' || status === 'APROVADO') {
                orderStatus = 'PAID'
            } else if (status === 'FAILED' || status === 'CANCELLED') {
                orderStatus = 'FAILED'
            }

            if (orderStatus === 'PAID') {
                // 1. Check if already paid to prevent duplicate emails
                const existingOrder = await prisma.order.findUnique({
                    where: { transactionId: String(id_transaction) }
                })

                if (existingOrder?.status === 'PAID') {
                    console.log(`Webhook: Transaction ${id_transaction} already processed.`)
                    return NextResponse.json({ received: true })
                }

                const updatedOrder = await prisma.order.update({
                    where: { transactionId: String(id_transaction) },
                    data: { status: 'PAID' },
                    include: { product: true }
                })

                if (updatedOrder && updatedOrder.customerEmail) {
                    // Send Confirmation Email
                    const { sendEmail } = await import('@/lib/email-service')

                    const accessLink = updatedOrder.product.type === 'VIDEO'
                        ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/product/${updatedOrder.productId}`
                        : updatedOrder.product.groupLink

                    const { getPurchaseConfirmationEmail } = await import('@/lib/email-templates')
                    await sendEmail(
                        updatedOrder.customerEmail,
                        `Acesso Liberado: ${updatedOrder.productName} 🚀`,
                        getPurchaseConfirmationEmail(
                            updatedOrder.customerName,
                            updatedOrder.productName,
                            accessLink
                        )
                    )
                }
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
