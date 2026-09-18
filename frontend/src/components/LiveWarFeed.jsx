import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Skull, Flame, Swords, Clock, Share2, Copy, Check, 
  ExternalLink, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { parseUtcDate, toBrtTimeStr } from '../lib/tibiaUtils';

export default function LiveWarFeed({ onPlayerClick, onNavigate }) {
  const [frags, setFrags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchFrags = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_deaths')
        .select('id, character_name, level, killed_by, death_time, world')
        .order('death_time', { ascending: false })
        .limit(8);

      if (!error && data) {
        setFrags(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrags();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchFrags();
    }, 60 * 1000); // 60s
    return () => clearInterval(interval);
  }, []);

  const isPvP = (frag) => {
    const kb = (frag.killed_by || '').toLowerCase();
    return !kb.includes('a ') && !kb.includes('an ') && !kb.includes('dragon') && !kb.includes('demon') && !kb.includes('skeleton');
  };

  const copyFragShare = (frag) => {
    const text = `⚔️ FRAG NO RUBINOT!\nVitima: ${frag.character_name} (Level ${frag.level || '?'})\nEliminado por: ${frag.killed_by}\nMundo: ${frag.world || 'Rubinot'}\nVeja no comparador: https://trackerplanilha.vercel.app/versus?p1=${encodeURIComponent(frag.killed_by)}&p2=${encodeURIComponent(frag.character_name)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(frag.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-black/70 border border-red-900/40 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex justify-between items-center border-b border-red-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h3 className="text-base font-medieval text-red-400 flex items-center gap-1.5">
            <Flame className="text-orange-500" size={18} />
            Mural de Frags ao Vivo (Feed de Treta)
          </h3>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('attendance')}
          className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors font-bold"
        >
          Ver Killboard Completo <ArrowRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {frags.map(frag => {
          const pvp = isPvP(frag);
          const timeStr = toBrtTimeStr(frag.death_time);

          return (
            <div 
              key={frag.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                pvp ? 'bg-red-950/30 border-red-500/40 hover:border-red-400' : 'bg-black/50 border-white/5'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg shrink-0 ${pvp ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                  {pvp ? <Swords size={16} /> : <Skull size={16} />}
                </div>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => onPlayerClick && onPlayerClick(frag.character_name, frag.world)}
                      className="text-xs font-bold text-white hover:text-yellow-400 truncate"
                    >
                      {frag.character_name}
                    </button>
                    <span className="text-[10px] text-gray-400 font-mono">lvl {frag.level || '?'}</span>
                    {pvp && (
                      <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-bold uppercase">
                        PvP
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    por <strong className="text-yellow-300 font-semibold">{frag.killed_by}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-500 font-mono">{timeStr}</span>
                <button
                  onClick={() => copyFragShare(frag)}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  title="Copiar frag para Discord / WhatsApp"
                >
                  {copiedId === frag.id ? <Check size={13} className="text-green-400" /> : <Share2 size={13} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
