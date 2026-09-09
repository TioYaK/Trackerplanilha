import { scrapeOnlines } from '../lib/rubinotScraper.js';
import { supabase } from '../db.js';

export const runFetchOnlines = async () => {
  console.log(`[JOB] Fetching online players...`);

  try {
    const onlinePlayers = await scrapeOnlines('Auroria');
    
    if (onlinePlayers.length === 0) {
      console.log('[JOB] Nenhum jogador online ou erro ao buscar.');
      return;
    }

    console.log(`[JOB] Iniciando processamento de ${onlinePlayers.length} jogadores online.`);

    // Registra o historico para o Heatmap de atividade
    await supabase.from('online_history').insert({
      online_count: onlinePlayers.length
    });

    // ─── DETECÇÃO DE MAKERS (LOGIN / LOGOUT) ───
    const fs = await import('fs');
    const path = await import('path');
    const CACHE_FILE = path.join(process.cwd(), 'cache_onlines.json');
    let previousOnlines = [];
    if (fs.existsSync(CACHE_FILE)) {
      try { previousOnlines = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch(e){}
    }
    
    const prevSet = new Set(previousOnlines.filter(p => p && typeof p === 'string').map(p => p.toLowerCase()));
    const currSet = new Set(onlinePlayers.filter(p => p && typeof p === 'string').map(p => p.toLowerCase()));
    
    const loggedIn = onlinePlayers.filter(p => p && typeof p === 'string' && !prevSet.has(p.toLowerCase()));
    const loggedOut = previousOnlines.filter(p => p && typeof p === 'string' && !currSet.has(p.toLowerCase()));
    
    fs.writeFileSync(CACHE_FILE, JSON.stringify(onlinePlayers));

    // Salvar no banco (dividindo em chunks para nǜo estourar payload)
    const eventsToInsert = [];
    loggedIn.forEach(name => eventsToInsert.push({ character_name: name, event_type: 'LOGIN' }));
    loggedOut.forEach(name => eventsToInsert.push({ character_name: name, event_type: 'LOGOUT' }));

    if (eventsToInsert.length > 0) {
      for (let i = 0; i < eventsToInsert.length; i += 500) {
        await supabase.from('login_events').insert(eventsToInsert.slice(i, i + 500));
      }
      console.log(`[JOB] Rastreador de Makers: ${loggedIn.length} Logins, ${loggedOut.length} Logouts registrados.`);
    }

    // Atualiza status online dos Hunteds & Radar Tático
    const { data: huntedList } = await supabase.from('hunted_list').select('id, name, reason, is_online');
    const onlineSet = new Set(onlinePlayers.map(p => p.toLowerCase()));

    if (huntedList && huntedList.length > 0) {
      // Detecta novos logins de alvos (estavam offline e acabaram de logar)
      const newlyOnlineHunteds = huntedList.filter(h => h.name && onlineSet.has(h.name.toLowerCase()) && !h.is_online);

      if (newlyOnlineHunteds.length > 0) {
        const huntedNames = newlyOnlineHunteds.map(h => h.name).join(', ');
        console.log(`\n[TACTICAL RADAR] 🚨 ALERTA: ${newlyOnlineHunteds.length} Alvo(s) Hunted/Rival detectados ONLINE: ${huntedNames}`);

        // Disparo para Webhook do Discord (se configurado)
        try {
          const { data: webhookConfig } = await supabase.from('webhook_settings').select('discord_url').eq('id', 1).maybeSingle();
          if (webhookConfig && webhookConfig.discord_url) {
            const axios = (await import('axios')).default;
            const targetDetails = newlyOnlineHunteds.map(h => `• **${h.name}** \`[${h.reason || 'Hunted'}]\``).join('\n');
            await axios.post(webhookConfig.discord_url, {
              username: 'Radar Tático (BattleStorm)',
              avatar_url: 'https://rubinot.com.br/favicon.ico',
              embeds: [{
                title: '🚨 [RADAR TÁTICO] ALVO INIMIGO DETECTADO ONLINE!',
                description: `O radar de satélite detectou a conexão imediata de alvos na lista negra:\n\n${targetDetails}\n\n*Preparem as traps e posicionem os scouts!*`,
                color: 15158332, // Vermelho de Alerta
                fields: [
                  { name: 'Mundo', value: 'Auroria', inline: true },
                  { name: 'Total Online', value: `${onlinePlayers.length} players`, inline: true },
                  { name: 'Horário', value: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' }), inline: true }
                ],
                footer: { text: 'Auroria Telemetry Radar • Sistema de Defesa Automatizado' },
                timestamp: new Date().toISOString()
              }]
            }).catch(e => console.warn('[JOB] Erro ao enviar webhook do radar tático:', e.message));
          }
        } catch (e) {
          console.warn('[JOB] Erro na integração Discord do radar:', e.message);
        }
      }

      const huntedOnlineIds = huntedList
        .filter(h => h.name && onlineSet.has(h.name.toLowerCase()))
        .map(h => h.id);

      const huntedToOfflineIds = huntedList
        .filter(h => h.name && !onlineSet.has(h.name.toLowerCase()) && h.is_online)
        .map(h => h.id);

      const now = new Date().toISOString();
      if (huntedOnlineIds.length > 0) {
        for (let i = 0; i < huntedOnlineIds.length; i += 100) {
          const chunk = huntedOnlineIds.slice(i, i + 100);
          await supabase.from('hunted_list')
            .update({ is_online: true, last_seen: now })
            .in('id', chunk);
        }
      }

      if (huntedToOfflineIds.length > 0) {
        for (let i = 0; i < huntedToOfflineIds.length; i += 100) {
          const chunk = huntedToOfflineIds.slice(i, i + 100);
          await supabase.from('hunted_list')
            .update({ is_online: false })
            .in('id', chunk);
        }
      }
    }

    // --- SINCRONIZAÇÃO DE STATUS ONLINE E CARIMBO DE ATIVIDADE ---
    let allGuildMembers = [];
    let page = 0;
    while (true) {
      const { data: gChunk } = await supabase
        .from('guild_members')
        .select('name, is_online')
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (!gChunk || gChunk.length === 0) break;
      allGuildMembers.push(...gChunk);
      if (gChunk.length < 1000) break;
      page++;
    }

    if (allGuildMembers.length > 0) {
      const activeGuildNames = allGuildMembers
        .filter(m => m && m.name && onlineSet.has(m.name.toLowerCase()))
        .map(m => m.name);

      const toSetOnline = allGuildMembers
        .filter(m => m && m.name && onlineSet.has(m.name.toLowerCase()) && !m.is_online)
        .map(m => m.name);

      const toSetOffline = allGuildMembers
        .filter(m => m && m.name && !onlineSet.has(m.name.toLowerCase()) && m.is_online)
        .map(m => m.name);

      if (toSetOnline.length > 0) {
        for (let i = 0; i < toSetOnline.length; i += 100) {
          await supabase.from('guild_members').update({ is_online: true }).in('name', toSetOnline.slice(i, i + 100));
        }
        console.log(`[JOB] ${toSetOnline.length} membros da guilda marcados como ONLINE.`);
      }

      if (toSetOffline.length > 0) {
        for (let i = 0; i < toSetOffline.length; i += 100) {
          await supabase.from('guild_members').update({ is_online: false }).in('name', toSetOffline.slice(i, i + 100));
        }
        console.log(`[JOB] ${toSetOffline.length} membros da guilda marcados como OFFLINE.`);
      }

      if (activeGuildNames.length > 0) {
        const now = new Date().toISOString();
        
        // Server Save Boundary (10h BRT = 13h UTC)
        // Subtraindo 13h, qualquer horário antes das 10h BRT cai no dia anterior
        const ssDate = new Date(Date.now() - 13 * 60 * 60 * 1000);
        const today = ssDate.toISOString().split('T')[0];
        
        let updatedCount = 0;
        // Divide em chunks de 100 para não estourar a URL/Payload
        for (let i = 0; i < activeGuildNames.length; i += 100) {
          const chunk = activeGuildNames.slice(i, i + 100);
          const { error: updateErr } = await supabase
            .from('guild_members')
            .update({ last_xp_date: now })
            .in('name', chunk);
            
          // Log de frequência (2 minutos por ciclo)
          await supabase.rpc('increment_attendance_batch', {
            p_names: chunk,
            p_date: today,
            p_minutes: 2
          });
            
          if (!updateErr) updatedCount += chunk.length;
        }
        console.log(`[JOB] Carimbo de Atividade (Online) aplicado para ${updatedCount} membros da guilda.`);
      } else {
        console.log(`[JOB] Nenhum membro da guilda está online no momento.`);
      }
    }

  } catch (error) {
    console.error("[JOB] Erro na task FETCH_ONLINES:", error.message);
  }
};
