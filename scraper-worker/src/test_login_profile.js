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

async function testLoginProfile() {
  const chromeExe = findChrome();
  const profileDir = path.join(process.cwd(), 'worker_profiles', 'auroria');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const launchOpts = {
    headless: true,
    userDataDir: profileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    console.log('1. Navegando para https://rubinot.com.br/login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const emailInput = await page.$('input[name="email"]');
    const passInput = await page.$('input[name="password"]');

    if (emailInput && passInput) {
      console.log('Preenchendo credenciais...');
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('pifot16+maker781272@gmail.com');

      await passInput.click({ clickCount: 3 });
      await passInput.type('Liususu!28@3');

      const buttons = await page.$$('button');
      let enterBtn = null;
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.trim().toLowerCase() === 'entrar') {
          enterBtn = btn;
          break;
        }
      }

      if (enterBtn) {
        console.log('Clicando em Entrar...');
        await enterBtn.click();
        await new Promise(r => setTimeout(r, 4000));
      }
    }

    console.log('URL após login:', page.url());

    // Ir para a guilda Shellpatrocina
    console.log('2. Navegando para https://rubinot.com.br/guilds/Shellpatrocina...');
    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
    console.log('CONTEÚDO DA GUILDA SHELLPATROCINA:\n', text);

  } finally {
    await browser.close();
  }
}

testLoginProfile();
