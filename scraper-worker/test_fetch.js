import { supabase } from './src/db.js';
import { scrapeHighscores } from './src/lib/rubinotScraper.js';

async function test() {
  const players = await scrapeHighscores('Auroria', null, 500); 
  console.log('Total players scraped:', players.length);
  
  const { data: guildMembers } = await supabase.from('guild_members').select('name');
  const memberNames = new Set(guildMembers?.map(m => m.name.toLowerCase()) || []);
  console.log('Guild members:', guildMembers.length);
  
  const names = players.filter(p => memberNames.has(p.name.toLowerCase())).map(p => p.name);
  console.log('Players in guild:', names.length);
  console.log('Is Rick Immortal in names?', names.includes('Rick Immortal'));
  console.log('Is Recurso Especial in names?', names.includes('Recurso Especial'));
  
  process.exit(0);
}
test();
