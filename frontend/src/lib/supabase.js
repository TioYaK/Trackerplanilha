import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 25,
    },
    timeout: 30000,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Reconexão resiliente em caso de oscilação de Wi-Fi ou sleep do SO
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    try {
      if (supabase?.realtime) {
        supabase.realtime.connect();
      }
    } catch {}
  });
}
