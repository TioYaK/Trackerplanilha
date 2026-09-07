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

async function testExecuteTurnstile() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,800'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('1. Autenticando com NextAuth API...');
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

    console.log('3. Removendo banner de cookies...');
    await page.evaluate(() => {
      document.querySelectorAll('div').forEach(el => {
        if (el.innerText && el.innerText.includes('POLÍTICA DE COOKIES')) el.remove();
      });
    });

    console.log('4. Clicando na aba Convidar...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const convTab = tabs.find(t => t.innerText.trim() === 'Convidar');
      if (convTab) convTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    console.log('5. Digitando personagem Xeroza pomba...');
    const charInput = await page.$('input[placeholder="Nome do personagem"]');
    if (charInput) {
      await charInput.click({ clickCount: 3 });
      await charInput.type('Xeroza pomba', { delay: 50 });
    }

    console.log('6. Clicando no botão + Convidar...');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Nome do personagem"]');
      if (input) {
        const parent = input.parentElement;
        const btn = parent ? parent.querySelector('button') : null;
        if (btn) btn.click();
      }
    });

    console.log('7. Testando chamada ao window.turnstile.execute() ou window.turnstile.render()...');
    await new Promise(r => setTimeout(r, 2000));

    const executeResult = await page.evaluate(async () => {
      if (!window.turnstile) return { error: 'window.turnstile missing' };

      let tokenFromCallback = null;

      // Se houver um container widget, tentar renderizar com callback customizado
      const widget = document.querySelector('.turnstile-widget');
      if (widget) {
        try {
          const widgetId = window.turnstile.render(widget, {
            sitekey: '0x4AAAAAACNN6UP_0bMMfY0F',
            callback: function(token) {
              console.log('Callback do Turnstile disparado!', token);
              tokenFromCallback = token;
              const input = document.querySelector('input[name="cf-turnstile-response"]');
              if (input) input.value = token;
            }
          });
          console.log('Renderizado widget ID:', widgetId);
        } catch (e) {
          console.log('Erro ao chamar render:', e.message);
        }
      }

      // Tentar window.turnstile.execute()
      try {
        window.turnstile.execute();
      } catch (e) {
        console.log('Erro ao chamar execute:', e.message);
      }

      await new Promise(r => setTimeout(r, 4000));

      const input = document.querySelector('input[name="cf-turnstile-response"]');
      const token = input ? input.value : tokenFromCallback;

      return {
        token,
        turnstileResponse: window.turnstile.getResponse ? window.turnstile.getResponse() : null
      };
    });

    console.log('Resultado da execução do Turnstile:', JSON.stringify(executeResult, null, 2));

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

testExecuteTurnstile();
