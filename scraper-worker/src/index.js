import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import { supabase } from './db.js';
import { exec } from 'child_process';
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
import { runAuditBank } from './jobs/auditBank.js';
import { checkForUpdates } from './updater.js';
import { applySelfHealingPatch } from './selfHeal.js';
import { closeBrowser } from './lib/rubinotScraper.js';

applySelfHealingPatch();

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

    const orQuery = `and(status.eq.PENDING,or(locked_at.is.null,locked_at.lte.${new Date().toISOString()})),and(status.eq.IN_PROGRESS,locked_at.lte.${crashLimit.toISOString()})`;

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
  // Cooldown em SEGUNDOS por tipo de tarefa
  const cooldowns = {
    FETCH_ONLINES: 30,     // 30s
    FETCH_DEATHS: 30,      // 30s
    FETCH_RIVALS: 60,      // 1m
    FETCH_GUILD: 3600,     // 1h
    FETCH_BAZAAR: 3600,    // 1h
    FETCH_ROSTER_SHARD: 900, // 15m
    AUDIT_SLOTS: 600,      // 10m
    FETCH_KILLSTATS: 900,  // 15m
    FETCH_TRANSFERS: 3600, // 60m
    CLOSE_SESSIONS: 1800,  // 30m
  };

  let cooldownSeconds = cooldowns[task.task_type] ?? 60;
  if (task.task_type.startsWith('FETCH_HIGHSCORE')) cooldownSeconds = 600; // 10m

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

const processTask = async (task) => {
  const ts = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`\n[WORKER] ▶ [${ts}] Processando: ${task.task_type} (ID: ${task.id})`);
  const startTime = Date.now();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => { reject(new Error('CRITICAL_TIMEOUT')); }, 10 * 60 * 1000);
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
const WORKER_VERSION = '1.5.2';
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

// Primeiro heartbeat imediato, depois a cada 1 minuto
setTimeout(() => {
  sendHeartbeat();
  setInterval(sendHeartbeat, 60 * 1000);
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

import notifier from 'node-notifier';


supabase
  .channel('maker_validation')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'maker_validation_queue' }, (payload) => {
     console.log('\n[REALTIME] Novo maker recebido para validar!');
     runValidateMakers();
  })
  .subscribe();

// ==========================================
// C2 DASHBOARD COMMAND LISTENER
// ==========================================
supabase
  .channel('worker_commands')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'worker_commands' }, async (payload) => {
     const cmd = payload.new;
     if (cmd.worker_id !== WORKER_ID) return; // Ignora comandos para outros workers
     if (cmd.executed) return;

     console.log(`\n[C2 COMMAND] Recebido comando do SuperAdmin: ${cmd.command}`);

     try {
       if (cmd.command === 'POPUP_MESSAGE') {
          notifier.notify({
            title: 'Mensagem do Admin (BattleStorm)',
            message: cmd.payload?.message || 'Sem mensagem',
            icon: path.join(process.cwd(), 'icon.png'),
            sound: true
          });
       } else if (cmd.command === 'RESTART_PC') {
          console.log('[C2 COMMAND] Reiniciando computador...');
          if (os.platform() === 'win32') {
             exec('shutdown /r /t 0');
          } else {
             exec('sudo reboot');
          }
       } else if (cmd.command === 'FORCE_UPDATE') {
          console.log('[C2 COMMAND] Forçando atualização do repositório...');
          await checkForUpdates();
          process.exit(0);
       }

       // Marcar como executado
       await supabase.from('worker_commands').update({ executed: true, executed_at: new Date().toISOString() }).eq('id', cmd.id);
       console.log(`[C2 COMMAND] ✅ Comando executado com sucesso.`);
     } catch (e) {
       console.log(`[C2 COMMAND] ❌ Erro ao executar: ${e.message}`);
     }
  })
  .subscribe();

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
       icon: path.join(process.cwd(), 'icon.png'),
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
       const { data: config } = await supabase.from('worker_config').select('vapid_public_key, vapid_private_key').eq('id', 1).single();
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

