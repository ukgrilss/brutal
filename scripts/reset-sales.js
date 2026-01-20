const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Cleaning up Orders (Sales Data)...')

    // Delete all orders
    const deleted = await prisma.order.deleteMany({})

    console.log(`✅ Deleted ${deleted.count} orders.`)
    console.log('✨ System is clean for production use.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
