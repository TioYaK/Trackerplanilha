import { supabase } from '../db.js';
import { fetchRubinotApi, scrapeDeaths, parseRubinotDate } from '../lib/rubinotScraper.js';

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
        
        const guildSet = new Set((guildData || []).filter(m => m && m.name).map(m => m.name.toLowerCase()));
        const huntedSet = new Set((huntedData || []).filter(h => h && h.name).map(h => h.name.toLowerCase()));

        const records = [];
        for (const death of deathsArray.slice(0, 50)) { // últimas 50
            const pName = death.name || death.victim || death.player_name || death.character_name;
            if (!pName) continue;
            
            const pNameLower = pName.toLowerCase();
            const isGuild = guildSet.has(pNameLower);
            const isHunted = huntedSet.has(pNameLower);
            
            let deathTime = null;
            if (death.death_time) {
                const d = new Date(death.death_time);
                if (!isNaN(d.getTime())) deathTime = d;
            } else if (death.timeStr) {
                deathTime = parseRubinotDate(death.timeStr);
            } else if (death.time || death.timestamp) {
                const ts = Number(death.time || death.timestamp);
                if (!isNaN(ts) && ts > 0) {
                    deathTime = new Date(ts > 9999999999 ? ts : ts * 1000);
                }
            } else if (death.date) {
                const d = new Date(death.date);
                if (!isNaN(d.getTime())) deathTime = d;
            }

            // SEGURANÇA MÁXIMA CONTRA DUPLICAÇÃO:
            // NUNCA gere new Date() para mortes sem timestamp exato.
            // Se a data não puder ser obtida com precisão, descarte para não inundar o banco com timestamps aleatórios.
            if (!deathTime || isNaN(deathTime.getTime())) {
                console.warn(`[JOB] Ignorando morte de ${pName} devido a data indeterminada ou inválida:`, death.timeStr);
                continue;
            }
            
            records.push({
                character_name: pName,
                level: death.level || death.player_level || 0,
                killed_by: death.killedBy || death.killed_by || death.info || death.reason || 'Unknown',
                death_time: deathTime.toISOString(),
                is_guild_member: isGuild,
                is_hunted: isHunted
            });
        }
        
        // Desduplicação defensiva dentro do próprio lote a ser enviado
        const uniqueRecordsMap = new Map();
        for (const rec of records) {
            const key = `${rec.character_name.toLowerCase()}_${rec.death_time}`;
            if (!uniqueRecordsMap.has(key)) {
                uniqueRecordsMap.set(key, rec);
            }
        }
        const uniqueRecords = Array.from(uniqueRecordsMap.values());

        if (uniqueRecords.length > 0) {
            const { error } = await supabase
                .from('recent_deaths')
                .upsert(uniqueRecords, { onConflict: 'character_name,death_time', ignoreDuplicates: true });
            if (error) {
                console.warn('[JOB] Erro ao salvar lote de mortes:', error.message);
            } else {
                console.log(`[JOB] Deaths finalizado. Lote de ${uniqueRecords.length} mortes verificado/processado com sucesso.`);
            }
        }
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchDeaths:', e);
    }
};
