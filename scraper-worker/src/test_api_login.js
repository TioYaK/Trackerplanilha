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

async function testApiLogin() {
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

    // Testar chamadas de API internas no console da página
    const result = await page.evaluate(async () => {
      const endpoints = [
        '/api/auth/login',
        '/api/login',
        '/api/account/login',
        '/api/auth/callback/credentials'
      ];
      const results = {};
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3', account: 'pifot16+maker781272@gmail.com' })
          });
          const text = await res.text();
          results[ep] = { status: res.status, body: text.substring(0, 200) };
        } catch (e) {
          results[ep] = { error: e.message };
        }
      }
      return results;
    });

    console.log('Resultados de teste de API de login:\n', JSON.stringify(result, null, 2));

  } finally {
    await browser.close();
  }
}

testApiLogin();
