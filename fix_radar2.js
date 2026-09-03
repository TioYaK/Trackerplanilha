const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/GuildRadar.jsx', 'utf8');

const regex = /const logs = \[\];[\s\S]*?const activeHunters = Object\.values\(memberStats\)[\s\S]*?\.sort\(\(a, b\) => b\.xpLastHour - a\.xpLastHour\);/m;

const replacement = `const memberStats = {};
        guildMembers.forEach(m => {
          memberStats[m.name] = { 
              ...m, 
              xpLastHour: 0, 
              isHunting: false, 
              lastSeen: null,
              huntStart: null 
          };
        });

        const membersList = guildMembers.map(m => m.name);
        
        const fetchStates = async () => {
          let allStates = [];
          for (let i = 0; i < membersList.length; i += 100) {
            const chunk = membersList.slice(i, i + 100);
            const { data } = await supabase
              .from('current_character_state')
              .select('*')
              .in('character_name', chunk);
            if (data) allStates = allStates.concat(data);
          }
          return allStates;
        };

        const states = await fetchStates();
        const now = Date.now();
        const thirtyMinsAgo = now - 30 * 60 * 1000;

        if (states) {
          states.forEach(state => {
            const m = memberStats[state.character_name];
            if (m) {
              const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
              const lastActiveTime = new Date(state.last_active).getTime();
              
              if (deltaXp > 0 && lastActiveTime >= thirtyMinsAgo) {
                m.isHunting = true;
                m.xpLastHour = deltaXp;
                m.huntStart = new Date(state.session_start_time).getTime();
                m.lastSeen = lastActiveTime;
              }
              m.level = state.level || m.level;
            }
          });
        }

        const activeHunters = Object.values(memberStats)
           .filter(m => m.isHunting)
           .sort((a, b) => b.xpLastHour - a.xpLastHour);`;

c = c.replace(regex, replacement);
fs.writeFileSync('frontend/src/views/GuildRadar.jsx', c, 'utf8');
