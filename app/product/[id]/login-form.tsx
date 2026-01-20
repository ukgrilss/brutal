'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginToWatch } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function LoginForm({ productId }: { productId: string }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await loginToWatch(productId, email)
            if (res.success) {
                router.refresh()
            } else {
                setError(res.error || 'Erro ao autenticar.')
            }
        } catch (e) {
            setError('Falha na requisição.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-zinc-500 hover:text-white mt-4 text-xs uppercase tracking-widest w-full">
                    Já comprei este vídeo
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Acessar Conteúdo</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Insira o email utilizado na compra para liberar o acesso.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

                    <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
