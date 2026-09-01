import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { makerName } = req.body;
  if (!makerName) return res.status(400).json({ error: 'Nome do maker é obrigatório' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Chaves do Supabase não configuradas no Vercel' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch Maker Rules
    const { data: rules } = await supabase.from('maker_rules').select('*').limit(1).single();
    
    // 2. Fetch Character from RubinOT
    const rubiRes = await fetch(`https://rubinot.com/api/characters/${encodeURIComponent(makerName)}`);
    if (!rubiRes.ok) {
      if (rubiRes.status === 404) return res.status(400).json({ error: 'Personagem não encontrado no RubinOT' });
      return res.status(500).json({ error: 'Erro ao consultar API oficial' });
    }
    
    const charData = await rubiRes.json();
    const c = charData.character || charData;
    
    // 3. Validate
    if (rules && rules.is_mandatory) {
      // Level
      if (rules.min_level > 0 && c.level < rules.min_level) {
        return res.status(400).json({ error: `O Maker precisa ser level ${rules.min_level} ou superior (Atual: ${c.level}).` });
      }
      
      // Vocation
      if (rules.allowed_vocations && rules.allowed_vocations.length > 0) {
        const voc = c.vocationName || c.vocation;
        if (!rules.allowed_vocations.some(v => v.toLowerCase() === voc.toLowerCase())) {
          return res.status(400).json({ error: `Vocação não aceita. Vocações permitidas: ${rules.allowed_vocations.join(', ')}.` });
        }
      }
      
      // Guild
      if (rules.required_guild && rules.required_guild.trim().length > 0) {
        const charGuild = c.guild ? c.guild.name : '';
        if (charGuild.toLowerCase() !== rules.required_guild.toLowerCase()) {
          return res.status(400).json({ error: `O Maker precisa estar na guilda "${rules.required_guild}".` });
        }
      }
      
      // World
      if (rules.required_world && rules.required_world.trim().length > 0) {
        const w = c.world || '';
        if (w.toLowerCase() !== rules.required_world.toLowerCase()) {
          return res.status(400).json({ error: `O Maker precisa estar no mundo "${rules.required_world}".` });
        }
      }
    }

    return res.status(200).json({ success: true, character: { name: c.name, level: c.level, vocation: c.vocationName || c.vocation } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
