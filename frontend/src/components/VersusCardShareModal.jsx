import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { 
  X, Download, Copy, Check, Share2, Swords, Shield, 
  Heart, Zap, Sparkles, Trophy, ExternalLink 
} from 'lucide-react';
import { soundFX } from '../lib/soundEffects';

export default function VersusCardShareModal({
  p1Data,
  p2Data,
  headToHead,
  diff,
  onClose
}) {
  const cardRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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
        } catch (err) {
          const dataUrl = canvas.toDataURL('image/png');
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${dataUrl}" alt="Versus Card" />`);
          } else {
            alert('Não foi possível copiar diretamente. Use o botão de Baixar PNG.');
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Erro ao copiar card versus:', err);
      alert('Houve um erro ao processar o card de duelo.');
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `versus-${p1Data?.name?.toLowerCase()}-vs-${p2Data?.name?.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      soundFX.playTacticalPing();
    } catch (err) {
      console.error('Erro ao baixar card versus:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `https://trackerplanilha.vercel.app/versus?p1=${encodeURIComponent(p1Data?.name || '')}&p2=${encodeURIComponent(p2Data?.name || '')}`;
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
        className="relative w-full max-w-2xl bg-neutral-950 border border-yellow-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header do Modal */}
        <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-red-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Card de Confronto Versus 1v1
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pré-visualização do Card */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-black/40">
          
          {/* Card Renderizável em Alta Resolução */}
          <div 
            ref={cardRef}
            className="w-full max-w-[560px] rounded-2xl p-5 border-2 border-yellow-500/50 relative overflow-hidden shadow-2xl text-left font-sans"
            style={{
              background: 'linear-gradient(145deg, #130909 0%, #0d0e12 50%, #090e16 100%)'
            }}
          >
            {/* Faixa Superior com Efeito Duelo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500" />

            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-xs">
                  ⚔️
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-yellow-400 font-mono">
                    RUBINOT TRACKER • CONFRONTO 1V1
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">Simulador de Duelo Oficial</div>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-[10px] font-bold text-red-300 font-mono uppercase tracking-wider">
                Warmode Live
              </div>
            </div>

            {/* Layout dos Dois Guerreiros com VS no Meio */}
            <div className="grid grid-cols-11 gap-2 items-center mb-4">
              
              {/* Guerreiro 1 (Esquerda) */}
              <div className="col-span-5 p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 relative overflow-hidden text-left">
                <div className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono mb-1">
                  Guerreiro 1
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-medieval font-bold text-lg shrink-0">
                    {p1Data?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medieval font-bold text-white truncate">
                      {p1Data?.name}
                    </h4>
                    <div className="text-[10px] text-gray-300 truncate">
                      {p1Data?.vocation}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-yellow-400 font-bold">
                    <span>Nível:</span>
                    <span>Lvl {p1Data?.level}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>HP Máx:</span>
                    <span>{p1Data?.vitals?.hp?.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-blue-300">
                    <span>Mana Máx:</span>
                    <span>{p1Data?.vitals?.mana?.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Mundo:</span>
                    <span>{p1Data?.world}</span>
                  </div>
                </div>
              </div>

              {/* Emblema VS no Meio */}
              <div className="col-span-1 flex flex-col items-center justify-center py-2">
                <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 font-black text-xs shadow-lg shadow-red-500/30 animate-pulse">
                  VS
                </div>
                {headToHead && (headToHead.p1Kills > 0 || headToHead.p2Kills > 0) ? (
                  <div className="text-[9px] font-mono text-yellow-400 mt-2 font-bold whitespace-nowrap">
                    {headToHead.p1Kills} x {headToHead.p2Kills}
                  </div>
                ) : (
                  <div className="text-[8px] font-mono text-gray-500 mt-2 whitespace-nowrap">
                    0 x 0
                  </div>
                )}
              </div>

              {/* Guerreiro 2 (Direita) */}
              <div className="col-span-5 p-3 rounded-xl bg-red-950/30 border border-red-500/30 relative overflow-hidden text-right">
                <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 font-mono mb-1">
                  Guerreiro 2
                </div>
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <div className="min-w-0">
                    <h4 className="text-sm font-medieval font-bold text-white truncate">
                      {p2Data?.name}
                    </h4>
                    <div className="text-[10px] text-gray-300 truncate">
                      {p2Data?.vocation}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 font-medieval font-bold text-lg shrink-0">
                    {p2Data?.name?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-yellow-400 font-bold">
                    <span>Lvl {p2Data?.level}</span>
                    <span>:Nível</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>{p2Data?.vitals?.hp?.toLocaleString('pt-BR')}</span>
                    <span>:HP Máx</span>
                  </div>
                  <div className="flex justify-between text-blue-300">
                    <span>{p2Data?.vitals?.mana?.toLocaleString('pt-BR')}</span>
                    <span>:Mana Máx</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{p2Data?.world}</span>
                    <span>:Mundo</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Vantagem & Diferença de XP */}
            {diff && (
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between text-xs font-mono mb-3">
                <div className="flex items-center gap-1.5 text-gray-300">
                  <Trophy size={13} className="text-yellow-400" />
                  <span>Vantagem: <strong className="text-yellow-400">{diff.levelLeader}</strong></span>
                </div>
                <div className="text-amber-300 font-bold">
                  +{diff.levelDiff} Níveis ({diff.xpDiffFormatted} XP)
                </div>
              </div>
            )}

            {/* Rodapé do Card */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[9px] text-gray-500 font-mono">
              <span>trackerplanilha.vercel.app/versus</span>
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
                  : 'bg-gradient-to-r from-red-600 via-amber-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02]'
              }`}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Card Copiado! (Cole com Ctrl+V)</span>
                </>
              ) : copying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando Card...</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Card de Duelo (Imagem)</span>
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
                <span>Copiar link do duelo: trackerplanilha.vercel.app/versus?p1={p1Data?.name}&p2={p2Data?.name}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
