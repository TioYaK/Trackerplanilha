import { supabase } from '../db.js';

/**
 * Função responsável por auditar os slots planilhados em tempo real.
 * Ela cruza quem está na planilha com a XP atual dos jogadores.
 */
export const runAuditSlots = async () => {
  console.log(`[AUDIT] Iniciando auditoria dos Respawns Planilhados...`);

  try {
    // 1. Busca todas as parties planilhadas para hoje
    const { data: parties, error: partiesError } = await supabase
      .from('parties_planilhadas')
      .select('*');

    if (partiesError) throw partiesError;
    if (!parties || parties.length === 0) {
      console.log(`[AUDIT] Nenhuma party cadastrada na planilha no momento.`);
      return;
    }

    // Pega o horário atual (hora e minuto)
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    console.log(`[AUDIT] Horário atual do servidor: ${currentTimeStr}`);

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

      let newStatus = 'GHOST_SLOT'; // Vermelho
      
      if (isHunting) {
        newStatus = 'EFFICIENT'; // Verde
      } else {
        // Se a party acabou de começar o slot (primeiros 20 minutos), damos uma tolerância (Amarelo)
        // Calcula a diferença em minutos desde o início do slot
        const [startH, startM] = party.slot_start.split(':').map(Number);
        const slotStartInMinutes = startH * 60 + startM;
        const currentInMinutes = currentHour * 60 + currentMinute;
        
        if (currentInMinutes - slotStartInMinutes <= 20) {
          newStatus = 'SUBOPTIMAL'; // Amarelo (Tolerância / Montando time)
        }
      }

      // Atualiza a tabela parties_planilhadas
      // Note: Adicionamos colunas status e delta_xp virtualmente lá no mock, mas não no SQL!
      // Precisamos alterar o schema SQL se quisermos gravar isso direto na 'parties_planilhadas'.
      // Vamos assumir que criaremos as colunas 'status' e 'current_delta_xp'.
      
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
        console.log(`[AUDIT] Party ${party.party_name} -> Status: ${newStatus} | XP Gerada: ${totalDelta}`);
      }
    }

    console.log(`[AUDIT] Auditoria concluída com sucesso.`);
  } catch (error) {
    console.error(`[AUDIT] Erro crítico na auditoria:`, error.message);
  }
};
