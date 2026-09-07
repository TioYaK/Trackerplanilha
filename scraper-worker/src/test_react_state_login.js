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

async function setReactInputValue(page, selector, value) {
  await page.evaluate((sel, val) => {
    const input = document.querySelector(sel);
    if (input) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, selector, value);
}

async function testReactStateLogin() {
  const chromeExe = findChrome();
  const launchOpts = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
  };
  if (chromeExe) launchOpts.executablePath = chromeExe;

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();

    page.on('response', async res => {
      if (res.url().includes('api')) {
        console.log(`[API Response] ${res.status()} ${res.url()}`);
        try {
          const txt = await res.text();
          console.log(`[API Body] ${txt.substring(0, 300)}`);
        } catch (e) {}
      }
    });

    console.log('Navegando para https://rubinot.com.br/login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    console.log('Seta os valores nos estados do React...');
    await setReactInputValue(page, 'input[name="email"]', 'pifot16+maker781272@gmail.com');
    await setReactInputValue(page, 'input[name="password"]', 'Liususu!28@3');
    await new Promise(r => setTimeout(r, 1000));

    console.log('Clicando no botão de submit...');
    const submitBtn = await page.$('button[type="submit"], button');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise(r => setTimeout(r, 5000));
    }

    console.log('URL final:', page.url());

  } finally {
    await browser.close();
  }
}

testReactStateLogin();
