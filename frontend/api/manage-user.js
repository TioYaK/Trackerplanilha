import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Chaves do Supabase não configuradas' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Autenticação obrigatória do solicitante via JWT
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token de sessão ausente.' });
  }

  const { data: { user: requestorUser }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !requestorUser) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }

  // 2. Validação estrita de permissão de Super Admin
  const cleanRequestorEmail = (requestorUser.email || '').trim().toLowerCase();
  const { data: requestorProfile } = await supabase
    .from('profiles')
    .select('id, email, role, main_character')
    .eq('id', requestorUser.id)
    .maybeSingle();

  const isSuperAdmin = requestorProfile?.role === 'super_admin' || cleanRequestorEmail === 'pifot16@gmail.com';
  if (!isSuperAdmin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas o Super Admin pode gerenciar contas.' });
  }

  const reqName = requestorProfile?.main_character || cleanRequestorEmail;
  const { action, targetUserId, newEmail } = req.body || {};

  if (!targetUserId || typeof targetUserId !== 'string') {
    return res.status(400).json({ error: 'ID do usuário alvo inválido.' });
  }

  try {
    if (action === 'delete') {
      const { data: target } = await supabase.from('profiles').select('email, main_character').eq('id', targetUserId).maybeSingle();
      if (!target) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      if (target?.email?.toLowerCase() === 'pifot16@gmail.com') {
        return res.status(403).json({ error: 'O criador original não pode ser deletado.' });
      }

      // Deleta perfis dependentes e usuário
      const { error: profErr } = await supabase.from('profiles').delete().eq('id', targetUserId);
      if (profErr) throw profErr;

      const { error: delErr } = await supabase.auth.admin.deleteUser(targetUserId);
      if (delErr) throw delErr;
      
      // Log de auditoria
      await supabase.from('admin_logs').insert([{
        action: `Deletou o usuário ${target?.main_character} (${target?.email})`,
        admin_email: cleanRequestorEmail,
        admin_name: reqName
      }]);

      return res.status(200).json({ success: true, message: 'Usuário deletado com sucesso.' });
    }

    if (action === 'update_email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newEmail || !emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Novo e-mail inválido.' });
      }

      const { data: target } = await supabase.from('profiles').select('email, main_character').eq('id', targetUserId).maybeSingle();
      if (!target) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      if (target?.email?.toLowerCase() === 'pifot16@gmail.com') {
        return res.status(403).json({ error: 'O email do criador original não pode ser alterado.' });
      }

      const { error: updErr } = await supabase.auth.admin.updateUserById(targetUserId, { email: newEmail });
      if (updErr) throw updErr;
      await supabase.from('profiles').update({ email: newEmail }).eq('id', targetUserId);

      // Log de auditoria
      await supabase.from('admin_logs').insert([{
        action: `Alterou o e-mail de ${target?.main_character} para ${newEmail}`,
        admin_email: cleanRequestorEmail,
        admin_name: reqName
      }]);

      return res.status(200).json({ success: true, message: 'Email atualizado com sucesso.' });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (err) {
    console.error('[manage-user] Erro:', err.message);
    return res.status(500).json({ error: 'Falha ao processar solicitação administrativa.' });
  }
}
