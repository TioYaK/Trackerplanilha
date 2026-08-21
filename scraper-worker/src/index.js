import { supabase } from './db.js';
import { runFetchGuild } from './jobs/fetchGuild.js';
import { runFetchOnlines } from './jobs/fetchOnlines.js';
import { runFetchHighscores } from './jobs/fetchHighscores.js';
import { runAuditSlots } from './jobs/auditSlots.js';
import { exec } from 'child_process';

const WORKER_ID = `worker-${Math.random().toString(36).substring(2, 9)}`;
const POLL_INTERVAL = 5000; // 5 segundos
const LOCK_TIMEOUT_MINUTES = 3;

// Função de Auto-Update via GitHub
const checkForUpdates = () => {
  return new Promise((resolve) => {
    exec('git pull', (error, stdout, stderr) => {
      if (error) {
        console.error('[UPDATER] Erro ao buscar atualizações:', error.message);
        resolve(false);
        return;
      }
      if (stdout && !stdout.includes('Already up to date')) {
        console.log('[UPDATER] Nova atualização encontrada no GitHub! Código baixado.');
        console.log('[UPDATER] Reiniciando worker para aplicar alterações...');
        process.exit(0); // O PM2 vai automaticamente reviver o processo rodando o novo código
      } else {
        resolve(false);
      }
    });
  });
};

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

const completeTask = async (taskId) => {
  // Para manter o worker em loop infinito, voltamos a tarefa para PENDING.
  // Assim ele sempre fica atualizando a guild, onlines, highscores e audit slots continuamente.
  await supabase
    .from('task_queue')
    .update({ status: 'PENDING', locked_at: null, worker_id: null })
    .eq('id', taskId);
};

const requeueTask = async (taskId) => {
  await completeTask(taskId);
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
    await requeueTask(task.id);
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
    setTimeout(loop, POLL_INTERVAL); // Se não achou, dorme
  }
};

// Iniciar Loop
loop();
