import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

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

async function testTurnstileHook() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: false, // Vamos rodar com Chromium visível por 10s para assistir ao vivo e debugar
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled'
    ],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Injetar hook no window.turnstile antes de qualquer script carregar
    await page.evaluateOnNewDocument(() => {
      window._turnstileCallbacks = [];
      let originalTurnstile = window.turnstile;

      Object.defineProperty(window, 'turnstile', {
        get() {
          return originalTurnstile;
        },
        set(val) {
          console.log('[Hook] window.turnstile foi definido!', val);
          if (val && val.render && !val._hooked) {
            const origRender = val.render;
            val.render = function(container, options) {
              console.log('[Hook] turnstile.render chamado com container:', container, 'options:', options);
              if (options && options.callback) {
                window._turnstileCallbacks.push(options.callback);
              }
              return origRender.apply(this, arguments);
            };
            val._hooked = true;
          }
          originalTurnstile = val;
        },
        configurable: true
      });
    });

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log('1. Autenticando com NextAuth...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(async (email, password) => {
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
    }, 'pifot16+maker781272@gmail.com', 'Liususu!28@3');

    console.log('2. Navegando para /guilds/Shellpatrocina/manage...');
    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina/manage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    console.log('3. Clicando na aba Convidar...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const convTab = tabs.find(t => t.innerText.trim() === 'Convidar');
      if (convTab) convTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('4. Digitando nome do char: Xeroza pomba...');
    const charInput = await page.$('input[placeholder="Nome do personagem"]');
    if (charInput) {
      await charInput.click({ clickCount: 3 });
      await charInput.type('Xeroza pomba', { delay: 50 });
    }

    console.log('5. Clicando em + Convidar...');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Nome do personagem"]');
      if (input) {
        const parent = input.parentElement;
        const btn = parent ? parent.querySelector('button') : null;
        if (btn) btn.click();
      }
    });

    console.log('6. Aguardando 5s...');
    await new Promise(r => setTimeout(r, 5000));

    const checkHook = await page.evaluate(() => {
      return {
        callbacksCount: window._turnstileCallbacks ? window._turnstileCallbacks.length : 0,
        turnstileObj: typeof window.turnstile
      };
    });
    console.log('Resultado do Hook:', JSON.stringify(checkHook, null, 2));

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

testTurnstileHook();
