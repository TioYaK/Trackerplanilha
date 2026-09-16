import { validateApiKey } from './_auth.js';

export default async function handler(req, res) {
  const auth = await validateApiKey(req, res);
  if (auth.isOptions || auth.error) return;

  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');

  const { supabase, keyData } = auth;
  const limit = Math.min(parseInt(req.query.limit) || 20, keyData.tier === 'ENTERPRISE' ? 100 : 50);
  const victimName = req.query.victim || req.query.name;
  const killerName = req.query.killer;

  try {
    let query = supabase
      .from('recent_deaths')
      .select('id, character_name, level, killed_by, death_time, is_guild_member, is_hunted')
      .order('death_time', { ascending: false })
      .limit(limit);

    if (victimName) {
      query = query.ilike('character_name', `%${victimName.trim()}%`);
    }

    if (killerName) {
      query = query.ilike('killed_by', `%${killerName.trim()}%`);
    }

    const { data: deaths, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      count: deaths ? deaths.length : 0,
      deaths: deaths || [],
      meta: {
        limit,
        tier: keyData.tier,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[API v1/deaths] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno ao consultar mortes: ' + err.message });
  }
}
