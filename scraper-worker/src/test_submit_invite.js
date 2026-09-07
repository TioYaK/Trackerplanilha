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

async function testSubmitInvite() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: 'new',
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

    console.log('1. Autenticando no RubinOT via NextAuth API...');
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

    console.log('7. Aguardando 2.5s para o modal renderizar...');
    await new Promise(r => setTimeout(r, 2500));

    console.log('Buscando iframe usando o seletor deep shadow (>>> iframe)...');
    const shadowIframe = await page.$('>>> iframe');
    if (shadowIframe) {
      console.log('Iframe encontrado via Shadow DOM (>>> iframe)!');
      const box = await shadowIframe.boundingBox();
      console.log('Shadow Iframe BoundingBox:', box);

      if (box) {
        const clickX = Math.round(box.x + 30);
        const clickY = Math.round(box.y + box.height / 2);
        console.log(`Clicando nas coordenadas do checkbox (${clickX}, ${clickY})...`);
        await page.mouse.click(clickX, clickY);
      }
    } else {
      console.log('Nenhum iframe encontrado via >>> iframe!');

      // Inspecionar Shadow Roots manualmente via evaluate
      const shadowRootsInfo = await page.evaluate(() => {
        const results = [];
        const allEls = Array.from(document.querySelectorAll('*'));
        for (const el of allEls) {
          if (el.shadowRoot) {
            results.push({
              tag: el.tagName,
              id: el.id,
              className: el.className,
              shadowHTML: el.shadowRoot.innerHTML
            });
          }
        }
        return results;
      });
      console.log('Informações de Shadow Roots no DOM:', JSON.stringify(shadowRootsInfo, null, 2));
    }

    console.log('8. Aguardando 6s para verificação do token...');
    await new Promise(r => setTimeout(r, 6000));

    const tokenVal = await page.evaluate(() => {
      const respInput = document.querySelector('input[name="cf-turnstile-response"]');
      return respInput ? respInput.value : '';
    });

    console.log('Token do Turnstile gerado?:', tokenVal ? `SIM! (${tokenVal.substring(0, 30)}...)` : 'NÃO');

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

testSubmitInvite();
