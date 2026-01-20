'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    DollarSign,
    ShoppingCart,
    Users,
    TrendingUp,
    Percent,
    Package,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react'
// import { Progress } from '@/components/ui/progress'

// Using local Progress if shadcn not installed or import error, but assuming basic divs for max compatibility first
function ProgressBar({ value, colorClass }: { value: number, colorClass: string }) {
    return (
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    )
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const res = await getDashboardStats()
            if (res.success) {
                setStats(res.data)
            }
            setLoading(false)
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (!stats) return <div className="text-white">Erro ao carregar dados.</div>

    const formatBRL = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white">Dashboard Pro</h1>
                    <p className="text-zinc-500">Visão avançada da performance da loja.</p>
                </div>
                <div className="flex gap-2">
                    <a href="/bobao/dashboard/products/new" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm uppercase transition-colors shadow-lg shadow-red-900/20">
                        + Produto
                    </a>
                </div>
            </div>

            {/* Row 1: Primary KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent group-hover:from-blue-600/20 transition-all" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Faturamento Líquido</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatBRL(stats.financial.totalRevenue)}</div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center">
                            <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                            +100% vs mês anterior
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent group-hover:from-purple-600/20 transition-all" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total de Vendas</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.funnel.paid}</div>
                        <p className="text-xs text-zinc-500 mt-1">transações aprovadas</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent group-hover:from-green-600/20 transition-all" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Ticket Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatBRL(stats.financial.averageTicket)}</div>
                        <p className="text-xs text-zinc-500 mt-1">por pedido aprovado</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent group-hover:from-orange-600/20 transition-all" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Taxa de Aprovação</CardTitle>
                        <Percent className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.rates.approvalRate.toFixed(1)}%</div>
                        <div className="mt-2">
                            <ProgressBar value={stats.rates.approvalRate} colorClass="bg-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Secondary Metrics & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ARPU & Stats */}
                <div className="space-y-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">ARPU (Valor por Cliente)</CardTitle>
                            <CardDescription className="text-zinc-600">Média gasta por cada cliente único.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white mb-2">{formatBRL(stats.financial.arpu)}</div>
                            <p className="text-sm text-zinc-500">
                                Isso indica o potencial de LTV (Lifetime Value).
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase text-zinc-500">Inventário</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-zinc-950 p-2 rounded-lg">
                                <div className="text-xl font-bold text-white">{stats.counts.products}</div>
                                <div className="text-xs text-zinc-500">Produtos</div>
                            </div>
                            <div className="bg-zinc-950 p-2 rounded-lg">
                                <div className="text-xl font-bold text-white">{stats.counts.categories}</div>
                                <div className="text-xs text-zinc-500">Categorias</div>
                            </div>
                            <div className="bg-zinc-950 p-2 rounded-lg">
                                <div className="text-xl font-bold text-white">{stats.counts.banners}</div>
                                <div className="text-xs text-zinc-500">Banners</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Products */}
                <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Package className="w-5 h-5 text-red-500" />
                            Top Produtos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {stats.topProducts.length === 0 ? (
                            <p className="text-zinc-500 text-sm">Nenhuma venda ainda.</p>
                        ) : (
                            stats.topProducts.map((prod: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white font-medium">{i + 1}. {prod.name}</span>
                                        <span className="text-zinc-400">{prod.count} vendas</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-600 to-red-400"
                                            style={{ width: `${(prod.count / stats.topProducts[0].count) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-600 text-right">{formatBRL(prod.revenue)} gerado</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Funnel */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Funil de Vendas</CardTitle>
                        <CardDescription className="text-zinc-600">Conversão de visualizações até a venda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 relative pt-4">

                        <div className="relative z-10 space-y-6">
                            {/* Step 1 */}
                            <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase">Visualizações</p>
                                    <p className="text-lg font-bold text-white">{stats.funnel.views}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-blue-900/20 text-blue-400 text-xs px-2 py-1 rounded">100%</span>
                                </div>
                            </div>

                            {/* Connector */}
                            <div className="w-0.5 h-4 bg-zinc-800 mx-auto -my-2" />

                            {/* Step 2 */}
                            <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase">Checkouts Iniciados</p>
                                    <p className="text-lg font-bold text-white">{stats.funnel.initiated}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-purple-900/20 text-purple-400 text-xs px-2 py-1 rounded">
                                        {stats.funnel.views > 0 ? ((stats.funnel.initiated / stats.funnel.views) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Connector */}
                            <div className="w-0.5 h-4 bg-zinc-800 mx-auto -my-2" />

                            {/* Step 3 */}
                            <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-green-900/30 shadow-[0_0_15px_rgba(22,163,74,0.1)]">
                                <div>
                                    <p className="text-xs text-green-500 uppercase font-bold">Vendas Reais</p>
                                    <p className="text-lg font-bold text-white">{stats.funnel.paid}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded font-bold">
                                        {stats.funnel.initiated > 0 ? ((stats.funnel.paid / stats.funnel.initiated) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
