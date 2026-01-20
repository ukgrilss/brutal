'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Package,
    Settings,
    LogOut,
    LayoutList,
    ImagePlus,
    ExternalLink,
    Users,
    ShoppingBag
} from 'lucide-react'
import { logout } from '../actions'

export function AdminSidebar({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) {
    const pathname = usePathname()

    const links = [
        { href: '/bobao/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
        { href: '/bobao/dashboard/products', label: 'Produtos', icon: Package },
        { href: '/bobao/dashboard/categories', label: 'Categorias', icon: LayoutList },
        { href: '/bobao/dashboard/sales', label: 'Vendas (Extrato)', icon: ShoppingBag },
        { href: '/bobao/dashboard/customers', label: 'Clientes & CRM', icon: Users },
        { href: '/bobao/dashboard/banners', label: 'Banners', icon: ImagePlus },
        { href: '/bobao/dashboard/settings', label: 'Configurações', icon: Settings },
    ]

    return (
        <div className={`flex flex-col h-full bg-zinc-900 border-r border-zinc-800 ${className}`}>
            <div className="p-6">
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                    Admin<span className="text-red-600">.</span>
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map(link => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onLinkClick}
                        >
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={`w-full justify-start gap-3 ${isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800 space-y-2">
                <Link href="/">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800">
                        <ExternalLink className="w-4 h-4" />
                        Voltar para o Site
                    </Button>
                </Link>
                <form action={logout}>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-950/20">
                        <LogOut className="w-4 h-4" />
                        Sair
                    </Button>
                </form>
            </div>
        </div>
    )
}
