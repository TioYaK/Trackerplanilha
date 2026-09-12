import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const WORKER_ROOT = fileURLToPath(new URL('../', import.meta.url));
dotenv.config({ path: path.join(WORKER_ROOT, '.env') });

import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';
import { exec } from 'child_process';
import os from 'os';
import fs from 'fs';
import notifier from 'node-notifier';
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
import { runAuditBank } from './jobs/auditBank.js';
import { runProcessAutoInvites } from './jobs/processAutoInvites.js';
import { runAuditGuildPerks } from './jobs/auditGuildPerks.js';
import { runArchiveSessions } from './jobs/archiveSessions.js';
import { runValidateMakers } from './jobs/validateMakers.js';
import { checkForUpdates } from './updater.js';
import { applySelfHealingPatch } from './selfHeal.js';
import { closeBrowser, isInMaintenance, recycleBrowserPages } from './lib/rubinotScraper.js';
import { runFullStorageMaintenance, getDiskHealth, cleanWorkerProfileCaches } from './lib/storageGuardian.js';

applySelfHealingPatch();

// ==========================================
// ID PERSISTENTE DO WORKER
// ==========================================
const ID_FILE = path.join(WORKER_ROOT, 'worker_id.txt');
let WORKER_ID;

if (fs.existsSync(ID_FILE)) {
  WORKER_ID = fs.readFileSync(ID_FILE, 'utf8').trim();
} else {
  WORKER_ID = `worker-${Math.random().toString(36).substring(2, 9)}`;
  fs.writeFileSync(ID_FILE, WORKER_ID);
}

// ─── Ring Buffer para Terminal Remoto (C2) ──────────────────────────────────
const MAX_RECENT_LOGS = 120;
const recentLogs = [];
const origLog = console.log;
const origErr = console.error;
const origWarn = console.warn;

function pushRecentLog(level, args) {
  try {
    const ts = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const text = args.map(arg => {
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch { return String(arg); }
      }
      return String(arg);
    }).join(' ');
    // Remove caracteres ANSI de cores do terminal se houver
    const cleanText = text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
    recentLogs.push(`[${ts}] [${level}] ${cleanText}`);
    if (recentLogs.length > MAX_RECENT_LOGS) recentLogs.shift();
  } catch {}
}

console.log = (...args) => {
  pushRecentLog('INFO', args);
  origLog(...args);
};
console.error = (...args) => {
  pushRecentLog('ERROR', args);
  origErr(...args);
};
console.warn = (...args) => {
  pushRecentLog('WARN', args);
  origWarn(...args);
};

const POLL_INTERVAL = 3000;       // 3 segundos entre ciclos vazios
const LOCK_TIMEOUT_MINUTES = 5;
const UPDATE_CHECK_INTERVAL = 10 * 60 * 1000; // Mínimo 10 min entre git pulls

let isWorkerPaused = false;

// Sincronização inicial do estado de pausa
(async () => {
  try {
    const { data: hb } = await supabase
      .from('worker_heartbeats')
      .select('metadata')
      .eq('worker_id', WORKER_ID)
      .maybeSingle();
    if (hb?.metadata?.is_paused) {
      isWorkerPaused = true;
      console.log(`[WORKER] ⏸️ Worker iniciando em modo PAUSADO/DESLIGADO (conforme configurado no painel).`);
    }
  } catch (e) {}
})();

console.log(`\n${'='.repeat(60)}`);
console.log(`[WORKER] 🚀 Iniciando Worker ID: ${WORKER_ID}`);
console.log(`${'='.repeat(60)}\n`);

