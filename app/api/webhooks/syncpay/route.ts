
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Log for debugging
        console.log("SyncPay Webhook:", body)

        const { id_transaction, identifier, status, payment_status } = body

        // Resolve Transaction ID (Docs say 'id_transaction' but response uses 'identifier', checking both)
        const txId = id_transaction || identifier;

        console.log(`[Webhook Debug] Processing Transaction ID: ${txId}, Status: ${status || payment_status}`);

        // Normalize status
        const receivedStatus = (status || payment_status || '').toUpperCase();

        if (txId) {
            let orderStatus = 'PENDING'
            if (['PAID', 'CONFIRMED', 'APROVADO', 'COMPLETED', 'SUCCEEDED'].includes(receivedStatus)) {
                orderStatus = 'PAID'
            } else if (['FAILED', 'CANCELLED', 'RECUSADO'].includes(receivedStatus)) {
                orderStatus = 'FAILED'
            }

            if (orderStatus === 'PAID') {
                // 1. Check if already paid to prevent duplicate emails
                const existingOrder = await prisma.order.findUnique({
                    where: { transactionId: String(txId) }
                })

                if (existingOrder?.status === 'PAID') {
                    console.log(`Webhook: Transaction ${txId} already processed.`)
                    return NextResponse.json({ received: true })
                }

                const updatedOrder = await prisma.order.update({
                    where: { transactionId: String(txId) },
                    data: { status: 'PAID' },
                    include: { product: true }
                })

                if (updatedOrder && updatedOrder.customerEmail) {
                    // Send Confirmation Email
                    const { sendEmail } = await import('@/lib/email-service')

                    let accessLink = '#'
                    if (updatedOrder.product) {
                        accessLink = updatedOrder.product.type === 'VIDEO'
                            ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/product/${updatedOrder.productId}`
                            : (updatedOrder.product.groupLink || '#')
                    }

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


export async function GET() {
    return NextResponse.json({ status: 'Webhook Active', timestamp: new Date().toISOString() })
}
