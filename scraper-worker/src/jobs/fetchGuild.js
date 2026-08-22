import { supabase } from '../db.js';
import { scrapeGuild, closeBrowser } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchGuild = async () => {
  const guildName = process.env.GUILD_NAME || 'shellpatrocina';
  console.log(`[JOB] Fetching guild data for: ${guildName}`);

  try {
    // Passar maxPages = 200 para garantir que pega guildas de até 5000 membros
    const members = await scrapeGuild(guildName, 200);

    if (!members || members.length === 0) {
      console.log(`[JOB] Nenhum membro encontrado na guilda (Cloudflare bloqueou ou guilda vazia).`);
      return;
    }

    // Salvar no BD - Remove duplicatas para evitar erro "ON CONFLICT DO UPDATE cannot affect row a second time"
    const uniqueMembersMap = new Map();
    members.forEach(m => {
      uniqueMembersMap.set(m.name, {
        name: m.name,
        vocation: m.vocation,
        level: m.level,
        is_online: m.status === 'Online'
      });
    });
    
    const upsertData = Array.from(uniqueMembersMap.values());

    // Chunking the upsert to prevent payload limits
    const chunkSize = 500;
    let insertedCount = 0;
    for (let i = 0; i < upsertData.length; i += chunkSize) {
      const chunk = upsertData.slice(i, i + chunkSize);
      const { error } = await supabase.from('guild_members').upsert(chunk, { onConflict: 'name' });
      if (error) {
        console.error(`[JOB] Erro ao inserir chunk da guilda:`, error.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`[JOB] Sucesso! ${insertedCount} membros processados e atualizados.`);

    // --- PURGE MEMBERS WHO LEFT THE GUILD ---
    try {
      const activeNames = Array.from(uniqueMembersMap.keys());
      let allDbNames = [];
      let page = 0;
      while (true) {
        const { data: dbMembers } = await supabase.from('guild_members').select('name').range(page * 1000, (page + 1) * 1000 - 1);
        if (!dbMembers || dbMembers.length === 0) break;
        allDbNames.push(...dbMembers.map(m => m.name));
        page++;
      }
      
      const activeNamesSet = new Set(activeNames);
      const leftGuildNames = allDbNames.filter(name => !activeNamesSet.has(name));
      
      if (leftGuildNames.length > 0) {
        console.log(`[JOB] Limpando ${leftGuildNames.length} membros que sairam da guilda...`);
        // Delete in chunks of 100
        for (let i = 0; i < leftGuildNames.length; i += 100) {
          const chunk = leftGuildNames.slice(i, i + 100);
          await supabase.from('guild_members').delete().in('name', chunk);
        }
        console.log('[JOB] Limpeza concluida com sucesso!');
      }
    } catch (purgeError) {
      console.error('[JOB] Erro ao limpar membros inativos:', purgeError);
    }

  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_GUILD:`, error.message);
  } finally {
    // Para liberar memória se rodar avulso, não obrigatório
    // await closeBrowser(); 
  }
};
