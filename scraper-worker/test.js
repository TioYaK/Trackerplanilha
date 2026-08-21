import { runFetchGuild } from './src/jobs/fetchGuild.js';
import { runFetchOnlines } from './src/jobs/fetchOnlines.js';
import { runFetchHighscores } from './src/jobs/fetchHighscores.js';
import { runAuditSlots } from './src/jobs/auditSlots.js';

const runTests = async () => {
  console.log('============================================');
  console.log('   INICIANDO TESTE DE RASPAGEM (BYPASS FILA)  ');
  console.log('============================================\n');
  
  try {
    console.log('[TESTE 1] Lendo membros da Guilda...');
    await runFetchGuild();
    console.log('--------------------------------------------\n');
    
    console.log('[TESTE 2] Lendo jogadores Online...');
    await runFetchOnlines();
    console.log('--------------------------------------------\n');
    
    console.log('[TESTE 3] Lendo Highscores (Página 1 para teste de XP)...');
    await runFetchHighscores(1);
    console.log('--------------------------------------------\n');
    
    console.log('[TESTE 4] Rodando Auditoria de Planilha...');
    await runAuditSlots();
    console.log('--------------------------------------------\n');
    
  } catch (err) {
    console.error('ERRO GLOBAL NO TESTE:', err);
  }
  
  console.log('--- FIM DO TESTE ---');
  process.exit(0);
};

runTests();
