import { supabase } from '../db.js';
import { fetchRubinotApi, scrapeDeaths } from '../lib/rubinotScraper.js';

export const runFetchDeaths = async () => {
    try {
        console.log('[JOB] Fetching Deaths (Auroria)');
        
        let deathsArray = null;
        try {
            deathsArray = await scrapeDeaths('Auroria');
        } catch (e) {
            console.warn('[JOB] scrapeDeaths falhou, tentando API:', e.message);
        }

        if (!deathsArray || deathsArray.length === 0) {
            const res = await fetchRubinotApi('/api/deaths?world=11');
            deathsArray = res ? (res.deaths || res.data || res) : null;
        }

        if (!deathsArray || !Array.isArray(deathsArray)) {
            console.log('[JOB] Deaths retornou vazio ou erro.');
            return;
        }

        // Buscar membros da guilda e hunteds para cruzar dados
        const { data: guildData } = await supabase.from('guild_members').select('name');
        const { data: huntedData } = await supabase.from('hunted_list').select('name');
        
        const guildNames = (guildData || []).filter(m => m && m.name).map(m => m.name.toLowerCase());
        const huntedNames = (huntedData || []).filter(h => h && h.name).map(h => h.name.toLowerCase());

        let count = 0;
        
        for (const death of deathsArray.slice(0, 50)) { // últimas 50
            const pName = death.name || death.victim || death.player_name || death.character_name;
            if (!pName) continue;
            
            const pNameLower = pName.toLowerCase();
            const isGuild = guildNames.includes(pNameLower);
            const isHunted = huntedNames.includes(pNameLower);
            
            let deathTime = new Date();
            if (death.death_time || death.time || death.timestamp) {
                const ts = Number(death.death_time || death.time || death.timestamp);
                if (!isNaN(ts) && ts > 0) {
                    deathTime = new Date(ts > 9999999999 ? ts : ts * 1000);
                }
            } else if (death.date) {
                const d = new Date(death.date);
                if (!isNaN(d.getTime())) deathTime = d;
            } else if (death.timeStr && death.timeStr.includes(':')) {
                const [h, m] = death.timeStr.split(':').map(Number);
                if (!isNaN(h) && !isNaN(m)) {
                    const now = new Date();
                    // BRT é UTC-3 -> adiciona 3h para UTC
                    deathTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h + 3, m, 0));
                    if (deathTime.getTime() > now.getTime() + 10 * 60 * 1000) {
                        deathTime = new Date(deathTime.getTime() - 24 * 60 * 60 * 1000);
                    }
                }
            }
            
            const record = {
                character_name: pName,
                level: death.level || death.player_level || 0,
                killed_by: death.killedBy || death.killed_by || death.info || death.reason || 'Unknown',
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
