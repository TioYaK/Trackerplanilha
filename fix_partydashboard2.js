const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/PartyDashboard.jsx', 'utf8');

const regex3 = /const \{ data: states \} = await supabase[\s\S]*?currentStates = states;\s*\}/m;
const replacement3 = `const { data: states } = await supabase
        .from('current_character_state')
        .select('*')
        .in('character_name', party.members);
        
      if (states) {
        currentStates = states;
      }
      
      let guildData = [];
      const { data: gData } = await supabase
        .from('guild_members')
        .select('name, level')
        .in('name', party.members);
        
      if (gData) {
        guildData = gData;
      }`;

c = c.replace(regex3, replacement3);

const regex4 = /m\.level = state\.level;/m;
const replacement4 = `m.level = state.level;`;

// But we need to apply guildData first!
const regex5 = /memberStats\[m\] = \{ name: m, totalXpGained: 0, level: '\?', lastSeen: null \};\s*\}\);/m;
const replacement5 = `memberStats[m] = { name: m, totalXpGained: 0, level: '?', lastSeen: null };
        });
        
        guildData.forEach(g => {
          if (memberStats[g.name]) {
            memberStats[g.name].level = g.level;
          }
        });`;

c = c.replace(regex5, replacement5);
fs.writeFileSync('frontend/src/components/PartyDashboard.jsx', c, 'utf8');
