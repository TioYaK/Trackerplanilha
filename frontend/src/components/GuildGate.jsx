import React from 'react';
import { Shield, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export default function GuildGate({ 
  featureName = 'Área Restrita da Guilda', 
  onLogin,
  onNavigate 
}) {
  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto w-full animate-fade-in text-center my-12">
      <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/30 bg-black/80 p-8 shadow-2xl backdrop-blur-md">
        
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-500/40 bg-yellow-950/40 text-yellow-400 mx-auto mb-5 shadow-lg">
          <Shield size={36} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">
          <Lock size={12} /> Acesso de Guilda
        </div>

        <h3 className="text-2xl sm:text-3xl font-medieval text-gradient-gold mb-3">
          {featureName}
        </h3>

        <p className="text-gray-300 font-sans text-sm leading-relaxed max-w-md mx-auto mb-8">
          Esta área é restrita aos membros da guilda. Faça login com o seu personagem para acessar agendamentos de respawn, banco e relatórios táticos de war.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onLogin}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 px-6 py-3 text-sm font-bold text-black shadow-lg transition-all active:scale-95"
          >
            <LogIn size={16} /> Entrar / Criar Conta
          </button>
          
          <button
            onClick={() => onNavigate && onNavigate('live')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-gray-900/60 hover:bg-gray-800 border border-gray-700 px-6 py-3 text-sm font-bold text-gray-300 transition-all"
          >
            <ArrowLeft size={16} /> Voltar para o Início
          </button>
        </div>

      </div>
    </div>
  );
}
