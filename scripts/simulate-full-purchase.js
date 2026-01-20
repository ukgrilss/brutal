const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const TEST_EMAIL = 'vivichatgpt25@gmail.com'
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/syncpay'

async function main() {
    console.log(`🚀 Starting Full Purchase Flow Test for: ${TEST_EMAIL}`)

    // 1. Find Products
    const groupProduct = await prisma.product.findFirst({ where: { type: 'GROUP' } })
    const videoProduct = await prisma.product.findFirst({ where: { type: 'VIDEO' } })

    if (!groupProduct || !videoProduct) {
        console.error("❌ Need at least one GROUP and one VIDEO product to test.")
        return
    }

    console.log(`📦 Group Product: ${groupProduct.name} (${groupProduct.id})`)
    console.log(`🎥 Video Product: ${videoProduct.name} (${videoProduct.id})`)

    // 2. Create Orders (Pending)
    // We simulate what 'createAnonymousCheckout' does, but directly in DB for speed, 
    // OR we could try to hit the action? No, direct DB is safer for a script.

    // Cleanup old test orders for this user first
    await prisma.order.deleteMany({ where: { customerEmail: TEST_EMAIL } })
    console.log("🧹 Cleaned up old orders for test user.")

    // Create User if not exists
    let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } })
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: TEST_EMAIL,
                name: 'Vivi Teste',
                password: 'hashed_password_placeholder' // Should be hashed in real app
            }
        })
        console.log("👤 Created Test User")
    }

    // Create Orders
    const txIdGroup = `TEST_GROUP_${Date.now()}`
    const txIdVideo = `TEST_VIDEO_${Date.now()}`

    const orderGroup = await prisma.order.create({
        data: {
            productId: groupProduct.id,
            userId: user.id,
            customerEmail: TEST_EMAIL,
            customerName: 'Vivi Teste',
            customerDocument: '000.000.000-00', // Mock CPF
            status: 'PENDING',
            amount: groupProduct.price,
            productName: groupProduct.name,
            transactionId: txIdGroup
        }
    })

    const orderVideo = await prisma.order.create({
        data: {
            productId: videoProduct.id,
            userId: user.id,
            customerEmail: TEST_EMAIL,
            customerName: 'Vivi Teste',
            customerDocument: '000.000.000-00', // Mock CPF
            status: 'PENDING',
            amount: videoProduct.price,
            productName: videoProduct.name,
            transactionId: txIdVideo
        }
    })

    console.log(`📝 Orders Created (PENDING):`)
    console.log(`   - Group Order ID: ${orderGroup.id} (Tx: ${txIdGroup})`)
    console.log(`   - Video Order ID: ${orderVideo.id} (Tx: ${txIdVideo})`)

    // 3. Simulate Webhook (Payment Confirmation)
    console.log("\n🔄 Simulating Webhook Calls...")

    await sendWebhook(txIdGroup)
    await sendWebhook(txIdVideo)

    // 4. Verify DB State
    console.log("\n🔍 Verifying Final Database State...")

    const updatedGroupOrder = await prisma.order.findUnique({ where: { id: orderGroup.id } })
    const updatedVideoOrder = await prisma.order.findUnique({ where: { id: orderVideo.id } })

    console.log(`   - Group Order Status: ${updatedGroupOrder.status} ${updatedGroupOrder.status === 'PAID' ? '✅' : '❌'}`)
    console.log(`   - Video Order Status: ${updatedVideoOrder.status} ${updatedVideoOrder.status === 'PAID' ? '✅' : '❌'}`)

    console.log("\n✅ Test Complete. Check your valid emails and 'My Orders' page.")
}

async function sendWebhook(txId) {
    const payload = {
        id_transaction: txId,
        status: 'PAID',
        amount: 10.00,
        // SyncPay logic inside route.ts uses these fields
    }

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        const text = await res.text()
        console.log(`   Webhook for ${txId}: Status ${res.status} - Response: ${text}`)
    } catch (e) {
        console.error(`   ❌ Webhook Failed for ${txId}:`, e.message)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
