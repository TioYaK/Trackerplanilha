import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, TrendingUp, AlertTriangle, Users, Info, CheckCircle, RotateCcw, Shield, Zap, Skull, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { parseUtcDate, isSlotActiveNow } from '../lib/tibiaUtils';

const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatXp = (raw) => {
  if (!raw && raw !== 0) return '0';
  const num = Number(raw);
  if (isNaN(num)) return '0';
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1000000) return sign + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + 'k';
  return sign + abs.toString();
};

// Server Save Logic (10:00 AM BRT = 13:00 UTC)
const getLastSS = () => {
  const now = new Date();
  const ss = new Date(now);
  if (now.getUTCHours() < 13) {
    ss.setUTCDate(ss.getUTCDate() - 1);
  }
  ss.setUTCHours(13, 0, 0, 0);
  return ss.getTime();
};

const getTibiaDay = (d) => {
  const dt = (d instanceof Date) ? d : parseUtcDate(d);
  if (!dt || isNaN(dt.getTime())) return '';
  // Subtrai 13h do UTC para que a virada virtual ocorra às 10h da manhã (Server Save BRT)
  const ssDate = new Date(dt.getTime() - 13 * 60 * 60 * 1000);
  return ssDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' });
};

const formatTime = (d) => {
  if (!d) return '--:--';
  const dt = (d instanceof Date) ? d : parseUtcDate(d);
  if (!dt || isNaN(dt.getTime())) return '--:--';
  return dt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
};

const getValidMembers = (members) => {
  const seen = new Set();
  const list = [];
  (members || []).forEach(m => {
    if (m && typeof m === 'string' && m.trim().length > 0) {
      const clean = m.trim();
      const lower = clean.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(clean);
      }
    }
  });
  return list;
};

