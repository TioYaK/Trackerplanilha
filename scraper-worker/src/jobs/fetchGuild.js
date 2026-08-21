import { fetchPage } from '../utils/scraper.js';
import { supabase } from '../db.js';

export const runFetchGuild = async () => {
  const guildName = process.env.GUILD_NAME || 'SuaGuilda';
  // A URL pode variar (ex: ?subtopic=guilds&name=...)
  const path = `/?subtopic=guilds&name=${encodeURIComponent(guildName)}`;
  
  console.log(`[JOB] Fetching guild data for: ${guildName}`);
  
  try {
    const $ = await fetchPage(path);
    const members = [];
    
    // ATENÇÃO: Os seletores variam de acordo com o AAC do servidor.
    // Aqui usamos um seletor genérico presumindo uma tabela com classe específica ou estrutura padrão.
    $('table tr').each((i, row) => {
      if (i === 0) return; // Pula o cabeçalho
      
      const tds = $(row).find('td');
      if (tds.length >= 4) {
        // Ex: Rank, Nome, Vocação, Level
        const rank = $(tds[0]).text().trim();
        const name = $(tds[1]).text().trim();
        const vocation = $(tds[2]).text().trim();
        const levelText = $(tds[3]).text().trim();
        const level = parseInt(levelText, 10);
        
        if (name && !isNaN(level)) {
          members.push({
            name,
            rank,
            vocation,
            level,
            is_active_7d: true,
          });
        }
      }
    });

    if (members.length === 0) {
      console.log("[JOB] Nenhum membro encontrado (Verifique os seletores HTML).");
      return;
    }

    console.log(`[JOB] ${members.length} membros processados. Atualizando banco de dados...`);

    // Upsert para inserir ou atualizar os membros
    const { error } = await supabase
      .from('guild_members')
      .upsert(members, { onConflict: 'name' });

    if (error) {
      console.error("[JOB] Erro ao inserir membros da guilda:", error);
    } else {
      console.log("[JOB] Guilda atualizada com sucesso!");
    }
  } catch (error) {
    console.error("[JOB] Erro na task FETCH_GUILD:", error.message);
  }
};
