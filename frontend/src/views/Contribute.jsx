import React from 'react';
import { Download, Monitor, Activity, Users, ShieldAlert, Cpu, Heart, CheckCircle2, Network } from 'lucide-react';

export default function Contribute() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      
      <div className="text-center mb-12">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-4 flex items-center justify-center gap-3">
          <Heart className="text-red-500" size={40} />
          Colabore com a Nossa Guilda
        </h2>
        <p className="text-gray-400 font-sans text-lg max-w-3xl mx-auto leading-relaxed">
          Nossa inteligência artificial varre e monitora milhares de personagens para nos dar a melhor vantagem na war e na economia. Para que o nosso painel seja o mais rápido de todos, nós construímos uma <strong>Rede Distribuída e Compartilhada</strong>. O seu computador pode ser um pedacinho desse grande cérebro que mantém a guilda no topo!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Como Funciona */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Cpu className="text-yellow-500" />
            Como o Robô Funciona?
          </h3>
          
          <div className="space-y-6 text-gray-300 font-sans">
            <p>
              Ao invés de rodarmos o nosso sistema num servidor caro (que seria facilmente bloqueado), nós criamos o <strong>Worker Node</strong>. Ele é um programinha extremamente leve, silencioso e invisível que roda no fundo do seu Windows, usando apenas uma poeirinha de internet e do seu processador quando você não os está usando.
            </p>
            <p>
              Toda a nossa base de dados é dividida em micro-tarefas. O seu computador se conecta à guilda, pega uma dessas tarefas, lê o site oficial do jogo para coletar um dado, e envia para nossa planilha. É literalmente a guilda dando as mãos e trabalhando junto pelo mesmo objetivo!
            </p>
            <div className="bg-black/40 border border-green-500/30 rounded p-4 flex items-start gap-4 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <ShieldAlert className="text-green-500 shrink-0 mt-1" />
              <p className="text-sm">
                <strong>100% Seguro e Pacífico:</strong> Pode ter paz absoluta. O robô atua APENAS lendo a página pública de jogadores no site oficial através de um navegador invisível. Ele NÃO lê a memória do jogo, NÃO requer permissões estranhas e <strong>TEM ZERO risco de banimento</strong>. É idêntico a você abrir o navegador e olhar o Rank de alguém, só que de forma automática.
              </p>
            </div>
          </div>
        </div>

        {/* Instalação */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Download className="text-green-500" />
            Junte-se à Mente Coletiva
          </h3>
          
          <ul className="space-y-4 text-gray-300 font-sans mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Baixe o Instalador do Robô no botão abaixo.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Dê dois cliques no <strong>AuroriaWorker_Instalador.exe</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>A tela preta vai instalar o coração do robô silenciosamente em alguns segundos.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Prontinho! Seu PC já estará varrendo inimigos e ajudando nossa guilda toda vez que você ligar o computador!</span>
            </li>
          </ul>

          <div className="flex flex-col items-center justify-center p-6 bg-black/30 border border-tibia-border rounded-lg gap-4">
            
            {/* PS1 - Principal */}
            <a 
              href="/Instalar_Worker.ps1" 
              download
              className="flex items-center gap-3 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-medieval text-xl py-4 px-8 rounded-lg shadow-tibia-glow transform transition-all hover:scale-105 border border-green-400 w-full justify-center max-w-sm"
            >
              <Download size={24} />
              Baixar Robô da Guilda (.ps1)
            </a>

            <div className="bg-black/40 border border-yellow-500/30 rounded p-3 text-sm text-gray-400 max-w-sm w-full">
              <p className="font-bold text-yellow-400 mb-1">📋 Como instalar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique no botão acima para baixar</li>
                <li>Clique com botão <strong className="text-white">DIREITO</strong> no arquivo</li>
                <li>Selecione <strong className="text-white">"Executar com PowerShell"</strong></li>
                <li>Digite seu nome e aguarde!</li>
              </ol>
              <p className="mt-2 text-xs text-gray-500">Arquivo de texto puro (.ps1), sem vírus.</p>
            </div>
            
            <a 
              href="/Desinstalador_Worker.bat" 
              download
              className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors font-sans text-sm underline"
            >
              Parar de ajudar (Desinstalar)
            </a>
          </div>
        </div>

      </div>

      {/* Auto-Update Banner */}
      <div className="bg-black/60 border border-tibia-border rounded-lg p-6 flex items-center gap-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <Activity className="text-blue-400 w-12 h-12 shrink-0 animate-pulse" />
        <div>
          <h4 className="text-xl font-medieval text-white mb-2">Atualizações Automáticas Mágicas</h4>
          <p className="text-gray-400 font-sans text-sm">
            Você não precisa se preocupar em baixar o instalador de novo. Toda vez que nossa Inteligência Artificial melhora ou os administradores enviam um código novo, o seu robô baixa a melhoria sozinho, recarrega a si mesmo e volta ao trabalho em menos de 1 segundo, sem aparecer na sua tela ou pedir permissão. <strong>Você instala apenas uma vez, e está ajudando para sempre!</strong>
          </p>
        </div>
      </div>

    </div>
  );
}
