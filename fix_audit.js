const fs = require('fs');
let c = fs.readFileSync('scraper-worker/src/jobs/auditSlots.js', 'utf8');

const regex = /const \{ data: states \} = await supabase[\s\S]*?if \(states && states\.length > 0\) \{/m;
const replacement = `const { data: states } = await supabase
        .from('current_character_state')
        .select('character_name, xp_total, session_start_xp, last_active')
        .in('character_name', party.members);

      // LOW LEVEL BYPASS: Puxa o status online (last_xp_date)
      const { data: guildData } = await supabase
        .from('guild_members')
        .select('name, last_xp_date')
        .in('name', party.members);
        
      let isHunting = false;
      let totalDelta = 0;

      // 1. Checa se eles estão ONLINE no site agora (Bypass pra quem tá fora do Rank)
      if (guildData && guildData.length > 0) {
        guildData.forEach(g => {
          if (g.last_xp_date && g.last_xp_date >= twentyMinsAgo) {
             isHunting = true;
          }
        });
      }

      // 2. Soma a XP da sessão para os que estão no Rank
      if (states && states.length > 0) {`;

c = c.replace(regex, replacement);
fs.writeFileSync('scraper-worker/src/jobs/auditSlots.js', c, 'utf8');
