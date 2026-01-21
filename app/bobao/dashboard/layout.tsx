import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '../actions'
import { AdminSidebar } from './sidebar'
import { MobileNav } from './mobile-nav'

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

                {/* Mobile Header (Logic extracted to client component) */}
                <MobileNav />

                {/* Main Content */}
                <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
