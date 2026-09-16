import { createClient } from '@supabase/supabase-js';

let cachedSupabase = null;
function getSupabase(url, key) {
  if (!cachedSupabase) {
    cachedSupabase = createClient(url, key);
  }
  return cachedSupabase;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawName = (req.query.name || req.body?.name || '').trim();
  // Sanitização anti-wildcard SQL e validação de tamanho/caracteres
  const cleanName = rawName.replace(/[%_]/g, '').trim();
  if (!cleanName || cleanName.length < 2 || cleanName.length > 50 || !/^[a-zA-Z0-9'\s\-]+$/.test(cleanName)) {
    return res.status(400).json({ error: 'Nome de personagem inválido. Deve conter apenas letras, números, hífen e apóstrofo (2 a 50 caracteres).' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Chaves do Supabase ausentes' });
  }

  const supabase = getSupabase(supabaseUrl, serviceRoleKey);

  try {
    // 1. Busca dados do personagem em múltiplas bases
    let foundChar = null;
    let source = 'unknown';

    // A. Verificar em guild_members
    const { data: gMember } = await supabase
      .from('guild_members')
      .select('name, level, vocation, rank, is_online')
      .ilike('name', cleanName)
      .maybeSingle();

    if (gMember && gMember.level && Number(gMember.level) > 0) {
      foundChar = {
        name: gMember.name,
        level: Number(gMember.level),
        vocation: gMember.vocation || 'Desconhecida',
        guild: 'Shellpatrocina / Battlestorm',
        guild_rank: gMember.rank || null,
        is_online: Boolean(gMember.is_online)
      };
      source = 'guild_members';
    }

    // B. Verificar em current_character_state
    if (!foundChar) {
      const { data: cData } = await supabase
        .from('current_character_state')
        .select('character_name, level, vocation, xp_total, last_active')
        .ilike('character_name', cleanName)
        .maybeSingle();

      if (cData && cData.level && Number(cData.level) > 0) {
        foundChar = {
          name: cData.character_name,
          level: Number(cData.level),
          vocation: cData.vocation || 'Desconhecida',
          xp_total: cData.xp_total ? Number(cData.xp_total) : null,
          last_active: cData.last_active,
          is_online: false
        };
        source = 'current_character_state';
      }
    }

    // C. Verificar em recent_deaths
    if (!foundChar) {
      const { data: deathData } = await supabase
        .from('recent_deaths')
        .select('character_name, level, death_time, killed_by')
        .ilike('character_name', cleanName)
        .order('death_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (deathData && deathData.level && Number(deathData.level) > 0) {
        foundChar = {
          name: deathData.character_name,
          level: Number(deathData.level),
          vocation: 'Desconhecida',
          is_online: false,
          last_death: {
            time: deathData.death_time,
            killed_by: deathData.killed_by
          }
        };
        source = 'recent_deaths';
      }
    }

    if (foundChar) {
      // 2. Busca informações de mundo e ranking em guild_perk_members
      const { data: gPerk } = await supabase
        .from('guild_perk_members')
        .select('world, notes')
        .ilike('character_name', cleanName)
        .maybeSingle();

      const world = gPerk?.world || 'Auroria';
      const cleanRank = gPerk?.notes?.includes('rank:') 
        ? parseInt(gPerk.notes.replace('rank:', ''), 10) 
        : null;

      // 3. Calcula Ranking Global
      let globalRank = null;
      if (foundChar.level) {
        const { count: higherCount } = await supabase
          .from('current_character_state')
          .select('*', { count: 'exact', head: true })
          .gt('level', foundChar.level);
        globalRank = (higherCount || 0) + 1;
      }

      return res.json({
        ...foundChar,
        world,
        world_rank: cleanRank || (globalRank ? Math.max(1, Math.round(globalRank / 16)) : null),
        global_rank: globalRank,
        source
      });
    }

    // 5. Tenta consultar a API pública do Rubinot caso acessível
    try {
      const rubiRes = await fetch(`https://rubinot.com.br/api/characters/${encodeURIComponent(cleanName)}`, {
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
            character_name: c.name || cleanName,
            level: lvl,
            vocation: voc,
            world: w
          }, { onConflict: 'character_name' });

          return res.json({
            name: c.name || cleanName,
            level: lvl,
            vocation: voc,
            world: w,
            source: 'rubinot_api'
          });
        }
      }
    } catch (e) {}

    return res.status(404).json({
      error: `Personagem "${cleanName}" não localizado nas bases ativas.`
    });

  } catch (err) {
    console.error('Erro no get-character:', err);
    return res.status(500).json({ error: err.message });
  }
}
