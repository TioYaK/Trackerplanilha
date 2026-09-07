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

const ACCOUNTS = [
  { world: 'Vesperia', acc: 'pifot16+maker9182@gmail.com', pass: 'Liususu!28@' },
  { world: 'Auroria', acc: 'pifot16+maker781272@gmail.com', pass: 'Liususu!28@3' },
  { world: 'BELLUM', acc: 'pifot16+mak3r78372@gmail.com', pass: 'Liusas!2asd' },
  { world: 'Belaria', acc: 'pifot16+guizera@gmail.com', pass: 'Ljajhsj@J7172' },
  { world: 'Tenebrium', acc: 'pifot16+rubinot2@gmail.com', pass: '88100267hH**' }
];

async function checkAccountChars() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();

    for (const a of ACCOUNTS) {
      console.log(`\nVerificando conta ${a.world}: ${a.acc}...`);
      await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const emailInput = await page.$('input[name="email"]');
      const passInput = await page.$('input[name="password"]');

      if (emailInput && passInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(a.acc);
        await passInput.click({ clickCount: 3 });
        await passInput.type(a.pass);

        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const txt = await page.evaluate(el => el.innerText, btn);
          if (txt && txt.trim().toLowerCase() === 'entrar') {
            await btn.click();
            break;
          }
        }
        await new Promise(r => setTimeout(r, 3000));

        const text = await page.evaluate(() => document.body.innerText.substring(0, 800));
        console.log(`Resultado do login (${a.world}):\n`, text);
      }
    }

  } finally {
    await browser.close();
  }
}

checkAccountChars();
