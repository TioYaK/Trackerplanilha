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
    const huntedNames = new Set((huntedList || []).filter(h => h && h.name).map(h => h.name.toLowerCase()));

    const alertsToInsert = [];

    for (const auc of auctions) {
      if (!auc || !auc.name) continue;

      const isHunted = auc.name ? huntedNames.has(auc.name.toLowerCase()) : false;
      const currentValue = Number(auc.currentValue || 0);
      const level = Number(auc.level || 0);
      const charms = Number(auc.charmPoints || 0);

      // Classificação Inteligente de Arbitragem / Pechincha
      const isSnipingOp = 
        (level >= 500 && (currentValue <= 2500 || currentValue === 0)) ||
        (level >= 800 && (currentValue <= 5000 || currentValue === 0)) ||
        (level >= 300 && (currentValue <= 600 || currentValue === 0)) ||
        (charms >= 500 && (currentValue <= 1200 || currentValue === 0));

      let endMs = Number(auc.auctionEnd || 0);
      if (endMs > 0 && endMs < 9999999999) endMs *= 1000;

      alertsToInsert.push({
        auction_id: auc.id,
        character_name: auc.name,
        world_name: auc.worldName,
        level: level,
        vocation: auc.vocationName || auc.vocation,
        current_bid: currentValue,
        auction_end: endMs > 0 ? new Date(endMs).toISOString() : new Date().toISOString(),
        is_hunted: isHunted,
        is_sniping_opportunity: isSnipingOp,
        skills_data: auc.skills || {},
        items_data: auc.highlightItems || [],
        mag_level: auc.magLevel || 0,
        charm_points: charms
      });
    }

    if (alertsToInsert.length > 0) {
      const { error } = await supabase
        .from('bazaar_alerts')
        .upsert(alertsToInsert, { onConflict: 'auction_id' });
        
      if (error) {
        console.error(`[JOB] Erro ao inserir alertas do Bazaar:`, error.message);
      } else {
        console.log(`[JOB] ${alertsToInsert.length} leilões do Bazaar processados e atualizados no banco!`);
      }
    } else {
      console.log(`[JOB] Nenhum Hunted ou oportunidade encontrados no Bazaar no momento.`);
    }
  } catch (error) {
    console.error("[JOB] Erro na task FETCH_BAZAAR:", error.message);
  }
};
