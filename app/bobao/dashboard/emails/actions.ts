'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email-service'
import { getBaseEmailHtml } from '@/lib/email-templates'

export async function saveTemplate(id: string | null, name: string, subject: string, body: string) {
    if (id) {
        await prisma.emailTemplate.update({
            where: { id },
            data: { name, subject, body }
        })
    } else {
        await prisma.emailTemplate.create({
            data: { name, subject, body }
        })
    }
    revalidatePath('/bobao/dashboard/emails')
    return { success: true }
}

export async function deleteTemplate(id: string) {
    await prisma.emailTemplate.delete({ where: { id } })
    revalidatePath('/bobao/dashboard/emails')
    return { success: true }
}

export async function getTemplates() {
    return await prisma.emailTemplate.findMany({
        orderBy: { updatedAt: 'desc' }
    })
}

export async function getTemplate(id: string) {
    return await prisma.emailTemplate.findUnique({ where: { id } })
}

export async function sendTestEmail(to: string, subject: string, bodyObj: { headline?: string, content: string }) {
    if (!to.includes('@')) return { success: false, error: 'Email inválido' }

    try {
        const fullHtml = getBaseEmailHtml(bodyObj.headline || '', bodyObj.content)
        await sendEmail(to, `[TESTE] ${subject}`, fullHtml)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
