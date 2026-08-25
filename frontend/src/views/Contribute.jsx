import React from 'react';
import { Download, Monitor, Activity, Users, ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';

export default function Contribute() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      
      <div className="text-center mb-12">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-4">Ajude a Guilda (Scraper Farm)</h2>
        <p className="text-gray-400 font-sans text-lg max-w-3xl mx-auto leading-relaxed">
          O nosso Tracker possui inteligência em tempo real para monitorar mais de 25.000 jogadores do servidor. 
          Como o site oficial do jogo bloqueia conexões muito rápidas, nós precisamos de um <strong>exército de robôs</strong> espalhados para raspar os dados. É aqui que você entra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Como Funciona */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Cpu className="text-yellow-500" />
            Como funciona o Worker?
          </h3>
          
          <div className="space-y-6 text-gray-300 font-sans">
            <p>
              Nós desenvolvemos um aplicativo chamado <strong>Auroria Worker</strong>. Ele é um robô leve e invisível que roda no fundo do seu computador, consumindo quase nada de memória.
            </p>
            <p>
              Sempre que o nosso Banco de Dados central precisa atualizar o level de alguém, ou verificar quem está online, ele cria uma "Fila de Tarefas". O seu robô, junto com os robôs de outros membros da guilda, vai "puxar" um pedaço dessa fila e realizar a pesquisa pelo site oficial.
            </p>
            <div className="bg-black/40 border border-tibia-primary/30 rounded p-4 flex items-start gap-4">
              <ShieldAlert className="text-yellow-500 shrink-0 mt-1" />
              <p className="text-sm">
                <strong>100% Seguro:</strong> O aplicativo não interage com o jogo, não lê memórias, não exige senha e não mexe em nada do seu computador. Ele apenas abre abas invisíveis do Google Chrome para ler o site oficial (Highscores/Onlines).
              </p>
            </div>
          </div>
        </div>

        {/* Instalação */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Download className="text-green-500" />
            Como Instalar
          </h3>
          
          <ul className="space-y-4 text-gray-300 font-sans mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Baixe o Instalador Oficial pelo botão abaixo.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Dê um duplo clique no <strong>AuroriaWorker_Instalador.exe</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Pronto! Ele vai abrir uma tela preta e fazer tudo sozinho (instalar os requisitos silenciosamente e fechar a tela).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>O seu robô já estará vivo no fundo e vai ligar automaticamente toda vez que você ligar o computador para ajudar a guilda!</span>
            </li>
          </ul>

          <div className="flex flex-col items-center justify-center p-6 bg-black/30 border border-tibia-border rounded-lg">
            <a 
              href="/download/AuroriaWorker_Instalador.exe" 
              download
              className="flex items-center gap-3 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-medieval text-xl py-4 px-8 rounded-lg shadow-tibia-glow transform transition-all hover:scale-105 border border-green-400"
            >
              <Download size={24} />
              Baixar Auroria Worker
            </a>
            <p className="mt-4 text-xs text-gray-500 font-sans">
              Requisitos: Windows 10/11. (Tamanho: ~9KB)
            </p>
          </div>
        </div>

      </div>

      {/* Auto-Update Banner */}
      <div className="bg-black/60 border border-tibia-border rounded-lg p-6 flex items-center gap-6">
        <Activity className="text-tibia-highlight w-12 h-12 shrink-0 animate-pulse" />
        <div>
          <h4 className="text-xl font-medieval text-white mb-2">Atualizações Silenciosas</h4>
          <p className="text-gray-400 font-sans text-sm">
            Nós implantamos um sistema de <strong>Fazenda Distribuída</strong>. Você só precisa baixar o instalador uma única vez. Sempre que a nossa equipe de desenvolvimento criar melhorias pro robô, o seu Worker vai perceber automaticamente no GitHub, se auto-atualizar no fundo, e reiniciar sozinho em milissegundos sem você nem ver!
          </p>
        </div>
      </div>

    </div>
  );
}
