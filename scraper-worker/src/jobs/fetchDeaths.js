import { supabase } from '../db.js';
import { apiClient } from '../apiClient.js';
import { fetchRubinotApi, scrapeDeaths, parseRubinotDate } from '../lib/rubinotScraper.js';

// Cache em memória de guild e hunteds com TTL de 3 minutos para evitar centenas de queries repetidas
let cachedGuildSet = new Set();
let cachedHuntedSet = new Set();
let lastGuildHuntedFetch = 0;
const GUILD_HUNTED_CACHE_TTL = 3 * 60 * 1000;

const getGuildAndHuntedSets = async () => {
    const now = Date.now();
    if (now - lastGuildHuntedFetch < GUILD_HUNTED_CACHE_TTL && (cachedGuildSet.size > 0 || cachedHuntedSet.size > 0)) {
        return { guildSet: cachedGuildSet, huntedSet: cachedHuntedSet };
    }
    try {
        if (supabase) {
            const [{ data: guildData }, { data: huntedData }] = await Promise.all([
                supabase.from('guild_members').select('name'),
                supabase.from('hunted_list').select('name')
            ]);
            if (guildData) cachedGuildSet = new Set(guildData.filter(m => m && m.name).map(m => m.name.toLowerCase()));
            if (huntedData) cachedHuntedSet = new Set(huntedData.filter(h => h && h.name).map(h => h.name.toLowerCase()));
            lastGuildHuntedFetch = now;
        }
    } catch (e) {}
    return { guildSet: cachedGuildSet, huntedSet: cachedHuntedSet };
};

export const runFetchDeaths = async () => {
    try {
        console.log('[JOB] Fetching Deaths (Todos os Mundos Rubinot)');
        
        let deathsArray = null;
        try {
            deathsArray = await scrapeDeaths(null);
        } catch (e) {
            console.warn('[JOB] scrapeDeaths falhou, tentando API:', e.message);
        }

        if (!deathsArray || deathsArray.length === 0) {
            const res = await fetchRubinotApi('/api/deaths');
            deathsArray = res ? (res.deaths || res.data || res) : null;
        }

        if (!deathsArray || !Array.isArray(deathsArray)) {
            console.log('[JOB] Deaths retornou vazio ou erro.');
            return;
        }

        // Buscar membros da guilda e hunteds do cache local
        const { guildSet, huntedSet } = await getGuildAndHuntedSets();


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
            // 1. Tenta envio prioritário via ApiClient seguro (Gateway Vercel)
            const apiRes = await apiClient.reportDeaths(uniqueRecords);
            if (apiRes?.ok) {
                console.log(`[JOB] Deaths finalizado via ApiClient. Lote de ${uniqueRecords.length} mortes verificado/processado com sucesso.`);
            } else if (supabase) {
                // 2. Fallback direto se supabase estiver disponível
                const { error } = await supabase
                    .from('recent_deaths')
                    .upsert(uniqueRecords, { onConflict: 'character_name,death_time', ignoreDuplicates: true });
                if (error) {
                    console.warn('[JOB] Erro ao salvar lote de mortes (fallback):', error.message);
                } else {
                    console.log(`[JOB] Deaths finalizado via fallback direto.`);
                }
            }
        }
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchDeaths:', e);
    }
};
