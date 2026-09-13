import React from 'react';
import { Shield, Server, Users, Zap, Globe, Heart, ArrowLeft, ExternalLink, Cpu } from 'lucide-react';
import { WORLDS_LIST } from '../context/WorldContext';

export default function AboutUs({ onNavigate }) {
  return (
    <div className="p-4 sm:p-8 w-full max-w-4xl mx-auto text-gray-200 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        {onNavigate && (
          <button
            onClick={() => onNavigate('home')}
            className="mb-4 inline-flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar à Página Inicial
          </button>
        )}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Globe size={14} /> Sobre a Plataforma
        </div>
        <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
          Sobre o Rubinot Tracker
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          A inteligência analítica em tempo real e gestão de combate para a comunidade do Rubinot.
        </p>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-8 bg-tibia-card border-2 border-tibia-border rounded-xl p-6 sm:p-8 shadow-xl text-sm leading-relaxed">
        
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Shield size={18} className="text-yellow-400" />
            Nossa Missão
          </h2>
          <p className="text-gray-300">
            O <strong>Rubinot Tracker</strong> foi criado por jogadores veteranos para preencher a lacuna de ferramentas modernas de telemetria analítica, rastreamento de frags e gerenciamento de alianças e caçadas.
          </p>
          <p className="text-gray-300 mt-2">
            Nossa missão é democratizar o acesso a dados estratégicos e estatísticos de qualidade profissional, permitindo que líderes de guildas, estrategistas de guerra e jogadores individuais acompanhem a evolução dos servidores com máxima precisão e agilidade.
          </p>
        </section>

        {/* Estatísticas e Arquitetura */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-center">
            <Server className="mx-auto text-yellow-400 mb-2" size={24} />
            <div className="text-2xl font-bold font-medieval text-white">16 Mundos</div>
            <div className="text-xs text-gray-400">Cobertura Total no Rubinot</div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-center">
            <Cpu className="mx-auto text-cyan-400 mb-2" size={24} />
            <div className="text-2xl font-bold font-medieval text-white">Zero-Trust</div>
            <div className="text-xs text-gray-400">Telemetria Distribuída</div>
          </div>
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-center">
            <Zap className="mx-auto text-green-400 mb-2" size={24} />
            <div className="text-2xl font-bold font-medieval text-white">Tempo Real</div>
            <div className="text-xs text-gray-400">Sincronização Instantânea</div>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Cpu size={18} className="text-cyan-400" />
            Arquitetura Técnica e Segurança
          </h2>
          <p className="text-gray-300">
            A plataforma opera em arquitetura de <strong>Zero-Trust Telemetry Ingestion</strong>. Os dados públicos de jogadores, mortes e pontuações são coletados por robôs distribuídos e validados contra regras rigorosas de integridade antes de serem persistidos e distribuídos aos usuários via WebSockets e APIs REST.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Globe size={18} className="text-yellow-400" />
            Mundos Suportados ({WORLDS_LIST.filter(w => w.id !== 'ALL').length} Servidores)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {WORLDS_LIST.filter(w => w.id !== 'ALL').map(w => (
              <div key={w.id} className="p-2 rounded bg-black/40 border border-white/10 flex items-center gap-2">
                <span>{w.icon}</span>
                <div>
                  <span className="font-bold text-white">{w.name}</span>
                  <div className="text-[10px] text-gray-400">{w.type}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-4 border-t border-white/10">
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight mb-2 flex items-center gap-2">
            <Heart size={18} className="text-red-400" />
            Comunidade & Apoio
          </h2>
          <p className="text-gray-300">
            O Rubinot Tracker é sustentado pelo apoio voluntário da comunidade de guildas e por receitas publicitárias veiculadas em conformidade com as diretrizes do Google AdSense. Para sugerir melhorias, reportar inconsistências ou solicitar acesso especial à API para o seu bot:
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="https://discord.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs transition-colors"
            >
              Comunidade no Discord <ExternalLink size={14} />
            </a>
            <a
              href="mailto:pifot16@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors"
            >
              Suporte por E-mail: pifot16@gmail.com
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
