import { supabase } from '../db.js';

/**
 * Função responsável por auditar os slots planilhados em tempo real.
 * Ela cruza quem está na planilha com a XP atual dos jogadores.
 */
export const runAuditSlots = async () => {
  console.log(`[AUDIT] Iniciando auditoria dos Respawns Planilhados...`);

  try {
    // 1. Busca TODAS as parties planilhadas (agendamentos persistentes)
    let parties = [];
    let page = 0;
    while(true) {
        const { data, error } = await supabase
          .from('parties_planilhadas')
          .select('*')
          .range(page*1000, (page+1)*1000-1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        parties.push(...data);
        if (data.length < 1000) break;
        page++;
    }

    if (!parties || parties.length === 0) {
      console.log(`[AUDIT] Nenhuma party cadastrada na planilha no momento.`);
      return;
    }

    // Pega o horário atual (hora e minuto) no fuso do Brasil (BRT)
    const now = new Date();
    
    // Converte para o fuso horário de Brasília (onde os jogadores agendam as parties)
    const brtTime = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);
    
    const [currentHour, currentMinute] = brtTime.split(':').map(Number);
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`[AUDIT] Horário atual (BRT - Brasília): ${currentTimeStr}`);

    // Para cada party, vamos validar o status
    for (const party of parties) {
      // Verifica se a party está dentro do seu slot de tempo
      const isSlotActive = currentTimeStr >= party.slot_start && currentTimeStr <= party.slot_end;

      if (!isSlotActive) {
        // Fora do horário, volta pro default ou não mexe
        continue;
      }

      console.log(`[AUDIT] Analisando slot ativo: ${party.party_name} (${party.respawn_category})`);

      // Se está no horário, precisamos checar os membros (telemetry_logs recentes)
      if (!party.members || party.members.length === 0) {
        console.log(`[AUDIT] Party ${party.party_name} não tem membros listados.`);
        continue;
      }

      // Busca o último log de telemetria dos membros da party nos últimos 20 minutos
      const twentyMinsAgo = new Date(now.getTime() - 20 * 60000).toISOString();
      
      const { data: logs, error: logsError } = await supabase
        .from('telemetry_logs')
        .select('character_name, delta_xp, recorded_at')
        .in('character_name', party.members)
        .gte('recorded_at', twentyMinsAgo);

      let isHunting = false;
      let totalDelta = 0;

      if (logs && logs.length > 0) {
        // Se a soma do delta_xp da party for considerável (maior que 0), estão caçando
        logs.forEach(log => {
          totalDelta += Number(log.delta_xp || 0);
        });

        // Tolerância: Precisam fazer alguma XP para provar que estão no respawn
        if (totalDelta > 0) {
          isHunting = true;
        }
      }

      let newStatus = 'GHOST_SLOT'; // Fallback
      let missCount = party.miss_count || 0;
      const todayDate = new Date().toISOString().split('T')[0];
      const [startH, startM] = party.slot_start.split(':').map(Number);
      const slotStartInMinutes = startH * 60 + startM;
      const currentInMinutes = currentHour * 60 + currentMinute;
      
      if (isHunting) {
        newStatus = 'EFFICIENT'; // Verde
        missCount = 0; // Resetou as faltas pq apareceu!
        
        // Atualiza a ultima data ativa se diferente
        if (party.last_active_date !== todayDate) {
          await supabase.from('parties_planilhadas').update({ 
            miss_count: 0, 
            last_active_date: todayDate,
            status: 'EFFICIENT'
          }).eq('id', party.id);
        }
      } else {
        // Nao estao cacando
        if (currentInMinutes - slotStartInMinutes <= 20) {
          newStatus = 'SUBOPTIMAL'; // Amarelo (Tolerância / Montando time)
        } else {
          // Passou de 20 min atrasados! 
          // Verifica se já computamos a falta de HOJE
          if (party.last_miss_date !== todayDate) {
            missCount += 1;
            await supabase.from('parties_planilhadas').update({ 
              miss_count: missCount, 
              last_miss_date: todayDate 
            }).eq('id', party.id);
            console.log(`[AUDIT] Party ${party.party_name} tomou uma FALTA. Total: ${missCount}`);
          }
          
          // Define o Status visual baseado no acumulo de faltas
          if (missCount === 1) newStatus = 'FALTA_1';
          else if (missCount === 2) newStatus = 'FALTA_2';
          else newStatus = 'GHOST_SLOT'; // 3 faltas ou mais
        }
      }

      // Atualiza o XP e o status final no banco
      const { error: updateError } = await supabase
        .from('parties_planilhadas')
        .update({ 
          status: newStatus,
          // Formatando o DeltaXP para M ou K para ficar amigável no Dashboard
          delta_xp: totalDelta > 1000000 ? (totalDelta / 1000000).toFixed(1) + 'M' : (totalDelta / 1000).toFixed(0) + 'K'
        })
        .eq('id', party.id);

      if (updateError) {
        console.error(`[AUDIT] Falha ao atualizar o status da party ${party.party_name}:`, updateError);
      } else {
        console.log(`[AUDIT] Party ${party.party_name} -> Status: ${newStatus} | Faltas: ${missCount} | XP: ${totalDelta}`);
      }

      // NOVIDADE: Sistema de Tribunal (Strikes Automatizados)
      // Agora só aplica se atingir o Abandono (3 faltas)
      if (newStatus === 'GHOST_SLOT' && party.last_miss_date !== todayDate) {
        // A garantia do last_miss_date impede de aplicar varios strikes no mesmo dia
        const strikeReason = `Abandono de Slot (3 dias de Falta Injustificada): ${party.party_name}`;
        
        // Verifica se a punição já foi aplicada hoje para esta party específica
        const { data: existingStrikes } = await supabase
          .from('player_strikes')
          .select('id')
          .eq('reason', strikeReason)
          .gte('created_at', todayDate) // Só olha pro dia de hoje
          .limit(1);

        if (!existingStrikes || existingStrikes.length === 0) {
          console.log(`[AUDIT] 🚨 Aplicando Strikes Automáticos por Abandono (3 dias): ${party.party_name}`);
          
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 3); // 3 dias de punição padrão

          const newStrikes = party.members.map(member => ({
            character_name: member,
            reason: strikeReason,
            admin_name: 'Robô Xerife',
            expires_at: expiresAt.toISOString()
          }));

          if (newStrikes.length > 0) {
            const { error: strikeError } = await supabase
              .from('player_strikes')
              .insert(newStrikes);
              
            if (strikeError) {
              console.error(`[AUDIT] Erro ao aplicar strikes:`, strikeError.message);
            } else {
              console.log(`[AUDIT] ⚖️ ${newStrikes.length} strikes aplicados com sucesso.`);
            }
          }
        }
      }
    }

    console.log(`[AUDIT] Auditoria concluída com sucesso.`);
  } catch (error) {
    console.error(`[AUDIT] Erro crítico na auditoria:`, error.message);
  }
};
