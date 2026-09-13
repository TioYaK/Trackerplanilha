import { validateApiKey } from './_auth.js';

export default async function handler(req, res) {
  const auth = await validateApiKey(req, res);
  if (auth.isOptions || auth.error) return;

  const { supabase, keyData } = auth;
  const rawName = (req.query.name || req.body?.name || '').trim();

  if (!rawName) {
    return res.status(400).json({
      error: 'Parâmetro "name" é obrigatório.',
      example: '/api/v1/character?name=Decayek'
    });
  }

  try {
    let charData = null;
    let source = 'database';

    // 1. Tenta guild_members
    const { data: gMember } = await supabase
      .from('guild_members')
      .select('name, level, vocation, rank, is_online, last_xp_date')
      .ilike('name', rawName)
      .maybeSingle();

    // 2. Tenta current_character_state para mundo, vocation e xp atualizados
    const { data: cState } = await supabase
      .from('current_character_state')
      .select('character_name, level, vocation, world, last_active, xp_total')
      .ilike('character_name', rawName)
      .maybeSingle();

    // 3. Tenta associação de guilda em guild_perk_members
    const { data: gPerk } = await supabase
      .from('guild_perk_members')
      .select('guild_name, world')
      .ilike('character_name', rawName)
      .maybeSingle();

    if (gMember && gMember.level && Number(gMember.level) > 0) {
      charData = {
        name: gMember.name,
        level: Number(cState?.level || gMember.level),
        vocation: gMember.vocation || cState?.vocation || 'Aventureiro',
        guild: gPerk?.guild_name || 'Guilda Registrada',
        rank: gMember.rank || 'Membro',
        world: cState?.world || gPerk?.world || 'Rubinot',
        is_online: Boolean(gMember.is_online),
        last_active: cState?.last_active || gMember.last_xp_date,
        xp_total: cState?.xp_total || null
      };
      source = 'guild_members';
    } else if (cState && cState.level && Number(cState.level) > 0) {
      charData = {
        name: cState.character_name,
        level: Number(cState.level),
        vocation: cState.vocation || 'Desconhecida',
        guild: gPerk?.guild_name || null,
        rank: null,
        world: cState.world || gPerk?.world || 'Rubinot',
        is_online: false,
        last_active: cState.last_active,
        xp_total: cState.xp_total
      };
      source = 'current_character_state';
    } else {
        // 3. Tenta recent_deaths
        const { data: dData } = await supabase
          .from('recent_deaths')
          .select('character_name, level, death_time, killed_by')
          .ilike('character_name', rawName)
          .order('death_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dData && dData.level && Number(dData.level) > 0) {
          charData = {
            name: dData.character_name,
            level: Number(dData.level),
            vocation: 'Desconhecida',
            guild: null,
            world: null,
            is_online: false,
            last_death: {
              time: dData.death_time,
              killed_by: dData.killed_by
            }
          };
          source = 'recent_deaths';
        }
      }
    }

    if (!charData) {
      return res.status(404).json({
        error: `Personagem "${rawName}" não encontrado na base de dados ativa do Rubinot.`,
        code: 'CHARACTER_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      character: charData,
      meta: {
        source,
        timestamp: new Date().toISOString(),
        tier: keyData.tier
      }
    });

  } catch (err) {
    console.error('[API v1/character] Erro:', err.message);
    return res.status(500).json({ error: 'Erro interno ao processar requisição: ' + err.message });
  }
}
