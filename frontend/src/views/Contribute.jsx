import React from 'react';
import { Download, Monitor, Activity, Users, ShieldAlert, Cpu, Heart, CheckCircle2, Network } from 'lucide-react';

export default function Contribute() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      
      <div className="text-center mb-12">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-4 flex items-center justify-center gap-3">
          <Network className="text-tibia-primary" size={40} />
          Rede Neural da Guilda
        </h2>
        <p className="text-gray-400 font-sans text-lg max-w-3xl mx-auto leading-relaxed">
          Nossa inteligência em tempo real processa e monitora mais de 25.000 jogadores simultaneamente. 
          Para contornar os bloqueios e firewall do jogo, nós não usamos um servidor centralizado: nós criamos uma <strong>Rede Neural Distribuída</strong> (Edge Computing). Você e seu computador são os nós neurais dessa mente coletiva.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Como Funciona */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Cpu className="text-yellow-500" />
            A Arquitetura dos Workers
          </h3>
          
          <div className="space-y-6 text-gray-300 font-sans">
            <p>
              Ao invés de dependermos de um único servidor (que seria bloqueado no primeiro segundo), nós desenvolvemos o <strong>Worker Node</strong>. Ele é um script imperceptível que utiliza frações mínimas do seu processamento excedente (idle) em background.
            </p>
            <p>
              Toda a massa de dados do servidor é dividida em micro-tarefas (Data Sharding). O nosso cérebro central envia esses fragmentos para o seu computador, que atua como um Worker Livre. O seu PC capta a tarefa, executa a requisição no site oficial pulverizando nosso rastro, e retorna o dado estruturado para a nuvem.
            </p>
            <div className="bg-black/40 border border-tibia-primary/30 rounded p-4 flex items-start gap-4 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <ShieldAlert className="text-yellow-500 shrink-0 mt-1" />
              <p className="text-sm">
                <strong>Segurança Zero-Trust:</strong> O nó neural atua exclusivamente no protocolo HTTP. Ele não intercepta pacotes do jogo, não lê memórias locais, não requer elevação de privilégios e opera de forma 100% limpa abrindo canais headless do navegador. Risco zero para a sua conta e para o seu SO.
              </p>
            </div>
          </div>
        </div>

        {/* Instalação */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Download className="text-green-500" />
            Integrar à Mente Coletiva
          </h3>
          
          <ul className="space-y-4 text-gray-300 font-sans mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Baixe o Instalador do Nó Neural abaixo.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Execute o <strong>Worker_Node.exe</strong> (Apenas 9KB).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>A inicialização silenciosa configurará o ambiente Node.js de forma imperceptível.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-tibia-primary shrink-0 mt-0.5" size={20} />
              <span>Concluído. Seu nó entrará no pool de computação automaticamente a cada boot do Windows, acelerando nossas análises e o censo da guilda.</span>
            </li>
          </ul>

          <div className="flex flex-col items-center justify-center p-6 bg-black/30 border border-tibia-border rounded-lg">
            <a 
              href="/download/AuroriaWorker_Instalador.exe" 
              download
              className="flex items-center gap-3 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-medieval text-xl py-4 px-8 rounded-lg shadow-tibia-glow transform transition-all hover:scale-105 border border-green-400 w-full justify-center max-w-sm"
            >
              <Download size={24} />
              Baixar Worker Node
            </a>
            
            <a 
              href="/download/Desinstalador_Worker.bat" 
              download
              className="mt-4 flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors font-sans text-sm underline"
            >
              Desconectar nó (Desinstalador)
            </a>
          </div>
        </div>

      </div>

      {/* Auto-Update Banner */}
      <div className="bg-black/60 border border-tibia-border rounded-lg p-6 flex items-center gap-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <Activity className="text-blue-400 w-12 h-12 shrink-0 animate-pulse" />
        <div>
          <h4 className="text-xl font-medieval text-white mb-2">Continuous Integration (CI/CD) Edge</h4>
          <p className="text-gray-400 font-sans text-sm">
            O pipeline de CI/CD está embutido no nó. Toda alteração aprovada pela engenharia é propagada (broadcast) pela rede. O seu Worker identifica a branch remota, realiza um pull stateful, recarrega o próprio core na memória RAM em 13ms e prossegue a execução sem down-time e sem requerer sua interação. <strong>Você instala uma vez, e ele se aprimora para sempre.</strong>
          </p>
        </div>
      </div>

    </div>
  );
}
