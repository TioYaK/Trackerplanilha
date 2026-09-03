import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Server, Cpu, Clock, AlertTriangle, CheckCircle, BarChart2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('guild'); // 'guild' or 'workers'
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [workers, setWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [onlineHistory, setOnlineHistory] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [dbSize, setDbSize] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Workers
        const { data: heartbeats } = await supabase
          .from('worker_heartbeats')
          .select('*')
          .order('last_ping', { ascending: false });
        
        // 2. Fetch Active Tasks
        const { data: activeTasks } = await supabase
          .from('task_queue')
          .select('*')
          .eq('status', 'IN_PROGRESS');

        // 3. Fetch Online History (Last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const { data: history } = await supabase
          .from('online_history')
          .select('*')
          .gte('timestamp', sevenDaysAgo)
          .order('timestamp', { ascending: true });

        // 4. Fetch Task History (Last 24h)
        const oneDayAgo = subDays(new Date(), 1).toISOString();
        const { data: tHistory } = await supabase
          .from('task_history')
          .select('*')
          .gte('completed_at', oneDayAgo);

        // Fetch DB Size
        const { data: sizeData } = await supabase.rpc('get_db_size');

        setWorkers(heartbeats || []);
        setTasks(activeTasks || []);
        setOnlineHistory(history || []);
        setTaskHistory(tHistory || []);
        if (sizeData) setDbSize(Number(sizeData));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30 * 1000); // 30 segundos para tempo real
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const cutoffLimit = new Date(now.getTime() - 12 * 60 * 1000); // 12 minutos
  const activeWorkers = workers.filter(w => new Date(w.last_ping) > cutoffLimit);

  // --- Process Data for Charts ---

  // 1. Online History Chart
  const chartData = onlineHistory.map(row => ({
    time: format(new Date(row.timestamp), 'dd/MM HH:mm'),
    timestamp: new Date(row.timestamp).getTime(),
    players: row.online_count
  })).filter((_, i, arr) => i % Math.ceil(arr.length / 50) === 0 || i === arr.length -1);

  // 2. Worker Performance (Task History)
  const workerPerf = {};
  let totalTasks = 0;
  taskHistory.forEach(th => {
    if (!workerPerf[th.worker_id]) {
      workerPerf[th.worker_id] = { name: th.worker_id, count: 0, totalTime: 0 };
    }
    const c = th.task_count || 1;
    workerPerf[th.worker_id].count += c;
    workerPerf[th.worker_id].totalTime += th.duration_ms;
    totalTasks += c;
  });

  const perfData = Object.values(workerPerf).map(w => ({
    name: w.name.substring(0, 10) + '...',
    tarefas: w.count,
    avg_speed: (w.totalTime / w.count / 1000).toFixed(1)
  }));

  // Render components
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in text-gray-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h1 className="text-3xl font-medieval text-tibia-highlight flex items-center">
            <BarChart2 className="mr-3" />
            Central de Inteligência (Analytics)
          </h1>
          <p className="text-gray-400 mt-2">Monitoramento da Guilda e da Frota de Workers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={() => setActiveTab('guild')}
          className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'guild' ? 'bg-tibia-primary text-white border border-tibia-highlight' : 'bg-black/30 text-gray-400 hover:bg-black/50 border border-tibia-border'}`}
        >
          📈 Atividade da Guilda
        </button>
        <button 
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded font-bold transition-colors ${activeTab === 'workers' ? 'bg-tibia-primary text-white border border-tibia-highlight' : 'bg-black/30 text-gray-400 hover:bg-black/50 border border-tibia-border'}`}
        >
          💻 Frota de Processamento
        </button>
      </div>

      {loading && workers.length === 0 ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tibia-primary"></div></div>
      ) : (
        <>
          {/* TAB: GUILD */}
          {activeTab === 'guild' && (
            <div className="space-y-6">
              <div className="bg-tibia-card border border-tibia-border p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-tibia-border/50 pb-2 flex items-center">
                  <Activity className="mr-2 text-tibia-primary" /> Histórico de Players Online (7 Dias)
                </h3>
                {chartData.length > 0 ? (
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="time" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                        <YAxis stroke="#888" tick={{ fill: '#888' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', borderColor: '#DAA520', color: '#fff' }}
                          itemStyle={{ color: '#DAA520' }}
                        />
                        <Line type="monotone" dataKey="players" name="Players Online" stroke="#DAA520" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-10 italic">Aguardando dados suficientes para gerar o gráfico... O Worker precisa rodar mais vezes!</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: WORKERS */}
          {activeTab === 'workers' && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-green-500/20 p-3 rounded-full mr-4 border border-green-500/30">
                    <CheckCircle className="text-green-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Workers Ativos Agora</p>
                    <p className="text-3xl font-bold text-white">{activeWorkers.length}</p>
                  </div>
                </div>
                
                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-blue-500/20 p-3 rounded-full mr-4 border border-blue-500/30">
                    <Server className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Tarefas em Fila/Rodando</p>
                    <p className="text-3xl font-bold text-white">{tasks.length}</p>
                  </div>
                </div>

                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center">
                  <div className="bg-purple-500/20 p-3 rounded-full mr-4 border border-purple-500/30">
                    <Activity className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-bold uppercase">Total Raspado (24h)</p>
                    <p className="text-3xl font-bold text-white">{totalTasks}</p>
                  </div>
                </div>
                
                {/* Storage Alert Box */}
                <div className="bg-black/30 border border-tibia-border p-4 rounded flex items-center relative overflow-hidden">
                  <div className="bg-orange-500/20 p-3 rounded-full mr-4 border border-orange-500/30 relative z-10">
                    <AlertTriangle className="text-orange-400" size={24} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm text-gray-400 font-bold uppercase">Uso do Disco (500MB)</p>
                    {dbSize === null ? (
                       <p className="text-sm font-bold text-gray-500 mt-1">Carregando...</p>
                    ) : (
                       <>
                         <p className="text-2xl font-bold text-white mb-1">
                           {(dbSize / 1024 / 1024).toFixed(1)} MB <span className="text-sm text-gray-500 font-normal">({((dbSize / 524288000) * 100).toFixed(1)}%)</span>
                         </p>
                         <div className="w-full bg-gray-800 rounded-full h-2">
                           <div className={`h-2 rounded-full ${dbSize > 400000000 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, (dbSize / 524288000) * 100)}%` }}></div>
                         </div>
                       </>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              {perfData.length > 0 && (
                 <div className="bg-tibia-card border border-tibia-border p-6 rounded-lg shadow-lg">
                   <h3 className="text-xl font-bold text-gray-300 mb-4 border-b border-tibia-border/50 pb-2">Desempenho dos Computadores (24h)</h3>
                   <div className="h-[250px] w-full flex flex-col md:flex-row gap-8">
                     <div className="flex-1">
                       <h4 className="text-sm font-bold text-gray-400 mb-2">Volume de Tarefas</h4>
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={perfData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                           <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
                           <YAxis stroke="#888" yAxisId="left" orientation="left" />
                           <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#4A5568', color: '#fff' }} />
                           <Legend />
                           <Bar yAxisId="left" dataKey="tarefas" name="Tarefas Concluídas" fill="#4299e1" radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                 </div>
              )}

              {/* Workers List */}
              <div className="bg-tibia-card border border-tibia-border p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4 border-b border-tibia-border/50 pb-2">
                  <h3 className="text-xl font-bold text-gray-300">Tropa de Raspagem</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').insert({ task_type: 'UPDATE_WORKERS', status: 'PENDING', locked_at: new Date(Date.now() - 1000).toISOString() });
                           alert('Comando de Auto-Update (Git Pull) enviado para a fila! Um worker vai pegar em alguns segundos e reiniciar.');
                        } catch (e) {
                           alert('Erro ao enviar update.');
                        }
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Auto-Update Geral
                    </button>
<button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).in('task_type', ['FETCH_ONLINES', 'FETCH_GUILD', 'AUDIT_SLOTS']);
                           alert('Ordem de Radar/Online enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Radar / Online
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).in('task_type', ['FETCH_HIGHSCORE_KNIGHT', 'FETCH_HIGHSCORE_PALADIN', 'FETCH_HIGHSCORE_DRUID', 'FETCH_HIGHSCORE_SORCERER', 'FETCH_HIGHSCORE_MONK']);
                           alert('Ordem de Highscores enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Highscores (XP)
                    </button>
                    
                    <button 
                      onClick={async () => {
                        try {
                           await supabase.from('task_queue').update({ status: 'PENDING', locked_at: new Date(Date.now() - 3600000).toISOString() }).in('task_type', ['FETCH_BAZAAR', 'FETCH_TRANSFERS', 'FETCH_DEATHS']);
                           alert('Ordem de Mercado/Mortes enviada!');
                        } catch (e) { alert('Erro'); }
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors flex items-center"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Forçar Mercado/Mortes
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {activeWorkers.map(worker => {
                    const isActive = true; // since they are all active
                    const currentTask = tasks.find(t => t.worker_id === worker.worker_id);
                    
                    return (
                      <div key={worker.worker_id} className={`p-4 rounded border ${isActive ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30 opacity-70'}`}>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          {/* Info */}
                          <div className="flex-1">
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
                            <p className="text-sm text-gray-500 mt-2">
                              Versão: {worker.version || 'Desconhecida'} | Localização: {worker.location || 'Desconhecida'}
                            </p>
                            {worker.metadata && worker.metadata.os && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400 bg-black/30 p-2 rounded border border-tibia-border/50">
                                <div><strong className="text-gray-300">💻 OS:</strong> {worker.metadata.os}</div>
                                <div><strong className="text-gray-300">🟢 Node:</strong> {worker.metadata.node_version}</div>
                                <div className="sm:col-span-2"><strong className="text-gray-300">🧠 CPU:</strong> {worker.metadata.cpu} ({worker.metadata.cores} Cores)</div>
                                <div><strong className="text-gray-300">🐏 RAM:</strong> {worker.metadata.ram}</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Task */}
                          <div className="md:w-1/3 bg-black/40 rounded p-3 border border-tibia-border/50 flex-shrink-0">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Processando Agora</h4>
                            {currentTask ? (
                              <div>
                                <span className="text-tibia-highlight font-bold font-mono">{currentTask.task_type}</span>
                                <p className="text-xs text-gray-400 mt-1">Trabalhando há {formatDistanceToNow(new Date(currentTask.locked_at), { locale: ptBR })}</p>
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
                  {activeWorkers.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum worker ativo no momento.</div>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
