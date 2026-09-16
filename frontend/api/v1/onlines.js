import { validateApiKey } from './_auth.js';

export default async function handler(req, res) {
  const auth = await validateApiKey(req, res);
  if (auth.isOptions || auth.error) return;

  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');

  const { supabase, keyData } = auth;
  const targetWorld = (req.query.world || 'ALL').trim();
  const cleanWorld = targetWorld.replace(/[%_]/g, '').trim().slice(0, 30);

  try {
    // 1. Contagem mais recente
    const { data: latestHistory } = await supabase
      .from('online_history')
      .select('online_count, timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Jogadores atualmente online registrados
    let players = [];
    
    // Tenta guild_members com is_online
    const { data: onlineGuild } = await supabase
      .from('guild_members')
      .select('name, level, vocation, rank')
      .eq('is_online', true);

    if (onlineGuild) {
      players.push(...onlineGuild.map(p => ({
        name: p.name,
        level: p.level,
        vocation: p.vocation,
        guild: 'Guilda Registrada'
      })));
    }

    // Tenta alvos hunted online
    const { data: onlineHunted } = await supabase
      .from('hunted_list')
      .select('name, reason')
      .eq('is_online', true);

    if (onlineHunted) {
      players.push(...onlineHunted.map(h => ({
        name: h.name,
        level: null,
        vocation: null,
        guild: null,
        is_hunted: true,
        reason: h.reason
      })));
    }

    // Se tier for Pro ou Enterprise, inclui também os que tiveram atividade nas últimas 3 horas
    if (keyData.tier === 'PRO' || keyData.tier === 'ENTERPRISE') {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      let charStateQuery = supabase
        .from('current_character_state')
        .select('character_name, level, vocation, last_active, world')
        .gte('last_active', threeHoursAgo);

      if (cleanWorld && cleanWorld.toUpperCase() !== 'ALL') {
        charStateQuery = charStateQuery.ilike('world', `%${cleanWorld}%`);
      }

      const { data: recentActive } = await charStateQuery
        .order('last_active', { ascending: false })
        .limit(100);

      if (recentActive) {
        const existingNames = new Set(players.map(p => p.name.toLowerCase()));
        recentActive.forEach(a => {
          if (!existingNames.has(a.character_name.toLowerCase())) {
            players.push({
              name: a.character_name,
              level: a.level,
              vocation: a.vocation,
              world: a.world || targetWorld,
              last_active: a.last_active
            });
          }
        });
      }
    }

    return res.json({
      success: true,
      world: cleanWorld || 'ALL',
      online_count: latestHistory?.online_count || players.length,
      sample_players: players.slice(0, keyData.tier === 'ENTERPRISE' ? 200 : 50),
      total_sampled: players.length,
      last_updated: latestHistory?.timestamp || new Date().toISOString(),
      meta: {
        tier: keyData.tier,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[API v1/onlines] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
}
