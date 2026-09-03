// /api/worker-config
// Endpoint seguro que serve as credenciais do worker.
// As chaves ficam nas variáveis de ambiente da Vercel (nunca no repositório).

export default function handler(req, res) {
    // Só permite GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const guild = process.env.GUILD_NAME || 'shellpatrocina';

    if (!url || !key) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // CORS para permitir que o PowerShell baixe sem problema
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({ url, key, guild });
}