// ==========================================
// SISTEMA DE TAREFAS
// ==========================================
const fetchTask = async () => {
  if (isWorkerPaused) return null;
  try {
    const now = new Date().toISOString();
    const crashLimit = new Date();
    crashLimit.setMinutes(crashLimit.getMinutes() - LOCK_TIMEOUT_MINUTES);

    const orQuery = `and(status.eq.PENDING,or(locked_at.is.null,locked_at.lte.${now})),and(status.eq.IN_PROGRESS,locked_at.lte.${crashLimit.toISOString()})`;

    // 1. Prioriza tarefas críticas em tempo real para evitar inanição (starvation)
    const priorityTypes = ['UPDATE_WORKERS', 'PROCESS_GUILD_INVITES', 'FETCH_ONLINES', 'FETCH_DEATHS'];
    const { data: prioTasks } = await supabase
      .from('task_queue')
      .select('*')
      .in('task_type', priorityTypes)
      .or(orQuery)
      .order('locked_at', { ascending: true, nullsFirst: true })
      .limit(5);

    let candidates = (prioTasks && prioTasks.length > 0) ? prioTasks : null;

    if (!candidates) {
      const { data: tasks, error } = await supabase
        .from('task_queue')
        .select('*')
        .or(orQuery)
        .order('locked_at', { ascending: true, nullsFirst: true })
        .limit(5);

      if (error) throw error;
      if (!tasks || tasks.length === 0) return null;
      candidates = tasks;
    }

    // Anti-colisão no swarm: seleciona com jitter entre os candidatos para paralelismo real
    const pickIndex = Math.floor(Math.random() * candidates.length);
    const task = candidates[pickIndex];

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

    const { data: updatedTask, error: updateError } = await query.select().maybeSingle();

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
  // Cooldown em SEGUNDOS por tipo de tarefa (Ajuste de Alta Performance)
  const cooldowns = {
    FETCH_DEATHS: 15,          // 15s (Alerta instantâneo de mortes/frags)
    FETCH_ONLINES: 30,         // 30s (Heatmap, Makers e Radar Tático)
    PROCESS_GUILD_INVITES: 30, // 30s (Convites de novos membros)
    FETCH_RIVALS: 60,          // 1m (Espionagem da Guilda Rival)
    FETCH_ROSTER_SHARD: 300,   // 5m (Rotação completa de 4 shards em 20 min vs 1h)
    FETCH_KILLSTATS: 300,      // 5m (Micro-cache rápido de estatísticas)
    AUDIT_SLOTS: 300,          // 5m (Auditoria de Slots de Respawn e Discord)
    CLOSE_SESSIONS: 900,       // 15m (Encerramento de hunts inativas)
    FETCH_BAZAAR: 900,         // 15m (Sniper de Bazaar 4x mais frequente)
    FETCH_TRANSFERS: 1800,     // 30m (Detecção de jogadores transferidos)
    AUDIT_GUILD_PERKS: 1800,   // 30m (Auditoria de 7d XP e fila de cargos de Perks)
    FETCH_GUILD: 3600,         // 1h (Membros e cargos oficiais)
  };

  let cooldownSeconds = cooldowns[task.task_type] ?? 60;
  if (task.task_type.startsWith('FETCH_HIGHSCORE')) cooldownSeconds = 300; // 5m para cada vocação

  const nextRun = new Date();
  nextRun.setSeconds(nextRun.getSeconds() + cooldownSeconds);

  console.log(`[WORKER] ✔ ${task.task_type} concluída. Próxima execução em ${cooldownSeconds}s.`);

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
let isProcessingTask = false;
let currentTaskType = 'IDLE';
let totalTasksCompleted = 0;
let tasksSinceRecycle = 0;
let totalExecutionTimeMs = 0;
let totalTasksCompletedCount = 0;
let lastWorkerError = null;
let currentTerminalLogs = '';
let currentTerminalLogsUpdatedAt = null;

const processTask = async (task) => {
  if (isProcessingTask) {
    console.warn(`[WORKER] ⚠️ Ignorando processamento concorrente: já está executando uma tarefa.`);
    return;
  }
  isProcessingTask = true;
  currentTaskType = task.task_type;
  const ts = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`\n[WORKER] ▶ [${ts}] Processando: ${task.task_type} (ID: ${task.id})`);
  const startTime = Date.now();

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => { reject(new Error('CRITICAL_TIMEOUT')); }, 10 * 60 * 1000);
  });

  const executeTask = async () => {
    // Pular jobs de scraping quando o site estiver em manutenção
    const scraperJobs = ['FETCH_GUILD', 'FETCH_ONLINES', 'FETCH_RIVALS', 'FETCH_ROSTER_SHARD',
                         'FETCH_HIGHSCORE_MONK', 'FETCH_HIGHSCORE_PALADIN', 'FETCH_HIGHSCORE_DRUID',
                         'FETCH_HIGHSCORE_KNIGHT', 'FETCH_HIGHSCORE_SORCERER', 'FETCH_DEATHS', 'FETCH_KILLSTATS'];
    if (isInMaintenance() && scraperJobs.includes(task.task_type)) {
      console.warn(`[WORKER] 🔧 Site em manutenção — pulando ${task.task_type}.`);
      return;
    }

    switch (task.task_type) {
      case 'FETCH_GUILD':
        await runFetchGuild();
        break;
      case 'PROCESS_GUILD_INVITES':
        await runProcessAutoInvites();
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
      case 'AUDIT_GUILD_PERKS':
        await runAuditGuildPerks();
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

    totalExecutionTimeMs += duration;
    totalTasksCompletedCount++;

    if (!sessionStats[task.task_type]) {
      sessionStats[task.task_type] = { count: 0, duration: 0 };
    }
    sessionStats[task.task_type].count += 1;
    sessionStats[task.task_type].duration += duration;

    await requeueTask(task);
    totalTasksCompleted++;
    tasksSinceRecycle++;

    if (tasksSinceRecycle >= 100) {
      tasksSinceRecycle = 0;
      await recycleBrowserPages();
      cleanWorkerProfileCaches();
      if (global.gc) {
        try { global.gc(); } catch {}
      }
    }
  } catch (error) {
    console.error(`[WORKER] ❌ Falha na tarefa ${task.task_type}:`, error.message);
    lastWorkerError = {
      task: task.task_type,
      message: error.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    };

    if (error.message === 'CRITICAL_TIMEOUT' || error.message.includes('Cloudflare')) {
      console.warn('[WORKER] ⏰ Timeout crítico/Cloudflare! Pausando ESTE WORKER por 1 hora para evitar ban de IP...');
      try { await closeBrowser(); } catch (e) { /* ignore */ }
      
      // Bane o worker localmente por 1 hora
      // removed sleep
      
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
  } finally {
    clearTimeout(timeoutId);
    isProcessingTask = false;
    currentTaskType = 'IDLE';
  }
};

// ==========================================
// HEARTBEAT DO WORKER
// ==========================================
const WORKER_VERSION = '1.8.0';
const WORKER_STARTED = new Date().toISOString();
let WORKER_LOCATION = 'Desconhecida';

let _cpu = os.cpus()[0]?.model?.trim() || 'Processador Desconhecido';
let _cores = os.cpus().length;
let _ram = Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB';
// Easter egg para o dono
if (_cpu.includes('5600GT')) {
    _cpu = 'AMD Ryzen™ Threadripper™ PRO 7995WX';
    _cores = 96;
    _ram = '512 GB';
}

const WORKER_METADATA = {
  cpu: _cpu,
  cores: _cores,
  ram: _ram,
  os: `${os.type()} ${os.release()}`,
  node_version: process.version,
  owner: process.env.WORKER_OWNER || 'Anônimo',
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
      .maybeSingle();

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

  // Se o worker foi desligado/pausado temporariamente pelo painel
  if (isWorkerPaused) {
    setTimeout(loop, 4000);
    return;
  }

  const task = await fetchTask();
  if (task) {
    emptyCycles = 0;
    await processTask(task);
    setTimeout(loop, 100); // 100ms para drenar a fila sem ociosidade
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
    // Sincroniza estado de pausa caso tenha sido alterado via banco de dados
    try {
      const { data: myHb } = await supabase
        .from('worker_heartbeats')
        .select('metadata')
        .eq('worker_id', WORKER_ID)
        .maybeSingle();
      if (myHb?.metadata?.is_paused !== undefined && isWorkerPaused !== Boolean(myHb.metadata.is_paused)) {
        isWorkerPaused = Boolean(myHb.metadata.is_paused);
        console.log(`[SYNC] 🔄 Estado de pausa sincronizado com o painel: ${isWorkerPaused ? 'PAUSADO (STANDBY)' : 'ATIVO (LIGADO)'}`);
        if (isWorkerPaused) {
          try { await closeBrowser(); } catch (e) {}
        }
      }
    } catch (e) {}

    const disk = getDiskHealth();
    const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const uptimeSec = Math.round((Date.now() - new Date(WORKER_STARTED).getTime()) / 1000);
    const avgDuration = totalTasksCompletedCount > 0 ? Math.round(totalExecutionTimeMs / totalTasksCompletedCount) : null;
    const metadata = {
      ...WORKER_METADATA,
      is_paused: isWorkerPaused,
      disk_free_gb: disk.freeGb,
      disk_total_gb: disk.totalGb,
      disk_percent_free: disk.percentFree,
      disk_warning: disk.isLowDisk,
      disk_text: disk.text,
      current_task: isWorkerPaused ? 'STANDBY (Desligado pelo Painel)' : (isProcessingTask ? currentTaskType : 'IDLE'),
      tasks_completed: totalTasksCompleted,
      memory_mb: memoryMb,
      uptime_seconds: uptimeSec,
      avg_task_duration_ms: avgDuration,
      last_error: lastWorkerError,
      terminal_logs: currentTerminalLogs,
      terminal_logs_updated_at: currentTerminalLogsUpdatedAt,
    };

    await supabase.from('worker_heartbeats').upsert({
      worker_id: WORKER_ID,
      last_ping: new Date().toISOString(),
      started_at: WORKER_STARTED,
      version: WORKER_VERSION,
      location: WORKER_LOCATION,
      metadata,
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

    console.log(`[HEARTBEAT] ♥ Ping enviado (${isProcessingTask ? currentTaskType : 'IDLE'}, ${totalTasksCompleted} tasks, ${memoryMb}MB RAM).`);
  } catch (err) {
    // ignorar falha de heartbeat
  }
};

// ==========================================
// WATCHDOG ANTI-DEADLOCK DE TAREFAS ÓRFÃS
// ==========================================
const runOrphanTaskWatchdog = async () => {
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 1. Busca workers offline há mais de 5 minutos
    const { data: deadWorkers } = await supabase
      .from('worker_heartbeats')
      .select('worker_id')
      .lt('last_ping', fiveMinsAgo);

    const deadWorkerIds = (deadWorkers || []).map(w => w.worker_id).filter(Boolean);

    // 2. Libera tarefas presas em IN_PROGRESS há mais de 5 min ou vinculadas a workers mortos
    let query = supabase
      .from('task_queue')
      .update({ status: 'PENDING', locked_at: null, worker_id: null })
      .eq('status', 'IN_PROGRESS');

    if (deadWorkerIds.length > 0) {
      query = query.or(`locked_at.lte.${fiveMinsAgo},worker_id.in.(${deadWorkerIds.join(',')})`);
    } else {
      query = query.lte('locked_at', fiveMinsAgo);
    }

    const { data: unlocked, error } = await query.select('id, task_type, worker_id');
    if (!error && unlocked && unlocked.length > 0) {
      console.warn(`[WATCHDOG] 🐕 ${unlocked.length} tarefa(s) órfã(s) recuperada(s) de workers inativos e devolvida(s) à fila:`, unlocked.map(u => u.task_type).join(', '));
    }
  } catch (err) {
    // watchdog silencioso
  }
};

// Primeiro heartbeat imediato, depois a cada 1 minuto
setTimeout(() => {
  sendHeartbeat();
  setInterval(sendHeartbeat, 60 * 1000);
  setInterval(runOrphanTaskWatchdog, 2 * 60 * 1000); // Watchdog a cada 2 min
}, 5000);

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

// Auditoria Financeira do Guild Bank (Dia 16)
setInterval(async () => {
  await runAuditBank();
}, 60 * 60 * 1000); // Checa a cada 1 hora

// Auditoria Contínua do Sistema de Perks da Guilda
setTimeout(() => runAuditGuildPerks(), 20000);
setInterval(async () => {
  await runAuditGuildPerks();
}, 30 * 60 * 1000); // A cada 30 minutos

// Guardião do Armazenamento: Limpeza preventiva automática de disco e perfis
setTimeout(() => runFullStorageMaintenance(), 5000);
setInterval(() => {
  runFullStorageMaintenance();
}, 30 * 60 * 1000); // Checa a cada 30 minutos

// Reciclagem preventiva de memória e abas a cada 2 horas
setInterval(async () => {
  await recycleBrowserPages();
  cleanWorkerProfileCaches();
}, 2 * 60 * 60 * 1000);

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
    if (isWorkerPaused) return;
    if (payload.new.status === 'PENDING' && payload.new.locked_at) {
       const lockTime = new Date(payload.new.locked_at).getTime();
       if (lockTime <= Date.now()) {
          console.log('\n[REALTIME] ⚡ Comando de Sincronização Forçada Recebido! Fila acelerada...');
          if (!isProcessingTask) {
            // Invoca o worker imediatamente se não estiver ocupado
            fetchTask().then(task => {
               if (task) {
                  emptyCycles = 0;
                  processTask(task);
               }
            });
          } else {
            console.log('[REALTIME] Worker ocupado executando outra tarefa. Fila será consumida em seguida.');
          }
       }
    }
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[REALTIME] 📡 Inscrito para receber comandos de Sincronização em Tempo Real.');
    }
  });

  supabase
    .channel('guild_invites')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_invites_queue' }, (payload) => {
      if (isWorkerPaused) return;
      if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && payload.new.status === 'PENDING')) {
        console.log('\n[REALTIME] Gatilho acionado (Novo invite ou Reprocessamento)!');
        if (!isProcessingTask) {
          runProcessAutoInvites().catch(err => console.error('[AutoInvite] Erro no gatilho realtime:', err.message));
        } else {
          console.log('[REALTIME] Worker ocupado. O convite será processado pelo ciclo regular.');
        }
      }
    })
    .subscribe();

  supabase
    .channel('maker_validation')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maker_validation_queue' }, (payload) => {
     if (isWorkerPaused) return;
     console.log('\n[REALTIME] Novo maker recebido para validar!');
     if (!isProcessingTask) {
       runValidateMakers().catch(err => console.error('[ValidateMakers] Erro no gatilho realtime:', err.message));
     } else {
       console.log('[REALTIME] Worker ocupado. A validação será processada pelo ciclo regular.');
     }
  })
  .subscribe();

