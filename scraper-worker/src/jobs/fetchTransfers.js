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
                if (!t.player_name) continue;
                
                let tDate = new Date();
                if (t.transferred_at) {
                    tDate = new Date(Number(t.transferred_at) > 9999999999 ? Number(t.transferred_at) : Number(t.transferred_at) * 1000);
                }

                const record = {
                    character_name: t.player_name,
                    transfer_type: 'IN', // Chegou
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || 0,
                    other_world: t.from_world || 'Unknown'
                };

                const { error } = await supabase.from('server_transfers').insert(record);
                if (!error) count++;
            }
        }

        // Transfers Saindo de Auroria (fromWorld = 11)
        const leaving = await fetchRubinotApi('/api/transfers?fromWorld=11&page=1');
        if (leaving && leaving.transfers && Array.isArray(leaving.transfers)) {
            for (const t of leaving.transfers) {
                if (!t.player_name) continue;
                
                let tDate = new Date();
                if (t.transferred_at) {
                    tDate = new Date(Number(t.transferred_at) > 9999999999 ? Number(t.transferred_at) : Number(t.transferred_at) * 1000);
                }

                const record = {
                    character_name: t.player_name,
                    transfer_type: 'OUT', // Saiu
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || 0,
                    other_world: t.to_world || 'Unknown'
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

