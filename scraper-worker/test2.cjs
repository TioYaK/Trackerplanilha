const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('test-guild-page2.html');
const $ = cheerio.load(html);
const m = [];
$('tr').each((i, row) => {
    const cols = $(row).find('td');
    if(cols.length>=6) m.push($(cols[1]).text().trim());
});
console.log('Found:', m.length, m.slice(0, 5));
