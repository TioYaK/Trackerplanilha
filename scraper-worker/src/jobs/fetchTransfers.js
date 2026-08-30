import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchTransfers = async () => {
    try {
        console.log('[JOB] Fetching Transfers (Auroria)');
        
        let count = 0;

        // Transfers Chegando em Auroria (toWorld = 11)
        const arriving = await fetchRubinotApi('/api/transfers?toWorld=11&page=1');
        if (arriving && Array.isArray(arriving.data)) {
            for (const t of arriving.data) {
                if (!t.player_name) continue;
                
                let tDate = new Date();
                if (t.transferred_at) {
                    tDate = new Date(typeof t.transferred_at === 'number' ? (t.transferred_at > 9999999999 ? t.transferred_at : t.transferred_at * 1000) : t.transferred_at);
                }

                const record = {
                    character_name: t.player_name,
                    transfer_type: 'IN', // Chegou
                    transfer_date: tDate.toISOString()
                };

                const { error } = await supabase.from('server_transfers').insert(record);
                if (!error) count++;
            }
        }

        // Transfers Saindo de Auroria (fromWorld = 11)
        const leaving = await fetchRubinotApi('/api/transfers?fromWorld=11&page=1');
        if (leaving && Array.isArray(leaving.data)) {
            for (const t of leaving.data) {
                if (!t.player_name) continue;
                
                let tDate = new Date();
                if (t.transferred_at) {
                    tDate = new Date(typeof t.transferred_at === 'number' ? (t.transferred_at > 9999999999 ? t.transferred_at : t.transferred_at * 1000) : t.transferred_at);
                }

                const record = {
                    character_name: t.player_name,
                    transfer_type: 'OUT', // Saiu
                    transfer_date: tDate.toISOString()
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
