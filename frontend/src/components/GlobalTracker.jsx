import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { 
  AlertCircle, Brain, Target, TrendingUp, TrendingDown, Users, DollarSign, Clock, 
  Network, FileText, Search, Globe, Shield, Activity, ChevronRight, ChevronLeft, 
  RefreshCw, Flame, User, Swords, Zap, ExternalLink 
} from 'lucide-react';
import { formatVocation } from '../lib/tibiaUtils';

export default function GlobalTracker({ onPlayerClick }) {
  // Aba Ativa: 'server' (Monitor Global de Todo o Servidor) | 'war_room' (Sala de Guerra da Guilda)
  const [activeTab, setActiveTab] = useState('server');

  // Estados do Monitor Global do Servidor
  const [serverPlayers, setServerPlayers] = useState([]);
  const [totalServerPlayers, setTotalServerPlayers] = useState(0);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vocFilter, setVocFilter] = useState('ALL');
  const [affiliationFilter, setAffiliationFilter] = useState('ALL'); // 'ALL' | 'guild' | 'hunted'
  const [sortField, setSortField] = useState('level'); // 'level' | 'xp_gained' | 'last_active'
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 40;

  const [guildSet, setGuildSet] = useState(new Set());
  const [huntedSet, setHuntedSet] = useState(new Set());

  const [census, setCensus] = useState({ total_members: 0, active_members: 0 });
  const [barData, setBarData] = useState([]);
  const [hunters, setHunters] = useState(0);
  
  // BI States
  const [vocationData, setVocationData] = useState([]);
  const [levelData, setLevelData] = useState([]);
  const [burnoutRisk, setBurnoutRisk] = useState([]);
  const [respawnTierList, setRespawnTierList] = useState([]);
  const [insights, setInsights] = useState([]);
  const [paretoData, setParetoData] = useState([]);
  const [supplyDemand, setSupplyDemand] = useState([]);
  const [wastedXp, setWastedXp] = useState([]);
  const [primeTime, setPrimeTime] = useState([]);
  const [socialRadar, setSocialRadar] = useState([]);
  const [deaths, setDeaths] = useState([]);
  const [magicQuadrant, setMagicQuadrant] = useState([]);
  const [lifestyle, setLifestyle] = useState([]);
  const [topSolos, setTopSolos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateDiscordReport = () => {
    let report = `⚔️ **RELATÓRIO DIÁRIO DE GUILDA** ⚔️\n\n`;
    
    report += `📊 **CENSO MACRO:**\n`;
    report += `- Membros Ativos Hoje: ${census.active_members}\n`;
    report += `- Total de PTs Agendadas: ${primeTime.reduce((acc, curr) => acc + curr.parties, 0)} PTs\n\n`;
    
    if (paretoData.length > 0) {
      report += `🏆 **TOP CARREGADORES (Lei de Pareto):**\n`;
      report += `- Top 50 Membros: +${(paretoData[0].value / 1000000).toFixed(1)}M XP\n`;
      report += `- Resto da Guilda: +${(paretoData[1].value / 1000000).toFixed(1)}M XP\n\n`;
    }

    if (topSolos.length > 0) {
      report += `🐺 **TOP LOBOS SOLITÁRIOS (Sem Planilha):**\n`;
      topSolos.slice(0,3).forEach((s, i) => {
        report += `${i+1}. ${s.name} (+${(s.xp_gained_24h / 1000000).toFixed(1)}M XP)\n`;
      });
      report += `\n`;
    }

    if (deaths.length > 0) {
      report += `💀 **MURO DAS LAMENTAÇÕES (Piores Mortes):**\n`;
      deaths.slice(0,3).forEach((d) => {
        report += `- ${d.name} perdeu ${Math.abs(d.xp_gained_24h / 1000000).toFixed(1)}M XP\n`;
      });
      report += `\n`;
    }

    if (wastedXp.length > 0) {
      report += `💸 **XP DEIXADA NA MESA:**\n`;
      report += `A guilda perdeu de fazer ${(wastedXp[0].missedXp / 1000000).toFixed(1)}M XP hoje porque o respawn "${wastedXp[0].name}" não foi 100% ocupado!\n\n`;
    }

    report += `🚀 *Bom jogo a todos! Organizem suas PTs e não deixem os respawns vazios!*`;

    navigator.clipboard.writeText(report);
    showToast('📋 Jornal copiado! Cole com Ctrl+V no Discord.', 'success');
  };

  useEffect(() => {
    const fetchCensus = async () => {
      setLoading(true);
      try {
        // Run all independent queries in parallel to eliminate waterfall
        const fetchCensusP = (async () => {
          const { count: total_members } = await supabase.from('guild_members').select('*', { count: 'exact', head: true });
          const { count: active_members } = await supabase
            .from('guild_members')
            .select('*', { count: 'exact', head: true })
            .gte('last_xp_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          return { data: { total_members: total_members || 0, active_members: active_members || 0 } };
        })();
        const fetchHuntersP = supabase.from('view_top_rushers_24h').select('*', { count: 'exact', head: true });
        const fetchDailyP = supabase.from('view_macro_daily').select('*').order('day_date', { ascending: true });
        const fetchPartiesP = supabase.from('parties_planilhadas').select('hunt_name, slot_start, slot_end, delta_xp, members').not('delta_xp', 'is', null);
        
        const fetchRosterP = async () => {
          let allRoster = [];
          let page = 0;
          while (true) {
            const { data: rosterData } = await supabase
              .from('view_guild_roster')
              .select('*')
              .range(page * 1000, (page + 1) * 1000 - 1);
            if (!rosterData || rosterData.length === 0) break;
            allRoster.push(...rosterData);
            if (rosterData.length < 1000) break; // optimize: if less than max page, it's the last one
            page++;
          }

          let allStates = [];
          let statePage = 0;
          while (true) {
            const { data: stateData } = await supabase
              .from('current_character_state')
              .select('character_name, xp_total, session_start_xp')
              .not('session_start_xp', 'is', null)
              .range(statePage * 1000, (statePage + 1) * 1000 - 1);
            if (!stateData || stateData.length === 0) break;
            allStates.push(...stateData);
            if (stateData.length < 1000) break;
            statePage++;
          }

          const stateMap = new Map();
          allStates.forEach(s => {
            const activeXp = Math.max(0, (s.xp_total || 0) - (s.session_start_xp || s.xp_total || 0));
            if (activeXp > 0 && s.character_name) stateMap.set(s.character_name.toLowerCase(), activeXp);
          });

          return allRoster.map(m => {
            const activeXp = m.name ? (stateMap.get(m.name.toLowerCase()) || 0) : 0;
            return { ...m, xp_gained_24h: (m.xp_gained_24h || 0) + activeXp };
          });
        };

        const [
          { data: cData },
          { count: huntersCount },
          { data: dailyData },
          { data: partiesData },
          allRoster
        ] = await Promise.all([
          fetchCensusP,
          fetchHuntersP,
          fetchDailyP,
          fetchPartiesP,
          fetchRosterP()
        ]);

        if (cData) setCensus(cData);
        if (huntersCount) setHunters(huntersCount);
        
        let bData = [];
        if (dailyData) {
          bData = dailyData.map(d => {
            const date = new Date(d.day_date);
            date.setUTCDate(date.getUTCDate() + 1);
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return { day: days[date.getDay()], logadas: d.logadas, cacando: d.cacando };
          });
          setBarData(bData);
        }

        let vData = [];
        let lData = [];
        let bRisk = [];
        
        if (allRoster && allRoster.length > 0) {
          const vocStats = {};
          const lvlStats = { '1-499': 0, '500-999': 0, '1000-1499': 0, '1500-1999': 0, '2000+': 0 };

          allRoster.forEach(m => {
            const voc = formatVocation(m.vocation);
            if (voc && voc !== 'None' && voc !== 'N/A') {
              if (!vocStats[voc]) vocStats[voc] = { name: voc, members: 0, total_xp: 0 };
              vocStats[voc].members += 1;
              vocStats[voc].total_xp += m.xp_gained_24h || 0;
            }

            if (m.level < 500) lvlStats['1-499']++;
            else if (m.level < 1000) lvlStats['500-999']++;
            else if (m.level < 1500) lvlStats['1000-1499']++;
            else if (m.level < 2000) lvlStats['1500-1999']++;
            else lvlStats['2000+']++;

            if (m.level >= 1500 && (!m.xp_gained_24h || m.xp_gained_24h === 0)) {
              bRisk.push(m);
            }
          });

          const vocColors = {
            'Elite Knight': '#3B82F6', 'Elder Druid': '#10B981', 'Master Sorcerer': '#EF4444', 'Royal Paladin': '#F59E0B',
            'Knight': '#3B82F6', 'Druid': '#10B981', 'Sorcerer': '#EF4444', 'Paladin': '#F59E0B',
            'Monk': '#8B5CF6', 'Exalted Monk': '#8B5CF6'
          };

          vData = Object.values(vocStats)
            .filter(v => v.name !== 'None' && v.name !== 'N/A')
            .map(v => ({ ...v, color: vocColors[v.name] || '#6B7280' }))
            .sort((a, b) => b.total_xp - a.total_xp);

          lData = Object.entries(lvlStats).map(([name, count]) => ({ name, count }));
          
          // Pareto Logic
          const sortedByXp = [...allRoster].sort((a,b) => (b.xp_gained_24h||0) - (a.xp_gained_24h||0));
          let top50Xp = 0;
          let restXp = 0;
          sortedByXp.forEach((m, i) => {
              if (i < 50) top50Xp += (m.xp_gained_24h||0);
              else restXp += (m.xp_gained_24h||0);
          });
          setParetoData([
             { name: 'Top 50 Carregadores', value: top50Xp, fill: '#F59E0B' },
             { name: 'Resto da Guilda', value: restXp, fill: '#374151' }
          ]);

          // Muro das Lamentacoes (Deaths)
          const deadPlayers = allRoster
              .filter(r => r.xp_gained_24h < 0)
              .sort((a,b) => a.xp_gained_24h - b.xp_gained_24h)
              .slice(0, 5);
          setDeaths(deadPlayers);

          // Quadrante Magico (Scatter)
          const qData = allRoster
              .filter(r => r.xp_gained_24h > 0)
              .map(r => ({
                 name: r.name,
                 level: r.level,
                 xp: Math.round(r.xp_gained_24h / 1000000), // In Millions
                 z: 1
              }));
          setMagicQuadrant(qData);

          // Censo de Estilo de Vida
          let hardcore = 0;
          let operarios = 0;
          let casuais = 0;
          let turistas = 0;
          allRoster.forEach(r => {
             if (r.xp_gained_24h > 50000000) hardcore++;
             else if (r.xp_gained_24h > 10000000) operarios++;
             else if (r.xp_gained_24h > 0) casuais++;
             else turistas++;
          });
          setLifestyle([
             { name: 'Grinders (50M+)', value: hardcore, fill: '#F59E0B' },
             { name: 'Operários (10M+)', value: operarios, fill: '#3B82F6' },
             { name: 'Casuais (>0)', value: casuais, fill: '#10B981' },
             { name: 'Inativos (0)', value: turistas, fill: '#374151' }
          ]);

          setVocationData(vData);
          setLevelData(lData);
          setBurnoutRisk(bRisk.sort((a, b) => b.level - a.level).slice(0, 15));
        }

        let rTier = [];
        if (partiesData) {
        const huntStats = {};
        const hoursPerVoc = { 'Elite Knight': 0, 'Elder Druid': 0, 'Master Sorcerer': 0, 'Royal Paladin': 0, 'Monk': 0, 'Exalted Monk': 0 };
        const globalHours = new Array(24).fill(0);
        const playerMates = {};
        
        partiesData.forEach(p => {
          if (!p.delta_xp || p.delta_xp === '0') return;
          if (!p.slot_start || !p.slot_end || typeof p.slot_start !== 'string' || typeof p.slot_end !== 'string') return;
          
          const [sh, sm] = p.slot_start.split(':').map(Number);
          const [eh, em] = p.slot_end.split(':').map(Number);
          const startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins <= 600 && startMins >= 1000) endMins += 1440; // cross midnight logic
          const durationHours = Math.max(0.1, (endMins - startMins) / 60);

          // Prime Time logic
          const startH = sh;
          let endH = eh;
          if (endH < startH && endH <= 10) endH += 24;
          for (let h = startH; h <= endH; h++) {
             const actualH = h >= 24 ? h - 24 : h;
             globalHours[actualH] += 1;
          }

          // Supply Demand & Social Radar logic
          if (p.members && Array.isArray(p.members)) {
            p.members.forEach(mName => {
               // Supply Demand
               const player = allRoster.find(r => r.name?.toLowerCase() === mName?.toLowerCase());
               if (player) {
                  const pVoc = formatVocation(player.vocation);
                  if (hoursPerVoc[pVoc] !== undefined) {
                     hoursPerVoc[pVoc] += durationHours;
                  }
               }

               // Social Radar
               if (!playerMates[mName]) playerMates[mName] = new Set();
               p.members.forEach(otherM => {
                  if (otherM !== mName) playerMates[mName].add(otherM);
               });
            });
          }

          let xpVal = 0;
          const str = String(p.delta_xp || '0').toUpperCase().replace(/,/g, '.');
          if (str.endsWith('M')) xpVal = parseFloat(str) * 1000000;
          else if (str.endsWith('K')) xpVal = parseFloat(str) * 1000;
          else xpVal = parseFloat(str) || 0;

          if (xpVal > 0) {
            const h = p.hunt_name || 'Desconhecido';
            if (!huntStats[h]) huntStats[h] = { name: h, totalXp: 0, totalHours: 0 };
            huntStats[h].totalXp += xpVal;
            huntStats[h].totalHours += durationHours;
          }
        });

        const pTimeData = globalHours.map((val, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          parties: val
        }));
        setPrimeTime(pTimeData);

        const hVals = Object.values(huntStats);
        rTier = hVals
          .map(h => ({ name: h.name, xph: h.totalXp / h.totalHours }))
          .sort((a, b) => b.xph - a.xph)
          .slice(0, 5); // Top 5
        setRespawnTierList(rTier);

        // Wasted XP calculation
        const wasted = hVals.map(h => {
           const xph = h.totalXp / h.totalHours;
           const idleHours = Math.max(0, 24 - h.totalHours);
           return { name: h.name, missedXp: idleHours * xph };
        }).sort((a,b) => b.missedXp - a.missedXp).slice(0, 5);
        setWastedXp(wasted);

        // Social Radar Calculation
        let loners = 0;
        let closed = 0;
        let commun = 0;
        let soloHunters = [];
        
        allRoster.forEach(r => {
           if (r.xp_gained_24h > 0) {
             const mates = playerMates[r.name] ? playerMates[r.name].size : 0;
             if (mates === 0) {
                 loners++;
                 soloHunters.push(r);
             }
             else if (mates <= 3) closed++;
             else commun++;
           }
        });

        if (loners > 0 || closed > 0 || commun > 0) {
           setSocialRadar([
             { name: 'Lobos Solitários', value: loners, fill: '#6B7280' },
             { name: 'Panelinhas', value: closed, fill: '#F87171' },
             { name: 'Comunitários', value: commun, fill: '#10B981' }
           ]);
        }
        
        setTopSolos(soloHunters.sort((a,b) => b.xp_gained_24h - a.xp_gained_24h).slice(0, 5));
        
        setSupplyDemand(Object.entries(hoursPerVoc).map(([voc, hrs]) => ({ name: voc, hours: Math.round(hrs) })));
      }

      
      
      // Generate AI Insights
      const newInsights = [];
      if (bRisk.length > 5) {
        newInsights.push({ type: 'danger', icon: <TrendingDown size={18} className="text-red-400"/>, text: `Alerta Vermelho: Temos ${bRisk.length} jogadores Level 1500+ ociosos hoje. Risco crítico de evasão ou inatividade.` });
      } else if (bRisk.length > 0) {
        newInsights.push({ type: 'warning', icon: <Users size={18} className="text-yellow-400"/>, text: `Atenção moderada: ${bRisk.length} high-levels ociosos hoje. Fique de olho na retenção.` });
      } else {
        newInsights.push({ type: 'success', icon: <TrendingUp size={18} className="text-green-400"/>, text: `Nenhum jogador Level 1500+ inativo nas últimas 24h. A guilda está operando em força máxima militar!` });
      }

      if (rTier.length > 0) {
        newInsights.push({ type: 'info', icon: <Target size={18} className="text-blue-400"/>, text: `A mina de ouro atual é "${rTier[0].name}", gerando impressionantes ${(rTier[0].xph / 1000000).toFixed(1)}M XP/hora para a guilda.` });
      }

      if (vData.length > 1) {
        const topVoc = vData[0];
        const bottomVoc = vData[vData.length - 1];
        if (topVoc.total_xp > bottomVoc.total_xp * 2 && bottomVoc.total_xp > 0) {
          newInsights.push({ type: 'danger', icon: <AlertCircle size={18} className="text-red-400"/>, text: `Desbalanceamento de classes: ${topVoc.name}s estão gerando ${Math.round(topVoc.total_xp/bottomVoc.total_xp)}x mais XP que os ${bottomVoc.name}s.` });
        }
      }

      setInsights(newInsights);
      } catch (err) {
        console.error("GlobalTracker Master Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCensus();
  }, []);

  // Busca lista de afiliações para badges (Guilda Battle Storm & Hunteds)
  const fetchAffiliations = async () => {
    try {
      const [{ data: gData }, { data: hData }] = await Promise.all([
        supabase.from('guild_members').select('name'),
        supabase.from('hunted_list').select('name')
      ]);
      if (gData) setGuildSet(new Set(gData.filter(g => g?.name).map(g => g.name.toLowerCase())));
      if (hData) setHuntedSet(new Set(hData.filter(h => h?.name).map(h => h.name.toLowerCase())));
    } catch (e) {
      console.warn('Erro ao carregar afiliações:', e);
    }
  };

  // Carrega jogadores rastreados de todo o servidor
  const fetchServerPlayers = async () => {
    setPlayersLoading(true);
    try {
      let query = supabase
        .from('current_character_state')
        .select('character_name, level, vocation, xp_total, last_active, session_start_xp', { count: 'exact' })
        .not('level', 'is', null);

      if (searchTerm.trim()) {
        query = query.ilike('character_name', `%${searchTerm.trim()}%`);
      }

      if (vocFilter !== 'ALL') {
        query = query.ilike('vocation', `%${vocFilter}%`);
      }

      if (sortField === 'level') {
        query = query.order('level', { ascending: false });
      } else if (sortField === 'last_active') {
        query = query.order('last_active', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('level', { ascending: false });
      }

      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, count, error } = await query;

      if (data && data.length > 0) {
        const names = data.map(d => d.character_name);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: histData } = await supabase
          .from('historical_sessions')
          .select('character_name, xp_gained')
          .in('character_name', names)
          .gte('session_end', twentyFourHoursAgo);

        const histMap = new Map();
        if (histData) {
          histData.forEach(h => {
            const current = histMap.get(h.character_name.toLowerCase()) || 0;
            histMap.set(h.character_name.toLowerCase(), current + Number(h.xp_gained || 0));
          });
        }

        const merged = data.map(p => {
          const activeDelta = Math.max(0, Number(p.xp_total || 0) - Number(p.session_start_xp || p.xp_total || 0));
          const pastDelta = histMap.get(p.character_name.toLowerCase()) || 0;
          return {
            ...p,
            xp_gained_24h: pastDelta + activeDelta
          };
        });

        if (sortField === 'xp_gained') {
          merged.sort((a, b) => b.xp_gained_24h - a.xp_gained_24h);
        }

        setServerPlayers(merged);
        setTotalServerPlayers(count || 0);
      } else {
        setServerPlayers([]);
        setTotalServerPlayers(count || 0);
      }
    } catch (err) {
      console.error('Erro ao buscar server players:', err);
    } finally {
      setPlayersLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliations();
  }, []);

  useEffect(() => {
    fetchServerPlayers();
  }, [searchTerm, vocFilter, sortField, page]);

  const formatCompactXp = (num) => {
    if (!num) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toLocaleString();
  };

  const formatTimeAgo = (isoStr) => {
    if (!isoStr) return 'Desconhecido';
    try {
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const diffMs = Date.now() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Agora mesmo';
      if (mins < 60) return `há ${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `há ${hours}h`;
      const days = Math.floor(hours / 24);
      return `há ${days}d`;
    } catch {
      return 'Recentemente';
    }
  };

  const pieData = [
    { name: 'Ativos (7 dias)', value: parseInt(census.active_members) || 0, color: '#10B981' }, 
    { name: 'Inativos', value: (parseInt(census.total_members) || 0) - (parseInt(census.active_members) || 0), color: '#374151' } 
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border text-sm font-bold animate-fade-in transition-all ${
          toast.type === 'success'
            ? 'bg-green-900/90 border-green-500 text-green-200'
            : 'bg-red-900/90 border-red-500 text-red-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* SELETOR DE ABAS PRINCIPAL */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('server')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medieval text-sm transition-all shadow-md ${
              activeTab === 'server'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-black font-bold shadow-yellow-500/20'
                : 'bg-black/60 border border-white/10 text-gray-300 hover:text-white hover:border-yellow-500/40'
            }`}
          >
            <Globe size={18} />
            Monitor Global de Jogadores
            {totalServerPlayers > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-sans ${
                activeTab === 'server' ? 'bg-black/40 text-yellow-300' : 'bg-white/10 text-gray-400'
              }`}>
                {totalServerPlayers.toLocaleString()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('war_room')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medieval text-sm transition-all shadow-md ${
              activeTab === 'war_room'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-black font-bold shadow-yellow-500/20'
                : 'bg-black/60 border border-white/10 text-gray-300 hover:text-white hover:border-yellow-500/40'
            }`}
          >
            <Shield size={18} />
            Sala de Guerra & BI (Battle Storm)
          </button>
        </div>

        {activeTab === 'war_room' && (
          <button 
            onClick={generateDiscordReport}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(88,101,242,0.4)] flex items-center gap-2 transition-all text-sm"
          >
            <FileText size={18} />
            Jornal Diário (Discord)
          </button>
        )}
      </div>

      {activeTab === 'server' ? (
        <div className="space-y-6">
          {/* HEADER DA ABA GLOBAL */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-tibia-border">
            <div>
              <h2 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">Monitor Global do Servidor</h2>
              <p className="text-gray-400 text-xs sm:text-sm font-sans mt-1">
                Telemetria e atividade contínua de todos os personagens rastreados nos mundos de Rubinot.
              </p>
            </div>

            {/* BADGES RÁPIDAS */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Users size={14} className="text-yellow-400" />
                <span className="text-gray-400">Rastreados:</span>
                <strong className="text-white">{totalServerPlayers.toLocaleString()}</strong>
              </div>
              <div className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Flame size={14} className="text-green-400" />
                <span className="text-gray-400">Caçando Hoje:</span>
                <strong className="text-green-400">
                  {serverPlayers.filter(p => (p.xp_gained_24h || 0) > 0).length}+
                </strong>
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS & BUSCA */}
          <div className="bg-black/60 border border-tibia-border rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Input de Busca */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                placeholder="Buscar personagem..."
                className="w-full bg-black/80 border border-white/15 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-yellow-500 shadow-inner"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selects de Filtros */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Filtro de Vocação */}
              <select
                value={vocFilter}
                onChange={(e) => {
                  setVocFilter(e.target.value);
                  setPage(0);
                }}
                className="bg-black/80 border border-white/15 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500"
              >
                <option value="ALL">Todas as Vocações</option>
                <option value="Knight">Knights (EK)</option>
                <option value="Druid">Druids (ED)</option>
                <option value="Sorcerer">Sorcerers (MS)</option>
                <option value="Paladin">Paladins (RP)</option>
                <option value="Monk">Monks</option>
              </select>

              {/* Filtro de Afiliação */}
              <select
                value={affiliationFilter}
                onChange={(e) => setAffiliationFilter(e.target.value)}
                className="bg-black/80 border border-white/15 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500"
              >
                <option value="ALL">Todas as Afiliações</option>
                <option value="guild">🛡️ Guilda Battle Storm</option>
                <option value="hunted">💀 Rivais / Hunted</option>
              </select>

              {/* Ordenação */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="bg-black/80 border border-white/15 text-xs text-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500"
              >
                <option value="level">Ordenar por Nível</option>
                <option value="xp_gained">Ordenar por XP Ganho (24h)</option>
                <option value="last_active">Atividade Mais Recente</option>
              </select>
            </div>
          </div>

          {/* LISTA / TABELA DE JOGADORES */}
          {playersLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
              <div className="text-yellow-500 font-medieval text-sm animate-pulse">
                Carregando dados globais do servidor...
              </div>
            </div>
          ) : (
            (() => {
              const displayed = serverPlayers.filter(p => {
                const nameLower = (p.character_name || '').toLowerCase();
                if (affiliationFilter === 'guild') return guildSet.has(nameLower);
                if (affiliationFilter === 'hunted') return huntedSet.has(nameLower);
                return true;
              });

              if (displayed.length === 0) {
                return (
                  <div className="text-center py-16 bg-black/40 border border-white/10 rounded-2xl">
                    <p className="text-gray-400 font-sans text-sm">Nenhum personagem encontrado com os filtros atuais.</p>
                  </div>
                );
              }

              return (
                <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-black/80 text-gray-400 text-xs uppercase tracking-wider font-sans border-b border-tibia-border">
                        <tr>
                          <th className="py-3.5 px-4">#</th>
                          <th className="py-3.5 px-4">Personagem</th>
                          <th className="py-3.5 px-4">Vocação</th>
                          <th className="py-3.5 px-4">Nível</th>
                          <th className="py-3.5 px-4">XP Total</th>
                          <th className="py-3.5 px-4 text-right">Ganho 24h</th>
                          <th className="py-3.5 px-4 text-right">Última Atividade</th>
                          <th className="py-3.5 px-4 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-sans">
                        {displayed.map((p, idx) => {
                          const nameLower = (p.character_name || '').toLowerCase();
                          const isGuild = guildSet.has(nameLower);
                          const isHunted = huntedSet.has(nameLower);

                          const voc = formatVocation(p.vocation);
                          const vocColor = 
                            voc.includes('Knight') ? 'text-blue-400' :
                            voc.includes('Druid') ? 'text-green-400' :
                            voc.includes('Sorcerer') ? 'text-red-400' :
                            voc.includes('Paladin') ? 'text-yellow-400' :
                            voc.includes('Monk') ? 'text-purple-400' : 'text-gray-400';

                          return (
                            <tr 
                              key={idx}
                              className="hover:bg-white/[0.03] transition-colors group"
                            >
                              <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                                {page * PAGE_SIZE + idx + 1}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span 
                                    onClick={() => onPlayerClick && onPlayerClick(p.character_name)}
                                    className="font-bold text-white group-hover:text-yellow-400 transition-colors cursor-pointer"
                                  >
                                    {p.character_name}
                                  </span>

                                  {isGuild && (
                                    <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                                      🛡️ Battle Storm
                                    </span>
                                  )}
                                  {isHunted && (
                                    <span className="bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                                      💀 Rival
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className={`py-3 px-4 text-xs font-semibold ${vocColor}`}>
                                {voc}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-white">
                                {p.level}
                              </td>

                              <td className="py-3 px-4 font-mono text-xs text-gray-400">
                                {formatCompactXp(p.xp_total)} XP
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-xs">
                                {p.xp_gained_24h > 0 ? (
                                  <span className="text-green-400 font-bold bg-green-950/40 border border-green-500/30 px-2 py-0.5 rounded">
                                    +{formatCompactXp(p.xp_gained_24h)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right text-xs text-gray-400 font-sans">
                                {formatTimeAgo(p.last_active)}
                              </td>

                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => onPlayerClick && onPlayerClick(p.character_name)}
                                  className="inline-flex items-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold"
                                >
                                  Dossiê <ChevronRight size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINADOR */}
                  <div className="flex items-center justify-between p-4 bg-black/60 border-t border-tibia-border text-xs text-gray-400">
                    <div>
                      Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, totalServerPlayers)} de {totalServerPlayers.toLocaleString()} personagens
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-yellow-500/40 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-white font-bold"
                      >
                        <ChevronLeft size={14} /> Anterior
                      </button>

                      <span className="px-3 py-1 font-bold text-yellow-400">
                        Página {page + 1} de {Math.max(1, Math.ceil(totalServerPlayers / PAGE_SIZE))}
                      </span>

                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * PAGE_SIZE >= totalServerPlayers}
                        className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-yellow-500/40 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 text-white font-bold"
                      >
                        Próxima <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
            <div>
              <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Sala de Guerra (War Room)</h2>
              <p className="text-gray-400 font-sans">Business Intelligence e comportamento estratégico da guilda Battle Storm (Shellpatrocina).</p>
            </div>
          </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* AI Insights Panel */}
          {insights.length > 0 && (
            <div className="bg-black/40 border border-purple-500/50 rounded-lg p-6 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
              <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
                <Brain className="mr-2" size={24} /> Relatório do Analista Chefe
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((ins, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start">
                    <div className="mt-1 mr-3 shrink-0">{ins.icon}</div>
                    <p className="text-sm text-gray-300 leading-relaxed">{ins.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Row: Basic Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico 1: Ativos vs Inativos */}
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Engajamento Básico</h3>
              <p className="text-sm text-gray-400 mb-6">Membros logados na última semana vs caçadores que geraram XP nas últimas 24h.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                      itemStyle={{ color: '#fff' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center px-4 border-t border-tibia-border pt-4">
                <div>
                  <p className="text-2xl font-bold text-green-400">{pieData[0].value}</p>
                  <p className="text-xs text-gray-400">Ativos (7d)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{hunters}</p>
                  <p className="text-xs text-blue-300">Caçaram (24h)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{pieData[1].value}</p>
                  <p className="text-xs text-gray-400">Inativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-tibia-primary">{census.total_members}</p>
                  <p className="text-xs text-gray-400">Total Membros</p>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Tempo Online vs Caçando */}
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4">Eficiência de Máquina</h3>
              <p className="text-sm text-gray-400 mb-6">
                Quantas horas o servidor passa online vs caçando efetivamente.
              </p>
              <div className="h-64 mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      cursor={{fill: '#374151', opacity: 0.4}} 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="logadas" name="Horas Logadas" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cacando" name="Horas Caçando" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: War Room Deep Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vocation ROI */}
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl lg:col-span-1">
              <h3 className="text-xl font-bold text-white mb-2">XP Produzida por Vocação</h3>
              <p className="text-xs text-gray-400 mb-6">Qual classe carrega a guilda nas costas nas últimas 24h.</p>
              
              <div className="space-y-4">
                {vocationData.map((v, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: v.color }}></div>
                        {v.name}
                      </span>
                      <span className="text-gray-400 font-bold">{(v.total_xp / 1000000).toFixed(1)}M XP</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(5, (v.total_xp / vocationData[0]?.total_xp) * 100)}%`, backgroundColor: v.color }}></div>
                    </div>
                    <p className="text-right text-[10px] text-gray-500 mt-1">{v.members} membros nesta vocação</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Curve */}
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl lg:col-span-1">
              <h3 className="text-xl font-bold text-white mb-2">Curva Militar (Distribuição)</h3>
              <p className="text-xs text-gray-400 mb-6">Poder bélico concentrado por faixas de level.</p>
              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} />
                    <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Burnout Radar */}
            <div className="bg-tibia-card border border-red-900/50 rounded-lg p-6 shadow-xl lg:col-span-1 overflow-y-auto max-h-[320px] custom-scrollbar">
              <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center">
                <AlertCircle size={20} className="mr-2" />
                Leões Adormecidos
              </h3>
              <p className="text-xs text-gray-400 mb-4">Jogadores Lvl 1500+ que fizeram ZERO XP nas últimas 24h. Risco de Burnout / Evasão.</p>
              
              <ul className="space-y-2">
                {burnoutRisk.map((p, i) => (
                  <li key={i} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-gray-200">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.vocation}</p>
                    </div>
                    <span className="text-xs font-mono text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">Lvl {p.level}</span>
                  </li>
                ))}
                {burnoutRisk.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">Nenhum jogador high-level ocioso!</div>
                )}
              </ul>
            </div>

          </div>

          {/* Bottom Row 2: Respawn Tier List */}
          {respawnTierList.length > 0 && (
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                <Target className="mr-2 text-yellow-500" size={24} />
                A Mina de Ouro (Tier List de Respawns)
              </h3>
              <p className="text-sm text-gray-400 mb-6">Média real de XP/hora gerada pela guilda em cada área de caça.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {respawnTierList.map((tier, index) => (
                  <div key={index} className="bg-black/30 border border-white/5 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 text-yellow-500"><Target size={100} /></div>
                    <div className="flex items-center mb-2">
                      <span className={`text-lg font-black mr-2 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        #{index + 1}
                      </span>
                      <span className="font-bold text-white truncate z-10">{tier.name}</span>
                    </div>
                    <div className="z-10 relative">
                      <p className="text-2xl font-black text-green-400">{(tier.xph / 1000000).toFixed(1)}M <span className="text-xs text-gray-500 font-normal">/h</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Bottom Row 3: Pareto e Gargalo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Pareto Pie Chart */}
          {paretoData.length > 0 && (
            <div className="bg-tibia-card border border-yellow-900/50 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-yellow-500 mb-2 flex items-center">
                <Brain className="mr-2" size={24} />
                A Lei de Pareto (Top 50 vs Resto)
              </h3>
              <p className="text-sm text-gray-400 mb-6">Comparação do volume de XP gerado entre os 50 maiores rushadores e o resto de toda a guilda.</p>
              
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paretoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paretoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${(value / 1000000).toFixed(1)}M XP`}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Supply & Demand (Gargalo de Vocação) */}
          {supplyDemand.length > 0 && (
            <div className="bg-tibia-card border border-blue-900/50 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
                <Users className="mr-2" size={24} />
                Gargalo de Vocações (Demanda nas Hunts)
              </h3>
              <p className="text-sm text-gray-400 mb-6">Total de horas que cada classe passou caçando nas planilhas. Identifique qual classe está em falta ou sobrando.</p>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplyDemand} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                      itemStyle={{ color: '#60a5fa' }}
                      formatter={(value) => [`${value} horas`, 'Tempo Caçando']}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* Close Bottom Row 3 */}
        </div>

        {/* Bottom Row 4: Data Science Advanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Custo de Oportunidade (Wasted XP) */}
          {wastedXp.length > 0 && (
            <div className="bg-tibia-card border border-red-900/50 rounded-lg p-6 shadow-xl lg:col-span-1">
              <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center">
                <DollarSign className="mr-2" size={24} />
                Custo de Oportunidade
              </h3>
              <p className="text-xs text-gray-400 mb-6">Dinheiro na mesa: XP que a guilda perdeu por deixar respawns Top Tier vazios ontem.</p>
              
              <div className="space-y-4">
                {wastedXp.map((w, i) => (
                  <div key={i} className="bg-black/30 p-3 rounded border border-red-900/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-white">{w.name}</span>
                      <span className="text-sm font-black text-red-400">-{ (w.missedXp / 1000000).toFixed(1) }M XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prime Time (Area Chart) */}
          {primeTime.length > 0 && (
            <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                <Clock className="mr-2 text-tibia-primary" size={24} />
                Horário Nobre Global (Prime Time)
              </h3>
              <p className="text-xs text-gray-400 mb-6">Densidade de PTs simultâneas por horário do dia. Descubra quando o servidor "acorda" e quando ele "dorme".</p>
              
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={primeTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorParties" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                      itemStyle={{ color: '#10B981' }}
                      formatter={(value) => [`${value} PTs Caçando`, 'Simultâneos']}
                    />
                    <Area type="monotone" dataKey="parties" stroke="#10B981" fillOpacity={1} fill="url(#colorParties)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Social Radar */}
        {socialRadar.length > 0 && (
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl mt-8">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Network className="mr-2 text-purple-400" size={24} />
              Radar Social (Índice de Isolamento)
            </h3>
            <p className="text-xs text-gray-400 mb-6">Classificação da saúde social da guilda cruzando quem caça com quem. Lobos Solitários não interagem, Panelinhas são grupos fechados (risco de quitarem juntos), Comunitários unem o clã.</p>
            
            <div className="h-64 flex flex-col items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={socialRadar}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {socialRadar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Jogadores`, 'Total']}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bottom Row 5: Extreme Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Muro das Lamentações */}
          <div className="bg-tibia-card border border-gray-900 rounded-lg p-6 shadow-xl lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-500 mb-2 flex items-center">
              <TrendingDown className="mr-2 text-red-600" size={24} />
              Muro das Lamentações
            </h3>
            <p className="text-xs text-gray-400 mb-6">Taxa de Mortalidade: Membros que perderam XP nas últimas 24h (Mortes).</p>
            
            <div className="space-y-4">
              {deaths.length > 0 ? deaths.map((d, i) => (
                <div key={i} className="bg-black/50 p-3 rounded border border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span
                      onClick={() => onPlayerClick && onPlayerClick(d.name)}
                      className="text-sm font-bold text-gray-300 cursor-pointer hover:text-red-400 hover:underline transition-colors"
                    >
                      {d.name}
                    </span>
                    <span className="text-sm font-black text-red-600">{(d.xp_gained_24h / 1000000).toFixed(1)}M XP</span>
                  </div>
                  <div className="text-xs text-gray-600 text-right">Lvl {d.level} - {d.vocation}</div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-600">
                  Nenhuma morte drástica registrada hoje!
                </div>
              )}
            </div>
          </div>

          {/* Quadrante Mágico */}
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Target className="mr-2 text-blue-400" size={24} />
              O Quadrante Mágico
            </h3>
            <p className="text-xs text-gray-400 mb-6">Dispersão de Eficiência (XP) vs Level. Ache as Promessas (Alto XP, Baixo Lvl) e os Aposentados (Baixo XP, Alto Lvl).</p>
            
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" dataKey="level" name="Level" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} domain={['dataMin - 100', 'dataMax + 100']} />
                  <YAxis type="number" dataKey="xp" name="XP (M)" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                  <ZAxis type="number" range={[50, 50]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                  <Scatter name="Jogadores" data={magicQuadrant} fill="#3b82f6" opacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Censo de Estilo de Vida */}
          <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Users className="mr-2 text-green-400" size={24} />
              Censo de Esforço
            </h3>
            <p className="text-xs text-gray-400 mb-6">Classificação da base ativa: Hardcore Grinders (50M+), Operários (10M+), Casuais ou Inativos.</p>
            
            <div className="h-48 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lifestyle}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {lifestyle.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} Jogadores`, 'Total']}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Row 6: Lobos Solitários */}
        <div className="mt-8 bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
              <Users className="mr-2 text-yellow-500" size={24} />
              Os Lobos Solitários (Mundo Aberto / Solo)
            </h3>
            <p className="text-xs text-gray-400 mb-6">Membros que ganharam rios de XP sem pisar em NENHUMA hunt planilhada hoje. O verdadeiro motor independente da guilda.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topSolos.length > 0 ? topSolos.map((solo, i) => (
                <div key={i} className="bg-black/40 p-4 rounded-lg border border-gray-800 flex flex-col justify-center items-center text-center">
                  <div className="w-10 h-10 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center font-bold text-lg mb-2">#{i + 1}</div>
                  <span
                    onClick={() => onPlayerClick && onPlayerClick(solo.name)}
                    className="font-bold text-white block mb-1 truncate w-full cursor-pointer hover:text-tibia-primary hover:underline transition-colors"
                  >
                    {solo.name}
                  </span>
                  <span className="text-green-400 font-black text-sm block">+{(solo.xp_gained_24h / 1000000).toFixed(1)}M XP</span>
                  <span className="text-xs text-gray-500 block mt-1">Lvl {solo.level} - {solo.vocation}</span>
                </div>
              )) : (
                <div className="text-center text-gray-500 col-span-5 py-4">Nenhum jogador atuando puramente solo ou off-planilha hoje.</div>
              )}
            </div>
        </div>

      </div>
    )}
    </div>
  )}
  </div>
);
}
