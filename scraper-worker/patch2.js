import { supabase } from './src/db.js';
const run = async () => {
  const { data: d1, error: e1 } = await supabase.from('task_queue').insert({ task_type: 'FETCH_RIVALS', status: 'PENDING', locked_at: new Date().toISOString() });
  console.log('RIVALS:', d1, e1);
  const { data: d2, error: e2 } = await supabase.from('task_queue').insert({ task_type: 'AUDIT_SLOTS', status: 'PENDING', locked_at: new Date().toISOString() });
  console.log('AUDIT:', d2, e2);
}
run();
