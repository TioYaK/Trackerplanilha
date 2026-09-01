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
    const shardMembers = members.filter(m => regexFilter.test(m.name.trim()));
    console.log(`[SHARD ${shardId}] Processando ${shardMembers.length} jogadores.`);

    for (const member of shardMembers) {
      try {
        console.log(`[SHARD ${shardId}] Inspecionando detalhadamente: ${member.name}`);
        const charData = await scrapeRubinotCharacterPage(member.name);
        
        if (charData) {
          const { data: existing } = await supabase.from('current_character_state')
            .select('xp_total, session_start_xp, session_start_time')
            .eq('character_name', member.name)
            .maybeSingle();

          let xpValue = 0;
          if (charData.experience && charData.experience.totalExperience) {
              xpValue = parseInt(charData.experience.totalExperience.replace(/[,.]/g, ''), 10);
          }

          const updatePayload = {
            character_name: charData.name || member.name,
            level: charData.level,
            vocation: charData.vocation,
            world: charData.world,
            guild: charData.guild,
          };
          
          if (xpValue > 0) {
              updatePayload.xp_total = xpValue;
              // Só atualiza last_active se a XP SUBIU!
              if (existing && xpValue > existing.xp_total) {
                  updatePayload.last_active = new Date().toISOString();
                  updatePayload.session_start_xp = existing.session_start_xp || existing.xp_total;
                  updatePayload.session_start_time = existing.session_start_time || new Date().toISOString();
              }
          }

          // Atualiza dados na current_character_state
          await supabase.from('current_character_state').upsert(updatePayload, { onConflict: 'character_name' });
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
