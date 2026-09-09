import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Server, Activity, HardDrive, Cpu, Terminal, RefreshCw, PowerOff, MessageSquare, Clock, ShieldAlert, User, Database, Zap, Trash2, XCircle, Play, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WorkerDashboard() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingCmd, setSendingCmd] = useState(null);

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('worker_heartbeats')
        .select('*')
        .order('last_ping', { ascending: false });
        
      if (!error && data) {
        setWorkers(data);
      }
    } catch (err) {
      console.error('Erro ao buscar workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (workerId, command, payload = {}) => {
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
      alert(`Comando ${command} enviado com sucesso para ${workerId}!`);
    } catch (err) {
      alert(`Falha ao enviar comando: ${err.message}`);
    } finally {
      setSendingCmd(null);
    }
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

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Carregando painel C2...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full animate-fade-in relative">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-4xl font-medieval text-gradient-gold mb-2 flex items-center">
            <Terminal className="mr-3 text-green-500" size={36} />
            Worker C2 Dashboard
          </h2>
          <p className="text-gray-400">Painel de Comando e Controle da Rede Neural (SuperAdmin)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceUpdateAll}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 border border-blue-400 text-sm transition-all"
          >
            <RefreshCw size={16} className="mr-2" />
            ⚡ Forçar Atualização em Todos
          </button>
          <div className="bg-black/60 border border-tibia-border p-3 rounded-lg text-sm text-gray-300">
            Total Nodes: <span className="text-green-400 font-bold">{workers.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workers.map(w => {
          const isOnline = w.last_ping ? new Date(w.last_ping).getTime() > Date.now() - 5 * 60 * 1000 : false;
          return (
            <div key={w.worker_id} className={`bg-tibia-card border ${isOnline ? 'border-green-900/50' : 'border-red-900/50'} p-6 rounded-lg shadow-xl`}>
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

              {w.metadata && (
                <div className="flex flex-col gap-3 mb-6 bg-black/40 p-4 rounded border border-white/5 text-sm">
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
                      <p className="text-gray-500 text-xs">Versão</p>
                      <p className="text-gray-300">v{w.version}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-white/5 items-center">
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
                      <p className="text-gray-500 text-xs mb-1">Localidade do Host</p>
                      <p className="text-gray-300 truncate">{w.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 mt-4 border-t border-tibia-border pt-4">
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
    </div>
  );
}
