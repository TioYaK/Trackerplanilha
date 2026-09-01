import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchTransfers = async () => {
    try {
        console.log('[JOB] Fetching Transfers (Auroria)');
        
        let count = 0;

        // Transfers Chegando em Auroria (toWorld = 11)
        const arriving = await fetchRubinotApi('/api/transfers?toWorld=11&page=1');
        if (arriving && arriving.transfers && Array.isArray(arriving.transfers)) {
            for (const t of arriving.transfers) {
                if (!t.player_name && !t.playerName) continue;
                const charName = t.player_name || t.playerName;
                
                let tDate = new Date();
                if (t.transferred_at || t.transferredAt) {
                    const rawDate = t.transferred_at || t.transferredAt;
                    tDate = new Date(Number(rawDate) > 9999999999 ? Number(rawDate) : Number(rawDate) * 1000);
                }

                const record = {
                    character_name: charName,
                    transfer_type: 'IN', // Chegou
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || t.playerLevel || 0,
                    other_world: t.from_world || t.fromWorld || 'Desconhecido'
                };

                const { error } = await supabase.from('server_transfers').insert(record);
                if (!error) count++;
            }
        }

        // Transfers Saindo de Auroria (fromWorld = 11)
        const leaving = await fetchRubinotApi('/api/transfers?fromWorld=11&page=1');
        if (leaving && leaving.transfers && Array.isArray(leaving.transfers)) {
            for (const t of leaving.transfers) {
                if (!t.player_name && !t.playerName) continue;
                const charName = t.player_name || t.playerName;
                
                let tDate = new Date();
                if (t.transferred_at || t.transferredAt) {
                    const rawDate = t.transferred_at || t.transferredAt;
                    tDate = new Date(Number(rawDate) > 9999999999 ? Number(rawDate) : Number(rawDate) * 1000);
                }

                const record = {
                    character_name: charName,
                    transfer_type: 'OUT', // Saiu
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || t.playerLevel || 0,
                    other_world: t.to_world || t.toWorld || 'Desconhecido'
                };

                const { error } = await supabase.from('server_transfers').insert(record);
                if (!error) count++;
            }
        }
        
        console.log(`[JOB] Transfers finalizado. Salvos ${count} registros inéditos.`);
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchTransfers:', e);
    }
};

