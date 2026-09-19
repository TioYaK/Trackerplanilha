import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { detectLocalWorker } from '../lib/workerClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return Object.keys(localStorage).some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    }
    return false;
  });

  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação (Login, Logout, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Erro ao buscar profile:', err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const register = async ({ email, password, name, mainCharacter, ts3Nickname, world, guildName }) => {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Erro ao criar usuário');

    // 2. Criar o Perfil com Acesso Imediato e Metadados de Mundo e Guilda
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        email: email,
        name: name,
        main_character: mainCharacter,
        ts3_nickname: ts3Nickname,
        status: 'active', // Acesso Imediato Liberado!
        role: 'user',
        onboarding_completed: true,
        makers: {
          _world: world || 'Auroria',
          _guild: guildName || ''
        }
      }
    ]);

    if (profileError) throw profileError;
    
    return authData.user;
  };

  const [hasActiveWorker, setHasActiveWorker] = useState(false);

  // Concede Premium automático para quem tem um worker ativo (local na porta 3001 ou remoto via heartbeat)
  useEffect(() => {
    let isMounted = true;

    const checkWorker = async () => {
      try {
        // 1. Detecção Local Instantânea (varre portas 3001 a 3005)
        if (typeof window !== 'undefined') {
          try {
            const local = await detectLocalWorker();
            if (local && local.data?.status === 'online') {
              if (isMounted) setHasActiveWorker(true);
              return;
            }
          } catch (localErr) {
            // Worker não está rodando neste localhost, segue para verificação remota
          }
        }

        // 2. Detecção Remota via Supabase (apenas se o usuário tiver identificação cadastrada)
        const charName = (profile?.main_character || '').toLowerCase();
        const pName = (profile?.name || '').toLowerCase();
        const pEmail = (profile?.email || user?.email || '').toLowerCase();

        if (!charName && !pName && !pEmail) {
          if (isMounted) setHasActiveWorker(false);
          return;
        }

        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('worker_heartbeats')
          .select('worker_id, metadata')
          .gte('last_ping', fifteenMinsAgo);

        if (data && isMounted) {
          const match = data.some(w => {
            const owner = (w.metadata?.owner || '').toLowerCase();
            return (
              owner &&
              owner !== 'anônimo' &&
              owner !== 'anonimo' &&
              (owner === charName || owner === pName || owner === pEmail || (charName && owner.includes(charName)))
            );
          });
          setHasActiveWorker(match);
        }
      } catch (e) {}
    };

    checkWorker();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      checkWorker();
    }, 3 * 60 * 1000); // 3 minutos para economia de banda (Supabase Egress Guard)
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [profile, user]);

  const isAdmin = Boolean(
    profile?.role === 'admin' || 
    profile?.role === 'super_admin' || 
    profile?.email?.toLowerCase() === 'pifot16@gmail.com' ||
    user?.email?.toLowerCase() === 'pifot16@gmail.com'
  );

  const isPremium = Boolean(
    isAdmin || 
    profile?.role === 'premium' || 
    profile?.is_premium === true || 
    hasActiveWorker
  );

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    register,
    refreshProfile,
    hasActiveWorker,
    isPremium,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
