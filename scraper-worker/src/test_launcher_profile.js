/**
 * TEST com Edge com userDataDir do próprio Launcher do RubinOT
 * O rubinot-launcher usa EBWebView (Edge WebView2) com perfil em:
 * %LOCALAPPDATA%\rubinot-launcher\EBWebView
 * 
 * Esse perfil JÁ visitou rubinot.com.br com janela real do usuário!
 * Tenta usar o perfil do Launcher como base para ter os cookies CF reais.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import os from 'os';
import path from 'path';

puppeteer.use(StealthPlugin());

// Caminho do perfil do rubinot-launcher (tem cookies reais do CF!)
const RUBINOT_PROFILE = path.join(os.homedir(), 'AppData', 'Local', 'rubinot-launcher', 'EBWebView');

// Perfil de trabalho — copiamos o Default do launcher para cá
const WORK_PROFILE = path.join(process.cwd(), 'scraper-worker', 'worker_profiles', 'auroria_launcher');

function copyDirSafe(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  let files;
  try { files = fs.readdirSync(src); } catch { return; }
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirSafe(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch {
      // Arquivo bloqueado (ex: Cookies em uso), pula
    }
  }
}

function copyDirIfNotExists(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const srcDefault = path.join(src, 'Default');
  const destDefault = path.join(dest, 'Default');
  if (fs.existsSync(srcDefault) && !fs.existsSync(destDefault)) {
    console.log('   Copiando perfil Default do launcher para o worker...');
    copyDirSafe(srcDefault, destDefault);
    console.log('   ✅ Perfil copiado (arquivos bloqueados ignorados)!');
  }
}

async function testWithLauncherProfile() {
  console.log('🚀 Testando com perfil do Rubinot Launcher\n');
  console.log('Perfil origem:', RUBINOT_PROFILE);
  console.log('Perfil trabalho:', WORK_PROFILE);

  const profileExists = fs.existsSync(RUBINOT_PROFILE);
  console.log('Perfil do launcher existe:', profileExists);

  if (profileExists) {
    copyDirIfNotExists(RUBINOT_PROFILE, WORK_PROFILE);
  } else {
    console.log('⚠️  Perfil do launcher não encontrado, usando perfil novo...');
    if (!fs.existsSync(WORK_PROFILE)) {
      fs.mkdirSync(WORK_PROFILE, { recursive: true });
    }
  }

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : undefined);

  console.log('\nBrowser:', executablePath || 'Puppeteer padrão');

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: WORK_PROFILE,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
    });

    await page.setViewport({ width: 1280, height: 800 });

    console.log('\n1. Fazendo login via NextAuth...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    const currentUrl = page.url();
    console.log('   URL atual:', currentUrl);

    if (!currentUrl.includes('/login')) {
      console.log('   ✅ Já está logado!');
    } else {
      await page.evaluate(async (email, password) => {
        try {
          const csrfRes = await fetch('/api/auth/csrf');
          const csrfData = await csrfRes.json();
          const params = new URLSearchParams();
          params.append('email', email);
          params.append('password', password);
          params.append('csrfToken', csrfData.csrfToken);
          params.append('json', 'true');
          await fetch('/api/auth/callback/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
          });
        } catch(e) {}
      }, 'pifot16+maker781272@gmail.com', 'Liususu!28@3');
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('2. Navegando para gerenciar guilda...');
    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina/manage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const pageUrl2 = page.url();
    const pageContent = await page.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('   URL:', pageUrl2);
    console.log('   Conteúdo:', pageContent);

    await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/launcher_profile_result.png' });

    const isBlocked = pageContent.includes('security verification') || pageContent.includes('Performing security');
    if (isBlocked) {
      console.log('   ❌ Cloudflare ainda bloqueando. O perfil não tem cookies CF suficientes.');
      console.log('   Solução: Abrir o rubinot.com.br manualmente no Edge primeiro.');
    } else {
      console.log('   ✅ Passou pelo Cloudflare!');
      // Continuar com o fluxo de convite...
    }

    await new Promise(r => setTimeout(r, 3000));
  } finally {
    await browser.close();
  }
}

testWithLauncherProfile().catch(console.error);
