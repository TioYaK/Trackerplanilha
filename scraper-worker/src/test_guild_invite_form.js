import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

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

async function testGuildForm() {
  const chromeExe = findChrome();
  const profileDir = path.join(process.cwd(), 'puppeteer_auroria_profile');

  const launchOpts = {
    headless: true,
    userDataDir: profileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    console.log('1. Navegando para /login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));

    const emailInput = await page.$('input[name="email"]');
    if (emailInput) {
      console.log('Preenchendo credenciais com userDataDir...');
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('pifot16+maker781272@gmail.com');

      const passInput = await page.$('input[name="password"]');
      await passInput.click({ clickCount: 3 });
      await passInput.type('Liususu!28@3');

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.trim().toLowerCase() === 'entrar') {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log('URL após login:', page.url());
    console.log('Navegando para a guilda Shell...');
    await page.goto('https://rubinot.com.br/guilds/Shell', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    const text = await page.evaluate(() => document.body.innerText);
    console.log('CONTEÚDO DA PÁGINA DA GUILDA:\n', text.substring(0, 1000));

  } finally {
    await browser.close();
  }
}

testGuildForm();