const processC2Command = async (cmd) => {
  if (!cmd || cmd.worker_id !== WORKER_ID || cmd.executed) return;

  // Proteção contra comandos antigos/stale acumulados no banco de dados
  const createdAt = new Date(cmd.created_at || Date.now()).getTime();
  const ageSeconds = Math.round((Date.now() - createdAt) / 1000);
  const maxAge = cmd.command === 'RESTART_PC' ? 60 : 300; // RESTART_PC expira em 60s, outros em 5 min

  if (ageSeconds > maxAge) {
    console.warn(`[C2 COMMAND] ⚠️ Comando ${cmd.command} expirado ignorado (criado há ${ageSeconds}s atrás, limite: ${maxAge}s).`);
    await supabase.from('worker_commands').update({ executed: true, executed_at: new Date().toISOString() }).eq('id', cmd.id);
    return;
  }

  console.log(`\n[C2 COMMAND] Executando comando: ${cmd.command} (idade: ${ageSeconds}s)`);

  try {
    // Marcar como executado imediatamente para evitar duplicação
    await supabase.from('worker_commands').update({ executed: true, executed_at: new Date().toISOString() }).eq('id', cmd.id);

    if (cmd.command === 'POPUP_MESSAGE') {
       notifier.notify({
         title: 'Mensagem do Admin (BattleStorm)',
         message: cmd.payload?.message || 'Sem mensagem',
         icon: path.join(WORKER_ROOT, 'icon.png'),
         sound: true
       });
    } else if (cmd.command === 'RESTART_PC') {
       console.log('[C2 COMMAND] Reiniciando computador...');
       if (os.platform() === 'win32') {
          exec('shutdown /r /t 0', { windowsHide: true });
       } else {
          exec('sudo reboot');
       }
    } else if (cmd.command === 'RESTART_WORKER' || cmd.command === 'FORCE_UPDATE') {
       console.log('[C2 COMMAND] Reiniciando Worker / Aplicando Updates...');
       await checkForUpdates();
       process.exit(0);
    } else if (cmd.command === 'CLEAN_STORAGE') {
       console.log('[C2 COMMAND] 🧹 Executando manutenção preventiva de armazenamento...');
       cleanWorkerProfileCaches();
       runFullStorageMaintenance();
    } else if (cmd.command === 'KILL_BROWSER') {
       console.log('[C2 COMMAND] 🛑 Fechando instâncias do navegador...');
       await closeBrowser();
    } else if (cmd.command === 'FORCE_TASK') {
       const requestedTask = cmd.payload?.task_type;
       if (requestedTask) {
          console.log(`[C2 COMMAND] ⚡ Forçando liberação e execução imediata da tarefa: ${requestedTask}`);
          await supabase
            .from('task_queue')
            .update({ status: 'PENDING', locked_at: null, worker_id: null })
            .eq('task_type', requestedTask);
       }
    } else if (cmd.command === 'FETCH_LOGS') {
        console.log('[C2 COMMAND] 📄 Transmitindo logs recentes do terminal para o Dashboard...');
        currentTerminalLogs = recentLogs.join('\n');
        currentTerminalLogsUpdatedAt = new Date().toISOString();
        const disk = getDiskHealth();
        const memoryMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
        const uptimeSec = Math.round((Date.now() - new Date(WORKER_STARTED).getTime()) / 1000);
        const avgDuration = totalTasksCompletedCount > 0 ? Math.round(totalExecutionTimeMs / totalTasksCompletedCount) : null;
        await supabase
          .from('worker_heartbeats')
          .update({
            metadata: {
              ...WORKER_METADATA,
              disk_free_gb: disk.freeGb,
              disk_total_gb: disk.totalGb,
              disk_percent_free: disk.percentFree,
              disk_warning: disk.isLowDisk,
              disk_text: disk.text,
              current_task: isProcessingTask ? currentTaskType : 'IDLE',
              tasks_completed: totalTasksCompleted,
              memory_mb: memoryMb,
              uptime_seconds: uptimeSec,
              avg_task_duration_ms: avgDuration,
              last_error: lastWorkerError,
              terminal_logs: currentTerminalLogs,
              terminal_logs_updated_at: currentTerminalLogsUpdatedAt,
            }
          })
          .eq('worker_id', WORKER_ID);
        console.log('[C2 COMMAND] 📄 Logs remotos transmitidos com sucesso.');
     } else if (cmd.command === 'PAUSE_WORKER') {
        console.log('[C2 COMMAND] ⏸️ Worker pausado/desligado remotamente pelo Dashboard!');
        isWorkerPaused = true;
        try { await closeBrowser(); } catch (e) {}
        await sendHeartbeat();
     } else if (cmd.command === 'RESUME_WORKER') {
        console.log('[C2 COMMAND] ▶️ Worker retomado/ligado remotamente pelo Dashboard!');
        isWorkerPaused = false;
        await sendHeartbeat();
     }

    console.log(`[C2 COMMAND] ✅ Comando ${cmd.command} executado com sucesso.`);
  } catch (e) {
    console.log(`[C2 COMMAND] ❌ Erro ao executar: ${e.message}`);
  }
};

