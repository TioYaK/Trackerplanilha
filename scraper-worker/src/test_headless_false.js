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

async function testHeadlessFalse() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
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

    console.log('7. Aguardando 3s para o modal do Turnstile renderizar...');
    await new Promise(r => setTimeout(r, 3000));

    // Procurar por frames do Turnstile
    const frames = page.frames();
    console.log('Total de frames:', frames.length);
    frames.forEach((f, idx) => console.log(`Frame ${idx}:`, f.url()));

    const widgetEl = await page.$('.turnstile-widget');
    if (widgetEl) {
      const box = await widgetEl.boundingBox();
      console.log('Widget BoundingBox:', box);
      if (box) {
        const clickX = Math.round(box.x + 35);
        const clickY = Math.round(box.y + box.height / 2);
        console.log(`Clicando no checkbox em (${clickX}, ${clickY})...`);
        await page.mouse.click(clickX, clickY);
      }
    }

    console.log('8. Aguardando 6s para ver se o token é gerado ou se o convite é enviado...');
    await new Promise(r => setTimeout(r, 6000));

    const finalState = await page.evaluate(() => {
      const respInput = document.querySelector('input[name="cf-turnstile-response"]');
      const body = document.body.innerText;
      return {
        token: respInput ? respInput.value : '',
        bodySnippet: body.substring(0, 1000)
      };
    });

    console.log('Estado final:', JSON.stringify(finalState, null, 2));

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

testHeadlessFalse();
