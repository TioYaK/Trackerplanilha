import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchDeaths = async () => {
    try {
        console.log('[JOB] Fetching Deaths (Auroria)');
        
        const res = await fetchRubinotApi('/api/deaths?world=11');
        const deathsArray = res ? (res.deaths || res.data || res) : null;
        if (!deathsArray || !Array.isArray(deathsArray)) {
            console.log('[JOB] Deaths retornou vazio ou erro.');
            return;
        }

        // Buscar membros da guilda e hunteds para cruzar dados
        const { data: guildData } = await supabase.from('guild_members').select('name');
        const { data: huntedData } = await supabase.from('hunted_list').select('name');
        
        const guildNames = (guildData || []).map(m => m.name.toLowerCase());
        const huntedNames = (huntedData || []).map(h => h.name.toLowerCase());

        let count = 0;
        
        for (const death of deathsArray.slice(0, 50)) { // últimas 50
            const pName = death.victim || death.player_name || death.name || death.character_name;
            if (!pName) continue;
            
            const pNameLower = pName.toLowerCase();
            const isGuild = guildNames.includes(pNameLower);
            const isHunted = huntedNames.includes(pNameLower);
            
            let deathTime = new Date();
            if (death.death_time || death.time || death.timestamp) {
                const ts = Number(death.death_time || death.time || death.timestamp);
                deathTime = new Date(ts > 9999999999 ? ts : ts * 1000);
            } else if (death.date) {
                deathTime = new Date(death.date);
            }
            
            const record = {
                character_name: pName,
                level: death.player_level || death.level || 0,
                killed_by: death.killed_by || death.info || death.reason || 'Unknown',
                death_time: deathTime.toISOString(),
                is_guild_member: isGuild,
                is_hunted: isHunted
            };

            const { error } = await supabase.from('recent_deaths').insert(record);
            if (!error) {
                count++;
            }
        }
        
        console.log(`[JOB] Deaths finalizado. Salvos ${count} registros inéditos.`);
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchDeaths:', e);
    }
};
