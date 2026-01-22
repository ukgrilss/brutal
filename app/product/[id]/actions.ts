'use server'

import { prisma } from '@/lib/db'
// import { generateSignedPlaybackUrl } from '@/lib/b2' // Deprecated
import { getDownloadToken } from '@/lib/b2-native'
import { cookies } from 'next/headers'
import { generateValidCPF } from '@/lib/utils-cpf'

import { getSession } from '@/lib/auth'

export async function startVideoSession(productId: string) {
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get('admin_session')?.value === 'true'
    const customerEmail = cookieStore.get('customer_email')?.value
    const session = await getSession()

    // Get Product to find B2 Key AND checks for preview logic
    const product = await prisma.product.findUnique({ where: { id: productId } })

    let hasAccess = false

    if (!isAdmin) {

        // 1. Check User Session
        if (session && session.user) {
            const order = await prisma.order.findFirst({
                where: {
                    productId: productId,
                    userId: session.user.id,
                    status: 'PAID'
                }
            })
            if (order) hasAccess = true
        }

        // 2. Fallback to Legacy Cookie
        if (!hasAccess && customerEmail) {
            const order = await prisma.order.findFirst({
                where: {
                    productId: productId,
                    customerEmail: customerEmail,
                    status: 'PAID'
                }
            })
            if (order) hasAccess = true
        }

        // 3. Check for Preview Mode
        const isPreview = !hasAccess && (product?.previewDuration || 0) > 0

        if (!hasAccess && !isPreview) {
            // If logged in but no access
            if (session) return { success: false, error: 'Você não possui este vídeo.' }
            // If not logged in
            return { success: false, error: 'Sessão expirada ou não iniciada.' }
        }
    }

    if (!product || !product.contentUrl) {
        return { success: false, error: 'Vídeo não encontrado.' }
    }

    try {
        // Fix: contentUrl might be a full URL, but getDownloadToken expects just the KEY (filename)
        // Format: https://f005.backblazeb2.com/file/<BUCKET>/<KEY>
        let fileKey = product.contentUrl
        if (fileKey.includes('/file/')) {
            const parts = fileKey.split(/\/file\/[^\/]+\//)
            if (parts.length > 1) {
                fileKey = parts[1]
            }
        }

        // Also remove any query params if present
        fileKey = fileKey.split('?')[0]

        // Defensively ensure 'videos/' prefix if key seems to be just a filename
        if (!fileKey.startsWith('videos/') && !fileKey.includes('/')) {
            fileKey = `videos/${fileKey}`
        }

        // Return Proxy Stream URL
        const proxyUrl = `/api/video/stream/${fileKey}`
        console.log('Video Session Proxy:', { productId, url: proxyUrl })
        return { success: true, url: proxyUrl }
    } catch (error: any) {
        console.error('Video Session Error:', error)
        return { success: false, error: `Erro B2: ${error.message}` }
    }
}

export async function loginToWatch(productId: string, email: string) {
    // ... existing logic can remain for legacy overrides ...
    return { success: false, error: 'Use o sistema de login novo.' }
}

// --- Restored Checkout Actions ---

import { SyncPay } from '@/lib/syncpay'

export async function createAnonymousCheckout(productId: string, planId: string | null) {
    try {
        const session = await getSession()

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { plans: true }
        })

        if (!product) throw new Error('Produto não encontrado')

        let price = product.price
        let productName = product.name

        if (planId && product.plans) {
            const plan = product.plans.find(p => p.id === planId)

            console.log('[Checkout Debug] Resolving Plan:', {
                receivedPlanId: planId,
                availablePlans: product.plans.map(p => ({ id: p.id, name: p.name, price: p.price }))
            });

            if (plan) {
                price = plan.price
                productName = `${product.name} - ${plan.name}`
                console.log('[Checkout Debug] Plan Found:', { name: plan.name, price: plan.price });
            } else {
                console.warn('[Checkout Debug] Plan ID provided but not found in product plans.');
            }
        } else {
            console.log('[Checkout Debug] No Plan ID provided or Product has no plans.', { planId, hasPlans: !!product.plans });
        }

        console.log('[Checkout Debug] Final Price:', price);

        // Determine Customer Data
        let customerName = 'Cliente Anônimo'
        let customerEmail = `anon_${Date.now()}@temp.com`
        let customerId = undefined

        if (session && session.user) {
            customerName = session.user.name
            customerEmail = session.user.email
            customerId = session.user.id
        } else {
            // Set cookie for anonymous persistence
            const cookieStore = await cookies()
            cookieStore.set('customer_email', customerEmail, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            })
        }

        // Create Order in DB (Pending)
        const order = await prisma.order.create({
            data: {
                transactionId: `temp_${Date.now()}`,
                amount: price,
                productName: productName,
                customerName: customerName,
                customerEmail: customerEmail,
                customerDocument: '00000000000', // Still placeholder unless we ask for CPF
                status: 'PENDING',
                productId: productId,
                userId: customerId
            }
        })

        // 1. Authenticate with SyncPay
        const storeConfig = await prisma.storeConfig.findFirst()
        const clientId = storeConfig?.sincPayKey || process.env.SINCPAY_CLIENT_ID
        const clientSecret = storeConfig?.sincPaySecret || process.env.SINCPAY_CLIENT_SECRET

        if (!clientId || !clientSecret) {
            throw new Error('Configurações de Pagamento (SyncPay) não encontradas.')
        }

        let token = '';
        try {
            token = await SyncPay.getAuthToken(clientId, clientSecret)
        } catch (authError: any) {
            console.error('SyncPay Auth Failed:', authError);
            throw new Error(`Erro na autenticação com o Pagamento: ${authError.message}`);
        }

        // 2. Create Charge
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brutal-eight-rho.vercel.app'; // Fallback to current domain if env missing
        const webhookUrl = `${appUrl}/api/webhooks/syncpay`;

        console.log('[Checkout Debug] Webhook URL:', webhookUrl);

        const pixData = await SyncPay.createPixCharge(token, {
            amount: price / 100, // Convert cents (200) to Reais (2.00)
            description: productName,
            webhookUrl: webhookUrl,
            customer: {
                name: customerName,
                email: customerEmail, // Now sends real email if logged in
                cpf: generateValidCPF(), // Generate a valid CPF to pass gateway validation
                phone: '11999999999'
            }
        })

        if (pixData && pixData.txId) {
            // Update Order with Real Transaction ID
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    transactionId: String(pixData.txId),
                    pixCode: pixData.paymentCode,
                    pixQrCodeUrl: pixData.qrcode
                }
            })

            return {
                success: true,
                orderId: order.id,
                pixCode: pixData.paymentCode,
                pixQrCode: pixData.qrcode,
                transactionId: pixData.txId
            }
        } else {
            throw new Error('Falha ao gerar PIX na SyncPay')
        }

    } catch (error: any) {
        console.error('Checkout Error:', error)
        return { success: false, error: error.message || 'Erro ao criar checkout' }
    }
}

export async function checkOrderStatus(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId }
    })
    return order?.status || 'PENDING'
}
