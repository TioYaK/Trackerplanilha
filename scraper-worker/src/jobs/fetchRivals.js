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
    const { data: currentHunted } = await supabase.from('hunted_list').select('id, name');
    const huntedMap = new Map();
    if (currentHunted) {
        currentHunted.forEach(h => huntedMap.set(h.name.toLowerCase(), h));
    }

    let addedCount = 0;
    const now = new Date().toISOString();

    for (const m of members) {
        const lowerName = m.name.toLowerCase();
        if (huntedMap.has(lowerName)) {
           continue;
        }

        const { error } = await supabase.from('hunted_list').insert({
            name: m.name,
            reason: 'Guilda Rival (' + rivalName + ')',
            added_by: 'Sistema (Bot)',
            is_online: m.status === 'Online',
            last_seen: m.status === 'Online' ? now : null
        });

        if (!error) addedCount++;
    }

    console.log('[JOB] Novos membros da guilda rival adicionados a Lista Negra: ' + addedCount);
  } catch (error) {
    console.error('[JOB] Erro fetchRivals:', error.message);
  }
};
