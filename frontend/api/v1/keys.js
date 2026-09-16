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

  // 1. Autenticação obrigatória do usuário via JWT
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  let verifiedUser = null;
  let isSuperAdmin = false;

  if (token) {
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (!userErr && user) {
      verifiedUser = user;
      const cleanEmail = (user.email || '').toLowerCase().trim();
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      isSuperAdmin = cleanEmail === 'pifot16@gmail.com' || prof?.role === 'super_admin' || prof?.role === 'admin';
    }
  }

  // GET: Listar chaves do usuário autenticado ou todas se for admin
  if (req.method === 'GET') {
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Você precisa estar logado para visualizar suas chaves de API.' });
    }

    if (req.query?.admin === 'true' && isSuperAdmin) {
      return res.json({ keys });
    }

    const userEmail = (verifiedUser.email || '').toLowerCase().trim();
    const userKeys = keys.filter(k => 
      (k.user_id && k.user_id === verifiedUser.id) || 
      (k.user_email && k.user_email.toLowerCase() === userEmail)
    );
    return res.json({ keys: userKeys });
  }

  // POST: Gerar nova chave para o usuário autenticado
  if (req.method === 'POST') {
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Você precisa estar logado para gerar uma chave de API.' });
    }

    const userEmail = (verifiedUser.email || '').toLowerCase().trim();
    const { name, user_name } = req.body || {};

    // Limite de 3 chaves ativas por usuário (exceto admin)
    const existing = keys.filter(k => 
      ((k.user_id === verifiedUser.id) || (k.user_email && k.user_email.toLowerCase() === userEmail)) && 
      k.status === 'ACTIVE'
    );
    if (existing.length >= 3 && !isSuperAdmin) {
      return res.status(400).json({ error: 'Limite de 3 chaves ativas atingido para sua conta.' });
    }

    const requestedTier = (req.body?.tier || 'STARTER').toUpperCase();

    // Verifica se o usuário tem privilégio VIP no perfil para desbloquear o Tier PRO
    let isUserVip = isSuperAdmin;
    if (!isUserVip) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role, is_premium')
        .eq('id', verifiedUser.id)
        .maybeSingle();
      isUserVip = Boolean(userProfile?.is_premium || userProfile?.role === 'premium');
    }

    // Apenas assinantes VIP ou Admins podem ter o tier PRO (600 req/min)
    const isPro = requestedTier === 'PRO' && isUserVip;
    // Apenas admins podem auto-conceder ENTERPRISE
    const isEnterprise = requestedTier === 'ENTERPRISE' && isSuperAdmin;
    const finalTier = isEnterprise ? 'ENTERPRISE' : (isPro ? 'PRO' : 'STARTER');
    const rateLimit = isEnterprise ? 1500 : (isPro ? 600 : 60);

    const randomHex = crypto.randomBytes(16).toString('hex');
    const prefix = isEnterprise ? 'rub_ent_' : (isPro ? 'rub_pro_' : 'rub_live_');
    const newApiKey = `${prefix}${randomHex}`;

    const newKeyObj = {
      id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      key: newApiKey,
      name: (name || 'Nova Chave de API').slice(0, 50).trim(),
      user_id: verifiedUser.id,
      user_email: userEmail,
      user_name: (user_name || 'Desenvolvedor').slice(0, 50),
      tier: finalTier,
      rate_limit: rateLimit,
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

  // PATCH: Atualizar plano (Tier) ou status da chave (Apenas Admin ou dono da chave)
  if (req.method === 'PATCH') {
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { id, tier, status, rate_limit } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID da chave obrigatório.' });

    const keyIndex = keys.findIndex(k => k.id === id);
    if (keyIndex === -1) return res.status(404).json({ error: 'Chave não encontrada.' });

    const keyOwnerEmail = (keys[keyIndex].user_email || '').toLowerCase().trim();
    const isOwner = keyOwnerEmail === (verifiedUser.email || '').toLowerCase().trim() || keys[keyIndex].user_id === verifiedUser.id;

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Esta chave pertence a outro usuário.' });
    }

    // Apenas admin pode alterar tier ou rate_limit
    if (tier || rate_limit) {
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Apenas administradores podem alterar o plano de uma chave.' });
      }
      if (tier) {
        keys[keyIndex].tier = tier;
        if (tier === 'ENTERPRISE') keys[keyIndex].rate_limit = rate_limit || 1500;
        else if (tier === 'PRO') keys[keyIndex].rate_limit = rate_limit || 600;
        else keys[keyIndex].rate_limit = rate_limit || 60;
      }
    }

    if (status) {
      if (!['ACTIVE', 'REVOKED', 'SUSPENDED'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
      }
      keys[keyIndex].status = status;
    }

    await supabase
      .from('app_settings')
      .update({ visible_tabs: { ...store, api_keys: keys } })
      .eq('id', 101);

    return res.json({ success: true, updated: keys[keyIndex] });
  }

  // DELETE: Revogar chave (Apenas Admin ou dono da chave)
  if (req.method === 'DELETE') {
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { id, key } = req.body || req.query || {};
    const keyIndex = keys.findIndex(k => (id && k.id === id) || (key && k.key === key));

    if (keyIndex === -1) {
      return res.status(404).json({ error: 'Chave não encontrada.' });
    }

    const keyOwnerEmail = (keys[keyIndex].user_email || '').toLowerCase().trim();
    const isOwner = keyOwnerEmail === (verifiedUser.email || '').toLowerCase().trim() || keys[keyIndex].user_id === verifiedUser.id;

    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Esta chave pertence a outro usuário.' });
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
