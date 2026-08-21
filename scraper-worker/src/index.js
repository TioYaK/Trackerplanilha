import { supabase } from './db.js';
import { runFetchGuild } from './jobs/fetchGuild.js';
import { runFetchOnlines } from './jobs/fetchOnlines.js';
import { runFetchHighscores } from './jobs/fetchHighscores.js';

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
      .order('id', { ascending: true })
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
  await supabase
    .from('task_queue')
    .update({ status: 'COMPLETED' })
    .eq('id', taskId);
};

const requeueTask = async (taskId) => {
  // Para tarefas recorrentes, voltamos para PENDING para a próxima rodada do cron externo,
  // ou lidamos via crontab. Neste exemplo, completamos.
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

const loop = async () => {
  const task = await fetchTask();
  if (task) {
    await processTask(task);
    setTimeout(loop, 1000); // Se achou tarefa, tenta achar outra logo em seguida
  } else {
    setTimeout(loop, POLL_INTERVAL); // Se não achou, dorme
  }
};

// Iniciar Loop
loop();
