import { createClient } from '@supabase/supabase-js';

// Cache em memória para Rate Limiting (workerId -> { count, resetAt })
const workerRateLimits = new Map();
const MAX_REQUESTS_PER_MINUTE = 120;

// Token padrão de contingência e leitura de variável de ambiente
const DEFAULT_INGESTION_TOKEN = 'wk_live_rubinot_telemetry_secure_2026';

let cachedSupabase = null;
function getSupabase(url, key) {
  if (!cachedSupabase) {
    cachedSupabase = createClient(url, key);
  }
  return cachedSupabase;
}

export default async function handler(req, res) {
  // CORS defensivo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-worker-token, x-worker-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Autenticação do Worker Token
  const authHeader = req.headers['authorization'] || '';
  const headerToken = req.headers['x-worker-token'] || '';
  const bodyToken = req.body?.worker_token || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else if (headerToken) {
    token = String(headerToken).trim();
  } else if (bodyToken) {
    token = String(bodyToken).trim();
  }

  const expectedToken = process.env.WORKER_INGESTION_TOKEN || DEFAULT_INGESTION_TOKEN;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const isAuthorized = (token === expectedToken) || (serviceKey && token === serviceKey);

  if (!token || !isAuthorized) {
    return res.status(401).json({
      error: 'Worker token invalido ou nao fornecido.',
      code: 'UNAUTHORIZED_WORKER'
    });
  }

  // 2. Identificação do Worker & Rate Limiting
  const workerId = String(req.headers['x-worker-id'] || req.body?.worker_id || 'unknown_worker').trim();
  const now = Date.now();
  const rateData = workerRateLimits.get(workerId) || { count: 0, resetAt: now + 60000 };

  if (now > rateData.resetAt) {
    rateData.count = 1;
    rateData.resetAt = now + 60000;
  } else {
    rateData.count++;
  }
  workerRateLimits.set(workerId, rateData);

  if (rateData.count > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: 'Limite de telemetria por minuto excedido para este worker.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // 3. Inicialização Supabase com Service Role (apenas no servidor Vercel)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuracao do banco de dados ausente no servidor.' });
  }

  const supabase = getSupabase(supabaseUrl, serviceRoleKey);
  const { action, payload } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Acao (action) obrigatoria no payload.' });
  }

  try {
    switch (action) {
      // -------------------------------------------------------------
      // 1. HEARTBEAT
      // -------------------------------------------------------------
      case 'HEARTBEAT': {
        const { version, location, owner, metadata } = payload || {};
        
        // Verifica se o worker está pausado na base
        const { data: existingHb } = await supabase
          .from('worker_heartbeats')
          .select('metadata')
          .eq('worker_id', workerId)
          .maybeSingle();

        const isPaused = existingHb?.metadata?.is_paused === true;

        const heartbeatData = {
          worker_id: workerId,
          last_ping: new Date().toISOString(),
          version: String(version || '1.0.0').slice(0, 20),
          location: String(location || 'Brasil').slice(0, 50),
          metadata: {
            ...(metadata || {}),
            owner: String(owner || 'Membro').slice(0, 50),
            updated_via: 'ingestion_gateway'
          }
        };

        await supabase.from('worker_heartbeats').upsert(heartbeatData, { onConflict: 'worker_id' });

        return res.status(200).json({
          ok: true,
          is_paused: isPaused,
          server_time: new Date().toISOString()
        });
      }

      // -------------------------------------------------------------
      // 2. REPORT_DEATHS (Validação de Veracidade e Anti-Poisoning)
      // -------------------------------------------------------------
      case 'REPORT_DEATHS': {
        const { deaths } = payload || {};
        if (!Array.isArray(deaths) || deaths.length === 0) {
          return res.status(400).json({ error: 'Campo deaths deve ser um array nao vazio.' });
        }

        const nowMs = Date.now();
        const validDeaths = [];

        for (const d of deaths.slice(0, 100)) { // Limite máximo de 100 por lote
          const name = String(d.character_name || '').trim();
          const level = parseInt(d.level, 10);
          const killedBy = String(d.killed_by || 'Unknown').trim().slice(0, 150);
          
          // Validação 1: Nome válido
          if (!name || name.length < 2 || name.length > 50 || !/^[a-zA-Z0-9'\s\-]+$/.test(name)) continue;

          // Validação 2: Level plausível (1 a 3500)
          if (isNaN(level) || level < 1 || level > 3500) continue;

          // Validação 3: Data de morte plausível (+5 min no futuro até -48h no passado)
          const deathDate = new Date(d.death_time);
          const deathTimeMs = deathDate.getTime();
          if (isNaN(deathTimeMs)) continue;

          const diffMs = deathTimeMs - nowMs;
          if (diffMs > 5 * 60 * 1000) continue; // Rejeita mortes no futuro
          if (nowMs - deathTimeMs > 48 * 60 * 60 * 1000) continue; // Rejeita mortes de mais de 48h atrás

          validDeaths.push({
            character_name: name,
            level: level,
            killed_by: killedBy,
            death_time: deathDate.toISOString(),
            is_guild_member: Boolean(d.is_guild_member),
            is_hunted: Boolean(d.is_hunted)
          });
        }

        if (validDeaths.length > 0) {
          await supabase
            .from('recent_deaths')
            .upsert(validDeaths, { onConflict: 'character_name,death_time', ignoreDuplicates: true });
        }

        return res.status(200).json({
          ok: true,
          received: deaths.length,
          saved: validDeaths.length
        });
      }

      // -------------------------------------------------------------
      // 3. REPORT_ONLINES
      // -------------------------------------------------------------
      case 'REPORT_ONLINES': {
        const { online_count, players } = payload || {};
        const count = parseInt(online_count, 10);

        if (isNaN(count) || count < 0 || count > 50000) {
          return res.status(400).json({ error: 'Contagem de online invalida.' });
        }

        // Registra histórico consolidado para heatmap
        await supabase.from('online_history').insert({ online_count: count });

        // Se houver lista de jogadores, processar login_events se fornecidos
        if (Array.isArray(players) && players.length > 0) {
          const sample = players.slice(0, 1000).filter(p => typeof p === 'string' && p.length > 1 && p.length < 50);
          // Opcional: Atualizar status online de membros em background
        }

        return res.status(200).json({ ok: true, recorded_count: count });
      }

      // -------------------------------------------------------------
      // 4. REPORT_HIGHSCORES
      // -------------------------------------------------------------
      case 'REPORT_HIGHSCORES': {
        const { characters } = payload || {};
        if (!Array.isArray(characters) || characters.length === 0) {
          return res.status(400).json({ error: 'Campo characters deve ser um array.' });
        }

        const validStates = [];
        const validWorldRanks = [];

        for (const c of characters.slice(0, 150)) { // 150 por chunk
          const name = String(c.character_name || '').trim();
          const level = parseInt(c.level, 10);
          const exp = parseInt(c.experience || c.xp_total, 10);

          if (!name || name.length < 2 || name.length > 50 || isNaN(level) || level < 1 || level > 3500 || !/^[a-zA-Z0-9'\s\-]+$/.test(name)) continue;

          validStates.push({
            character_name: name,
            level: level,
            vocation: String(c.vocation || 'Unknown').slice(0, 30),
            xp_total: isNaN(exp) ? null : exp,
            last_active: new Date().toISOString()
          });

          if (c.world) {
            const cleanRank = parseInt(String(c.rank || '').replace(/\D/g, ''), 10) || null;
            validWorldRanks.push({
              character_name: name,
              world: String(c.world).slice(0, 30),
              notes: cleanRank ? `rank:${cleanRank}` : null
            });
          }
        }

        if (validStates.length > 0) {
          await supabase
            .from('current_character_state')
            .upsert(validStates, { onConflict: 'character_name' });
        }

        if (validWorldRanks.length > 0) {
          await supabase
            .from('guild_perk_members')
            .upsert(validWorldRanks, { onConflict: 'character_name' });
        }

        return res.status(200).json({ ok: true, processed: validStates.length });
      }

      // -------------------------------------------------------------
      // 5. REPORT_SHARD
      // -------------------------------------------------------------
      case 'REPORT_SHARD': {
        const { shard_number, members } = payload || {};
        if (!Array.isArray(members)) {
          return res.status(400).json({ error: 'Campo members deve ser um array.' });
        }

        return res.status(200).json({ ok: true, shard: shard_number, count: members.length });
      }

      default:
        return res.status(400).json({ error: `Acao desconhecida: ${action}` });
    }
  } catch (err) {
    console.error('[Ingestion Gateway Error]:', err);
    return res.status(500).json({ error: 'Erro interno ao processar telemetria.', details: err.message });
  }
}
