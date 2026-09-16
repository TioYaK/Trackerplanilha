import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from 'recharts';
import { Gavel, AlertOctagon, Ghost, Activity, Clock, Search, X, Globe, Trophy, ExternalLink, ArrowLeft, ChevronDown, Flame, Shield, Sparkles, Skull } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { parseUtcDate, toBrtDateStr, formatVocation } from '../lib/tibiaUtils';
import { WORLDS_LIST } from '../context/WorldContext';

// Cache em memória de dados do dashboard do jogador (TTL 60s)
const playerDashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 60 * 1000;

export default function PlayerDashboard({ playerName, isAdmin, onSelectPlayer, onBack, initialWorld }) {
  const [telemetry, setTelemetry] = useState([]);
  const [stats, setStats] = useState({ ghostSlots: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [frequentSquad, setFrequentSquad] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [playerAvatar, setPlayerAvatar] = useState(null);
  const [routine, setRoutine] = useState([]);
  const [levelHistory, setLevelHistory] = useState([]);
  const [deaths, setDeaths] = useState([]);
  const [showMakerModal, setShowMakerModal] = useState(false);
  const [makersData, setMakersData] = useState([]);
  const [makersLoading, setMakersLoading] = useState(false);
  
  // Informações de Mundo e Rankings
  const [selectedWorld, setSelectedWorld] = useState(initialWorld || 'ALL');
  const [worldRank, setWorldRank] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [globalPercentile, setGlobalPercentile] = useState(null);
  const [rusher24h, setRusher24h] = useState(null);
  const [showWorldSelect, setShowWorldSelect] = useState(false);

  // Busca e Seleção Rápida de Personagens
  const [quickSearch, setQuickSearch] = useState('');
  const [quickResults, setQuickResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = async (forceRefresh = false) => {
    if (!playerName) return;

    const cacheKey = (playerName || '').toLowerCase().trim();
    if (!forceRefresh) {
      const cached = playerDashboardCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL)) {
        setPlayerAvatar(cached.playerAvatar);
        setPlayerInfo(cached.playerInfo);
        setWorldRank(cached.worldRank);
        setGlobalRank(cached.globalRank);
        setGlobalPercentile(cached.globalPercentile);
        setRusher24h(cached.rusher24h);
        setDeaths(cached.deaths);
        setLevelHistory(cached.levelHistory);
        setHeatmap(cached.heatmap);
        setPrediction(cached.prediction);
        setTelemetry(cached.telemetry);
        setFrequentSquad(cached.frequentSquad);
        setRoutine(cached.routine);
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    try {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Execução paralela de todas as consultas para eliminar waterfalls
    const fetchProfileP = supabase
      .from('profiles')
      .select('avatar_url')
      .ilike('main_character', playerName)
      .maybeSingle();

    const fetchGMembersP = supabase
      .from('guild_members')
      .select('level, vocation, is_online')
      .ilike('name', playerName);

    const fetchCDataP = supabase
      .from('current_character_state')
      .select('xp_total, session_start_xp, level, vocation, last_active')
      .ilike('character_name', playerName)
      .maybeSingle();

    const fetchLoginP = supabase
      .from('login_events')
      .select('event_type, event_time')
      .ilike('character_name', playerName)
      .order('event_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Consulta única consolidada de 14 dias para sessões
    const fetchSessionsP = supabase
      .from('historical_sessions')
      .select('*')
      .ilike('character_name', playerName)
      .gte('session_end', fourteenDaysAgo)
      .order('session_end', { ascending: true });

    const fetchDeathsP = supabase
      .from('recent_deaths')
      .select('level, killed_by, death_time')
      .ilike('character_name', playerName)
      .gte('death_time', fourteenDaysAgo)
      .order('death_time', { ascending: false });

    const fetchGPerkP = supabase
      .from('guild_perk_members')
      .select('world, notes')
      .ilike('character_name', playerName)
      .maybeSingle();

    const fetchRushP = supabase
      .from('view_top_rushers_24h')
      .select('*')
      .ilike('name', playerName)
      .maybeSingle();

    const fetchSquadP = async () => {
      try {
        const { data } = await supabase
          .from('parties_planilhadas')
          .select('members')
          .limit(200);
        return data || [];
      } catch (e) {
        return [];
      }
    };

    const [
      profileRes,
      gMembersRes,
      cDataRes,
      loginRes,
      sessionsRes,
      deathsRes,
      gPerkRes,
      rushRes,
      squadData
    ] = await Promise.all([
      fetchProfileP,
      fetchGMembersP,
      fetchCDataP,
      fetchLoginP,
      fetchSessionsP,
      fetchDeathsP,
      fetchGPerkP,
      fetchRushP,
      fetchSquadP()
    ]);

    // Avatar customizado
    setPlayerAvatar(profileRes?.data?.avatar_url || null);

    // Dados de Membro
    const gMembers = gMembersRes?.data;
    let memberData = null;
    if (gMembers && gMembers.length > 0) {
      const validG = gMembers.find(g => g.level !== null && g.level !== undefined) || gMembers[0];
      if (validG && validG.level) memberData = validG;
    }

    const cData = cDataRes?.data;
    const lastLoginEvent = loginRes?.data;

    let isOnline = false;
    const nowMs = Date.now();
    const isRecentlyActive = cData?.last_active ? (() => {
      const activeDate = parseUtcDate(cData.last_active);
      if (!activeDate) return false;
      const diff = nowMs - activeDate.getTime();
      return diff >= 0 && diff < 20 * 60 * 1000;
    })() : false;

    if (lastLoginEvent) {
      if (lastLoginEvent.event_type === 'LOGOUT') {
        isOnline = false;
      } else if (lastLoginEvent.event_type === 'LOGIN') {
        const loginDate = parseUtcDate(lastLoginEvent.event_time);
        const loginDiff = loginDate ? (nowMs - loginDate.getTime()) : Infinity;
        isOnline = (loginDiff >= 0 && loginDiff < 24 * 60 * 60 * 1000) && (memberData ? Boolean(memberData.is_online) : isRecentlyActive);
      }
    } else {
      isOnline = memberData ? Boolean(memberData.is_online) : isRecentlyActive;
    }

    const rawVoc = cData?.vocation || memberData?.vocation;
    const finalVocation = formatVocation(rawVoc);
    const finalLevel = memberData?.level || cData?.level || null;

    setPlayerInfo({
      level: finalLevel,
      vocation: finalVocation,
      is_online: isOnline,
      guild_rank: memberData?.rank || null
    });

    // ─── Resolução de Mundo e Rankings ───
    let detWorld = gPerkRes?.data?.world || (initialWorld && initialWorld !== 'ALL' ? initialWorld : null);
    if (!detWorld && profileRes?.data?.makers) {
      for (const [wName, cName] of Object.entries(profileRes.data.makers)) {
        if (cName && typeof cName === 'string' && cName.toLowerCase().includes(playerName.toLowerCase())) {
          detWorld = wName;
          break;
        }
      }
    }
    if (!detWorld || detWorld === 'ALL') detWorld = 'Auroria';
    setSelectedWorld(detWorld);

    if (gPerkRes?.data?.notes && gPerkRes.data.notes.includes('rank:')) {
      setWorldRank(parseInt(gPerkRes.data.notes.replace('rank:', ''), 10));
    } else {
      setWorldRank(null);
    }

    if (finalLevel) {
      try {
        const { count: higherCount } = await supabase
          .from('current_character_state')
          .select('*', { count: 'exact', head: true })
          .gt('level', finalLevel);
        const gRank = (higherCount || 0) + 1;
        setGlobalRank(gRank);
        setGlobalPercentile(((gRank / 12365) * 100).toFixed(2));
        if (!gPerkRes?.data?.notes) {
          setWorldRank(Math.max(1, Math.round(gRank / 16)));
        }
      } catch (e) {}
    }

    setRusher24h(rushRes?.data || null);

    let currentXP = cData?.xp_total ? Number(cData.xp_total) : 0;
    let currentDelta = 0;
    if (cData?.xp_total && cData?.session_start_xp && Number(cData.xp_total) > Number(cData.session_start_xp)) {
      currentDelta = Number(cData.xp_total) - Number(cData.session_start_xp);
    }

    const boundsData = sessionsRes?.data || [];
    if (currentXP === 0 && boundsData.length > 0) {
      currentXP = Number(boundsData[boundsData.length - 1].end_xp_total || 0);
    }

    // Histórico de Mortes e Mudança de Level (com desduplicação defensiva)
    const deathsData = deathsRes?.data || [];
    setDeaths(deathsData);
    let lvlHist = [];
    const seenDeaths = new Set();
    deathsData.forEach(d => {
      const timeKey = d.death_time ? d.death_time.slice(0, 16) : '';
      const dupeKey = `${(d.killed_by || '').toLowerCase()}_${timeKey}`;
      if (seenDeaths.has(dupeKey)) return;
      seenDeaths.add(dupeKey);

      const fromLvl = Number(d.level) || 0;
      const toLvl = Math.max(1, fromLvl - 1);
      lvlHist.push({
        type: 'DOWN',
        from: fromLvl,
        to: toLvl,
        reason: d.killed_by || 'Desconhecido',
        date: d.death_time
      });
    });

    let prevLevel = null;
    boundsData.forEach(log => {
      if (prevLevel !== null && log.end_level && log.end_level !== prevLevel) {
        lvlHist.push({
          type: log.end_level > prevLevel ? 'UP' : 'DOWN',
          from: prevLevel,
          to: log.end_level,
          reason: null,
          date: log.session_end
        });
      }
      if (log.end_level) prevLevel = log.end_level;
    });

    lvlHist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setLevelHistory(lvlHist);

    // Heatmap (14 dias)
    const dailyMap = {};
    boundsData.forEach(log => {
      const d = parseUtcDate(log.session_start || log.session_end);
      const dayStr = toBrtDateStr(d);
      if (!dayStr) return;
      dailyMap[dayStr] = (dailyMap[dayStr] || 0) + (Number(log.xp_gained) || 0);
    });

    if (currentDelta > 0) {
      const todayStr = toBrtDateStr(new Date());
      dailyMap[todayStr] = (dailyMap[todayStr] || 0) + currentDelta;
    }

    const hData = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = toBrtDateStr(targetDate);
      const xpMade = dailyMap[dayStr] || 0;
      hData.push({ date: dayStr, xp: xpMade });
    }
    setHeatmap(hData);

    // Previsão de Up (14 dias)
    const totalXp14d = boundsData.reduce((acc, log) => acc + (Number(log.xp_gained) || 0), 0) + currentDelta;
    let daysSpan = 1;
    if (boundsData.length > 0) {
      const oldestTime = parseUtcDate(boundsData[0].session_start || boundsData[0].session_end).getTime();
      const msPassed = Date.now() - oldestTime;
      daysSpan = Math.min(14, Math.max(1, msPassed / (1000 * 60 * 60 * 24)));
    }

    const avgXpPerDay = totalXp14d > 0 ? Math.floor(totalXp14d / Math.max(1, daysSpan)) : 0;
    const currentLevel = memberData?.level || cData?.level || (boundsData.length > 0 ? boundsData[boundsData.length - 1].end_level : null);

    if (currentLevel) {
      let nextMilestone = Math.ceil((currentLevel + 1) / 100) * 100;
      if (nextMilestone <= currentLevel) nextMilestone = (Math.floor(currentLevel / 100) + 1) * 100;

      const getTibiaXPForLevel = (l) => Math.floor((50 / 3) * (Math.pow(l, 3) - 6 * Math.pow(l, 2) + 17 * l - 12));

      if (!currentXP || currentXP <= 0) {
        currentXP = getTibiaXPForLevel(currentLevel);
      }

      const xpRequiredForNext = Math.max(0, getTibiaXPForLevel(currentLevel + 1) - currentXP);
      const xpRequiredForMilestone = Math.max(0, getTibiaXPForLevel(nextMilestone) - currentXP);

      const daysToNext = avgXpPerDay > 0 ? (xpRequiredForNext / avgXpPerDay) : null;
      const daysToMilestone = avgXpPerDay > 0 ? (xpRequiredForMilestone / avgXpPerDay) : null;

      setPrediction({
        currentLevel,
        nextMilestone,
        avgXpPerDay,
        daysToNext: Number.isFinite(daysToNext) ? daysToNext : null,
        daysToMilestone: Number.isFinite(daysToMilestone) ? daysToMilestone : null
      });
    } else {
      setPrediction(null);
    }

    // Telemetria 48h (Filtrada em memória a partir de boundsData)
    const teleData = boundsData.filter(s => s.session_end && s.session_end >= fortyEightHoursAgo);
    if (teleData.length > 0) {
      let accumulatedXP = 0;
      const chartData = [];
      teleData.forEach(log => {
        const sStart = parseUtcDate(log.session_start || log.session_end);
        const sEnd = parseUtcDate(log.session_end);
        const xpGained = Number(log.xp_gained || 0);

        if (log.session_start && log.session_start !== log.session_end) {
          chartData.push({
            time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(sStart),
            xp: accumulatedXP,
            rawDelta: 0
          });
        }

        accumulatedXP += xpGained;
        chartData.push({
          time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(sEnd),
          xp: accumulatedXP,
          rawDelta: xpGained
        });
      });

      if (currentDelta > 0) {
        chartData.push({
          time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date()),
          xp: accumulatedXP + currentDelta,
          rawDelta: currentDelta
        });
      }
      setTelemetry(chartData);
    } else if (currentDelta > 0) {
      const now = new Date();
      const start = cData?.last_active ? parseUtcDate(cData.last_active) : new Date(now.getTime() - 30 * 60 * 1000);
      setTelemetry([
        {
          time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(start),
          xp: 0,
          rawDelta: 0
        },
        {
          time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(now),
          xp: currentDelta,
          rawDelta: currentDelta
        }
      ]);
    } else {
      setTelemetry([]);
    }

    // Panelinhas (Frequent Squad)
    if (squadData && squadData.length > 0) {
      const mates = {};
      const targetLower = playerName.toLowerCase().trim();
      squadData.forEach(p => {
        if (!p.members || !Array.isArray(p.members)) return;
        const inParty = p.members.some(m => m && m.toLowerCase().trim() === targetLower);
        if (inParty) {
          p.members.forEach(m => {
            if (m && m.toLowerCase().trim() !== targetLower) {
              mates[m] = (mates[m] || 0) + 1;
            }
          });
        }
      });
      const rankedMates = Object.entries(mates)
        .sort((a,b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))
        .slice(0, 3);
      setFrequentSquad(rankedMates);
    }

    // Rotina horária dos últimos 7 dias (Filtrada em memória a partir de boundsData)
    const logs7d = boundsData.filter(s => s.session_end && s.session_end >= sevenDaysAgo);
    const hourMap = new Array(24).fill(0);
    if (logs7d.length > 0) {
      logs7d.forEach(l => {
        let xp = Number(l.xp_gained || 0);
        if (!xp || xp <= 0) return;

        const sStart = parseUtcDate(l.session_start || l.session_end);
        const sEnd = parseUtcDate(l.session_end);

        const getBrtH = (d) => {
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            hour: 'numeric',
            hour12: false
          }).formatToParts(d);
          const p = parts.find(x => x.type === 'hour');
          return parseInt(p ? p.value : d.getHours(), 10) % 24;
        };

        const startH = getBrtH(sStart);
        const endH = getBrtH(sEnd);

        const activeHours = [];
        if (startH <= endH) {
          for (let h = startH; h <= endH; h++) activeHours.push(h);
        } else {
          for (let h = startH; h < 24; h++) activeHours.push(h);
          for (let h = 0; h <= endH; h++) activeHours.push(h);
        }

        if (activeHours.length === 0) activeHours.push(endH);
        const perHourXp = Math.round(xp / activeHours.length);
        activeHours.forEach(h => {
          hourMap[h] += perHourXp;
        });
      });
    }

    const routineData = hourMap.map((xp, index) => ({
      hour: `${index.toString().padStart(2, '0')}:00`,
      xp: xp
    }));
    setRoutine(routineData);

    // Salva no cache do dashboard (0ms para navegação posterior)
    playerDashboardCache.set(cacheKey, {
      timestamp: Date.now(),
      playerAvatar: profileRes?.data?.avatar_url || null,
      playerInfo: {
        level: finalLevel,
        vocation: finalVocation,
        is_online: isOnline,
        world: cData?.world || gPerkRes?.data?.world || 'Auroria',
        guild: memberData ? 'Shellpatrocina / Battlestorm' : null,
        guild_rank: memberData?.rank || null,
        last_active: cData?.last_active || null,
        xp_total: currentXP,
        xp_today: currentDelta
      },
      worldRank: !gPerkRes?.data?.notes && finalLevel ? Math.max(1, Math.round(((higherCount || 0) + 1) / 16)) : null,
      globalRank: finalLevel ? ((higherCount || 0) + 1) : null,
      globalPercentile: finalLevel ? (((higherCount || 0) + 1) / 12365 * 100).toFixed(2) : null,
      rusher24h: rushRes?.data || null,
      deaths: deathsData,
      levelHistory: lvlHist,
      heatmap: hData,
      prediction: currentLevel ? {
        currentLevel,
        nextMilestone,
        avgXpPerDay,
        daysToNext: Number.isFinite(daysToNext) ? daysToNext : null,
        daysToMilestone: Number.isFinite(daysToMilestone) ? daysToMilestone : null
      } : null,
      telemetry: chartData || [],
      frequentSquad: rankedMates || [],
      routine: routineData
    });

    if (playerDashboardCache.size > 50) {
      const oldestKey = playerDashboardCache.keys().next().value;
      playerDashboardCache.delete(oldestKey);
    }
  } catch (err) {
    console.error('Erro ao buscar dados do jogador:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [playerName]);

  const handleFindMakers = async () => {
    setShowMakerModal(true);
    setMakersLoading(true);
    const discovered = [];

    try {
      // 1. Tenta RPC nativo se existir
      try {
        const { data: rpcData } = await supabase.rpc('find_makers', { p_character_name: playerName });
        if (rpcData && Array.isArray(rpcData)) {
          rpcData.forEach(r => {
            discovered.push({
              candidate_name: r.candidate_name,
              matches: `${r.matches || 3}x Cruzamentos`,
              confidence: '85% (Telemetria)',
              world: r.world || 'Global',
              type: 'Sincronia de Sessão',
              last_match: r.last_match || new Date().toISOString()
            });
          });
        }
      } catch (rpcErr) {}

      // 2. Busca no cadastro oficial de makers em 'profiles'
      const { data: profDirect } = await supabase
        .from('profiles')
        .select('main_character, makers, created_at')
        .ilike('main_character', playerName)
        .maybeSingle();

      if (profDirect && profDirect.makers && typeof profDirect.makers === 'object') {
        Object.entries(profDirect.makers).forEach(([wName, mNames]) => {
          if (mNames && typeof mNames === 'string') {
            const list = mNames.split(',').map(s => s.trim()).filter(Boolean);
            list.forEach(m => {
              if (m.toLowerCase() !== playerName.toLowerCase()) {
                discovered.push({
                  candidate_name: m,
                  matches: 'Vínculo Direto',
                  confidence: '98% (Perfil Confirmado)',
                  world: wName,
                  type: 'Maker Cadastrado',
                  last_match: profDirect.created_at || new Date().toISOString()
                });
              }
            });
          }
        });
      }

      // 3. Busca reversa: alguém que declarou este player como maker
      const { data: profReverse } = await supabase
        .from('profiles')
        .select('main_character, makers, created_at');

      if (profReverse) {
        profReverse.forEach(p => {
          if (p.main_character && p.main_character.toLowerCase() !== playerName.toLowerCase() && p.makers) {
            const makersStr = JSON.stringify(p.makers).toLowerCase();
            if (makersStr.includes(playerName.toLowerCase())) {
              discovered.push({
                candidate_name: p.main_character,
                matches: 'Conta Principal (Main)',
                confidence: '96% (Vínculo Reverso)',
                world: 'Global',
                type: 'Conta Mestre',
                last_match: p.created_at || new Date().toISOString()
              });
            }
          }
        });
      }

      // 4. Cruzamento em recent_deaths: clusters de mortes no mesmo minuto com o mesmo killer
      const { data: myDeaths } = await supabase
        .from('recent_deaths')
        .select('death_time, killed_by, level')
        .ilike('character_name', playerName)
        .limit(10);

      if (myDeaths && myDeaths.length > 0) {
        for (const md of myDeaths.slice(0, 4)) {
          if (md.death_time && md.killed_by) {
            const timeWindowMin = new Date(new Date(md.death_time).getTime() - 2 * 60 * 1000).toISOString();
            const timeWindowMax = new Date(new Date(md.death_time).getTime() + 2 * 60 * 1000).toISOString();

            const { data: clusterDeaths } = await supabase
              .from('recent_deaths')
              .select('character_name, level, death_time')
              .gte('death_time', timeWindowMin)
              .lte('death_time', timeWindowMax)
              .eq('killed_by', md.killed_by);

            if (clusterDeaths) {
              clusterDeaths.forEach(cd => {
                if (cd.character_name && cd.character_name.toLowerCase() !== playerName.toLowerCase()) {
                  if (!discovered.some(d => d.candidate_name.toLowerCase() === cd.character_name.toLowerCase())) {
                    discovered.push({
                      candidate_name: cd.character_name,
                      matches: `Mortos juntos por ${md.killed_by}`,
                      confidence: '82% (Cluster de War)',
                      world: 'Combat Feed',
                      type: 'Maker de Warmode / Squad',
                      last_match: cd.death_time
                    });
                  }
                }
              });
            }
          }
        }
      }

      setMakersData(discovered);
    } catch (e) {
      console.error(e);
    }
    setMakersLoading(false);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!quickSearch.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('current_character_state')
        .select('character_name, level, vocation')
        .ilike('character_name', `%${quickSearch.trim()}%`)
        .limit(8);
      setQuickResults(data || []);
      if (data && data.length === 1 && onSelectPlayer) {
        onSelectPlayer(data[0].character_name);
        setQuickResults([]);
        setQuickSearch('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!playerName) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-fade-in text-center">
        <div className="bg-black/80 border-2 border-yellow-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto mb-4">
            <Search size={32} />
          </div>
          <h2 className="text-3xl font-medieval text-gradient-gold mb-2">Investigação Global de Jogador</h2>
          <p className="text-gray-300 text-sm font-sans mb-6 max-w-lg mx-auto">
            Pesquise qualquer personagem rastreado no Rubinot para visualizar em tempo real a curva de XP, sessões de caça, históricos de morte e horários de atividade.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto mb-6">
            <input 
              type="text"
              value={quickSearch}
              onChange={(e) => {
                setQuickSearch(e.target.value);
                if (!e.target.value) setQuickResults([]);
              }}
              placeholder="Digite o nome do personagem..."
              className="w-full bg-black/90 border border-yellow-500/40 rounded-xl px-4 py-3 pl-11 text-white text-sm focus:outline-none focus:border-yellow-400 shadow-inner"
            />
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <button 
              type="submit"
              disabled={isSearching || !quickSearch.trim()}
              className="absolute right-2 top-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {quickResults.length > 0 && (
            <div className="max-w-md mx-auto bg-black/95 border border-yellow-500/30 rounded-xl divide-y divide-white/5 text-left overflow-hidden shadow-2xl">
              {quickResults.map((r, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    if (onSelectPlayer) onSelectPlayer(r.character_name);
                    setQuickResults([]);
                    setQuickSearch('');
                  }}
                  className="p-3 hover:bg-yellow-950/30 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-white text-sm">{r.character_name}</span>
                  <span className="text-xs text-gray-400">{r.vocation} • Lvl {r.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeWorldObj = WORLDS_LIST.find(w => w.id.toLowerCase() === selectedWorld.toLowerCase()) || WORLDS_LIST[1];

  const handleWorldChange = async (wId) => {
    setSelectedWorld(wId);
    setShowWorldSelect(false);
    if (globalRank) {
      setWorldRank(Math.max(1, Math.round(globalRank / 16)));
    }
    try {
      await supabase.from('guild_perk_members').upsert({
        character_name: playerName,
        world: wId
      }, { onConflict: 'character_name' });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa Rápida Superior & Botão Voltar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/60 border border-tibia-border rounded-xl p-3 px-4 shadow-lg">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Voltar à tela anterior"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          )}
          <div className="text-xs text-gray-400">
            Investigando personagem: <strong className="text-white">{playerName}</strong>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input 
            type="text"
            value={quickSearch}
            onChange={(e) => {
              setQuickSearch(e.target.value);
              if (!e.target.value) setQuickResults([]);
            }}
            placeholder="Trocar de jogador..."
            className="w-full bg-black/80 border border-white/15 rounded-lg px-3 py-1.5 pl-8 text-xs text-white focus:outline-none focus:border-yellow-500"
          />
          <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
          {quickResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-black/95 border border-yellow-500/40 rounded-lg shadow-2xl divide-y divide-white/5 max-h-60 overflow-y-auto">
              {quickResults.map((r, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    if (onSelectPlayer) onSelectPlayer(r.character_name);
                    setQuickResults([]);
                    setQuickSearch('');
                  }}
                  className="p-2 hover:bg-yellow-950/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <span className="font-bold text-white">{r.character_name}</span>
                  <span className="text-gray-400">{r.vocation} • Lvl {r.level}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
      
      {/* Player Header */}
      <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl flex flex-col md:flex-row justify-between items-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Activity size={100} />
        </div>
        
        <div className="flex items-center mb-4 md:mb-0 z-10">
          <div className="mr-5 shrink-0">
            <img 
              src={playerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=111&color=eab308`} 
              alt={playerName} 
              className="w-16 h-16 rounded-full object-cover bg-black/60 border-2 border-tibia-highlight shadow-lg"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=111&color=eab308`; }}
            />
          </div>
          <div className="mr-6">
            <h3 className="text-3xl font-black text-white">{playerName}</h3>
            {playerInfo && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="bg-blue-900/50 text-blue-400 px-3 py-1 rounded text-sm font-bold border border-blue-500/30">
                  Lvl {playerInfo.level}
                </span>
                <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm border border-gray-600 font-medium">
                  {playerInfo.vocation}
                </span>
                {playerInfo.is_online ? (
                  <span className="flex items-center text-green-400 font-bold text-sm bg-green-900/20 px-3 py-1 rounded border border-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Online
                  </span>
                ) : (
                  <span className="flex items-center text-gray-500 font-medium text-sm bg-gray-900/50 px-3 py-1 rounded border border-gray-700">
                    <span className="w-2 h-2 rounded-full bg-gray-600 mr-2"></span> Offline
                  </span>
                )}

                {/* Seletor de Mundo do Jogador */}
                <div className="relative">
                  <button
                    onClick={() => setShowWorldSelect(!showWorldSelect)}
                    className="bg-yellow-950/60 hover:bg-yellow-900/60 border border-yellow-500/40 text-yellow-300 px-3 py-1 rounded text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Clique para alternar o servidor"
                  >
                    <span>{activeWorldObj?.icon || '🌐'}</span>
                    <span>{activeWorldObj?.name || selectedWorld}</span>
                    <span className="text-[10px] text-gray-400 font-normal">({activeWorldObj?.type})</span>
                    <ChevronDown size={14} />
                  </button>
                  {showWorldSelect && (
                    <div className="absolute left-0 top-full mt-1 w-56 max-h-56 overflow-y-auto bg-stone-950 border border-yellow-500/40 rounded-xl shadow-2xl z-50 divide-y divide-white/5 custom-scrollbar">
                      {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
                        <div
                          key={w.id}
                          onClick={() => handleWorldChange(w.id)}
                          className={`p-2.5 px-3 flex items-center justify-between text-xs cursor-pointer ${
                            w.id.toLowerCase() === selectedWorld.toLowerCase() ? 'bg-yellow-950/80 text-yellow-300 font-bold' : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{w.icon}</span> {w.name}
                          </span>
                          <span className="text-[10px] text-gray-400">{w.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <a
            href={`https://rubinot.com.br/characters/${encodeURIComponent(playerName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto py-3 px-5 bg-stone-800 hover:bg-stone-700 border border-white/10 hover:border-yellow-500/40 text-stone-200 hover:text-yellow-300 font-bold text-sm rounded flex items-center justify-center transition-colors"
          >
            <ExternalLink className="mr-2" size={16} />
            Rubinot Oficial ↗
          </a>

          <button 
            onClick={handleFindMakers}
            className="w-full md:w-auto py-3 px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded flex items-center justify-center transition-colors shadow-tibia-glow"
          >
            <Search className="mr-2" size={18} />
            Descobrir Makers
          </button>
        </div>
      </div>

      {/* Cards de Rankings e Telemetria do Mundo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ranking no Mundo */}
        <div className="bg-gradient-to-b from-stone-900 to-black p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-yellow-400/90 uppercase tracking-wider">Ranking no Mundo</p>
            <p className="text-3xl font-black text-white mt-1">
              {worldRank ? `#${worldRank}` : 'Top 100'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Servidor {activeWorldObj?.name}</p>
          </div>
          <Shield className="text-yellow-400 opacity-60" size={36} />
        </div>

        {/* Ranking Global */}
        <div className="bg-gradient-to-b from-yellow-950/30 to-black p-4 rounded-xl border-2 border-yellow-500/50 flex items-center justify-between shadow-xl shadow-yellow-500/5">
          <div>
            <p className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> Ranking Global
            </p>
            <p className="text-3xl font-black text-yellow-300 mt-1">
              {globalRank ? `#${globalRank}` : 'Top Geral'}
            </p>
            <p className="text-[11px] text-yellow-400/70 mt-0.5 font-mono">
              {globalPercentile ? `Top ${globalPercentile}% no Rubinot` : 'Entre 12.365+ players'}
            </p>
          </div>
          <Trophy className="text-yellow-400 opacity-80" size={36} />
        </div>

        {/* Top Rusher 24h */}
        <div className="bg-gradient-to-b from-stone-900 to-black p-4 rounded-xl border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Rush 24 Horas</p>
            <p className="text-2xl font-black text-amber-300 mt-1">
              {rusher24h ? `+${(rusher24h.exp_gained / 1000000).toFixed(1)}M XP` : '0 XP'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {rusher24h ? 'Top Rusher ativo hoje' : 'Sem rush recente'}
            </p>
          </div>
          <Flame className="text-amber-400 opacity-70" size={36} />
        </div>
      </div>

      {/* Cards de Topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Baixas Recentes Card */}
        <div className="bg-tibia-card p-4 rounded-lg border border-red-900/30 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Baixas Recentes (14d)</p>
            <p className="text-3xl font-bold text-red-400">{deaths.length} <span className="text-xs text-gray-400 font-normal">mortes</span></p>
          </div>
          <Skull className="text-red-400 opacity-60" size={32} />
        </div>

        {/* Panelinhas Card */}
        <div className="bg-tibia-card p-4 rounded-lg border border-blue-900/50 flex items-center justify-between col-span-1">
          <div className="w-full">
            <p className="text-sm text-gray-400 mb-2 font-bold">Squad Frequente ("Panelinha")</p>
            {frequentSquad.length > 0 ? (
              <ul className="text-xs space-y-1">
                {frequentSquad.map(s => (
                  <li key={s.name} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                    <span className="text-gray-300">{s.name}</span>
                    <span className="text-blue-400 font-bold">{s.count} hunts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">Lobo solitário (Nenhuma party frequente)</p>
            )}
          </div>
        </div>

        {/* Level History Card */}
        <div className="bg-tibia-card p-4 rounded-lg border border-yellow-900/50 flex items-center justify-between col-span-1">
          <div className="w-full">
            <p className="text-sm text-gray-400 mb-2 font-bold">Histórico de Nível e Mortes (14 dias)</p>
            {levelHistory.length > 0 ? (
              <ul className="text-xs space-y-1 max-h-24 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                {levelHistory.map((h, idx) => (
                  <li key={idx} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                    <span className="text-gray-400">{format(parseUtcDate(h.date), "dd/MM HH:mm")}</span>
                    {h.type === 'UP' ? (
                      <span className="text-green-400 font-bold">Lvl {h.from} &rarr; {h.to}</span>
                    ) : (
                      <span className="text-red-500 font-bold truncate max-w-[180px]" title={h.reason ? `Morto por: ${h.reason}` : 'Morte'}>
                        Lvl {h.from} &rarr; {h.to} ({h.reason || 'Morte'})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500 italic">Nenhuma mudança de level ou morte registrada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Máquina do Tempo (Previsão) */}
      {prediction && (
        <div className="bg-tibia-card p-4 rounded-lg border border-purple-900/50 flex flex-col md:flex-row items-center justify-between shadow-xl mt-8">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-purple-900/30 p-3 rounded-full mr-4 border border-purple-500/50">
              <Clock className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400 font-bold mb-1">A Máquina do Tempo (Previsão de Level)</p>
              <p className="text-xs text-gray-500">
                Baseado na média de <span className="text-purple-400 font-bold">{Number.isFinite(prediction.avgXpPerDay) ? (prediction.avgXpPerDay / 1000000).toFixed(1) : '0.0'}M XP/dia</span> (últimos 14 dias)
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-center bg-black/40 px-4 py-2 rounded border border-white/5 min-w-[120px]">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Level {prediction.currentLevel + 1}</p>
              <p className="text-lg font-bold text-white">
                {prediction.daysToNext !== null ? (
                  prediction.daysToNext < 1 ? 'Em horas!' : `~${Math.ceil(prediction.daysToNext)} dias`
                ) : 'Hibernando'}
              </p>
            </div>
            <div className="text-center bg-purple-900/10 px-4 py-2 rounded border border-purple-900/30 min-w-[120px]">
              <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1">Milestone {prediction.nextMilestone}</p>
              <p className="text-lg font-bold text-purple-300">
                {prediction.daysToMilestone !== null ? `~${Math.ceil(prediction.daysToMilestone)} dias` : 'Estagnado'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendário do Vício (Heatmap) */}
      {heatmap.length > 0 && (
        <div className="bg-tibia-card p-6 rounded-lg border border-green-900/50 shadow-xl mt-8">
          <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center">
            <Activity className="mr-2" size={24} />
            Calendário do Vício (Últimos 14 dias)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Dias com maior intensidade de caça ganham cores mais vivas.</p>
          
          <div className="flex flex-wrap gap-2">
            {heatmap.map((day) => {
              const d = new Date(day.date + 'T12:00:00Z');
              const rawDay = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).replace('.', '');
              const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
              
              let bgColor = 'bg-gray-800 border-gray-700';
              if (day.xp > 100000000) bgColor = 'bg-green-400 border-green-300 shadow-[0_0_10px_rgba(74,222,128,0.5)]'; // > 100M
              else if (day.xp > 50000000) bgColor = 'bg-green-600 border-green-500'; // > 50M
              else if (day.xp > 10000000) bgColor = 'bg-green-800 border-green-700'; // > 10M
              else if (day.xp > 0) bgColor = 'bg-green-900 border-green-800'; // > 0
              
              return (
                <div key={day.date} className="flex flex-col items-center group relative cursor-help">
                  <div className={`w-8 h-8 rounded border ${bgColor} transition-transform transform hover:scale-110 mb-1`}></div>
                  <span className="text-[10px] text-gray-500">{dayName}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none shadow-lg">
                    {day.date}: {day.xp > 0 ? `+${(day.xp / 1000000).toFixed(1)}M XP` : '0 XP'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Radar de Rotina (Horários Ativos) */}
      {routine.length > 0 && (
        <div className="bg-tibia-card p-6 rounded-lg border border-blue-900/50 shadow-xl mt-8">
          <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
            <Clock className="mr-2" size={24} />
            Radar de Rotina (Horário Ativo)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Distribuição da XP gerada por horário do dia (Últimos 7 dias).</p>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routine} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value) => [`${(value / 1000000).toFixed(1)}M XP`, 'Gerado']}
                  labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                />
                <Bar dataKey="xp" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* Gráfico de XP */}
      <div className="bg-tibia-card p-6 rounded-lg border border-tibia-border">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center">
          <Activity className="mr-2 text-tibia-primary" /> Sessões de Caça (Últimas 48h)
        </h3>
        {loading ? (
          <div className="h-64 flex justify-center items-center text-gray-500">Carregando telemetria...</div>
        ) : telemetry.length === 0 ? (
          <div className="h-64 flex justify-center items-center text-gray-500">Sem atividade registrada nas últimas 48h.</div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(val) => val >= 1000000 ? (val/1000000).toFixed(1)+'M' : val} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [value >= 1000000 ? (value/1000000).toFixed(2)+'M' : value, 'XP Acumulada']}
                />
                <Legend />
                <Line type="monotone" dataKey="xp" name="Curva de XP" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* MODAL DETETIVE DE MAKERS PRO */}
      {showMakerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-tibia-card border-2 border-purple-600/60 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative flex flex-col gap-4">
            <button 
              onClick={() => setShowMakerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="border-b border-purple-900/40 pb-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/15 px-3 py-1 text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2">
                <Sparkles size={13} className="text-purple-400" />
                Inteligência Tática de Guerra
              </div>
              <h3 className="text-2xl font-medieval text-purple-300 flex items-center gap-2">
                <Search className="text-purple-400" size={22} />
                Dossiê Investigativo Pro & Descoberta de Makers
              </h3>
              <p className="text-gray-300 text-xs mt-1">
                Cruzamento algorítmico de telemetria, vínculos de perfil e clusters de combate para: <strong className="text-yellow-400">{playerName}</strong>
              </p>
            </div>
            
            {makersLoading ? (
              <div className="py-12 text-center text-purple-400 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-xs font-mono animate-pulse">Cruzando telemetria de mortes, sessões e perfis de guerra...</p>
              </div>
            ) : makersData.length === 0 ? (
              <div className="py-10 text-center text-gray-500 bg-black/40 border border-dashed border-white/10 rounded-xl p-6">
                <p className="text-sm font-bold text-gray-400">Nenhum maker suspeito detectado para este personagem.</p>
                <p className="text-xs mt-1 text-gray-500">O guerreiro opera isolado ou seus logins ainda não formaram clusters de telemetria.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
                {makersData.map((m, i) => (
                  <div 
                    key={i} 
                    className="p-3 bg-black/60 border border-purple-500/20 hover:border-purple-500/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm hover:text-purple-300">{m.candidate_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-300 border border-purple-500/30">
                          {m.type || 'Maker'}
                        </span>
                        {m.world && (
                          <span className="text-[10px] text-gray-400 font-mono">({m.world})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Motivo: <strong className="text-gray-200">{m.matches}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-green-400 font-bold bg-green-950/40 px-2 py-1 rounded-md border border-green-500/30">
                        {m.confidence}
                      </span>
                      <button
                        onClick={() => {
                          setShowMakerModal(false);
                          if (onSelectPlayer) onSelectPlayer(m.candidate_name);
                        }}
                        className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/60 border border-purple-400 text-purple-200 text-xs font-bold rounded-lg transition-all"
                      >
                        Investigar ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
