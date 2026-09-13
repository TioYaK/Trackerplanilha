import React from 'react';
import { Shield, ExternalLink, Heart, Globe, Cpu, FileText, Lock, MessageSquare } from 'lucide-react';
import { WORLDS_LIST } from '../context/WorldContext';

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-[#0c0c0e] border-t-2 border-tibia-border/70 text-gray-400 font-sans text-xs mt-12 z-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Grid de Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/10">
          
          {/* Coluna 1: Marca e Missão */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-medieval text-lg">
              <Shield size={22} className="text-yellow-400" />
              <span className="text-gradient-gold font-bold">Rubinot Tracker</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Plataforma comunitária independente de telemetria, histórico de combate, inteligência analítica e ferramentas para os 16 servidores do Rubinot.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-yellow-500/80">
              <Cpu size={14} />
              <span>Zero-Trust Telemetry Engine v2.5</span>
            </div>
          </div>

          {/* Coluna 2: Ferramentas & Módulos */}
          <div>
            <h4 className="font-medieval font-bold text-sm text-yellow-400 uppercase tracking-wider mb-3">
              Ferramentas
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate && onNavigate('home')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  🌐 Portal Principal (Hub Global)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('tracker')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  ⚡ Monitor Global & Mortes
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('invite')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  📨 Solicitar Convite In-Game
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('bazaar')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  🏹 Bazaar Sniper (Leilões)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('guides')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  📜 Guias & Estratégias (Artigos)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('sorteio')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  🎁 Sorteador de Prêmios & Roleta
                </button>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Desenvolvedores & Integrações */}
          <div>
            <h4 className="font-medieval font-bold text-sm text-yellow-400 uppercase tracking-wider mb-3">
              Desenvolvedores
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate && onNavigate('developers')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  🔌 Documentação da API REST
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('contribute')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left">
                  ⚙️ Como Rodar um Worker
                </button>
              </li>
              <li>
                <a href="https://github.com/TioYaK/Trackerplanilha" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors inline-flex items-center gap-1.5">
                  📁 Código Fonte no GitHub <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a href="https://rubinot.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition-colors inline-flex items-center gap-1.5">
                  🏰 Rubinot Oficial <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Institucional & Conformidade (Google AdSense) */}
          <div>
            <h4 className="font-medieval font-bold text-sm text-yellow-400 uppercase tracking-wider mb-3">
              Institucional
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate && onNavigate('about')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5">
                  <Globe size={13} /> Sobre Nós
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('guides')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5">
                  <FileText size={13} /> Central Editorial & Artigos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5">
                  <FileText size={13} /> Termos de Serviço
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-yellow-400 transition-colors cursor-pointer text-left inline-flex items-center gap-1.5">
                  <Lock size={13} /> Política de Privacidade
                </button>
              </li>
              <li>
                <a href="mailto:pifot16@gmail.com" className="hover:text-yellow-400 transition-colors inline-flex items-center gap-1.5">
                  <MessageSquare size={13} /> Contato & Suporte
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Isenção Legal e Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-[11px] leading-relaxed">
          <div className="text-center md:text-left">
            <p>
              Rubinot Tracker © 2026 • Ferramenta comunitária independente desenvolvida para a comunidade de jogadores.
            </p>
            <p className="mt-1 text-gray-600">
              Tibia é uma marca registrada de CipSoft GmbH. Rubinot é um servidor independente. Não possuímos afiliação oficial com a CipSoft GmbH.
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 text-xs">
            <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-gray-300 underline">Privacidade</button>
            <span>•</span>
            <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-gray-300 underline">Termos</button>
            <span>•</span>
            <button onClick={() => onNavigate && onNavigate('about')} className="hover:text-gray-300 underline">Sobre</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
