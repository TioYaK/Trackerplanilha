import { supabase } from './supabase';

// Gera ou recupera um ID de sessão temporário
const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('rubinot_sid');
  if (!sid) {
    sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem('rubinot_sid', sid);
  }
  return sid;
};

let lastLog = { view: '', timestamp: 0 };

/**
 * Registra navegação de página/view de forma assíncrona e resiliente
 */
export async function trackPageView({ view, path, world, user, profile, isPremium, isAdmin }) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  // Evita spam na mesma aba em menos de 5 segundos
  if (lastLog.view === view && now - lastLog.timestamp < 5000) {
    return;
  }
  lastLog = { view, timestamp: now };

  const role = isAdmin ? 'admin' : (user ? 'user' : 'visitor');
  const sessionId = getSessionId();
  const currentWorld = world || 'Global';

  // 1. Armazena no LocalStorage para telemetria local instantânea (mesmo sem SQL rodado)
  try {
    const rawLocal = localStorage.getItem('rubinot_local_views');
    const localStats = rawLocal ? JSON.parse(rawLocal) : {};
    const key = `${view}`;
    localStats[key] = (localStats[key] || 0) + 1;
    localStorage.setItem('rubinot_local_views', JSON.stringify(localStats));
  } catch {}

  // 2. Registra no Supabase de forma totalmente silenciosa
  try {
    const payload = {
      view_name: view,
      path: path || window.location.pathname,
      world: currentWorld,
      user_id: user?.id || null,
      user_role: role,
      is_premium: Boolean(isPremium),
      referrer: typeof document !== 'undefined' ? (document.referrer || null) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
      session_id: sessionId
    };

    // Chamada 'fire-and-forget'
    supabase
      .from('site_access_logs')
      .insert([payload])
      .then(() => {})
      .catch(() => {});
  } catch {
    // Silencioso para não interromper navegação
  }
}
