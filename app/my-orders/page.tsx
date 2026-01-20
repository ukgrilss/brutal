import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, ExternalLink, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MyOrdersPage() {
    const session = await getSession();

    if (!session || !session.user) {
        redirect("/auth/login?redirect=/my-orders");
    }

    const orders = await prisma.order.findMany({
        where: {
            userId: session.user.id,
            status: 'PAID'
        },
        include: {
            product: {
                include: {
                    media: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <div className="container mx-auto px-6 py-12">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para Loja
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Minhas Compras</h1>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/50 rounded-3xl border border-white/5">
                        <Package className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Você ainda não tem compras</h2>
                        <p className="text-zinc-400 mb-6">Explore nossos grupos e vídeos exclusivos.</p>
                        <Link href="/">
                            <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-8 py-6">
                                Ir para a Loja
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-zinc-900 transition-all flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">{order.productName}</h3>
                                        <p className="text-xs text-green-500 font-bold uppercase tracking-wider bg-green-500/10 px-2 py-1 rounded inline-block">
                                            Pago
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                        {order.product?.media[0]?.type === 'IMAGE' ? (
                                            <img src={order.product.media[0].url} alt={order.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                                                <PlayCircle className="w-6 h-6 text-zinc-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3">
                                    <div className="text-sm text-zinc-400">
                                        Comprado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                    </div>

                                    {order.product?.type === 'VIDEO' ? (
                                        <Link href={`/product/${order.productId}?watch=1`} className="block">
                                            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6">
                                                <PlayCircle className="mr-2 h-5 w-5" />
                                                Assistir Agora
                                            </Button>
                                        </Link>
                                    ) : (
                                        <a href={order.product?.groupLink?.startsWith('http') ? order.product.groupLink : `https://${order.product?.groupLink}`} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6">
                                                <ExternalLink className="mr-2 h-5 w-5" />
                                                Acessar Grupo
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
