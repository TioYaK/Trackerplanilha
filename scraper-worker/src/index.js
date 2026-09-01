import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';
import os from 'os';
import fs from 'fs';
import { runFetchGuild } from './jobs/fetchGuild.js';
import { runFetchOnlines } from './jobs/fetchOnlines.js';
import { runFetchHighscores } from './jobs/fetchHighscores.js';
import { runAuditSlots } from './jobs/auditSlots.js';
import { runFetchRivals } from './jobs/fetchRivals.js';
import { runFetchDeaths } from './jobs/fetchDeaths.js';
import { runFetchKillstats } from './jobs/fetchKillstats.js';
import { runFetchTransfers } from './jobs/fetchTransfers.js';
import { runFetchBazaar } from './jobs/fetchBazaar.js';
import { runCloseSessions } from './jobs/closeSessions.js';
import { runBankSync } from './jobs/syncBankTS3.js';
import { runFetchRosterShard } from './jobs/fetchRosterShards.js';
import { runSendDiscordReport } from './jobs/sendDiscordReport.js';
import { checkForUpdates } from './updater.js';
import { closeBrowser } from './lib/rubinotScraper.js';

// ==========================================
// ID PERSISTENTE DO WORKER
// ==========================================
const ID_FILE = path.join(process.cwd(), 'worker_id.txt');
let WORKER_ID;

if (fs.existsSync(ID_FILE)) {
  WORKER_ID = fs.readFileSync(ID_FILE, 'utf8').trim();
} else {
  WORKER_ID = `worker-${Math.random().toString(36).substring(2, 9)}`;
  fs.writeFileSync(ID_FILE, WORKER_ID);
}

const POLL_INTERVAL = 5000;       // 5 segundos entre ciclos vazios
const LOCK_TIMEOUT_MINUTES = 5;
const UPDATE_CHECK_INTERVAL = 10 * 60 * 1000; // Mínimo 10 min entre git pulls

console.log(`\n${'='.repeat(60)}`);
console.log(`[WORKER] 🚀 Iniciando Worker ID: ${WORKER_ID}`);
console.log(`${'='.repeat(60)}\n`);

