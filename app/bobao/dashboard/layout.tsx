import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '../actions'
import { AdminSidebar } from './sidebar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie) {
        redirect('/bobao')
    }

    const isValid = await verifySession(sessionCookie.value)
    if (!isValid) {
        redirect('/bobao')
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-black font-sans">
            {/* Desktop Sidebar */}
            <AdminSidebar className="hidden md:flex w-64 fixed inset-y-0 z-50" />

            {/* Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-40 h-16 border-b bg-background/80 backdrop-blur-md px-4 flex items-center justify-between">
                    <span className="font-bold uppercase tracking-tighter">Admin Area</span>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-zinc-800 bg-zinc-900 border-r">
                            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                            <SheetDescription className="sr-only">Navegue pelas opções do painel administrativo</SheetDescription>
                            <AdminSidebar />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content */}
                <main className="p-6 md:p-8 flex-1 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
