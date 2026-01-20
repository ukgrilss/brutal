const BASE_URL = 'https://api.syncpayments.com.br';

interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface PixChargeResponse {
    txId: string;
    qrcode: string;
    paymentCode: string; // Copy-Paste
    success: boolean;
}

export const SyncPay = {
    async getAuthToken(clientId: string, clientSecret: string): Promise<string> {
        const cleanClientId = clientId.trim();
        const cleanClientSecret = clientSecret.trim();

        // Debug: Log what we are sending (partially hidden)
        console.log(`[SyncPay] DEBUG REQUEST:`);
        console.log(`URL: ${BASE_URL}/api/partner/v1/auth-token`);
        console.log(`ClientID: ${cleanClientId.substring(0, 8)}...`);
        console.log(`Body Keys: client_id, client_secret`);

        const res = await fetch(`${BASE_URL}/api/partner/v1/auth-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            cache: 'no-store',
            body: new URLSearchParams({
                'client_id': cleanClientId,
                'client_secret': cleanClientSecret
            }).toString()
        });

        // Debug: Log Response Headers and Status
        console.log(`[SyncPay] DEBUG RESPONSE: Status ${res.status} ${res.statusText}`);

        if (!res.ok) {
            const error = await res.text();
            console.error(`[SyncPay Auth Error] ${res.status}: ${error}`);
            throw new Error(`Falha na autenticação SyncPay (Status ${res.status}): ${error}`);
        }

        const rawText = await res.text();
        console.log(`[SyncPay] RAW RESPONSE BODY:`, rawText);

        let data: any;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            throw new Error(`Resposta da API não é JSON válido: ${rawText.substring(0, 100)}`);
        }

        const token = data.access_token || data.token || data.accessToken;

        console.log(`[SyncPay Debug] Auth Response Keys: ${Object.keys(data).join(', ')}`);

        if (!token) {
            const keys = Object.keys(data).join(', ');
            console.error(`[SyncPay] Token missing! Keys found: ${keys}`);
            throw new Error(`Token não encontrado na resposta. Chaves: ${keys}. Resposta completa: ${rawText}`);
        }

        return token;
    },

    async createPixCharge(token: string, data: {
        amount: number;
        description?: string;
        customer: {
            name: string;
            cpf: string;
            email: string;
            phone: string;
        }
    }): Promise<PixChargeResponse> {
        const url = `${BASE_URL}/api/partner/v1/cash-in`;

        const payload = {
            amount: data.amount,
            description: data.description || "Pagamento Loja",
            customer: {
                name: data.customer.name,
                cpf: data.customer.cpf.replace(/\D/g, ''), // Remove non-digits
                email: data.customer.email,
                phone: data.customer.phone.replace(/\D/g, '') // Remove non-digits
            }
        };

        console.log(`[SyncPay] Creating Pix Charge at: ${url}`, payload);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[SyncPay] Pix Creation Error: ${res.status} ${res.statusText} - ${errorText}`);
            throw new Error(`SyncPay Pix Creation Failed: ${res.status} ${errorText}`);
        }

        const result = await res.json();

        return {
            txId: result.identifier,
            qrcode: result.pix_code, // Use pix_code for both as qrcode image might not be separate
            paymentCode: result.pix_code,
            success: true
        };
    }
};
