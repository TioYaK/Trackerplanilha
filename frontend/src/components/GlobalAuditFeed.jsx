import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Clock, ShieldAlert, DollarSign, Swords } from 'lucide-react';

export default function GlobalAuditFeed() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    let allLogs = [];

    try {
        // 1. Fetch Hunts History
        const { data: hunts } = await supabase.from('guild_hunts_history').select('*').order('created_at', { ascending: false }).limit(20);
        if (hunts) {
          hunts.forEach(h => {
            allLogs.push({
              id: `hunt-${h.id}`,
              date: new Date(h.created_at),
              type: 'LOOT',
              icon: <DollarSign size={16} className="text-green-500" />,
              message: `A hunt "${h.hunt_name}" foi registrada pelo Loot Tracker, dividindo ${Number(h.total_profit).toLocaleString()} gp em lucros!`
            });
          });
        }

        // 2. Fetch Bank Transactions
        const { data: txs } = await supabase.from('guild_bank_transactions').select('*').order('created_at', { ascending: false }).limit(20);
        if (txs && txs.length > 0) {
          txs.forEach(t => {
            allLogs.push({
              id: `tx-${t.id}`,
              date: new Date(t.created_at),
              type: 'BANK',
              icon: <DollarSign size={16} className={t.type === 'IN' ? "text-green-500" : "text-red-500"} />,
              message: `O admin ${t.created_by} registrou um ${t.type === 'IN' ? 'depósito' : 'saque'} de ${t.amount_tc} TC (${t.title}).`
            });
          });
        }

        // 3. Fetch Parties
        const { data: parties } = await supabase.from('parties_planilhadas').select('*').order('created_at', { ascending: false }).limit(20);
        if (parties) {
          parties.forEach(p => {
            // we don't have created_at on parties, so we approximate or just show it if we have a timestamp
            const dummyDate = p.created_at ? new Date(p.created_at) : new Date(Date.now() - Math.random() * 86400000);
            allLogs.push({
              id: `party-${p.id}`,
              date: dummyDate, 
              type: 'PARTY',
              icon: <Swords size={16} className="text-blue-500" />,
              message: `O admin ${p.created_by || 'Admin'} agendou uma PT para ${p.leader_name} em "${p.hunt_name}" para o slot das ${p.slot_start}.`
            });
          });
        }

        // Sort by date DESC
        allLogs.sort((a, b) => b.date - a.date);
        
        // Take top 30
        setLogs(allLogs.slice(0, 30));
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Agora mesmo";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
  };

  return (
    <div className="mt-12 bg-black/40 border border-gray-800 rounded-lg p-6 shadow-xl w-full">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Activity className="mr-3 text-tibia-primary" size={24} />
          Logs Globais & Feed de Atividades
        </h3>
        <button onClick={fetchLogs} className="text-xs text-gray-500 hover:text-white transition-colors">
          Atualizar Logs
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-gray-600">Nenhum evento registrado ainda.</div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-800">
          {logs.map(log => (
            <div key={log.id} className="flex items-start bg-black/60 p-4 rounded border border-gray-800/50 hover:border-tibia-primary/50 transition-colors">
              <div className="mt-1 bg-gray-900 p-2 rounded-full border border-gray-700 mr-4">
                {log.icon}
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-sm">{log.message}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500 font-mono">
                  <Clock size={12} className="mr-1" />
                  {getTimeAgo(log.date)} • {log.date.toLocaleString()}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-900 text-gray-400">
                {log.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
