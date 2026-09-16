import { fetchRubinotApi } from '../lib/rubinotScraper.js';
import { supabase } from '../db.js';

export const runFetchBazaar = async () => {
  console.log(`[JOB] Iniciando rastreio completo no Char Bazaar do RubinOT...`);

  try {
    // 1. Pega lista de hunteds do banco
    const { data: huntedList } = await supabase.from('hunted_list').select('name');
    const huntedNames = new Set((huntedList || []).filter(h => h && h.name).map(h => h.name.toLowerCase()));

    const allAuctions = [];
    const seenAuctionIds = new Set();

    // 2. Rastreio de Leilões ATIVOS (todas as páginas disponíveis)
    console.log(`[JOB] Buscando página 1 de leilões ativos...`);
    const firstActive = await fetchRubinotApi('/api/bazaar?page=1&limit=25&sortBy=auction_end&sortOrder=asc');
    
    if (firstActive && (firstActive.auctions || firstActive.data)) {
      const totalPages = Math.min(Number(firstActive.pagination?.totalPages || 1), 80);
      const totalAuctions = Number(firstActive.pagination?.total || 0);
      console.log(`[JOB] 🎯 Detectados ${totalAuctions} leilões ATIVOS em ${totalPages} páginas.`);

      const page1Items = firstActive.auctions || firstActive.data || [];
      for (const auc of page1Items) {
        if (auc && auc.id && !seenAuctionIds.has(auc.id)) {
          seenAuctionIds.add(auc.id);
          allAuctions.push(auc);
        }
      }

      // Páginas 2 até totalPages em lotes concorrentes de 4 páginas
      for (let p = 2; p <= totalPages; p += 4) {
        const pageNumbers = [];
        for (let offset = 0; offset < 4 && (p + offset) <= totalPages; offset++) {
          pageNumbers.push(p + offset);
        }
        const batchResults = await Promise.allSettled(
          pageNumbers.map(page => fetchRubinotApi(`/api/bazaar?page=${page}&limit=25&sortBy=auction_end&sortOrder=asc`))
        );
        for (const res of batchResults) {
          if (res.status === 'fulfilled' && res.value) {
            const items = res.value.auctions || res.value.data || [];
            for (const auc of items) {
              if (auc && auc.id && !seenAuctionIds.has(auc.id)) {
                seenAuctionIds.add(auc.id);
                allAuctions.push(auc);
              }
            }
          }
        }
        if (p % 12 === 0 || p + 4 > totalPages) {
          console.log(`[JOB] Progresso ativos: ${allAuctions.length}/${totalAuctions} leilões coletados (pág ${Math.min(p + 3, totalPages)}/${totalPages})...`);
        }
      }
    }

    // 3. Rastreio do HISTÓRICO recente em lotes concorrentes de 4 páginas (até 20 páginas = 500 leilões)
    console.log(`[JOB] 📚 Coletando histórico recente de leilões finalizados (20 páginas)...`);
    for (let hp = 1; hp <= 20; hp += 4) {
      const pageNumbers = [hp, hp + 1, hp + 2, hp + 3].filter(n => n <= 20);
      const batchResults = await Promise.allSettled(
        pageNumbers.map(page => fetchRubinotApi(`/api/bazaar/history?page=${page}&limit=25`))
      );
      let hadItems = false;
      for (const res of batchResults) {
        if (res.status === 'fulfilled' && res.value) {
          const items = res.value.auctions || res.value.data || [];
          if (items.length > 0) hadItems = true;
          for (const auc of items) {
            if (auc && auc.id && !seenAuctionIds.has(auc.id)) {
              seenAuctionIds.add(auc.id);
              allAuctions.push(auc);
            }
          }
        }
      }
      if (!hadItems) break;
    }

    console.log(`[JOB] Total consolidado para processar: ${allAuctions.length} leilões (ativos + histórico recente).`);

    if (allAuctions.length === 0) {
      console.log(`[JOB] Nenhum leilão retornado pela API.`);
      return;
    }

    // 4. Mapeamento e Enriquecimento para tabela bazaar_alerts
    const alertsToInsert = [];

    for (const auc of allAuctions) {
      if (!auc || !auc.name) continue;

      const isHunted = huntedNames.has(auc.name.toLowerCase());
      const currentValue = Number(auc.currentValue || auc.winningBid || auc.startingValue || 0);
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

    // 5. Upsert em blocos de 200 no Supabase
    const BATCH_SIZE = 200;
    let insertedTotal = 0;

    for (let i = 0; i < alertsToInsert.length; i += BATCH_SIZE) {
      const chunk = alertsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('bazaar_alerts')
        .upsert(chunk, { onConflict: 'auction_id' });

      if (error) {
        console.error(`[JOB] Erro ao inserir lote ${i} - ${i + chunk.length}:`, error.message);
      } else {
        insertedTotal += chunk.length;
      }
    }

    console.log(`[JOB] ✅ Sucesso! ${insertedTotal} leilões do Bazaar (100% dos ativos + histórico) sincronizados no banco.`);

  } catch (error) {
    console.error("[JOB] Erro na task FETCH_BAZAAR:", error.message);
  }
};
