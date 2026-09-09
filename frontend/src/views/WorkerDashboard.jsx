import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Server, Activity, HardDrive, Cpu, Terminal, RefreshCw, PowerOff, 
  MessageSquare, Clock, ShieldAlert, User, Database, Zap, Trash2, 
  XCircle, Play, CheckCircle2, AlertTriangle, Copy, Check, X, 
  Layers, ShieldCheck, ListOrdered
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WorkerDashboard() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingCmd, setSendingCmd] = useState(null);
  const [queueMetrics, setQueueMetrics] = useState({
    pending: 0,
    inProgress: 0,
    totalCompleted: 0,
  });
  const [activeLogWorker, setActiveLogWorker] = useState(null);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    fetchWorkers();
    fetchQueueMetrics();
    const interval = setInterval(() => {
      fetchWorkers();
      fetchQueueMetrics();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Rolagem automática para o fim do terminal quando abrir logs
  useEffect(() => {
    if (activeLogWorker && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeLogWorker?.metadata?.terminal_logs]);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('worker_heartbeats')
        .select('*')
        .order('last_ping', { ascending: false });
        
      if (!error && data) {
        setWorkers(data);
        // Atualiza o worker ativo de logs se o modal estiver aberto
        if (activeLogWorker) {
          const updated = data.find(w => w.worker_id === activeLogWorker.worker_id);
          if (updated) setActiveLogWorker(updated);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueMetrics = async () => {
    try {
      const [{ count: pendingCount }, { count: inProgressCount }] = await Promise.all([
        supabase.from('task_queue').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('task_queue').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
      ]);

      // Soma tarefas concluídas por todos os workers
      const { data: hbData } = await supabase.from('worker_heartbeats').select('metadata');
      let totalCompleted = 0;
      if (hbData) {
        hbData.forEach(h => {
          totalCompleted += (h.metadata?.tasks_completed || 0);
        });
      }

      setQueueMetrics({
        pending: pendingCount || 0,
        inProgress: inProgressCount || 0,
        totalCompleted,
      });
    } catch (err) {
      console.error('Erro ao buscar métricas da fila:', err);
    }
  };

  const sendCommand = async (workerId, command, payload = {}, silent = false) => {
    setSendingCmd(workerId);
    try {
      const { error } = await supabase
        .from('worker_commands')
        .insert({
          worker_id: workerId,
          command,
          payload,
          executed: false
        });

      if (error) throw error;
      if (!silent) {
        alert(`Comando ${command} enviado com sucesso para ${workerId}!`);
      }
    } catch (err) {
      if (!silent) {
        alert(`Falha ao enviar comando: ${err.message}`);
      } else {
        console.error(`Falha silenciosa no comando ${command}:`, err.message);
      }
    } finally {
      setSendingCmd(null);
    }
  };

  const handleOpenLogs = async (worker) => {
    setActiveLogWorker(worker);
    setFetchingLogs(true);
    // Solicita os logs mais recentes
    await sendCommand(worker.worker_id, 'FETCH_LOGS', {}, true);
    setTimeout(async () => {
      const { data } = await supabase
        .from('worker_heartbeats')
        .select('*')
        .eq('worker_id', worker.worker_id)
        .maybeSingle();
      if (data) {
        setActiveLogWorker(data);
      }
      setFetchingLogs(false);
    }, 1200);
  };

  const handleRefreshLogs = async () => {
    if (!activeLogWorker) return;
    setFetchingLogs(true);
    await sendCommand(activeLogWorker.worker_id, 'FETCH_LOGS', {}, true);
    setTimeout(async () => {
      const { data } = await supabase
        .from('worker_heartbeats')
        .select('*')
        .eq('worker_id', activeLogWorker.worker_id)
        .maybeSingle();
      if (data) {
        setActiveLogWorker(data);
        setWorkers(prev => prev.map(w => w.worker_id === data.worker_id ? data : w));
      }
      setFetchingLogs(false);
    }, 1500);
  };

  const handleCopyLogs = () => {
    if (!activeLogWorker?.metadata?.terminal_logs) return;
    navigator.clipboard.writeText(activeLogWorker.metadata.terminal_logs);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleForceUpdateAll = async () => {
    if (!window.confirm('Deseja forçar atualização e limpeza preventiva em TODOS os workers online?')) return;
    try {
      const activeWorkers = workers.filter(w => new Date(w.last_ping).getTime() > Date.now() - 5 * 60 * 1000);
      for (const w of activeWorkers) {
        await supabase.from('worker_commands').insert({
          worker_id: w.worker_id,
          command: 'FORCE_UPDATE',
          payload: {},
          executed: false
        });
      }
      alert(`Comando de Atualização disparado para ${activeWorkers.length} workers ativos!`);
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  const handleCustomMessage = (workerId) => {
    const msg = window.prompt('Digite a mensagem para enviar como Pop-up (Alarme) neste PC:');
    if (msg) {
      sendCommand(workerId, 'POPUP_MESSAGE', { message: msg });
    }
  };

  const handleForceTask = (workerId) => {
    const taskType = window.prompt(
      'Selecione ou digite a tarefa para disparar imediatamente no nó:\n' +
      '• FETCH_ONLINES\n' +
      '• PROCESS_GUILD_INVITES\n' +
      '• FETCH_DEATHS\n' +
      '• FETCH_GUILD\n' +
      '• FETCH_RIVALS\n' +
      '• FETCH_TRANSFERS\n' +
      '• FETCH_BAZAAR\n' +
      '• AUDIT_SLOTS\n' +
      '• FETCH_HIGHSCORE_KNIGHT\n' +
      '• FETCH_HIGHSCORE_PALADIN\n' +
      '• FETCH_HIGHSCORE_SORCERER\n' +
      '• FETCH_HIGHSCORE_DRUID\n' +
      '• FETCH_HIGHSCORE_MONK',
      'FETCH_ONLINES'
    );
    if (taskType && taskType.trim()) {
      sendCommand(workerId, 'FORCE_TASK', { task_type: taskType.trim().toUpperCase() });
    }
  };

  const formatUptime = (sec) => {
    if (!sec || isNaN(sec)) return 'Recém iniciado';
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const renderLogLine = (line, idx) => {
    let colorClass = 'text-gray-300';
    if (line.includes('[ERROR]') || line.includes('❌') || line.includes('Falha') || line.includes('Error')) {
      colorClass = 'text-rose-400 font-semibold bg-rose-950/20';
    } else if (line.includes('[WARN]') || line.includes('⚠️') || line.includes('Aviso')) {
      colorClass = 'text-amber-300';
    } else if (line.includes('✅') || line.includes('✔') || line.includes('concluída')) {
      colorClass = 'text-emerald-400';
    } else if (line.includes('[WORKER]') || line.includes('[C2 COMMAND]')) {
      colorClass = 'text-sky-300 font-semibold';
    } else if (line.includes('[JOB]') || line.includes('[SHARD]') || line.includes('[Scraper]')) {
      colorClass = 'text-purple-300';
    }
    return (
      <div key={idx} className={`py-0.5 px-2 rounded hover:bg-white/5 font-mono text-[11px] leading-relaxed break-all ${colorClass}`}>
        {line}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Carregando painel C2...</div>;
  }

  const onlineWorkersCount = workers.filter(w => w.last_ping && new Date(w.last_ping).getTime() > Date.now() - 5 * 60 * 1000).length;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in relative">
      {/* HEADER C2 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-4xl font-medieval text-gradient-gold mb-2 flex items-center">
            <Terminal className="mr-3 text-green-500" size={36} />
            Worker C2 Dashboard
          </h2>
          <p className="text-gray-400">Painel de Comando, Controle e Diagnóstico Remoto da Rede Neural</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceUpdateAll}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 border border-blue-400 text-sm transition-all"
          >
            <RefreshCw size={16} className="mr-2" />
            ⚡ Atualizar Todos os Nós
          </button>
        </div>
      </div>

      {/* CARDS DE THROUGHPUT E SAÚDE DA REDE (PILAR II) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-green-950/60 border border-green-700/50 rounded-lg text-green-400">
            <Server size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Nós na Rede</p>
            <p className="text-xl font-bold text-white">
              <span className="text-green-400">{onlineWorkersCount}</span>
              <span className="text-gray-500 text-sm"> / {workers.length} online</span>
            </p>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-amber-950/60 border border-amber-700/50 rounded-lg text-amber-400">
            <Play size={24} className="animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Em Execução</p>
            <p className="text-xl font-bold text-amber-300 font-mono">
              {queueMetrics.inProgress} tarefas
            </p>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-sky-950/60 border border-sky-700/50 rounded-lg text-sky-400">
            <ListOrdered size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Fila Aguardando</p>
            <p className="text-xl font-bold text-sky-300 font-mono">
              {queueMetrics.pending} tarefas
            </p>
          </div>
        </div>

        <div className="bg-tibia-card border border-tibia-border p-4 rounded-lg shadow-lg flex items-center gap-3">
          <div className="p-3 bg-purple-950/60 border border-purple-700/50 rounded-lg text-purple-400">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tarefas Concluídas</p>
            <p className="text-xl font-bold text-yellow-400 font-mono">
              {queueMetrics.totalCompleted} total
            </p>
          </div>
        </div>
      </div>

      {/* LISTA DE WORKERS */}
      <div className="grid grid-cols-1 gap-6">
        {workers.map(w => {
          const isOnline = w.last_ping ? new Date(w.last_ping).getTime() > Date.now() - 5 * 60 * 1000 : false;
          const lastError = w.metadata?.last_error;
          const avgDuration = w.metadata?.avg_task_duration_ms;

          return (
            <div key={w.worker_id} className={`bg-tibia-card border ${isOnline ? 'border-green-900/50' : 'border-red-900/50'} p-6 rounded-lg shadow-xl`}>
              {/* CABEÇALHO DO CARD */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Server size={24} className={`mr-3 ${isOnline ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      {w.metadata?.owner && w.metadata.owner !== 'Anônimo' && (
                        <span className="bg-tibia-primary/20 text-tibia-primary text-xs px-2 py-1 rounded border border-tibia-primary/30 flex items-center">
                          <User size={12} className="mr-1" />
                          {w.metadata.owner}
                        </span>
                      )}
                      {w.worker_id}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center mt-1">
                      <Activity size={14} className="mr-1" />
                      Status: 
                      <span className={`ml-1 font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Último Ping</p>
                  <p className="text-sm text-blue-400">
                    <Clock size={12} className="inline mr-1" />
                    {w.last_ping ? formatDistanceToNow(new Date(w.last_ping), { addSuffix: true, locale: ptBR }) : 'Nunca'}
                  </p>
                </div>
              </div>

              {/* METADADOS DO WORKER */}
              {w.metadata && (
                <div className="flex flex-col gap-3 mb-4 bg-black/40 p-4 rounded border border-white/5 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs">CPU</p>
                      <p className="text-gray-300 flex items-center"><Cpu size={12} className="mr-1"/> {w.metadata.cpu}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">RAM (Sistema / Node)</p>
                      <p className="text-gray-300 flex items-center">
                        <HardDrive size={12} className="mr-1"/> 
                        {w.metadata.ram} 
                        {w.metadata.memory_mb ? <span className="ml-1 text-xs text-amber-400 font-mono">({w.metadata.memory_mb} MB)</span> : null}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Disco</p>
                      <p className={`flex items-center ${w.metadata.disk_warning ? 'text-red-400 font-bold animate-pulse' : 'text-gray-300'}`}>
                        <Database size={12} className={`mr-1 ${w.metadata.disk_warning ? 'text-red-400' : 'text-gray-400'}`} />
                        {w.metadata.disk_text || (w.metadata.disk_free_gb ? `${w.metadata.disk_free_gb} GB livres` : 'OK')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Uptime do Processo</p>
                      <p className="text-gray-300 flex items-center">
                        <Clock size={12} className="mr-1 text-blue-400"/>
                        {formatUptime(w.metadata.uptime_seconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Versão do Worker</p>
                      <p className="text-gray-300 font-mono text-xs flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">v{w.version}</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-white/5 items-center">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Status de Execução</p>
                      {w.metadata.current_task && w.metadata.current_task !== 'IDLE' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <Play size={11} className="mr-1.5 fill-current" />
                          Processando: {w.metadata.current_task}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs text-gray-400 bg-gray-900 border border-white/5">
                          <CheckCircle2 size={11} className="mr-1.5 text-gray-500" />
                          Ocioso (Monitorando Fila)
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Tarefas Processadas</p>
                      <p className="text-yellow-400 font-mono font-bold flex items-center">
                        <Zap size={13} className="mr-1 text-yellow-500" />
                        {w.metadata.tasks_completed ?? 0} concluídas
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Tempo Médio / Tarefa</p>
                      <p className="text-sky-300 font-mono text-xs flex items-center">
                        <Clock size={12} className="mr-1 text-sky-400" />
                        {avgDuration ? `${(avgDuration / 1000).toFixed(1)}s` : 'Calculando...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Localidade do Host</p>
                      <p className="text-gray-300 truncate text-xs">{w.location || 'N/A'}</p>
                    </div>
                  </div>

                  {/* TELEMETRIA DE ERROS (PILAR II) */}
                  {lastError ? (
                    <div className="mt-2 text-xs bg-rose-950/40 border border-rose-800/40 text-rose-300 p-2.5 rounded flex items-center gap-2">
                      <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                      <div className="flex-1 truncate">
                        <span className="font-bold text-rose-400 mr-1.5">Último Erro [{lastError.task}]:</span>
                        <span className="font-mono text-rose-200">{lastError.message}</span>
                      </div>
                      <span className="text-gray-400 text-[10px] whitespace-nowrap">
                        {formatDistanceToNow(new Date(lastError.timestamp), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs bg-emerald-950/20 border border-emerald-800/20 text-emerald-400/80 px-2.5 py-1.5 rounded flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Zero falhas registradas no ciclo operacional atual</span>
                    </div>
                  )}
                </div>
              )}

              {/* AÇÕES DE CONTROLE REMOTO */}
              <div className="flex flex-wrap gap-2.5 mt-4 border-t border-tibia-border pt-4">
                {/* BOTÃO VER LOGS (PILAR II) */}
                <button 
                  onClick={() => handleOpenLogs(w)}
                  className="flex items-center px-3.5 py-1.5 bg-sky-900/40 hover:bg-sky-900/60 text-sky-300 border border-sky-700/60 rounded transition-colors text-xs font-bold shadow-sm"
                  title="Abre o terminal remoto com visualização de logs ao vivo deste nó"
                >
                  <Terminal size={14} className="mr-1.5 text-sky-400" />
                  Ver Logs Remotos
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => handleForceTask(w.worker_id)}
                  className="flex items-center px-3.5 py-1.5 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                  title="Enfileira ou força uma tarefa com alta prioridade para este worker"
                >
                  <Zap size={14} className="mr-1.5" />
                  Forçar Tarefa
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => {
                    if (window.confirm(`Limpar cache de profiles e lixeira no nó ${w.worker_id}?`)) {
                      sendCommand(w.worker_id, 'CLEAN_STORAGE');
                    }
                  }}
                  className="flex items-center px-3.5 py-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                  title="Limpa caches do Chromium e arquivos temporários de scrapers"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Limpar Caches
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => {
                    if (window.confirm(`Forçar fechamento de qualquer instância aberta do Chrome no nó ${w.worker_id}?`)) {
                      sendCommand(w.worker_id, 'KILL_BROWSER');
                    }
                  }}
                  className="flex items-center px-3.5 py-1.5 bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                  title="Finaliza forçadamente o Puppeteer e zera processos do Chrome"
                >
                  <XCircle size={14} className="mr-1.5" />
                  Fechar Chrome
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => sendCommand(w.worker_id, 'RESTART_WORKER')}
                  className="flex items-center px-3.5 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                >
                  <RefreshCw size={14} className={`mr-1.5 ${sendingCmd === w.worker_id ? 'animate-spin' : ''}`} />
                  Reiniciar Worker
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => sendCommand(w.worker_id, 'FORCE_UPDATE')}
                  className="flex items-center px-3.5 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                >
                  <RefreshCw size={14} className={`mr-1.5 ${sendingCmd === w.worker_id ? 'animate-spin' : ''}`} />
                  Forçar Update
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => handleCustomMessage(w.worker_id)}
                  className="flex items-center px-3.5 py-1.5 bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 border border-yellow-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                >
                  <MessageSquare size={14} className="mr-1.5" />
                  Enviar Pop-up
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => sendCommand(w.worker_id, 'RESTART_PC')}
                  className="flex items-center px-3.5 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800/50 rounded transition-colors text-xs font-bold shadow-sm"
                >
                  <PowerOff size={14} className="mr-1.5" />
                  Reiniciar PC
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE TERMINAL REMOTO (C2 PILAR II) */}
      {activeLogWorker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d12] border border-green-500/40 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* CABEÇALHO DO MODAL */}
            <div className="bg-black/80 px-6 py-4 border-b border-green-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-950/60 border border-green-500/50 rounded text-green-400">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Terminal Remoto: <span className="font-mono text-green-400">{activeLogWorker.worker_id}</span>
                    {activeLogWorker.metadata?.owner && (
                      <span className="text-xs bg-tibia-primary/20 text-tibia-primary px-2 py-0.5 rounded border border-tibia-primary/30">
                        {activeLogWorker.metadata.owner}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock size={11} />
                    {activeLogWorker.metadata?.terminal_logs_updated_at ? (
                      <>Última sincronização: {formatDistanceToNow(new Date(activeLogWorker.metadata.terminal_logs_updated_at), { addSuffix: true, locale: ptBR })}</>
                    ) : (
                      'Nenhum log requisitado ainda'
                    )}
                  </p>
                </div>
              </div>

              {/* BOTÕES DE CONTROLE DO TERMINAL */}
              <div className="flex items-center gap-2">
                <button
                  disabled={fetchingLogs}
                  onClick={handleRefreshLogs}
                  className="flex items-center px-3 py-1.5 bg-green-900/40 hover:bg-green-800/60 text-green-300 border border-green-700/60 rounded text-xs font-bold transition-colors"
                  title="Requisita os últimos logs via comando C2 em tempo real"
                >
                  <RefreshCw size={13} className={`mr-1.5 ${fetchingLogs ? 'animate-spin' : ''}`} />
                  {fetchingLogs ? 'Requisitando...' : 'Atualizar'}
                </button>
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded text-xs font-bold transition-colors"
                  title="Copiar logs para a área de transferência"
                >
                  {copiedLogs ? <Check size={13} className="mr-1.5 text-green-400" /> : <Copy size={13} className="mr-1.5" />}
                  {copiedLogs ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={() => setActiveLogWorker(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* JANELA DO TERMINAL */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/95 font-mono text-xs text-gray-300 space-y-0.5 select-text">
              {activeLogWorker.metadata?.terminal_logs ? (
                activeLogWorker.metadata.terminal_logs.split('\n').map((line, idx) => renderLogLine(line, idx))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Terminal size={36} className="mx-auto mb-3 opacity-40 text-green-500" />
                  <p>Aguardando transmissão de logs do nó remoto...</p>
                  <p className="text-xs text-gray-600 mt-1">Clique em "Atualizar" se o worker estiver ativo.</p>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* RODAPÉ DO TERMINAL */}
            <div className="bg-black/90 px-6 py-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                C2 Live Link Ativo (Ring Buffer de 120 eventos)
              </span>
              <span>Worker OS: {activeLogWorker.metadata?.os || 'Desconhecido'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
