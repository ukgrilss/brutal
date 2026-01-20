import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ProductDetails } from './product-details'
import { VideoPlayer } from './video-player'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getSession } from '@/lib/auth'

export default async function ProductPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const resolvedSearchParams = await searchParams

    // Fetch Data in Parallel (Optimization)
    const [cookieStore, session, product] = await Promise.all([
        cookies(),
        getSession(),
        prisma.product.findUnique({
            where: { id },
            include: { media: true, plans: true }
        })
    ])

    if (!product) {
        return notFound()
    }

    const isAdmin = cookieStore.get('admin_session')?.value === 'true'
    const user = session?.user

    let hasAccess = false

    // Check Access
    if (user) {
        const order = await prisma.order.findFirst({
            where: {
                productId: id,
                userId: user.id,
                status: 'PAID'
            }
        })
        if (order) hasAccess = true
    }

    // Access via Legacy Cookie (Fallback)
    if (!hasAccess) {
        const customerEmail = cookieStore.get('customer_email')?.value
        if (customerEmail) {
            const order = await prisma.order.findFirst({
                where: {
                    productId: id,
                    customerEmail: customerEmail,
                    status: 'PAID'
                }
            })
            if (order) hasAccess = true
        }
    }

    // Logic for Video Products
    if (product.type === 'VIDEO') {

        // Admin Access Override (requires ?watch=1 to view player, otherwise shows sales page with admin controls)
        const adminWantsToWatch = isAdmin && resolvedSearchParams?.watch === '1'

        if (hasAccess || adminWantsToWatch) {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col relative">
                    {/* Admin Back Button */}
                    <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
                        <Link href="/my-orders">
                            <Button variant="outline" className="bg-black/50 border-white/10 hover:bg-white/10 text-white backdrop-blur-md">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                            </Button>
                        </Link>
                        {isAdmin && (
                            <div className="px-3 py-1.5 rounded-full bg-red-600/20 border border-red-600/50 text-red-500 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                Modo Admin
                            </div>
                        )}
                    </div>

                    {/* Main Cinema Content */}
                    <div className="flex-1 flex flex-col items-center pt-24 pb-12 px-4 md:px-8">
                        <div className="w-full max-w-[1600px] space-y-8 animate-in fade-in zoom-in-95 duration-700">

                            {/* Video Player Section */}
                            <VideoPlayer product={product} hasAccess={hasAccess || adminWantsToWatch} />

                            {/* Video Info Section */}
                            <div className="max-w-5xl mx-auto w-full space-y-6">
                                <div className="space-y-4 border-b border-white/5 pb-6">
                                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                                        {product.name}
                                    </h1>
                                    <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                                        {product.description}
                                    </p>
                                </div>

                                {/* Status Badges */}
                                <div className="flex items-center gap-4">
                                    {hasAccess ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 rounded-lg border border-green-900/50 text-green-400 text-sm">
                                            Você tem acesso via: <span className="font-bold text-white">{user ? user.email : 'Cookie'}</span>
                                        </div>
                                    ) : (
                                        isAdmin && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-600/10 rounded-lg border border-yellow-600/30 text-yellow-500 text-sm">
                                                <span>⚠️ Visualizando como Administrador (Sem compra vinculada)</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }

    return <ProductDetails product={product} isAdmin={isAdmin} user={user} hasAccess={hasAccess} />
}
