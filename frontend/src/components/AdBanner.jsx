import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, Megaphone, X } from 'lucide-react';

/**
 * AdBanner Component
 * Suporta Google AdSense oficial (com tratamento seguro para SPAs React / Vite)
 * e fallback elegante caso o anúncio não tenha inventário (unfilled) ou esteja com AdBlock.
 */
export default function AdBanner({
  slot = import.meta.env.VITE_ADSENSE_SLOT || null,
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6600830490965208',
  format = 'auto', // 'horizontal', 'rectangle', 'auto'
  responsive = true,
  className = '',
  customBadge = 'Espaço Publicitário',
  customTitle = 'Anuncie no RubinOT Tracker',
  customSubtitle = 'Divulgue sua stream, guilda, loja ou serviço para milhares de jogadores de RubinOT diariamente',
  customLink = 'https://discord.gg',
  customButtonText = 'Anuncie Conosco',
  allowDismiss = true,
}) {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adUnfilled, setAdUnfilled] = useState(false);
  const [adBlocked, setAdBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Considera AdSense configurado quando houver client válido do Google (ca-pub-...)
  const isAdSenseConfigured = client && client.startsWith('ca-pub-') && !client.includes('XXXX');
  
  // Verifica se há slot numérico específico
  const hasSpecificSlot = slot && slot !== '1234567890' && /^\d+$/.test(slot);

  useEffect(() => {
    if (!isAdSenseConfigured || dismissed) return;

    // Timeout seguro para garantir que o DOM do React esteja montado
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
          const status = adRef.current.getAttribute('data-adsbygoogle-status');
          // Só realiza o push se ainda não foi inicializado
          if (!status) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setAdLoaded(true);
          }
        }
      } catch (err) {
        console.warn('AdSense push error or adblocker detected:', err);
        setAdBlocked(true);
      }
    }, 400);

    // Observador para detectar se o Google retornou "unfilled" (sem anúncio disponível no momento)
    let observer = null;
    if (adRef.current && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
            const currentStatus = adRef.current.getAttribute('data-ad-status');
            if (currentStatus === 'unfilled') {
              setAdUnfilled(true);
            } else if (currentStatus === 'filled') {
              setAdUnfilled(false);
              setAdLoaded(true);
            }
          }
        });
      });

      observer.observe(adRef.current, { attributes: true });
    }

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [slot, isAdSenseConfigured, dismissed]);

  if (dismissed) return null;

  // Se o AdSense estiver configurado e não bloqueado por AdBlocker total:
  if (isAdSenseConfigured && !adBlocked) {
    return (
      <div className={`relative my-4 overflow-hidden rounded-2xl border border-yellow-500/25 bg-black/80 p-3 text-center shadow-2xl backdrop-blur-sm transition-all ${className}`}>
        {allowDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 z-10 rounded-lg p-1 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
            title="Ocultar anúncio"
          >
            <X size={14} />
          </button>
        )}

        <div className="mb-1 text-[9px] uppercase tracking-widest text-yellow-500/60 font-mono flex items-center justify-center gap-1">
          <Sparkles size={10} className="text-yellow-500/60" /> Publicidade Oficial • Google AdSense
        </div>

        {/* Container do Google AdSense */}
        <div className="flex items-center justify-center min-h-[90px] w-full overflow-hidden">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '90px', width: '100%' }}
            data-ad-client={client}
            {...(hasSpecificSlot ? { 'data-ad-slot': slot } : {})}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>

        {/* Se o Google estiver sem inventário no momento (unfilled), exibe fallback sutil para não ficar buraco vazio */}
        {adUnfilled && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between px-3 text-xs text-gray-400">
            <span className="text-[11px] flex items-center gap-1.5 text-gray-400">
              <Megaphone size={12} className="text-yellow-400" /> Espaço de Anúncio Disponível no RubinOT
            </span>
            <a
              href={customLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              Anuncie Aqui <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Fallback se AdBlocker estiver ativo ou AdSense desativado
  return (
    <div className={`relative my-3 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 via-black/80 to-amber-950/30 p-3 shadow-xl backdrop-blur-sm transition-all hover:border-yellow-500/50 ${className}`}>
      {allowDismiss && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Ocultar banner"
        >
          <X size={14} />
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/40 bg-black/60 text-yellow-400 shadow-inner">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400 border border-yellow-500/30">
                {customBadge}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Megaphone size={10} /> Destaque Sua Marca
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

        <div className="flex items-center gap-2">
          <a
            href={customLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 px-3.5 py-1.5 text-xs font-bold text-black shadow-md transition-all hover:scale-105 active:scale-95"
          >
            {customButtonText}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
