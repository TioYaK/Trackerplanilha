// /api/worker-config
// Serve as configuracoes e tokens de conexao para os workers publicos.
// NENHUMA chave de banco de dados (Supabase) e exposta aqui.

const DEFAULT_INGESTION_TOKEN = 'wk_live_rubinot_telemetry_secure_2026';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const host = req.headers['host'] || 'trackerplanilha.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const apiUrl = `${baseUrl}/api/worker/telemetry`;
    const workerToken = process.env.WORKER_INGESTION_TOKEN || DEFAULT_INGESTION_TOKEN;
    const guild = process.env.GUILD_NAME || 'shellpatrocina';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    // Retorna a URL da API segura e o token de ingestao (com retrocompatibilidade de nomes de campos)
    return res.status(200).json({
        apiUrl,
        workerToken,
        guild,
        // Campos de retrocompatibilidade:
        url: apiUrl,
        key: workerToken
    });
}


