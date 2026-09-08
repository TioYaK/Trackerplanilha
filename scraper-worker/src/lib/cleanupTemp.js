'use strict';

import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Limpa pastas temporárias órfãs do Puppeteer e Chrome que acumulam no os.tmpdir().
 * Exclui pastas com mais de 10 minutos para não interferir em processos atualmente em execução.
 */
export function cleanStalePuppeteerProfiles(maxAgeMinutes = 10) {
  try {
    const tempDir = os.tmpdir();
    if (!fs.existsSync(tempDir)) return;

    const entries = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    let removed = 0;

    for (const entry of entries) {
      if (entry.startsWith('puppeteer_dev_chrome_profile-') || entry.startsWith('Importer_')) {
        const fullPath = path.join(tempDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && (now - stat.mtimeMs > maxAgeMs)) {
            fs.rmSync(fullPath, { recursive: true, force: true, maxRetries: 3 });
            removed++;
          }
        } catch {
          // Arquivo bloqueado pelo Windows ou processo ativo, ignora com segurança
        }
      }
    }

    if (removed > 0) {
      console.log(`[CLEANUP] 🧹 Limpeza automática: ${removed} pastas temporárias órfãs removidas do Temp.`);
    }
  } catch (err) {
    console.warn('[CLEANUP] Aviso durante rotina de limpeza temporária:', err.message);
  }
}
