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

  // Sign Category URLs (Private Bucket Fix)
  const { getDownloadToken } = await import('@/lib/b2-native')

  const signedCategories = await Promise.all(categories.map(async (cat) => {
    if (cat.imageUrl && cat.imageUrl.includes('backblazeb2.com')) {
      // Extract path and sign
      const parts = cat.imageUrl.split('/file/')
      if (parts.length === 2 && parts[1]) {
        const subParts = parts[1].split('/')
        const filePath = subParts.slice(1).join('/') // remove bucket name
        try {
          const { finalUrl } = await getDownloadToken(filePath, 3600) // 1 hour validity
          return { ...cat, imageUrl: finalUrl }
        } catch (e) {
          console.error('Failed to sign category url:', cat.name, e)
          return cat
        }
      }
    }
    return cat
  }))
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
      categories={signedCategories}
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
