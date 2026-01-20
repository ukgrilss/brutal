;

// Usage: node debug_webhook_payment.js <TRANSACTION_ID>
// If no ID provided, it will prompt or fail. Since we don't have an ID easily, 
// we likely need to check the DB or console logs for the transaction ID created during "Checkout".
// But for now, let's allow passing it.

const TX_ID = process.argv[2];

if (!TX_ID) {
    console.error("❌ Por favor, forneça o ID da Transação (txId) como argumento.");
    console.log("Exemplo: node debug_webhook_payment.js abc123456");
    process.exit(1);
}

const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/syncpay';

const payload = {
    id_transaction: TX_ID,
    status: 'PAID', // Simulating successful payment
    amount: 100.00,
    created_at: new Date().toISOString()
};

console.log(`🚀 Enviando Webhook Fake para ${WEBHOOK_URL}...`);
console.log("📦 Payload:", payload);

fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
    .then(async res => {
        console.log(`\n📡 Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("📩 Resposta:", text);
    })
    .catch(err => {
        console.error("❌ Erro ao enviar webhook:", err);
    });
