const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanMedia() {
    console.log('Checking for invalid media...')

    // Find all media with local upload paths
    const invalidMedia = await prisma.media.findMany({
        where: {
            url: { startsWith: '/uploads/' }
        },
        include: { product: true }
    })

    console.log(`Found ${invalidMedia.length} invalid media entries.`)

    for (const m of invalidMedia) {
        console.log(`- Deleting invalid media ${m.id} from product: ${m.product.name} (${m.url})`)
        await prisma.media.delete({ where: { id: m.id } })
    }

    console.log('Valid Backend B2 Media Check:')
    const validMedia = await prisma.media.findMany({
        take: 5,
        orderBy: { id: 'desc' }
    })
    console.log(JSON.stringify(validMedia, null, 2))
}

cleanMedia()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
