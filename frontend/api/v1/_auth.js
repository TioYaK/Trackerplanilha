import { createClient } from '@supabase/supabase-js';

const rateLimitBuckets = new Map(); // key -> { count, resetAt }
let cachedSupabase = null;
let cachedApiKeys = null;
let keysCacheTimestamp = 0;
const KEYS_CACHE_TTL = 60000; // 60s

function getSupabase(url, key) {
  if (!cachedSupabase) {
    cachedSupabase = createClient(url, key);
  }
  return cachedSupabase;
}

export async function validateApiKey(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return { isOptions: true };
  }

  // Extrair chave do cabeçalho ou query
  const authHeader = req.headers['authorization'] || '';
  const headerKey = req.headers['x-api-key'] || '';
  const queryKey = req.query?.apiKey || req.query?.api_key || '';

  let keyStr = '';
  if (authHeader.startsWith('Bearer ')) {
    keyStr = authHeader.replace('Bearer ', '').trim();
  } else if (headerKey) {
    keyStr = String(headerKey).trim();
  } else if (queryKey) {
    keyStr = String(queryKey).trim();
  }

  if (!keyStr) {
    res.status(401).json({
      error: 'API Key não fornecida. Inclua o cabeçalho Authorization: Bearer <KEY> ou X-Api-Key.',
      code: 'MISSING_API_KEY',
      docs: 'https://trackerplanilha.vercel.app/developers'
    });
    return { error: true };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: 'Configurações de infraestrutura ausentes no servidor.' });
    return { error: true };
  }

  const supabase = getSupabase(supabaseUrl, serviceRoleKey);

  // Carrega chaves de app_settings (id: 101) com cache em memória de 60s
  let keys = cachedApiKeys;
  const now = Date.now();
  if (!keys || (now - keysCacheTimestamp > KEYS_CACHE_TTL)) {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('visible_tabs')
      .eq('id', 101)
      .maybeSingle();

    keys = settings?.visible_tabs?.api_keys || [];
    cachedApiKeys = keys;
    keysCacheTimestamp = now;
  }

  const foundKey = keys.find(k => k.key === keyStr);

  if (!foundKey) {
    res.status(401).json({
      error: 'API Key inválida ou inexistente.',
      code: 'INVALID_API_KEY'
    });
    return { error: true };
  }

  if (foundKey.status !== 'ACTIVE') {
    res.status(403).json({
      error: `API Key ${foundKey.status === 'REVOKED' ? 'revogada' : 'suspensa'}. Entre em contato com o suporte para regularização.`,
      code: 'KEY_SUSPENDED'
    });
    return { error: true };
  }

  // Rate Limiting por Minuto
  const rateLimit = foundKey.rate_limit || (foundKey.tier === 'ENTERPRISE' ? 400 : foundKey.tier === 'PRO' ? 100 : 15);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(keyStr) || { count: 0, resetAt: now + 60000 };

  if (now > bucket.resetAt) {
    bucket.count = 1;
    bucket.resetAt = now + 60000;
  } else {
    bucket.count++;
  }
  rateLimitBuckets.set(keyStr, bucket);

  res.setHeader('X-RateLimit-Limit', String(rateLimit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rateLimit - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > rateLimit) {
    res.status(429).json({
      error: 'Limite de requisições por minuto excedido para seu plano.',
      code: 'RATE_LIMIT_EXCEEDED',
      limit: rateLimit,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      tip: 'Faça upgrade para o Plano Pro ou Enterprise no Developer Hub para limites maiores.'
    });
    return { error: true };
  }

  // Incrementa contador de uso de forma assíncrona
  (async () => {
    try {
      foundKey.requests_count = (foundKey.requests_count || 0) + 1;
      foundKey.last_used_at = new Date().toISOString();
      await supabase
        .from('app_settings')
        .update({ visible_tabs: { ...settings.visible_tabs, api_keys: keys } })
        .eq('id', 101);
    } catch {}
  })();

  return { success: true, keyData: foundKey, supabase };
}
