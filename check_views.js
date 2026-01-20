
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            type: true,
            views: true,
            fakeViews: true,
            fakeDate: true
        }
    })

    console.log('--- PRODUCTS ---')
    products.forEach(p => {
        console.log(`[${p.type}] ${p.name}`)
        console.log(`   Real Views: ${p.views}`)
        console.log(`   Fake Views (DB): ${p.fakeViews}`)
        console.log(`   Fake Date (DB): ${p.fakeDate}`)
        console.log('----------------')
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
