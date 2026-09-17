import fs from 'fs';
import path from 'path';
import { supabase } from './src/db.js';

async function run() {
  const jsonPath = path.resolve('./data/respawns.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('Arquivo respawns.json não encontrado em', jsonPath);
    return;
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Encontrados ${data.length} respawns no JSON.`);
  for (const r of data) {
    await supabase.from('respawns').upsert({ id: r.id, name: r.name, category: r.category });
  }
  console.log('Respawns importados com sucesso para o Supabase!');
}

run().catch(console.error);
