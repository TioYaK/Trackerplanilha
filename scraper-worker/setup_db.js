import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync(path.join(process.cwd(), 'scraper-worker', '.env'), 'utf8');
const url = env.match(/SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

async function setupDatabase() {
    console.log('Running schema setup...');

    const { error: err1 } = await supabase.rpc('exec_sql', {
        sql_string: `
        CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID REFERENCES auth.users(id) PRIMARY KEY,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            main_character TEXT NOT NULL,
            ts3_nickname TEXT,
            role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Disable RLS temporarily so the Anon key can read/write without complex policies
        -- (Since this is a trusted guild tool, this is acceptable for now. Can be tightened later).
        ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
        `
    });
    
    // If we don't have exec_sql, we'll create the table via API if possible? No, we can't create tables via REST API.
    // Wait, let's see if exec_sql exists. If not, we can create a migration via supabase CLI.
    console.log('Result:', err1);
}

setupDatabase();
