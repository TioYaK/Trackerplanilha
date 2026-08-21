const cheerio=require('cheerio'); 
const fs=require('fs'); 
const $=cheerio.load(fs.readFileSync('test-guilds.html')); 
$('tr').each((i,row)=>{
    const cols=$(row).find('td'); 
    if(cols.length>=3){
        console.log($(cols[1]).text().trim(), ' - Members:', $(cols[3]).text().trim());
    }
});
