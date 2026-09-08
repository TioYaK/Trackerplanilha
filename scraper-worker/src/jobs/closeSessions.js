import { supabase } from '../db.js';

export const runCloseSessions = async () => {
  console.log(`[JOB] Verificando Sessões inativas (Edge Computing)...`);

  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 1. Paginamos todos os jogadores com atividade registrada
    let allInactive = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from('current_character_state')
        .select('*')
        .lt('last_active', thirtyMinsAgo)
        .not('xp_total', 'is', null)
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allInactive.push(...data);
      if (data.length < 1000) break;
      page++;
    }

    if (!allInactive || allInactive.length === 0) {
      console.log(`[JOB] Nenhuma sessão inativa para fechar no momento.`);
      return;
    }

    const sessionsToInsert = [];
    const statesToReset = [];

    for (const player of allInactive) {
      const xpGained = Number(player.xp_total || 0) - Number(player.session_start_xp || player.xp_total || 0);

      // Só cria uma historical session se o jogador realmente caçou (ganhou XP)
      if (xpGained > 0) {
        let startTime = player.session_start_time ? new Date(player.session_start_time) : null;
        const endTime = new Date(player.last_active || Date.now());

        // Se startTime for nulo, inválido ou tiver mais de 12 horas de diferença (ex: dias atrás),
        // calcula uma duração razoável baseada na caçada (ex: 2 horas antes do término)
        if (!startTime || isNaN(startTime.getTime()) || (endTime - startTime) > 12 * 3600 * 1000) {
          startTime = new Date(endTime.getTime() - 2 * 3600 * 1000);
        }

        const durationMinutes = Math.max(1, Math.floor((endTime - startTime) / 60000));
        const xpPerHour = Math.floor((xpGained / durationMinutes) * 60);

        sessionsToInsert.push({
          character_name: player.character_name,
          session_start: startTime.toISOString(),
          session_end: endTime.toISOString(),
          duration_minutes: durationMinutes,
          xp_gained: xpGained,
          xp_per_hour: xpPerHour,
          end_xp_total: player.xp_total,
          end_level: player.level,
          created_at: new Date().toISOString()
        });

        // Só reseta quem realmente caçou e encerrou a sessão
        statesToReset.push({
          character_name: player.character_name,
          session_start_xp: player.xp_total,
          session_start_time: player.last_active
        });
      }
    }

    // Insere as sessões finalizadas em lotes de 200
    if (sessionsToInsert.length > 0) {
      for (let i = 0; i < sessionsToInsert.length; i += 200) {
        const chunk = sessionsToInsert.slice(i, i + 200);
        const { error: insertErr } = await supabase.from('historical_sessions').insert(chunk);
        if (insertErr) {
          console.error(`[JOB] Erro ao salvar historical_sessions:`, insertErr.message);
        }
      }
      console.log(`[JOB] ✅ ${sessionsToInsert.length} sessões finalizadas e salvas em historical_sessions.`);
    } else {
      console.log(`[JOB] Nenhuma sessão com ganho de XP encontrada para arquivar.`);
    }

    // Reseta o start_xp e start_time dos inativos em lotes de 100
    if (statesToReset.length > 0) {
      for (let i = 0; i < statesToReset.length; i += 100) {
        const chunk = statesToReset.slice(i, i + 100);
        const { error: updateErr } = await supabase
          .from('current_character_state')
          .upsert(chunk, { onConflict: 'character_name' });
        if (updateErr) {
          console.error(`[JOB] Erro ao resetar current_character_state:`, updateErr.message);
        }
      }
      console.log(`[JOB] ✅ ${statesToReset.length} estados resetados para a próxima hunt.`);
    }

  } catch (error) {
    console.error("[JOB] Erro na task CLOSE_SESSIONS:", error.message);
  }
};
