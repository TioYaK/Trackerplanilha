import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuração do banco ausente.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Carrega chaves existentes
  const { data: settings } = await supabase
    .from('app_settings')
    .select('visible_tabs')
    .eq('id', 101)
    .maybeSingle();

  const store = settings?.visible_tabs || { api_keys: [] };
  let keys = Array.isArray(store.api_keys) ? store.api_keys : [];

  // GET: Listar chaves do usuário ou todas se for admin
  if (req.method === 'GET') {
    const userEmail = (req.query?.email || '').toLowerCase().trim();
    const isAdmin = userEmail === 'pifot16@gmail.com' || req.query?.admin === 'true';

    if (isAdmin) {
      return res.json({ keys });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Parâmetro email é obrigatório para listar suas chaves.' });
    }

    const userKeys = keys.filter(k => (k.user_email || '').toLowerCase() === userEmail);
    return res.json({ keys: userKeys });
  }

  // POST: Gerar nova chave
  if (req.method === 'POST') {
    const { name, user_id, user_email, user_name } = req.body || {};

    if (!user_email) {
      return res.status(400).json({ error: 'Email do usuário é obrigatório.' });
    }

    // Limite de 3 chaves por usuário no plano Starter
    const existing = keys.filter(k => (k.user_email || '').toLowerCase() === user_email.toLowerCase() && k.status === 'ACTIVE');
    if (existing.length >= 3 && user_email.toLowerCase() !== 'pifot16@gmail.com') {
      return res.status(400).json({ error: 'Limite de 3 chaves ativas atingido para sua conta.' });
    }

    const randomHex = crypto.randomBytes(16).toString('hex');
    const newApiKey = `bst_live_${randomHex}`;

    const newKeyObj = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      key: newApiKey,
      name: (name || 'Nova Chave de API').trim(),
      user_id: user_id || null,
      user_email: user_email.toLowerCase().trim(),
      user_name: user_name || 'Desenvolvedor',
      tier: 'STARTER', // 'STARTER' (60/min), 'PRO' (300/min), 'ENTERPRISE' (1200/min)
      rate_limit: 60,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      last_used_at: null,
      requests_count: 0
    };

    keys.unshift(newKeyObj);

    await supabase
      .from('app_settings')
      .update({ visible_tabs: { ...store, api_keys: keys } })
      .eq('id', 101);

    return res.status(201).json({
      success: true,
      message: 'Chave de API gerada com sucesso!',
      apiKey: newKeyObj
    });
  }

  // PATCH: Atualizar plano (Tier) ou status da chave (Admin ou dono)
  if (req.method === 'PATCH') {
    const { id, tier, status, rate_limit, admin_email } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID da chave obrigatório.' });

    const keyIndex = keys.findIndex(k => k.id === id);
    if (keyIndex === -1) return res.status(404).json({ error: 'Chave não encontrada.' });

    if (tier) {
      keys[keyIndex].tier = tier;
      if (tier === 'ENTERPRISE') keys[keyIndex].rate_limit = rate_limit || 1200;
      else if (tier === 'PRO') keys[keyIndex].rate_limit = rate_limit || 300;
      else keys[keyIndex].rate_limit = rate_limit || 60;
    }

    if (status) {
      keys[keyIndex].status = status; // 'ACTIVE', 'REVOKED', 'SUSPENDED'
    }

    await supabase
      .from('app_settings')
      .update({ visible_tabs: { ...store, api_keys: keys } })
      .eq('id', 101);

    return res.json({ success: true, updated: keys[keyIndex] });
  }

  // DELETE: Revogar chave
  if (req.method === 'DELETE') {
    const { id, key } = req.body || req.query || {};
    const keyIndex = keys.findIndex(k => (id && k.id === id) || (key && k.key === key));

    if (keyIndex === -1) {
      return res.status(404).json({ error: 'Chave não encontrada.' });
    }

    keys[keyIndex].status = 'REVOKED';

    await supabase
      .from('app_settings')
      .update({ visible_tabs: { ...store, api_keys: keys } })
      .eq('id', 101);

    return res.json({ success: true, message: 'Chave de API revogada com sucesso.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
