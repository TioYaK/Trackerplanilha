import { supabase } from '../db.js';

export const runCloseSessions = async () => {
  console.log(`[JOB] Verificando Sessões inativas (Edge Computing)...`);

  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Busca jogadores que nǜo estǜo ativos hǭ mais de 30 minutos e ganharam XP
    const { data: inactivePlayers, error: fetchErr } = await supabase
      .from('current_character_state')
      .select('*')
      .lt('last_active', thirtyMinsAgo);

    if (fetchErr) throw fetchErr;

    if (!inactivePlayers || inactivePlayers.length === 0) {
      console.log(`[JOB] Nenhuma sessão inativa para fechar no momento.`);
      return;
    }

    const sessionsToInsert = [];
    const statesToReset = [];

    for (const player of inactivePlayers) {
      const xpGained = player.xp_total - (player.session_start_xp || player.xp_total);
      
      // Só cria uma historical session se o jogador realmente caçou (ganhou XP)
      if (xpGained > 0 && player.session_start_time) {
        const startTime = new Date(player.session_start_time);
        const endTime = new Date(player.last_active);
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

      // Prepara para resetar a sessǜo
      statesToReset.push({
        character_name: player.character_name,
        session_start_xp: player.xp_total,
        session_start_time: player.last_active
      });
    }

    // Insere as sessões finalizadas
    if (sessionsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('historical_sessions').insert(sessionsToInsert);
      if (insertErr) {
        console.error(`[JOB] Erro ao salvar historical_sessions:`, insertErr.message);
      } else {
        console.log(`[JOB] ${sessionsToInsert.length} sessões finalizadas e salvas em historical_sessions.`);
      }
    }

    // Reseta o start_xp e start_time dos inativos para a prxima hunt
    if (statesToReset.length > 0) {
      const { error: updateErr } = await supabase
        .from('current_character_state')
        .upsert(statesToReset, { onConflict: 'character_name' });
      if (updateErr) {
        console.error(`[JOB] Erro ao resetar current_character_state:`, updateErr.message);
      }
    }

  } catch (error) {
    console.error("[JOB] Erro na task CLOSE_SESSIONS:", error.message);
  }
};
