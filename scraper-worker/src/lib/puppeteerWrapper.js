import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

let globalBrowser = null;
let pagePool = [];

export const initBrowser = async () => {
  if (globalBrowser) return;
  console.log('[Puppeteer] Abrindo browser Stealth...');
  globalBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
};

export const getPage = async () => {
  await initBrowser();
  const page = await globalBrowser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  return page;
};

export const safeGoto = async (page, url) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const title = await page.title();
    if (title.includes('Just a moment') || title.includes('Attention Required')) {
      console.log('[Puppeteer] Cloudflare bloqueou. Aguardando...');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }).catch(() => {});
    }
    
    return await page.content();
  } catch (err) {
    console.warn(`[Puppeteer] Erro ao carregar ${url}:`, err.message);
    return null;
  }
};
