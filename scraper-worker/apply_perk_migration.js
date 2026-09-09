import { supabase } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.resolve(__dirname, '../database/migrations/create_guild_perks_system.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('Aplicando migração do Sistema de Perks no Supabase...');
  
  // Tenta via execute_sql RPC
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
  if (error) {
    console.error('Erro ao executar RPC execute_sql:', error);
  } else {
    console.log('✅ Migração executada com sucesso via execute_sql!');
  }

  // Verifica se as tabelas respondem
  const { data: testSettings, error: errSettings } = await supabase.from('guild_perk_settings').select('*').limit(1);
  if (errSettings) {
    console.error('Falha ao consultar guild_perk_settings:', errSettings.message);
  } else {
    console.log('✅ Tabela guild_perk_settings confirmada:', testSettings);
  }
}

main();
