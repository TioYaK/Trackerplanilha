import { supabase } from '../db.js';
import { scrapeRubinotCharacterPage } from '../lib/rubinotScraper.js';

export const runFetchRosterShard = async (shardId) => {
  console.log(`[JOB] Iniciando Shard ${shardId} do Roster (Detalhes Individuais)...`);

  try {
    const { data: members, error } = await supabase.from('guild_members').select('name');
    if (error) throw error;
    if (!members || members.length === 0) return;

    // Define the letter boundaries for each shard (1 to 4)
    let regexFilter;
    if (shardId === 1) regexFilter = /^[a-fA-F0-9]/; // A-F and numbers
    else if (shardId === 2) regexFilter = /^[g-lG-L]/; // G-L
    else if (shardId === 3) regexFilter = /^[m-rM-R]/; // M-R
    else if (shardId === 4) regexFilter = /^[s-zS-Z]/; // S-Z
    else regexFilter = /.*/; // Fallback to all if something weird happens

    // Filter members for this shard
    const shardMembers = members.filter(m => m && m.name && regexFilter.test(m.name.trim()));
    if (shardMembers.length === 0) return;

    // Prioriza os membros que nunca foram atualizados ou que foram atualizados há mais tempo
    const { data: states } = await supabase
      .from('current_character_state')
      .select('character_name, updated_at');

    const stateMap = new Map();
    if (states) {
      states.forEach(s => {
        if (!s || !s.character_name) return;
        const time = s.updated_at ? new Date(s.updated_at).getTime() : 0;
        stateMap.set(s.character_name.toLowerCase(), time);
      });
    }

    shardMembers.sort((a, b) => {
      const nameA = (a?.name || '').toLowerCase();
      const nameB = (b?.name || '').toLowerCase();
      const ta = stateMap.get(nameA) || 0;
      const tb = stateMap.get(nameB) || 0;
      return ta - tb;
    });

    const batch = shardMembers.slice(0, 15);
    console.log(`[SHARD ${shardId}] Processando lote prioritário de ${batch.length} (total no shard: ${shardMembers.length}).`);

    for (const member of batch) {
      try {
        console.log(`[SHARD ${shardId}] Inspecionando: ${member.name}`);
        const charData = await scrapeRubinotCharacterPage(member.name, { onlyExperience: true });
        
        if (charData) {
          const { data: existing } = await supabase.from('current_character_state')
            .select('xp_total, session_start_xp, session_start_time')
            .ilike('character_name', member.name)
            .maybeSingle();

          let xpValue = 0;
          if (charData.experience && charData.experience.totalExperience) {
              xpValue = parseInt(charData.experience.totalExperience.replace(/[,.]/g, ''), 10);
          }

          const resolvedName = charData.name || charData.character?.name || member.name;
          const resolvedLevel = charData.level || (charData.character?.level ? parseInt(charData.character.level, 10) : undefined);
          const resolvedVoc = charData.vocation || charData.character?.vocation;

          const updatePayload = {
            character_name: resolvedName,
            updated_at: new Date().toISOString()
          };

          if (resolvedLevel) updatePayload.level = resolvedLevel;
          if (resolvedVoc) updatePayload.vocation = resolvedVoc;
          if (charData.world || charData.character?.world) updatePayload.world = charData.world || charData.character?.world;
          if (charData.guild || charData.character?.guild) updatePayload.guild = charData.guild || charData.character?.guild;
          
          if (xpValue > 0) {
              updatePayload.xp_total = xpValue;
              if (existing) {
                if (xpValue > (existing.xp_total || 0)) {
                  updatePayload.last_active = new Date().toISOString();
                  updatePayload.session_start_xp = existing.session_start_xp || existing.xp_total;
                  updatePayload.session_start_time = existing.session_start_time || new Date().toISOString();
                }
              } else {
                updatePayload.session_start_xp = xpValue;
                updatePayload.session_start_time = new Date().toISOString();
              }
          }

          // Atualiza dados na current_character_state
          await supabase.from('current_character_state').upsert(updatePayload, { onConflict: 'character_name' });

          // Atualiza também level e vocação no guild_members se disponíveis
          if (resolvedLevel || resolvedVoc) {
            const gmPayload = {};
            if (resolvedLevel) gmPayload.level = resolvedLevel;
            if (resolvedVoc) gmPayload.vocation = resolvedVoc;
            await supabase.from('guild_members').update(gmPayload).ilike('name', member.name);
          }
        }
      } catch (err) {
        console.error(`[SHARD ${shardId}] Falha ao ler detalhes de ${member.name}: ${err.message}`);
      }
    }

    console.log(`[SHARD ${shardId}] Concluído com sucesso!`);
  } catch (error) {
    console.error(`[JOB] Erro fatal no Shard ${shardId}:`, error.message);
  }
};
