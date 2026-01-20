
const https = require('https');
const querystring = require('querystring');

const clientId = process.argv[2];
const clientSecret = process.argv[3];
const hostname = 'api.syncpayments.com.br';
const path = '/api/partner/v1/auth-token';

if (!clientId || !clientSecret) {
    console.error('❌ Uso: node test-auth.js <CLIENT_ID> <CLIENT_SECRET>');
    process.exit(1);
}

// Cabeçalho Basic Auth
const authString = `${clientId}:${clientSecret}`;
const authBase64 = Buffer.from(authString).toString('base64');
const basicAuthHeader = `Basic ${authBase64}`;

function makeRequest(label, headers, bodyData) {
    return new Promise((resolve) => {
        console.log(`\n---------------------------------------------------`);
        console.log(`🧪 Teste: ${label}`);

        const options = {
            hostname: hostname,
            path: path,
            method: 'POST',
            family: 4, // Manter forçado IPv4 por segurança
            headers: {
                'User-Agent': 'PostmanRuntime/7.26.8', // Disfarçar de Postman
                ...headers,
                'Content-Length': Buffer.byteLength(bodyData)
            },
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                let statusEmoji = '❌';

                if (res.statusCode === 200) statusEmoji = '✅';
                else if (res.statusCode === 422) statusEmoji = '⚠️ (422 - PASSAMOS DO BLOQUEIO!)';
                else if (res.statusCode === 401) statusEmoji = '⛔ (401 - Bloqueado)';

                console.log(`${statusEmoji} Status: ${res.statusCode}`);

                try {
                    console.log(`📄 Resposta: ${body.substring(0, 300)}...`);
                } catch (e) {
                    console.log(`📄 Resposta (Raw): ${body.substring(0, 300)}...`);
                }

                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`⚠️ Erro de conexão: ${e.message}`);
            resolve();
        });

        req.write(bodyData);
        req.end();
    });
}

(async () => {
    console.log(`🔍 Investigando a Autenticação "Basic Auth" (Pista do erro 422)...`);

    // 1. Basic Auth + Body Vazio (JSON)
    // Tenta reproduzir o 422
    await makeRequest('Basic Auth + Body Vazio (JSON)', {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader,
        'Accept': 'application/json'
    }, JSON.stringify({}));

    // 2. Basic Auth + Body c/ Grant Type (JSON)
    await makeRequest('Basic Auth + grant_type (JSON)', {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader,
        'Accept': 'application/json'
    }, JSON.stringify({ grant_type: 'client_credentials' }));

    // 3. Basic Auth + Body c/ Client ID (JSON)
    // Isso deu 401 antes? Vamos checar.
    await makeRequest('Basic Auth + client_id (JSON)', {
        'Content-Type': 'application/json',
        'Authorization': basicAuthHeader,
        'Accept': 'application/json'
    }, JSON.stringify({ client_id: clientId }));

    // 4. Basic Auth + Form-UrlEncoded (Padrão OAuth real)
    const formData = querystring.stringify({ grant_type: 'client_credentials' });
    await makeRequest('Basic Auth + Form-UrlEncoded', {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': basicAuthHeader,
        'Accept': 'application/json'
    }, formData);

})();
