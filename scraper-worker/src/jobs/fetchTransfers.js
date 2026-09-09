import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchTransfers = async () => {
    try {
        console.log('[JOB] Fetching Transfers (Auroria)');
        const recordsToUpsert = [];

        const parseDate = (raw) => {
            if (!raw) return new Date();
            const num = Number(raw);
            if (!isNaN(num) && num > 0) {
                return new Date(num > 9999999999 ? num : num * 1000);
            }
            const parsed = new Date(raw);
            return !isNaN(parsed.getTime()) ? parsed : new Date();
        };

        // Transfers Chegando em Auroria (toWorld = 11)
        const arriving = await fetchRubinotApi('/api/transfers?toWorld=11&page=1');
        if (arriving && arriving.transfers && Array.isArray(arriving.transfers)) {
            for (const t of arriving.transfers) {
                const charName = t.player_name || t.playerName;
                if (!charName) continue;
                
                const tDate = parseDate(t.transferred_at || t.transferredAt);
                recordsToUpsert.push({
                    character_name: charName,
                    transfer_type: 'IN', // Chegou
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || t.playerLevel || 0,
                    other_world: t.from_world || t.fromWorld || 'Desconhecido'
                });
            }
        }

        // Transfers Saindo de Auroria (fromWorld = 11)
        const leaving = await fetchRubinotApi('/api/transfers?fromWorld=11&page=1');
        if (leaving && leaving.transfers && Array.isArray(leaving.transfers)) {
            for (const t of leaving.transfers) {
                const charName = t.player_name || t.playerName;
                if (!charName) continue;
                
                const tDate = parseDate(t.transferred_at || t.transferredAt);
                recordsToUpsert.push({
                    character_name: charName,
                    transfer_type: 'OUT', // Saiu
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || t.playerLevel || 0,
                    other_world: t.to_world || t.toWorld || 'Desconhecido'
                });
            }
        }

        if (recordsToUpsert.length > 0) {
            const { error } = await supabase
                .from('server_transfers')
                .upsert(recordsToUpsert, {
                    onConflict: 'character_name,transfer_type,transfer_date',
                    ignoreDuplicates: true
                });

            if (error) {
                console.warn('[JOB] Erro ao salvar lote de transfers:', error.message);
            } else {
                console.log(`[JOB] Transfers finalizado. Lote de ${recordsToUpsert.length} registros processado.`);
            }
        } else {
            console.log(`[JOB] Nenhum registro de transfer encontrado nesta execução.`);
        }
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchTransfers:', e);
    }
};

