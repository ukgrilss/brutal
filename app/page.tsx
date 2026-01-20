import { prisma } from '@/lib/db'
import { Storefront } from './storefront'
import { getSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const [storeConfig, session] = await Promise.all([
    prisma.storeConfig.findFirst(),
    getSession()
  ])

  // Parallelize the rest of the queries
  const [products, categories, banners] = await Promise.all([
    prisma.product.findMany({
      include: { media: true, plans: true },
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.category.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    }),
    prisma.banner.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    })
  ])
  let user = session?.user

  // If no user session, check for admin session
  if (!user) {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get('admin_session')?.value === 'true'
    if (isAdmin) {
      user = {
        name: 'Administrador',
        email: 'admin@loja.com',
        id: 'admin'
      }
    }
  }

  return (
    <Storefront
      products={products}
      categories={categories}
      banners={banners}
      storeName={storeConfig?.storeName || 'Loja de Grupos'}
      heroMode={storeConfig?.heroMode || 'full'}
      heroTitle={storeConfig?.heroTitle || ''}
      heroDescription={storeConfig?.heroDescription || ''}
      showHeroButton={storeConfig?.showHeroButton !== false}
      heroButtonText={storeConfig?.heroButtonText || undefined}
      heroButtonUrl={storeConfig?.heroButtonUrl || undefined}
      user={user}
    />
  )
}
