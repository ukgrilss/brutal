
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        // Log for debugging
        console.log("SyncPay Webhook:", body)

        // Handle potential nested 'data' object (as seen in logs)
        const payload = body.data || body;

        console.log("Parsed Webhook Payload:", payload);

        const { id_transaction, idtransaction, identifier, status, payment_status, externalreference } = payload

        // Resolve Transaction ID (Checking all possible fields from logs)
        // Log shows: 'idtransaction': 'f94d...', 'externalreference': '1c2a...'
        // We stored one of these as 'transactionId' in our DB. Checking primary candidates first.
        const txId = idtransaction || id_transaction || identifier || externalreference;

        console.log(`[Webhook Debug] Processing Transaction ID: ${txId}, Status: ${status || payment_status}`);

        // Normalize status
        const receivedStatus = (status || payment_status || '').toUpperCase();

        if (txId) {
            let orderStatus = 'PENDING'
            // Added 'PAID_OUT' based on user logs
            if (['PAID', 'PAID_OUT', 'CONFIRMED', 'APROVADO', 'COMPLETED', 'SUCCEEDED'].includes(receivedStatus)) {
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
                        `Sua compra: ${updatedOrder.productName}`,
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
