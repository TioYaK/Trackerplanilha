import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Skull, Plane, ShieldAlert, RefreshCw, Radar, 
  ArrowDownLeft, ArrowUpRight, Search, Shield, Target,
  Info, Users, Flame, Clock, Sparkles, Filter
} from 'lucide-react';
import { toBrtDateStr, toBrtTimeStr } from '../lib/tibiaUtils';
import AdBanner from '../components/AdBanner';

export default function ExtremeAnalytics() {
  const [deaths, setDeaths] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filtros locais
  const [deathFilter, setDeathFilter] = useState('all'); // 'all', 'hunted', 'ally'
  const [deathSearch, setDeathSearch] = useState('');
  
  const [transferFilter, setTransferFilter] = useState('all'); // 'all', 'IN', 'OUT'
  const [transferSearch, setTransferSearch] = useState('');

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const { data: deathsData } = await supabase
        .from('recent_deaths')
        .select('id, character_name, level, killed_by, death_time, is_hunted, is_guild_member, world')
        .order('death_time', { ascending: false })
        .limit(40);
      if (deathsData) setDeaths(deathsData);

      const { data: transfersData } = await supabase
        .from('server_transfers')
        .select('id, character_name, from_world, to_world, transfer_date, transfer_type, other_world')
        .order('transfer_date', { ascending: false })
        .limit(40);
      if (transfersData) setTransfers(transfersData);
      
      setLastUpdate(new Date());
    } catch (e) {
      console.error('Erro ao buscar dados do radar:', e);
    }
    if (!isBackground) setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData(true);
    }, 120000); // 2 minutos para economia de banda
    return () => clearInterval(interval);
  }, []);

  // Métricas para os Cards de KPI
  const stats = useMemo(() => {
    const incomingTransfers = transfers.filter(t => t.transfer_type === 'IN').length;
    const outgoingTransfers = transfers.filter(t => t.transfer_type === 'OUT').length;
    const huntedDeaths = deaths.filter(d => d.is_hunted).length;
    const allyDeaths = deaths.filter(d => d.is_guild_member).length;

    return {
      incomingTransfers,
      outgoingTransfers,
      huntedDeaths,
      allyDeaths,
      totalDeaths: deaths.length,
      totalTransfers: transfers.length
    };
  }, [deaths, transfers]);

  // Lista de mortes filtradas
  const filteredDeaths = useMemo(() => {
    return deaths.filter(d => {
      // Filtro por tipo
      if (deathFilter === 'hunted' && !d.is_hunted) return false;
      if (deathFilter === 'ally' && !d.is_guild_member) return false;

      // Filtro por busca de texto
      if (deathSearch.trim()) {
        const q = deathSearch.toLowerCase();
        const charMatches = d.character_name?.toLowerCase().includes(q);
        const killerMatches = d.killed_by?.toLowerCase().includes(q);
        return charMatches || killerMatches;
      }
      return true;
    });
  }, [deaths, deathFilter, deathSearch]);

  // Lista de transfers filtrados
  const filteredTransfers = useMemo(() => {
    return transfers.filter(t => {
      // Filtro por tipo
      if (transferFilter !== 'all' && t.transfer_type !== transferFilter) return false;

      // Filtro por busca de texto
      if (transferSearch.trim()) {
        const q = transferSearch.toLowerCase();
        const charMatches = t.character_name?.toLowerCase().includes(q);
        const worldMatches = t.other_world?.toLowerCase().includes(q);
        return charMatches || worldMatches;
      }
      return true;
    });
  }, [transfers, transferFilter, transferSearch]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      
      {/* ===================================================================== */}
      {/* CABEÇALHO DA PÁGINA COM EXPLICAÇÃO CLARA                              */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-tibia-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> Inteligência Militar VIP
            </span>
            <span className="text-gray-500 text-xs font-mono">
              Auto-sync a cada 60s
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medieval text-gradient-gold flex items-center gap-3">
            <Radar className="text-yellow-400 shrink-0" size={34} />
            Radar de Transfers & Mortes 👑
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 font-sans mt-1 max-w-3xl">
            Monitoramento de espionagem em tempo real: rastreie a movimentação de fronteiras (quem transferiu char para o seu mundo ou fugiu) e interceptação de baixas de guerra.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="glass-button text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95"
          >
            <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={16} />
            {loading ? 'Sincronizando...' : 'Atualizar Radar'}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* GUIA RÁPIDO: O QUE CADA RADAR SIGNIFICA                                */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-black/40 border border-white/10 rounded-2xl p-3.5 sm:p-4 text-xs">
        <div className="flex items-start gap-3 bg-teal-950/20 border border-teal-900/30 rounded-xl p-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0 text-teal-400">
            <Plane size={16} />
          </div>
          <div>
            <h4 className="font-bold text-teal-300 text-sm flex items-center gap-1.5">
              Controle de Fronteiras (World Transfers)
            </h4>
            <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
              Detecta <strong>reforços inimigos</strong> que compraram World Transfer para invadir o servidor ou jogadores que <strong>fugiram/quitaram</strong> transferindo para outros mundos.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-red-950/20 border border-red-900/30 rounded-xl p-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
            <Skull size={16} />
          </div>
          <div>
            <h4 className="font-bold text-red-300 text-sm flex items-center gap-1.5">
              Interceptação de Óbitos & Frags
            </h4>
            <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
              Rastreia em tempo real quando <strong>adversários da lista de Hunted</strong> são eliminados ou quando <strong>aliados da sua guilda</strong> caíram em batalha.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CARDS DE RESUMO TÁTICO (KPIS)                                          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Reforços Recebidos (IN) */}
        <div className="bg-gradient-to-br from-teal-950/40 via-black/80 to-black p-4 rounded-2xl border border-teal-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reforços (IN)</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-teal-200">
            {stats.incomingTransfers}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Desembarcaram no servidor
          </span>
        </div>

        {/* Fugas / Saídas (OUT) */}
        <div className="bg-gradient-to-br from-amber-950/40 via-black/80 to-black p-4 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fugas (OUT)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-200">
            {stats.outgoingTransfers}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Transferiram para fora
          </span>
        </div>

        {/* Baixas Inimigas (Hunted) */}
        <div className="bg-gradient-to-br from-red-950/40 via-black/80 to-black p-4 rounded-2xl border border-red-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inimigos Abatidos</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <Target size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-red-200">
            {stats.huntedDeaths}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Baixas de chars Hunted
          </span>
        </div>

        {/* Baixas Aliadas */}
        <div className="bg-gradient-to-br from-blue-950/40 via-black/80 to-black p-4 rounded-2xl border border-blue-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aliados Caídos</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-200">
            {stats.allyDeaths}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Baixas da guilda aliada
          </span>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* GRIDS PRINCIPAIS: MORTES & CONTROLE DE FRONTEIRAS                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* =================================================================== */}
        {/* PAINEL 1: REGISTRO DE ÓBITOS EM TEMPO REAL                          */}
        {/* =================================================================== */}
        <div className="bg-[#0b0c12]/95 border border-red-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
          
          {/* Header do Painel */}
          <div className="bg-gradient-to-r from-red-950/50 via-black/60 to-transparent border-b border-red-900/40 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
                  <Skull size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medieval text-red-400 leading-tight">
                    Registro de Óbitos & Combates
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                    {filteredDeaths.length} de {deaths.length} mortes registradas
                  </span>
                </div>
              </div>
            </div>

            {/* Filtros e Busca de Mortes */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="relative flex-1 w-full">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar char ou quem matou..."
                  value={deathSearch}
                  onChange={(e) => setDeathSearch(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 hover:border-red-500/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setDeathFilter('all')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    deathFilter === 'all' 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Todas ({deaths.length})
                </button>
                <button
                  onClick={() => setDeathFilter('hunted')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    deathFilter === 'hunted' 
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Inimigos ({stats.huntedDeaths})
                </button>
                <button
                  onClick={() => setDeathFilter('ally')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    deathFilter === 'ally' 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Aliados ({stats.allyDeaths})
                </button>
              </div>
            </div>
          </div>
          
          {/* Lista de Mortes */}
          <div className="p-3.5 overflow-y-auto max-h-[550px] custom-scrollbar space-y-2.5 bg-black/30">
            {filteredDeaths.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                <ShieldAlert size={44} className="mb-3 text-red-500/30" />
                <p className="text-sm font-semibold text-gray-400">Nenhuma morte encontrada com os filtros atuais.</p>
                <span className="text-xs text-gray-500 mt-1">O radar atualiza automaticamente a cada 60 segundos.</span>
              </div>
            )}
            
            {filteredDeaths.map(d => {
              const isHunted = d.is_hunted;
              const isAlly = d.is_guild_member;

              return (
                <div 
                  key={d.id} 
                  className="bg-black/70 p-3.5 rounded-xl border border-white/5 hover:border-red-500/40 transition-all flex flex-col gap-2 relative overflow-hidden group shadow-md"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isHunted ? 'bg-orange-500 shadow-[0_0_8px_#f97316]' : isAlly ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-red-800'
                  }`} />
                  
                  <div className="flex justify-between items-start pl-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-100 font-bold text-sm sm:text-base group-hover:text-red-400 transition-colors">
                        {d.character_name}
                      </span>
                      <span className="bg-white/5 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                        Lvl {d.level}
                      </span>
                      {isAlly && (
                        <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-blue-500/40 flex items-center gap-1">
                          <Shield size={10} /> Aliado
                        </span>
                      )}
                      {isHunted && (
                        <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-orange-500/40 flex items-center gap-1">
                          <Target size={10} /> Hunted
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-400 font-mono bg-white/5 px-2 py-1 rounded border border-white/5 shrink-0 flex items-center gap-1">
                      <Clock size={11} className="text-gray-500" />
                      {toBrtTimeStr(d.death_time)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 pl-2.5 flex items-center gap-1.5">
                    <span>Foi obliterado por</span>
                    <strong className="text-red-400 font-semibold truncate">
                      {d.killed_by}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* =================================================================== */}
        {/* PAINEL 2: CONTROLE DE FRONTEIRAS & TRANSFERS MUNDIAIS               */}
        {/* =================================================================== */}
        <div className="bg-[#0b0c12]/95 border border-teal-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl">
          
          {/* Header do Painel */}
          <div className="bg-gradient-to-r from-teal-950/50 via-black/60 to-transparent border-b border-teal-900/40 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
                  <Plane size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medieval text-teal-400 leading-tight">
                    Controle de Fronteiras (Transfers)
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                    {filteredTransfers.length} de {transfers.length} migrações registradas
                  </span>
                </div>
              </div>
            </div>

            {/* Filtros e Busca de Transfers */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="relative flex-1 w-full">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar char ou mundo de origem/destino..."
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 hover:border-teal-500/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setTransferFilter('all')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    transferFilter === 'all' 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Todos ({transfers.length})
                </button>
                <button
                  onClick={() => setTransferFilter('IN')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    transferFilter === 'IN' 
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Chegadas ({stats.incomingTransfers})
                </button>
                <button
                  onClick={() => setTransferFilter('OUT')}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    transferFilter === 'OUT' 
                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' 
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Saídas ({stats.outgoingTransfers})
                </button>
              </div>
            </div>
          </div>
          
          {/* Lista de Transfers */}
          <div className="p-3.5 overflow-y-auto max-h-[550px] custom-scrollbar space-y-2.5 bg-black/30">
            {filteredTransfers.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-16 flex flex-col items-center">
                <Plane size={44} className="mb-3 text-teal-500/30" />
                <p className="text-sm font-semibold text-gray-400">Nenhuma movimentação de fronteira registrada recentemente.</p>
                <span className="text-xs text-gray-500 mt-1">Quando um char transferir entre mundos, o alerta surgirá aqui.</span>
              </div>
            )}
            
            {filteredTransfers.map(t => {
              const isIncoming = t.transfer_type === 'IN';
              const borderColor = isIncoming ? 'border-teal-500/20 hover:border-teal-500/50' : 'border-amber-500/20 hover:border-amber-500/50';
              const highlightColor = isIncoming ? 'bg-teal-500 shadow-[0_0_8px_#14b8a6]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
              
              return (
                <div 
                  key={t.id} 
                  className={`bg-black/70 p-3.5 rounded-xl border ${borderColor} flex flex-col gap-2 transition-all relative overflow-hidden group shadow-md`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${highlightColor}`} />
                  
                  <div className="flex justify-between items-start pl-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-100 font-bold text-sm sm:text-base group-hover:text-yellow-300 transition-colors">
                        {t.character_name}
                      </span>
                      {t.level > 0 && (
                        <span className="bg-white/5 text-gray-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                          Lvl {t.level}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                        isIncoming 
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {isIncoming ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                        {isIncoming ? 'Desembarque (IN)' : 'Fuga/Saída (OUT)'}
                      </span>
                    </div>

                    <span className="text-[11px] text-gray-400 font-mono bg-white/5 px-2 py-1 rounded border border-white/5 shrink-0 flex items-center gap-1">
                      <Clock size={11} className="text-gray-500" />
                      {toBrtDateStr(t.transfer_date)}
                    </span>
                  </div>
                  
                  <div className="text-xs pl-2.5 flex items-center gap-1.5 flex-wrap">
                    {isIncoming ? (
                      <span className="text-teal-400 flex items-center gap-1.5">
                        <span>Chegou ao mundo vindo de:</span>
                        <strong className="text-white bg-teal-950/60 px-2 py-0.5 rounded border border-teal-700/40 font-mono">
                          {t.other_world || 'Mundo Externo'}
                        </strong>
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <span>Fugiu / Transferiu em direção a:</span>
                        <strong className="text-white bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/40 font-mono">
                          {t.other_world || 'Mundo Externo'}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Anúncio Patrocinado no Rodapé */}
      <AdBanner slot="extreme_analytics_footer" format="horizontal" />

    </div>
  );
}
