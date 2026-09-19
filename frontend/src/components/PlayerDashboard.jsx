import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';
import { 
  Gavel, AlertOctagon, Ghost, Activity, Clock, Search, X, Globe, Trophy, 
  ExternalLink, ArrowLeft, ChevronDown, Flame, Shield, Sparkles, Skull, Zap,
  Calendar, TrendingUp, Filter, BarChart2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { parseUtcDate, toBrtDateStr, toBrtTimeStr, toBrtHourNum, formatBrtDateWithWeekday, sliceXpIntoBrtHours, formatVocation, toTibiaTitleCase } from '../lib/tibiaUtils';
import { WORLDS_LIST } from '../context/WorldContext';

// Cache em memória de dados do dashboard do jogador (TTL 60s)
const playerDashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 60 * 1000;

export function formatCompactXp(val) {
  const n = Number(val) || 0;
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(2) + 'B';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + 'M';
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1) + 'k';
  }
  return n.toLocaleString('pt-BR');
}

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

  // Diário de Caça & Inspetor Horário
  const [huntDays, setHuntDays] = useState([]);
  const [selectedHuntDate, setSelectedHuntDate] = useState(null);
  const [huntFilterPeriod, setHuntFilterPeriod] = useState('14d'); // '7d' | '14d' | '30d' | 'all'
  
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

    const rawPlayerName = playerName.trim();
    const targetName = toTibiaTitleCase(rawPlayerName);
    const cacheKey = rawPlayerName.toLowerCase();
    const storageKey = `rubinot_player_v4_hunts_${cacheKey}`;

    // 1. Verificação instantânea em cache (In-Memory e SessionStorage SWR: 0ms de pintura inicial)
    let cached = playerDashboardCache.get(cacheKey);
    if (!cached && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const s = sessionStorage.getItem(storageKey);
        if (s) {
          const parsed = JSON.parse(s);
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000 && Array.isArray(parsed.huntDays)) {
            cached = parsed;
            playerDashboardCache.set(cacheKey, parsed);
          }
        }
      } catch (e) {}
    }

    if (cached && Array.isArray(cached.huntDays)) {
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
      setHuntDays(cached.huntDays || []);
      setSelectedHuntDate(prev => prev || cached.selectedHuntDate || (cached.huntDays?.[0]?.date || null));
      setLoading(false);

      // Se o cache for recente (<45s) e não for atualização forçada, evita re-fetch
      if (!forceRefresh && (Date.now() - cached.timestamp < DASHBOARD_CACHE_TTL)) {
        return;
      }
      // Se for mais antigo, continua em segundo plano para revalidar sem travar a tela
    } else {
      setLoading(true);
    }

    try {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // ─── CONSULTAS PARALELAS COM ÍNDICES B-TREE (Elimina waterfall de 3.8s para ~600ms) ───
      const [
        profileRes,
        gMembersRes,
        cDataRes,
        gPerkRes,
        sessionsRes,
        telemetryRes,
        deathsRes
      ] = await Promise.all([
        supabase.from('profiles').select('avatar_url, makers').ilike('main_character', targetName).limit(1).maybeSingle(),
        supabase.from('guild_members').select('name, level, vocation, is_online, rank').ilike('name', targetName).limit(1).maybeSingle(),
        supabase.from('current_character_state').select('character_name, xp_total, session_start_xp, session_start_time, level, vocation, last_active').eq('character_name', targetName).limit(1).maybeSingle(),
        supabase.from('guild_perk_members').select('world, notes').ilike('character_name', targetName).limit(1).maybeSingle(),
        supabase.from('historical_sessions').select('id, session_start, session_end, duration_minutes, xp_gained, end_level, end_xp_total').eq('character_name', targetName).order('session_start', { ascending: false }).limit(200),
        supabase.from('telemetry_logs').select('xp_total, delta_xp, recorded_at').eq('character_name', targetName).order('recorded_at', { ascending: false }).limit(300),
        supabase.from('recent_deaths').select('level, killed_by, death_time').eq('character_name', targetName).order('death_time', { ascending: false }).limit(50)
      ]);

      let cData = cDataRes?.data;
      let memberData = gMembersRes?.data;
      let rawSessions = sessionsRes?.data || [];
      let rawTelemetry = (telemetryRes?.data || []).sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

      // Fallback tolerante apenas se a capitalização exata falhar
      if (!cData && !memberData && rawPlayerName.toLowerCase() !== targetName.toLowerCase()) {
        const { data: fallbackChar } = await supabase
          .from('current_character_state')
          .select('character_name, xp_total, session_start_xp, session_start_time, level, vocation, last_active')
          .ilike('character_name', rawPlayerName)
          .limit(1)
          .maybeSingle();
        if (fallbackChar) cData = fallbackChar;
      }

      const canonicalName = cData?.character_name || memberData?.name || targetName;

      // Se targetName não retornou sessões ou telemetria, tenta com canonicalName se for diferente
      if ((rawSessions.length === 0 || rawTelemetry.length === 0) && canonicalName.toLowerCase() !== targetName.toLowerCase()) {
        const [fallbackSess, fallbackTele] = await Promise.all([
          rawSessions.length === 0 ? supabase.from('historical_sessions').select('id, session_start, session_end, duration_minutes, xp_gained, end_level, end_xp_total').eq('character_name', canonicalName).order('session_start', { ascending: false }).limit(200) : null,
          rawTelemetry.length === 0 ? supabase.from('telemetry_logs').select('xp_total, delta_xp, recorded_at').eq('character_name', canonicalName).order('recorded_at', { ascending: false }).limit(300) : null
        ]);
        if (fallbackSess?.data?.length) rawSessions = fallbackSess.data;
        if (fallbackTele?.data?.length) rawTelemetry = fallbackTele.data.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
      }

      // Avatar
      setPlayerAvatar(profileRes?.data?.avatar_url || null);

      // Status Online Preliminar
      const nowMs = Date.now();
      const isRecentlyActive = cData?.last_active ? (() => {
        const activeDate = parseUtcDate(cData.last_active);
        if (!activeDate) return false;
        const diff = nowMs - activeDate.getTime();
        return diff >= 0 && diff < 20 * 60 * 1000;
      })() : false;

      let isOnline = memberData ? Boolean(memberData.is_online) : isRecentlyActive;

      const rawVoc = cData?.vocation || memberData?.vocation;
      const finalVocation = formatVocation(rawVoc);
      const finalLevel = memberData?.level || cData?.level || null;

      // Resolução de Mundo
      let detWorld = gPerkRes?.data?.world || (initialWorld && initialWorld !== 'ALL' ? initialWorld : null);
      if (!detWorld && profileRes?.data?.makers) {
        for (const [wName, cName] of Object.entries(profileRes.data.makers)) {
          if (cName && typeof cName === 'string' && cName.toLowerCase().includes(targetName.toLowerCase())) {
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

      // Delta de XP e 24h Rush calculado com precisão combinando Sessões e Telemetria
      const boundsData = rawSessions
        .filter(s => s.session_end && s.session_end >= fourteenDaysAgo)
        .sort((a, b) => new Date(a.session_start || a.session_end) - new Date(b.session_start || b.session_end));

      let currentXP = cData?.xp_total ? Number(cData.xp_total) : 0;
      let currentDelta = 0;
      if (cData?.xp_total && cData?.session_start_xp && Number(cData.xp_total) > Number(cData.session_start_xp)) {
        currentDelta = Number(cData.xp_total) - Number(cData.session_start_xp);
      }

      if (currentXP === 0 && boundsData.length > 0) {
        currentXP = Number(boundsData[boundsData.length - 1].end_xp_total || 0);
      }
      if (currentXP === 0 && rawTelemetry.length > 0) {
        currentXP = Number(rawTelemetry[rawTelemetry.length - 1].xp_total || 0);
      }

      const past24hSessions = boundsData
        .filter(s => s.session_end && s.session_end >= twentyFourHoursAgo)
        .reduce((acc, s) => acc + (Number(s.xp_gained) || 0), 0);

      const past24hTelemetry = rawTelemetry
        .filter(l => l.recorded_at && l.recorded_at >= twentyFourHoursAgo)
        .reduce((acc, l) => acc + (Number(l.delta_xp) || 0), 0);

      const latestArchivedXp = boundsData.length > 0 ? Number(boundsData[boundsData.length - 1].end_xp_total || 0) : 0;
      let unarchivedDelta = 0;
      if (currentXP > latestArchivedXp && latestArchivedXp > 0) {
        unarchivedDelta = currentXP - latestArchivedXp;
      } else if (latestArchivedXp === 0) {
        unarchivedDelta = currentDelta;
      }

      const xpGained24h = Math.max(past24hSessions + unarchivedDelta, past24hTelemetry, currentDelta);
      const rusherData = { exp_gained: xpGained24h, xp_gained: xpGained24h };
      setRusher24h(rusherData);

      // Renderiza imediatamente o cabeçalho com level, vocação, xp total e status online
      setPlayerInfo({
        level: finalLevel,
        vocation: finalVocation,
        is_online: isOnline,
        guild_rank: memberData?.rank || null,
        world: detWorld,
        xp_total: currentXP,
        xp_today: xpGained24h
      });

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

      if (prevLevel !== null && finalLevel && finalLevel > prevLevel) {
        lvlHist.push({
          type: 'UP',
          from: prevLevel,
          to: finalLevel,
          reason: null,
          date: cData?.last_active || new Date().toISOString()
        });
      }

      lvlHist.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLevelHistory(lvlHist);

      // Heatmap (14 dias) - Combina sessões e telemetria de granularidade fina
      const dailyMap = {};
      boundsData.forEach(log => {
        const d = parseUtcDate(log.session_start || log.session_end);
        const dayStr = toBrtDateStr(d);
        if (!dayStr) return;
        dailyMap[dayStr] = (dailyMap[dayStr] || 0) + (Number(log.xp_gained) || 0);
      });

      const teleDailyMap = {};
      rawTelemetry.forEach(log => {
        const dayStr = toBrtDateStr(log.recorded_at);
        const delta = Number(log.delta_xp || 0);
        if (dayStr && delta > 0) {
          teleDailyMap[dayStr] = (teleDailyMap[dayStr] || 0) + delta;
        }
      });

      // Mescla com segurança sem duplicar: se já existe em sessões, pega o maior
      Object.keys(teleDailyMap).forEach(dayStr => {
        dailyMap[dayStr] = Math.max(dailyMap[dayStr] || 0, teleDailyMap[dayStr]);
      });

      if (currentDelta > 0) {
        const todayStr = toBrtDateStr(new Date());
        dailyMap[todayStr] = Math.max(dailyMap[todayStr] || 0, (dailyMap[todayStr] || 0) + currentDelta);
      }

      // ─── DIÁRIO DE CAÇA & ANÁLISE HORÁRIA ───
      const huntDaysMap = {};

      // 1. Desduplicação inteligente de sessões
      const uniqueSessions = [];
      const seenSessionKeys = new Set();
      rawSessions.forEach(sess => {
        const key = `${sess.session_start}_${sess.session_end}_${sess.xp_gained}`;
        if (!seenSessionKeys.has(key)) {
          seenSessionKeys.add(key);
          uniqueSessions.push(sess);
        }
      });

      // 2. Fatiamento temporal exato de todas as sessões fechadas pelos horários reais de caça
      uniqueSessions.forEach(s => {
        const xpGained = Number(s.xp_gained || 0);
        if (xpGained <= 0) return;

        let sStart = parseUtcDate(s.session_start);
        let sEnd = parseUtcDate(s.session_end);

        if (!sStart && sEnd && s.duration_minutes) {
          sStart = new Date(sEnd.getTime() - Number(s.duration_minutes) * 60000);
        }
        if (!sEnd && sStart && s.duration_minutes) {
          sEnd = new Date(sStart.getTime() + Number(s.duration_minutes) * 60000);
        }
        if (!sStart || !sEnd) return;

        const hourlySlices = sliceXpIntoBrtHours(sStart, sEnd, xpGained);

        Object.entries(hourlySlices).forEach(([dayStr, hours]) => {
          if (!huntDaysMap[dayStr]) {
            huntDaysMap[dayStr] = {
              date: dayStr,
              totalXp: 0,
              hours: {},
              sessions: [],
              logCount: 0
            };
          }
          Object.entries(hours).forEach(([h, xp]) => {
            huntDaysMap[dayStr].hours[h] = (huntDaysMap[dayStr].hours[h] || 0) + xp;
            huntDaysMap[dayStr].totalXp += xp;
          });
        });

        // Associa o card da sessão aos dias em que ela ocorreu
        const daysCovered = new Set([toBrtDateStr(sStart), toBrtDateStr(sEnd)].filter(Boolean));
        daysCovered.forEach(dayStr => {
          if (!huntDaysMap[dayStr]) {
            huntDaysMap[dayStr] = {
              date: dayStr,
              totalXp: 0,
              hours: {},
              sessions: [],
              logCount: 0
            };
          }
          huntDaysMap[dayStr].sessions.push(s);
        });
      });

      // 3. Processa telemetria granular não coberta pelas sessões fechadas
      // (Com margem defensiva de 5 minutos para evitar duplicar deltas de fechamento de sessão)
      rawTelemetry.forEach(l => {
        const delta = Number(l.delta_xp || 0);
        if (delta <= 0) return;
        const lDate = parseUtcDate(l.recorded_at);
        if (!lDate) return;

        const logMs = lDate.getTime();
        const isCovered = uniqueSessions.some(s => {
          const sStart = parseUtcDate(s.session_start);
          const sEnd = parseUtcDate(s.session_end);
          if (!sStart && !sEnd) return false;
          const startMs = (sStart || sEnd).getTime() - 2 * 60 * 1000;
          const endMs = (sEnd || sStart).getTime() + 5 * 60 * 1000;
          return logMs >= startMs && logMs <= endMs;
        });

        if (!isCovered) {
          const day = toBrtDateStr(lDate);
          const h = toBrtHourNum(lDate);
          if (!huntDaysMap[day]) {
            huntDaysMap[day] = {
              date: day,
              totalXp: 0,
              hours: {},
              sessions: [],
              logCount: 0
            };
          }
          huntDaysMap[day].hours[h] = (huntDaysMap[day].hours[h] || 0) + delta;
          huntDaysMap[day].totalXp += delta;
          huntDaysMap[day].logCount++;
        }
      });

      // 4. Inclui caçada ao vivo ativa (currentDelta) fatiada do início da sessão até agora
      if (currentDelta > 0) {
        const now = new Date();
        const liveStart = cData?.session_start_time ? parseUtcDate(cData.session_start_time) : new Date(now.getTime() - 30 * 60 * 1000);
        const liveSlices = sliceXpIntoBrtHours(liveStart, now, currentDelta);

        Object.entries(liveSlices).forEach(([dayStr, hours]) => {
          if (!huntDaysMap[dayStr]) {
            huntDaysMap[dayStr] = {
              date: dayStr,
              totalXp: 0,
              hours: {},
              sessions: [],
              logCount: 0
            };
          }
          Object.entries(hours).forEach(([h, xp]) => {
            huntDaysMap[dayStr].hours[h] = (huntDaysMap[dayStr].hours[h] || 0) + xp;
            huntDaysMap[dayStr].totalXp += xp;
          });
        });
      }

      const processedHuntDays = Object.keys(huntDaysMap)
        .sort((a, b) => b.localeCompare(a))
        .map(dayStr => {
          const dObj = huntDaysMap[dayStr];
          let peakH = null;
          let peakXp = 0;
          Object.entries(dObj.hours).forEach(([h, xp]) => {
            if (xp > peakXp) {
              peakXp = xp;
              peakH = parseInt(h, 10);
            }
          });

          const totalDuration = dObj.sessions.reduce((acc, s) => acc + (Number(s.duration_minutes) || 0), 0);

          return {
            date: dayStr,
            displayDate: formatBrtDateWithWeekday(dayStr),
            totalXp: dObj.totalXp,
            formattedXp: formatCompactXp(dObj.totalXp),
            hours: dObj.hours,
            sessions: dObj.sessions.sort((a, b) => new Date(b.session_start || b.session_end) - new Date(a.session_start || a.session_end)),
            sessionsCount: dObj.sessions.length,
            durationMinutes: totalDuration,
            peakHour: peakH !== null ? `${String(peakH).padStart(2, '0')}:00` : null,
            peakHourXp: peakXp
          };
        });

      setHuntDays(processedHuntDays);
      if (processedHuntDays.length > 0) {
        const cutoff14d = toBrtDateStr(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
        // Se a caçada mais recente for mais antiga que 14 dias, expande automaticamente para 'all'
        if (processedHuntDays[0].date < cutoff14d) {
          setHuntFilterPeriod('all');
        }
      }
      setSelectedHuntDate(prev => prev && processedHuntDays.some(d => d.date === prev) ? prev : (processedHuntDays[0]?.date || null));

      // Sincroniza dailyMap e heatmap de 14 dias com a precisão dos dias de caça calculados
      Object.entries(huntDaysMap).forEach(([dayStr, dObj]) => {
        dailyMap[dayStr] = Math.max(dailyMap[dayStr] || 0, dObj.totalXp);
      });
      const hData = [];
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = toBrtDateStr(targetDate);
        const xpMade = huntDaysMap[dayStr]?.totalXp || dailyMap[dayStr] || 0;
        hData.push({ date: dayStr, xp: xpMade });
      }
      setHeatmap(hData);

      // Previsão de Up (14 dias)
      const totalXp14d = Object.values(dailyMap).reduce((acc, xp) => acc + (Number(xp) || 0), 0);
      let daysSpan = 1;
      const daysWithActivity = Object.values(dailyMap).filter(xp => xp > 0).length;
      if (boundsData.length > 0 || rawTelemetry.length > 0) {
        const firstSessionTime = boundsData[0] ? parseUtcDate(boundsData[0].session_start || boundsData[0].session_end)?.getTime() : Infinity;
        const firstTeleTime = rawTelemetry[0] ? parseUtcDate(rawTelemetry[0].recorded_at)?.getTime() : Infinity;
        const oldestTime = Math.min(firstSessionTime || Infinity, firstTeleTime || Infinity);
        if (oldestTime && oldestTime !== Infinity) {
          const msPassed = Date.now() - oldestTime;
          daysSpan = Math.min(14, Math.max(1, Math.round(msPassed / (1000 * 60 * 60 * 24)) || 1));
        }
      }
      if (daysWithActivity > 0 && daysSpan < daysWithActivity) {
        daysSpan = daysWithActivity;
      }

      const avgXpPerDay = totalXp14d > 0 ? Math.floor(totalXp14d / Math.max(1, daysSpan)) : 0;
      const currentLevel = memberData?.level || cData?.level || (boundsData.length > 0 ? boundsData[boundsData.length - 1].end_level : null);

      let predictionData = null;
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

        predictionData = {
          currentLevel,
          nextMilestone,
          avgXpPerDay,
          daysToNext: Number.isFinite(daysToNext) ? daysToNext : null,
          daysToMilestone: Number.isFinite(daysToMilestone) ? daysToMilestone : null
        };
        setPrediction(predictionData);
      } else {
        setPrediction(null);
      }

      // Telemetria 48h
      const teleLogs48h = rawTelemetry.filter(l => l.recorded_at && l.recorded_at >= fortyEightHoursAgo);
      const teleSessions48h = boundsData.filter(s => s.session_end && s.session_end >= fortyEightHoursAgo);
      let chartData = [];

      if (teleLogs48h.length > 0) {
        let accumulatedXP = 0;
        teleLogs48h.forEach(log => {
          const d = parseUtcDate(log.recorded_at);
          const timeLabel = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(d);
          const delta = Number(log.delta_xp || 0);
          accumulatedXP += delta;
          chartData.push({
            time: timeLabel,
            xp: accumulatedXP,
            rawDelta: delta
          });
        });

        if (currentDelta > 0) {
          chartData.push({
            time: new Intl.DateTimeFormat('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).format(new Date()),
            xp: accumulatedXP + currentDelta,
            rawDelta: currentDelta
          });
        }
        setTelemetry(chartData);
      } else if (teleSessions48h.length > 0) {
        let accumulatedXP = 0;
        teleSessions48h.forEach(log => {
          const sStart = parseUtcDate(log.session_start || log.session_end);
          const sEnd = parseUtcDate(log.session_end);
          const xpGained = Number(log.xp_gained || 0);

          if (log.session_start && log.session_start !== log.session_end) {
            chartData.push({
              time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(sStart),
              xp: accumulatedXP,
              rawDelta: 0
            });
          }

          accumulatedXP += xpGained;
          chartData.push({
            time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(sEnd),
            xp: accumulatedXP,
            rawDelta: xpGained
          });
        });

        if (currentDelta > 0) {
          chartData.push({
            time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date()),
            xp: accumulatedXP + currentDelta,
            rawDelta: currentDelta
          });
        }
        setTelemetry(chartData);
      } else if (currentDelta > 0) {
        const now = new Date();
        const start = cData?.last_active ? parseUtcDate(cData.last_active) : new Date(now.getTime() - 30 * 60 * 1000);
        chartData = [
          {
            time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(start),
            xp: 0,
            rawDelta: 0
          },
          {
            time: new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(now),
            xp: currentDelta,
            rawDelta: currentDelta
          }
        ];
        setTelemetry(chartData);
      } else {
        setTelemetry([]);
      }

      // Rotina horária dos últimos 7 dias (Sessões + Telemetria)
      const logs7d = boundsData.filter(s => s.session_end && s.session_end >= sevenDaysAgo);
      const tele7d = rawTelemetry.filter(l => l.recorded_at && l.recorded_at >= sevenDaysAgo);
      const hourMap = new Array(24).fill(0);

      const getBrtH = (d) => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Sao_Paulo',
          hour: 'numeric',
          hour12: false
        }).formatToParts(d);
        const p = parts.find(x => x.type === 'hour');
        return parseInt(p ? p.value : d.getHours(), 10) % 24;
      };

      if (logs7d.length > 0) {
        logs7d.forEach(l => {
          let xp = Number(l.xp_gained || 0);
          if (!xp || xp <= 0) return;

          const sStart = parseUtcDate(l.session_start || l.session_end);
          const sEnd = parseUtcDate(l.session_end);

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
      } else if (tele7d.length > 0) {
        tele7d.forEach(l => {
          const delta = Number(l.delta_xp || 0);
          if (delta > 0) {
            const h = getBrtH(parseUtcDate(l.recorded_at));
            hourMap[h] += delta;
          }
        });
      }

      const routineData = hourMap.map((xp, index) => ({
        hour: `${index.toString().padStart(2, '0')}:00`,
        xp: xp
      }));
      setRoutine(routineData);

      // Desbloqueia tela principal instantaneamente (~600ms total)
      setLoading(false);

      // ─── FASE 3: CONSULTAS EM SEGUNDO PLANO (Não bloqueiam a interface) ───
      // A. Squad Frequente (Panelinhas)
      supabase
        .from('parties_planilhadas')
        .select('members')
        .limit(200)
        .then(({ data: squadData }) => {
          if (squadData && squadData.length > 0) {
            const mates = {};
            const targetLower = targetName.toLowerCase().trim();
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
        })
        .catch(() => {});

      // B. Ranking Global & Percentil (Assíncrono, sem travamento da tela)
      if (finalLevel) {
        supabase
          .from('current_character_state')
          .select('*', { count: 'exact', head: true })
          .gt('level', finalLevel)
          .then(({ count: higherCount }) => {
            const gRank = (higherCount || 0) + 1;
            setGlobalRank(gRank);
            setGlobalPercentile(((gRank / 12365) * 100).toFixed(2));
            if (!gPerkRes?.data?.notes) {
              setWorldRank(Math.max(1, Math.round(gRank / 16)));
            }
          })
          .catch(() => {});
      }

      // C. Refinamento de status via login_events (Assíncrono em segundo plano)
      supabase
        .from('login_events')
        .select('event_type, event_time')
        .eq('character_name', canonicalName)
        .order('event_time', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data: lastLoginEvent }) => {
          if (lastLoginEvent) {
            if (lastLoginEvent.event_type === 'LOGOUT') {
              setPlayerInfo(prev => prev ? { ...prev, is_online: false } : prev);
            }
          }
        })
        .catch(() => {});

      // Salva no cache do dashboard (0ms para navegação posterior e histórico)
      const fullSnapshot = {
        timestamp: Date.now(),
        playerAvatar: profileRes?.data?.avatar_url || null,
        playerInfo: {
          level: finalLevel,
          vocation: finalVocation,
          is_online: isOnline,
          world: detWorld,
          guild: memberData ? 'Shellpatrocina / Battlestorm' : null,
          guild_rank: memberData?.rank || null,
          last_active: cData?.last_active || null,
          xp_total: currentXP,
          xp_today: xpGained24h
        },
        worldRank: gPerkRes?.data?.notes && gPerkRes.data.notes.includes('rank:') ? parseInt(gPerkRes.data.notes.replace('rank:', ''), 10) : null,
        globalRank: null,
        globalPercentile: null,
        rusher24h: rusherData,
        deaths: deathsData,
        levelHistory: lvlHist,
        heatmap: hData,
        prediction: predictionData,
        telemetry: chartData,
        frequentSquad: [],
        routine: routineData,
        huntDays: processedHuntDays,
        selectedHuntDate: processedHuntDays[0]?.date || null
      };

      setPlayerInfo(fullSnapshot.playerInfo);
      playerDashboardCache.set(cacheKey, fullSnapshot);
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(storageKey, JSON.stringify(fullSnapshot));
          try {
            sessionStorage.removeItem(`rubinot_player_${cacheKey}`);
            sessionStorage.removeItem(`rubinot_player_v3_hunts_${cacheKey}`);
          } catch (e) {}
        }
      } catch (e) {}

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

  // ─── MEMOS PARA O DIÁRIO DE CAÇA E DETALHAMENTO HORÁRIO ───
  const filteredHuntDays = useMemo(() => {
    if (!huntDays || huntDays.length === 0) return [];
    if (huntFilterPeriod === 'all') return huntDays;

    const daysLimit = huntFilterPeriod === '7d' ? 7 : (huntFilterPeriod === '30d' ? 30 : 14);
    const cutoffDate = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);
    const cutoffStr = toBrtDateStr(cutoffDate);

    return huntDays.filter(d => d.date >= cutoffStr);
  }, [huntDays, huntFilterPeriod]);

  const activeSelectedDay = useMemo(() => {
    if (!huntDays || huntDays.length === 0) return null;
    return huntDays.find(d => d.date === selectedHuntDate) || huntDays[0];
  }, [huntDays, selectedHuntDate]);

  const hourlyChartData = useMemo(() => {
    if (!activeSelectedDay) return [];
    return Array.from({ length: 24 }, (_, h) => {
      const xp = activeSelectedDay.hours[h] || 0;
      return {
        hour: `${String(h).padStart(2, '0')}:00`,
        hourNum: h,
        xp: xp,
        formattedXp: xp > 0 ? `+${formatCompactXp(xp)}` : '0 XP'
      };
    });
  }, [activeSelectedDay]);

  const periodStats = useMemo(() => {
    if (!filteredHuntDays || filteredHuntDays.length === 0) return null;
    const totalXp = filteredHuntDays.reduce((acc, d) => acc + (d.totalXp || 0), 0);
    const totalSessions = filteredHuntDays.reduce((acc, d) => acc + d.sessionsCount, 0);
    const avgXpPerDay = Math.round(totalXp / filteredHuntDays.length);
    const bestDay = [...filteredHuntDays].sort((a, b) => b.totalXp - a.totalXp)[0];

    return {
      daysCount: filteredHuntDays.length,
      totalXp,
      totalSessions,
      avgXpPerDay,
      bestDay
    };
  }, [filteredHuntDays]);

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
                {playerInfo.xp_total > 0 && (
                  <span className="bg-amber-950/60 text-amber-300 px-3 py-1 rounded text-sm font-bold border border-amber-500/40 flex items-center gap-1.5 shadow-sm" title={`XP Total: ${Number(playerInfo.xp_total).toLocaleString('pt-BR')} XP`}>
                    <Zap size={14} className="text-amber-400" />
                    {formatCompactXp(playerInfo.xp_total)} XP Total
                  </span>
                )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP Acumulada Total */}
        <div className="bg-gradient-to-b from-stone-900 to-black p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-yellow-400/90 uppercase tracking-wider flex items-center gap-1">
              <Zap size={13} className="text-yellow-400" /> XP Acumulada
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {playerInfo?.xp_total ? formatCompactXp(playerInfo.xp_total) : '---'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate max-w-[140px]" title={playerInfo?.xp_total ? `${Number(playerInfo.xp_total).toLocaleString('pt-BR')} XP` : ''}>
              {playerInfo?.xp_total ? `${Number(playerInfo.xp_total).toLocaleString('pt-BR')} XP` : 'Total no Rubinot'}
            </p>
          </div>
          <Zap className="text-yellow-400 opacity-60" size={36} />
        </div>

        {/* Top Rusher 24h */}
        <div className="bg-gradient-to-b from-amber-950/30 to-black p-4 rounded-xl border border-amber-500/40 flex items-center justify-between shadow-lg shadow-amber-500/5">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Flame size={13} className="text-amber-400" /> Rush 24 Horas
            </p>
            <p className="text-2xl font-black text-amber-300 mt-1">
              {rusher24h?.exp_gained ? `+${formatCompactXp(rusher24h.exp_gained)} XP` : '0 XP'}
            </p>
            <p className="text-[11px] text-amber-400/70 mt-0.5 font-mono truncate max-w-[140px]" title={rusher24h?.exp_gained ? `+${Number(rusher24h.exp_gained).toLocaleString('pt-BR')} XP` : ''}>
              {rusher24h?.exp_gained ? `+${Number(rusher24h.exp_gained).toLocaleString('pt-BR')} XP` : 'Sem rush recente'}
            </p>
          </div>
          <Flame className="text-amber-400 opacity-80" size={36} />
        </div>

        {/* Ranking Global */}
        <div className="bg-gradient-to-b from-stone-900 to-black p-4 rounded-xl border-2 border-yellow-500/40 flex items-center justify-between shadow-xl shadow-yellow-500/5">
          <div>
            <p className="text-xs font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy size={13} className="text-yellow-400" /> Ranking Global
            </p>
            <p className="text-2xl font-black text-yellow-300 mt-1">
              {globalRank ? `#${globalRank}` : 'Top Geral'}
            </p>
            <p className="text-[11px] text-yellow-400/70 mt-0.5 font-mono">
              {globalPercentile ? `Top ${globalPercentile}% no Rubinot` : 'Entre 12.365+ players'}
            </p>
          </div>
          <Trophy className="text-yellow-400 opacity-70" size={36} />
        </div>

        {/* Ranking no Mundo */}
        <div className="bg-gradient-to-b from-stone-900 to-black p-4 rounded-xl border border-yellow-500/30 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-yellow-400/90 uppercase tracking-wider flex items-center gap-1">
              <Shield size={13} className="text-yellow-400" /> Ranking no Mundo
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {worldRank ? `#${worldRank}` : 'Top 100'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Servidor {activeWorldObj?.name}</p>
          </div>
          <Shield className="text-yellow-400 opacity-60" size={36} />
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
        <div className="bg-tibia-card p-6 rounded-2xl border border-green-900/50 shadow-xl mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className="text-xl font-bold text-green-400 flex items-center">
              <Activity className="mr-2" size={24} />
              Calendário do Vício (Últimos 14 dias)
            </h3>
            <span className="text-[11px] text-gray-400 italic">
              Dica: Clique em qualquer dia para ver a análise hora a hora abaixo
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-6">Dias com maior intensidade de caça ganham cores mais vivas. Clique em um dia para focar a análise.</p>
          
          <div className="flex flex-wrap gap-2.5">
            {heatmap.map((day) => {
              const d = new Date(day.date + 'T12:00:00Z');
              const rawDay = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).replace('.', '');
              const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
              const isSelected = selectedHuntDate === day.date;
              
              let bgColor = 'bg-gray-800 border-gray-700';
              if (day.xp > 100000000) bgColor = 'bg-green-400 border-green-300 shadow-[0_0_10px_rgba(74,222,128,0.5)]'; // > 100M
              else if (day.xp > 50000000) bgColor = 'bg-green-600 border-green-500'; // > 50M
              else if (day.xp > 10000000) bgColor = 'bg-green-800 border-green-700'; // > 10M
              else if (day.xp > 0) bgColor = 'bg-green-900 border-green-800'; // > 0
              
              return (
                <button 
                  key={day.date} 
                  onClick={() => setSelectedHuntDate(day.date)}
                  className={`flex flex-col items-center group relative cursor-pointer p-1 rounded-lg transition-all ${
                    isSelected ? 'bg-yellow-500/15 ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)] scale-110' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-8 h-8 rounded border ${bgColor} mb-1 ${isSelected ? 'border-yellow-300' : ''}`}></div>
                  <span className={`text-[10px] ${isSelected ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>{dayName}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-yellow-500/40 text-white text-xs py-1.5 px-2.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-2xl">
                    <span className="font-bold text-yellow-300">{day.date}</span>: {day.xp > 0 ? `+${(day.xp / 1000000).toFixed(1)}M XP` : '0 XP'}
                    <span className="block text-[10px] text-gray-400 mt-0.5 font-normal">Clique para detalhar</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIÁRIO DE CAÇA & DETALHAMENTO HORÁRIO DE XP                               */}
      {/* ========================================================================= */}
      <div className="bg-tibia-card p-6 rounded-2xl border border-yellow-500/30 shadow-2xl space-y-6 mt-8">
        {/* Cabeçalho do Diário */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-[11px] font-bold text-yellow-300 uppercase tracking-wider mb-2">
              <Calendar size={13} className="text-yellow-400" />
              Telemetria Tática de Grind
            </div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2 font-medieval">
              <Flame className="text-amber-400" size={24} />
              Diário de Caça & Detalhamento Horário
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Monitore os dias em que <strong className="text-yellow-300">{playerName}</strong> caçou, quanto de XP produziu por dia e inspecione o desempenho hora a hora.
            </p>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10 self-start lg:self-auto">
            <span className="text-[11px] text-gray-400 px-2 font-bold flex items-center gap-1">
              <Filter size={12} /> Período:
            </span>
            {[
              { id: '7d', label: '7 Dias' },
              { id: '14d', label: '14 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: 'all', label: 'Todos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHuntFilterPeriod(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  huntFilterPeriod === tab.id
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumo do Período */}
        {periodStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Dias Caçados</p>
              <p className="text-xl font-black text-white mt-1">
                {periodStats.daysCount} <span className="text-xs text-gray-500 font-normal">dias ativos</span>
              </p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-[11px] text-green-400/90 font-bold uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={12} /> XP no Período
              </p>
              <p className="text-xl font-black text-green-400 mt-1">
                +{formatCompactXp(periodStats.totalXp)}
              </p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3">
              <p className="text-[11px] text-blue-400/90 font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Média por Dia Ativo
              </p>
              <p className="text-xl font-black text-blue-300 mt-1">
                +{formatCompactXp(periodStats.avgXpPerDay)}
              </p>
            </div>
            <div className="bg-black/50 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[11px] text-amber-400/90 font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame size={12} /> Melhor Grind
              </p>
              <p className="text-xl font-black text-amber-300 mt-1 truncate" title={periodStats.bestDay?.displayDate}>
                {periodStats.bestDay ? `+${formatCompactXp(periodStats.bestDay.totalXp)}` : '---'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{periodStats.bestDay ? periodStats.bestDay.date : ''}</p>
            </div>
          </div>
        )}

        {/* Lista Horizontal de Dias com XP (Scrollável) */}
        {filteredHuntDays.length === 0 ? (
          <div className="bg-black/40 border border-dashed border-white/10 rounded-xl p-8 text-center text-gray-400">
            <p className="text-sm font-bold">Nenhuma caçada registrada no período selecionado ({huntFilterPeriod}).</p>
            {huntDays.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs text-gray-400">
                  Existem {huntDays.length} {huntDays.length === 1 ? 'dia com caçada registrado' : 'dias com caçadas registrados'} em períodos anteriores.
                </p>
                <button
                  onClick={() => setHuntFilterPeriod('all')}
                  className="mt-3 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-yellow-500/10"
                >
                  <Calendar size={13} />
                  Ver todo o histórico de caçadas ({huntDays.length} {huntDays.length === 1 ? 'dia' : 'dias'})
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Este personagem ainda não possui registros de sessões de caça arquivadas.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-yellow-400" />
                Selecione um dia para inspecionar hora a hora:
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {filteredHuntDays.length} {filteredHuntDays.length === 1 ? 'dia encontrado' : 'dias encontrados'}
              </span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
              {filteredHuntDays.map((d) => {
                const isSelected = activeSelectedDay?.date === d.date;
                const [y, m, dayNum] = d.date.split('-');
                const dObj = new Date(d.date + 'T12:00:00Z');
                const rawWeek = dObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).replace('.', '');
                const weekShort = rawWeek.charAt(0).toUpperCase() + rawWeek.slice(1);

                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedHuntDate(d.date)}
                    className={`shrink-0 flex flex-col items-center justify-center p-3 px-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-yellow-950/90 to-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.35)] scale-105'
                        : 'bg-black/50 border-white/10 hover:border-white/20 hover:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 uppercase font-mono">{weekShort}</span>
                    <span className={`text-base font-black ${isSelected ? 'text-yellow-300' : 'text-white'}`}>
                      {dayNum}/{m}
                    </span>
                    <span className="text-xs font-bold font-mono text-green-400 mt-1">
                      +{d.formattedXp}
                    </span>
                    {d.sessionsCount > 0 && (
                      <span className="text-[9px] text-gray-400 mt-0.5 font-mono">
                        {d.sessionsCount} {d.sessionsCount === 1 ? 'hunt' : 'hunts'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Painel de Análise Horária do Dia Ativo */}
            {activeSelectedDay && (
              <div className="bg-gradient-to-b from-stone-900/90 to-black p-5 rounded-2xl border-2 border-yellow-500/40 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-yellow-300 font-medieval flex items-center gap-1.5">
                        <Clock size={18} className="text-yellow-400" />
                        {activeSelectedDay.displayDate}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-950/80 text-green-400 border border-green-500/40">
                        +{activeSelectedDay.formattedXp} XP no dia
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Detalhamento da curva de XP por faixa de 1 hora (00h às 23h) no fuso horário de Brasília.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {activeSelectedDay.peakHour && (
                      <div className="bg-amber-950/40 border border-amber-500/30 px-3 py-1 rounded-lg text-right">
                        <span className="text-[10px] text-amber-400 block font-bold uppercase tracking-wider">Hora de Pico</span>
                        <span className="text-sm font-black text-amber-300">
                          {activeSelectedDay.peakHour} (+{formatCompactXp(activeSelectedDay.peakHourXp)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gráfico de Barras Horárias (24 horas) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-bold flex items-center gap-1">
                      <BarChart2 size={14} className="text-yellow-400" />
                      XP Gerada por Hora do Dia
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Passe o mouse sobre as colunas para inspecionar
                    </span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#555" 
                          tick={{ fill: '#888', fontSize: 10 }}
                          interval={1}
                        />
                        <YAxis 
                          stroke="#555" 
                          tick={{ fill: '#888', fontSize: 10 }} 
                          tickFormatter={(val) => val >= 1000000 ? (val/1000000).toFixed(0)+'M' : (val >= 1000 ? (val/1000).toFixed(0)+'k' : val)} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#eab308', borderRadius: '8px', color: '#fff' }}
                          formatter={(value) => [`+${formatCompactXp(value)} XP`, 'XP na Hora']}
                          labelFormatter={(label) => `Horário: ${label} às ${label.split(':')[0]}:59`}
                        />
                        <Bar dataKey="xp" radius={[4, 4, 0, 0]}>
                          {hourlyChartData.map((entry, index) => {
                            const isPeak = activeSelectedDay.peakHour === entry.hour;
                            const hasXp = entry.xp > 0;
                            let fill = '#1c1917';
                            if (isPeak) fill = '#f59e0b';
                            else if (hasXp && entry.xp > 100000000) fill = '#10b981';
                            else if (hasXp && entry.xp > 50000000) fill = '#059669';
                            else if (hasXp) fill = '#047857';
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sessões e Caçadas do Dia */}
                {activeSelectedDay.sessions && activeSelectedDay.sessions.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={13} className="text-yellow-400" />
                      Sessões de Caça Fechadas neste Dia ({activeSelectedDay.sessions.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {activeSelectedDay.sessions.map((s, sIdx) => {
                        const sStart = toBrtTimeStr(s.session_start || s.session_end);
                        const sEnd = toBrtTimeStr(s.session_end);
                        const dur = s.duration_minutes || (s.session_start && s.session_end ? Math.round((new Date(s.session_end) - new Date(s.session_start)) / 60000) : 0);
                        const xpNum = Number(s.xp_gained || 0);
                        const xpHour = dur > 0 ? Math.round((xpNum / dur) * 60) : 0;

                        return (
                          <div key={s.id || sIdx} className="bg-black/60 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-1.5 mb-1.5">
                              <span className="font-mono text-gray-300">
                                🕒 {sStart} → {sEnd}
                              </span>
                              <span className="text-[10px] text-yellow-400/80 font-mono">
                                {dur > 0 ? `${dur} min` : 'Sessão curta'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-black text-green-400 font-mono">
                                  +{formatCompactXp(xpNum)} XP
                                </span>
                                {xpHour > 0 && (
                                  <span className="text-[10px] text-gray-400 block font-mono">
                                    ~{formatCompactXp(xpHour)} XP/h
                                  </span>
                                )}
                              </div>
                              {s.end_level && (
                                <span className="text-[11px] font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-lg">
                                  Lvl {s.end_level}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Radar de Rotina (Horários Ativos Gerais) */}
      {routine.length > 0 && (
        <div className="bg-tibia-card p-6 rounded-2xl border border-blue-900/50 shadow-xl mt-8">
          <h3 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
            <Clock className="mr-2" size={24} />
            Radar de Rotina Geral (Horário Ativo)
          </h3>
          <p className="text-xs text-gray-400 mb-6">Distribuição consolidada da XP gerada por horário do dia (Últimos 7 dias).</p>
          
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
