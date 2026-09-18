'use strict';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';



/**
 * Localizador Universal de Navegadores (Cross-Platform).
 * Funciona em Windows, Linux e macOS, procurando instalações de sistema ou usuário.
 * NUNCA utiliza o Microsoft Edge para não interferir com o navegador pessoal do usuário.
 */
export function findUniversalChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  // 1. Prioriza o Chromium isolado do Puppeteer (totalmente independente do sistema)
  const puppeteerDir = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (fs.existsSync(puppeteerDir)) {
    try {
      const versions = fs.readdirSync(puppeteerDir);
      for (const ver of versions) {
        const candidateWin = path.join(puppeteerDir, ver, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(candidateWin)) return candidateWin;
        const candidateLinux = path.join(puppeteerDir, ver, 'chrome-linux64', 'chrome');
        if (fs.existsSync(candidateLinux)) return candidateLinux;
      }
    } catch {}
  }

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  const candidates = [
    // Windows - Google Chrome (Sistema e LocalAppData)
    isWin && 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    isWin && 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    isWin && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),

    // Windows - Brave Browser
    isWin && 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    isWin && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),

    // Linux (Ubuntu, Debian, CentOS, Docker, VPS)
    isLinux && '/usr/bin/google-chrome',
    isLinux && '/usr/bin/google-chrome-stable',
    isLinux && '/usr/bin/chromium',
    isLinux && '/usr/bin/chromium-browser',
    isLinux && '/snap/bin/chromium',

    // macOS
    isMac && '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    isMac && '/Applications/Chromium.app/Contents/MacOS/Chromium',
    isMac && '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',

    // Windows - Microsoft Edge (Fallback exclusivo de segurança para workers remotos sem Chrome instalado)
    isWin && 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    isWin && 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    isWin && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft\\Edge\\Application\\msedge.exe'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (typeof p === 'string' && fs.existsSync(p)) return p;
  }

  return null; // Puppeteer usará o Chromium interno se disponível
}

/**
 * Retorna caminho seguro para screenshots de depuração dentro da pasta do projeto.
 */
export function getDebugScreenshotPath(name) {
  const dir = path.join(process.cwd(), 'debug_screenshots');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return path.join(dir, name);
}

/**
 * Limpa perfis e arquivos temporários órfãos do Puppeteer, Chrome e Edge no Temp do sistema operacional.
 */
export function cleanStalePuppeteerProfiles(maxAgeMinutes = 10) {
  try {
    const tempDir = os.tmpdir();
    if (!fs.existsSync(tempDir)) return 0;

    const entries = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    let removedDirs = 0;
    let removedFiles = 0;

    const dirPrefixes = [
      'headlessedge',
      'puppeteer_dev_',
      'puppeteer-bazaar-',
      'puppeteer-',
      'scoped_dir',
      'importer_',
      '.org.chromium.',
      '.com.google.chrome.'
    ];

    for (const entry of entries) {
      const lower = entry.toLowerCase();
      const isDirMatch = dirPrefixes.some(p => lower.startsWith(p));
      const isFileMatch = lower.startsWith('~dfcache_') || 
                          (lower.startsWith('wct') && lower.endsWith('.tmp')) ||
                          lower.startsWith('worker_update_') ||
                          lower.startsWith('.org.chromium.');

      if (isDirMatch || isFileMatch) {
        const fullPath = path.join(tempDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          const isStale = (now - stat.mtimeMs > maxAgeMs);

          if (stat.isDirectory() && isStale) {
            fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 0 });
            removedDirs++;
          } else if (stat.isFile() && isStale) {
            fs.unlinkSync(fullPath);
            removedFiles++;
          }
        } catch {
          // Arquivo bloqueado por processo ativo em execução, ignora com segurança
        }
      }
    }

    const total = removedDirs + removedFiles;
    if (total > 0) {
      console.log(`[STORAGE] 🧹 Limpeza de Temp: ${removedDirs} pastas e ${removedFiles} arquivos órfãos removidos.`);
    }
    return total;
  } catch (err) {
    console.warn('[STORAGE] Aviso ao limpar Temp:', err.message);
    return 0;
  }
}

