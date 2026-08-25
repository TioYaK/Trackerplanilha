import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Mail, Lock, User, Crosshair, Headphones, LogIn, UserPlus } from 'lucide-react';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mainCharacter, setMainCharacter] = useState('');
  const [ts3Nickname, setTs3Nickname] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Validação da Guilda antes de registrar!
        const { data: roster, error: rosterErr } = await supabase
          .from('view_guild_roster')
          .select('name')
          .ilike('name', mainCharacter) // case insensitive
          .limit(1);
          
        if (rosterErr) throw rosterErr;
        
        if (!roster || roster.length === 0) {
          throw new Error('Personagem não encontrado na guilda. Verifique o nick ou procure um Admin.');
        }

        await register({ email, password, name, mainCharacter, ts3Nickname });
        setSuccessMsg('Cadastro realizado com sucesso! Sua conta está PENDENTE e aguardando aprovação de um Administrador.');
        setIsLogin(true); // Volta pro login
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern flex items-center justify-center p-4">
      <div className="bg-black/80 border-2 border-tibia-border rounded-lg shadow-tibia-glow max-w-md w-full p-8 relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tibia-highlight to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/stone-texture.png')] opacity-20 pointer-events-none mix-blend-overlay"></div>

        <div className="text-center mb-8 relative z-10">
          <Shield className="w-16 h-16 text-tibia-highlight mx-auto mb-4" />
          <h2 className="text-3xl font-medieval text-white drop-shadow-md">
            BattleStorm <span className="text-tibia-highlight">Tracker</span>
          </h2>
          <p className="text-gray-400 font-sans mt-2">Área Restrita aos Membros da Guilda</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 font-sans text-sm relative z-10">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded mb-6 font-sans text-sm relative z-10">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {!isLogin && (
            <>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Seu Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-tibia-border rounded pl-10 pr-3 py-2 text-white font-sans focus:outline-none focus:border-tibia-highlight transition-colors"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Crosshair className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nick no Jogo (Personagem Main)"
                  value={mainCharacter}
                  onChange={(e) => setMainCharacter(e.target.value)}
                  className="w-full bg-black/50 border border-tibia-border rounded pl-10 pr-3 py-2 text-white font-sans focus:outline-none focus:border-tibia-highlight transition-colors"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Headphones className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nick no TS3"
                  value={ts3Nickname}
                  onChange={(e) => setTs3Nickname(e.target.value)}
                  className="w-full bg-black/50 border border-tibia-border rounded pl-10 pr-3 py-2 text-white font-sans focus:outline-none focus:border-tibia-highlight transition-colors"
                />
              </div>
            </>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="email"
              required
              placeholder="Seu E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-tibia-border rounded pl-10 pr-3 py-2 text-white font-sans focus:outline-none focus:border-tibia-highlight transition-colors"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="password"
              required
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-tibia-border rounded pl-10 pr-3 py-2 text-white font-sans focus:outline-none focus:border-tibia-highlight transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tibia-primary hover:bg-tibia-highlight text-black font-medieval text-lg py-3 rounded transition-colors shadow-tibia-glow flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <span className="animate-pulse">Aguarde...</span>
            ) : (
              isLogin ? <><LogIn size={20} /> Entrar no Sistema</> : <><UserPlus size={20} /> Solicitar Cadastro</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMsg('');
            }}
            className="text-gray-400 hover:text-tibia-highlight font-sans text-sm underline transition-colors"
          >
            {isLogin ? "Membro novo? Registre-se aqui" : "Já tem conta? Faça login"}
          </button>
        </div>
      </div>
    </div>
  );
}
