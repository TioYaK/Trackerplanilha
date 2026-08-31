import { fetchRubinotApi } from '../lib/rubinotScraper.js';
import { supabase } from '../db.js';

export const runFetchBazaar = async () => {
  console.log(`[JOB] Iniciando rastreio no Char Bazaar...`);

  try {
    const res = await fetchRubinotApi('/api/bazaar?page=1&limit=100&sortBy=auction_end&sortOrder=asc');
    if (!res || (!res.auctions && !res.data)) {
      console.log(`[JOB] Erro ou resposta vazia do Bazaar.`);
      return;
    }

    const auctions = res.auctions || res.data;
    if (!auctions || auctions.length === 0) {
      console.log(`[JOB] Nenhum leilão ativo no momento.`);
      return;
    }

    console.log(`[JOB] Processando ${auctions.length} leilões...`);

    // Pega lista de hunteds
    const { data: huntedList } = await supabase.from('hunted_list').select('name');
    const huntedNames = new Set((huntedList || []).map(h => h.name.toLowerCase()));

    const alertsToInsert = [];

    for (const auc of auctions) {
      const isHunted = huntedNames.has(auc.name.toLowerCase());
      const isSnipingOp = auc.level >= 500 && auc.currentValue <= 2000;

      if (isHunted || isSnipingOp) {
        alertsToInsert.push({
          auction_id: auc.id,
          character_name: auc.name,
          world_name: auc.worldName,
          level: auc.level,
          vocation: auc.vocationName || auc.vocation,
          current_bid: auc.currentValue,
          auction_end: new Date(auc.auctionEnd * 1000).toISOString(),
          is_hunted: isHunted,
          is_sniping_opportunity: isSnipingOp
        });
      }
    }

    if (alertsToInsert.length > 0) {
      const { error } = await supabase
        .from('bazaar_alerts')
        .upsert(alertsToInsert, { onConflict: 'auction_id' });
        
      if (error) {
        console.error(`[JOB] Erro ao inserir alertas do Bazaar:`, error.message);
      } else {
        console.log(`[JOB] ${alertsToInsert.length} alertas do Bazaar (Hunteds/Oportunidades) detectados e atualizados!`);
      }
    } else {
      console.log(`[JOB] Nenhum Hunted ou oportunidade encontrados no Bazaar no momento.`);
    }
  } catch (error) {
    console.error("[JOB] Erro na task FETCH_BAZAAR:", error.message);
  }
};
