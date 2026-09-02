import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { ShoppingBag, Search, Plus, X, Coins, Clock, CheckCircle, Tag, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GuildMarket({ isAdmin }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm, setPostForm] = useState({ 
    seller: '', 
    item: '', 
    price: '', 
    category: 'Equipamento' 
  });
  const [postError, setPostError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    
    const { data: allItems, error } = await supabase
      .from('guild_market')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (!error) {
      setItems(allItems || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    setPostForm({ 
      seller: profile?.main_character || '', 
      item: '', 
      price: '', 
      category: 'Equipamento' 
    });
    setPostError('');
    setShowPostModal(true);
  };

  const handlePostItem = async (e) => {
    e.preventDefault();
    setPostError('');
    
    if (!postForm.seller || !postForm.item || !postForm.price) {
      setPostError("Preencha todos os campos obrigatórios.");
      return;
    }

    const { error } = await supabase.from('guild_market').insert([{
      seller_name: postForm.seller,
      item_name: postForm.item,
      price: postForm.price,
      category: postForm.category,
      status: 'Active'
    }]);

    if (error) {
      setPostError('Erro ao publicar anúncio. Você liberou a tabela de Market no Supabase?');
      return;
    }

    setShowPostModal(false);
    fetchData();
  };

  const handleMarkSold = async (id) => {
    const pwd = prompt("Tem certeza que vendeu este item? Digite 'sim' para confirmar a remoção:");
    if (pwd && pwd.toLowerCase() === 'sim') {
      await supabase.from('guild_market').update({ status: 'Sold' }).eq('id', id);
      fetchData();
    }
  };

  const handleAdminDelete = async (id) => {
    if (window.confirm('Deletar anúncio definitivamente?')) {
      await supabase.from('guild_market').delete().eq('id', id);
      fetchData();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.seller_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-black text-gray-200 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center tracking-tight">
            <ShoppingBag className="mr-3 text-yellow-500" size={36} />
            Mercado Interno
          </h1>
          <p className="text-gray-400 mt-1 font-sans">
            Compre e venda itens direto com membros da guilda, sem taxas de Market.
          </p>
        </div>
        <button 
          onClick={openModal}
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded shadow-tibia-glow transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Anunciar Item
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-tibia-card p-4 rounded-lg border border-tibia-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por item ou vendedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-tibia-bg border border-tibia-border rounded py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          {['All', 'Equipamento', 'Imbuements', 'Tibia Coins', 'Outros'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-yellow-600 text-white font-bold shadow-tibia-glow' : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'}`}
            >
              {cat === 'All' ? 'Todas Categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-black/30 rounded-lg border border-white/5">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum anúncio encontrado.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-tibia-card border border-tibia-border rounded-lg overflow-hidden shadow-xl hover:border-yellow-500/50 transition-colors group relative">
              {isAdmin && (
                <button onClick={() => handleAdminDelete(item.id)} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X size={14} />
                </button>
              )}
              <div className="bg-black/60 p-4 border-b border-tibia-border relative">
                <span className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider bg-yellow-900/20 px-2 py-1 rounded border border-yellow-500/20 mb-2 inline-block">
                  {item.category}
                </span>
                <h3 className="text-xl font-bold text-white mb-1 truncate">{item.item_name}</h3>
                <div className="flex items-center text-green-400 font-mono text-lg">
                  <Coins size={16} className="mr-2" />
                  {item.price}
                </div>
              </div>
              <div className="p-4 bg-tibia-card">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 mb-1">Vendedor</span>
                    <span className="text-sm font-bold text-gray-300 flex items-center">
                      <Tag size={12} className="mr-1 text-gray-500" /> {item.seller_name}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-500 mb-1">Anunciado</span>
                    <span className="text-xs text-gray-400 flex items-center justify-end">
                      <Clock size={10} className="mr-1" /> {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
                
                {item.seller_name.toLowerCase() === (profile?.main_character || '').toLowerCase() || isAdmin ? (
                  <button 
                    onClick={() => handleMarkSold(item.id)}
                    className="w-full bg-black/40 hover:bg-green-900/40 text-gray-400 hover:text-green-400 border border-white/5 hover:border-green-500/50 py-2 rounded text-sm transition-colors flex justify-center items-center"
                  >
                    <CheckCircle size={14} className="mr-2" /> Marcar como Vendido
                  </button>
                ) : (
                  <div className="w-full text-center py-2 text-xs text-gray-500 bg-black/30 rounded border border-white/5">
                    Mande PM para {item.seller_name} in-game ou procure no TS!
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tibia-card border border-yellow-500/50 rounded-lg p-6 max-w-md w-full shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-medieval text-yellow-500 flex items-center">
                <ShoppingBag className="mr-2" /> Novo Anúncio
              </h3>
              <button onClick={() => setShowPostModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            
            {postError && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {postError}
              </div>
            )}

            <form onSubmit={handlePostItem} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Seu Nick (Vendedor)</label>
                <input 
                  type="text" 
                  value={postForm.seller}
                  onChange={e => setPostForm({...postForm, seller: e.target.value})}
                  className="w-full bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-yellow-500"
                  placeholder="Ex: Lord YaK"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Item</label>
                <input 
                  type="text" 
                  value={postForm.item}
                  onChange={e => setPostForm({...postForm, item: e.target.value})}
                  className="w-full bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-yellow-500"
                  placeholder="Ex: Falcon Greaves"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço</label>
                  <input 
                    type="text" 
                    value={postForm.price}
                    onChange={e => setPostForm({...postForm, price: e.target.value})}
                    className="w-full bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-yellow-500"
                    placeholder="Ex: 40kk ou 250 TC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                  <select 
                    value={postForm.category}
                    onChange={e => setPostForm({...postForm, category: e.target.value})}
                    className="w-full bg-black border border-tibia-border rounded p-2 text-white outline-none focus:border-yellow-500"
                  >
                    <option>Equipamento</option>
                    <option>Imbuements</option>
                    <option>Tibia Coins</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded mt-4 transition-colors shadow-tibia-glow"
              >
                Publicar Anúncio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
