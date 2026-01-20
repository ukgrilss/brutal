'use client'

import { useActionState } from 'react'
import { userLogin } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
    const [state, action, isPending] = useActionState(userLogin, null)
    const searchParams = useSearchParams()
    const emailSent = searchParams.get('sent') === '1'
    const sentEmail = searchParams.get('email')

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Faça Login</h1>
                <p className="text-zinc-400 mt-2">Entre para acessar seus vídeos</p>
            </div>

            {emailSent && (
                <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-lg text-center animate-in fade-in slide-in-from-top-4">
                    <p className="text-green-400 font-bold mb-1">Senha enviada com sucesso! 📨</p>
                    <p className="text-zinc-400 text-sm">
                        Verifique o email <strong>{sentEmail}</strong> e use a senha recebida para entrar.
                    </p>
                </div>
            )}

            <form action={action} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={sentEmail || ''}
                        placeholder="seu@email.com"
                        required
                        className="bg-zinc-900 border-zinc-800 focus:border-white"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="bg-zinc-900 border-zinc-800 focus:border-white"
                    />
                </div>

                {state?.error && (
                    <div className="p-3 rounded bg-red-900/20 border border-red-900/50 text-red-500 text-sm">
                        {String(state.error)}
                    </div>
                )}

                <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isPending}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                </Button>

                <div className="text-center text-sm text-zinc-500">
                    Não tem uma conta?{' '}
                    <Link href="/auth/register" className="text-white hover:underline">
                        Cadastre-se
                    </Link>
                </div>
            </form>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <Suspense>
                <LoginForm />
            </Suspense>
        </div>
    )
}
