import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawName = (req.query.name || req.body?.name || '').trim();
  if (!rawName) {
    return res.status(400).json({ error: 'Nome do personagem é obrigatório' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Chaves do Supabase ausentes' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Verificar em guild_members (dados oficiais de membros)
    const { data: gMember } = await supabase
      .from('guild_members')
      .select('name, level, vocation')
      .ilike('name', rawName)
      .maybeSingle();

    if (gMember && gMember.level && Number(gMember.level) > 0) {
      return res.json({
        name: gMember.name,
        level: Number(gMember.level),
        vocation: gMember.vocation || 'Desconhecida',
        source: 'guild_members'
      });
    }

    // 2. Verificar em current_character_state
    const { data: charData } = await supabase
      .from('current_character_state')
      .select('character_name, level, vocation')
      .ilike('character_name', rawName)
      .maybeSingle();

    if (charData && charData.level && Number(charData.level) > 0) {
      return res.json({
        name: charData.character_name,
        level: Number(charData.level),
        vocation: charData.vocation || 'Desconhecida',
        source: 'current_character_state'
      });
    }

    // 3. Verificar em historical_sessions
    const { data: sessData } = await supabase
      .from('historical_sessions')
      .select('character_name, end_level, start_level')
      .ilike('character_name', rawName)
      .order('session_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessData && (sessData.end_level || sessData.start_level)) {
      const lvl = Number(sessData.end_level || sessData.start_level);
      return res.json({
        name: sessData.character_name,
        level: lvl,
        vocation: 'Desconhecida',
        source: 'historical_sessions'
      });
    }

    // 4. Verificar em recent_deaths
    const { data: deathData } = await supabase
      .from('recent_deaths')
      .select('character_name, level')
      .ilike('character_name', rawName)
      .order('death_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (deathData && deathData.level && Number(deathData.level) > 0) {
      return res.json({
        name: deathData.character_name,
        level: Number(deathData.level),
        vocation: 'Desconhecida',
        source: 'recent_deaths'
      });
    }

    // 5. Tenta consultar a API pública do Rubinot caso acessível
    try {
      const rubiRes = await fetch(`https://rubinot.com.br/api/characters/${encodeURIComponent(rawName)}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (rubiRes.ok) {
        const rData = await rubiRes.json();
        const c = rData?.character || rData;
        if (c && c.level) {
          const lvl = Number(c.level);
          const voc = c.vocationName || c.vocation || 'Desconhecida';
          const w = c.world || null;

          await supabase.from('current_character_state').upsert({
            character_name: c.name || rawName,
            level: lvl,
            vocation: voc
          }, { onConflict: 'character_name' });

          return res.json({
            name: c.name || rawName,
            level: lvl,
            vocation: voc,
            world: w,
            source: 'rubinot_api'
          });
        }
      }
    } catch (e) {}

    return res.status(404).json({
      error: `Personagem "${rawName}" não localizado nas bases ativas.`
    });

  } catch (err) {
    console.error('Erro no get-character:', err);
    return res.status(500).json({ error: err.message });
  }
}
