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

async function testConvidarTab() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    console.log('1. Autenticando com NextAuth...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

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

    console.log('2. Navegando para a página de gerenciar guilda: /guilds/Shellpatrocina/manage...');
    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina/manage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Clicar na aba Convidar
    console.log('3. Clicando na aba Convidar...');
    const buttons = await page.$$('button, a, div, span');
    for (const btn of buttons) {
      const txt = await page.evaluate(el => el.innerText.trim(), btn);
      if (txt === 'Convidar') {
        await btn.click();
        await new Promise(r => setTimeout(r, 2000));
        break;
      }
    }

    const inputs = await page.$$eval('input', els => els.map(el => ({ name: el.name, type: el.type, placeholder: el.placeholder, outerHTML: el.outerHTML })));
    console.log('Inputs na aba Convidar:', inputs);

    const buttonsAfter = await page.$$eval('button', els => els.map(el => ({ text: el.innerText.trim(), type: el.type })));
    console.log('Botões na aba Convidar:', buttonsAfter);

    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('CONTEÚDO DA ABA CONVIDAR:\n', pageText.substring(0, 1500));

  } finally {
    await browser.close();
  }
}

testConvidarTab();
