import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { AlertCircle, Brain, Target, TrendingUp, TrendingDown, Users } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCensus = async () => {
      setLoading(true);
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

      // Fetch parties for Respawn Tier List
      const { data: partiesData } = await supabase
        .from('parties_planilhadas')
        .select('hunt_name, slot_start, slot_end, delta_xp')
        .not('delta_xp', 'is', null);

      let rTier = [];
      if (partiesData) {
        const huntStats = {};
        partiesData.forEach(p => {
          if (!p.delta_xp || p.delta_xp === '0') return;
          const [sh, sm] = p.slot_start.split(':').map(Number);
          const [eh, em] = p.slot_end.split(':').map(Number);
          const startMins = sh * 60 + sm;
          let endMins = eh * 60 + em;
          if (endMins <= 600 && startMins >= 1000) endMins += 1440; // cross midnight logic
          const durationHours = Math.max(0.1, (endMins - startMins) / 60);

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

        rTier = Object.values(huntStats)
          .map(h => ({ name: h.name, xph: h.totalXp / h.totalHours }))
          .sort((a, b) => b.xph - a.xph)
          .slice(0, 5); // Top 5
        setRespawnTierList(rTier);
      }

      // Fetch FULL Roster for BI
      let vData = [];
      let lData = [];
      let bRisk = [];
      try {
        let allRoster = [];
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
        
        setVocationData(vData);
        setLevelData(lData);
        setBurnoutRisk(bRisk.sort((a, b) => b.level - a.level).slice(0, 15));
      } catch (e) {
        console.error("BI Fetch Error:", e);
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
      setLoading(false);
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

        </div>
      )}
    </div>
  );
}
