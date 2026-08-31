import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, AlertTriangle, Clock, TrendingDown, Coins, Search, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BazaarSniper() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, hunted, opportunity

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('bazaar_alerts')
        .select('*')
        .gt('auction_end', now)
        .order('auction_end', { ascending: true });

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Erro ao buscar alertas do Bazaar:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter(a => {
    if (filter === 'hunted') return a.is_hunted;
    if (filter === 'opportunity') return a.is_sniping_opportunity;
    return true;
  });

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto bg-black text-gray-200 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center tracking-tight">
            <Target className="mr-3 text-red-500" size={36} />
            Sniper de Char Bazaar
          </h1>
          <p className="text-gray-400 mt-1 font-sans">
            Rastreamento automático de inimigos tentando vender personagens e pechinchas de alto nível.
          </p>
        </div>
      </div>

      {/* Stats/Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setFilter('all')}
          className={`bg-tibia-card border p-4 rounded-lg cursor-pointer transition-colors ${filter === 'all' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-tibia-border hover:border-gray-500'}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-bold uppercase text-xs">Total Rastreado</h3>
            <Search className="text-blue-500" size={18} />
          </div>
          <p className="text-3xl font-black text-white mt-2">{alerts.length}</p>
        </div>

        <div 
          onClick={() => setFilter('hunted')}
          className={`bg-tibia-card border p-4 rounded-lg cursor-pointer transition-colors ${filter === 'hunted' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-tibia-border hover:border-gray-500'}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-bold uppercase text-xs">Inimigos Fugindo (Hunteds)</h3>
            <AlertTriangle className="text-red-500" size={18} />
          </div>
          <p className="text-3xl font-black text-white mt-2">{alerts.filter(a => a.is_hunted).length}</p>
        </div>

        <div 
          onClick={() => setFilter('opportunity')}
          className={`bg-tibia-card border p-4 rounded-lg cursor-pointer transition-colors ${filter === 'opportunity' ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-tibia-border hover:border-gray-500'}`}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-bold uppercase text-xs">Oportunidades (Lvl 500+)</h3>
            <TrendingDown className="text-yellow-500" size={18} />
          </div>
          <p className="text-3xl font-black text-white mt-2">{alerts.filter(a => a.is_sniping_opportunity).length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">
          <Target className="mx-auto mb-4" size={48} />
          <p>Varrendo o mercado negro...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-black/50 border border-tibia-border p-10 rounded-lg text-center">
          <p className="text-gray-400">Nenhum personagem correspondente aos filtros no momento.</p>
          <p className="text-xs text-gray-600 mt-2">O algoritmo varre o leilão a cada 10 minutos automaticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(auction => {
            const endsIn = formatDistanceToNow(new Date(auction.auction_end), { locale: ptBR, addSuffix: true });
            
            return (
              <div key={auction.id} className={`bg-tibia-card border ${auction.is_hunted ? 'border-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-yellow-900 shadow-[0_0_15px_rgba(234,179,8,0.1)]'} p-5 rounded-lg relative overflow-hidden group`}>
                
                {/* Etiqueta */}
                <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-lg ${auction.is_hunted ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                  {auction.is_hunted ? 'ALVO INIMIGO' : 'OPORTUNIDADE'}
                </div>

                <div className="flex items-center space-x-4 mb-4 mt-2">
                  <div className="w-14 h-14 bg-black/60 border border-tibia-border rounded-full flex items-center justify-center">
                    <img 
                      src={`https://github.com/TioYaK/Trackerplanilha/raw/main/scrapper/images/vocations/${(auction.vocation || 'None').toLowerCase().replace(' ', '')}.png`} 
                      alt="Voc"
                      className="w-10 h-10 object-contain drop-shadow-md"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">{auction.character_name}</h3>
                    <p className="text-gray-400 text-sm font-bold">Lvl {auction.level} • {auction.vocation}</p>
                    <p className="text-xs text-gray-500">{auction.world_name}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-black/40 p-3 rounded flex justify-between items-center border border-white/5">
                    <span className="text-gray-400 text-sm">Lance Atual:</span>
                    <span className="font-bold text-yellow-400 flex items-center text-lg">
                      {auction.current_bid} <Coins size={14} className="ml-1" />
                    </span>
                  </div>
                  
                  <div className="bg-black/40 p-3 rounded flex justify-between items-center border border-white/5">
                    <span className="text-gray-400 text-sm">Termina:</span>
                    <span className="font-bold text-blue-400 flex items-center">
                      <Clock size={14} className="mr-1" /> {endsIn}
                    </span>
                  </div>
                </div>

                <a 
                  href={`https://rubinot.com.br/bazaar/${auction.auction_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2 bg-tibia-wood hover:bg-tibia-wood/80 text-tibia-highlight font-medieval border border-tibia-primary rounded transition-colors"
                >
                  Ver no Site Oficial <ExternalLink size={14} className="inline ml-1" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
