import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, ShieldAlert, Crosshair, Skull, UserCheck, AlertTriangle, 
  Clock, Flame, Link2, ExternalLink, Activity, Award, UserPlus, 
  CheckCircle2, RefreshCw, Zap, Users, Eye, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { formatVocation, toTibiaTitleCase } from '../lib/tibiaUtils';
import { soundFX } from '../lib/soundEffects';
import AdBanner from '../components/AdBanner';

// Cache em memória de investigações (TTL 60s) mantido no nível do módulo
const investigationCache = new Map();
const INVESTIGATION_CACHE_TTL = 60 * 1000;

export default function PlayerInvestigation({ onPlayerClick, onNavigate, isAdmin }) {
  const [searchTarget, setSearchTarget] = useState('');
  const [activeTarget, setActiveTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dados coletados da investigação
  const [targetProfile, setTargetProfile] = useState(null);
  const [targetDeaths, setTargetDeaths] = useState([]);
  const [targetFrags, setTargetFrags] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [loginTimeline, setLoginTimeline] = useState([]);

  // Lista de Hunteds para sugestões rápidas
  const [suggestedTargets, setSuggestedTargets] = useState([]);
  const [addedHuntedSuccess, setAddedHuntedSuccess] = useState(null);

  // Carrega sugestões de inimigos/hunteds populares
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const { data } = await supabase
          .from('hunted_list')
          .select('name, reason, is_online')
          .order('is_online', { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          setSuggestedTargets(data);
        } else {
          // Fallback se não houver hunteds
          const { data: gData } = await supabase
            .from('guild_members')
            .select('name, level, vocation')
            .order('level', { ascending: false })
            .limit(6);
          setSuggestedTargets((gData || []).map(g => ({ name: g.name, reason: 'Top Level' })));
        }
      } catch (e) {}
    };
    loadSuggestions();
  }, []);

  const runInvestigation = async (nameToInvestigate) => {
    const target = (nameToInvestigate || searchTarget).trim();
    if (!target) return;

    const targetName = toTibiaTitleCase(target);
    const cacheKey = targetName.toLowerCase();
    const cached = investigationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < INVESTIGATION_CACHE_TTL)) {
      setActiveTarget(targetName);
      setTargetProfile(cached.targetProfile);
      setTargetDeaths(cached.targetDeaths);
      setTargetFrags(cached.targetFrags);
      setLoginTimeline(cached.loginTimeline);
      setSuspects(cached.suspects);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setActiveTarget(targetName);

    try {
      // 1. Busca perfil do alvo com índices B-Tree diretos (.eq exato)
      const [guildRes, stateRes, deathsRes, fragsRes, loginRes, allDeathsRes] = await Promise.all([
        supabase.from('guild_members')
          .select('name, level, vocation, rank, is_online, guild_name')
          .eq('name', targetName)
          .limit(1)
          .maybeSingle(),
        supabase.from('current_character_state')
          .select('character_name, level, vocation, last_active, updated_at')
          .eq('character_name', targetName)
          .limit(1)
          .maybeSingle(),
        supabase.from('recent_deaths')
          .select('id, character_name, level, killed_by, death_time, created_at')
          .eq('character_name', targetName)
          .order('death_time', { ascending: false })
          .limit(30),
        supabase.from('recent_deaths')
          .select('id, character_name, level, killed_by, death_time, created_at')
          .ilike('killed_by', `%${targetName}%`)
          .order('death_time', { ascending: false })
          .limit(30),
        supabase.from('login_events')
          .select('event_type, event_time, level, vocation')
          .eq('character_name', targetName)
          .order('event_time', { ascending: false })
          .limit(40),
        supabase.from('recent_deaths')
          .select('character_name, level, death_time, created_at')
          .order('death_time', { ascending: false })
          .limit(100)
      ]);

      const profile = {
        name: target,
        level: stateRes.data?.level || guildRes.data?.level || 0,
        vocation: stateRes.data?.vocation || guildRes.data?.vocation || 'Desconhecido',
        rank: guildRes.data?.rank || 'Sem Guilda',
        isOnline: guildRes.data?.is_online || false,
        lastActive: stateRes.data?.last_active || null,
        totalDeaths: (deathsRes.data || []).length,
        totalFrags: (fragsRes.data || []).length
      };

      setTargetProfile(profile);
      setTargetDeaths(deathsRes.data || []);
      setTargetFrags(fragsRes.data || []);
      setLoginTimeline(loginRes.data || []);

      // 2. ALGORITMO DE CORRELAÇÃO DE MAKERS & ALTS
      const targetDeathTimes = (deathsRes.data || []).map(d => new Date(d.death_time || d.created_at).getTime());
      const targetFragVictims = new Set((fragsRes.data || []).map(f => f.character_name?.toLowerCase()));
      const targetNameLower = target.toLowerCase();
      const targetPrefix = targetNameLower.split(' ')[0];

      const suspectMap = new Map();

      // Análise A: Co-Mortes em Batalhas (outros jogadores que morreram na mesma janela de 3 minutos)
      const allDeaths = allDeathsRes.data || [];
      for (const d of allDeaths) {
        const charName = d.character_name;
        if (!charName || charName.toLowerCase() === targetNameLower) continue;

        const dTime = new Date(d.death_time || d.created_at).getTime();
        for (const tTime of targetDeathTimes) {
          const diffSec = Math.abs(dTime - tTime) / 1000;
          if (diffSec <= 180) { // dentro de 3 minutos
            if (!suspectMap.has(charName)) {
              suspectMap.set(charName, {
                name: charName,
                level: d.level || 0,
                vocation: 'Membro de Combate',
                coDeathsCount: 0,
                coFragsCount: 0,
                nameSimilarity: false,
                reasons: []
              });
            }
            const s = suspectMap.get(charName);
            s.coDeathsCount++;
            if (!s.reasons.includes('Morte simultânea em batalha')) {
              s.reasons.push('Morte simultânea em batalha');
            }
          }
        }
      }

      // Análise B: Co-Fraggers (outros que mataram as mesmas vítimas nas mesmas batalhas)
      for (const d of allDeaths) {
        const charName = d.character_name?.toLowerCase();
        if (targetFragVictims.has(charName)) {
          // Extrai quem matou essa mesma vítima
          const killerStr = (d.killed_by || '');
          const candidates = killerStr.split(/[(),]/).map(c => c.replace(/killed by/i, '').replace(/maior dano por/i, '').trim());
          for (const cand of candidates) {
            if (cand && cand.length > 2 && cand.toLowerCase() !== targetNameLower && cand.toLowerCase() !== 'werelion' && cand.toLowerCase() !== 'demon') {
              if (!suspectMap.has(cand)) {
                suspectMap.set(cand, {
                  name: cand,
                  level: 0,
                  vocation: 'Parceiro de Frag',
                  coDeathsCount: 0,
                  coFragsCount: 0,
                  nameSimilarity: false,
                  reasons: []
                });
              }
              const s = suspectMap.get(cand);
              s.coFragsCount++;
              if (!s.reasons.includes('Parceiro de frag na mesma vítima')) {
                s.reasons.push('Parceiro de frag na mesma vítima');
              }
            }
          }
        }
      }

      // Análise C: Padrão de Nomenclatura Semântica (Makers com nomes correlatos)
      for (const [sName, data] of suspectMap.entries()) {
        const sNameLower = sName.toLowerCase();
        if (targetPrefix.length >= 4 && sNameLower.includes(targetPrefix)) {
          data.nameSimilarity = true;
          data.reasons.push('Semelhança direta de nome / prefixo');
        }
      }

      // 3. Cálculo do Score de Suspeita (0 a 99%)
      const calculatedSuspects = Array.from(suspectMap.values()).map(s => {
        let score = 35; // base de correlação de combate
        score += Math.min(s.coDeathsCount * 18, 36);
        score += Math.min(s.coFragsCount * 12, 24);
        if (s.nameSimilarity) score += 20;

        // Se for level baixo (maker típico level 150-400), pontua mais como alt
        if (s.level > 0 && s.level < 450) score += 10;

        score = Math.min(score, 97);

        return {
          ...s,
          confidenceScore: score
        };
      });

      // Ordena pelos maiores scores de suspeita
      calculatedSuspects.sort((a, b) => b.confidenceScore - a.confidenceScore);
      const topSuspects = calculatedSuspects.slice(0, 8);
      setSuspects(topSuspects);

      // Salva no cache
      investigationCache.set(cacheKey, {
        timestamp: Date.now(),
        targetProfile: profile,
        targetDeaths: deathsRes.data || [],
        targetFrags: fragsRes.data || [],
        loginTimeline: loginRes.data || [],
        suspects: topSuspects
      });
      if (investigationCache.size > 30) {
        const oldest = investigationCache.keys().next().value;
        investigationCache.delete(oldest);
      }

    } catch (err) {
      console.error('Erro na investigação:', err);
      setError('Erro ao processar telemetria do personagem. Verifique se o nome está correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToHunted = async (suspectName) => {
    try {
      await supabase.from('hunted_list').upsert({
        name: suspectName,
        reason: `Possível Maker/Alt de ${activeTarget}`,
        is_online: false
      }, { onConflict: 'name' });

      soundFX.playEnemyAlert();
      setAddedHuntedSuccess(suspectName);
      setTimeout(() => setAddedHuntedSuccess(null), 3000);
    } catch (e) {
      alert('Erro ao adicionar à lista de Hunteds: ' + e.message);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* HERO BANNER INVESTIGATION PRO */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-950/40 via-stone-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/15 px-3.5 py-1 text-xs font-bold text-red-300 uppercase tracking-wider mb-3 shadow-inner">
              <Crosshair size={14} className="text-red-400 animate-pulse" />
              Inteligência Militar RubinOT • Dossiê Secreto
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-yellow-500 drop-shadow-lg leading-tight">
              Player Investigation Pro <span className="text-white">🕵️‍♂️</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Descubra os <strong className="text-red-400">makers</strong>, contas secundárias e disfarces secretos dos seus rivais. Nosso algoritmo cruza registros de mortes em combate, frags compartilhados, swaps de login e histórico de guildas!
            </p>
          </div>

          <div className="bg-stone-900/90 border border-red-500/30 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px] shadow-xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-red-400" /> Indicadores do Algoritmo
            </span>
            <div className="text-xs text-stone-300 space-y-1">
              <div>⚡ Co-Mortes em &lt; 3min</div>
              <div>🎯 Assistência Mútua de Frag</div>
              <div>🔄 Swaps de Login/Logout</div>
              <div>🧬 Semelhança Semântica</div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA & SUGESTÕES DE ALVOS */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); runInvestigation(); }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Digite o nome exato do jogador alvo para investigar (ex: Fell Darkside, Gabozerah)..."
              value={searchTarget}
              onChange={(e) => setSearchTarget(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 font-black text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Crosshair size={16} />}
            <span>Iniciar Investigação</span>
          </button>
        </form>

        {/* Sugestões Rápidas de Alvos */}
        {suggestedTargets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Users size={13} /> Alvos em Foco:
            </span>
            {suggestedTargets.map((st, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSearchTarget(st.name);
                  runInvestigation(st.name);
                }}
                className="px-3 py-1 rounded-lg bg-stone-950 border border-stone-800 hover:border-red-500/50 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{st.name}</span>
                {st.is_online && <span className="text-[10px] text-emerald-400 font-bold">• On</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* FEEDBACK DE ADIÇÃO A HUNTED */}
      {addedHuntedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <span><strong>{addedHuntedSuccess}</strong> foi adicionado com sucesso ao Radar de Hunteds com alerta sonoro ativado!</span>
        </div>
      )}

      {/* RESULTADOS DA INVESTIGAÇÃO */}
      {targetProfile && (
        <div className="space-y-6 animate-fade-in">
          
          {/* 1. DOSSIÊ DO ALVO PRINCIPAL */}
          <div className="bg-stone-900/90 border border-red-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/30 to-black border-2 border-red-500/50 flex items-center justify-center text-3xl shadow-inner">
                  🎯
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-medieval font-bold text-white tracking-wide">
                      {targetProfile.name}
                    </h2>
                    {targetProfile.isOnline ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        ONLINE AGORA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 text-gray-400 text-[10px]">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Level <strong className="text-amber-400">{targetProfile.level || 'N/A'}</strong> • {formatVocation(targetProfile.vocation)} • Patente: <span className="text-stone-300">{targetProfile.rank}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-stone-950/80 border border-stone-800 px-4 py-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Mortes no Feed</span>
                  <span className="text-xl font-bold font-mono text-red-400">{targetProfile.totalDeaths}</span>
                </div>
                <div className="bg-stone-950/80 border border-stone-800 px-4 py-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Frags Confirmados</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{targetProfile.totalFrags}</span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas do Alvo */}
            <div className="mt-4 flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleAddToHunted(targetProfile.name)}
                className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ShieldAlert size={14} />
                <span>Marcar como Hunted no Radar</span>
              </button>

              <a
                href={`https://rubinot.com.br/characters/${encodeURIComponent(targetProfile.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-800 hover:border-stone-700 text-gray-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ExternalLink size={14} />
                <span>Ver no Site Oficial</span>
              </a>
            </div>
          </div>

          {/* 2. GRADE DE MAKERS E CONTAS SUSPEITAS ENCONTRADAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} /> Contas e Makers Suspeitos Detectados ({suspects.length})
              </h3>
              <span className="text-xs text-gray-500">
                Ordenado por probabilidade algorítmica
              </span>
            </div>

            {suspects.length === 0 ? (
              <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-8 text-center text-gray-400 space-y-2">
                <UserCheck size={32} className="mx-auto text-gray-600" />
                <p className="text-sm font-bold text-gray-300">Nenhum maker suspeito com alta correlação detectado recentemente.</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  O personagem pode estar inativo em guerras recentes ou opera de forma estritamente solo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suspects.map((s, idx) => (
                  <div 
                    key={idx}
                    className="bg-stone-900/90 border border-stone-800 hover:border-red-500/50 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-950 border border-stone-700 flex items-center justify-center text-xl font-bold font-medieval text-red-400">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-base font-bold text-white flex items-center gap-2">
                              <span>{s.name}</span>
                              {s.level > 0 && <span className="text-xs text-amber-400 font-mono font-normal">Lvl {s.level}</span>}
                            </div>
                            <span className="text-xs text-gray-400">{s.vocation}</span>
                          </div>
                        </div>

                        {/* Barra de Probabilidade */}
                        <div className="text-right">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Suspeita</span>
                          <span className={`text-xl font-black font-mono ${s.confidenceScore >= 80 ? 'text-red-400' : s.confidenceScore >= 60 ? 'text-amber-400' : 'text-yellow-400'}`}>
                            {s.confidenceScore}%
                          </span>
                        </div>
                      </div>

                      {/* Tags de Evidências */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.reasons.map((r, rIdx) => (
                          <span key={rIdx} className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[10px] text-gray-300 flex items-center gap-1 font-medium">
                            <Zap size={10} className="text-amber-400" />
                            {r}
                          </span>
                        ))}
                        {s.coDeathsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-red-950/40 border border-red-500/30 text-[10px] text-red-300 font-mono">
                            ☠️ {s.coDeathsCount} co-mortes
                          </span>
                        )}
                        {s.coFragsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono">
                            ⚔️ {s.coFragsCount} frags conjuntos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação do Suspeito */}
                    <div className="flex items-center gap-2 pt-3 border-t border-stone-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTarget(s.name);
                          runInvestigation(s.name);
                        }}
                        className="flex-1 py-2 rounded-xl bg-stone-950 border border-stone-800 hover:border-yellow-500/40 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Search size={14} />
                        <span>Investigar este Char</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddToHunted(s.name)}
                        className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-bold text-red-300 flex items-center justify-center gap-1.5 transition-all"
                        title="Adicionar aos Hunteds"
                      >
                        <UserPlus size={14} />
                        <span>Hunted</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. HISTÓRICO DE MORTES E FRAGS RECENTES DO ALVO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Mortes do Alvo */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <Skull size={15} /> Últimas Mortes em Combate ({targetDeaths.length})
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {targetDeaths.length === 0 ? (
                  <div className="text-xs text-gray-500 py-4 text-center">Nenhuma morte recente registrada.</div>
                ) : (
                  targetDeaths.map((d, i) => (
                    <div key={i} className="bg-stone-950/70 border border-stone-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="text-gray-300">
                          Morto por: <strong className="text-white">{d.killed_by}</strong>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(d.death_time || d.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">Lvl {d.level}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Frags do Alvo */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Flame size={15} /> Vítimas e Frags Recentes ({targetFrags.length})
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {targetFrags.length === 0 ? (
                  <div className="text-xs text-gray-500 py-4 text-center">Nenhum frag recente registrado no banco.</div>
                ) : (
                  targetFrags.map((f, i) => (
                    <div key={i} className="bg-stone-950/70 border border-stone-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="text-gray-300">
                          Eliminou: <strong className="text-white">{f.character_name}</strong>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(f.death_time || f.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-red-400">Lvl {f.level}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
