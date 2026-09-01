import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { action, targetUserId, newEmail, requestorEmail } = req.body;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Chaves do Supabase não configuradas' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Validate requestor is Super Admin
  const { data: requestor } = await supabase.from('profiles').select('email, role').eq('email', requestorEmail).single();
  if (!requestor || requestor.role !== 'super_admin') {
     // Fallback: If it's pifot16@gmail.com, force allow
     if (requestorEmail.toLowerCase() !== 'pifot16@gmail.com') {
         return res.status(403).json({ error: 'Você não tem permissão de Super Admin.' });
     }
  }

  try {
    if (action === 'delete') {
      const { data: target } = await supabase.from('profiles').select('email, main_character').eq('id', targetUserId).single();
      if (target?.email?.toLowerCase() === 'pifot16@gmail.com') {
          return res.status(403).json({ error: 'O criador original não pode ser deletado.' });
      }

      // Delete from profiles first to avoid foreign key constraint error
      const { error: profErr } = await supabase.from('profiles').delete().eq('id', targetUserId);
      if (profErr) throw profErr;

      // Then delete from auth.users
      const { error: delErr } = await supabase.auth.admin.deleteUser(targetUserId);
      if (delErr) throw delErr;
      
      // Log action
      await supabase.from('admin_logs').insert([{
         action: `Deletou o usuário ${target?.main_character} (${target?.email})`,
         admin_email: requestorEmail
      }]);

      return res.status(200).json({ success: true, message: 'Usuário deletado.' });
    }

    if (action === 'update_email') {
      const { data: target } = await supabase.from('profiles').select('email, main_character').eq('id', targetUserId).single();
      if (target?.email?.toLowerCase() === 'pifot16@gmail.com') {
          return res.status(403).json({ error: 'O email do criador original não pode ser alterado.' });
      }

      const { error: updErr } = await supabase.auth.admin.updateUserById(targetUserId, { email: newEmail });
      if (updErr) throw updErr;
      await supabase.from('profiles').update({ email: newEmail }).eq('id', targetUserId);

      // Log action
      await supabase.from('admin_logs').insert([{
         action: `Alterou o e-mail de ${target?.main_character} para ${newEmail}`,
         admin_email: requestorEmail
      }]);

      return res.status(200).json({ success: true, message: 'Email atualizado.' });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
