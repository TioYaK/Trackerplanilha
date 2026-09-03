const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/PartyDashboard.jsx', 'utf8');

const regex = /if \(\!error && data\) \{\s*logs = data;\s*\}/m;
const replacement = `if (!error && data) {
        logs = data;
      }
      
      // Busca estado atual (Edge Computing) para mesclar com as sessões finalizadas
      let currentStates = [];
      const { data: states } = await supabase
        .from('current_character_state')
        .select('*')
        .in('character_name', party.members);
        
      if (states) {
        currentStates = states;
      }`;

c = c.replace(regex, replacement);

const regex2 = /memberStats\[m\] = \{ name: m, totalXpGained: 0, level: '\?', lastSeen: null \};\s*\}\);/m;
const replacement2 = `memberStats[m] = { name: m, totalXpGained: 0, level: '?', lastSeen: null };
        });

        currentStates.forEach(state => {
          if (memberStats[state.character_name]) {
            const m = memberStats[state.character_name];
            m.level = state.level;
            const lastActive = new Date(state.last_active);
            if (!m.lastSeen || lastActive > m.lastSeen) {
               m.lastSeen = lastActive;
            }
            
            // Soma a XP da sessão atual se estiver ativo e for de hoje (SS)
            if (lastActive.getTime() >= lastSSTime) {
                const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
                if (deltaXp > 0) {
                   m.totalXpGained += deltaXp;
                }
            }
          }
        });`;

c = c.replace(regex2, replacement2);

fs.writeFileSync('frontend/src/components/PartyDashboard.jsx', c, 'utf8');
