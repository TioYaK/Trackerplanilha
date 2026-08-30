import { scrapeOnlines } from '../lib/rubinotScraper.js';
import { supabase } from '../db.js';

export const runFetchOnlines = async () => {
  console.log(`[JOB] Fetching online players...`);

  try {
    const onlinePlayers = await scrapeOnlines('Auroria');
    
    if (onlinePlayers.length === 0) {
      console.log('[JOB] Nenhum jogador online ou erro ao buscar.');
      return;
    }

    console.log(`[JOB] Iniciando processamento de ${onlinePlayers.length} jogadores online.`);

    // Registra o historico para o Heatmap de atividade
    await supabase.from('online_history').insert({
      online_count: onlinePlayers.length
    });

    // Atualiza status online dos Hunteds
    const { data: huntedList } = await supabase.from('hunted_list').select('id, name, is_online');
    const onlineSet = new Set(onlinePlayers.map(p => p.toLowerCase()));

    if (huntedList && huntedList.length > 0) {
      for (const hunted of huntedList) {
        const isCurrentlyOnline = onlineSet.has(hunted.name.toLowerCase());
        
        // Se o status mudou ou se ele acabou de ser visto online
        if (isCurrentlyOnline) {
          await supabase.from('hunted_list')
            .update({ is_online: true, last_seen: new Date().toISOString() })
            .eq('id', hunted.id);
        } else if (hunted.is_online) {
          await supabase.from('hunted_list')
            .update({ is_online: false })
            .eq('id', hunted.id);
        }
      }
    }

    // --- CARIMBO DE ATIVIDADE PARA QUEM ESTÁ ONLINE ---
    // A ideia genial do dono: Se o cara está online no site, ele está ativo!
    const { data: guildMembers } = await supabase.from('guild_members').select('name');
    if (guildMembers && guildMembers.length > 0) {
      const activeGuildNames = guildMembers
        .filter(m => onlineSet.has(m.name.toLowerCase()))
        .map(m => m.name);

      if (activeGuildNames.length > 0) {
        const now = new Date().toISOString();
        let updatedCount = 0;
        // Divide em chunks de 100 para não estourar a URL
        for (let i = 0; i < activeGuildNames.length; i += 100) {
          const chunk = activeGuildNames.slice(i, i + 100);
          const { error: updateErr } = await supabase
            .from('guild_members')
            .update({ last_xp_date: now })
            .in('name', chunk);
          if (!updateErr) updatedCount += chunk.length;
        }
        console.log(`[JOB] Carimbo de Atividade (Online) aplicado para ${updatedCount} membros da guilda.`);
      } else {
        console.log(`[JOB] Nenhum membro da guilda está online no momento.`);
      }
    }

  } catch (error) {
    console.error("[JOB] Erro na task FETCH_ONLINES:", error.message);
  }
};
