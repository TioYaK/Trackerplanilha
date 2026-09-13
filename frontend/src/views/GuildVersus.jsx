import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Swords, Shield, Users, Trophy, Skull, Flame, Share2, Copy, Check, 
  ArrowRight, Activity, Clock, Crosshair, ChevronRight, BarChart2, Zap 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import { parseUtcDate, toBrtTimeStr } from '../lib/tibiaUtils';

export default function GuildVersus({ onPlayerClick, onNavigate }) {
  const [guild1, setGuild1] = useState('Battlestorm');
  const [guild2, setGuild2] = useState('Ascension');
  const [guildsList, setGuildsList] = useState(['Battlestorm', 'Ascension']);
  const [loading, setLoading] = useState(true);

  // Dados das duas guildas
  const [membersG1, setMembersG1] = useState([]);
  const [membersG2, setMembersG2] = useState([]);
  const [deathsData, setDeathsData] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  // Carrega parâmetros da URL caso existam (?g1=...&g2=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qG1 = params.get('g1');
      const qG2 = params.get('g2');
      if (qG1) setGuild1(qG1);
      if (qG2) setGuild2(qG2);
    }
  }, []);

  const fetchGuildData = async () => {
    setLoading(true);
    try {
      // 1. Busca membros das duas guildas
      const { data: gMembers } = await supabase
        .from('guild_members')
        .select('*');

      if (gMembers) {
        // Coleta ranks/guildas disponíveis
        const ranks = Array.from(new Set(gMembers.map(m => m.rank).filter(Boolean)));
        if (ranks.length > 0) {
          setGuildsList(ranks);
        }

        const g1M = gMembers.filter(m => (m.rank || '').toLowerCase() === guild1.toLowerCase());
        const g2M = gMembers.filter(m => (m.rank || '').toLowerCase() === guild2.toLowerCase());
        setMembersG1(g1M);
        setMembersG2(g2M);
      }

      // 2. Busca mortes recentes
      const { data: deaths } = await supabase
        .from('recent_deaths')
        .select('*')
        .order('death_time', { ascending: false })
        .limit(500);

      setDeathsData(deaths || []);
    } catch (e) {
      console.error('Erro ao buscar dados do confronto:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuildData();
  }, [guild1, guild2]);

  // Cruzamento de Frags Mútuos (War Score)
  const warAnalytics = useMemo(() => {
    const set1 = new Set(membersG1.map(m => m.name.toLowerCase()));
    const set2 = new Set(membersG2.map(m => m.name.toLowerCase()));

    // Frags: G1 matou G2 (Vítima em G2, Killer em G1)
    const fragsG1 = deathsData.filter(d => {
      const victimInG2 = set2.has((d.character_name || '').toLowerCase());
      const killerInG1 = set1.has((d.killed_by || '').toLowerCase());
      return victimInG2 && killerInG1;
    });

    // Frags: G2 matou G1 (Vítima em G1, Killer em G2)
    const fragsG2 = deathsData.filter(d => {
      const victimInG1 = set1.has((d.character_name || '').toLowerCase());
      const killerInG2 = set2.has((d.killed_by || '').toLowerCase());
      return victimInG1 && killerInG2;
    });

    // Estatísticas de Level
    const totalLvl1 = membersG1.reduce((acc, m) => acc + (m.level || 0), 0);
    const avgLvl1 = membersG1.length > 0 ? Math.round(totalLvl1 / membersG1.length) : 0;
    const onlines1 = membersG1.filter(m => m.is_online).length;

    const totalLvl2 = membersG2.reduce((acc, m) => acc + (m.level || 0), 0);
    const avgLvl2 = membersG2.length > 0 ? Math.round(totalLvl2 / membersG2.length) : 0;
    const onlines2 = membersG2.filter(m => m.is_online).length;

    // Heatmap de horários dos confrontos (0h a 23h)
    const hourlyClashes = Array(24).fill(0);
    [...fragsG1, ...fragsG2].forEach(f => {
      if (f.death_time) {
        const hour = new Date(f.death_time).getHours();
        hourlyClashes[hour]++;
      }
    });

    return {
      score1: fragsG1.length,
      score2: fragsG2.length,
      fragsG1,
      fragsG2,
      avgLvl1,
      avgLvl2,
      onlines1,
      onlines2,
      hourlyClashes
    };
  }, [membersG1, membersG2, deathsData]);

  const shareWarSummary = () => {
    let msg = `⚔️ **RELATÓRIO DE GUERRA RUBINOT** ⚔️\n`;
    msg += `🛡️ **${guild1}** [${warAnalytics.score1}] x [${warAnalytics.score2}] **${guild2}** 🛡️\n\n`;
    msg += `👥 **Membros:** ${guild1} (${membersG1.length} membros, avg lvl ${warAnalytics.avgLvl1}) vs ${guild2} (${membersG2.length} membros, avg lvl ${warAnalytics.avgLvl2})\n`;
    msg += `🔥 **Online Agora:** ${warAnalytics.onlines1} vs ${warAnalytics.onlines2}\n`;
    msg += `📊 **Acompanhe a War ao Vivo:** https://trackerplanilha.vercel.app/guild-war?g1=${encodeURIComponent(guild1)}&g2=${encodeURIComponent(guild2)}`;
    navigator.clipboard.writeText(msg);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner de Guerra */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300 uppercase tracking-wider mb-3">
              <Swords size={14} className="text-red-400 animate-pulse" />
              Confronto Direto de Guildas & Warmode
            </div>
            <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold">
              Comparador de Guildas & War Heatmap
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Monitore o placar real de frags mútuos, dominância de level, membros online e horários de maior confronto entre as principais potências dos 16 mundos.
            </p>
          </div>

          {/* Botões de Compartilhamento */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={shareWarSummary}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 shadow-lg transition-all active:scale-95"
            >
              {copiedDiscord ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copiedDiscord ? 'Copiado!' : 'Compartilhar War'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Guildas */}
      <div className="bg-black/60 border border-tibia-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Guilda 1 */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-blue-400 uppercase">Guilda 1:</span>
          <select
            value={guild1}
            onChange={(e) => setGuild1(e.target.value)}
            className="bg-black/80 border border-blue-500/40 rounded-xl px-4 py-2 text-xs font-bold text-blue-300 focus:outline-none focus:border-blue-400"
          >
            {guildsList.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="p-2 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 font-medieval text-sm font-bold">
          VS
        </div>

        {/* Guilda 2 */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-amber-400 uppercase">Guilda 2:</span>
          <select
            value={guild2}
            onChange={(e) => setGuild2(e.target.value)}
            className="bg-black/80 border border-amber-500/40 rounded-xl px-4 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
          >
            {guildsList.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

      </div>

      {/* PLACAR DA GUERRA GIGANTE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Guilda 1 Card */}
        <div className="md:col-span-5 bg-gradient-to-b from-blue-950/30 to-black/80 border-2 border-blue-500/40 p-6 rounded-2xl flex flex-col items-center text-center shadow-xl">
          <Shield size={40} className="text-blue-400 mb-2" />
          <h2 className="text-2xl sm:text-3xl font-medieval text-blue-300 font-bold">{guild1}</h2>
          
          <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-blue-500/20 text-xs">
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Membros</p>
              <p className="text-base font-bold text-white font-mono">{membersG1.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Média Lvl</p>
              <p className="text-base font-bold text-blue-400 font-mono">{warAnalytics.avgLvl1}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Online</p>
              <p className="text-base font-bold text-green-400 font-mono">{warAnalytics.onlines1}</p>
            </div>
          </div>
        </div>

        {/* Placar Central */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-black/80 border-2 border-red-500/50 rounded-2xl text-center shadow-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Frags Mútuos</p>
          <div className="flex items-center gap-3 font-medieval text-3xl sm:text-4xl font-bold">
            <span className="text-blue-400">{warAnalytics.score1}</span>
            <span className="text-gray-600">x</span>
            <span className="text-amber-400">{warAnalytics.score2}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Killboard PvP</p>
        </div>

        {/* Guilda 2 Card */}
        <div className="md:col-span-5 bg-gradient-to-b from-amber-950/30 to-black/80 border-2 border-amber-500/40 p-6 rounded-2xl flex flex-col items-center text-center shadow-xl">
          <Shield size={40} className="text-amber-400 mb-2" />
          <h2 className="text-2xl sm:text-3xl font-medieval text-amber-300 font-bold">{guild2}</h2>
          
          <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4 border-t border-amber-500/20 text-xs">
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Membros</p>
              <p className="text-base font-bold text-white font-mono">{membersG2.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Média Lvl</p>
              <p className="text-base font-bold text-amber-400 font-mono">{warAnalytics.avgLvl2}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Online</p>
              <p className="text-base font-bold text-green-400 font-mono">{warAnalytics.onlines2}</p>
            </div>
          </div>
        </div>

      </div>

      {/* WAR HEATMAP: HORÁRIOS DE MAIOR COMBATE */}
      <div className="bg-black/70 border border-tibia-border p-5 rounded-2xl shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Flame className="text-orange-500" size={16} />
          War Heatmap: Horários de Pico dos Confrontos (00:00 às 23:00)
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Descubra os momentos do dia em que ocorrem as maiores batalhas e invasões entre as duas facções.
        </p>

        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
          {warAnalytics.hourlyClashes.map((clashCount, hour) => {
            const intensity = Math.min(clashCount * 25, 100);
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div 
                  className="w-full h-12 rounded-md transition-all flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    backgroundColor: clashCount > 0 ? `rgba(239, 68, 68, ${Math.max(0.3, clashCount / 5)})` : 'rgba(255,255,255,0.05)'
                  }}
                  title={`${hour}h: ${clashCount} confrontos`}
                >
                  {clashCount > 0 ? clashCount : ''}
                </div>
                <span className="text-[9px] text-gray-500">{hour}h</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* LISTA DE FRAGS RECENTES DO CONFRONTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Frags da Guilda 1 */}
        <div className="bg-black/60 border border-blue-500/30 p-4 rounded-2xl flex flex-col gap-3">
          <h4 className="text-xs font-bold text-blue-300 uppercase flex items-center gap-1.5">
            <Crosshair size={14} /> Baixas causadas por {guild1}
          </h4>
          <div className="space-y-2">
            {warAnalytics.fragsG1.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-6 text-center">Nenhum frag registrado recentemente.</div>
            ) : (
              warAnalytics.fragsG1.map((f, i) => (
                <div key={i} className="p-2.5 bg-black/80 rounded-xl border border-blue-500/20 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-blue-400">{f.killed_by}</span>
                    <span className="text-gray-500 mx-1.5">➔</span>
                    <span className="font-bold text-white">{f.character_name}</span>
                    <span className="text-[10px] text-gray-400 ml-1">(lvl {f.level})</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{toBrtTimeStr(f.death_time)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Frags da Guilda 2 */}
        <div className="bg-black/60 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
            <Crosshair size={14} /> Baixas causadas por {guild2}
          </h4>
          <div className="space-y-2">
            {warAnalytics.fragsG2.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-6 text-center">Nenhum frag registrado recentemente.</div>
            ) : (
              warAnalytics.fragsG2.map((f, i) => (
                <div key={i} className="p-2.5 bg-black/80 rounded-xl border border-amber-500/20 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-amber-400">{f.killed_by}</span>
                    <span className="text-gray-500 mx-1.5">➔</span>
                    <span className="font-bold text-white">{f.character_name}</span>
                    <span className="text-[10px] text-gray-400 ml-1">(lvl {f.level})</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{toBrtTimeStr(f.death_time)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <AdBanner slot="guild_war_footer" format="horizontal" />
    </div>
  );
}
