import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export default function PushNotificationBell() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setLoading(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const urlB64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const toggleSubscription = async () => {
    if (!user) return alert('Faça login primeiro.');
    setLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (isSubscribed) {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await supabase.from('push_subscriptions').delete().eq('user_email', user.email);
        }
        setIsSubscribed(false);
        alert('Notificações desativadas!');
      } else {
        // Subscribe
        const { data: config } = await supabase.from('worker_config').select('vapid_public_key').eq('id', 1).maybeSingle();
        if (!config || !config.vapid_public_key) {
           alert('Chaves VAPID não configuradas no servidor.');
           setLoading(false);
           return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(config.vapid_public_key)
        });

        // Save to Supabase
        await supabase.from('push_subscriptions').upsert({
          user_email: user.email,
          subscription: JSON.parse(JSON.stringify(subscription))
        });

        setIsSubscribed(true);
        alert('Notificações ativadas com sucesso! Você receberá os alertas de Guerra e Bosses.');
      }
    } catch (e) {
      console.error(e);
      if (e.message.includes('permission denied')) {
        alert('Permissão negada. Por favor, libere as notificações nas configurações do seu navegador.');
      } else {
        alert('Erro ao ativar notificações: ' + e.message);
      }
    }
    
    setLoading(false);
  };

  if (loading || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  return (
    <button 
      onClick={toggleSubscription}
      disabled={loading}
      className={`relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
        isSubscribed 
          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400/60' 
          : 'bg-black/60 text-gray-400 border-tibia-border hover:bg-white/5 hover:text-gray-200 hover:border-yellow-500/30'
      }`}
      title={isSubscribed ? 'Alertas de Guerra & Invasão Ativos (Clique para desativar)' : 'Ativar Notificações & Alertas de Guerra'}
    >
      <div className="relative flex items-center justify-center">
        {isSubscribed ? (
          <>
            <Bell size={14} className="text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </>
        ) : (
          <BellOff size={14} className="text-gray-500" />
        )}
      </div>
      <span className="hidden md:inline font-mono text-[11px]">
        {isSubscribed ? 'Alertas ON' : 'Alertas'}
      </span>
    </button>
  );
}
