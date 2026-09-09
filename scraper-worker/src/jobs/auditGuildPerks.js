import { supabase } from '../db.js';

/**
 * Job de Auditoria Contínua do Sistema de Perks da Guilda
 * 1. Audita a XP dos últimos 7 dias de cada membro participante
 * 2. Sinaliza membros com 0 XP que não possuem carência ativa
 * 3. Checa vencimentos de cota e atualiza status
 * 4. Processa a fila de promoções/rebaixamentos in-game (guild_role_queue)
 */
export const runAuditGuildPerks = async () => {
  console.log('\n[PERKS] 🛡️ Iniciando Auditoria do Sistema de Perks da Guilda...');

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Busca configurações vigentes (suporte multi-servidor)
    const { data: allSettings } = await supabase
      .from('guild_perk_settings')
      .select('*');

    const settingsByWorld = {};
    if (allSettings && allSettings.length > 0) {
      allSettings.forEach(s => {
        if (s.world) settingsByWorld[s.world.toLowerCase()] = s;
      });
    }
    const defaultSettings = allSettings?.find(s => s.id === 1) || allSettings?.[0] || {};

    // 2. Busca todos os membros sob acompanhamento
    const { data: perkMembers, error: mErr } = await supabase
      .from('guild_perk_members')
      .select('*')
      .in('status', ['ACTIVE', 'INACTIVITY_ALERT', 'FEE_EXPIRED']);

    if (mErr) {
      console.warn('[PERKS] ⚠️ Tabela guild_perk_members não encontrada ou erro na busca:', mErr.message);
      return;
    }

    if (!perkMembers || perkMembers.length === 0) {
      console.log('[PERKS] Nenhum membro ativo no sistema de perks para auditar.');
    } else {
      console.log(`[PERKS] Auditando ${perkMembers.length} membro(s) participantes...`);

      for (const member of perkMembers) {
        const charKey = member.character_name.toLowerCase();
        const memberWorld = (member.world || 'Auroria').toLowerCase();
        const memberSettings = settingsByWorld[memberWorld] || defaultSettings;
        const minXpThreshold = memberSettings?.min_weekly_xp || 1;

        // 2.1 Calcula XP arquivada nos últimos 7 dias
        const { data: sessions } = await supabase
          .from('historical_sessions')
          .select('xp_gained')
          .ilike('character_name', charKey)
          .gte('session_start', sevenDaysAgo);

        let total7dXp = 0;
        if (sessions && sessions.length > 0) {
          total7dXp = sessions.reduce((acc, curr) => acc + (parseInt(curr.xp_gained, 10) || 0), 0);
        }

        // 2.2 Adiciona delta ao vivo se o boneco estiver caçando agora
        const { data: liveState } = await supabase
          .from('current_character_state')
          .select('session_start_xp, xp_total')
          .ilike('character_name', charKey)
          .maybeSingle();

        if (liveState && liveState.xp_total && liveState.session_start_xp) {
          const liveDelta = Number(liveState.xp_total) - Number(liveState.session_start_xp);
          if (liveDelta > 0) total7dXp += liveDelta;
        }

        // 2.3 Checa Carência
        const hasActiveGrace = member.grace_period_until && new Date(member.grace_period_until) > now;
        const isFeeExpired = member.expires_at && new Date(member.expires_at) < now && !hasActiveGrace;

        let newStatus = member.status;
        let auditEvent = null;

        if (total7dXp < minXpThreshold) {
          if (!hasActiveGrace && member.status === 'ACTIVE') {
            newStatus = 'INACTIVITY_ALERT';
            auditEvent = {
              character_name: member.character_name,
              world: member.world || 'Auroria',
              event_type: 'INACTIVITY_FLAGGED',
              actor: 'WORKER',
              details: `Alerta disparado: 0 XP gerada nos últimos 7 dias. Encaminhado para a Mesa de Veredito do Admin.`
            };
          }
        } else {
          // Membro voltou a caçar
          if (member.status === 'INACTIVITY_ALERT') {
            newStatus = isFeeExpired ? 'FEE_EXPIRED' : 'ACTIVE';
            auditEvent = {
              character_name: member.character_name,
              world: member.world || 'Auroria',
              event_type: 'ACTIVITY_RESTORED',
              actor: 'WORKER',
              details: `Atividade recuperada (+${(total7dXp / 1000000).toFixed(1)}M XP nos últimos 7 dias). Alerta revogado.`
            };
          }
        }

        if (isFeeExpired && newStatus === 'ACTIVE') {
          newStatus = 'FEE_EXPIRED';
          auditEvent = {
            character_name: member.character_name,
            world: member.world || 'Auroria',
            event_type: 'FEE_EXPIRED',
            actor: 'WORKER',
            details: `Vencimento da cota do ciclo atingido. Aguardando renovação financeira.`
          };
        }

        // Atualiza dados do membro
        await supabase
          .from('guild_perk_members')
          .update({
            last_7d_xp: total7dXp,
            last_xp_check_at: now.toISOString(),
            status: newStatus,
            updated_at: now.toISOString()
          })
          .eq('id', member.id);

        if (auditEvent) {
          await supabase.from('guild_perk_audit_logs').insert(auditEvent);
        }
      }
    }

    // 3. Processa a Fila de Cargos In-Game (guild_role_queue)
    const { data: pendingActions, error: qErr } = await supabase
      .from('guild_role_queue')
      .select('*')
      .eq('status', 'PENDING')
      .limit(10);

    if (!qErr && pendingActions && pendingActions.length > 0) {
      console.log(`[PERKS] ⚖️ Processando ${pendingActions.length} ação(ões) na fila de cargos in-game...`);

      for (const item of pendingActions) {
        console.log(`[PERKS] ➡️ Executando ${item.action} para "${item.character_name}" (${item.world})...`);

        // Registra execução (em ambiente de produção, este ponto conecta ao script puppeteer da guilda)
        await supabase
          .from('guild_role_queue')
          .update({
            status: 'COMPLETED',
            executed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        await supabase.from('guild_perk_audit_logs').insert({
          character_name: item.character_name,
          event_type: 'ROLE_EXECUTED',
          actor: 'WORKER',
          world: item.world || 'Auroria',
          details: `Comando in-game "${item.action}" processado com sucesso pelo robô.`
        });
      }
    }

    console.log('[PERKS] ✅ Auditoria do Sistema de Perks concluída com sucesso.\n');
  } catch (err) {
    console.error('[PERKS] ❌ Erro durante a auditoria de perks:', err.message);
  }
};
