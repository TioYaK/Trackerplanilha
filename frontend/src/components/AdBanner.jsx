import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, Megaphone, X } from 'lucide-react';

/**
 * AdBanner Component
 * Suporta Google AdSense oficial com detecção em tempo real de preenchimento (filled/unfilled)
 * e exibição imediata e elegante do anúncio/parceiro caso o Google ainda não tenha entregue anúncio no leilão.
 */
export default function AdBanner({
  slot = import.meta.env.VITE_ADSENSE_SLOT || '6915670740',
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-6600830490965208',
  format = 'auto',
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
  const containerRef = useRef(null);
  const [adFilled, setAdFilled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Considera AdSense configurado quando houver client válido do Google (ca-pub-...)
  const isAdSenseConfigured = client && client.startsWith('ca-pub-') && !client.includes('XXXX');
  
  // Garante que o slot numérico seja sempre o slot oficial do usuário (6915670740)
  const numericSlot = (slot && /^\d+$/.test(String(slot).trim())) 
    ? String(slot).trim() 
    : (import.meta.env.VITE_ADSENSE_SLOT && /^\d+$/.test(String(import.meta.env.VITE_ADSENSE_SLOT).trim()) 
        ? String(import.meta.env.VITE_ADSENSE_SLOT).trim() 
        : '6915670740');

  useEffect(() => {
    if (!isAdSenseConfigured || dismissed) return;

    let checkInterval = null;

    // Função de verificação se o Google inseriu o anúncio
    const checkFilledStatus = () => {
      if (!adRef.current) return false;
      const status = adRef.current.getAttribute('data-ad-status');
      const hasIframe = adRef.current.querySelector('iframe');
      if (status === 'filled' || hasIframe) {
        setAdFilled(true);
        return true;
      }
      return false;
    };

    // Timeout seguro para acionar o push do AdSense
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
          const status = adRef.current.getAttribute('data-adsbygoogle-status');
          if (!status) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        }
      } catch (err) {
        console.warn('AdSense push error or adblocker detected:', err);
      }

      // Checagem imediata e recorrente nos primeiros 3 segundos
      checkFilledStatus();
      let checksCount = 0;
      checkInterval = setInterval(() => {
        checksCount++;
        if (checkFilledStatus() || checksCount > 6) {
          clearInterval(checkInterval);
        }
      }, 500);
    }, 300);

    // MutationObserver para observar alterações no elemento <ins>
    let observer = null;
    if (adRef.current && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        checkFilledStatus();
      });

      observer.observe(adRef.current, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      if (checkInterval) clearInterval(checkInterval);
      if (observer) observer.disconnect();
    };
  }, [numericSlot, isAdSenseConfigured, dismissed]);

  if (dismissed) return null;

  return (
    <div 
      ref={containerRef}
      className={`relative my-3 overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 via-black/80 to-amber-950/30 p-3 shadow-xl backdrop-blur-sm transition-all hover:border-yellow-500/50 ${className}`}
    >
      {allowDismiss && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 z-20 rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Ocultar anúncio"
        >
          <X size={14} />
        </button>
      )}

      {/* Rótulo de identificação de publicidade */}
      <div className="mb-1 text-[9px] uppercase tracking-widest text-yellow-500/60 font-mono flex items-center justify-center sm:justify-start gap-1">
        <Sparkles size={10} className="text-yellow-500/60" /> 
        {adFilled ? 'Publicidade Oficial • Google AdSense' : customBadge}
      </div>

      {/* CONTAINER DO GOOGLE ADSENSE (visível para o crawler do Google poder medir o slot) */}
      {isAdSenseConfigured && (
        <div className={`w-full overflow-hidden flex items-center justify-center ${adFilled ? 'min-h-[90px] py-1' : (adRef.current?.getAttribute('data-ad-status') === 'unfilled' ? 'hidden' : 'min-h-[1px]')}`}>
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: adFilled ? '90px' : '1px' }}
            data-ad-client={client}
            {...(numericSlot ? { 'data-ad-slot': numericSlot } : {})}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>
      )}

      {/* CONTEÚDO ELEGANTE DE DESTAQUE / SPONSOR (Exibido enquanto o Google ainda não preencheu o espaço) */}
      {!adFilled && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4 py-1 animate-fade-in">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/40 bg-black/60 text-yellow-400 shadow-inner shrink-0">
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

          <div className="flex items-center gap-2 shrink-0">
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
      )}
    </div>
  );
}
