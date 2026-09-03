const fs = require('fs');
let c = fs.readFileSync('frontend/src/views/AdminDashboard.jsx', 'utf8');

const target = `<button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 1000).toISOString() }).in('task_type', ['FETCH_ONLINES', 'FETCH_GUILD']);
                           alert('Ordem de sincronização enviada para todos os workers ativos!');
                        } catch (e) {
                           alert('Erro ao forçar sincronização.');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Sincronização Agora
                    </button>`;

const replacement = `<button 
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
                    </button>`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('frontend/src/views/AdminDashboard.jsx', c, 'utf8');
} else {
  console.log("Target not found!");
}
