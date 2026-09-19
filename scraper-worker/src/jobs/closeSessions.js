import { supabase } from '../db.js';

const parseUtcDate = (dStr) => {
  if (!dStr) return null;
  if (dStr instanceof Date) return dStr;
  if (typeof dStr !== 'string') return new Date(dStr);
  if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.includes('-', 10)) {
    return new Date(dStr + 'Z');
  }
  return new Date(dStr);
};

export const runCloseSessions = async () => {
  console.log(`[JOB] Verificando Sessões inativas (Edge Computing)...`);

  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Busca no máximo 150 personagens inativos por ciclo para não sobrecarregar CPU/conexões do Postgres
    const { data: allInactive, error } = await supabase
      .from('current_character_state')
      .select('character_name, xp_total, session_start_xp, session_start_time, last_active, level')
      .lt('last_active', thirtyMinsAgo)
      .gte('last_active', sevenDaysAgo)
      .not('xp_total', 'is', null)
      .limit(150);

    if (error) throw error;

    if (!allInactive || allInactive.length === 0) {
      console.log(`[JOB] Nenhuma sessão inativa para fechar no momento.`);
      return;
    }

    const sessionsToInsert = [];

    for (const player of allInactive) {
      if (player.session_start_xp === null || player.session_start_xp === undefined) {
        await supabase
          .from('current_character_state')
          .update({
            session_start_xp: player.xp_total,
            session_start_time: player.last_active || new Date().toISOString()
          })
          .eq('character_name', player.character_name)
          .is('session_start_xp', null);
        continue;
      }

      const xpGained = Number(player.xp_total || 0) - Number(player.session_start_xp || player.xp_total || 0);

      // Só cria uma historical session se o jogador realmente caçou (ganhou XP)
      if (xpGained > 0) {
        // Trava atômica otimista: apenas um worker consegue avançar o session_start_xp.
        // Se outro worker concorrente já processou esse personagem, o update afetará 0 linhas.
        const { data: lockResult, error: lockErr } = await supabase
          .from('current_character_state')
          .update({
            session_start_xp: player.xp_total,
            session_start_time: player.last_active || new Date().toISOString()
          })
          .eq('character_name', player.character_name)
          .eq('session_start_xp', player.session_start_xp)
          .select('character_name');

        if (lockErr || !lockResult || lockResult.length === 0) {
          // Outro worker concorrente já fechou e arquivou esta sessão! Pula com segurança.
          continue;
        }

        let startTime = parseUtcDate(player.session_start_time);
        const endTime = parseUtcDate(player.last_active) || new Date();

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
      }
    }

    // Insere as sessões finalizadas em lotes de 100 (garantidas sem duplicatas)
    if (sessionsToInsert.length > 0) {
      for (let i = 0; i < sessionsToInsert.length; i += 100) {
        const chunk = sessionsToInsert.slice(i, i + 100);
        const { error: insertErr } = await supabase.from('historical_sessions').insert(chunk);
        if (insertErr) {
          console.error(`[JOB] Erro ao salvar historical_sessions:`, insertErr.message);
        }
      }
      console.log(`[JOB] ✅ ${sessionsToInsert.length} sessões finalizadas e salvas em historical_sessions (sem duplicatas).`);
    } else {
      console.log(`[JOB] Nenhuma nova sessão com ganho de XP para arquivar.`);
    }

  } catch (error) {
    console.error("[JOB] Erro na task CLOSE_SESSIONS:", error.message);
  }
};
