import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  X, Download, Copy, Check, Share2, Sparkles, Shield, 
  Trophy, Flame, Globe, Swords, ExternalLink 
} from 'lucide-react';
import { soundFX } from '../lib/soundEffects';

export default function PlayerCardShareModal({
  playerName,
  charInfo,
  selectedWorld,
  tierBadge,
  globalRank,
  totalTracked,
  rusherInfo,
  recentDeaths,
  avatarUrl,
  onClose
}) {
  const cardRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Geração do Canvas em Alta Resolução (Scale 2x)
  const generateCanvas = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#0a0a0c',
      useCORS: true,
      allowTaint: false,
      logging: false
    });
  };

  // Copiar Imagem Diretamente para a Área de Transferência (Pronto para Ctrl+V no Discord/WhatsApp)
  const handleCopyImage = async () => {
    setCopying(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Falha ao capturar card");

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Erro ao gerar blob");
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          soundFX.playTacticalPing();
          setTimeout(() => setCopied(false), 3500);
        } catch (clipboardErr) {
          // Fallback se navigator.clipboard.write([ClipboardItem]) não for suportado
          const dataUrl = canvas.toDataURL('image/png');
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${dataUrl}" alt="${playerName}" />`);
          } else {
            alert('Não foi possível copiar diretamente. Use o botão de Baixar PNG.');
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Erro ao copiar card:', err);
      alert('Houve um erro ao processar a imagem do card.');
    } finally {
      setCopying(false);
    }
  };

  // Baixar Arquivo PNG em Alta Resolução
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `rubinot-${playerName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      soundFX.playTacticalPing();
    } catch (err) {
      console.error('Erro ao baixar card:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Copiar Link Direto do Jogador
  const handleCopyLink = () => {
    const url = `https://trackerplanilha.vercel.app/player/${encodeURIComponent(playerName)}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    soundFX.playTacticalPing();
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-neutral-950 border border-yellow-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header do Modal */}
        <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-yellow-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Compartilhar Card do Jogador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pré-visualização do Card */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-black/40">
          
          {/* Card Gamer Renderizável (alvo do html2canvas) */}
          <div 
            ref={cardRef}
            className="w-full max-w-[440px] rounded-2xl p-5 border-2 border-yellow-500/50 relative overflow-hidden shadow-2xl text-left font-sans"
            style={{
              background: 'linear-gradient(145deg, #161208 0%, #0d0e12 50%, #08080a 100%)'
            }}
          >
            {/* Linha Dourada de Destaque no Topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600" />

            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-bold text-xs font-medieval">
                  R
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-yellow-400 font-mono">
                    RUBINOT TRACKER
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">Dossiê de Telemetria</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-yellow-300 font-mono">
                <Globe size={11} className="text-yellow-400" />
                <span>{selectedWorld || 'RubinOT'}</span>
              </div>
            </div>

            {/* Perfil Principal: Avatar + Nome + Vocação */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/30 via-amber-700/20 to-black border-2 border-yellow-500/60 flex items-center justify-center text-yellow-300 font-medieval font-bold text-2xl shadow-inner">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <span 
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
                    charInfo?.isOnline ? 'bg-green-500 shadow shadow-green-500/50' : 'bg-stone-600'
                  }`}
                  title={charInfo?.isOnline ? 'Online' : 'Offline'}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-xl font-medieval font-bold text-white tracking-wide truncate leading-tight">
                  {playerName}
                </h4>
                
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold font-mono border border-yellow-500/30">
                    Lvl {charInfo?.level || '?'}
                  </span>
                  <span className="text-gray-300 text-[11px] font-medium truncate">
                    {charInfo?.vocation || 'Guerreiro'}
                  </span>
                </div>

                {charInfo?.guildName && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300/80 font-sans truncate">
                    <Shield size={11} className="text-yellow-400 shrink-0" />
                    <span className="truncate">{charInfo.guildName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid com 4 Estatísticas Gamer */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              
              {/* Box 1: Ranking */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[9px] uppercase font-mono text-gray-400 flex items-center gap-1">
                  <Trophy size={11} className="text-yellow-400" /> Rank Global
                </div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {globalRank ? `#${globalRank}` : 'Top 500'}
                  {totalTracked && globalRank && (
                    <span className="text-[10px] text-yellow-400 font-normal ml-1">
                      (Top {((globalRank / totalTracked) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Box 2: Título Gamer / Tier */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[9px] uppercase font-mono text-gray-400 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> Patente
                </div>
                <div className="text-xs font-bold text-amber-300 font-sans mt-0.5 truncate">
                  {tierBadge?.title || 'Guerreiro Rubinot'}
                </div>
              </div>

              {/* Box 3: Rush XP 24h */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[9px] uppercase font-mono text-gray-400 flex items-center gap-1">
                  <Flame size={11} className="text-orange-400" /> Rush 24h
                </div>
                <div className="text-sm font-bold text-orange-400 font-mono mt-0.5">
                  {rusherInfo ? `+${(rusherInfo.exp_gained / 1000000).toFixed(1)}M XP` : 'Ativo'}
                </div>
              </div>

              {/* Box 4: Status / Combate */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                <div className="text-[9px] uppercase font-mono text-gray-400 flex items-center gap-1">
                  <Swords size={11} className="text-red-400" /> Status PvP
                </div>
                <div className="text-xs font-bold text-gray-200 mt-0.5 truncate">
                  {charInfo?.isHunted ? (
                    <span className="text-red-400">⚠️ Hunted Ativo</span>
                  ) : charInfo?.isOnline ? (
                    <span className="text-green-400">🟢 Online no Server</span>
                  ) : (
                    <span className="text-stone-400">Pronto p/ Batalha</span>
                  )}
                </div>
              </div>

            </div>

            {/* Rodapé do Card */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[9px] text-gray-500 font-mono">
              <span>trackerplanilha.vercel.app</span>
              <span>{currentDate} • {currentTime}</span>
            </div>

          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 bg-black/80 border-t border-white/10 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            
            {/* Copiar Imagem */}
            <button
              onClick={handleCopyImage}
              disabled={copying}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                  : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black shadow-lg shadow-yellow-500/20 hover:scale-[1.02]'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Card Copiado! (Cole no Discord)</span>
                </>
              ) : copying ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Gerando Imagem...</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Card (Imagem)</span>
                </>
              )}
            </button>

            {/* Baixar PNG */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Baixando...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Baixar PNG em Alta Resolução</span>
                </>
              )}
            </button>

          </div>

          {/* Copiar Link Direto */}
          <button
            onClick={handleCopyLink}
            className="w-full py-2 px-3 rounded-lg bg-black/40 hover:bg-white/5 border border-white/5 text-gray-400 hover:text-yellow-400 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {linkCopied ? (
              <>
                <Check size={13} className="text-green-400" />
                <span className="text-green-400">Link copiado para a área de transferência!</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>Copiar link do dossiê: trackerplanilha.vercel.app/player/{playerName}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
