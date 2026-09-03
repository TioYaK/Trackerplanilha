import { supabase } from '../db.js';
import { scrapeHighscores } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchHighscores = async (vocationStr) => {
  try {
    const voc = vocationStr === 'ALL' ? null : 
                vocationStr.charAt(0).toUpperCase() + vocationStr.slice(1).toLowerCase();
                
    console.log(`[JOB] Fetching Highscores (Auroria) -> Vocação: ${voc || 'Geral'}`);
    
    // Varre as 20 páginas (Top 1000) da vocação específica.
    const players = await scrapeHighscores('Auroria', null, 20, voc); 
    
    if (!players || players.length === 0) {
      console.log(`[JOB] Nenhum highscore encontrado.`);
      return;
    }

    // Buscamos quem está na nossa guilda
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

    // Buscamos membros de parties_planilhadas
    const { data: partyData } = await supabase.from('parties_planilhadas').select('members, leader_name');
    if (partyData) {
      partyData.forEach(p => {
        if (p.leader_name) allGuildMembers.push({ name: p.leader_name });
        if (Array.isArray(p.members)) {
          p.members.forEach(m => {
            if (m) allGuildMembers.push({ name: m });
          });
        }
      });
    }

    const memberNames = new Set(allGuildMembers.map(m => m.name.toLowerCase()));
    const relevantPlayers = players.filter(p => memberNames.has(p.name.toLowerCase()));
    
    if (relevantPlayers.length === 0) {
      console.log(`[JOB] Nenhum membro relevante encontrado nos highscores.`);
      return;
    }

    // Fetch existing states to compare
    const names = relevantPlayers.map(p => p.name);
    let existingStatesMap = new Map();
    
    const chunkSize = 100;
    for (let i = 0; i < names.length; i += chunkSize) {
      const chunk = names.slice(i, i + chunkSize);
      const { data: states } = await supabase
        .from('current_character_state')
        .select('*')
        .in('character_name', chunk);
        
      if (states) {
        states.forEach(s => existingStatesMap.set(s.character_name.toLowerCase(), s));
      }
    }

    const statesToUpsert = [];
    const activeNames = [];
    const now = new Date().toISOString();

    for (const player of relevantPlayers) {
      const existing = existingStatesMap.get(player.name.toLowerCase());
      
      let session_start_xp = player.experience;
      let session_start_time = now;
      let last_active = now;

      if (existing) {
        // Se a XP aumentou, ele está ativo
        if (player.experience > existing.xp_total) {
          session_start_xp = existing.session_start_xp || existing.xp_total;
          session_start_time = existing.session_start_time || now;
          last_active = now; // Update last active
          activeNames.push(player.name);
        } else {
          // Não ganhou XP, manter os dados antigos (só atualizamos se mudou de level, etc)
          session_start_xp = existing.session_start_xp;
          session_start_time = existing.session_start_time;
          last_active = existing.last_active;
        }
      }

      statesToUpsert.push({
        character_name: player.name,
        level: player.level,
        vocation: player.vocation || voc,
        xp_total: player.experience,
        last_active: last_active,
        session_start_xp: session_start_xp,
        session_start_time: session_start_time
      });
    }

    // Upsert em chunks
    let upsertedCount = 0;
    for (let i = 0; i < statesToUpsert.length; i += chunkSize) {
      const chunk = statesToUpsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('current_character_state').upsert(chunk, { onConflict: 'character_name' });
      if (error) {
        console.error(`[JOB] Erro ao atualizar current_character_state:`, error.message);
      } else {
        upsertedCount += chunk.length;
      }
    }
    
    // --- ATUALIZA O LAST_XP_DATE DOS ATIVOS (Guild Members) ---
    if (activeNames.length > 0) {
      let updatedCount = 0;
      for (let i = 0; i < activeNames.length; i += 100) {
        const chunk = activeNames.slice(i, i + 100);
        const { error: updateErr } = await supabase
          .from('guild_members')
          .update({ last_xp_date: now })
          .in('name', chunk);
        if (!updateErr) updatedCount += chunk.length;
      }
      console.log(`[JOB] Carimbo de Atividade (last_xp_date) atualizado para ${updatedCount} membros.`);
    }

    console.log(`[JOB] Atualizados ${upsertedCount} estados de personagens (Edge Computing).`);
  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_HIGHSCORES:`, error.message);
  }
};
