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

async function testHeadlessNew() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: 'new',
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
      console.log('Preenchendo e-mail e senha...');
      await emailInput.focus();
      await page.keyboard.type('pifot16+maker781272@gmail.com', { delay: 50 });

      await passInput.focus();
      await page.keyboard.type('Liususu!28@3', { delay: 50 });

      await new Promise(r => setTimeout(r, 1500));

      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const txt = await page.evaluate(el => el.innerText, btn);
        if (txt && txt.trim().toLowerCase() === 'entrar') {
          console.log('Clicando em Entrar...');
          await btn.click();
          break;
        }
      }

      await new Promise(r => setTimeout(r, 5000));
      console.log('URL após login:', page.url());

      // Ir para a guilda Shellpatrocina
      console.log('2. Navegando para https://rubinot.com.br/guilds/Shellpatrocina...');
      await page.goto('https://rubinot.com.br/guilds/Shellpatrocina', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const text = await page.evaluate(() => document.body.innerText);
      const isLogged = text.includes('Convidar') || text.includes('Invite') || text.includes('Gerenciar') || text.includes('Sair');
      console.log('Está logado como Líder/Recrutador?', isLogged);
      console.log('CONTEÚDO DA GUILDA:\n', text.substring(0, 1000));
    }
  } finally {
    await browser.close();
  }
}

testHeadlessNew();
