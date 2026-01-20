'use server'

import { prisma } from "@/lib/db"

export async function getDashboardStats() {
    try {
        // 1. Basic Counts
        const productCount = await prisma.product.count()
        const categoryCount = await prisma.category.count()
        const bannerCount = await prisma.banner.count()

        // 2. Financial Metrics (PAID Orders)
        const paidOrders = await prisma.order.findMany({
            where: { status: 'PAID' },
            include: { user: true }
        })

        const totalRevenue = paidOrders.reduce((acc, order) => acc + order.amount, 0)
        const salesCount = paidOrders.length

        // Ticket Médio (Average Order Value)
        const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0

        // ARPU (Average Revenue Per User)
        const uniqueCustomers = new Set(paidOrders.map(o => o.customerEmail)).size
        const arpu = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0

        // 3. Pending / Approval Rate
        const pendingOrdersCount = await prisma.order.count({ where: { status: 'PENDING' } })
        const totalOrders = salesCount + pendingOrdersCount
        const approvalRate = totalOrders > 0 ? (salesCount / totalOrders) * 100 : 0

        // 4. Top Selling Products
        // Prisma doesn't support complex groupBy + join easily in one go for relation names using groupBy.
        // We will fetch orders and aggregate manually for flexibility (or use raw query if scale was huge).
        // Since we already fetched `paidOrders` above, we can aggregate in JS for MVP scale.
        const productSales: Record<string, number> = {}
        const productRevenue: Record<string, number> = {}

        paidOrders.forEach(order => {
            const name = order.productName || 'Desconhecido'
            productSales[name] = (productSales[name] || 0) + 1
            productRevenue[name] = (productRevenue[name] || 0) + order.amount
        })

        const topProducts = Object.entries(productSales)
            .map(([name, count]) => ({
                name,
                count,
                revenue: productRevenue[name]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5) // Top 5

        // 5. Funnel (Approximation)
        // Views (Product) -> Initiated (PENDING + PAID) -> Paid
        // We need to sum up views from all products
        const products = await prisma.product.findMany({ select: { views: true, fakeViews: true } })
        const totalViews = products.reduce((acc, p) => acc + (p.views || 0), 0)

        const funnel = {
            views: totalViews,
            initiated: totalOrders, // Every order starts as some intent
            paid: salesCount
        }

        return {
            success: true,
            data: {
                counts: {
                    products: productCount,
                    categories: categoryCount,
                    banners: bannerCount
                },
                financial: {
                    totalRevenue, // in cents
                    averageTicket, // in cents
                    arpu, // in cents
                    netProfit: totalRevenue, // Assuming 100% margin for digital goods now
                },
                rates: {
                    approvalRate
                },
                topProducts,
                funnel
            }
        }

    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error)
        return { success: false, error: error.message }
    }
}
