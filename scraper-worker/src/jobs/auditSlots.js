import { supabase } from '../db.js';

/**
 * Audita os slots planilhados em tempo real.
 * Cruza quem está na planilha com a XP atual dos jogadores.
 *
 * BUGS CORRIGIDOS (2026-08-30):
 *  1. Slots de meia-noite: comparação agora usa minutos totais, não strings.
 *     "23:50" >= "00:10" como string = true (ERRADO). Com minutos: 1430 >= 10 ✅
 *  2. Strike automático: condição estava invertida — `last_miss_date !== todayDate`
 *     era checado DEPOIS de já atualizar o campo, tornando a condição sempre false.
 *     Agora os strikes são aplicados corretamente na 3ª falta.
 */
export const runAuditSlots = async () => {
  console.log('[AUDIT] Iniciando auditoria dos Respawns Planilhados...');

  try {
    // 1. Busca TODAS as parties planilhadas
    let parties = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from('parties_planilhadas')
        .select('*')
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      parties.push(...data);
      if (data.length < 1000) break;
      page++;
    }

    if (!parties.length) {
      console.log('[AUDIT] Nenhuma party cadastrada.');
      return;
    }

    // Horário atual em BRT
    const now = new Date();
    const brtTime = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    const [currentHour, currentMinute] = brtTime.split(':').map(Number);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    console.log(`[AUDIT] Horário BRT: ${brtTime} (${currentTotalMinutes} min)`);

    /** Converte "HH:MM" em minutos totais desde 00:00. */
    const toMinutes = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    /**
     * Verifica se o slot está ativo agora.
     * Suporta slots que cruzam a meia-noite (ex: 23:00 - 01:00).
     */
    const isSlotCurrentlyActive = (slotStart, slotEnd) => {
      const startMin = toMinutes(slotStart);
      let endMin = toMinutes(slotEnd);

      // Slot cruza meia-noite: endMin ficaria menor que startMin
      if (endMin < startMin) endMin += 1440;

      // Ajusta o tempo atual para cobrir o caso pós-meia-noite
      let current = currentTotalMinutes;
      if (current < startMin && endMin > 1440) current += 1440;

      return current >= startMin && current <= endMin;
    };

    for (const party of parties) {
      if (!isSlotCurrentlyActive(party.slot_start, party.slot_end)) continue;

      console.log(`[AUDIT] Slot ativo: "${party.party_name}" [${party.slot_start}-${party.slot_end}]`);

      if (!party.members || party.members.length === 0) {
        console.log(`[AUDIT] Party ${party.party_name} sem membros listados.`);
        continue;
      }

      // Telemetria baseada em Edge Computing (current_character_state)
      const twentyMinsAgo = new Date(now.getTime() - 20 * 60000).toISOString();
      const { data: states } = await supabase
        .from('current_character_state')
        .select('character_name, xp_total, session_start_xp, last_active')
        .in('character_name', party.members);

      let isHunting = false;
      let totalDelta = 0;

      if (states && states.length > 0) {
        states.forEach((state) => { 
          const delta = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
          if (delta > 0) {
            totalDelta += delta;
          }
          // Se ganhou XP nos ultimos 20 min, ta ativo
          if (state.last_active && state.last_active >= twentyMinsAgo && delta > 0) {
            isHunting = true;
          }
        });
      }

      const todayDate = new Date().toISOString().split('T')[0];

      // Minutos passados desde o início do slot (correto para slots de meia-noite)
      const startMin = toMinutes(party.slot_start);
      let minutesSinceStart = currentTotalMinutes - startMin;
      if (minutesSinceStart < 0) minutesSinceStart += 1440;

      let newStatus;
      let missCount = party.miss_count || 0;

      if (isHunting) {
        newStatus = 'EFFICIENT';
        missCount = 0;
        if (party.last_active_date !== todayDate) {
          await supabase
            .from('parties_planilhadas')
            .update({ miss_count: 0, last_active_date: todayDate, status: 'EFFICIENT' })
            .eq('id', party.id);
        }
      } else {
        if (minutesSinceStart <= 20) {
          newStatus = 'SUBOPTIMAL'; // Tolerância: ainda montando o time
        } else {
          // Passou 20 min sem XP — computar FALTA (1x por dia por party)
          if (party.last_miss_date !== todayDate) {
            missCount += 1;

            // IMPORTANTE: Grava a falta PRIMEIRO, antes de qualquer outra lógica
            await supabase
              .from('parties_planilhadas')
              .update({ miss_count: missCount, last_miss_date: todayDate })
              .eq('id', party.id);

            console.log(`[AUDIT] ❌ Falta: "${party.party_name}" — Acumulado: ${missCount}/3`);

            // ─── STRIKE AUTOMÁTICO (3ª falta) ────────────────────────────
            // FIX: Agora missCount foi incrementado e já gravamos no banco.
            // A condição verifica o valor atualizado, não o antigo.
            if (missCount >= 3) {
              const strikeReason = `Abandono de Slot (${missCount} faltas injustificadas): ${party.party_name}`;
              console.log(`[AUDIT] 🚨 Aplicando Strikes automáticos — "${party.party_name}" (${missCount} faltas)`);

              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 3);

              const newStrikes = party.members.map((member) => ({
                character_name: member,
                reason: strikeReason,
                admin_name: 'Robô Xerife',
                duration_days: 3,
                expires_at: expiresAt.toISOString(),
              }));

              if (newStrikes.length > 0) {
                const { error: strikeError } = await supabase.from('player_strikes').insert(newStrikes);
                if (strikeError) {
                  console.error('[AUDIT] Erro ao aplicar strikes:', strikeError.message);
                } else {
                  console.log(`[AUDIT] ⚖️  ${newStrikes.length} strikes aplicados — party: "${party.party_name}"`);
                }
              }
            }
            // ─────────────────────────────────────────────────────────────
          }

          // Status visual baseado no acúmulo de faltas
          if (missCount === 1) newStatus = 'FALTA_1';
          else if (missCount === 2) newStatus = 'FALTA_2';
          else newStatus = 'GHOST_SLOT';
        }
      }

      const xpFormatted =
        totalDelta > 1000000
          ? (totalDelta / 1000000).toFixed(1) + 'M'
          : (totalDelta / 1000).toFixed(0) + 'K';

      const { error: updateError } = await supabase
        .from('parties_planilhadas')
        .update({ status: newStatus, delta_xp: xpFormatted })
        .eq('id', party.id);

      if (updateError) {
        console.error(`[AUDIT] Falha ao atualizar "${party.party_name}":`, updateError.message);
      } else {
        const emoji = newStatus === 'EFFICIENT' ? '✅' : newStatus === 'SUBOPTIMAL' ? '⏳' : '❌';
        console.log(`[AUDIT] ${emoji} "${party.party_name}" → ${newStatus} | Faltas: ${missCount}/3 | XP: ${xpFormatted}`);
      }
    }

    console.log('[AUDIT] ✔ Auditoria concluída.');
  } catch (error) {
    console.error('[AUDIT] Erro crítico:', error.message);
  }
};
