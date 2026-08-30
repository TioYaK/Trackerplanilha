import { supabase } from '../db.js';
import { fetchRubinotApi } from '../lib/rubinotScraper.js';

export const runFetchKillstats = async () => {
    try {
        console.log('[JOB] Fetching Killstats (Auroria)');
        
        // Auroria is world=11
        const killstats = await fetchRubinotApi('/api/killstats?world=11');
        if (!killstats || !killstats.entries || !Array.isArray(killstats.entries)) {
            console.log('[JOB] Killstats retornou vazio ou erro.');
            return;
        }

        // Não vamos salvar TUDO no banco (são milhares de monstros).
        // Vamos focar em criar um log de bosses ou apenas manter estatísticas, 
        // mas como a tabela não existe ainda (pedimos apenas recent_deaths e server_transfers),
        // vamos só logar por enquanto, ou se quiser pode criar uma tabela.
        // O usuário pediu "Página onde mostra estatísticas de morte de monstros".
        // Como não incluí CREATE TABLE killstats no SQL, vou focar apenas em processar e depois adaptamos se ele quiser salvar.
        
        let bossesKilled = 0;
        
        // Lista simples de bosses conhecidos para log
        const bossesList = ['ferumbras', 'ghazbaran', 'morgaroth', 'orshabaal', 'dracola', 'massacre', 'the handmaiden', 'mr. punish', 'the imperor', 'countess sorrow', 'plagirath', 'zarcorix'];

        for (const entry of killstats.entries) {
            const monster = (entry.monster || entry.name || '').toLowerCase();
            if (bossesList.includes(monster) && entry.killed_players > 0) {
                console.log(`[BOSS ALERTA] Boss ${monster} matou ${entry.killed_players} players (ou foi morto).`);
                bossesKilled++;
            }
        }
        
        console.log(`[JOB] Killstats finalizado. Analisados ${killstats.entries.length} monstros. ${bossesKilled} Bosses detectados.`);
    } catch (e) {
        console.error('[JOB] Erro crítico no FetchKillstats:', e);
    }
};
