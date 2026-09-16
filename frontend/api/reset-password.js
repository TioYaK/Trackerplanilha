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
    return res.status(500).json({ error: 'Configurações de infraestrutura ausentes no servidor.' });
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
    return res.status(403).json({ error: 'Acesso negado. Apenas o Super Admin pode resetar senhas de usuários.' });
  }

  // 3. Validação dos inputs
  const { userId, newPassword } = req.body || {};

  if (!userId || typeof userId !== 'string' || userId.length < 10) {
    return res.status(400).json({ error: 'ID de usuário inválido.' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
    return res.status(400).json({ error: 'A nova senha deve ter entre 6 e 128 caracteres.' });
  }

  // Proteção do criador original
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, email, main_character')
    .eq('id', userId)
    .maybeSingle();

  if (targetProfile?.email?.toLowerCase() === 'pifot16@gmail.com' && cleanRequestorEmail !== 'pifot16@gmail.com') {
    return res.status(403).json({ error: 'A senha do criador original não pode ser redefinida por terceiros.' });
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;

    // Log de auditoria
    await supabase.from('admin_logs').insert([{
      action: `Redefiniu a senha do usuário ${targetProfile?.main_character || userId} (${targetProfile?.email || 'N/A'})`,
      admin_email: cleanRequestorEmail,
      admin_name: requestorProfile?.main_character || cleanRequestorEmail
    }]);

    return res.status(200).json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('[reset-password] Erro:', err.message);
    return res.status(500).json({ error: 'Falha ao redefinir senha do usuário.' });
  }
}
