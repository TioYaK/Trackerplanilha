import { supabase } from './src/db.js';
const run = async () => {
  const { data, error } = await supabase.from('worker_config').update({ min_worker_version: '1.1.0' }).eq('id', 1);
  console.log('Update config:', data, error);
}
run();
