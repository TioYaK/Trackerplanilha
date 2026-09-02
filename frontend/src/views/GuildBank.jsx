import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Landmark, Check, X, Search, ShieldAlert, Banknote, FileText, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function GuildBank({ isAdmin }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [roster, setRoster] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('mensalidades'); // 'mensalidades' | 'transparencia'
  
  // Modal de transação
  const [showTxModal, setShowTxModal] = useState(false);
  const [txForm, setTxForm] = useState({ title: '', amount: '', type: 'OUT', description: '' });

  // O mês de cobrança vira apenas no dia 15
  const getBillingMonth = () => {
    const now = new Date();
    if (now.getDate() < 15) {
      now.setMonth(now.getMonth() - 1);
    }
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getBillingMonth());

  const fetchData = async () => {
    setLoading(true);
    
    // Test tables
    const { error: testErr } = await supabase.from('guild_bank_payments').select('id').limit(1);
    if (testErr && testErr.code === '42P01') {
      setNeedsSetup(true);
      setLoading(false);
      return;
    }

    // Pagamentos
    let pData = [];
    let pPage = 0;
    while(true) {
        const { data } = await supabase.from('guild_bank_payments').select('*').eq('payment_month', selectedMonth).range(pPage*1000, (pPage+1)*1000-1);
        if (!data || data.length === 0) break;
        pData.push(...data);
        if (data.length < 1000) break;
        pPage++;
    }
      
    // Membros
    let allRoster = [];
    let page = 0;
    while(true) {
      const { data } = await supabase.from('guild_members').select('*').range(page*1000, (page+1)*1000-1);
      if (!data || data.length === 0) break;
      allRoster.push(...data);
      if (data.length < 1000) break;
      page++;
    }
    setPayments(pData);
    setRoster(allRoster);

    // Transações
    const { data: txData } = await supabase.from('guild_bank_transactions').select('*').order('created_at', { ascending: false });
    if (txData) setTransactions(txData);
    
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
          admin_name: profile?.main_character || 'Admin'
        }]);
    }
    fetchData();
  };

  const handlePostTx = async (e) => {
    e.preventDefault();
    if (!txForm.title || !txForm.amount) return;

    await supabase.from('guild_bank_transactions').insert([{
      title: txForm.title,
      amount_tc: parseInt(txForm.amount, 10),
      type: txForm.type,
      description: txForm.description,
      created_by: profile?.main_character || 'Admin'
    }]);

    setShowTxModal(false);
    setTxForm({ title: '', amount: '', type: 'OUT', description: '' });
    fetchData();
  };

  if (needsSetup) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center animate-fade-in">
        <Landmark size={64} className="mx-auto text-yellow-500 mb-6" />
        <h2 className="text-4xl font-medieval text-white mb-4">Guild Bank (Caixa da Guilda)</h2>
        <p className="text-gray-400 mb-8">O sistema financeiro precisa ser inicializado no banco de dados.</p>
        <div className="bg-black/50 border border-gray-700 p-6 rounded-lg text-left">
          <p className="text-yellow-400 font-bold mb-2 flex items-center"><ShieldAlert size={18} className="mr-2"/> Ação Necessária (Admin)</p>
          <p className="text-sm text-gray-300 mb-4">Verifique o script de fix gerado na pasta scratch e rode no Supabase SQL Editor.</p>
        </div>
      </div>
    );
  }

  const filteredRoster = roster.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 100);
  const totalCount = roster.length;
  const paidCount = payments.length;
  const tcTotal = paidCount * 250; // 250 TC por mensalidade
  
  const bankBalance = tcTotal + transactions.reduce((acc, curr) => {
    return curr.type === 'IN' ? acc + curr.amount_tc : acc - curr.amount_tc;
  }, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-4xl font-medieval text-gradient-gold mb-2 flex items-center">
            <Landmark className="mr-3 text-yellow-500" size={36} />
            Tesouraria da Guilda
          </h2>
          <p className="text-gray-400 font-sans">Administração de mensalidades e prestação de contas públicas.</p>
        </div>
      </div>

      <div className="mb-6 flex space-x-2 border-b border-tibia-border pb-2">
        <button
          onClick={() => setActiveTab('mensalidades')}
          className={`px-6 py-3 font-bold rounded-t-lg transition-all ${
            activeTab === 'mensalidades' 
              ? 'bg-tibia-primary text-black shadow-tibia-glow' 
              : 'bg-tibia-card text-gray-400 hover:text-white hover:bg-black/40'
          }`}
        >
          <Banknote className="inline mr-2" size={18} /> Mensalidades
        </button>
        <button
          onClick={() => setActiveTab('transparencia')}
          className={`px-6 py-3 font-bold rounded-t-lg transition-all ${
            activeTab === 'transparencia' 
              ? 'bg-tibia-primary text-black shadow-tibia-glow' 
              : 'bg-tibia-card text-gray-400 hover:text-white hover:bg-black/40'
          }`}
        >
          <FileText className="inline mr-2" size={18} /> Transparência Pública
        </button>
      </div>

      {activeTab === 'mensalidades' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Controle de Pagamentos</h3>
            <div className="flex items-center space-x-4 bg-tibia-card border border-tibia-border p-2 rounded-lg">
              <span className="text-gray-400 text-sm font-bold ml-2">Mês de Referência:</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-black/50 border border-tibia-border rounded py-1 px-3 text-white outline-none focus:border-yellow-500"
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
                <p className="text-sm text-yellow-500 font-bold uppercase tracking-wider mb-1">Arrecadação Mês</p>
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
        </>
      )}

      {activeTab === 'transparencia' && (
        <div className="space-y-6">
          <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-lg flex justify-between items-center shadow-lg">
            <div>
              <p className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-1">Saldo Atual do Banco da Guilda</p>
              <p className={`text-4xl font-black ${bankBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {bankBalance > 0 ? '+' : ''}{bankBalance.toLocaleString()} <span className="text-lg">TCs</span>
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowTxModal(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                <Plus size={18} className="mr-1"/> Lançar Despesa/Receita
              </button>
            )}
          </div>

          <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 bg-black/40 border-b border-tibia-border">
              <h3 className="text-lg font-bold text-white">Histórico de Transações</h3>
              <p className="text-xs text-gray-500">Toda movimentação do banco é pública para todos os membros.</p>
            </div>
            <div className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhuma transação registrada no histórico.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map(tx => {
                    const isIncome = tx.type === 'IN';
                    return (
                      <div key={tx.id} className="bg-black/40 border border-tibia-border rounded p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isIncome ? <ArrowDownRight size={18} className="text-green-500" /> : <ArrowUpRight size={18} className="text-red-500" />}
                            <h4 className="text-white font-bold text-lg">{tx.title}</h4>
                          </div>
                          <p className="text-sm text-gray-400">{tx.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(tx.created_at).toLocaleString()} • Lançado por <span className="text-tibia-primary">{tx.created_by}</span>
                          </p>
                        </div>
                        <div className={`text-2xl font-black ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                          {isIncome ? '+' : '-'}{tx.amount_tc} TC
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transação */}
      {showTxModal && isAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tibia-bg border border-tibia-border rounded-lg w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-tibia-card border-b border-tibia-border p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Nova Transação</h3>
              <button onClick={() => setShowTxModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handlePostTx} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Título / Destino</label>
                <input required type="text" value={txForm.title} onChange={e => setTxForm({...txForm, title: e.target.value})} className="w-full bg-black/50 border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary" placeholder="ex: Compra de GH / Pagamento Aliado" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-300 mb-1">Tipo</label>
                  <select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})} className="w-full bg-black/50 border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary">
                    <option value="OUT">Saída (Despesa)</option>
                    <option value="IN">Entrada (Receita Extra)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-300 mb-1">Valor (TCs)</label>
                  <input required type="number" min="1" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full bg-black/50 border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary" placeholder="ex: 1500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Detalhes (Opcional)</label>
                <textarea rows="3" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className="w-full bg-black/50 border border-tibia-border rounded p-2 text-white outline-none focus:border-tibia-primary" placeholder="Descreva os detalhes da transação..." />
              </div>
              <button type="submit" className="w-full bg-tibia-primary hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4 transition-colors">
                Lançar Transação
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
