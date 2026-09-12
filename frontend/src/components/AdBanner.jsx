import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, Shield, X } from 'lucide-react';

/**
 * AdBanner Component
 * Suporta Google AdSense (com tratamento seguro para SPAs React) e
 * fallback elegante para Banners de Afiliados / Patrocinadores da Guilda.
 */
export default function AdBanner({
  slot = import.meta.env.VITE_ADSENSE_SLOT || null,
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6600830490965208',
  format = 'auto', // 'horizontal', 'rectangle', 'auto'
  responsive = true,
  className = '',
  customTitle = 'Compre Tibia Coins com Entrega Rápida & Desconto',
  customSubtitle = 'Parceiro Oficial da Guilda • Suprimentos de Hunt, Bless e Venda Segura',
  customLink = 'https://discord.gg',
  customButtonText = 'Ver Ofertas',
  allowDismiss = true,
}) {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adBlocked, setAdBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Considera AdSense ativo no bloco quando houver um slot numérico válido criado no AdSense
  const hasValidSlot = slot && slot !== '1234567890' && /^\d+$/.test(slot);

  useEffect(() => {
    if (!hasValidSlot || dismissed) return;

    // Inicializa o anúncio no slot com segurança para SPAs
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (err) {
        // Ignora erro de slot duplicado ou bloqueado no React
        setAdBlocked(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slot, hasValidSlot, dismissed]);

  if (dismissed) return null;

  // Se o AdSense estiver configurado com credenciais válidas e não bloqueado, renderiza o slot do Google
  if (hasValidSlot && !adBlocked) {
    return (
      <div className={`relative my-4 overflow-hidden rounded-lg border border-yellow-500/20 bg-black/60 p-2 text-center shadow-lg ${className}`}>
        {allowDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 z-10 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            title="Ocultar anúncio"
          >
            <X size={14} />
          </button>
        )}
        <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500 font-sans">
          Publicidade / Google AdSense
        </div>
        <div ref={adRef} className="flex items-center justify-center min-h-[90px]">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '90px', width: '100%' }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>
      </div>
    );
  }

  // Fallback Elegante de Afiliado / Patrocinador Gamer (Exibido enquanto não tiver AdSense aprovado ou se bloqueado)
  return (
    <div className={`relative my-3 overflow-hidden rounded-lg border border-tibia-gold/40 bg-gradient-to-r from-yellow-950/40 via-black/80 to-amber-950/40 p-3 shadow-xl backdrop-blur-sm transition-all hover:border-tibia-gold/70 ${className}`}>
      {allowDismiss && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Ocultar banner"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4">
        {/* Lado Esquerdo: Ícone e Texto do Patrocinador */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-tibia-gold/50 bg-black/60 text-yellow-400 shadow-inner">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/30">
                Parceiro Oficial
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Shield size={10} /> Espaço Publicitário
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-medieval text-gradient-gold font-bold leading-tight mt-0.5">
              {customTitle}
            </h4>
            <p className="text-xs text-gray-300 font-sans">
              {customSubtitle}
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão Call to Action */}
        <div className="flex items-center gap-2">
          <a
            href={customLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 px-3.5 py-1.5 text-xs font-bold text-black shadow-md transition-all hover:scale-105 active:scale-95"
          >
            {customButtonText}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
