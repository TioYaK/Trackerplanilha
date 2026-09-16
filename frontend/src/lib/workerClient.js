/**
 * Utilitário de Descoberta e Comunicação com o Worker Local
 * Varre portas candidatas (3001 a 3005) para detectar automaticamente o worker mesmo que
 * a porta padrão (3001) esteja ocupada por outro projeto (como Next.js ou outro servidor).
 */

const CANDIDATE_PORTS = [3001, 3002, 3003, 3004, 3005];
let cachedActivePort = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 15000; // 15 segundos

async function pingPort(port, timeoutMs = 1200) {
  try {
    const res = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'online' && data.worker_id) {
        return { port, data };
      }
    }
  } catch (e) {
    // Porta não acessível
  }
  return null;
}

export async function detectLocalWorker(forceRefresh = false) {
  if (typeof window === 'undefined') return null;

  const now = Date.now();
  if (!forceRefresh && cachedActivePort && (now - lastCheckTime < CACHE_TTL_MS)) {
    const quick = await pingPort(cachedActivePort, 800);
    if (quick) {
      lastCheckTime = now;
      return quick;
    }
  }

  try {
    const promises = CANDIDATE_PORTS.map(p => pingPort(p, 1200));
    const results = await Promise.all(promises);
    const found = results.find(r => r !== null);

    if (found) {
      cachedActivePort = found.port;
      lastCheckTime = now;
      return found;
    }
  } catch (err) {
    console.warn('[WorkerClient] Erro na varredura de portas:', err);
  }

  cachedActivePort = null;
  return null;
}

export async function fetchFromLocalWorker(path, options = {}) {
  const workerInfo = await detectLocalWorker();
  if (!workerInfo) return null;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  try {
    const res = await fetch(`http://localhost:${workerInfo.port}${normalizedPath}`, {
      ...options,
      signal: options.signal || AbortSignal.timeout(6000)
    });
    return res;
  } catch (e) {
    console.warn(`[WorkerClient] Falha ao comunicar com worker na porta ${workerInfo.port}:`, e.message);
    return null;
  }
}
