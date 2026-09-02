import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchGuild = async () => {
  const guildName = process.env.GUILD_NAME || 'shellpatrocina';
  console.log(`[JOB] Buscando dados da guilda: ${guildName}`);

  try {
    const res = await fetchRubinotApi(`/api/guilds/${guildName}`);
    
    if (!res || !res.guild || !res.guild.members || res.guild.members.length === 0) {
      console.log(`[JOB] Nenhum membro encontrado ou guilda vazia.`);
      return;
    }
    
    const members = res.guild.members;

    // Remove duplicatas pelo nome
    const uniqueMembersMap = new Map();
    members.forEach(m => {
      uniqueMembersMap.set(m.name, {
        name: m.name,
        vocation: m.vocation,
        level: m.level,
        rank: m.rank || null,          // FIX: campo rank agora é incluído no upsert
        is_online: m.isOnline || false,
      });
    });

    const upsertData = Array.from(uniqueMembersMap.values());

    // Upsert em chunks para não exceder o payload limit
    const chunkSize = 500;
    let insertedCount = 0;
    for (let i = 0; i < upsertData.length; i += chunkSize) {
      const chunk = upsertData.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('guild_members')
        .upsert(chunk, { onConflict: 'name' });
      if (error) {
        console.error(`[JOB] Erro ao inserir chunk da guilda:`, error.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`[JOB] ✅ ${insertedCount} membros processados (rank incluído).`);

    // --- PURGE: Remove membros que saíram da guilda ---
    try {
      const activeNames = Array.from(uniqueMembersMap.keys());
      let allDbNames = [];
      let page = 0;
      while (true) {
        const { data: dbMembers } = await supabase
          .from('guild_members')
          .select('name')
          .range(page * 1000, (page + 1) * 1000 - 1);
        if (!dbMembers || dbMembers.length === 0) break;
        allDbNames.push(...dbMembers.map(m => m.name));
        page++;
      }

      const activeNamesSet = new Set(activeNames);
      const leftGuildNames = allDbNames.filter(name => !activeNamesSet.has(name));

      if (leftGuildNames.length > 0) {
        console.log(`[JOB] 🧹 Limpando ${leftGuildNames.length} membros que saíram da guilda...`);
        for (let i = 0; i < leftGuildNames.length; i += 100) {
          const chunk = leftGuildNames.slice(i, i + 100);
          await supabase.from('guild_members').delete().in('name', chunk);
        }
        console.log('[JOB] ✔ Limpeza concluída.');
      }
    } catch (purgeError) {
      console.error('[JOB] Erro ao limpar membros inativos:', purgeError);
    }

  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_GUILD:`, error.message);
  }
};
