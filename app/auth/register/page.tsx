'use client'

import { useActionState } from 'react'
import { userRegister } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const [state, action, isPending] = useActionState(userRegister, null)

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Crie sua Conta</h1>
                    <p className="text-zinc-400 mt-2">Para acessar conteúdos exclusivos</p>
                </div>

                <form action={action} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="seu@email.com"
                            required
                            className="bg-zinc-900 border-zinc-800 focus:border-white"
                        />
                        {state?.error?.email && (
                            <p className="text-xs text-red-500">{state.error.email[0]}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
                    </Button>

                    <div className="text-center text-sm text-zinc-500">
                        Já tem uma conta?{' '}
                        <Link href="/auth/login" className="text-white hover:underline">
                            Faça login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
