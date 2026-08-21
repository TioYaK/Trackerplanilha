import { supabase } from '../db.js';
import { scrapeHighscores } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchHighscores = async () => {
  console.log(`[JOB] Fetching Highscores (Global)...`);
  
  try {
    const players = await scrapeHighscores(null, null, 10); // max 10 pages for now to not overload

    if (!players || players.length === 0) {
      console.log(`[JOB] Nenhum highscore encontrado.`);
      return;
    }

    // Buscamos quem está na nossa guilda
    const { data: guildMembers } = await supabase.from('guild_members').select('name');
    const memberNames = new Set(guildMembers?.map(m => m.name.toLowerCase()) || []);

    const logsToInsert = [];
    
    // Calcula Delta XP
    const names = players.filter(p => memberNames.has(p.name.toLowerCase())).map(p => p.name);
    const { data: lastLogs } = await supabase
      .from('telemetry_logs')
      .select('character_name, xp_total')
      .in('character_name', names)
      .order('recorded_at', { ascending: false });

    const lastXpMap = {};
    if (lastLogs) {
      lastLogs.forEach(row => {
        if (!lastXpMap[row.character_name]) lastXpMap[row.character_name] = parseInt(row.xp_total, 10);
      });
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

    const { error } = await supabase.from('telemetry_logs').insert(logsToInsert);
    if (error) throw error;

    console.log(`[JOB] Inseridos ${logsToInsert.length} logs de telemetria baseados nos Highscores.`);
  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_HIGHSCORES:`, error.message);
  }
};
