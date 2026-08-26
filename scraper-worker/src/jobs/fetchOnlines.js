import { fetchPage } from '../utils/scraper.js';
import { supabase } from '../db.js';

export const runFetchOnlines = async () => {
  const path = '/?subtopic=whoisonline';
  console.log(`[JOB] Fetching online players...`);

  try {
    const $ = await fetchPage(path);
    const onlinePlayers = [];

    // Seletores genéricos para listas de jogadores online
    $('table tr').each((i, row) => {
      if (i === 0) return; // Pula cabeçalho
      
      const tds = $(row).find('td');
      // Nome e Level costumam ficar nas primeiras colunas
      if (tds.length >= 2) {
        const name = $(tds[0]).text().trim();
        const levelText = $(tds[1]).text().trim();
        const level = parseInt(levelText, 10);
        
        // Remove lixos ou títulos (como "Gamemasters")
        if (name && !isNaN(level)) {
          onlinePlayers.push(name);
        }
      }
    });

    console.log(`[JOB] Encontrados ${onlinePlayers.length} jogadores online.`);

    // Registra o historico para o Heatmap de atividade
    await supabase.from('online_history').insert({
      online_count: onlinePlayers.length
    });

    // Atualiza status online dos Hunteds
    const { data: huntedList } = await supabase.from('hunted_list').select('id, name, is_online');
    if (huntedList && huntedList.length > 0) {
      const onlineSet = new Set(onlinePlayers.map(p => p.toLowerCase()));
      
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

  } catch (error) {
    console.error("[JOB] Erro na task FETCH_ONLINES:", error.message);
  }
};
