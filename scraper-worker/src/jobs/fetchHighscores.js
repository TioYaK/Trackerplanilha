import { supabase } from '../db.js';
import { apiClient } from '../apiClient.js';
import { scrapeHighscores } from '../lib/rubinotScraper.js';
import 'dotenv/config';

const RUBINOT_WORLDS = [
  'Auroria',
  'Belaria',
  'Bellum',
  'Drakaria',
  'Eldrian',
  'Elysian',
  'Infernum I',
  'Infernum II',
  'Infernum III',
  'Lunarian',
  'Malveria',
  'Mystian',
  'Obsidian',
  'Solarian',
  'Tenebrium',
  'Vesperia'
];
let currentWorldIndex = 0;

export const runFetchHighscores = async (vocationStr) => {
  try {
    const voc = vocationStr === 'ALL' ? null : 
                vocationStr.charAt(0).toUpperCase() + vocationStr.slice(1).toLowerCase();
                
    // Roda em pares de mundos para cobrir os 16 mundos do Rubinot com igual prioridade
    const world1 = RUBINOT_WORLDS[currentWorldIndex];
    const world2 = RUBINOT_WORLDS[(currentWorldIndex + 1) % RUBINOT_WORLDS.length];
    currentWorldIndex = (currentWorldIndex + 2) % RUBINOT_WORLDS.length;

    console.log(`[JOB] Fetching Highscores -> ${world1} + ${world2} (Rotação Equilibrada) | Vocação: ${voc || 'Geral'}`);
    
    let playersW1 = [];
    let playersW2 = [];
    try {
      const resW1 = await scrapeHighscores(world1, null, 10, voc) || [];
      playersW1 = resW1.map(p => ({ ...p, world: world1 }));
    } catch (e1) {
      console.warn(`[JOB] Falha ao raspar highscore de ${world1}:`, e1.message);
    }
    try {
      const resW2 = await scrapeHighscores(world2, null, 10, voc) || [];
      playersW2 = resW2.map(p => ({ ...p, world: world2 }));
    } catch (e2) {
      console.warn(`[JOB] Falha ao raspar highscore de ${world2}:`, e2.message);
    }

    const players = [...playersW1, ...playersW2];
    
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
            if (m && typeof m === 'string') allGuildMembers.push({ name: m.trim() });
          });
        } else if (typeof p.members === 'string') {
          p.members.split(',').forEach(m => {
            if (m && m.trim()) allGuildMembers.push({ name: m.trim() });
          });
        }
      });
    }

    const memberNames = new Set(allGuildMembers.filter(m => m && m.name).map(m => m.name.toLowerCase()));
    // RASTREAMENTO GLOBAL: Monitora todos os jogadores do servidor (não descarta mais não-membros)
    const relevantPlayers = players.filter(p => p && p.name);
    
    if (relevantPlayers.length === 0) {
      console.log(`[JOB] Nenhum jogador encontrado nos highscores.`);
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
          if (memberNames.has(player.name.toLowerCase())) {
            activeNames.push(player.name);
          }
        } else {
          // Não ganhou XP, manter os dados antigos (só atualizamos se mudou de level, etc)
          session_start_xp = existing.session_start_xp;
          session_start_time = existing.session_start_time;
          last_active = existing.last_active;
        }
      }

      const VOCATION_MAP = {
        '1': 'Master Sorcerer', '2': 'Elder Druid', '3': 'Royal Paladin', '4': 'Elite Knight',
        '5': 'Master Sorcerer', '6': 'Elder Druid', '7': 'Royal Paladin', '8': 'Elite Knight',
        '9': 'Monk', '10': 'Exalted Monk',
        'Druid': 'Elder Druid', 'Knight': 'Elite Knight', 'Sorcerer': 'Master Sorcerer', 'Paladin': 'Royal Paladin',
        'Monk': 'Monk', 'Exalted Monk': 'Exalted Monk'
      };
      const rawVoc = player.vocation || voc;
      const normalizedVoc = VOCATION_MAP[rawVoc] || rawVoc;

      statesToUpsert.push({
        character_name: player.name,
        level: player.level,
        vocation: normalizedVoc,
        xp_total: player.experience,
        last_active: last_active,
        session_start_xp: session_start_xp,
        session_start_time: session_start_time,
        world: player.world || null
      });
    }

    // Upsert em chunks
    let upsertedCount = 0;
    for (let i = 0; i < statesToUpsert.length; i += chunkSize) {
      const chunk = statesToUpsert.slice(i, i + chunkSize);
      
      // 1. Tenta envio via ApiClient seguro (Gateway Vercel)
      const apiRes = await apiClient.reportHighscores(chunk);
      if (apiRes?.ok) {
        upsertedCount += (apiRes.processed || chunk.length);
      } else if (supabase) {
        // 2. Fallback direto
        const cleanChunk = chunk.map(({ world, ...rest }) => rest);
        const { error } = await supabase.from('current_character_state').upsert(cleanChunk, { onConflict: 'character_name' });
        if (error) {
          console.error(`[JOB] Erro ao atualizar current_character_state (fallback):`, error.message);
        } else {
          upsertedCount += cleanChunk.length;
        }

        // Sincroniza mundo e rank em guild_perk_members
        const perkChunk = chunk.filter(c => c.world).map(c => ({
          character_name: c.character_name,
          world: c.world,
          notes: c.rank ? `rank:${c.rank}` : null
        }));
        if (perkChunk.length > 0) {
          await supabase.from('guild_perk_members').upsert(perkChunk, { onConflict: 'character_name' });
        }
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
