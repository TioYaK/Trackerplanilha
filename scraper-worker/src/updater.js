import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
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
        const isWorkerInstallation = REPO_ROOT.toLowerCase().includes('auroriaworker');

        // Se for instalação de worker remoto (AuroriaWorker), NUNCA use Git para atualizar
        // Remove a pasta .git caso tenha sido criada por versões antigas do instalador
        if (isWorkerInstallation) {
            if (fs.existsSync(gitDir)) {
                try {
                    fs.rmSync(gitDir, { recursive: true, force: true });
                    console.log('[UPDATER] 🧹 Pasta .git removida da instalação do worker para prevenir popups do Git.');
                } catch (e) {}
            }
            return false;
        }

        // Se houver repositório Git (ambiente de desenvolvimento local), executa com prompts 100% silenciados
        if (fs.existsSync(gitDir)) {
            const silentGitEnv = {
                ...process.env,
                GIT_TERMINAL_PROMPT: '0',
                GCM_INTERACTIVE: 'never',
                GIT_ASKPASS: '',
                SSH_ASKPASS: ''
            };

            return new Promise((resolve) => {
                exec('git rev-parse HEAD', { cwd: REPO_ROOT, windowsHide: true, env: silentGitEnv }, (err1, currentHead) => {
                    if (err1) return resolve(false);
                    const oldHash = currentHead ? currentHead.trim() : '';
                    exec('git fetch origin main', { cwd: REPO_ROOT, windowsHide: true, env: silentGitEnv }, (err2) => {
                        if (err2) {
                            // Se falhou por autenticação privada ou sem internet, silencia sem abrir janelas
                            return resolve(false);
                        }
                        exec('git rev-parse origin/main', { cwd: REPO_ROOT, windowsHide: true, env: silentGitEnv }, (err3, remoteHead) => {
                            if (err3) return resolve(false);
                            const newHash = remoteHead ? remoteHead.trim() : '';
                            if (oldHash && newHash && oldHash !== newHash) {
                                console.log(`[UPDATER] 🚀 Nova versão detectada no GitHub (${oldHash.slice(0, 7)} -> ${newHash.slice(0, 7)})!`);
                                console.log('[UPDATER] Atualizando código silenciosamente com git reset --hard...');
                                exec('git reset --hard origin/main', { cwd: REPO_ROOT, windowsHide: true, env: silentGitEnv }, () => {
                                    exec(`git diff --name-only ${oldHash} ${newHash}`, { cwd: REPO_ROOT, windowsHide: true, env: silentGitEnv }, (errDiff, diffFiles) => {
                                        const needsNpmInstall = diffFiles && diffFiles.includes('package.json');
                                        if (needsNpmInstall) {
                                            console.log('[UPDATER] Alterações em dependências detectadas. Executando npm install...');
                                            exec('npm install --no-audit --no-fund', { cwd: WORKER_ROOT, windowsHide: true }, () => {
                                                console.log('[UPDATER] ✅ Atualização concluída. Reiniciando processo...');
                                                process.exit(0);
                                            });
                                        } else {
                                            console.log('[UPDATER] ✅ Código atualizado. Reiniciando processo...');
                                            process.exit(0);
                                        }
                                    });
                                });
                                return;
                            }
                            resolve(false);
                        });
                    });
                });
            });
        }

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
