
'use client'
import { Button } from '@/components/ui/button'
import { createAnonymousCheckout, checkOrderStatus } from './actions'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, CheckCircle, Unlock, Zap } from "lucide-react"

interface Product {
    id: string;
    name: string;
    price: number;
    groupLink: string;
    type: string; // Add type to product interface
}

export function CheckoutButton({ product, selectedPrice, selectedPlan, user }: { product: Product, selectedPrice?: number, selectedPlan?: any, user?: any }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'email' | 'password' | 'generating' | 'waiting_payment' | 'paid'>('email')

    // Auth State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [paymentData, setPaymentData] = useState<any>(null)

    // Init Logic
    useEffect(() => {
        if (open) {
            if (user) {
                // Already logged in, go straight to PIX
                if (step === 'email') generatePix()
            } else {
                setStep('email')
            }
        }
    }, [open, user])

    // Polling Effect
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (step === 'waiting_payment' && paymentData?.orderId) {
            interval = setInterval(async () => {
                try {
                    const orderStatus = await checkOrderStatus(paymentData.orderId)
                    if (orderStatus === 'PAID') {
                        setStep('paid')
                        clearInterval(interval)

                        // Auto-reload after 3 seconds
                        setTimeout(() => {
                            window.location.reload()
                        }, 3000)
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [step, paymentData])

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        // Dynamically import to avoid server actions in client logs? No, next handles it.
        // We need to import the actions.
        const { requestAccessPassword } = await import('@/app/auth/actions')
        const res = await requestAccessPassword(email)
        setLoading(false)

        if (res.success) {
            setStep('password')
        } else {
            alert(res.error || "Erro ao processar email")
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const { verifyAndLogin } = await import('@/app/auth/actions')
        const res = await verifyAndLogin(email, password)
        setLoading(false)

        if (res.success) {
            // Login successful, generate PIX
            await generatePix()
        } else {
            alert(res.error || "Senha incorreta")
        }
    }

    async function generatePix() {
        setStep('generating')
        try {
            const res = await createAnonymousCheckout(
                product.id,
                selectedPlan?.id || null
            )

            if (res.success) {
                setPaymentData(res)
                setStep('waiting_payment')
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Erro ao gerar PIX")
            setOpen(false)
        }
    }

    const copyToClipboard = () => {
        if (paymentData?.pixCode) {
            navigator.clipboard.writeText(paymentData.pixCode)
            alert("Código PIX copiado!")
        }
    }

    // Success View
    if (step === 'paid') {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" className="w-full py-6 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                        <Zap className="w-5 h-5 mr-2 fill-current" /> COMPRAR AGORA
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-green-950 border-green-800 text-white">
                    <div className="flex flex-col items-center justify-center text-center py-8 space-y-6">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase text-white mb-2">Pagamento Confirmado!</h2>
                            <p className="text-green-200">Seu vídeo será liberado em instantes...</p>
                            <Loader2 className="w-6 h-6 text-green-400 animate-spin mx-auto mt-4" />
                        </div>

                        <div className="w-full p-6 bg-black/30 rounded-xl border-2 border-green-500/50 flex flex-col items-center gap-4">
                            <Unlock className="w-8 h-8 text-green-400" />
                            <div className="space-y-1">
                                <p className="text-sm text-green-300 font-bold uppercase tracking-widest">Link de Acesso (Grupo VIP)</p>
                                <a
                                    href={product.groupLink.startsWith('http') ? product.groupLink : `https://${product.groupLink}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xl md:text-2xl font-bold text-white hover:text-green-400 underline break-all"
                                >
                                    {product.groupLink}
                                </a>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold" onClick={() => window.open(product.groupLink.startsWith('http') ? product.groupLink : `https://${product.groupLink}`, '_blank')}>
                                ABRIR GRUPO AGORA 🚀
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // --- MAIN RENDER ---
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="w-full py-6 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <Zap className="w-5 h-5 mr-2 fill-current" /> COMPRAR AGORA
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">
                        {step === 'email' && 'Identificação'}
                        {step === 'password' && 'Verificação Segura'}
                        {step === 'generating' && 'Gerando Pagamento...'}
                        {step === 'waiting_payment' && 'Pagamento Instantâneo'}
                    </DialogTitle>
                </DialogHeader>

                {/* STEP 1: EMAIL */}
                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Seu melhor email</Label>
                            <Input
                                type="email"
                                placeholder="exemplo@email.com"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                            />
                            <p className="text-xs text-zinc-500">
                                Vamos enviar uma senha de acesso para este email.
                            </p>
                        </div>
                        <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continuar"}
                        </Button>
                    </form>
                )}

                {/* STEP 2: PASSWORD */}
                {step === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 py-4">
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg text-sm text-blue-200">
                            Enviamos uma <strong>senha de 10 dígitos</strong> para <strong>{email}</strong>.
                            Verifique sua caixa de entrada (ou spam).
                        </div>
                        <div className="space-y-2">
                            <Label>Senha enviada</Label>
                            <Input
                                type="text"
                                placeholder="Cole a senha aqui"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 font-mono text-center tracking-widest uppercase"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar e Pagar"}
                        </Button>
                        <button type="button" onClick={() => setStep('email')} className="text-xs text-zinc-500 hover:underline w-full text-center">
                            Trocar email
                        </button>
                    </form>
                )}


                {/* STEP 3: PIX (Generating/Waiting) */}
                {(step === 'generating' || step === 'waiting_payment') && (
                    <div className="space-y-6 py-4 flex flex-col items-center">
                        {step === 'generating' ? (
                            <Loader2 className="w-16 h-16 text-red-600 animate-spin" />
                        ) : (
                            <>
                                <div className="bg-white p-4 rounded-xl relative">
                                    {paymentData?.pixCode && (
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.pixCode)}`}
                                            alt="QR Code Pix"
                                            className="w-48 h-48 mx-auto"
                                        />
                                    )}
                                    <div className="absolute -bottom-3 -right-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                                        AGUARDANDO
                                    </div>
                                </div>

                                <div className="w-full space-y-2">
                                    <Label className="text-center block text-zinc-400 text-xs uppercase tracking-widest">Código Copia e Cola</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={paymentData?.pixCode || ''}
                                            className="bg-zinc-900 border-zinc-700 flex-1 font-mono text-xs text-zinc-300"
                                        />
                                        <Button onClick={copyToClipboard} variant="outline" size="icon" className="border-zinc-700 hover:bg-zinc-800 text-white">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
