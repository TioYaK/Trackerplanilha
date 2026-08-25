import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });
import { supabase } from './db.js';
import { runFetchGuild } from './jobs/fetchGuild.js';
import { runFetchOnlines } from './jobs/fetchOnlines.js';
import { runFetchHighscores } from './jobs/fetchHighscores.js';
import { runAuditSlots } from './jobs/auditSlots.js';
import { runBankSync } from './jobs/syncBankTS3.js';
import { checkForUpdates } from './updater.js';

const WORKER_ID = `worker-${Math.random().toString(36).substring(2, 9)}`;
const POLL_INTERVAL = 5000; // 5 segundos
const LOCK_TIMEOUT_MINUTES = 3;

console.log(`[WORKER] Iniciando worker ID: ${WORKER_ID}`);

const fetchTask = async () => {
  try {
    // Busca a próxima tarefa PENDING ou IN_PROGRESS presa há muito tempo
    const timeLimit = new Date();
    timeLimit.setMinutes(timeLimit.getMinutes() - LOCK_TIMEOUT_MINUTES);

    const { data: tasks, error } = await supabase
      .from('task_queue')
      .select('*')
      .or(`status.eq.PENDING,and(status.eq.IN_PROGRESS,locked_at.lt.${timeLimit.toISOString()})`)
      .order('updated_at', { ascending: true })
      .limit(1);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return null;

    const task = tasks[0];

    // Tenta aplicar o lock (usamos match para garantir que ninguém pegou no meio tempo)
    const { data: updatedTask, error: updateError } = await supabase
      .from('task_queue')
      .update({
        status: 'IN_PROGRESS',
        worker_id: WORKER_ID,
        locked_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .eq('status', task.status) // Concorrência otimista
      .select()
      .single();

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
  // Para manter o worker em loop infinito para as outras tarefas core (guild, highscores)
  await supabase
    .from('task_queue')
    .update({ status: 'PENDING', locked_at: null, worker_id: null })
    .eq('id', task.id);
};

const requeueTask = async (task) => {
  await completeTask(task);
};

const processTask = async (task) => {
  console.log(`[WORKER] Processando tarefa ${task.task_type} (ID: ${task.id})`);
  
  try {
    switch (task.task_type) {
      case 'FETCH_GUILD':
        await runFetchGuild();
        break;
      case 'FETCH_ONLINES':
        await runFetchOnlines();
        break;
      case 'FETCH_HIGHSCORE':
        await runFetchHighscores(task.page_number || 1);
        await runAuditSlots();
        break;
      case 'AUDIT_SLOTS':
        await runAuditSlots();
        break;
      default:
        console.log(`[WORKER] Tipo de tarefa desconhecido: ${task.task_type}`);
    }

    // Após terminar, completa a tarefa
    await requeueTask(task);
  } catch (error) {
    console.error(`[WORKER] Falha na tarefa ${task.id}:`, error.message);
    // Volta pra fila em caso de erro, mas sem worker (timeout)
    await supabase.from('task_queue').update({ status: 'PENDING' }).eq('id', task.id);
  }
};

// Temporizador para não fazer git pull todo segundo, a cada 1 hora ou a cada ciclo vazio longo
let emptyCycles = 0;

const loop = async () => {
  const task = await fetchTask();
  if (task) {
    emptyCycles = 0;
    await processTask(task);
    setTimeout(loop, 1000); // Se achou tarefa, tenta achar outra logo em seguida
  } else {
    emptyCycles++;
    // Se ficou ocioso por 12 ciclos (aprox 1 minuto), checa atualização no GitHub
    if (emptyCycles % 12 === 0) {
        await checkForUpdates();
    }
    setTimeout(loop, POLL_INTERVAL); // Se não achou, dorme
  }
};

// Iniciar Loop
loop();

// ==========================================
// TAREFAS AGENDADAS INDEPENDENTES DA FILA
// ==========================================

// Sincroniza o Banco FBot (TS3) a cada 5 minutos cravados!
// Indepedente da fila do Supabase, garantindo que usuários que logam em 
// horários bizarros não fiquem de fora.
setInterval(async () => {
  console.log('[CRON] Rodando Sincronização Automática do TS3 (5 min)...');
  await runBankSync();
}, 5 * 60 * 1000);

// ==========================================


// ==========================================
// SERVIDOR ADMIN LOCAL (Forcar TS3 Sync)
// ==========================================
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/admin/force-ts3', async (req, res) => {
    try {
        console.log('[API_ADMIN] Recebido comando manual para forcar TS3 Sync!');
        // Roda o sync
        await runBankSync();
        res.json({ success: true, message: 'TS3 Sincronizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3001, () => {
    console.log('[API_ADMIN] Servidor local escutando na porta 3001 para comandos (TS3).');
});
