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

async function testInspectFrameShadow() {
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

    console.log('7. Aguardando a criação do iframe do Turnstile...');
    let turnstileFrame = null;
    for (let i = 0; i < 15; i++) {
      turnstileFrame = page.frames().find(f => f.url().includes('challenges.cloudflare.com'));
      if (turnstileFrame) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (turnstileFrame) {
      console.log('Turnstile Frame encontrado:', turnstileFrame.url());
      await new Promise(r => setTimeout(r, 2000));

      const shadowDetails = await turnstileFrame.evaluate(() => {
        function searchShadow(node) {
          const res = [];
          if (node.shadowRoot) {
            res.push({
              nodeTag: node.tagName,
              nodeId: node.id,
              nodeClass: node.className,
              shadowHTML: node.shadowRoot.innerHTML
            });
            for (const child of Array.from(node.shadowRoot.children)) {
              res.push(...searchShadow(child));
            }
          }
          if (node.children) {
            for (const child of Array.from(node.children)) {
              res.push(...searchShadow(child));
            }
          }
          return res;
        }

        return {
          bodyShadow: searchShadow(document.body),
          docShadow: searchShadow(document.documentElement),
          docHTML: document.documentElement.outerHTML
        };
      });

      console.log('Shadow Details no Frame:', JSON.stringify(shadowDetails, null, 2));
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await browser.close();
  }
}

testInspectFrameShadow();
