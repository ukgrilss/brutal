const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const lastOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { user: true, product: true }
    })
    console.log("--------------- ÚLTIMO PEDIDO ---------------")
    if (lastOrder) {
        console.log(`ID: ${lastOrder.id}`)
        console.log(`Status: ${lastOrder.status}`)
        console.log(`Cliente (Email no Pedido): ${lastOrder.customerEmail}`)
        console.log(`User ID vinculado: ${lastOrder.userId}`)
        console.log(`Usuário (Email na Conta): ${lastOrder.user ? lastOrder.user.email : 'N/A'}`)
        console.log(`Produto: ${lastOrder.productName}`)
    } else {
        console.log("Nenhum pedido encontrado.")
    }
    console.log("---------------------------------------------")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
