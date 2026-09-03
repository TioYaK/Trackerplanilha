import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Server, Activity, HardDrive, Cpu, Terminal, RefreshCw, PowerOff, MessageSquare, Clock, ShieldAlert, User } from 'lucide-react';
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (workerId, command, payload = {}) => {
    if (!window.confirm(`Tem certeza que deseja enviar o comando ${command} para este Worker?`)) return;
    
    setSendingCmd(workerId);
    try {
      await supabase.from('worker_commands').insert({
        worker_id: workerId,
        command: command,
        payload: payload
      });
      alert(`Comando ${command} enviado com sucesso! O Worker deve executar em instantes se estiver online.`);
    } catch (e) {
      alert('Erro ao enviar comando: ' + e.message);
    } finally {
      setSendingCmd(null);
    }
  };

  const handleCustomMessage = (workerId) => {
    const msg = window.prompt('Digite a mensagem para enviar como Pop-up (Alarme) neste PC:');
    if (msg) {
      sendCommand(workerId, 'POPUP_MESSAGE', { message: msg });
    }
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
        <div className="bg-black/60 border border-tibia-border p-3 rounded-lg text-sm text-gray-300">
          Total Nodes: <span className="text-green-400 font-bold">{workers.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {workers.map(w => {
          const isOnline = new Date(w.last_ping).getTime() > Date.now() - 5 * 60 * 1000;
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
                    {formatDistanceToNow(new Date(w.last_ping), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>

              {w.metadata && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-black/40 p-4 rounded border border-white/5 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">CPU</p>
                    <p className="text-gray-300 flex items-center"><Cpu size={12} className="mr-1"/> {w.metadata.cpu}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">RAM</p>
                    <p className="text-gray-300 flex items-center"><HardDrive size={12} className="mr-1"/> {w.metadata.ram}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Localidade</p>
                    <p className="text-gray-300">{w.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Versão</p>
                    <p className="text-gray-300">v{w.version}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4 border-t border-tibia-border pt-4">
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => sendCommand(w.worker_id, 'FORCE_UPDATE')}
                  className="flex items-center px-4 py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border border-blue-900/50 rounded transition-colors text-sm font-bold"
                >
                  <RefreshCw size={16} className={`mr-2 ${sendingCmd === w.worker_id ? 'animate-spin' : ''}`} />
                  Forçar Update
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => sendCommand(w.worker_id, 'RESTART_PC')}
                  className="flex items-center px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded transition-colors text-sm font-bold"
                >
                  <PowerOff size={16} className="mr-2" />
                  Reiniciar Computador
                </button>
                <button 
                  disabled={sendingCmd === w.worker_id}
                  onClick={() => handleCustomMessage(w.worker_id)}
                  className="flex items-center px-4 py-2 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 border border-yellow-900/50 rounded transition-colors text-sm font-bold"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Enviar Pop-up
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
