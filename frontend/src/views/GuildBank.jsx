import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Landmark, Check, X, Search, ShieldAlert, Banknote } from 'lucide-react';

export default function GuildBank({ isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-08"
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const fetchData = async () => {
    setLoading(true);
    
    // Test if table exists
    const { error: testErr } = await supabase.from('guild_bank_payments').select('id').limit(1);
    if (testErr && testErr.code === '42P01') {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    // Fetch payments for selected month
    let pData = [];
    let pPage = 0;
    while(true) {
        const { data } = await supabase
          .from('guild_bank_payments')
          .select('*')
          .eq('payment_month', selectedMonth)
          .range(pPage*1000, (pPage+1)*1000-1);
        if (!data || data.length === 0) break;
        pData.push(...data);
        if (data.length < 1000) break;
        pPage++;
    }
      
    if (pData) setPayments(pData);

    // Fetch roster to know who should pay
    let allRoster = [];
    let page = 0;
    while(true) {
      const { data } = await supabase.from('view_guild_roster').select('name, vocation, level').range(page*1000, (page+1)*1000 -1);
      if (!data || data.length === 0) break;
      allRoster.push(...data);
      page++;
    }
    setRoster(allRoster);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const togglePayment = async (playerName, isPaid) => {
    if (!isAdmin) return;
    
    if (isPaid) {
      await supabase.from('guild_bank_payments')
        .delete()
        .eq('character_name', playerName)
        .eq('payment_month', selectedMonth);
    } else {
      await supabase.from('guild_bank_payments')
        .insert([{
          character_name: playerName,
          payment_month: selectedMonth,
          admin_name: 'Admin'
        }]);
    }
    fetchData();
  };

  const sqlSetup = `
CREATE TABLE IF NOT EXISTS guild_bank_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_name TEXT NOT NULL,
    payment_month TEXT NOT NULL,
    amount INT NOT NULL DEFAULT 100,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_name TEXT NOT NULL
);
  `;

  if (needsSetup) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center animate-fade-in">
        <Landmark size={64} className="mx-auto text-yellow-500 mb-6" />
        <h2 className="text-4xl font-medieval text-white mb-4">Central do Guild Bank</h2>
        <p className="text-gray-400 mb-8">O sistema de tesouraria precisa ser inicializado no banco de dados.</p>
        
        <div className="bg-black/50 border border-gray-700 p-6 rounded-lg text-left">
          <p className="text-yellow-400 font-bold mb-2 flex items-center"><ShieldAlert size={18} className="mr-2"/> Ação Necessária (Admin)</p>
          <p className="text-sm text-gray-300 mb-4">Rode o seguinte código SQL no painel do seu Supabase (SQL Editor) para habilitar esta aba:</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto border border-gray-700">{sqlSetup}</pre>
          <button onClick={() => window.location.reload()} className="mt-6 bg-tibia-primary text-black font-bold px-6 py-2 rounded">
            Já rodei o comando! (Recarregar)
          </button>
        </div>
      </div>
    );
  }

  const filteredRoster = roster.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const paidCount = payments.length;
  const totalCount = roster.length;
  const tcTotal = paidCount * 100; // Assuming 100 TC

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Guild Bank (Tesouraria)</h2>
          <p className="text-gray-400 font-sans">Gerencie o pagamento da mensalidade (TC) de cada membro para fundos de guerra.</p>
        </div>
        <div className="flex items-center">
          <span className="text-gray-400 mr-2 font-bold">Mês Base:</span>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-black/50 border border-tibia-border rounded py-2 px-4 text-white outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-tibia-card border border-green-900/50 p-6 rounded-lg flex justify-between items-center shadow-xl">
          <div>
            <p className="text-sm text-green-400 font-bold uppercase tracking-wider mb-1">Pagantes ({selectedMonth})</p>
            <p className="text-3xl font-black text-white">{paidCount} <span className="text-sm text-gray-500 font-normal">/ {totalCount}</span></p>
          </div>
          <Check size={40} className="text-green-500/50" />
        </div>
        <div className="bg-tibia-card border border-red-900/50 p-6 rounded-lg flex justify-between items-center shadow-xl">
          <div>
            <p className="text-sm text-red-400 font-bold uppercase tracking-wider mb-1">Inadimplentes</p>
            <p className="text-3xl font-black text-white">{totalCount - paidCount}</p>
          </div>
          <X size={40} className="text-red-500/50" />
        </div>
        <div className="bg-tibia-card border border-yellow-900/50 p-6 rounded-lg flex justify-between items-center shadow-xl">
          <div>
            <p className="text-sm text-yellow-500 font-bold uppercase tracking-wider mb-1">Caixa do Mês</p>
            <p className="text-3xl font-black text-yellow-400">{tcTotal.toLocaleString()} <span className="text-lg">TCs</span></p>
          </div>
          <Banknote size={40} className="text-yellow-500/50" />
        </div>
      </div>

      <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 bg-black/40 border-b border-tibia-border flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar membro para dar baixa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-tibia-bg border border-tibia-border rounded py-2 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          {!isAdmin && <span className="text-xs text-gray-500 bg-black/50 px-2 py-1 rounded border border-white/5">Somente Admins podem dar baixa.</span>}
        </div>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-black/60 text-gray-400 uppercase font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Membro</th>
                <th className="px-6 py-4">Vocação / Level</th>
                <th className="px-6 py-4">Status de Pagamento</th>
                <th className="px-6 py-4 text-right">Ação (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tibia-border/50">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div></td></tr>
              ) : filteredRoster.map(m => {
                const isPaid = payments.some(p => p.character_name === m.name);
                return (
                  <tr key={m.name} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{m.name}</td>
                    <td className="px-6 py-4 text-gray-400">{m.vocation} <span className="text-xs bg-gray-800 px-1 rounded ml-1 border border-gray-700">Lvl {m.level}</span></td>
                    <td className="px-6 py-4">
                      {isPaid ? (
                        <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded border border-green-500/30 flex items-center w-max">
                          <Check size={14} className="mr-1" /> Pago
                        </span>
                      ) : (
                        <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded border border-red-500/30 flex items-center w-max">
                          <X size={14} className="mr-1" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        <button 
                          onClick={() => togglePayment(m.name, isPaid)}
                          className={`px-4 py-2 rounded text-sm font-bold transition-colors ${isPaid ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}
                        >
                          {isPaid ? 'Desfazer Baixa' : 'Dar Baixa (Recebido)'}
                        </button>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
