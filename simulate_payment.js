const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Hardcoded ID from previous step
    const orderId = 'cmklixlfe0002va24bqjmpcyj'
    await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' }
    })
    console.log(`✅ Pedido ${orderId} atualizado para PAID!`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