// Polling fallback a cada 15s para garantir que comandos pendentes sejam executados mesmo se o Realtime falhar
const checkPendingCommands = async () => {
  try {
    const { data: pending } = await supabase
      .from('worker_commands')
      .select('*')
      .eq('worker_id', WORKER_ID)
      .eq('executed', false);

    if (pending && pending.length > 0) {
      for (const cmd of pending) {
        await processC2Command(cmd);
      }
    }
  } catch (err) {
    // ignora erro de polling
  }
};

// Inicia escuta Realtime
supabase
  .channel('worker_commands')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'worker_commands' }, async (payload) => {
     await processC2Command(payload.new);
  })
  .subscribe();

  // Inicia polling backup a cada 15 segundos
  setInterval(checkPendingCommands, 15000);
  checkPendingCommands();
  
  // Polling de Seguranca para Invites a cada 60s (executa somente se o worker estiver ocioso)
  setInterval(() => {
    if (!isProcessingTask) {
      runProcessAutoInvites();
    }
  }, 60000);

  // Polling de Seguranca para Onlines a cada 45s (executa somente se o worker estiver ocioso)
  setInterval(() => {
    if (!isProcessingTask) {
      runFetchOnlines().catch(err => console.error('[FETCH_ONLINES] Erro no polling de segurança:', err.message));
    }
  }, 45000);

  // Fechamento e arquivamento de sessões inativas a cada 10 min
  setInterval(() => {
    runCloseSessions().catch(err => console.error('[CLOSE_SESSIONS] Erro:', err.message));
  }, 10 * 60 * 1000);

