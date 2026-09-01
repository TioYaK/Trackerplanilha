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
        const { data: config } = await supabase.from('worker_config').select('vapid_public_key').eq('id', 1).single();
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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
        isSubscribed 
          ? 'bg-green-900/40 text-green-400 border-green-500/50 hover:bg-green-800/60' 
          : 'bg-black/40 text-gray-400 border-gray-700 hover:bg-black/60 hover:text-white'
      }`}
      title={isSubscribed ? 'Desativar Alertas' : 'Ativar Alertas da Guilda'}
    >
      {isSubscribed ? <Bell size={14} className="animate-pulse" /> : <BellOff size={14} />}
      <span className="hidden md:inline">{isSubscribed ? 'Sirene ON' : 'Ativar Alertas'}</span>
    </button>
  );
}
