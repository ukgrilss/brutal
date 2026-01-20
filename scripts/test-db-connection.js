const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('⏳ Tentando conectar ao banco de dados...')
    try {
        await prisma.$connect()
        console.log('✅ Conexão bem sucedida (Prisma Connected)!')

        const count = await prisma.user.count()
        console.log(`📊 Teste de query: ${count} usuários encontrados.`)

    } catch (e) {
        console.error('❌ Falha na conexão:')
        console.error(e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
