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

async function testNextAuth() {
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

    // Executar login NextAuth direto no browser
    const loginResult = await page.evaluate(async (email, password) => {
      try {
        // 1. Obter csrfToken
        const csrfRes = await fetch('/api/auth/csrf');
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.csrfToken;

        // 2. Postar credenciais
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);
        params.append('csrfToken', csrfToken);
        params.append('json', 'true');

        const authRes = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const status = authRes.status;
        const text = await authRes.text();
        return { status, csrfToken, response: text };
      } catch (e) {
        return { error: e.message };
      }
    }, 'pifot16+maker781272@gmail.com', 'Liususu!28@3');

    console.log('Resultado do NextAuth Login:\n', JSON.stringify(loginResult, null, 2));

    // Verificar se a sessão foi criada
    const sessionResult = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });

    console.log('Sessão após login:\n', JSON.stringify(sessionResult, null, 2));

  } finally {
    await browser.close();
  }
}

testNextAuth();
