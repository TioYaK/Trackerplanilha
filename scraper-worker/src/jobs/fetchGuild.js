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

    const { error } = await supabase.from('guild_members').upsert(upsertData, { onConflict: 'name' });
    if (error) throw error;

    console.log(`[JOB] Sucesso! ${members.length} membros processados e atualizados.`);
  } catch (error) {
    console.error(`[JOB] Erro na task FETCH_GUILD:`, error.message);
  } finally {
    // Para liberar memória se rodar avulso, não obrigatório
    // await closeBrowser(); 
  }
};
