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

    // Adiciona membros de parties_planilhadas e hunted_list para garantir que NUNCA sejam purgados
    const { data: activeParties } = await supabase.from('parties_planilhadas').select('members, leader_name');
    if (activeParties) {
      activeParties.forEach(p => {
        if (p.leader_name && !uniqueMembersMap.has(p.leader_name)) {
          uniqueMembersMap.set(p.leader_name, {
            name: p.leader_name,
            vocation: null,
            level: null,
            rank: 'Leader',
            is_online: false
          });
        }
        if (Array.isArray(p.members)) {
          p.members.forEach(m => {
            if (m && !uniqueMembersMap.has(m)) {
              uniqueMembersMap.set(m, {
                name: m,
                vocation: null,
                level: null,
                rank: 'Member',
                is_online: false
              });
            }
          });
        }
      });
    }

    const { data: huntedList } = await supabase.from('hunted_list').select('name');
    if (huntedList) {
      huntedList.forEach(h => {
        if (h.name && !uniqueMembersMap.has(h.name)) {
          uniqueMembersMap.set(h.name, {
            name: h.name,
            vocation: null,
            level: null,
            rank: 'Hunted',
            is_online: false
          });
        }
      });
    }

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

    console.log(`[JOB] ✅ ${insertedCount} membros processados (incluindo PTs e Hunteds).`);

    // --- PURGE: Remove apenas membros que realmente saíram da guilda ---
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

      const activeNamesSet = new Set(activeNames.map(n => n.toLowerCase()));
      const leftGuildNames = allDbNames.filter(name => !activeNamesSet.has(name.toLowerCase()));

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
