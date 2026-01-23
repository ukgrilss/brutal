'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Master Credentials Hardcoded
    const MASTER_EMAIL = "brutalrls@gmail.com"
    const MASTER_PASS = "formulaG1@"

    // Get store config or create default
    let config = await prisma.storeConfig.findFirst()
    if (!config) {
        config = await prisma.storeConfig.create({
            data: {}
        })
    }

    if (email === MASTER_EMAIL && password === MASTER_PASS) {
        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'true', {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 Days persistence
        })
        return { success: true }
    } else {
        return { success: false, error: 'Credenciais inválidas' }
    }
}

export async function getStoreConfig() {
    let config = await prisma.storeConfig.findFirst()
    if (!config) {
        config = await prisma.storeConfig.create({
            data: {}
        })
    }
    return config
}

export async function updateStoreConfig(formData: FormData) {
    const storeName = formData.get('storeName') as string
    const sincPayKey = (formData.get('sincPayKey') as string).trim()
    const sincPaySecret = (formData.get('sincPaySecret') as string).trim()
    const adminPassword = formData.get('adminPassword') as string

    const heroMode = formData.get('heroMode') as string
    const heroTitle = formData.get('heroTitle') as string
    const heroDescription = formData.get('heroDescription') as string
    const showHeroButton = formData.get('showHeroButton') === 'on' // Checkbox returns 'on' if checked
    const heroButtonText = formData.get('heroButtonText') as string
    const heroButtonUrl = formData.get('heroButtonUrl') as string

    const config = await getStoreConfig()

    await prisma.storeConfig.update({
        where: { id: config.id },
        data: {
            storeName,
            sincPayKey,
            sincPaySecret,
            heroMode,
            heroTitle,
            heroDescription,
            showHeroButton,
            heroButtonText,
            heroButtonUrl,
            adminPassword: adminPassword || config.adminPassword
        }
    })

    revalidatePath('/bobao/dashboard/settings')
    revalidatePath('/') // Update storefront too
    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    redirect('/bobao')
}

export async function verifySession(token: string) {
    return token === 'true'
}
