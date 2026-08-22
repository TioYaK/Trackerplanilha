import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calculator, Trophy, Save, Trash2, Code, ArrowRight } from 'lucide-react';

export default function LootTracker({ isAdmin }) {
  const [logText, setLogText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [huntName, setHuntName] = useState('');
  const [huntsHistory, setHuntsHistory] = useState([]);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('guild_hunts_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && error.code === '42P01') {
      setNeedsSetup(true);
    } else if (data) {
      setHuntsHistory(data);
    }
    setLoading(false);
  };

  const handleParse = () => {
    if (!logText.trim()) return;
    
    const lines = logText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let tBalance = 0;
    let players = [];
    let currentPlayer = null;

    // Smart RegEx parsing
    for (let line of lines) {
        const cleanVal = parseInt(line.replace(/[^0-9-]/g, ''), 10);
        if (line.startsWith('Balance:')) {
            if (!currentPlayer) tBalance = cleanVal;
            else currentPlayer.balance = cleanVal;
        } else if (line.startsWith('Loot Type:')) {
            // Ignore
        } else if (line.startsWith('Loot:')) {
            if (currentPlayer) currentPlayer.loot = cleanVal;
        } else if (line.startsWith('Supplies:')) {
            if (currentPlayer) currentPlayer.supplies = cleanVal;
        } else if (line.startsWith('Damage:')) {
            if (currentPlayer) currentPlayer.damage = cleanVal;
        } else if (line.startsWith('Healing:')) {
            if (currentPlayer) currentPlayer.healing = cleanVal;
        } else if (line.startsWith('Session')) {
            // Ignore
        } else {
            // It's a name!
            if (!line.includes(':') && line.length > 2) {
                const name = line.replace(' (Leader)', '');
                if (name !== 'Balance' && name !== 'Loot' && name !== 'Supplies') {
                    currentPlayer = { name, balance: 0, loot: 0, supplies: 0, damage: 0, healing: 0 };
                    players.push(currentPlayer);
                }
            }
        }
    }

    if (players.length > 0) {
        setParsedData({ totalBalance: tBalance, players });
        calculateTransfers(players, tBalance);
    } else {
        alert('Não foi possível ler os jogadores. Cole exatamente o texto do Party Analyzer do Tibia.');
    }
  };

  const calculateTransfers = (players, totalBalance) => {
      const target = totalBalance / players.length;
      let trans = [];
      let givers = players.filter(p => p.balance > target).map(p => ({ ...p, extra: p.balance - target }));
      let receivers = players.filter(p => p.balance < target).map(p => ({ ...p, needs: target - p.balance }));

      for (let g of givers) {
          for (let r of receivers) {
              if (g.extra > 0 && r.needs > 0) {
                  const amount = Math.round(Math.min(g.extra, r.needs));
                  trans.push({ from: g.name, to: r.name, amount });
                  g.extra -= amount;
                  r.needs -= amount;
              }
          }
      }
      setTransfers(trans);
  };

  const handleSave = async () => {
    if (!isAdmin) {
        alert('Apenas admins podem salvar hunts oficiais.');
        return;
    }
    if (!parsedData || !huntName.trim()) {
        alert('Nome da hunt é obrigatório.');
        return;
    }
    
    const payload = {
        hunt_name: huntName,
        total_profit: parsedData.totalBalance,
        members: parsedData.players
    };

    const { error } = await supabase.from('guild_hunts_history').insert([payload]);
    if (error) {
        console.error(error);
        alert('Erro ao salvar hunt.');
    } else {
        alert('Hunt salva no banco de dados!');
        setLogText('');
        setParsedData(null);
        setHuntName('');
        fetchHistory();
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm('Excluir este registro?')) return;
    await supabase.from('guild_hunts_history').delete().eq('id', id);
    fetchHistory();
  };

  // Build ranking
  const playerProfits = {};
  huntsHistory.forEach(h => {
      if (h.members && Array.isArray(h.members)) {
          h.members.forEach(m => {
              if (!playerProfits[m.name]) playerProfits[m.name] = 0;
              // Add their individual target share
              playerProfits[m.name] += (h.total_profit / h.members.length);
          });
      }
  });
  const ranking = Object.entries(playerProfits)
    .map(([name, profit]) => ({ name, profit: Math.round(profit) }))
    .sort((a,b) => b.profit - a.profit)
    .slice(0, 10);

  if (needsSetup) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-red-500 mb-6">Módulo não Inicializado!</h2>
        <p className="text-gray-300 mb-8">Para usar a Calculadora de Loot Global, um Admin precisa criar a tabela no Supabase do projeto.</p>
        <div className="bg-black/50 p-6 rounded-lg border border-gray-700 text-left overflow-x-auto">
          <pre className="text-green-400 font-mono text-sm">
            {`CREATE TABLE guild_hunts_history (
    id SERIAL PRIMARY KEY,
    hunt_name TEXT,
    total_profit BIGINT,
    members JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}
          </pre>
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 bg-tibia-primary text-white font-bold py-2 px-6 rounded hover:bg-tibia-gold transition-colors">
          Já executei o comando SQL
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Calculadora de Loot & Riqueza</h2>
          <p className="text-gray-400 font-sans">Divida o lucro das hunts automaticamente e gere o ranking dos maiores geradores de dinheiro.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Calculadora */}
        <div className="space-y-6">
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Calculator className="mr-2 text-blue-400" size={24} />
              Party Analyzer Parser
            </h3>
            <textarea
              className="w-full h-48 bg-black/50 border border-gray-700 text-gray-300 p-4 rounded text-sm font-mono mb-4 focus:outline-none focus:border-tibia-primary"
              placeholder="Cole aqui o Log do Party Analyzer do Tibia..."
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
            ></textarea>
            <button
              onClick={handleParse}
              className="w-full bg-tibia-primary hover:bg-tibia-gold text-white font-bold py-3 px-4 rounded shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
            >
              Calcular Divisão de Loot
            </button>
          </div>

          {parsedData && (
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl animate-fade-in">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                    <h3 className="text-xl font-bold text-green-400">Lucro Total: {parsedData.totalBalance.toLocaleString()} gp</h3>
                    <span className="text-sm text-gray-400">Quota: {Math.round(parsedData.totalBalance / parsedData.players.length).toLocaleString()} gp / jogador</span>
                </div>
                
                {transfers.length > 0 ? (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Quem Paga Quem:</h4>
                        <div className="space-y-2">
                            {transfers.map((t, i) => (
                                <div key={i} className="flex items-center justify-between bg-black/40 p-3 rounded border border-gray-800">
                                    <span className="text-red-400 font-bold">{t.from}</span>
                                    <div className="flex flex-col items-center mx-4">
                                        <span className="text-xs text-green-400 font-mono mb-1">{t.amount.toLocaleString()} gp</span>
                                        <ArrowRight size={16} className="text-gray-500" />
                                    </div>
                                    <span className="text-blue-400 font-bold">{t.to}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-green-500 font-bold">A hunt deu prejuízo ou ninguém precisa transferir nada!</div>
                )}

                {isAdmin && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Salvar no Histórico (Admin):</h4>
                        <div className="flex space-x-4">
                            <input
                                type="text"
                                className="flex-1 bg-black border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-tibia-primary"
                                placeholder="Nome da Hunt (ex: Ferumbras Ascendant)"
                                value={huntName}
                                onChange={(e) => setHuntName(e.target.value)}
                            />
                            <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded flex items-center"
                            >
                                <Save size={18} className="mr-2" />
                                Salvar
                            </button>
                        </div>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Lado Direito: Histórico e Ranking */}
        <div className="space-y-6">
          <div className="bg-tibia-card border border-yellow-900/50 rounded-lg p-6 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
            <h3 className="text-2xl font-bold text-yellow-500 mb-6 flex items-center justify-center">
              <Trophy className="mr-3" size={28} />
              Hall of Wealth (Top 10 Ricos)
            </h3>
            
            <div className="space-y-3">
              {ranking.map((player, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/60 p-4 rounded-lg border border-yellow-900/30">
                  <div className="flex items-center">
                    <span className={\`w-8 h-8 flex items-center justify-center font-bold rounded-full mr-4 \${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'}\`}>
                        {idx + 1}
                    </span>
                    <span className="font-bold text-white text-lg">{player.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-green-400">{player.profit.toLocaleString()} gp</span>
                    <span className="text-xs text-gray-500">Lucro Gerado à Guilda</span>
                  </div>
                </div>
              ))}
              {ranking.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Nenhum registro no banco de dados. Calcule e salve uma hunt para iniciar o ranking!</div>
              )}
            </div>
          </div>

          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
             <h3 className="text-lg font-bold text-gray-300 mb-4">Últimas Hunts Salvas</h3>
             <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                 {huntsHistory.map((h, i) => (
                     <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded border border-gray-800">
                         <div>
                             <p className="text-sm font-bold text-white">{h.hunt_name}</p>
                             <p className="text-[10px] text-gray-500">{new Date(h.created_at).toLocaleString()}</p>
                         </div>
                         <div className="flex items-center">
                             <span className="text-sm font-black text-green-500 mr-4">+{h.total_profit.toLocaleString()}</span>
                             {isAdmin && (
                                 <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-400">
                                     <Trash2 size={16} />
                                 </button>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
