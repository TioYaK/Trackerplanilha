import { supabase } from '../db.js';
import { scrapeHighscores } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchHighscores = async () => {
  try {
    console.log('[JOB] Fetching Highscores (Auroria)...');
    
    // Scrape up to 500 pages (25.000 players) specifically on the 'Auroria' server
    const players = await scrapeHighscores('Auroria', null, 500); 
    
    if (!players || players.length === 0) {
      console.log(`[JOB] Nenhum highscore encontrado.`);
      return;
    }

    // Buscamos quem está na nossa guilda (Paginação para suportar > 1000 membros)
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
    const memberNames = new Set(allGuildMembers.map(m => m.name.toLowerCase()));

    const logsToInsert = [];
    const names = players.filter(p => memberNames.has(p.name.toLowerCase())).map(p => p.name);
    
    // Calcula Delta XP (Chunking para evitar limites de URL e limite de 1000 rows)
    const lastXpMap = {};
    const chunkSize = 50;
    for (let i = 0; i < names.length; i += chunkSize) {
      const chunk = names.slice(i, i + chunkSize);
      const { data: lastLogs } = await supabase
        .from('telemetry_logs')
        .select('character_name, xp_total')
        .in('character_name', chunk)
        .order('recorded_at', { ascending: false });
        
      if (lastLogs) {
        lastLogs.forEach(row => {
          if (!lastXpMap[row.character_name]) lastXpMap[row.character_name] = parseInt(row.xp_total, 10);
        });
      }
    }
    
    for (const player of players) {
      if (memberNames.has(player.name.toLowerCase())) {
        const lastXp = lastXpMap[player.name] || player.experience;
        logsToInsert.push({
          character_name: player.name,
          level: player.level,
          xp_total: player.experience,
          delta_xp: player.experience - lastXp,
          is_online: false // Será atualizado por telemetry fetchGuild
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
