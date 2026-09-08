import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { supabase } from './db.js';

// Versão atual do Worker (você deve subir isso no build_exe.js)
export const CURRENT_VERSION = 2;

export const checkForUpdates = async () => {
    // Se não estiver rodando como EXE compilado, usa o Git Pull blindado
    if (!process.pkg) {
        return new Promise((resolve) => {
            exec('git rev-parse HEAD', (err1, currentHead) => {
                const oldHash = currentHead ? currentHead.trim() : '';
                exec('git fetch origin main', (err2) => {
                    exec('git rev-parse origin/main', (err3, remoteHead) => {
                        const newHash = remoteHead ? remoteHead.trim() : '';
                        if (oldHash && newHash && oldHash !== newHash) {
                            console.log(`[UPDATER] 🚀 Nova versão detectada no GitHub (${oldHash.slice(0, 7)} -> ${newHash.slice(0, 7)})!`);
                            console.log('[UPDATER] Atualizando código com git reset --hard...');
                            exec('git reset --hard origin/main && git clean -fd', () => {
                                console.log('[UPDATER] Executando npm install e reiniciando...');
                                exec('npm install', () => {
                                    console.log('[UPDATER] ✅ Atualização concluída. Reiniciando processo...');
                                    process.exit(0);
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
                cwd: process.cwd()
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
