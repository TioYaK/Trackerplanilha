import React from 'react';
import { FileText, Shield, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onNavigate }) {
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
          <FileText size={14} /> Regras de Uso
        </div>
        <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold drop-shadow-md">
          Termos de Serviço & Uso
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Última atualização: 13 de Setembro de 2026 • Plataforma Comunitária Rubinot Tracker
        </p>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-8 bg-tibia-card border-2 border-tibia-border rounded-xl p-6 sm:p-8 shadow-xl text-sm leading-relaxed">
        
        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-yellow-400" />
            1. Aceitação dos Termos
          </h2>
          <p className="text-gray-300">
            Ao acessar ou utilizar a plataforma <strong>Rubinot Tracker</strong> (<a href="https://trackerplanilha.vercel.app" className="text-yellow-400 hover:underline">trackerplanilha.vercel.app</a>), você concorda expressamente em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá acessar nem utilizar o serviço.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Shield size={18} className="text-yellow-400" />
            2. Descrição dos Serviços Prestados
          </h2>
          <p className="text-gray-300">
            O Rubinot Tracker disponibiliza ferramentas gratuitas e serviços para jogadores e lideranças de guildas no Rubinot, incluindo:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300 ml-2">
            <li>Monitoramento em tempo real de jogadores online nos 16 mundos oficiais;</li>
            <li>Feed e histórico de mortes (Kill Statistics / Frags);</li>
            <li>Calculadora e divisor de loot de caçadas em grupo (Party Loot Splitter);</li>
            <li>Radar de leilões de personagens (Bazaar Sniper);</li>
            <li>Automação de fila de convites in-game para novos membros de guilda;</li>
            <li>API REST para integração de bots de Discord e ferramentas de guilda.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-400" />
            3. Isenção de Vínculo com CipSoft e Rubinot Oficial
          </h2>
          <p className="text-gray-300">
            O Rubinot Tracker é uma aplicação desenvolvida por fãs e mantida de maneira comunitária. 
            Não possuímos qualquer afiliação institucional, patrocínio ou endosso da <strong>CipSoft GmbH</strong> (criadora original do Tibia) ou dos administradores do <strong>Rubinot</strong>. Todos os direitos de propriedade intelectual relativos ao jogo original pertencem aos seus respectivos detentores.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-yellow-400" />
            4. Política de Uso Justo (Fair Use da API)
          </h2>
          <p className="text-gray-300">
            Nossa infraestrutura pública disponibiliza limites generosos de requisições por minuto através de chaves de API. É estritamente proibido:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300 ml-2">
            <li>Realizar ataques de negação de serviço (DDoS) ou sobrecarregar intencionalmente os endpoints;</li>
            <li>Tentar burlar os limites de taxa de transferência (rate limits) sem autorização prévia;</li>
            <li>Injetar dados falsificados ou adulterados através da API de telemetria distribuída.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight flex items-center gap-2 mb-3">
            <Shield size={18} className="text-yellow-400" />
            5. Disponibilidade e Garantias
          </h2>
          <p className="text-gray-300">
            Os serviços são fornecidos no estado em que se encontram ("as is"), sem garantias de disponibilidade ininterrupta 24 horas por dia. O serviço depende da disponibilidade dos servidores de jogo e de redes de terceiros.
          </p>
        </section>

        <section className="pt-4 border-t border-white/10">
          <h2 className="text-lg font-medieval font-bold text-tibia-highlight mb-2">
            6. Modificações dos Termos
          </h2>
          <p className="text-gray-300">
            Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Quaisquer alterações substanciais serão publicadas diretamente nesta página com data de vigência atualizada.
          </p>
        </section>

      </div>
    </div>
  );
}
