import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { AlertCircle, Brain, Target, TrendingUp, TrendingDown, Users, DollarSign, Clock, Network } from 'lucide-react';

export default function GlobalTracker() {
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

  useEffect(() => {
    const fetchCensus = async () => {
      setLoading(true);
      try {
        // Fetch current census
      const { data: cData } = await supabase.from('view_macro_census').select('*').single();
      if (cData) setCensus(cData);
      
      // Fetch hunters 24h
      const { count: huntersCount } = await supabase
        .from('view_top_rushers_24h')
        .select('*', { count: 'exact', head: true });
      if (huntersCount) setHunters(huntersCount);
      
      // Fetch historical daily data
      let bData = [];
      const { data: dailyData } = await supabase
        .from('view_macro_daily')
        .select('*')
        .order('day_date', { ascending: true });
        
      if (dailyData) {
        bData = dailyData.map(d => {
          const date = new Date(d.day_date);
          date.setUTCDate(date.getUTCDate() + 1);
          const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          return { day: days[date.getDay()], logadas: d.logadas, cacando: d.cacando };
        });
        setBarData(bData);
      }

      // Fetch FULL Roster for BI
      let vData = [];
      let lData = [];
      let bRisk = [];
      let allRoster = [];
      try {
        let page = 0;
        while (true) {
          const { data: rosterData } = await supabase
            .from('view_guild_roster')
            .select('*')
            .range(page * 1000, (page + 1) * 1000 - 1);
          if (!rosterData || rosterData.length === 0) break;
          allRoster.push(...rosterData);
          page++;
        }

        const vocStats = {};
        const lvlStats = { '1-499': 0, '500-999': 0, '1000-1499': 0, '1500-1999': 0, '2000+': 0 };

        allRoster.forEach(m => {
          const voc = m.vocation || 'N/A';
          if (!vocStats[voc]) vocStats[voc] = { name: voc, members: 0, total_xp: 0 };
          vocStats[voc].members += 1;
          vocStats[voc].total_xp += m.xp_gained_24h || 0;

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
          'Elite Knight': '#3B82F6', 'Elder Druid': '#10B981', 'Master Sorcerer': '#EF4444', 'Royal Paladin': '#F59E0B'
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
      } catch (e) {
        console.error("BI Fetch Error:", e);
      }

// Fetch parties for Respawn Tier List and SupplyDemand
      const { data: partiesData } = await supabase
        .from('parties_planilhadas')
        .select('hunt_name, slot_start, slot_end, delta_xp, members')
        .not('delta_xp', 'is', null);

      let rTier = [];
      if (partiesData) {
        const huntStats = {};
        const hoursPerVoc = { 'Elite Knight': 0, 'Elder Druid': 0, 'Master Sorcerer': 0, 'Royal Paladin': 0 };
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
               const player = allRoster.find(r => r.name === mName);
               if (player && hoursPerVoc[player.vocation] !== undefined) {
                  hoursPerVoc[player.vocation] += durationHours;
               }

               // Social Radar
               if (!playerMates[mName]) playerMates[mName] = new Set();
               p.members.forEach(otherM => {
                  if (otherM !== mName) playerMates[mName].add(otherM);
               });
            });
          }

          let xpVal = 0;
          const str = p.delta_xp.toString().toUpperCase().replace(/,/g, '.');
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

  const pieData = [
    { name: 'Ativos (7 dias)', value: parseInt(census.active_members) || 0, color: '#10B981' }, 
    { name: 'Inativos', value: (parseInt(census.total_members) || 0) - (parseInt(census.active_members) || 0), color: '#374151' } 
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-5xl font-medieval text-gradient-gold mb-2">Sala de Guerra (War Room)</h2>
          <p className="text-gray-400 font-sans">Business Intelligence e comportamento estratégico da guilda Shellpatrocina.</p>
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
                    <span className="text-sm font-bold text-gray-300">{d.name}</span>
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
                  <span className="font-bold text-white block mb-1 truncate w-full">{solo.name}</span>
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
);
}
