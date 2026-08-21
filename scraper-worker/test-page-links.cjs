const cheerio=require('cheerio'); 
const fs=require('fs'); 
const $=cheerio.load(fs.readFileSync('test-guild-page2.html')); 
console.log($('button:contains("2")').parent().html());
