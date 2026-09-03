const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/RadarHunters.jsx', 'utf8');

const regex = /const \{ data: logs \} = await supabase[\s\S]*?\}\);/m;

const replacement = `const { data: states } = await supabase
                .from('current_character_state')
                .select('character_name, xp_total, session_start_xp, last_active')
                .in('character_name', chunk);

              if (states) {
                states.forEach(state => {
                  const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
                  const lastActiveTime = new Date(state.last_active).getTime();
                  if (deltaXp > 0 && lastActiveTime >= oneHourAgo) {
                    if (!xpMap[state.character_name]) xpMap[state.character_name] = 0;
                    xpMap[state.character_name] += deltaXp;
                  }
                });
              }`;

c = c.replace(regex, replacement);
fs.writeFileSync('frontend/src/views/RadarHunters.jsx', c, 'utf8');
