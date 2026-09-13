import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient = null;

if (supabaseUrl && supabaseKey) {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('[DB] 🛡️ Operando em modo de Ingestao Segura via API Gateway (Zero-Trust: sem chaves diretas do banco).');
}

export const supabase = supabaseClient;

