
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Extraindo dados do SQLite...');

    // 1. StoreConfig
    const storeConfig = await prisma.storeConfig.findMany();
    console.log(`✅ ${storeConfig.length} Configurações encontradas.`);

    // 2. Categories
    const categories = await prisma.category.findMany();
    console.log(`✅ ${categories.length} Categorias encontradas.`);

    // 3. Products (com Media e Plans)
    const products = await prisma.product.findMany({
        include: {
            media: true,
            plans: true
        }
    });
    console.log(`✅ ${products.length} Produtos encontrados.`);

    // 4. Banners
    const banners = await prisma.banner.findMany();
    console.log(`✅ ${banners.length} Banners encontrados.`);

    const dump = {
        storeConfig,
        categories,
        products,
        banners
    };

    fs.writeFileSync('migration_dump.json', JSON.stringify(dump, null, 2));
    console.log('💾 Dados salvos em migration_dump.json');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
