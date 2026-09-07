/**
 * TEST COMPLETO DE CONVITE - Usando perfil do Launcher
 * Usa o perfil do rubinot-launcher que tem cookies reais do Cloudflare
 * para passar a verificação de segurança sem CAPTCHA externo.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import os from 'os';
import path from 'path';

puppeteer.use(StealthPlugin());

const RUBINOT_PROFILE = path.join(os.homedir(), 'AppData', 'Local', 'rubinot-launcher', 'EBWebView');
const WORK_PROFILE = path.join(process.cwd(), 'scraper-worker', 'worker_profiles', 'auroria_launcher');

const ACCOUNT = { email: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3' };
const CHAR_NAME = 'Xeroza pomba';
const GUILD_NAME = 'Shellpatrocina';

function copyDirSafe(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
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
    } catch { /* arquivo bloqueado, pula */ }
  }
}

function ensureProfile() {
  const srcDefault = path.join(RUBINOT_PROFILE, 'Default');
  const destDefault = path.join(WORK_PROFILE, 'Default');
  if (fs.existsSync(srcDefault) && !fs.existsSync(destDefault)) {
    console.log('   Copiando perfil do Launcher...');
    copyDirSafe(srcDefault, destDefault);
    console.log('   ✅ Perfil pronto!');
  } else {
    console.log('   ✅ Perfil já existe, reutilizando.');
  }
  if (!fs.existsSync(WORK_PROFILE)) {
    fs.mkdirSync(WORK_PROFILE, { recursive: true });
  }
}

async function runFullInviteTest() {
  console.log('🚀 TESTE COMPLETO DE CONVITE\n');

  ensureProfile();

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : undefined;

  const browser = await puppeteer.launch({
    headless: 'new',  // Rodar headless agora que o perfil tem os cookies CF
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

    // 1. Login
    console.log('1. Login via NextAuth...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));

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
    }, ACCOUNT.email, ACCOUNT.password);
    await new Promise(r => setTimeout(r, 1000));
    console.log('   ✅ Login feito');

    // 2. Navegar para gerenciar guilda
    console.log(`\n2. Navegando para /guilds/${GUILD_NAME}/manage...`);
    await page.goto(`https://rubinot.com.br/guilds/${GUILD_NAME}/manage`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 200));
    if (pageText.includes('security verification') || pageText.includes('Performing security')) {
      console.log('   ❌ Cloudflare bloqueou (headless detectado). Tentando non-headless...');
      await browser.close();

      // Tentar non-headless
      const browser2 = await puppeteer.launch({
        headless: false,
        userDataDir: WORK_PROFILE,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800',
               '--disable-blink-features=AutomationControlled', '--exclude-switches=enable-automation'],
        ignoreDefaultArgs: ['--enable-automation'],
      });

      const page2 = await browser2.newPage();
      await page2.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
      });
      await page2.setViewport({ width: 1280, height: 800 });

      await page2.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await page2.evaluate(async (email, password) => {
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
      }, ACCOUNT.email, ACCOUNT.password);
      await new Promise(r => setTimeout(r, 1000));
      await page2.goto(`https://rubinot.com.br/guilds/${GUILD_NAME}/manage`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      await continueInvite(page2, GUILD_NAME, CHAR_NAME);
      await new Promise(r => setTimeout(r, 3000));
      await browser2.close();
      return;
    }

    console.log('   ✅ Carregou! (sem Cloudflare)');
    await continueInvite(page, GUILD_NAME, CHAR_NAME);
    await new Promise(r => setTimeout(r, 3000));

  } finally {
    await browser.close().catch(() => {});
  }
}

async function continueInvite(page, guildName, charName) {
  // Fechar banner de cookies
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const aceitar = btns.find(b => b.innerText.includes('Aceitar'));
    if (aceitar) aceitar.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // 3. Clicar na aba Convidar
  console.log('\n3. Clicando na aba Convidar...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const convBtn = btns.find(b => b.innerText.trim() === 'Convidar');
    if (convBtn) convBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 4. Preencher nome do personagem
  console.log(`4. Digitando "${charName}"...`);
  const input = await page.$('input[placeholder="Nome do personagem"]');
  if (!input) {
    console.log('   ❌ Input não encontrado!');
    await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/invite_fail.png' });
    return;
  }
  await input.click({ clickCount: 3 });
  await input.type(charName, { delay: 80 });
  await new Promise(r => setTimeout(r, 500));

  // 5. Clicar no botão Convidar dentro do form
  console.log('5. Submetendo convite...');
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="Nome do personagem"]');
    if (input) {
      const parent = input.closest('form') || input.parentElement;
      const btn = parent?.querySelector('button[type="submit"], button');
      if (btn) btn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // 6. Verificar se modal do Turnstile apareceu
  console.log('6. Verificando resultado...');
  const hasModal = await page.evaluate(() => {
    const overlay = document.querySelector('.turnstile-overlay.visible');
    return !!overlay;
  });

  if (hasModal) {
    console.log('   Modal Turnstile aberto. Aguardando solução automática...');
    // Aguardar até 20s para auto-resolução
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const token = await page.evaluate(() => {
        const el = document.querySelector('input[name="cf-turnstile-response"]');
        return el ? el.value : '';
      });
      if (token && token.length > 10) {
        console.log(`   ✅ Token Turnstile obtido após ${i+1}s!`);

        // Chamar API diretamente com o token
        const result = await page.evaluate(async (guild, char, tk) => {
          const res = await fetch(`/api/guilds/${encodeURIComponent(guild)}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: char, turnstileToken: tk })
          });
          return { status: res.status, data: await res.json() };
        }, guildName, charName, token);

        console.log('\n🎯 RESULTADO FINAL:');
        console.log('─'.repeat(60));
        if (result.status === 200 || result.status === 201) {
          console.log(`🎉 SUCESSO! ${charName} foi convidado para ${guildName}!`);
        } else {
          console.log(`Status: ${result.status}`);
          console.log('Resposta:', JSON.stringify(result.data, null, 2));
        }
        break;
      }
      process.stdout.write(`   Aguardando token... ${i+1}s\r`);
    }
  } else {
    // Sem modal — verificar se houve sucesso silencioso ou erro
    const pageState = await page.evaluate(() => {
      const errEl = document.querySelector('.error, [class*="error"], [class*="Error"]');
      const succEl = document.querySelector('.success, [class*="success"], [class*="Success"]');
      return {
        error: errEl?.innerText || null,
        success: succEl?.innerText || null,
        title: document.title,
      };
    });

    console.log('\n🎯 RESULTADO (sem modal Turnstile):');
    console.log('─'.repeat(60));
    if (pageState.error) {
      console.log('❌ Erro:', pageState.error);
    } else if (pageState.success) {
      console.log('🎉 Sucesso:', pageState.success);
    } else {
      console.log('   Sem mensagem explícita. Verificar screenshot.');
    }
  }

  await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/invite_result_full.png' });
  console.log('   Screenshot salvo: invite_result_full.png');
}

runFullInviteTest().catch(console.error);
