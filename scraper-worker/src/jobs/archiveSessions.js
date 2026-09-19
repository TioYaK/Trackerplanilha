/**
 * archiveSessions.js
 * 
 * Roda uma vez por dia no Server Save (13:00 UTC / 10:00 BRT).
 * Pega todos os registros de current_character_state com XP > 0,
 * arquiva em historical_sessions e reseta session_start_xp = xp_total.
 */

import { supabase } from '../db.js';

export const runArchiveSessions = async () => {
  try {
    console.log('[ARCHIVE] 📦 Iniciando arquivamento de sessões do Server Save...');

    // Buscar todos os personagens com XP registrada e atividade recente (últimas 26h, cobrir lag)
    const cutoff = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    const { data: states, error } = await supabase
      .from('current_character_state')
      .select('character_name, xp_total, session_start_xp, session_start_time, last_active, level')
      .not('xp_total', 'is', null)
      .not('session_start_xp', 'is', null)
      .gte('last_active', cutoff);

    if (error) throw error;
    if (!states || states.length === 0) {
      console.log('[ARCHIVE] ℹ️ Nenhum personagem ativo nas últimas 26h. Nada a arquivar.');
      return;
    }

    const toInsert = [];

    for (const state of states) {
      const xpGained = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
      if (xpGained > 0) {
        toInsert.push({
          character_name: state.character_name,
          xp_gained: xpGained,
          session_start: state.session_start_time || state.last_active || new Date().toISOString(),
          // Usa last_active como hora real do fim da caçada
          session_end: state.last_active || new Date().toISOString(),
          end_level: state.level || null,
          end_xp_total: state.xp_total || null,
          created_at: new Date().toISOString()
        });
      }
    }

    // ── 1. Inserir sessões no histórico ──────────────────────────────────────
    if (toInsert.length > 0) {
      const CHUNK = 200;
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        const { error: insErr } = await supabase.from('historical_sessions').insert(toInsert.slice(i, i + CHUNK));
        if (insErr) console.error('[ARCHIVE] Erro ao inserir chunk:', insErr.message);
      }
      console.log(`[ARCHIVE] ✅ ${toInsert.length} sessões arquivadas em historical_sessions.`);
    } else {
      console.log('[ARCHIVE] ℹ️ Nenhuma sessão com XP > 0 para arquivar.');
    }

    // ── 2. Resetar session_start_xp = xp_total (início do novo SS) ───────────
    const CHUNK = 100;
    let resetCount = 0;
    for (let i = 0; i < states.length; i += CHUNK) {
      const chunk = states.slice(i, i + CHUNK);
      const promises = chunk.map(state =>
        supabase
          .from('current_character_state')
          .update({
            session_start_xp: state.xp_total,
            session_start_time: new Date().toISOString(),
          })
          .eq('character_name', state.character_name)
      );
      await Promise.all(promises);
      resetCount += chunk.length;
    }
    console.log(`[ARCHIVE] ✅ ${resetCount} registros de session_start_xp resetados para o novo SS.`);

    // ── 3. Limpeza de Retenção (Guardian do Banco Supabase - 500MB Limit) ────
    try {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      // Limpeza de logins anteriores a 14 dias
      const { error: purgeErr } = await supabase
        .from('login_events')
        .delete()
        .lt('event_time', fourteenDaysAgo);
      if (!purgeErr) {
        console.log('[ARCHIVE] 🧹 Limpeza de login_events anteriores a 14 dias concluída.');
      }

      // Limpeza de mortes anteriores a 14 dias (economia de disco e queries leves)
      await supabase
        .from('recent_deaths')
        .delete()
        .lt('death_time', fourteenDaysAgo);

      // Limpeza de histórico online anterior a 14 dias
      await supabase
        .from('online_history')
        .delete()
        .lt('timestamp', fourteenDaysAgo);


      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('guild_strikes').delete().lt('expires_at', thirtyDaysAgo);

      // Limpeza de leilões do Bazaar já encerrados
      const nowIso = new Date().toISOString();
      await supabase.from('bazaar_alerts').delete().lt('auction_end', nowIso);

      // Limpeza de comandos remotos antigos já executados (> 48h)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      await supabase.from('worker_commands').delete().eq('executed', true).lt('created_at', twoDaysAgo);

      // Limpeza preventiva de sessões históricas com mais de 30 dias
      await supabase.from('historical_sessions').delete().lt('session_start', thirtyDaysAgo);

      // Limpeza preventiva de telemetry_logs com mais de 14 dias (economia de disco massiva)
      await supabase.from('telemetry_logs').delete().lt('recorded_at', fourteenDaysAgo);
    } catch (cleanErr) {
      console.warn('[ARCHIVE] Aviso na limpeza de retenção:', cleanErr.message);
    }

    console.log('[ARCHIVE] ✔ Arquivamento concluído.');

  } catch (err) {
    console.error('[ARCHIVE] Erro crítico:', err.message);
  }
};
