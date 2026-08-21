import { fetchPage } from '../utils/scraper.js';
import { supabase } from '../db.js';

export const runFetchHighscores = async (page = 1) => {
  const path = `/?subtopic=highscores&list=experience&page=${page}`;
  console.log(`[JOB] Fetching Highscores (Page ${page})...`);

  try {
    const $ = await fetchPage(path);
    const logs = [];

    // Lógica para extrair tabela de Highscores
    $('table tr').each((i, row) => {
      const tds = $(row).find('td');
      // Espera-se: Rank, Nome, Vocação, Level, Pontos (XP)
      if (tds.length >= 5) {
        const name = $(tds[1]).text().trim();
        const levelText = $(tds[3]).text().trim();
        const xpText = $(tds[4]).text().replace(/,/g, '').trim(); // Remove vírgulas
        
        const level = parseInt(levelText, 10);
        const xp = parseInt(xpText, 10);
        
        if (name && !isNaN(level) && !isNaN(xp)) {
          logs.push({
            character_name: name,
            level: level,
            xp_total: xp,
            // is_online pode ser preenchido cruzando com um redis/db cache dos onlines
          });
        }
      }
    });

    if (logs.length === 0) return;

    // Antes de inserir o novo log, precisamos calcular o delta_xp em relação ao log mais recente
    // Como estamos inserindo em massa, a forma mais eficiente é buscar a última XP de todos esses nomes de uma vez
    const names = logs.map(l => l.character_name);
    
    // Pega o último log de cada player
    const { data: lastLogs, error } = await supabase
      .from('telemetry_logs')
      .select('character_name, xp_total')
      .in('character_name', names)
      .order('recorded_at', { ascending: false });

    // Cria um mapa para busca rápida (pega só o mais recente)
    const lastXpMap = {};
    if (lastLogs) {
      lastLogs.forEach(row => {
        if (!lastXpMap[row.character_name]) {
          lastXpMap[row.character_name] = row.xp_total;
        }
      });
    }

    // Calcula Delta
    const logsToInsert = logs.map(log => {
      const prevXp = lastXpMap[log.character_name] || log.xp_total;
      const delta = log.xp_total - prevXp;
      
      return {
        ...log,
        delta_xp: delta >= 0 ? delta : 0, // Evita delta negativo se o cara morreu (ou trata conforme regra de negócio)
      };
    });

    // Insere os logs
    const { error: insertError } = await supabase
      .from('telemetry_logs')
      .insert(logsToInsert);

    if (insertError) {
      console.error(`[JOB] Erro ao inserir logs de telemetria da pág ${page}:`, insertError);
    } else {
      console.log(`[JOB] Pág ${page}: ${logsToInsert.length} logs inseridos com sucesso.`);
    }

  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_HIGHSCORE (Pág ${page}):`, error.message);
  }
};
