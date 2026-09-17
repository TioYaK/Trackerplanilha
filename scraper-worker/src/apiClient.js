import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Obtém o WORKER_ID único da máquina
let WORKER_ID = process.env.WORKER_ID;
if (!WORKER_ID) {
  const idFile = path.join(process.cwd(), 'worker_id.txt');
  if (fs.existsSync(idFile)) {
    WORKER_ID = fs.readFileSync(idFile, 'utf8').trim();
  } else {
    WORKER_ID = 'Worker-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    try { fs.writeFileSync(idFile, WORKER_ID, 'utf8'); } catch (e) {}
  }
}

const rawBase = (process.env.API_BASE_URL || 'https://trackerplanilha.vercel.app').trim();
const API_BASE_URL = rawBase.replace(/\/api\/worker\/telemetry\/?$/, '').replace(/\/$/, '');
const WORKER_TOKEN = process.env.WORKER_INGESTION_TOKEN || process.env.WORKER_TOKEN || 'wk_live_rubinot_telemetry_secure_2026';
const WORKER_OWNER = process.env.WORKER_OWNER || 'Membro';

/**
 * Envia uma requisição HTTP segura para a API de Ingestão da Vercel
 */
async function postTelemetry(action, payload) {
  const url = `${API_BASE_URL}/api/worker/telemetry`;
  const body = {
    worker_id: WORKER_ID,
    worker_token: WORKER_TOKEN,
    action,
    payload
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WORKER_TOKEN}`,
          'x-worker-id': WORKER_ID
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === 3) {
        console.warn(`[ApiClient] ❌ Falha definitiva no envio de ${action} após 3 tentativas: ${err.message}`);
        return null;
      }
      // Espera 1s antes do retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

export const apiClient = {
  WORKER_ID,
  WORKER_OWNER,
  API_BASE_URL,

  /**
   * Envia Heartbeat periódico com telemetria da máquina
   */
  async sendHeartbeat(metadata = {}) {
    return await postTelemetry('HEARTBEAT', {
      version: '1.2.0',
      owner: WORKER_OWNER,
      location: 'Brasil',
      metadata
    });
  },

  /**
   * Envia lote de mortes detectadas
   */
  async reportDeaths(deaths) {
    if (!deaths || deaths.length === 0) return { ok: true, saved: 0 };
    return await postTelemetry('REPORT_DEATHS', { deaths });
  },

  /**
   * Envia censo e lista de jogadores online nos 16 servidores
   */
  async reportOnlines(onlineCount, players = []) {
    return await postTelemetry('REPORT_ONLINES', {
      online_count: onlineCount,
      players
    });
  },

  /**
   * Envia atualização de ranking / XP / Níveis
   */
  async reportHighscores(characters) {
    if (!characters || characters.length === 0) return { ok: true, processed: 0 };
    return await postTelemetry('REPORT_HIGHSCORES', { characters });
  },

  /**
   * Envia lote de membros escaneados por shard
   */
  async reportShard(shardNumber, members) {
    return await postTelemetry('REPORT_SHARD', {
      shard_number: shardNumber,
      members
    });
  }
};
