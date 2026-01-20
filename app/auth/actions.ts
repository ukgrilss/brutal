'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { compare, hash } from 'bcryptjs'
import { encrypt, logout } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sendEmail } from '@/lib/email-service'

// --- Internal Helper ---
function generatePassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let pass = ''
    for (let i = 0; i < length; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pass
}

// --- Schemas ---
const RegisterSchema = z.object({
    email: z.string().email('Email inválido'),
})

const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
})

// --- Server Actions ---

export async function requestAccessPassword(email: string) {
    if (!email || !email.includes('@')) return { error: 'Email inválido' }

    const newPassword = generatePassword(10)
    const hashedPassword = await hash(newPassword, 10)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
        // Update password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        })
    } else {
        // Create new user
        await prisma.user.create({
            data: {
                email,
                name: email.split('@')[0], // Default name
                password: hashedPassword
            }
        })
    }

    // Send Email
    const { getAccessPasswordEmail } = await import('@/lib/email-templates')
    await sendEmail(
        email,
        'Sua Senha de Acesso 🔐',
        getAccessPasswordEmail(newPassword)
    )

    return { success: true }
}

export async function verifyAndLogin(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return { error: 'Usuário não encontrado' }

    const match = await compare(password, user.password)
    if (!match) return { error: 'Senha incorreta' }

    // Create Session
    const sessionData = {
        user: { id: user.id, email: user.email, name: user.name },
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
    const token = await encrypt(sessionData)
    const cookieStore = await cookies()
    cookieStore.set('user_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: sessionData.expires,
        sameSite: 'lax',
        path: '/',
    })

    // Legacy support
    cookieStore.set('customer_email', email, { path: '/', maxAge: 60 * 60 * 24 * 30 })

    return { success: true }
}

export async function userRegister(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const parsed = RegisterSchema.safeParse(data)

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors }
    }

    const { email } = parsed.data

    const result = await requestAccessPassword(email)

    if (result.error) {
        return { error: { email: [result.error] } }
    }

    // Redirect to login with success message
    redirect('/auth/login?sent=1&email=' + encodeURIComponent(email))
}

export async function userLogin(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const parsed = LoginSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Dados inválidos' }
    }

    const { email, password } = parsed.data

    const result = await verifyAndLogin(email, password)

    if (result.error) {
        // Map string error to form error structure if needed, or just return string
        // userLogin usually returns { error: string } in this codebase's pattern
        return { error: typeof result.error === 'string' ? result.error : 'Erro ao fazer login' }
    }

    redirect('/')
}

export async function userLogout() {
    await logout()
    const cookieStore = await cookies()
    cookieStore.delete('customer_email')
    redirect('/auth/login')
}
