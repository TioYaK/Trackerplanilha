import { supabase } from '../db.js';
import { scrapeHighscores } from '../lib/rubinotScraper.js';
import 'dotenv/config';

// Cache global em memória para evitar consultas caras ao banco (Disk IO)
const globalLastXpMap = new Map();

export const runFetchHighscores = async () => {
  try {
    console.log('[JOB] Fetching Highscores (Auroria)...');
    
    const players = await scrapeHighscores('Auroria', null, 500); 
    
    if (!players || players.length === 0) {
      console.log(`[JOB] Nenhum highscore encontrado.`);
      return;
    }

    // Buscamos quem estǭ na nossa guilda
    let allGuildMembers = [];
    let from = 0;
    const step = 1000;
    while(true) {
      const { data } = await supabase.from('guild_members').select('name').range(from, from + step - 1);
      if (!data || data.length === 0) break;
      allGuildMembers.push(...data);
      if (data.length < step) break;
      from += step;
    }

    // Buscamos os Hunteds
    const { data: huntedData } = await supabase.from('hunted_list').select('name');
    if (huntedData) {
      allGuildMembers.push(...huntedData);
    }

    const memberNames = new Set(allGuildMembers.map(m => m.name.toLowerCase()));

    const logsToInsert = [];
    const names = players.filter(p => memberNames.has(p.name.toLowerCase())).map(p => p.name);
    
    // Descobre nomes que não estão no cache
    const missingNames = names.filter(n => !globalLastXpMap.has(n));
    
    // Busca apenas o histórico recente para os que faltam (Redução drástica de Disk IO)
    const chunkSize = 50;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    for (let i = 0; i < missingNames.length; i += chunkSize) {
      const chunk = missingNames.slice(i, i + chunkSize);
      const { data: lastLogs } = await supabase
        .from('telemetry_logs')
        .select('character_name, xp_total')
        .in('character_name', chunk)
        .gte('recorded_at', yesterday)
        .order('recorded_at', { ascending: false });
        
      if (lastLogs) {
        lastLogs.forEach(row => {
          if (!globalLastXpMap.has(row.character_name)) {
            globalLastXpMap.set(row.character_name, parseInt(row.xp_total, 10));
          }
        });
      }
    }
    
    for (const player of players) {
      if (memberNames.has(player.name.toLowerCase())) {
        const lastXp = globalLastXpMap.get(player.name) || player.experience;
        
        // Atualiza o cache para o próximo ciclo
        globalLastXpMap.set(player.name, player.experience);
        
        logsToInsert.push({
          character_name: player.name,
          level: player.level,
          xp_total: player.experience,
          delta_xp: player.experience - lastXp,
          is_online: false
        });
      }
    }

    if (logsToInsert.length === 0) {
      console.log(`[JOB] Nenhum membro da guilda encontrado nos highscores.`);
      return;
    }

    // Insert em chunks para evitar erro de payload gigante
    let insertedCount = 0;
    for (let i = 0; i < logsToInsert.length; i += chunkSize) {
      const chunk = logsToInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('telemetry_logs').insert(chunk);
      if (error) {
        console.error(`[JOB] Erro ao inserir chunk de logs:`, error.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`[JOB] Inseridos ${insertedCount} logs de telemetria baseados nos Highscores.`);
  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_HIGHSCORES:`, error.message);
  }
};
