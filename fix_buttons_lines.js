const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/AdminDashboard.jsx', 'utf8');
const lines = c.split('\n');

let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Forçar Sincronização Agora')) {
     endIdx = i + 1; // including the </button> line
     break;
  }
}

if (endIdx !== -1) {
  for (let i = endIdx - 1; i >= 0; i--) {
     if (lines[i].includes('<button')) {
        startIdx = i;
        break;
     }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
   lines.splice(startIdx, endIdx - startIdx + 1, `<button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).in('task_type', ['FETCH_ONLINES', 'FETCH_GUILD', 'AUDIT_SLOTS']);
                           alert('Ordem de Radar/Online enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Radar / Online
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).like('task_type', 'FETCH_HIGHSCORE%');
                           alert('Ordem de Highscores enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Highscores (XP)
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).in('task_type', ['FETCH_BAZAAR', 'FETCH_TRANSFERS', 'FETCH_DEATHS']);
                           alert('Ordem de Mercado/Mortes enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Mercado/Mortes
                    </button>`);
   fs.writeFileSync('frontend/src/views/AdminDashboard.jsx', lines.join('\n'), 'utf8');
   console.log('Replaced by line indices!');
} else {
   console.log('Not found by line indices.');
}
