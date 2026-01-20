import nodemailer from 'nodemailer'

export async function sendEmail(to: string, subject: string, html: string) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

    // If no credentials, log to console (Dev mode)
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('========================================================')
        console.log(`📧 [MOCK] SENDING EMAIL TO: ${to}`)
        console.log(`📝 SUBJECT: ${subject}`)
        console.log(`📄 CONTENT:`)
        console.log(html)
        console.log('========================================================')
        return
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 465,
            secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        })

        await transporter.sendMail({
            from: `"Loja de Grupos" <${SMTP_USER}>`, // Or customize a FROM_EMAIL var
            to,
            subject,
            text: html.replace(/<[^>]*>/g, ' '), // Basic HTML to Text fallback
            html,
        })
        console.log(`✅ Email sent to ${to}`)
        return true
    } catch (error) {
        console.error('❌ Failed to send email:', error)
        // Fallback log so password isn't lost if SMTP fails
        console.log(`[FALLBACK LOG] Content: ${html}`)
        return false
    }
}
