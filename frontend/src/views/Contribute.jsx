import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Download, Monitor, Activity, Users, ShieldCheck, Cpu, Heart, CheckCircle2, Network, Copy, Check, Terminal, ExternalLink, Archive, Zap } from 'lucide-react';

export default function Contribute() {
  const [copied, setCopied] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    activeWorkers: 0,
    totalTasks: 0,
    loading: true,
  });
  const psCommand = 'irm https://trackerplanilha.vercel.app/Instalar_Worker.ps1 | iex';

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkStats = async () => {
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('worker_heartbeats')
        .select('last_ping, metadata');

      if (data) {
        const active = data.filter(w => w.last_ping && w.last_ping > fiveMinsAgo).length;
        let tasks = 0;
        data.forEach(w => {
          tasks += (w.metadata?.tasks_completed || 0);
        });
        setNetworkStats({
          activeWorkers: active,
          totalTasks: tasks,
          loading: false,
        });
      }
    } catch (e) {
      setNetworkStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(psCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in">
      
      <div className="text-center mb-10">
        <h2 className="text-5xl font-medieval text-gradient-gold mb-4 flex items-center justify-center gap-3">
          <Heart className="text-red-500" size={40} />
          Colabore com a Nossa Guilda
        </h2>
        <p className="text-gray-400 font-sans text-lg max-w-3xl mx-auto leading-relaxed">
          Nossa inteligência artificial varre e monitora milhares de personagens para nos dar a melhor vantagem nas wars e na economia. Para que o nosso painel seja ultrarrápido e descentralizado, nós construímos uma <strong>Rede Compartilhada de Telemetria</strong>. O seu computador pode ser um nó nessa rede que mantém a guilda sempre no topo!
        </p>
      </div>

      {/* PODER DA REDE NEURAL EM TEMPO REAL (PILAR IV) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-black/60 border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-green-950/60 border border-green-700/50 rounded-lg text-green-400">
            <Network size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Nós Contribuidores</p>
            <p className="text-xl font-bold text-white flex items-center gap-1.5">
              <span className="text-green-400">{networkStats.loading ? '...' : networkStats.activeWorkers}</span>
              <span className="text-xs text-gray-500 font-normal">PCs online</span>
            </p>
          </div>
        </div>

        <div className="bg-black/60 border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 border border-amber-700/50 rounded-lg text-amber-400">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Telemetria Coletada</p>
            <p className="text-xl font-bold text-yellow-400 font-mono">
              {networkStats.loading ? '...' : `${networkStats.totalTasks.toLocaleString('pt-BR')} tasks`}
            </p>
          </div>
        </div>

        <div className="bg-black/60 border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-sky-950/60 border border-sky-700/50 rounded-lg text-sky-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Estado da Rede</p>
            <p className="text-xl font-bold text-sky-300">
              100% Blindada
            </p>
          </div>
        </div>

        <div className="bg-black/60 border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-purple-950/60 border border-purple-700/50 rounded-lg text-purple-400">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Varreduras RubinOT</p>
            <p className="text-xl font-bold text-purple-300">
              Tempo Real 24/7
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {/* Como Funciona & Transparência */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
              <Cpu className="text-yellow-500" />
              Como o Worker Funciona?
            </h3>
            
            <div className="space-y-5 text-gray-300 font-sans text-sm leading-relaxed">
              <p>
                Ao invés de rodarmos um servidor central vulnerável a bloqueios, criamos o <strong>Worker Node</strong>: um processo ultra leve e silencioso que roda no fundo do Windows, consumindo menos de 100 MB de RAM e CPU residual imperceptível.
              </p>
              <p>
                O seu computador pega micro-tarefas da fila (como verificar mortes recentes ou jogadores online no site oficial do RubinOT), processa os dados e envia para o banco de dados da guilda.
              </p>
              
              <div className="bg-black/50 border border-green-500/40 rounded-lg p-4 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="text-green-400 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h4 className="text-green-400 font-bold mb-1">100% Seguro, Auditável e Sem Riscos</h4>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      O robô <strong>NÃO</strong> acessa a memória do Tibia, <strong>NÃO</strong> lê senhas ou arquivos pessoais e <strong>NÃO</strong> possui código malicioso. Ele apenas abre páginas web públicas em segundo plano para consultar dados do ranking oficial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-gray-300">
              <CheckCircle2 size={14} className="text-green-400" />
              Código aberto no GitHub
            </span>
            <a 
              href="https://github.com/TioYaK/Trackerplanilha" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold underline"
            >
              Auditar Código Fonte <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Instalação Limpa e Segura */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-medieval text-tibia-highlight mb-6 flex items-center gap-2">
            <Download className="text-green-500" />
            Instalação Oficial
          </h3>

          <div className="space-y-6">
            
            {/* Opção 1: Pacote Seguro ZIP (Principal) */}
            <div className="p-5 bg-black/40 border border-green-500/40 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-950/60 border border-green-500/30 px-2 py-0.5 rounded">
                  Recomendado (1 Clique)
                </span>
                <span className="text-xs text-gray-400">Windows 10 / 11</span>
              </div>

              <p className="text-gray-300 text-sm mb-4">
                Pacote oficial compactado. Baixe, extraia e execute o instalador. Não é bloqueado pelo navegador.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href="/AuroriaWorker_Instalador.zip" 
                  download
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg border border-green-400 text-sm transition-transform hover:scale-[1.02]"
                >
                  <Archive size={18} />
                  Baixar Pacote Seguro (.zip)
                </a>

                <a 
                  href="/AuroriaWorker_Instalador.exe" 
                  download
                  className="flex items-center justify-center gap-2 bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border border-tibia-border hover:border-gray-400 font-bold py-3 px-4 rounded-lg text-sm transition-colors"
                  title="Download direto do executável compilado"
                >
                  <Download size={16} />
                  .EXE Direto
                </a>
              </div>
            </div>

            {/* Opção 2: Comando Direto no PowerShell (Sem Download) */}
            <div className="p-5 bg-black/40 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Terminal size={14} />
                  Instalação via Terminal (PowerShell)
                </span>
                <span className="text-xs text-gray-400">Zero Downloads</span>
              </div>

              <p className="text-xs text-gray-400 mb-3">
                Abra o <strong>PowerShell</strong> no seu Windows e cole o comando abaixo:
              </p>

              <div className="flex items-center gap-2 bg-black/80 border border-gray-700 rounded p-2 text-xs font-mono text-green-400">
                <span className="truncate select-all">{psCommand}</span>
                <button 
                  onClick={handleCopy}
                  className="ml-auto flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-sans font-bold shrink-0 transition-colors"
                >
                  {copied ? <Check size={12} className="text-green-300" /> : <Copy size={12} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Link de Desinstalação */}
            <div className="text-center pt-2">
              <a 
                href="/Desinstalador_Worker.bat" 
                download
                className="text-xs text-gray-500 hover:text-red-400 transition-colors underline"
              >
                Deseja parar de colaborar? Baixar Desinstalador Completo
              </a>
            </div>

          </div>
        </div>

      </div>

      {/* Auto-Update Banner */}
      <div className="bg-black/60 border border-tibia-border rounded-lg p-6 flex items-center gap-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        <Activity className="text-blue-400 w-12 h-12 shrink-0 animate-pulse" />
        <div>
          <h4 className="text-xl font-medieval text-white mb-2">Atualizações Automáticas Silenciosas</h4>
          <p className="text-gray-400 font-sans text-sm leading-relaxed">
            Você não precisa se preocupar em baixar o instalador novamente. Sempre que novas regras ou melhorias forem publicadas, o seu robô atualiza o código silenciosamente em segundo plano, sem piscar janelas, sem atrapalhar seu jogo e sem pedir permissões adicionais. <strong>Você instala uma única vez e apoia a guilda automaticamente!</strong>
          </p>
        </div>
      </div>

    </div>
  );
}
