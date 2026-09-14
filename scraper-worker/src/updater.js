import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { exec, execSync } from 'child_process';
import { supabase } from './db.js';

const WORKER_ROOT = fileURLToPath(new URL('../', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

// Versão atual do Worker (você deve subir isso no build_exe.js)
export const CURRENT_VERSION = 2;

export const checkForUpdates = async () => {
    // 1. Se estiver rodando como EXE compilado via PKG
    if (process.pkg) {
        // Rotina de update para binary
        // (continua abaixo)
    } else {
        // 2. Ambiente Node.js (Worker instalado ou Ambiente de Desenvolvimento)
        const gitDir = path.join(REPO_ROOT, '.git');
        const isWorkerInstallation = REPO_ROOT.toLowerCase().includes('auroriaworker') || WORKER_ROOT.toLowerCase().includes('auroriaworker');

        // Se for instalação de worker remoto (AuroriaWorker), atualiza via pacote seguro (worker.zip)
        if (isWorkerInstallation) {
            // Remove a pasta .git caso tenha sido criada por versões antigas do instalador para evitar popups do Git
            if (fs.existsSync(gitDir)) {
                try {
                    fs.rmSync(gitDir, { recursive: true, force: true });
                    console.log('[UPDATER] 🧹 Pasta .git removida da instalação do worker para prevenir popups do Git.');
                } catch (e) {}
            }

            try {
                console.log('[UPDATER] 📦 Verificando e baixando atualização do worker a partir do pacote oficial...');
                const zipUrl = 'https://trackerplanilha.vercel.app/worker.zip';
                const tempZip = path.join(os.tmpdir(), `worker_update_${Date.now()}.zip`);

                const res = await fetch(zipUrl, { signal: AbortSignal.timeout(30000) });
                if (!res.ok) {
                    console.warn(`[UPDATER] Falha ao baixar worker.zip (HTTP ${res.status}).`);
                    return false;
                }

                const buffer = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(tempZip, buffer);

                // Descompacta sobrescrevendo os arquivos em WORKER_ROOT
                try {
                    execSync(`tar.exe -xf "${tempZip}" -C "${WORKER_ROOT}"`, { stdio: 'ignore' });
                } catch {
                    // Fallback para PowerShell caso tar.exe falhe
                    execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${WORKER_ROOT}' -Force"`, { stdio: 'ignore' });
                }

                try { fs.unlinkSync(tempZip); } catch {}

                console.log('[UPDATER] ✅ Worker atualizado com sucesso! Reiniciando processo...');
                return true;
            } catch (err) {
                console.error('[UPDATER] Erro ao atualizar worker remoto:', err.message);
                return false;
            }
        }

        // Se for o repositório principal de desenvolvimento local, não sobrescreve código de desenvolvimento
        return false;
    }

    try {
        console.log('[UPDATER] Checando novas versões no Supabase...');
        
        // 1. Baixa o version.json do bucket
        const { data: versionData, error: versionErr } = await supabase.storage
            .from('releases')
            .download('version.json');
            
        if (versionErr || !versionData) return false;

        const text = await versionData.text();
        const remoteVersion = JSON.parse(text).version;

        if (remoteVersion > CURRENT_VERSION) {
            console.log(`[UPDATER] Versão ${remoteVersion} encontrada! Baixando atualização silenciosa...`);
            
            // 2. Baixa o novo EXE
            const { data: exeData, error: exeErr } = await supabase.storage
                .from('releases')
                .download('auroria-worker.exe');
                
            if (exeErr || !exeData) {
                console.error('[UPDATER] Erro ao baixar o EXE:', exeErr);
                return false;
            }

            const buffer = Buffer.from(await exeData.arrayBuffer());
            const newExePath = path.join(process.cwd(), 'auroria-worker_new.exe');
            const currentExePath = process.execPath; // Caminho do EXE rodando atualmente
            const batPath = path.join(process.cwd(), 'update.bat');

            fs.writeFileSync(newExePath, buffer);

            // 3. Cria o arquivo BAT para matar, substituir e relançar
            const batCode = `
@echo off
timeout /t 3 /nobreak > NUL
del "${currentExePath}"
ren "${newExePath}" "auroria-worker.exe"
start "" "auroria-worker.exe"
del "%~f0"
`;
            fs.writeFileSync(batPath, batCode);

            console.log('[UPDATER] Atualização baixada com sucesso! Aplicando e reiniciando...');
            
            // 4. Lança o BAT desanexado do Node
            const { spawn } = await import('child_process');
            const child = spawn('cmd.exe', ['/c', batPath], {
                detached: true,
                stdio: 'ignore',
                cwd: process.cwd(),
                windowsHide: true
            });
            child.unref();

            // Mata o processo atual para o BAT conseguir sobrescrever
            process.exit(0);
        }
    } catch (error) {
        console.error('[UPDATER] Erro na rotina de update:', error.message);
    }
    return false;
};
