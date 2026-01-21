
const styles = {
    container: `
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
    `,
    header: `
        background-color: #000000;
        padding: 30px 40px;
        text-align: center;
    `,
    logo: `
        color: #ffffff;
        font-size: 24px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: -0.5px;
        margin: 0;
    `,
    body: `
        padding: 40px;
        color: #333333;
        line-height: 1.6;
    `,
    h1: `
        font-size: 24px;
        font-weight: 700;
        color: #111111;
        margin: 0 0 20px 0;
    `,
    text: `
        font-size: 16px;
        color: #4b5563;
        margin-bottom: 24px;
    `,
    codeBox: `
        background-color: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 20px;
        text-align: center;
        font-family: 'Courier New', monospace;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 4px;
        color: #000000;
        margin: 30px 0;
    `,
    button: `
        display: inline-block;
        background-color: #16a34a; /* Green-600 */
        color: #ffffff;
        font-weight: bold;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 6px;
        text-align: center;
        font-size: 16px;
        margin: 20px 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    `,
    footer: `
        background-color: #f9fafb;
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
    `
}

export function getAccessPasswordEmail(password: string) {
    return `
        <div style="${styles.container}">
            <div style="${styles.header}">
                <h1 style="${styles.logo}">LOJA<span style="color: #dc2626;">.</span></h1>
            </div>
            <div style="${styles.body}">
                <h1 style="${styles.h1}">Sua Senha de Acesso 🔐</h1>
                <p style="${styles.text}">
                    Olá! Você solicitou acesso à nossa loja. Use o código abaixo para completar seu login ou finalizar sua compra.
                </p>
                
                <div style="${styles.codeBox}">
                    ${password}
                </div>

                <p style="${styles.text}">
                    Esta senha é sua chave única de acesso. 
                    <strong style="color: #dc2626;">Guarde essa senha, pois não é possível alterá-la.</strong>
                </p>
            </div>
            <div style="${styles.footer}">
                &copy; ${new Date().getFullYear()} Loja de Grupos. Todos os direitos reservados.
            </div>
        </div>
    `
}

export function getPurchaseConfirmationEmail(customerName: string, productName: string, accessLink: string) {
    return `
        <div style="${styles.container}">
            <div style="${styles.header}">
                <h1 style="${styles.logo}">LOJA<span style="color: #dc2626;">.</span></h1>
            </div>
            <div style="${styles.body}">
                <h1 style="${styles.h1}">Pagamento Confirmado! 🚀</h1>
                <p style="${styles.text}">
                    Olá, <strong>${customerName}</strong>!
                </p>
                <p style="${styles.text}">
                    Temos ótimas notícias! Sua compra de <strong>${productName}</strong> foi confirmada e seu acesso já foi liberado.
                </p>

                <div style="text-align: center;">
                    <a href="${accessLink}" style="${styles.button}">
                        ACESSAR AGORA
                    </a>
                </div>

                <p style="${styles.text}">
                    Ou utilize o link abaixo:<br/>
                    <a href="${accessLink}" style="color: #16a34a; word-break: break-all;">${accessLink}</a>
                </p>

                <p style="${styles.text}">
                    Obrigado pela preferência!
                </p>
            </div>
            <div style="${styles.footer}">
                <p>Este email foi enviado para <strong>${customerName}</strong> referente ao pedido de <strong>${productName}</strong>.</p>
                &copy; ${new Date().getFullYear()} Loja de Grupos.
            </div>
            <div style="display:none;white-space:nowrap;font:15px courier;line-height:0;">
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; 
            </div>
        </div>
    `
}
