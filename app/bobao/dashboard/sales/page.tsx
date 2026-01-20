'use client'

import { useEffect, useState } from 'react'
import { getSalesHistory } from './actions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Receipt, AlertCircle, ShoppingBag } from 'lucide-react'

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const res = await getSalesHistory()
            if (res.success) {
                setSales(res.data)
            }
            setLoading(false)
        }
        load()
    }, [])

    const formatBRL = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Minhas Vendas</h1>
                <p className="text-zinc-500">Extrato detalhado de todas as transações aprovadas.</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-green-500" />
                        Histórico de Vendas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-zinc-950">
                                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                    <TableHead className="text-zinc-400">Data</TableHead>
                                    <TableHead className="text-zinc-400">Produto</TableHead>
                                    <TableHead className="text-zinc-400">Cliente</TableHead>
                                    <TableHead className="text-zinc-400">Status</TableHead>
                                    <TableHead className="text-right text-zinc-400">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                            Nenhuma venda registrada ainda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sales.map((sale) => (
                                        <TableRow key={sale.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                            <TableCell className="font-mono text-zinc-400 text-xs">
                                                {new Date(sale.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{sale.productName || sale.product?.name}</span>
                                                    <span className="text-xs text-zinc-500 uppercase">{sale.product?.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-300">{sale.customerName || sale.user?.name || 'Cliente'}</span>
                                                    <span className="text-xs text-zinc-500">{sale.customerEmail || sale.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                                    APROVADO
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-white">
                                                {formatBRL(sale.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-400">Sobre os Valores</h4>
                    <p className="text-sm text-zinc-400">
                        O sistema armazena valores em CENTAVOS no banco de dados.
                        Se você ver um valor como <strong>R$ 0,22</strong>, significa que o banco registrou <strong>22 centavos</strong>.
                        Isso é comum em testes. Vendas reais terão valores como 1990 (R$ 19,90) ou 9700 (R$ 97,00).
                    </p>
                </div>
            </div>
        </div>
    )
}
