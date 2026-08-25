import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Server, Activity, Clock, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WorkerAnalyticsModal({ isOpen, onClose }) {
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all workers
        const { data: heartbeats } = await supabase
          .from('worker_heartbeats')
          .select('*')
          .order('last_ping', { ascending: false });

        // Fetch active tasks
        const { data: activeTasks } = await supabase
          .from('task_queue')
          .select('*')
          .eq('status', 'IN_PROGRESS');

        setWorkers(heartbeats || []);
        setTasks(activeTasks || []);
      } catch (err) {
        console.error('Error fetching worker analytics', err);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds while open
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const now = new Date();
  const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);

  const activeWorkers = workers.filter(w => new Date(w.last_ping) > twoMinsAgo);
  const inactiveWorkers = workers.filter(w => new Date(w.last_ping) <= twoMinsAgo);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      <div className="bg-tibia-card border-2 border-tibia-primary rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-tibia-border bg-black/40">
          <h2 className="text-2xl font-medieval text-tibia-highlight flex items-center">
            <Server className="mr-3" />
            Worker Analytics
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && workers.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tibia-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-green-500/20 p-3 rounded-full mr-4 border border-green-500/30">
                    <CheckCircle className="text-green-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Workers Ativos</p>
                    <p className="text-3xl font-bold text-white">{activeWorkers.length}</p>
                  </div>
                </div>
                
                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-blue-500/20 p-3 rounded-full mr-4 border border-blue-500/30">
                    <Activity className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Tarefas Rodando</p>
                    <p className="text-3xl font-bold text-white">{tasks.length}</p>
                  </div>
                </div>

                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-red-500/20 p-3 rounded-full mr-4 border border-red-500/30">
                    <AlertTriangle className="text-red-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Workers Inativos</p>
                    <p className="text-3xl font-bold text-white">{inactiveWorkers.length}</p>
                  </div>
                </div>
              </div>

              {/* Workers List */}
              <div>
                <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-tibia-border pb-2">Nós de Processamento</h3>
                <div className="grid grid-cols-1 gap-4">
                  {workers.map(worker => {
                    const isActive = new Date(worker.last_ping) > twoMinsAgo;
                    const currentTask = tasks.find(t => t.worker_id === worker.worker_id);
                    
                    return (
                      <div key={worker.worker_id} className={`p-4 rounded border ${isActive ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30 opacity-70'}`}>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          {/* Info */}
                          <div>
                            <div className="flex items-center mb-1">
                              <Cpu className={`mr-2 ${isActive ? 'text-green-400' : 'text-red-400'}`} size={20} />
                              <span className="font-bold text-lg text-white">{worker.worker_id}</span>
                              <span className={`ml-3 px-2 py-0.5 text-xs font-bold rounded ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isActive ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 flex items-center mt-2">
                              <Clock size={14} className="mr-1" />
                              Último ping: {formatDistanceToNow(new Date(worker.last_ping), { addSuffix: true, locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-400 flex items-center mt-1">
                              <Activity size={14} className="mr-1" />
                              Uptime: começou {formatDistanceToNow(new Date(worker.started_at), { addSuffix: true, locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Versão: {worker.version || 'Desconhecida'}
                            </p>
                          </div>
                          
                          {/* Task */}
                          <div className="md:w-1/3 bg-black/40 rounded p-3 border border-tibia-border/50 flex-shrink-0">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Processando Agora</h4>
                            {currentTask ? (
                              <div>
                                <span className="text-tibia-highlight font-bold font-mono">{currentTask.task_type}</span>
                                <p className="text-xs text-gray-400 mt-1">Tarefa travada {formatDistanceToNow(new Date(currentTask.locked_at), { addSuffix: true, locale: ptBR })}</p>
                              </div>
                            ) : (
                              <div className="text-gray-500 flex items-center h-full">
                                <span className="italic">{isActive ? 'Ocioso (Aguardando fila)' : 'Desconectado'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {workers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum worker registrou heartbeat ainda.
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
