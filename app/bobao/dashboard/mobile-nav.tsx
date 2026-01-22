'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './sidebar'

export function MobileNav() {
    const [open, setOpen] = useState(false)

    return (
        <header className="md:hidden sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur-md px-4 flex items-center justify-between w-full max-w-full">
            <span className="font-bold uppercase tracking-tighter">Admin Area</span>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-zinc-800 bg-zinc-900 border-r">
                    <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                    <SheetDescription className="sr-only">Navegue pelas opções do painel administrativo</SheetDescription>
                    {/* Pass handleLinkClick to close sheet when a link is clicked */}
                    <AdminSidebar onLinkClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </header>
    )
}
