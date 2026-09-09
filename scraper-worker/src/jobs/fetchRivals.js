import { supabase } from '../db.js';
import { scrapeGuild } from '../lib/rubinotScraper.js';
import 'dotenv/config';

export const runFetchRivals = async () => {
  const rivalName = process.env.RIVAL_GUILD_NAME || 'E L I T E';
  if (rivalName === 'NONE') return;
  console.log('[JOB] Buscando dados da guilda RIVAL: ' + rivalName);

  try {
    const members = await scrapeGuild(rivalName, 200);
    if (!members || members.length === 0) return;

    // Busca os hunteds atuais para nao duplicar
    const { data: currentHunted } = await supabase.from('hunted_list').select('name');
    const huntedSet = new Set((currentHunted || []).filter(h => h && h.name).map(h => h.name.toLowerCase()));

    const now = new Date().toISOString();
    const toInsert = [];

    for (const m of members) {
      if (!m || !m.name) continue;
      const lowerName = m.name.toLowerCase();
      if (huntedSet.has(lowerName)) {
        continue;
      }

      toInsert.push({
        name: m.name,
        reason: 'Guilda Rival (' + rivalName + ')',
        added_by: 'Sistema (Bot)',
        is_online: m.status === 'Online',
        last_seen: m.status === 'Online' ? now : null
      });
      huntedSet.add(lowerName); // evita duplicatas dentro da própria lista retornada
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('hunted_list').insert(toInsert);
      if (error) {
        console.warn('[JOB] Erro ao inserir membros da guilda rival:', error.message);
      } else {
        console.log(`[JOB] Novos membros da guilda rival adicionados a Lista Negra: ${toInsert.length}`);
      }
    } else {
      console.log('[JOB] Nenhum novo membro da guilda rival para adicionar.');
    }
  } catch (error) {
    console.error('[JOB] Erro fetchRivals:', error.message);
  }
};