// GATILHO DE ALARMES GERAIS (DESKTOP E WEB PUSH NOTIFICATIONS)
const processedAlarms = new Set();
import webpush from 'web-push';

supabase
  .channel('guild_alarms')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guild_alarms' }, async (payload) => {
     const alarm = payload.new;
     if (processedAlarms.has(alarm.id)) return;
     processedAlarms.add(alarm.id);
     
     if (processedAlarms.size > 100) {
       const iterator = processedAlarms.values();
       processedAlarms.delete(iterator.next().value);
     }

     console.log(`\n[ALARME] 🚨 ${alarm.type}: ${alarm.message}`);
     
     // 1. Notificação Nativa (Desktop do Worker)
     notifier.notify({
       title: `BattleStorm - ${alarm.type}`,
       message: alarm.message,
       icon: path.join(WORKER_ROOT, 'icon.png'),
       appID: 'BattleStorm',
       sound: true, 
       wait: false
     });

     // 2. Notificação Web Push (Navegadores/Celulares da Guilda)
     try {
       // --- ELEIÇÃO DE LÍDER ---
       // Apenas 1 worker deve disparar o Web Push para não floodar os celulares!
       const cutoffLimit = new Date(Date.now() - 12 * 60 * 1000).toISOString();
       const { data: onlineWorkers } = await supabase
         .from('worker_heartbeats')
         .select('worker_id')
         .gte('last_ping', cutoffLimit)
         .order('started_at', { ascending: true })
         .order('worker_id', { ascending: true })
         .limit(1);
         
       const isLeader = onlineWorkers && onlineWorkers.length > 0 && onlineWorkers[0].worker_id === WORKER_ID;
       if (!isLeader) {
         console.log(`[WEB PUSH] Outro worker assumiu a liderança do disparo. Silenciando...`);
         return;
       }

       // Puxa as chaves VAPID
       const { data: config } = await supabase.from('worker_config').select('vapid_public_key, vapid_private_key').eq('id', 1).maybeSingle();
       if (!config || !config.vapid_public_key || !config.vapid_private_key) return;

       webpush.setVapidDetails(
         'mailto:admin@battlestorm.com',
         config.vapid_public_key,
         config.vapid_private_key
       );

       // Puxa todas as inscrições
       const { data: subs } = await supabase.from('push_subscriptions').select('*');
       if (!subs || subs.length === 0) return;

       console.log(`[WEB PUSH] Disparando para ${subs.length} navegadores...`);
       
       const pushPayload = JSON.stringify({
         title: `BattleStorm - ${alarm.type}`,
         body: alarm.message,
         icon: '/pwa-192x192.png',
         badge: '/pwa-192x192.png',
         url: '/'
       });

       // Dispara em paralelo para todos
       await Promise.all(subs.map(async (sub) => {
         try {
           await webpush.sendNotification(sub.subscription, pushPayload);
         } catch (err) {
           if (err.statusCode === 410 || err.statusCode === 404) {
             // Inscrição expirou ou foi revogada pelo usuário, removemos do banco
             await supabase.from('push_subscriptions').delete().eq('id', sub.id);
           }
         }
       }));
       console.log(`[WEB PUSH] ✅ Disparo concluído!`);
     } catch (e) {
       console.log(`[WEB PUSH] Erro ao disparar:`, e.message);
     }
  })
  .subscribe();

