import fs from 'fs';
import path from 'path';

// Remove arquivos legados loop.bat para evitar processos zumbis que piscam janelas CMD no Windows
export const applySelfHealingPatch = () => {
    try {
        const loopBatPath = path.join(process.cwd(), 'loop.bat');
        if (fs.existsSync(loopBatPath)) {
            try {
                fs.unlinkSync(loopBatPath);
                console.log('[SELF-HEAL] Arquivo legado loop.bat removido para evitar janelas piscando.');
            } catch {}
        }
    } catch (e) {
        // Ignora
    }
};