const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Listing last 10 Orders...')
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true, user: true }
    })

    if (orders.length === 0) {
        console.log('❌ No orders found.')
    } else {
        orders.forEach(o => {
            console.log(`------------------------------------------------`)
            console.log(`ID: ${o.id}`)
            console.log(`Product: ${o.productName || o.product?.name}`)
            console.log(`Customer: ${o.customerEmail} (${o.customerName})`)
            console.log(`Status: ${o.status}`)
            console.log(`Transaction ID: ${o.transactionId}`)
            console.log(`Date: ${o.createdAt.toLocaleString()}`)
            console.log(`------------------------------------------------`)
        })
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
