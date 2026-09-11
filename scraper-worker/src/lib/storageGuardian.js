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
 * Limpa perfis e pastas temporárias órfãs do Puppeteer e Chrome no Temp do sistema operacional.
 */
export function cleanStalePuppeteerProfiles(maxAgeMinutes = 10) {
  try {
    const tempDir = os.tmpdir();
    if (!fs.existsSync(tempDir)) return 0;

    const entries = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    let removed = 0;
    for (const entry of entries) {
      if (
        entry.startsWith('puppeteer_dev_') ||
        entry.startsWith('Importer_') ||
        entry.startsWith('.org.chromium.Chromium.') ||
        entry.startsWith('.com.google.Chrome.') ||
        entry.startsWith('scoped_dir')
      ) {
        const fullPath = path.join(tempDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && (now - stat.mtimeMs > maxAgeMs)) {
            fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 0 });
            removed++;
          }
        } catch {
          // Arquivo bloqueado por processo ativo, ignora
        }
      }
    }

    if (removed > 0) {
      console.log(`[STORAGE] 🧹 Limpeza de Temp: ${removed} pastas temporárias órfãs removidas.`);
    }
    return removed;
  } catch (err) {
    console.warn('[STORAGE] Aviso ao limpar Temp:', err.message);
    return 0;
  }
}

/**
 * Limpa caches não essenciais das pastas de perfil do worker (worker_profiles).
 * Preserva estritamente: Cookies, Local Storage, Preferences, Login Data.
 */
export function cleanWorkerProfileCaches() {
  try {
    let baseDir = path.join(process.cwd(), 'worker_profiles');
    if (!fs.existsSync(baseDir)) {
      try {
        const moduleDir = path.dirname(fileURLToPath(import.meta.url));
        const candidate = path.resolve(moduleDir, '../../worker_profiles');
        if (fs.existsSync(candidate)) baseDir = candidate;
      } catch {}
    }
    if (!fs.existsSync(baseDir)) return 0;

    const profileDirs = fs.readdirSync(baseDir);
    const cacheNames = [
      'Cache',
      'Code Cache',
      'GPUCache',
      'Crashpad',
      'DawnGraphiteCache',
      'DawnWebGPUCache',
      'Shared Dictionary',
      'component_crx_cache',
      'ProvenanceData',
      'Edge Entity Extraction',
      'EdgeLanguageDetectionModel',
      'Edge Wallet',
      'Edge Shopping',
      'Edge Web Discover',
      'Edge Collections',
      'Speech Recognition',
      'GrShaderCache',
      'BrowserMetrics',
      'OptimizationHints',
      'SafetyTips',
      'Subresource Filter',
      'Certificate Revocation',
      'File Type Policies',
      'Crowd Deny',
      'OnDeviceHeadSuggestModel',
      'SmartScreen',
      'Recovery',
      'AutofillStates'
    ];

    let pruned = 0;
    for (const pDir of profileDirs) {
      const fullPDir = path.join(baseDir, pDir);
      try {
        if (!fs.statSync(fullPDir).isDirectory()) continue;

        // Limpa stale locks primeiro
        cleanStaleLocks(fullPDir);
        cleanStaleLocks(path.join(fullPDir, 'Default'));

        const checkBases = [fullPDir, path.join(fullPDir, 'Default')];
        for (const base of checkBases) {
          if (!fs.existsSync(base)) continue;
          for (const cName of cacheNames) {
            const target = path.join(base, cName);
            if (fs.existsSync(target)) {
              try {
                fs.rmSync(target, { recursive: true, force: true, maxRetries: 1 });
                pruned++;
              } catch {}
            }
          }

          // Descarta arquivos de métricas soltos (*.pma) e *.tmp
          try {
            const items = fs.readdirSync(base);
            for (const item of items) {
              if (item.endsWith('.pma') || item.endsWith('.tmp') || item.startsWith('BrowserMetrics-')) {
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

    if (pruned > 0) {
      console.log(`[STORAGE] 🗂️ Perfis otimizados: ${pruned} itens de cache/métricas descartados.`);
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
  for (const lf of lockFiles) {
    const lPath = path.join(dirPath, lf);
    if (fs.existsSync(lPath)) {
      try { fs.unlinkSync(lPath); } catch {}
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
    '--disable-component-update',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-domain-reliability',
    '--disable-features=OptimizationHints,Translate,MediaRouter,EdgeEntityExtraction,EdgeSmartScreen,AutofillServerCommunication,CalculateNativeWinOcclusion',
    '--disable-sync',
    '--metrics-recording-only=false',
    '--no-report-upload',
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