export default function PartyDashboard({ party, onPlayerClick }) {
  const [rawDataset, setRawDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyRange, setHistoryRange] = useState('week'); // 'week' ou 'month'
  const [selectedHuntDay, setSelectedHuntDay] = useState(null);

  // Estados derivados da análise forense
  const [membersData, setMembersData] = useState([]);
  const [actualHuntTime, setActualHuntTime] = useState(null);
  const [historyChartData, setHistoryChartData] = useState([]);
  const [sessionLabel, setSessionLabel] = useState('Rendimento Individual (Hoje / SS)');
  const [tacticalReport, setTacticalReport] = useState(null);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let durationText = '';
      if (data.startRaw && data.endRaw) {
        const start = parseUtcDate(data.startRaw);
        const end = parseUtcDate(data.endRaw);
        if (start && end) {
          const dMins = Math.max(1, Math.round((end - start) / 60000));
          const hours = Math.floor(dMins / 60);
          const mins = dMins % 60;
          durationText = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
        }
      }
      return (
        <div className="bg-gray-900 border border-tibia-border p-3 rounded shadow-lg text-sm">
          <p className="font-bold text-tibia-primary mb-1">{label}</p>
          <p className="text-gray-300">XP Total: <span className="text-green-400 font-bold">+{formatXp(data.totalXp)}</span></p>
          {data.singlePing ? (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Ping Isolado: {data.start}</p>
          ) : (
             <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Horário: {data.start} - {data.end} {durationText && `(${durationText})`}</p>
          )}
          <p className="text-[10px] text-amber-400/80 mt-1.5 italic">Clique para auditar esta hunt</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    setSelectedHuntDay(null);
  }, [party?.id]);

  // Efeito 1: Busca os dados brutos no Supabase com Promise.all concorrente
  useEffect(() => {
    let isCancelled = false;

    const fetchPartyData = async (isBackground = false) => {
      if (!party || !party.members || party.members.length === 0) {
        if (!isCancelled) {
          setLoading(false);
          setRawDataset(null);
        }
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }

      const validMembers = getValidMembers(party.members);
      if (validMembers.length === 0) {
        if (!isCancelled) {
          setLoading(false);
          setRawDataset(null);
        }
        return;
      }

      const daysToFetch = historyRange === 'week' ? 7 : 30;
      const historyStartDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();
      const orFilterName = validMembers.map(m => `name.ilike."${m.trim().replace(/[",]/g, '')}"`).join(',');
      const orFilterChar = validMembers.map(m => `character_name.ilike."${m.trim().replace(/[",]/g, '')}"`).join(',');

      try {
        const [
          { data: logs },
          { data: currentStates },
          { data: guildData },
          { data: recentDeaths },
          { data: loginEvents }
        ] = await Promise.all([
          supabase.from('historical_sessions').select('*').or(orFilterChar).gte('session_end', historyStartDate).order('session_end', { ascending: true }),
          supabase.from('current_character_state').select('*').or(orFilterChar),
          supabase.from('guild_members').select('name, level, is_online').or(orFilterName),
          supabase.from('recent_deaths').select('character_name, level, killed_by, death_time').or(orFilterChar).gte('death_time', historyStartDate).order('death_time', { ascending: true }),
          supabase.from('login_events').select('character_name, event_type, event_time').or(orFilterChar).gte('event_time', historyStartDate).order('event_time', { ascending: true })
        ]);

        if (!isCancelled) {
          setRawDataset({
            logs: logs || [],
            currentStates: currentStates || [],
            guildData: guildData || [],
            recentDeaths: recentDeaths || [],
            loginEvents: loginEvents || [],
            lastFetch: Date.now()
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao carregar telemetria da party:', err);
        if (!isCancelled) setLoading(false);
      }
    };

    fetchPartyData();
    const interval = setInterval(() => fetchPartyData(true), 5 * 60 * 1000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [party?.id, party?.slot_start, party?.slot_end, historyRange]);

  // Efeito 2: Processamento e Auditoria Forense em Memória (Instantâneo / 0ms)
  useEffect(() => {
    if (!rawDataset || !party) return;

    const { logs, currentStates, guildData, recentDeaths } = rawDataset;
    const validMembers = getValidMembers(party.members);
    if (validMembers.length === 0) return;

    const lastSSTime = getLastSS();

    // 1. Monta o mapa histórico por dia do Server Save
    const historyMap = {};
    const sMin = toMinutes(party.slot_start);
    let eMin = toMinutes(party.slot_end);
    if (eMin <= sMin) eMin += 1440;
    const winStart = sMin - 45;
    const winEnd = eMin + 45;

    logs.forEach(log => {
      const date = parseUtcDate(log.session_end);
      const startDate = parseUtcDate(log.session_start) || date;
      const dxp = parseInt(log.xp_gained || 0, 10);
      if (dxp <= 0 || !date) return;

      const durationMins = log.duration_minutes || ((date - startDate) / 60000);
      if (durationMins > 300) return;

      if (party.slot_start && party.slot_end) {
        const startBrt = new Date(startDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const endBrt = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        let startM = startBrt.getHours() * 60 + startBrt.getMinutes();
        let endM = endBrt.getHours() * 60 + endBrt.getMinutes();
        if (endM < startM) endM += 1440;

        if (eMin > 1440 && startM < (winEnd - 1440)) {
          startM += 1440;
          endM += 1440;
        } else if (winStart < 0 && startM >= (1440 + winStart)) {
          startM -= 1440;
          endM -= 1440;
        }

        const inWindow = (startM >= winStart && startM <= winEnd) || (startM <= sMin && endM >= sMin);
        if (!inWindow) return;
      }

      const dayStr = getTibiaDay(startDate);

      if (!historyMap[dayStr]) {
        historyMap[dayStr] = {
          day: dayStr,
          totalXp: 0,
          start: startDate,
          end: date,
          rawDate: startDate,
          memberXp: {},
          memberLevels: {}
        };
      }

      historyMap[dayStr].totalXp += dxp;
      if (startDate < historyMap[dayStr].start) historyMap[dayStr].start = startDate;
      if (date > historyMap[dayStr].end) historyMap[dayStr].end = date;
      
      const charKey = (log.character_name || '').toLowerCase();
      historyMap[dayStr].memberXp[charKey] = (historyMap[dayStr].memberXp[charKey] || 0) + dxp;
      if (log.end_level) {
        historyMap[dayStr].memberLevels[charKey] = log.end_level;
      }
    });

    const chartDataArr = Object.values(historyMap)
      .filter(h => {
        const activeCount = Object.keys(h.memberXp).length;
        const hasLeader = party.leader_name && h.memberXp[party.leader_name.toLowerCase()] > 0;
        const isSoloParty = validMembers.length === 1;
        return activeCount >= 2 || hasLeader || (isSoloParty && activeCount >= 1);
      })
      .sort((a, b) => a.rawDate - b.rawDate)
      .map(h => {
         const diffMins = Math.max(1, (h.end - h.start) / (1000 * 60));
         return {
             day: h.day,
             totalXp: h.totalXp,
             start: formatTime(h.start),
             end: formatTime(h.end),
             startRaw: h.start,
             endRaw: h.end,
             singlePing: diffMins < 10,
             memberXp: h.memberXp,
             memberLevels: h.memberLevels || {},
             rawDate: h.rawDate
         };
      });
    setHistoryChartData(chartDataArr);

    // 2. Determina qual Hunt exibir
    const hasScheduledSlot = Boolean(party.slot_start && party.slot_end);
    const isSlotActive = hasScheduledSlot && isSlotActiveNow(party.slot_start, party.slot_end);
    const todayDayStr = getTibiaDay(new Date());
    const todayHunt = chartDataArr.find(h => h.day === todayDayStr);
    const lastHunt = chartDataArr.length > 0 ? chartDataArr[chartDataArr.length - 1] : null;

    let activeHunt = null;
    let isShowingLive = false;
    let activeLabel = 'Rendimento Individual (Hoje / SS)';

    if (selectedHuntDay) {
      if (selectedHuntDay === 'LIVE' && isSlotActive) {
        isShowingLive = true;
        activeLabel = 'Rendimento Individual (Caçando Agora - Ao Vivo)';
      } else {
        activeHunt = chartDataArr.find(h => h.day === selectedHuntDay) || lastHunt;
        if (activeHunt) {
          activeLabel = `Rendimento Individual (${activeHunt.day})`;
        }
      }
    } else {
      if (isSlotActive) {
        isShowingLive = true;
        activeLabel = 'Rendimento Individual (Caçando Agora)';
      } else if (todayHunt) {
        activeHunt = todayHunt;
        activeLabel = `Rendimento Individual (Hoje - ${todayHunt.day})`;
      } else if (lastHunt) {
        activeHunt = lastHunt;
        activeLabel = `Rendimento Individual (Última Hunt - ${lastHunt.day})`;
      }
    }
    setSessionLabel(activeLabel);

    // 3. Calcula estatísticas individuais dos membros
    const memberStats = {};
    validMembers.forEach(m => {
      memberStats[m.toLowerCase()] = { name: m, totalXpGained: 0, level: '?', lastSeen: null, isOnlineRoster: false };
    });
    
    guildData.forEach(g => {
      const m = memberStats[g.name?.toLowerCase()];
      if (m) {
        if (g.level) m.level = g.level;
        if (g.is_online !== undefined && g.is_online !== null) {
          m.isOnlineRoster = Boolean(g.is_online);
        }
      }
    });

    currentStates.forEach(state => {
      const m = memberStats[state.character_name?.toLowerCase()];
      if (m) {
        m.level = state.level || m.level;
        const lastActive = parseUtcDate(state.last_active);
        if (lastActive && (!m.lastSeen || lastActive > m.lastSeen)) {
           m.lastSeen = lastActive;
        }
      }
    });

    if (isShowingLive) {
      currentStates.forEach(state => {
        const m = memberStats[state.character_name?.toLowerCase()];
        if (m) {
          const lastActive = parseUtcDate(state.last_active);
          if (lastActive && lastActive.getTime() >= lastSSTime) {
            const deltaXp = Number(state.xp_total || 0) - Number(state.session_start_xp || state.xp_total || 0);
            if (deltaXp > 0) m.totalXpGained += deltaXp;
          }
        }
      });

      logs.forEach(log => {
        const date = parseUtcDate(log.session_end);
        const startDate = parseUtcDate(log.session_start) || date;
        const dxp = parseInt(log.xp_gained || 0, 10);
        const m = memberStats[log.character_name?.toLowerCase()];
        if (date && date.getTime() >= lastSSTime && m && dxp > 0) {
          const startBrt = new Date(startDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
          let startM = startBrt.getHours() * 60 + startBrt.getMinutes();
          if (eMin > 1440 && startM < (winEnd - 1440)) {
            startM += 1440;
          } else if (winStart < 0 && startM >= (1440 + winStart)) {
            startM -= 1440;
          }
          const inWindow = (!party.slot_start || !party.slot_end) || (startM >= winStart && startM <= winEnd);
          if (inWindow) {
            m.totalXpGained += dxp;
            m.level = log.end_level || m.level;
            if (!m.lastSeen || date > m.lastSeen) m.lastSeen = date;
          }
        }
      });
    } else if (activeHunt) {
      validMembers.forEach(mName => {
        const mKey = mName.toLowerCase();
        const xp = activeHunt.memberXp[mKey] || 0;
        if (memberStats[mKey]) {
          memberStats[mKey].totalXpGained = xp;
          if (activeHunt.memberLevels && activeHunt.memberLevels[mKey]) {
            memberStats[mKey].level = activeHunt.memberLevels[mKey];
          }
        }
      });
    }

    const nowMs = Date.now();
    const processedMembers = Object.values(memberStats).map(m => {
      const raw = m.totalXpGained;
      const diff = m.lastSeen ? (nowMs - m.lastSeen.getTime()) : Infinity;
      const isRecentlyActive = diff >= 0 && diff < 20 * 60 * 1000;
      return { 
        ...m, 
        formattedXp: formatXp(raw), 
        isOnline: Boolean(m.isOnlineRoster) || isRecentlyActive,
        participated: raw > 0
      };
    });

    processedMembers.sort((a, b) => b.totalXpGained - a.totalXpGained);
    setMembersData(processedMembers);

    // 4. Horário Real (Telemetria)
    if (isShowingLive) {
      setActualHuntTime({ 
        start: party.slot_start?.slice(0, 5) || '--:--', 
        end: 'Agora', 
        day: 'Hoje',
        xpHour: party.delta_xp || '0'
      });
    } else if (activeHunt) {
      let calculatedXpHour = null;
      if (activeHunt.startRaw && activeHunt.endRaw) {
        const sDate = parseUtcDate(activeHunt.startRaw);
        const eDate = parseUtcDate(activeHunt.endRaw);
        if (sDate && eDate) {
          const diffHours = Math.max(0.1, (eDate.getTime() - sDate.getTime()) / (1000 * 3600));
          if (diffHours > 0 && activeHunt.totalXp > 0) {
            calculatedXpHour = `${formatXp(Math.round(activeHunt.totalXp / diffHours))}/h`;
          }
        }
      }
      if (activeHunt.singlePing) {
        setActualHuntTime({ 
          single: `${activeHunt.start} (${activeHunt.day})`,
          xpHour: calculatedXpHour || party.delta_xp || '0'
        });
      } else {
        setActualHuntTime({ 
          start: activeHunt.start, 
          end: activeHunt.end, 
          day: activeHunt.day,
          xpHour: calculatedXpHour || party.delta_xp || '0'
        });
      }
    } else {
      setActualHuntTime(null);
    }

    // 5. Gera o Parecer Tático Forense da Hunt
    if (activeHunt || isShowingLive) {
      const huntStart = isShowingLive ? new Date(lastSSTime) : parseUtcDate(activeHunt.startRaw || activeHunt.start);
      const huntEnd = isShowingLive ? new Date() : parseUtcDate(activeHunt.endRaw || activeHunt.end);

      const activeMembersWithXp = isShowingLive 
        ? processedMembers.filter(m => m.totalXpGained > 0)
        : validMembers.filter(m => (activeHunt.memberXp[m.toLowerCase()] || 0) > 0).map(m => ({
            name: m,
            totalXpGained: activeHunt.memberXp[m.toLowerCase()] || 0
          }));

      const activeCharNamesLower = new Set(activeMembersWithXp.map(m => m.name.toLowerCase()));

      const huntDeaths = (recentDeaths || []).filter(d => {
        const charName = (d.character_name || '').toLowerCase();
        if (!activeCharNamesLower.has(charName)) return false;
        const dt = parseUtcDate(d.death_time);
        if (!dt || !huntStart) return false;
        const startBound = huntStart.getTime() - 30 * 60 * 1000;
        const endBound = (huntEnd ? huntEnd.getTime() : huntStart.getTime() + 4 * 3600 * 1000) + 30 * 60 * 1000;
        return dt.getTime() >= startBound && dt.getTime() <= endBound;
      });

      const casualties = huntDeaths.map(d => {
        const lvl = Number(d.level) || Number(memberStats[d.character_name?.toLowerCase()]?.level) || 1000;
        const estimatedLoss = Math.round((50 / 3 * Math.pow(lvl, 3)) * 0.0012);
        return {
          character_name: d.character_name,
          level: lvl,
          killed_by: d.killed_by,
          time: formatTime(parseUtcDate(d.death_time)),
          estimatedLoss: estimatedLoss,
          formattedLoss: formatXp(estimatedLoss)
        };
      });

      const memberProduction = activeMembersWithXp.map(m => {
        const deaths = casualties.filter(c => c.character_name.toLowerCase() === m.name.toLowerCase());
        const totalLoss = deaths.reduce((sum, c) => sum + c.estimatedLoss, 0);
        return {
          name: m.name,
          totalXpGained: m.totalXpGained,
          grossXp: m.totalXpGained + totalLoss,
          deaths: deaths,
          totalLoss: totalLoss
        };
      });

      let baselineXp = 0;
      let multiplierInsights = [];

      if (memberProduction.length > 0) {
        const maxGross = Math.max(...memberProduction.map(m => m.grossXp));
        
        // Membros que participaram de forma integral (pelo menos 40% da maior produção bruta)
        const fullHuntCandidates = memberProduction.filter(m => m.grossXp >= maxGross * 0.40);
        
        // Membros íntegros (sem baixas/mortes) para definir o benchmark padrão da hunt
        const cleanCandidates = fullHuntCandidates.filter(m => m.deaths.length === 0);
        const benchmarkPool = cleanCandidates.length > 0 ? cleanCandidates : fullHuntCandidates;

        // O benchmark padrão da hunt é a média dos membros íntegros
        baselineXp = benchmarkPool.length > 0
          ? Math.round(benchmarkPool.reduce((acc, curr) => acc + curr.grossXp, 0) / benchmarkPool.length)
          : Math.round(memberProduction.reduce((acc, curr) => acc + curr.grossXp, 0) / memberProduction.length);

        memberProduction.forEach(m => {
          const ratio = baselineXp > 0 ? (m.grossXp / baselineXp) : 1;
          const hasDeath = m.deaths.length > 0;
          const isOutlierBoost = ratio >= 1.18; // ~20% acima do padrão médio da equipe
          const isPartial = ratio < 0.60 && !hasDeath;
          const signedXp = `${m.totalXpGained > 0 ? '+' : ''}${formatXp(m.totalXpGained)}`;

          if (hasDeath) {
            const deathDetails = m.deaths.map(d => `${d.time} para ${d.killed_by}`).join(', ');
            const grossPercent = Math.round(ratio * 100);
            multiplierInsights.push({
              name: m.name,
              type: 'DEATH',
              tag: 'Baixa em Combate',
              text: `${m.name} (${signedXp}): Sofreu ${m.deaths.length} baixa(s) (${deathDetails}) com perda estimada de ~${formatXp(m.totalLoss)} XP. Sem as baixas, sua produção bruta alcançou ~${formatXp(m.grossXp)} (${grossPercent}% do padrão da equipe).`
            });
          } else if (isPartial) {
            multiplierInsights.push({
              name: m.name,
              type: 'PARTIAL',
              tag: 'Participação Parcial',
              text: `${m.name} (${signedXp}): Entrada tardia ou saída antecipada do respawn (${Math.round(ratio * 100)}% da média de tempo da party).`
            });
          } else if (isOutlierBoost) {
            multiplierInsights.push({
              name: m.name,
              type: 'BOOST',
              tag: `Prey / Boost (+${Math.round((ratio - 1) * 100)}%)`,
              text: `${m.name} (${signedXp}): Destaque de rendimento (+${Math.round((ratio - 1) * 100)}% acima do padrão da equipe), operando com Prey de XP ou Store Boost ativo.`
            });
          } else {
            multiplierInsights.push({
              name: m.name,
              type: 'BASE',
              tag: 'Rendimento Padrão (100%)',
              text: `${m.name} (${signedXp}): Caçou em ritmo integral e sincronizado com a equipe (${Math.round(ratio * 100)}% do rendimento padrão).`
            });
          }
        });
      }

      const absentMembers = validMembers.filter(m => {
        if (isShowingLive) {
          const pm = processedMembers.find(p => p.name.toLowerCase() === m.toLowerCase());
          return !pm || pm.totalXpGained <= 0;
        }
        return (activeHunt.memberXp[m.toLowerCase()] || 0) <= 0;
      });
      const quorumPercent = validMembers.length > 0 ? Math.round((activeMembersWithXp.length / validMembers.length) * 100) : 0;
      const totalHuntXp = isShowingLive 
        ? processedMembers.reduce((acc, curr) => acc + curr.totalXpGained, 0)
        : activeHunt.totalXp;

      setTacticalReport({
        day: isShowingLive ? 'Ao Vivo (Hoje)' : activeHunt.day,
        quorum: {
          activeCount: activeMembersWithXp.length,
          totalCount: validMembers.length,
          percent: quorumPercent,
          absent: absentMembers
        },
        baselineXp: baselineXp,
        formattedBaseline: formatXp(baselineXp),
        totalXp: totalHuntXp,
        formattedTotal: formatXp(totalHuntXp),
        casualties: casualties,
        multiplierInsights: multiplierInsights,
        huntHours: isShowingLive 
          ? `${party.slot_start?.slice(0, 5) || '--:--'} - Agora` 
          : (activeHunt.singlePing ? `${activeHunt.start} (Pico Isolado)` : `${activeHunt.start} - ${activeHunt.end}`)
      });
    } else {
      setTacticalReport(null);
    }
  }, [rawDataset, party, selectedHuntDay]);

  if (!party) return <div>Nenhuma party selecionada.</div>;

  const statusColors = {
    EFFICIENT: 'border-green-500 bg-green-500/10 text-green-400',
    SUBOPTIMAL: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    FALTA_1: 'border-orange-500 bg-orange-500/10 text-orange-400',
    FALTA_2: 'border-orange-600 bg-orange-600/10 text-orange-500',
    GHOST_SLOT: 'border-red-500 bg-red-500/10 text-red-400',
    DEFAULT: 'border-tibia-border bg-tibia-card text-gray-400'
  };
  const hasScheduledSlot = Boolean(party.slot_start && party.slot_end);
  const isSlotActive = hasScheduledSlot && isSlotActiveNow(party.slot_start, party.slot_end);

  const nowBrt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const currentTotalMinutes = nowBrt.getHours() * 60 + nowBrt.getMinutes();
  const startMin = toMinutes(party.slot_start);
  let endMin = toMinutes(party.slot_end);
  if (endMin <= startMin) endMin += 1440;
  let currentMin = currentTotalMinutes;
  if (currentMin < startMin && endMin > 1440) currentMin += 1440;
  const isSlotPast = hasScheduledSlot && currentMin > endMin;

  const currentStatus = party.status || 'DEFAULT';

  let displayStatus = hasScheduledSlot ? 'Aguardando Slot' : 'Horário Flexível / Livre';
  let statusColorClass = hasScheduledSlot ? 'text-gray-400' : 'text-blue-400';
  let StatusIcon = Clock;

  if (isSlotActive) {
    if (currentStatus === 'EFFICIENT') {
      displayStatus = 'Caçando Ativamente';
      statusColorClass = 'text-green-400';
      StatusIcon = TrendingUp;
    } else if (currentStatus === 'SUBOPTIMAL') {
      displayStatus = 'Ociosidade Parcial';
      statusColorClass = 'text-yellow-400';
      StatusIcon = Clock;
    } else if (currentStatus === 'FALTA_1') {
      displayStatus = 'Falta (1/3)';
      statusColorClass = 'text-orange-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_2') {
      displayStatus = 'Falta (2/3)';
      statusColorClass = 'text-orange-500';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'GHOST_SLOT') {
      displayStatus = 'Slot Fantasma (Abandono)';
      statusColorClass = 'text-red-400';
      StatusIcon = AlertTriangle;
    } else {
      displayStatus = 'Slot em Andamento';
      statusColorClass = 'text-blue-400';
      StatusIcon = Clock;
    }
  } else if (isSlotPast) {
    if (currentStatus === 'GHOST_SLOT') {
      displayStatus = 'Slot Fantasma (Abandono)';
      statusColorClass = 'text-red-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_1') {
      displayStatus = 'Slot Concluído (1/3 Falta)';
      statusColorClass = 'text-orange-400';
      StatusIcon = AlertTriangle;
    } else if (currentStatus === 'FALTA_2') {
      displayStatus = 'Slot Concluído (2/3 Falta)';
      statusColorClass = 'text-orange-500';
      StatusIcon = AlertTriangle;
    } else {
      displayStatus = 'Slot Concluído';
      statusColorClass = 'text-blue-400';
      StatusIcon = CheckCircle;
    }
  } else if (hasScheduledSlot) {
    displayStatus = 'Aguardando Slot';
    statusColorClass = 'text-gray-400';
    StatusIcon = Clock;
  }

  const chartData = membersData.map(m => ({ name: (m?.name || '').split(' ')[0] || 'Member', xp: Number(m?.totalXpGained) || 0 }));
  const formatXpAxis = (tick) => formatXp(tick);

  const isCurrentlyLive = selectedHuntDay === 'LIVE' || (!selectedHuntDay && isSlotActive);
  const currentSelectedDayStr = isCurrentlyLive ? null : (selectedHuntDay || (historyChartData.length > 0 ? historyChartData[historyChartData.length - 1].day : null));
  const currentDayIdx = currentSelectedDayStr ? historyChartData.findIndex(h => h.day === currentSelectedDayStr) : -1;

  let prevHuntDay = null;
  let nextHuntDay = null;

  if (isCurrentlyLive) {
    prevHuntDay = historyChartData.length > 0 ? historyChartData[historyChartData.length - 1].day : null;
    nextHuntDay = null;
  } else if (currentDayIdx >= 0) {
    prevHuntDay = currentDayIdx > 0 ? historyChartData[currentDayIdx - 1].day : null;
    if (currentDayIdx < historyChartData.length - 1) {
      nextHuntDay = historyChartData[currentDayIdx + 1].day;
    } else if (isSlotActive) {
      nextHuntDay = 'LIVE';
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="mb-6">
        <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Dossiê da Party</h2>
        <p className="text-gray-400 font-sans">Verifique o rendimento coletivo e individual da hunt.</p>
      </div>
      
      <div className={`p-6 rounded-lg border-2 ${statusColors[currentStatus]?.split(' text-')[0] || 'border-tibia-border'} mb-8 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={120} /></div>
        <h2 className="text-4xl font-black text-white mb-2">{party.party_name}</h2>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <span className="text-tibia-highlight">📍 {party.respawn_category} / {party.hunt_name || 'Desconhecido'}</span>
          <span className="text-gray-300">👑 Líder: {party.leader_name}</span>
          <span className="text-blue-400"><Clock size={14} className="inline mr-1" /> {party.slot_start} - {party.slot_end}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Status do Slot</p>
            <p className={`text-lg font-bold flex items-center ${statusColorClass}`}>
              <StatusIcon size={20} className="mr-2" />
              <span>{displayStatus}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold flex items-center">
                Horário Real (Telemetria)
            </p>
            <p className="text-lg font-bold text-white flex items-center">
               {actualHuntTime ? (
                   actualHuntTime.single ? (
                       <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.single}</>
                   ) : (
                       <><Clock size={16} className="text-blue-400 mr-2" /> {actualHuntTime.start} - {actualHuntTime.end} <span className="text-xs text-gray-400 ml-2 font-normal">({actualHuntTime.day})</span></>
                   )
               ) : (
                   <span className="text-gray-500 text-sm italic">Não detectado</span>
               )}
            </p>
            <p className="text-[10px] text-gray-500 mt-1 leading-tight flex items-start">
               <Info size={10} className="mr-1 mt-[2px] flex-shrink-0" />
               <span>Aviso: Margem de erro de ~5 minutos devido ao intervalo do robô. 
               {actualHuntTime && actualHuntTime.single && " 'Pico Isolado' indica que a hunt durou menos de 10 minutos."}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">
              {isShowingLive ? 'ΔXP/h Registrado (Ao Vivo)' : 'ΔXP/h da Hunt'}
            </p>
            <p className="text-lg font-bold text-white">
              {actualHuntTime && actualHuntTime.xpHour ? actualHuntTime.xpHour : (party.delta_xp || '0')}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Barra de Filtro por Dia */}
          {historyChartData.length > 0 && (
            <div className="lg:col-span-3 flex flex-wrap items-center gap-2 bg-black/40 border border-tibia-border/60 p-3 rounded-lg shadow-inner">
              <div className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
                <Calendar size={14} className="text-amber-400 mr-1.5" />
                <span>Filtrar por Dia:</span>
              </div>

              {isSlotActive && (
                <button
                  onClick={() => setSelectedHuntDay('LIVE')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center transition-all ${
                    (selectedHuntDay === 'LIVE' || (!selectedHuntDay && isSlotActive))
                      ? 'bg-green-500/20 text-green-300 border border-green-500 shadow-sm'
                      : 'bg-black/40 text-gray-400 hover:text-white border border-tibia-border/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  Ao Vivo (Agora)
                </button>
              )}

              {[...historyChartData].reverse().map((h, idx) => {
                const isLatest = idx === 0;
                const isSelected = selectedHuntDay === h.day || (!selectedHuntDay && !isSlotActive && isLatest);
                return (
                  <button
                    key={h.day}
                    onClick={() => setSelectedHuntDay(h.day)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold border border-amber-400 shadow-md scale-105'
                        : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-white border border-tibia-border/60'
                    }`}
                  >
                    <span>{h.day}</span>
                    {isLatest && <span className="ml-1 text-[10px] opacity-75 font-normal">(Última)</span>}
                    <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-black/80 font-bold' : 'text-amber-400/80 font-mono'}`}>
                      +{formatXp(h.totalXp)}
                    </span>
                  </button>
                );
              })}

              {selectedHuntDay && (
                <button
                  onClick={() => setSelectedHuntDay(null)}
                  className="ml-auto text-xs text-gray-400 hover:text-amber-400 flex items-center transition-colors bg-white/5 px-2.5 py-1 rounded border border-white/10"
                  title="Restaurar visualização automática da última hunt"
                >
                  <RotateCcw size={12} className="mr-1.5" />
                  Restaurar Padrão
                </button>
              )}
            </div>
          )}

          <div className="lg:col-span-2 bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 bg-black/40 border-b border-tibia-border flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="font-bold text-white">{sessionLabel}</h3>
                {selectedHuntDay && (
                  <button 
                    onClick={() => setSelectedHuntDay(null)}
                    className="ml-3 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/40 px-2 py-0.5 rounded inline-flex items-center transition-colors"
                    title="Voltar para a última hunt gravada"
                  >
                    <RotateCcw size={11} className="mr-1" /> Mais Recente
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-black/20 text-gray-400 uppercase font-semibold">
                  <tr><th className="px-6 py-3">Membro</th><th className="px-6 py-3">Level</th><th className="px-6 py-3">{isShowingLive ? 'Status (Ao Vivo)' : 'Participação'}</th><th className="px-6 py-3 text-right">XP Contribuída</th></tr>
                </thead>
                <tbody className="divide-y divide-tibia-border/50">
                  {membersData.map(m => {
                    const isLeader = party.leader_name && m.name.toLowerCase() === party.leader_name.toLowerCase();
                    return (
                      <tr key={m.name} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white cursor-pointer hover:text-tibia-primary hover:underline" onClick={() => onPlayerClick && onPlayerClick(m.name)}>
                          {m.name} {isLeader && <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-500 px-1 py-0.5 rounded">Líder</span>}
                        </td>
                        <td className="px-6 py-4">{m.level !== '?' ? <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono">Lvl {m.level}</span> : <span className="text-gray-600">?</span>}</td>
                        <td className="px-6 py-4">
                          {isShowingLive ? (
                            m.isOnline ? (
                              <span className="text-green-400 flex items-center font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                                Caçando
                              </span>
                            ) : (
                              <span className="text-gray-500 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span>
                                Offline
                              </span>
                            )
                          ) : (
                            m.participated ? (
                              <span className="text-green-400 flex items-center font-medium">
                                <CheckCircle size={14} className="mr-1.5 text-green-400" />
                                Presente
                              </span>
                            ) : (
                              <span className="text-yellow-500/80 flex items-center font-medium">
                                <AlertTriangle size={14} className="mr-1.5 text-yellow-500/70" />
                                Ausente
                              </span>
                            )
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold font-mono ${
                          m.totalXpGained > 0 
                            ? 'text-green-400' 
                            : m.totalXpGained < 0 
                            ? 'text-red-400' 
                            : 'text-gray-500'
                        }`}>
                          {m.totalXpGained > 0 ? `+${m.formattedXp}` : m.formattedXp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-6">
            <h3 className="font-bold text-white mb-6">Balanço da Party</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#666" tickFormatter={formatXpAxis} />
                  <YAxis dataKey="name" type="category" stroke="#999" width={80} tick={{fill: '#ccc', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} formatter={(value) => [`${formatXpAxis(value)} XP`, 'Ganho']} />
                  <Bar dataKey="xp" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.xp < 0 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic text-center">Membros inativos com XP zerada podem estar offline, em outro servidor ou ausentes na hunt.</p>
          </div>

          {/* Card: Raio-X Tático da Hunt */}
          {tacticalReport && (
            <div className="lg:col-span-3 bg-gradient-to-b from-gray-900/90 to-tibia-card border border-amber-500/30 rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-black/60 border-b border-tibia-border flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Raio-X Tático da Hunt
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Auditoria de Telemetria
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Análise forense de rendimento, bônus de stamina, baixas e quórum da equipe.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Seletor de Dia Interativo no Header do Raio-X */}
                  <div className="flex items-center bg-black/60 border border-amber-500/40 rounded px-2.5 py-1 shadow-sm">
                    <Filter size={13} className="text-amber-400 mr-2" />
                    <select
                      value={selectedHuntDay || (isSlotActive ? 'LIVE' : (historyChartData[historyChartData.length - 1]?.day || ''))}
                      onChange={(e) => setSelectedHuntDay(e.target.value === 'LIVE' ? 'LIVE' : e.target.value)}
                      className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer pr-1"
                    >
                      {isSlotActive && <option value="LIVE" className="bg-gray-900 text-green-400">🟢 Ao Vivo (Agora)</option>}
                      {[...historyChartData].reverse().map((h, idx) => (
                        <option key={h.day} value={h.day} className="bg-gray-900 text-white">
                          {h.day} {idx === 0 ? '(Última)' : ''} — +{formatXp(h.totalXp)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botões de Navegação Anterior / Próximo */}
                  <div className="flex items-center bg-black/40 border border-tibia-border rounded overflow-hidden">
                    <button
                      type="button"
                      disabled={!prevHuntDay}
                      onClick={() => prevHuntDay && setSelectedHuntDay(prevHuntDay)}
                      title={prevHuntDay ? `Ver dia anterior (${prevHuntDay})` : 'Sem dia anterior'}
                      className={`px-2 py-1 flex items-center transition-colors ${
                        prevHuntDay 
                          ? 'text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer' 
                          : 'text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <ChevronLeft size={14} className="mr-0.5" />
                      <span className="text-[11px] hidden sm:inline">Anterior</span>
                    </button>
                    <div className="w-[1px] h-4 bg-tibia-border"></div>
                    <button
                      type="button"
                      disabled={!nextHuntDay}
                      onClick={() => nextHuntDay && setSelectedHuntDay(nextHuntDay)}
                      title={nextHuntDay === 'LIVE' ? 'Ver ao vivo (Agora)' : (nextHuntDay ? `Ver dia seguinte (${nextHuntDay})` : 'Sem dia seguinte')}
                      className={`px-2 py-1 flex items-center transition-colors ${
                        nextHuntDay 
                          ? 'text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer' 
                          : 'text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span className="text-[11px] hidden sm:inline">{nextHuntDay === 'LIVE' ? 'Ao Vivo' : 'Próximo'}</span>
                      <ChevronRight size={14} className="ml-0.5" />
                    </button>
                  </div>

                  <div className="bg-black/50 border border-tibia-border px-3 py-1 rounded text-gray-300 flex items-center">
                    <Clock size={13} className="mr-1.5 text-blue-400" />
                    <span className="text-white font-semibold">{tacticalReport.huntHours}</span>
                  </div>
                </div>
              </div>

              {/* Seletor Rápido de Dias dentro do Raio-X */}
              {historyChartData.length > 1 && (
                <div className="px-5 py-2.5 bg-black/30 border-b border-tibia-border/40 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider mr-1 flex items-center">
                    <Calendar size={11} className="mr-1 text-amber-400" />
                    Auditar dia:
                  </span>
                  {isSlotActive && (
                    <button
                      onClick={() => setSelectedHuntDay('LIVE')}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        (selectedHuntDay === 'LIVE' || (!selectedHuntDay && isSlotActive))
                          ? 'bg-green-500/30 text-green-300 border border-green-500'
                          : 'bg-black/40 text-gray-400 hover:text-white border border-tibia-border/30'
                      }`}
                    >
                      Ao Vivo
                    </button>
                  )}
                  {[...historyChartData].reverse().map((h, idx) => {
                    const isLatest = idx === 0;
                    const isSelected = selectedHuntDay === h.day || (!selectedHuntDay && !isSlotActive && isLatest);
                    return (
                      <button
                        key={`rx-${h.day}`}
                        onClick={() => setSelectedHuntDay(h.day)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black font-bold border border-amber-400 shadow-sm'
                            : 'bg-black/50 text-gray-300 hover:bg-black/80 hover:text-white border border-tibia-border/50'
                        }`}
                      >
                        {h.day}
                        <span className={`ml-1 text-[10px] ${isSelected ? 'text-black/80 font-bold' : 'text-amber-400/70 font-mono'}`}>
                          +{formatXp(h.totalXp)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4 KPIs de Alto Impacto */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-black/20 border-b border-tibia-border/50">
                <div className="bg-black/40 border border-tibia-border/60 p-3.5 rounded-lg">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Quórum da Party</span>
                    <Users size={14} className="text-blue-400" />
                  </p>
                  <p className="text-2xl font-black text-white mt-1">
                    {tacticalReport.quorum.activeCount} <span className="text-sm font-normal text-gray-400">/ {tacticalReport.quorum.totalCount}</span>
                  </p>
                  <p className={`text-xs mt-1 font-semibold ${
                    tacticalReport.quorum.percent >= 80 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {tacticalReport.quorum.percent}% de presença ativa
                  </p>
                </div>

                <div className="bg-black/40 border border-tibia-border/60 p-3.5 rounded-lg">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Rendimento Padrão</span>
                    <Zap size={14} className="text-amber-400" />
                  </p>
                  <p className="text-2xl font-black text-amber-400 mt-1">
                    +{tacticalReport.formattedBaseline}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Média íntegra por membro
                  </p>
                </div>

                <div className="bg-black/40 border border-tibia-border/60 p-3.5 rounded-lg">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Produção Coletiva</span>
                    <TrendingUp size={14} className="text-green-400" />
                  </p>
                  <p className="text-2xl font-black text-green-400 mt-1">
                    +{tacticalReport.formattedTotal}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    XP somada de toda a party
                  </p>
                </div>

                <div className="bg-black/40 border border-tibia-border/60 p-3.5 rounded-lg">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Segurança / Baixas</span>
                    <Skull size={14} className={tacticalReport.casualties.length > 0 ? "text-red-400" : "text-green-400"} />
                  </p>
                  <p className={`text-2xl font-black mt-1 ${
                    tacticalReport.casualties.length > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {tacticalReport.casualties.length === 0 ? '0 Baixas' : `${tacticalReport.casualties.length} Morte${tacticalReport.casualties.length > 1 ? 's' : ''}`}
                  </p>
                  <p className={`text-xs mt-1 ${tacticalReport.casualties.length > 0 ? 'text-red-300/80 font-medium' : 'text-green-400/80'}`}>
                    {tacticalReport.casualties.length === 0 
                      ? '100% de Sobrevivência' 
                      : `Perda: ~${formatXp(tacticalReport.casualties.reduce((acc, c) => acc + c.estimatedLoss, 0))} XP`}
                  </p>
                </div>
              </div>

              {/* Diagnósticos Detalhados */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1: Multiplicadores & Rendimento */}
                <div className="bg-black/30 border border-tibia-border/60 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                      <Zap size={16} className="text-amber-400 mr-2" />
                      Diagnóstico de Rendimento & Multiplicadores
                    </h4>
                    <div className="space-y-2.5">
                      {tacticalReport.multiplierInsights.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">Nenhum membro ativo detectado nesta hunt.</p>
                      ) : (
                        tacticalReport.multiplierInsights.map((ins, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded text-xs border leading-relaxed ${
                              ins.type === 'BOOST' 
                                ? 'bg-green-950/30 border-green-500/30 text-green-200'
                                : ins.type === 'DEATH'
                                ? 'bg-red-950/30 border-red-500/30 text-red-200'
                                : ins.type === 'PARTIAL'
                                ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-200'
                                : 'bg-black/40 border-tibia-border/40 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-white">{ins.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                ins.type === 'BOOST'
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : ins.type === 'DEATH'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : ins.type === 'PARTIAL'
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {ins.tag || (ins.type === 'BOOST' ? 'Prey / Boost' : ins.type === 'DEATH' ? 'Baixa em Combate' : ins.type === 'PARTIAL' ? 'Participação Parcial' : 'Rendimento Padrão (100%)')}
                              </span>
                            </div>
                            <p className="text-gray-300">{ins.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-4 italic">
                    💡 A divergência de XP entre membros da mesma hunt é decorrente de Stamina Verde (50% de bônus nas primeiras 2h), Prey de XP (+13% a +40% de bônus na criatura), Store Boosts (+50%) ou baixas/mortes no respawn.
                  </p>
                </div>

                {/* Coluna 2: Incidentes, Mortes e Quórum */}
                <div className="space-y-6">
                  {/* Incidentes e Baixas */}
                  <div className="bg-black/30 border border-tibia-border/60 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                      <Skull size={16} className="text-red-400 mr-2" />
                      Ocorrências & Baixas no Respawn
                    </h4>
                    {tacticalReport.casualties.length === 0 ? (
                      <div className="p-3 bg-green-950/20 border border-green-500/20 rounded text-xs text-green-300 flex items-center">
                        <CheckCircle size={15} className="text-green-400 mr-2 flex-shrink-0" />
                        Nenhum membro da party sofreu mortes no respawn durante esta sessão.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tacticalReport.casualties.map((c, idx) => (
                          <div key={idx} className="p-3 bg-red-950/40 border border-red-500/30 rounded text-xs text-red-200">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span 
                                className="cursor-pointer hover:text-amber-400 hover:underline"
                                onClick={() => onPlayerClick && onPlayerClick(c.character_name)}
                                title={`Ver perfil de ${c.character_name}`}
                              >
                                {c.character_name} (Lvl {c.level})
                              </span>
                              <span className="text-red-400 font-mono">-{c.formattedLoss} XP</span>
                            </div>
                            <p className="mt-1 text-gray-300">
                              Morto às <span className="text-white font-semibold">{c.time}</span> para <span className="text-amber-300 font-semibold">{c.killed_by}</span>.
                            </p>
                            <p className="text-[11px] text-red-300/80 mt-1 italic">
                              A perda de XP reduziu o saldo líquido do jogador no dossiê. O cálculo leva em consideração as 5 bênçãos regulares.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quórum e Ausências */}
                  <div className="bg-black/30 border border-tibia-border/60 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                      <Users size={16} className="text-blue-400 mr-2" />
                      Auditoria de Presença
                    </h4>
                    {tacticalReport.quorum.absent.length === 0 ? (
                      <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded text-xs text-blue-300 flex items-center">
                        <CheckCircle size={15} className="text-blue-400 mr-2 flex-shrink-0" />
                        Presença perfeita: 100% da party ativa e pontual no slot.
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-950/30 border border-yellow-500/30 rounded text-xs text-yellow-200">
                        <div className="font-bold text-yellow-400 flex items-center mb-1">
                          <AlertTriangle size={14} className="mr-1.5" />
                          Membro(s) Ausente(s) no Período:
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tacticalReport.quorum.absent.map(m => (
                            <span 
                              key={m} 
                              className="px-2 py-0.5 bg-black/60 border border-yellow-500/40 rounded text-yellow-300 font-mono cursor-pointer hover:bg-yellow-500/20 hover:border-yellow-400 transition-colors"
                              onClick={() => onPlayerClick && onPlayerClick(m)}
                              title={`Ver dossiê de ${m}`}
                            >
                              {m} (0 XP)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!tacticalReport && !loading && (
            <div className="lg:col-span-3 bg-tibia-card border border-tibia-border/60 rounded-lg p-6 text-center shadow-lg">
              <Shield size={36} className="mx-auto text-gray-500 mb-2 opacity-50" />
              <h3 className="text-base font-bold text-gray-300">Nenhuma sessão de caça registrada no período selecionado</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Assim que a party concluir caçadas dentro do horário planilhado ou iniciar o próximo slot, o robô gerará automaticamente a auditoria tática da hunt.
              </p>
            </div>
          )}

          {/* Gráfico Histórico Semanal/Mensal */}
          <div className="lg:col-span-3 bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden mt-8">
            <div className="p-4 bg-black/40 border-b border-tibia-border flex justify-between items-center">
               <h3 className="font-bold text-white">Histórico de Sessões</h3>
               <select 
                  value={historyRange} 
                  onChange={(e) => setHistoryRange(e.target.value)}
                  className="bg-black/50 border border-tibia-border text-gray-300 px-3 py-1 rounded outline-none text-sm cursor-pointer"
               >
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
               </select>
            </div>
            <div className="p-4" style={{ height: 300 }}>
              {historyChartData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-gray-500 italic">Nenhum registro de caça neste período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={historyChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload.length) {
                        const clickedDay = state.activePayload[0].payload.day;
                        setSelectedHuntDay(prev => prev === clickedDay ? null : clickedDay);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="day" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                    <YAxis stroke="#888" tickFormatter={formatXpAxis} tick={{fill: '#888', fontSize: 12}} width={60} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="totalXp" radius={[4, 4, 0, 0]} cursor="pointer">
                      {historyChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.day === (selectedHuntDay || historyChartData[historyChartData.length - 1]?.day) ? '#f59e0b' : '#785b30'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-xs text-gray-500 pb-3 italic text-center">💡 Clique em qualquer barra do histórico para auditar o rendimento e membros daquela hunt.</p>
          </div>

        </div>
      )}
    </div>
  );
}
