import { cookies } from 'next/headers'
import { LoginForm } from './login-form'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const cookieStore = await cookies()
    if (cookieStore.has('admin_session')) {
        redirect('/bobao/dashboard')
    }
    return <LoginForm />
}