/**
 * Limpa caches e telemetria não essenciais das pastas de perfil do worker (worker_profiles).
 * Preserva estritamente: Cookies, Local Storage, Preferences, Login Data.
 */
export function cleanWorkerProfileCaches() {
  try {
    const candidateDirs = [];

    const cwdDir = path.join(process.cwd(), 'worker_profiles');
    if (fs.existsSync(cwdDir)) candidateDirs.push(cwdDir);

    try {
      const moduleDir = path.dirname(fileURLToPath(import.meta.url));
      const workerProfiles = path.resolve(moduleDir, '../../worker_profiles');
      if (fs.existsSync(workerProfiles) && !candidateDirs.includes(workerProfiles)) {
        candidateDirs.push(workerProfiles);
      }
      const rootProfiles = path.resolve(moduleDir, '../../../worker_profiles');
      if (fs.existsSync(rootProfiles) && !candidateDirs.includes(rootProfiles)) {
        candidateDirs.push(rootProfiles);
      }
    } catch {}

    if (process.env.APPDATA) {
      const appDataProfiles = path.join(process.env.APPDATA, 'AuroriaWorker', 'scraper-worker', 'worker_profiles');
      if (fs.existsSync(appDataProfiles) && !candidateDirs.includes(appDataProfiles)) {
        candidateDirs.push(appDataProfiles);
      }
    }

    if (candidateDirs.length === 0) return 0;

    const bloatDirNames = [
      'Cache',
      'Code Cache',
      'GPUCache',
      'Crashpad',
      'DawnCache',
      'DawnGraphiteCache',
      'DawnWebGPUCache',
      'Shared Dictionary',
      'component_crx_cache',
      'blob_storage',
      'commerce_subscription_db',
      'coupon_db',
      'discounts_db',
      'chrome_cart_db',
      'parcel_tracking_db',
      'Feature Engagement Tracker',
      'Site Characteristics Database',
      'power_bookmarks',
      'ProvenanceData',
      'ProvenanceDataTensors',
      'Edge Entity Extraction',
      'EdgeLanguageDetectionModel',
      'Edge Wallet',
      'Edge Shopping',
      'Edge Web Discover',
      'Edge Collections',
      'Edge Sidebar',
      'Edge Signal Triggers',
      'EdgeCoupons',
      'EdgeHub',
      'Speech Recognition',
      'GrShaderCache',
      'ShaderCache',
      'BrowserMetrics',
      'DeferredBrowserMetrics',
      'OptimizationHints',
      'SafetyTips',
      'Subresource Filter',
      'Certificate Revocation',
      'File Type Policies',
      'Crowd Deny',
      'OnDeviceHeadSuggestModel',
      'SmartScreen',
      'Recovery',
      'Autofill',
      'AutofillStates',
      'hyphen-data',
      'Typosquatting',
      'Well Known Domains',
      'ZxcvbnData',
      'segmentation_platform'
    ];

    const bloatFileNames = [
      'History',
      'History-journal',
      'load_statistics.db',
      'load_statistics.db-journal',
      'load_statistics.db-wal',
      'load_statistics.db-shm',
      'Visited Links',
      'Top Sites',
      'Top Sites-journal',
      'Shortcuts',
      'Shortcuts-journal',
      'Network Action Predictor',
      'Network Action Predictor-journal',
      'heavy_ad_intervention_opt_out.db',
      'heavy_ad_intervention_opt_out.db-journal'
    ];

    // Perfis obsoletos de testes antigos a descartar completamente
    const obsoleteProfileDirs = ['auroria', 'auroria_launcher', 'auroria_warmed', 'test_solver', 'puppeteer_auroria_profile'];

    let pruned = 0;

    for (const baseDir of candidateDirs) {
      let entries = [];
      try { entries = fs.readdirSync(baseDir); } catch { continue; }

      for (const pDir of entries) {
        const fullPDir = path.join(baseDir, pDir);
        try {
          const stat = fs.statSync(fullPDir);
          if (!stat.isDirectory()) continue;

          // Se for perfil de teste obsoleto, descarta por completo
          if (obsoleteProfileDirs.includes(pDir)) {
            try {
              fs.rmSync(fullPDir, { recursive: true, force: true, maxRetries: 1 });
              pruned++;
              continue;
            } catch {}
          }

          // Limpa stale locks primeiro
          cleanStaleLocks(fullPDir);
          cleanStaleLocks(path.join(fullPDir, 'Default'));

          // Varredura recursiva arquivo a arquivo para métricas (.pma), dumps (.dmp) e temporários (.tmp)
          const purgePmaRecursively = (dir) => {
            try {
              const dirEntries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of dirEntries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  purgePmaRecursively(full);
                  const lowerDir = entry.name.toLowerCase();
                  if (lowerDir === 'deferredbrowsermetrics' || lowerDir === 'browsermetrics' || lowerDir === 'crashpad' || lowerDir === 'dawncache') {
                    try { fs.rmdirSync(full); pruned++; } catch {}
                  }
                } else if (entry.isFile()) {
                  const lowerName = entry.name.toLowerCase();
                  if (
                    lowerName.endsWith('.pma') ||
                    lowerName.startsWith('browsermetrics-') ||
                    lowerName.endsWith('.dmp') ||
                    lowerName.endsWith('.tmp')
                  ) {
                    try { fs.unlinkSync(full); pruned++; } catch {}
                  }
                }
              }
            } catch {}
          };
          purgePmaRecursively(fullPDir);

          const checkBases = [fullPDir, path.join(fullPDir, 'Default')];
          for (const base of checkBases) {
            if (!fs.existsSync(base)) continue;

            // 1. Remove pastas de bloat/cache
            for (const cName of bloatDirNames) {
              const target = path.join(base, cName);
              if (fs.existsSync(target)) {
                try {
                  fs.rmSync(target, { recursive: true, force: true, maxRetries: 1 });
                  pruned++;
                } catch {
                  // Se o diretório contiver algum arquivo travado, remove individualmente os destravados
                  try {
                    const subEntries = fs.readdirSync(target);
                    for (const sub of subEntries) {
                      try { fs.unlinkSync(path.join(target, sub)); pruned++; } catch {}
                    }
                  } catch {}
                }
              }
            }

            // 2. Remove arquivos de telemetria, métricas (*.pma), *.tmp e histórico
            try {
              const items = fs.readdirSync(base);
              for (const item of items) {
                const lowerItem = item.toLowerCase();
                const isBloatFile = bloatFileNames.includes(item) ||
                                    lowerItem.endsWith('.pma') ||
                                    lowerItem.endsWith('.tmp') ||
                                    lowerItem.endsWith('.dmp') ||
                                    lowerItem.startsWith('browsermetrics-');

                if (isBloatFile) {
                  try {
                    fs.unlinkSync(path.join(base, item));
                    pruned++;
                  } catch {}
                }
              }
            } catch {}
          }
        } catch {}
      }
    }

    // 3. Limpa dumps soltos de HTML/PNG na pasta do scraper-worker
    try {
      const moduleDir = path.dirname(fileURLToPath(import.meta.url));
      const workerRoot = path.resolve(moduleDir, '../../');
      const dumpFiles = [
        'guild_page.html',
        'highscores.png',
        'highscores_page8.html',
        'highscores_page8.png',
        'kit_apanha.png',
        'kit_apanha2.html',
        'kit_apanha2.png',
        'transfers.html'
      ];
      for (const df of dumpFiles) {
        const fp = path.join(workerRoot, df);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); pruned++; } catch {}
        }
      }

      // Limpa debug_screenshots com mais de 60 minutos
      const ssDir = path.join(workerRoot, 'debug_screenshots');
      if (fs.existsSync(ssDir)) {
        const now = Date.now();
        const ssFiles = fs.readdirSync(ssDir);
        for (const ss of ssFiles) {
          const ssPath = path.join(ssDir, ss);
          try {
            const st = fs.statSync(ssPath);
            if (now - st.mtimeMs > 60 * 60 * 1000) {
              fs.unlinkSync(ssPath);
              pruned++;
            }
          } catch {}
        }
      }
    } catch {}

    if (pruned > 0) {
      console.log(`[STORAGE] 🗂️ Perfis e artefatos otimizados: ${pruned} itens de cache/bloat descartados.`);
    }
    return pruned;
  } catch (err) {
    console.warn('[STORAGE] Aviso ao otimizar worker_profiles:', err.message);
    return 0;
  }
}

