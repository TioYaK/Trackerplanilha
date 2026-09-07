import { initBrowser, globalBrowser, safeGoto } from '../scraper-worker/src/lib/rubinotScraper.js';
import cheerio from 'cheerio';
import fs from 'fs';

(async () => {
  try {
    await initBrowser();
    const page = await globalBrowser.newPage();
    const url = 'https://rubinot.com.br/characters?name=Siiegrifilder';
    console.log('Navigating to:', url);
    await safeGoto(page, url);
    const html = await page.content();
    fs.writeFileSync('./scratch/siiegrifilder_page.html', html);
    const $ = cheerio.load(html);

    console.log('--- TEXT CONTENT ---');
    $('td, th, h1, h2, h3, p, span, div').each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (text.includes('Siiegrifilder') || text.includes('1488') || text.includes('Elite Knight')) {
        console.log('MATCH:', text.substring(0, 120));
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
