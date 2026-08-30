import { supabase } from './src/db.js';
const run = async () => {
  const tasks = ['FETCH_DEATHS', 'FETCH_KILLSTATS', 'FETCH_TRANSFERS', 'FETCH_RIVALS', 'AUDIT_SLOTS'];
  for (const t of tasks) {
    const { data, error } = await supabase.from('task_queue').insert({ task_type: t, status: 'PENDING', locked_at: new Date().toISOString() });
    console.log(t, ':', error ? error.message : 'OK');
  }
}
run();