/**
 * Remove lock files órfãos do Chrome para que instâncias futuras não travem.
 */
export function cleanStaleLocks(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile'];
  const targets = [dirPath, path.join(dirPath, 'Default')];
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    for (const lf of lockFiles) {
      const lPath = path.join(target, lf);
      if (fs.existsSync(lPath)) {
        try { fs.unlinkSync(lPath); } catch {}
      }
    }
  }
}




/**
 * Analisa a saúde do disco em tempo real via fs.statfsSync nativo do Node.js.
 */
export function getDiskHealth() {
  try {
    // Disco da aplicação (onde o worker está instalado)
    const appStats = fs.statfsSync(process.cwd());
    const freeBytes = appStats.bavail * appStats.bsize;
    const totalBytes = appStats.blocks * appStats.bsize;
    const freeGb = Math.round((freeBytes / (1024 ** 3)) * 10) / 10;
    const totalGb = Math.round((totalBytes / (1024 ** 3)) * 10) / 10;
    const percentFree = totalGb > 0 ? Math.round((freeGb / totalGb) * 100) : 100;

    // Disco temporário do sistema operacional
    const tempStats = fs.statfsSync(os.tmpdir());
    const tempFreeBytes = tempStats.bavail * tempStats.bsize;
    const tempFreeGb = Math.round((tempFreeBytes / (1024 ** 3)) * 10) / 10;

    const isLowDisk = freeGb < 2 || percentFree < 5 || tempFreeGb < 2;

    return {
      freeGb,
      totalGb,
      percentFree,
      tempFreeGb,
      isLowDisk,
      text: `${freeGb} GB livres (${percentFree}%)`
    };
  } catch {
    return {
      freeGb: null,
      totalGb: null,
      percentFree: null,
      tempFreeGb: null,
      isLowDisk: false,
      text: 'N/A'
    };
  }
}

