'use client'

import { useEffect, useState } from 'react'
import { getCustomers, sendBulkEmail, type CustomerFilter } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Users, ShoppingCart, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomersPage() {
    const [filter, setFilter] = useState<CustomerFilter>('all')
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])

    // Email State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const [emailSubject, setEmailSubject] = useState('')
    const [emailBody, setEmailBody] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        loadCustomers()
    }, [filter])

    async function loadCustomers() {
        setLoading(true)
        setSelectedOrders([]) // Reset selection on filter change
        const res = await getCustomers(filter)
        if (res.success && res.data) {
            setOrders(res.data)
        } else {
            toast.error(res.error)
        }
        setLoading(false)
    }

    function toggleSelectAll() {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([])
        } else {
            setSelectedOrders(orders.map(o => o.id))
        }
    }

    function toggleSelect(id: string) {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(prev => prev.filter(oid => oid !== id))
        } else {
            setSelectedOrders(prev => [...prev, id])
        }
    }

    async function handleSendEmail() {
        if (!emailSubject || !emailBody) {
            toast.error('Preencha assunto e mensagem')
            return
        }

        setSending(true)
        const res = await sendBulkEmail(selectedOrders, emailSubject, emailBody)
        setSending(false)

        if (res.success) {
            toast.success(res.message)
            setIsEmailModalOpen(false)
            setEmailSubject('')
            setEmailBody('')
            setSelectedOrders([])
        } else {
            toast.error(res.error)
        }
    }

    function insertTag(tag: string) {
        setEmailBody(prev => prev + ` ${tag} `)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Clientes & CRM</h1>

                <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            disabled={selectedOrders.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all"
                        >
                            <Mail className="w-4 h-4" />
                            Enviar Email ({selectedOrders.length})
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Disparo em Massa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Assunto</label>
                                <Input
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    placeholder="Ex: Seu acesso chegou!"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-zinc-400">Mensagem</label>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => insertTag('<nome_cliente>')} className="text-xs h-6 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            + Nome
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => insertTag('<pix_code>')} className="text-xs h-6 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            + Pix
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => insertTag('<nome_produto>')} className="text-xs h-6 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                            + Produto
                                        </Button>
                                    </div>
                                </div>
                                <Textarea
                                    className="bg-zinc-900 border-zinc-800 text-white min-h-[200px]"
                                    placeholder="Escreva sua mensagem aqui..."
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                />
                                <p className="text-xs text-zinc-500">
                                    Use as tags acima para personalizar a mensagem para cada cliente.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-endギャップ">
                            <Button
                                onClick={handleSendEmail}
                                disabled={sending}
                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                Disparar para {selectedOrders.length} clientes
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Overview (Simple) */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users /></div>
                    <div>
                        <p className="text-sm text-zinc-400">Total de Pedidos</p>
                        <h3 className="text-2xl font-bold text-white">{orders.length}</h3>
                    </div>
                </div>
                {/* Future stats can go here */}
            </div>

            <Tabs defaultValue="all" onValueChange={(v: string) => setFilter(v as CustomerFilter)} className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="video_buyers">Vídeo (Pagos)</TabsTrigger>
                    <TabsTrigger value="group_buyers">Grupo (Pagos)</TabsTrigger>
                    <TabsTrigger value="pending_pix">Pix Pendente</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="mt-6">
                    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-zinc-900">
                                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={orders.length > 0 && selectedOrders.length === orders.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </TableHead>
                                    <TableHead className="text-zinc-300">Data</TableHead>
                                    <TableHead className="text-zinc-300">Cliente</TableHead>
                                    <TableHead className="text-zinc-300">Produto</TableHead>
                                    <TableHead className="text-zinc-300">Status</TableHead>
                                    <TableHead className="text-zinc-300">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                            <div className="flex justify-center items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : orders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                            Nenhum cliente encontrado neste filtro.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.map((order) => (
                                        <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedOrders.includes(order.id)}
                                                    onCheckedChange={() => toggleSelect(order.id)}
                                                    className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                            </TableCell>
                                            <TableCell className="text-zinc-400 font-mono text-xs">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">{order.customerName || 'N/A'}</span>
                                                    <span className="text-zinc-500 text-xs">{order.customerEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {order.product?.type === 'VIDEO' ? <AlertCircle className="w-3 h-3 text-purple-500" /> : <Users className="w-3 h-3 text-emerald-500" />}
                                                    <span className="text-zinc-300">{order.productName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    order.status === 'PAID' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                                                        order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-zinc-800 text-zinc-400'
                                                }>
                                                    {order.status === 'PAID' ? 'Pago' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-300">
                                                R$ {(order.amount / 100).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
