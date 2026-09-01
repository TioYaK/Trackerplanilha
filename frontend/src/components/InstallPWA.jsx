import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (!deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center px-3 py-1.5 rounded border bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border-blue-900/50 cursor-pointer transition-colors"
      title="Instalar App Mobile/Desktop"
    >
      <Download size={16} className="mr-0 sm:mr-2" />
      <span className="text-xs font-bold uppercase hidden sm:inline">Instalar App</span>
    </button>
  );
}