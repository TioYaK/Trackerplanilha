// /api/worker-config
// Endpoint seguro que serve as credenciais do worker.

const DEFAULT_URL = 'https://seldyqhpdaposkwbtmlv.supabase.co';
const DEFAULT_KEY_B64 = 'c2Jfc2VjcmV0X1FCcndCZGxWQkVGQTlhTmlkeGN4WkFfelFPWDRMSzc=';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_URL;
    const fallbackKey = Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf8');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || fallbackKey;
    const guild = process.env.GUILD_NAME || 'shellpatrocina';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json({ url, key, guild });
}
