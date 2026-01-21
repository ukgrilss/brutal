
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateWebhook() {
    try {
        // 1. Find a recent PENDING order
        const order = await prisma.order.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        });

        if (!order) {
            console.log("❌ No PENDING orders found to test.");
            return;
        }

        console.log(`🔍 Found Pending Order: ${order.id}`);
        console.log(`   Transaction ID: ${order.transactionId}`);
        console.log(`   Current Status: ${order.status}`);

        // 2. Prepare Payload (Simulating SyncPay)
        // We test the 'identifier' field as observed in recent logs/docs
        const payload = {
            identifier: order.transactionId, // or id_transaction
            status: 'PAID', // or COMPLETED
            payment_status: 'PAID'
        };

        console.log("🚀 Sending Simulated Webhook Request...");
        console.log("   Payload:", payload);

        const response = await fetch('http://localhost:3000/api/webhooks/syncpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`📡 Response Status: ${response.status}`);
        const data = await response.json();
        console.log("   Response Body:", data);

        if (response.ok) {
            console.log("✅ Webhook accepted the request.");

            // 3. Verify DB Update
            const updatedOrder = await prisma.order.findUnique({
                where: { id: order.id }
            });

            console.log(`📝 Order Status After Webhook: ${updatedOrder.status}`);

            if (updatedOrder.status === 'PAID') {
                console.log("🎉 SUCCESS: Order was updated to PAID!");
            } else {
                console.log("⚠️ FAILURE: Order is still PENDING. Check logs.");
            }

        } else {
            console.log("❌ Webhook returned an error.");
        }

    } catch (error) {
        console.error("💥 Script Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateWebhook();
