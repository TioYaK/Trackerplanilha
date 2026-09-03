const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/AdminDashboard.jsx', 'utf8');

c = c.replace(
  `.like('task_type', 'FETCH_HIGHSCORE%')`,
  `.in('task_type', ['FETCH_HIGHSCORE_KNIGHT', 'FETCH_HIGHSCORE_PALADIN', 'FETCH_HIGHSCORE_DRUID', 'FETCH_HIGHSCORE_SORCERER', 'FETCH_HIGHSCORE_MONK'])`
);

fs.writeFileSync('frontend/src/views/AdminDashboard.jsx', c, 'utf8');
