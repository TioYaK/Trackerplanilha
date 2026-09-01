import fs from 'fs';
import path from 'path';

// Aplica uma cura no loop.bat para adicionar git pull e evitar death-loops de Syntax Error
export const applySelfHealingPatch = () => {
    try {
        const loopBatPath = path.join(process.cwd(), 'loop.bat');
        if (fs.existsSync(loopBatPath)) {
            const content = fs.readFileSync(loopBatPath, 'utf8');
            if (!content.includes('git pull')) {
                const newContent = :loop\ngit pull --autostash\nnode src/index.js\ntimeout /t 15\ngoto loop;
                fs.writeFileSync(loopBatPath, newContent);
                console.log('[SELF-HEAL] loop.bat foi vacinado contra death-loops!');
            }
        }
        
        const startBatPath = path.join(process.cwd(), 'start.bat');
        if (fs.existsSync(startBatPath)) {
            const content = fs.readFileSync(startBatPath, 'utf8');
            if (!content.includes('git pull')) {
                const newContent = @echo off\ncd /d "%~dp0"\n:loop\ngit pull --autostash\nnode src/index.js\ntimeout /t 15\ngoto loop;
                fs.writeFileSync(startBatPath, newContent);
                console.log('[SELF-HEAL] start.bat foi vacinado!');
            }
        }
    } catch (e) {
        // Ignora
    }
};