import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('--- Iniciando Build do Robô Executável ---');

// 1. Instalar pkg globalmente se não existir
try {
  console.log('Instalando pkg compiler...');
  execSync('npm install -g pkg', { stdio: 'inherit' });
} catch (e) {
  console.log('Falha ao instalar o pkg. Continuando mesmo assim...');
}

// 2. Modificar o rubinotScraper.js para incluir o Edge (Garantia para quem não tem Chrome)
const scraperPath = path.join(process.cwd(), 'src', 'lib', 'rubinotScraper.js');
let scraperCode = fs.readFileSync(scraperPath, 'utf8');
if (!scraperCode.includes('msedge.exe')) {
  scraperCode = scraperCode.replace(
    "'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',",
    "'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',\n        'C:\\\\Program Files (x86)\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',\n        'C:\\\\Program Files\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe',"
  );
  fs.writeFileSync(scraperPath, scraperCode);
  console.log('Scraper atualizado para suportar o Microsoft Edge.');
}

// 3. Modificar db.js para carregar as chaves do .env caso não existam no process.env
// Como o dotenv é executado no index.js, está ok, mas para o EXE, 
// o dotenv precisa achar o .env na mesma pasta do EXE, não no snapshot!
const indexJsPath = path.join(process.cwd(), 'src', 'index.js');
let indexCode = fs.readFileSync(indexJsPath, 'utf8');
if (!indexCode.includes("dotenv.config({ path: path.join(process.cwd(), '.env') })")) {
    const importDotenv = "import dotenv from 'dotenv';\nimport path from 'path';\ndotenv.config({ path: path.join(process.cwd(), '.env') });\n";
    indexCode = importDotenv + indexCode;
    fs.writeFileSync(indexJsPath, indexCode);
}

// 4. Compilar usando o pkg
console.log('Compilando executável (isso pode demorar uns minutos)...');
try {
  // Configurando para Windows, NodeJS 18. Sem gerar public, apenas o EXE.
  execSync('pkg . --targets node18-win-x64 --output auroria-worker.exe', { stdio: 'inherit' });
  console.log('=== SUCESSO! Executável gerado: auroria-worker.exe ===');
  
  // 5. Opcional: Upload Automático para o Supabase
  console.log('Você quer que eu faça o upload automático desse EXE para a nuvem (para o Auto-Updater baixar)?');
  console.log('Se sim, o sistema de updates silenciosos entrará em vigor para todos os seus amigos!');
  
  console.log('Para seus amigos usarem: Envie o auroria-worker.exe e o arquivo .env para eles.');
} catch (e) {
  console.error('Erro crítico ao compilar:', e.message);
}
