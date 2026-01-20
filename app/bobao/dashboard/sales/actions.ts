'use server'

import { prisma } from "@/lib/db"

export async function getSalesHistory() {
    try {
        const sales = await prisma.order.findMany({
            where: {
                status: 'PAID'
            },
            include: {
                product: {
                    select: {
                        name: true,
                        type: true
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return { success: true, data: sales }
    } catch (error: any) {
        console.error('Error fetching sales history:', error)
        return { success: false, error: 'Erro ao buscar vendas.' }
    }
}