// ==========================================
// SISTEMA DE TAREFAS
// ==========================================
const fetchTask = async () => {
  try {
    const now = new Date().toISOString();
    const crashLimit = new Date();
    crashLimit.setMinutes(crashLimit.getMinutes() - LOCK_TIMEOUT_MINUTES);

    const orQuery = `and(status.eq.PENDING,or(locked_at.is.null,locked_at.lte.${now})),and(status.eq.IN_PROGRESS,locked_at.lte.${crashLimit.toISOString()})`;

    const { data: tasks, error } = await supabase
      .from('task_queue')
      .select('*')
      .or(orQuery)
      .order('locked_at', { ascending: true, nullsFirst: true })
      .limit(1);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return null;

    const task = tasks[0];

    // Tenta aplicar o lock (concorrência otimista)
    let query = supabase
      .from('task_queue')
      .update({
        status: 'IN_PROGRESS',
        worker_id: WORKER_ID,
        locked_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .eq('status', task.status);

    if (task.locked_at) {
      query = query.eq('locked_at', task.locked_at);
    }

    const { data: updatedTask, error: updateError } = await query.select().single();

    if (updateError || !updatedTask) {
      return null; // Outro worker pegou
    }

    return updatedTask;
  } catch (error) {
    console.error('[WORKER] Erro ao buscar tarefa:', error.message);
    return null;
  }
};

const completeTask = async (task) => {
  // Cooldown por tipo de tarefa
  const cooldowns = {
    FETCH_GUILD: 5,
    FETCH_ROSTER_SHARD: 15,
    FETCH_RIVALS: 3,
    FETCH_ONLINES: 2,
    AUDIT_SLOTS: 10,
    FETCH_DEATHS: 2,
    FETCH_KILLSTATS: 15,
    FETCH_TRANSFERS: 60,
    FETCH_BAZAAR: 10,
    CLOSE_SESSIONS: 30,
  };

  let cooldownMinutes = cooldowns[task.task_type] ?? 1;
  if (task.task_type.startsWith('FETCH_HIGHSCORE')) cooldownMinutes = 10;

  const nextRun = new Date();
  nextRun.setMinutes(nextRun.getMinutes() + cooldownMinutes);

  console.log(`[WORKER] ✔ ${task.task_type} concluída. Próxima execução em ${cooldownMinutes}min.`);

  await supabase
    .from('task_queue')
    .update({ status: 'PENDING', locked_at: nextRun.toISOString(), worker_id: null })
    .eq('id', task.id);
};

const requeueTask = async (task) => {
  await completeTask(task);
};

// ==========================================
// ESTATÍSTICAS E HEARTBEAT
// ==========================================
let sessionStats = {};

const processTask = async (task) => {
  const ts = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`\n[WORKER] ▶ [${ts}] Processando: ${task.task_type} (ID: ${task.id})`);
  const startTime = Date.now();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => { reject(new Error('CRITICAL_TIMEOUT')); }, 4.5 * 60 * 1000);
  });

  const executeTask = async () => {
    switch (task.task_type) {
      case 'FETCH_GUILD':
        await runFetchGuild();
        break;
      case 'FETCH_ONLINES':
        await runFetchOnlines();
        break;
      case 'FETCH_RIVALS':
        await runFetchRivals();
        break;
      case 'AUDIT_SLOTS':
        await runAuditSlots();
        break;
      case 'FETCH_ROSTER_SHARD':
        // O id do Shard vem do page_number (1, 2, 3, 4)
        await runFetchRosterShard(task.page_number || 1);
        break;
      case 'UPDATE_WORKERS':
        console.log('[WORKER] 🔄 Comando de Forçar Atualização recebido!');
        await checkForUpdates();
        console.log('[WORKER] Atualizado com sucesso. Reiniciando...');
        process.exit(0);
        break;
      default:
        if (task.task_type.startsWith('FETCH_HIGHSCORE')) {
          const parts = task.task_type.split('_');
          const vocStr = parts.length > 2 ? parts[2] : 'ALL';
          await runFetchHighscores(vocStr);
        } else if (task.task_type === 'FETCH_RIVALS') {
          await runFetchRivals();
        } else if (task.task_type === 'FETCH_DEATHS') {
          await runFetchDeaths();
        } else if (task.task_type === 'FETCH_KILLSTATS') {
          await runFetchKillstats();
        } else if (task.task_type === 'FETCH_TRANSFERS') {
          await runFetchTransfers();
        } else if (task.task_type === 'FETCH_BAZAAR') {
          await runFetchBazaar();
        } else if (task.task_type === 'CLOSE_SESSIONS') {
          await runCloseSessions();
        } else if (task.task_type === 'AUDIT_SLOTS') {
          await runAuditSlots();
        } else {
          console.log(`[WORKER] ⚠ Tipo desconhecido: ${task.task_type}`);
        }
        break;
    }
  };

  try {
    await Promise.race([executeTask(), timeoutPromise]);
    const duration = Date.now() - startTime;
    console.log(`[WORKER] ✅ ${task.task_type} concluída em ${(duration / 1000).toFixed(1)}s`);

    if (!sessionStats[task.task_type]) {
      sessionStats[task.task_type] = { count: 0, duration: 0 };
    }
    sessionStats[task.task_type].count += 1;
    sessionStats[task.task_type].duration += duration;

    await requeueTask(task);
  } catch (error) {
    console.error(`[WORKER] ❌ Falha na tarefa ${task.task_type}:`, error.message);

    if (error.message === 'CRITICAL_TIMEOUT' || error.message.includes('Cloudflare')) {
      console.warn('[WORKER] ⏰ Timeout crítico/Cloudflare! Pausando ESTE WORKER por 24 horas para evitar ban de IP...');
      try { await closeBrowser(); } catch (e) { /* ignore */ }
      
      // Bane o worker localmente por 24 horas
      localBanUntil = Date.now() + 24 * 60 * 60 * 1000;
      
      // Devolve a task para a fila imediatamente para que OUTRO worker assuma
      await supabase
        .from('task_queue')
        .update({ status: 'PENDING', worker_id: null, locked_at: new Date().toISOString() })
        .eq('id', task.id);
    } else {
      await supabase
        .from('task_queue')
        .update({ status: 'PENDING', worker_id: null, locked_at: null })
        .eq('id', task.id);
    }
  }
};

// ==========================================
// HEARTBEAT DO WORKER
// ==========================================
const WORKER_VERSION = '1.4.0';
const WORKER_STARTED = new Date().toISOString();
let WORKER_LOCATION = 'Desconhecida';

const WORKER_METADATA = {
  cpu: os.cpus()[0]?.model?.trim() || 'Processador Desconhecido',
  cores: os.cpus().length,
  ram: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
  os: `${os.type()} ${os.release()}`,
  node_version: process.version,
};

// Fetch location on startup
fetch('https://ipinfo.io/json')
  .then(res => res.json())
  .then(data => {
    if (data && data.city) {
      WORKER_LOCATION = `${data.city}, ${data.region} (${data.country})`;
    }
  })
  .catch(() => { /* ignora erro de localização */ });

// ==========================================
// CONTROLE DO UPDATE CHECKER
// ==========================================
let lastUpdateCheck = 0;
let emptyCycles = 0;
let localBanUntil = null;

