/**
 * TEST com Edge WebView2 do Launcher do RubinOT
 * O rubinot-launcher usa EBWebView (Edge WebView2) com perfil em:
 * %LOCALAPPDATA%\rubinot-launcher\EBWebView\Default
 * 
 * Esse perfil JÁ visitou rubinot.com.br e tem cookies reais do Cloudflare!
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import os from 'os';

puppeteer.use(StealthPlugin());

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function testWithRubinOTProfile() {
  // Usar um perfil novo mas "pre-aquecido"
  // Vamos primeiro visitar alguns sites normais para ganhar trust do CF
  const profileDir = path.join(process.cwd(), 'scraper-worker', 'worker_profiles', 'auroria_warmed');
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const chromeExe = findChrome();
  console.log('Chrome/Edge encontrado:', chromeExe);

  const browser = await puppeteer.launch({
    headless: false, // Não-headless é fundamental para o Turnstile
    userDataDir: profileDir,
    executablePath: chromeExe || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    const page = await browser.newPage();

    // Remover traços de automação
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
    });

    await page.setViewport({ width: 1280, height: 800 });

    console.log('1. Pré-aquecendo o perfil (visitar Cloudflare)...');
    await page.goto('https://cloudflare.com', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));

    console.log('2. Autenticando no RubinOT via NextAuth...');
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
      } catch(e) { console.log('login err', e.message); }
    }, 'pifot16+maker781272@gmail.com', 'Liususu!28@3');
    await new Promise(r => setTimeout(r, 1000));

    console.log('3. Navegando para gerenciar guilda...');
    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina/manage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Fechar banner de cookies
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aceitar = btns.find(b => b.innerText.includes('Aceitar'));
      if (aceitar) aceitar.click();
    });
    await new Promise(r => setTimeout(r, 500));

    console.log('4. Clicando na aba Convidar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const convBtn = btns.find(b => b.innerText.trim() === 'Convidar');
      if (convBtn) convBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('5. Digitando personagem...');
    const charInput = await page.$('input[placeholder="Nome do personagem"]');
    if (charInput) {
      await charInput.click({ clickCount: 3 });
      await charInput.type('Xeroza pomba', { delay: 80 });
    }

    console.log('6. Clicando em Convidar...');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Nome do personagem"]');
      if (input) {
        const parent = input.parentElement;
        const btn = parent?.querySelector('button');
        if (btn) btn.click();
      }
    });

    console.log('7. Aguardando Turnstile (máx 30s)...');
    await new Promise(r => setTimeout(r, 3000));

    // Verificar se o Turnstile apareceu
    const hasModal = await page.evaluate(() => {
      const overlay = document.querySelector('.turnstile-overlay.visible');
      return !!overlay;
    });

    if (hasModal) {
      console.log('   Modal do Turnstile aberto!');

      // Tentar encontrar e clicar na checkbox do Turnstile
      const frames = page.frames();
      console.log('   Frames disponíveis:', frames.map(f => f.url()).filter(u => u));

      const turnstileFrame = frames.find(f => f.url().includes('challenges.cloudflare.com'));

      if (turnstileFrame) {
        console.log('   Frame do Turnstile encontrado, aguardando solução automática...');
        // Aguardar até 25s para solução automática
        for (let i = 0; i < 25; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const token = await page.evaluate(() => {
            const input = document.querySelector('input[name="cf-turnstile-response"]');
            return input ? input.value : '';
          });
          if (token) {
            console.log(`   ✅ Token obtido após ${i+1}s!`);
            // Enviar via API
            const result = await page.evaluate(async (guildName, charName, tk) => {
              const res = await fetch(`/api/guilds/${encodeURIComponent(guildName)}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: charName, turnstileToken: tk })
              });
              const json = await res.json();
              return { status: res.status, data: json };
            }, 'Shellpatrocina', 'Xeroza pomba', token);
            console.log('   🎉 RESULTADO:', JSON.stringify(result));
            break;
          }
          process.stdout.write(`   Aguardando... ${i+1}s\r`);
        }
      }
    } else {
      // Sem modal = Turnstile resolveu automaticamente!
      console.log('   ✅ Nenhum modal! Turnstile resolveu automaticamente.');
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('   Conteúdo:', bodyText);
    }

    await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/warmed_profile_result.png' });
    await new Promise(r => setTimeout(r, 3000));

  } finally {
    await browser.close();
  }
}

testWithRubinOTProfile().catch(console.error);