/**
 * Flags universais de inicialização do Chrome para consumo mínimo de RAM e Disco.
 */
export function getLeanChromeArgs(extraArgs = []) {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disk-cache-size=1048576',         // Cap de cache em disco: 1 MB
    '--media-cache-size=1048576',        // Cap de cache de mídia: 1 MB
    '--disable-application-cache',
    '--disable-gpu-shader-disk-cache',
    '--disable-gpu-program-cache',
    '--disable-angle-features=enable_shader_cache',
    '--disable-component-update',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-domain-reliability',
    '--disable-metrics',
    '--disable-metrics-repo',
    '--disable-breakpad',
    '--disable-crash-reporter',
    '--disable-features=DeferredBrowserMetrics,OptimizationHints,Translate,MediaRouter,MetricsReporting,ChromeLabs,EdgeEntityExtraction,EdgeSmartScreen,AutofillServerCommunication,CalculateNativeWinOcclusion,EdgeCoupons,EdgeSidebar,EdgeShopping,EdgeWallet,EdgeLanguageDetection,EdgeCollections,EdgeHub,EdgeDiscover,EdgeNtp,EdgeSignalTriggers,SegmentationPlatform,DawnCache',
    '--history-retention-days=0',
    '--disable-extensions',
    '--disable-history-quick-provider',
    '--disable-history-url-provider',
    '--disable-sync',
    '--metrics-recording-only=false',
    '--no-report-upload',
    '--no-pings',
    '--aggressive-cache-discard',
    '--no-default-browser-check',
    '--no-first-run',
    '--window-position=-32000,-32000',
    '--disable-notifications',
    '--mute-audio',
    ...extraArgs
  ];
}

/**
 * Executa manutenção geral preventiva de armazenamento.
 */
export function runFullStorageMaintenance() {
  cleanStalePuppeteerProfiles(10);
  cleanWorkerProfileCaches();

  const health = getDiskHealth();
  if (health.isLowDisk) {
    console.warn(`\n[STORAGE GUARDIAN] ⚠️ ALERTA: Armazenamento baixo (${health.freeGb} GB livres no app, ${health.tempFreeGb} GB no Temp)!`);
    // Limpeza forçada com idade mínima reduzida para 3 minutos
    cleanStalePuppeteerProfiles(3);
    cleanWorkerProfileCaches();
  }

  return health;
}