const loop = async () => {
  try {
    // CHECAGEM DE VERSÃO (KILL-SWITCH) DEVE VIR ANTES DO BAN DE CLOUDFLARE
    const { data: settings } = await supabase
      .from('worker_config')
      .select('min_worker_version')
      .eq('id', 1)
      .single();

    if (settings?.min_worker_version) {
      const minVersion = settings.min_worker_version;
      if (WORKER_VERSION !== minVersion && WORKER_VERSION < minVersion) {
        console.error(`[KILL-SWITCH] Versão obsoleta! Sua: ${WORKER_VERSION} | Requerida: ${minVersion}`);
        await checkForUpdates();
        process.exit(0);
      }
    }
  } catch (err) {
    // ignorar
  }

  if (localBanUntil && Date.now() < localBanUntil) {
    console.log(`[WORKER] 🔴 Suspenso devido a bloqueio/timeout. Retorna em: ${new Date(localBanUntil).toLocaleString()}`);
    setTimeout(loop, 60000); // Tenta novamente em 1 minuto (só pra avisar e continuar dormindo)
    return;
  }



  const task = await fetchTask();
  if (task) {
    emptyCycles = 0;
    await processTask(task);
    setTimeout(loop, 1000);
  } else {
    emptyCycles++;

    // FIX: Checa updates no máximo 1x a cada 10 minutos (não a cada 15 segundos)
    const now = Date.now();
    if (now - lastUpdateCheck > UPDATE_CHECK_INTERVAL) {
      lastUpdateCheck = now;
      await checkForUpdates();
    }

    setTimeout(loop, POLL_INTERVAL);
  }
};

const sendHeartbeat = async () => {
  try {
    await supabase.from('worker_heartbeats').upsert({
      worker_id: WORKER_ID,
      last_ping: new Date().toISOString(),
      started_at: WORKER_STARTED,
      version: WORKER_VERSION,
      location: WORKER_LOCATION,
      metadata: WORKER_METADATA,
    });

    const statsToFlush = { ...sessionStats };
    sessionStats = {};

    for (const [type, data] of Object.entries(statsToFlush)) {
      if (data.count > 0) {
        await supabase.from('task_history').insert({
          worker_id: WORKER_ID,
          task_type: type,
          task_count: data.count,
          duration_ms: data.duration,
        }).catch(() => {});
      }
    }

    console.log(`[HEARTBEAT] ♥ Ping enviado. Workers online: verificar dashboard.`);
  } catch (err) {
    // ignorar falha de heartbeat
  }
};

// Primeiro heartbeat após 1 minuto, depois a cada 10 minutos
setTimeout(() => {
  sendHeartbeat();
  setInterval(sendHeartbeat, 10 * 60 * 1000);
}, 60 * 1000);

// Iniciar Loop
loop();

// ==========================================
// TAREFAS AGENDADAS INDEPENDENTES DA FILA
// ==========================================
// Sincroniza o Banco FBot (TS3) a cada 5 minutos cravados
setInterval(async () => {
  console.log('\n[CRON] ⏰ Sincronização Automática do TS3 (5 min)...');
  await runBankSync();
}, 5 * 60 * 1000);

// Checa envio do Relatório Diário para o Discord a cada 5 minutos
setInterval(async () => {
  console.log('\n[CRON] 🤖 Checando envio de Relatório Diário para o Discord...');
  await runSendDiscordReport();
}, 5 * 60 * 1000);

// ==========================================
// SERVIDOR ADMIN LOCAL (Forçar TS3 Sync)
// ==========================================
const app = express();
app.use(cors());
app.use(express.json());

app.post('/admin/force-ts3', async (req, res) => {
  try {
    console.log('[API_ADMIN] Comando manual recebido: forçar TS3 Sync!');
    await runBankSync();
    res.json({ success: true, message: 'TS3 Sincronizado com sucesso!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => {
  console.log('[API_ADMIN] Servidor local na porta 3001 (comandos admin).');
});

// ==========================================
// GATILHO DE ATUALIZAÇÃO EM TEMPO REAL (REALTIME)
// ==========================================
supabase
  .channel('worker_sync')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'task_queue' }, (payload) => {
    if (payload.new.status === 'PENDING' && payload.new.locked_at) {
       const lockTime = new Date(payload.new.locked_at).getTime();
       if (lockTime <= Date.now()) {
          console.log('\n[REALTIME] ⚡ Comando de Sincronização Forçada Recebido! Fila acelerada...');
          if (!localBanUntil || Date.now() > localBanUntil) {
            // Invoca o worker imediatamente
            fetchTask().then(task => {
               if (task) {
                  emptyCycles = 0;
                  processTask(task);
               }
            });
          }
       }
    }
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[REALTIME] 📡 Inscrito para receber comandos de Sincronização em Tempo Real.');
    }
  });
import { runValidateMakers } from './jobs/validateMakers.js';

supabase
  .channel('maker_validation')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maker_validation_queue' }, (payload) => {
     console.log('\n[REALTIME] Novo maker recebido para validar!');
     runValidateMakers();
  })
  .subscribe();
