import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchTransfers = async () => {
    try {
        console.log('[JOB] Fetching Transfers (Todos os Mundos Rubinot)');
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

        // 1. Tenta buscar transfers de Todos os Mundos (Global) de uma só vez
        try {
            const globalArriving = await fetchRubinotApi(`/api/transfers?toWorld=all&page=1`);
            const globalLeaving = await fetchRubinotApi(`/api/transfers?fromWorld=all&page=1`);
            const combined = [
                ...(globalArriving?.transfers || []),
                ...(globalLeaving?.transfers || [])
            ];
            for (const t of combined) {
                const charName = t.player_name || t.playerName;
                if (!charName) continue;
                const tDate = parseDate(t.transferred_at || t.transferredAt);
                recordsToUpsert.push({
                    character_name: charName,
                    transfer_type: t.to_world || t.toWorld ? 'IN' : 'OUT',
                    transfer_date: tDate.toISOString(),
                    level: t.player_level || t.playerLevel || 0,
                    other_world: t.from_world || t.fromWorld || t.to_world || t.toWorld || 'Desconhecido'
                });
            }
        } catch (gErr) {
            console.warn('[JOB] Busca global de transfers falhou, iterando por mundos:', gErr.message);
        }

        // 2. Todos os 16 IDs de mundos do Rubinot (Auroria, Belaria, Bellum, Drakaria, Eldrian, Elysian, Infernum I/II/III, Lunarian, Malveria, Mystian, Obsidian, Solarian, Tenebrium, Vesperia)
        const ALL_RUBINOT_WORLD_IDS = ['11', '15', '30', '33', '31', '1', '35', '9', '34', '18', '32', '12', '21', '16'];
        for (const wId of ALL_RUBINOT_WORLD_IDS) {
            try {
                // Transfers Chegando (toWorld)
                const arriving = await fetchRubinotApi(`/api/transfers?toWorld=${wId}&page=1`);
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

                // Transfers Saindo (fromWorld)
                const leaving = await fetchRubinotApi(`/api/transfers?fromWorld=${wId}&page=1`);
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
            } catch (wErr) {
                console.warn(`[JOB] Erro ao buscar transfers do worldId ${wId}:`, wErr.message);
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

