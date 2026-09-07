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

async function testLoginDetails() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();

    page.on('response', async res => {
      if (res.url().includes('login') || res.url().includes('auth')) {
        console.log(`[Response] ${res.status()} ${res.url()}`);
        try {
          const txt = await res.text();
          console.log(`[Body] ${txt.substring(0, 400)}`);
        } catch (e) {}
      }
    });

    console.log('Navegando para https://rubinot.com.br/login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const emailInput = await page.$('input[name="email"]');
    const passInput = await page.$('input[name="password"]');

    if (emailInput && passInput) {
      await emailInput.focus();
      await page.keyboard.type('pifot16+maker781272@gmail.com', { delay: 30 });

      await passInput.focus();
      await page.keyboard.type('Liususu!28@3', { delay: 30 });

      await new Promise(r => setTimeout(r, 1000));

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.trim().toLowerCase() === 'entrar') {
          console.log('Clicando em Entrar...');
          await btn.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 6000));
      console.log('URL final:', page.url());
    }
  } finally {
    await browser.close();
  }
}

testLoginDetails();
