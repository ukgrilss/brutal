
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Importando dados para PostgreSQL (Supabase)...');

    const rawData = fs.readFileSync('migration_dump.json');
    const data = JSON.parse(rawData);

    // 1. StoreConfig
    for (const config of data.storeConfig) {
        // Remove ID to let it regenerate if conflicts, or keeps it.
        // Usually config is singleton, so we upsert or create.
        // Cleaning dates
        delete config.createdAt;
        delete config.updatedAt;

        await prisma.storeConfig.create({ data: config });
    }
    console.log(`✅ Configurações importadas.`);

    // 2. Categories
    for (const cat of data.categories) {
        delete cat.createdAt;
        delete cat.updatedAt;
        await prisma.category.create({ data: cat });
    }
    console.log(`✅ ${data.categories.length} Categorias importadas.`);

    // 3. Products
    for (const prod of data.products) {
        const { media, plans, ...productData } = prod;
        delete productData.createdAt;
        delete productData.updatedAt;

        const createdProduct = await prisma.product.create({
            data: productData
        });

        // Media
        if (media && media.length > 0) {
            for (const m of media) {
                await prisma.media.create({
                    data: {
                        type: m.type,
                        url: m.url,
                        productId: createdProduct.id
                    }
                });
            }
        }

        // Plans
        if (plans && plans.length > 0) {
            for (const p of plans) {
                delete p.createdAt;
                delete p.updatedAt;
                await prisma.productPlan.create({
                    data: {
                        name: p.name,
                        price: p.price,
                        productId: createdProduct.id
                    }
                });
            }
        }
    }
    console.log(`✅ ${data.products.length} Produtos importados.`);

    // 4. Banners
    for (const banner of data.banners) {
        delete banner.createdAt;
        delete banner.updatedAt;
        await prisma.banner.create({ data: banner });
    }
    console.log(`✅ ${data.banners.length} Banners importados.`);

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
