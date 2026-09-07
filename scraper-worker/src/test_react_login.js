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

async function testReactLogin() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    console.log('Navegando para https://rubinot.com.br/login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Monitorar todas as respostas da API
    page.on('response', async res => {
      const url = res.url();
      if (url.includes('/api/')) {
        console.log(`[API Response] ${res.status()} ${url}`);
        try {
          const txt = await res.text();
          console.log(`[API Body] ${txt.substring(0, 300)}`);
        } catch (e) {}
      }
    });

    const emailInput = await page.$('input[name="email"]');
    const passInput = await page.$('input[name="password"]');

    if (emailInput && passInput) {
      console.log('Focando e digitando e-mail...');
      await emailInput.focus();
      await page.keyboard.type('pifot16+maker781272@gmail.com', { delay: 50 });

      console.log('Focando e digitando senha...');
      await passInput.focus();
      await page.keyboard.type('Liususu!28@3', { delay: 50 });

      await new Promise(r => setTimeout(r, 1000));

      console.log('Clicando em Entrar...');
      const buttons = await page.$$('button[type="submit"], button');
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.trim().toLowerCase() === 'entrar') {
          await btn.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 6000));
      console.log('URL final:', page.url());
      const pageText = await page.evaluate(() => document.body.innerText.substring(0, 800));
      console.log('Texto final:\n', pageText);
    }

  } finally {
    await browser.close();
  }
}

testReactLogin();
