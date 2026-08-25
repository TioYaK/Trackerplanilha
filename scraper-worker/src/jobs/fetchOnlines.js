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

    // 1. Resetar flag is_online de todo mundo no telemetry_logs mais recente? 
    // Na verdade, a tabela telemetry_logs é de série temporal, então onlines não modificam o log passado,
    // mas sim servem para cruzar. Podemos criar um novo log para os online
    // O mais comum é atualizar uma view temporária ou cruzar na hora do highscore.
    
    // Para simplificar, vamos atualizar a flag na tabela guild_members para o Dashboard mostrar quem está logado AGORA.
    // Primeiro zera todo mundo:
    /* await supabase.from('guild_members').update({ is_online: false }).neq('id', '00000000-0000-0000-0000-000000000000'); */ 
    // Opcional, dependendo da necessidade de ver quem tá online na guilda.

  } catch (error) {
    console.error("[JOB] Erro na task FETCH_ONLINES:", error.message);
  }
};
