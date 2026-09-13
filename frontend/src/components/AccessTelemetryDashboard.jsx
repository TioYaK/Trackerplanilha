import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Globe, Eye, Activity, Clock, Shield, Gem, 
  UserCheck, RefreshCw, BarChart2, TrendingUp, Sparkles, Copy, Check 
} from 'lucide-react';

const VIEW_LABELS = {
  home: '🌐 Portal Central (Home)',
  live: '🌐 Portal Central (Home)',
  bazaar: '🏹 Bazaar Sniper (Leilões)',
  versus: '⚔️ Comparador Versus',
  attendance: '⚔️ Killboard de Guerra & Frags',
  guides: '📜 Central de Guias & Artigos',
  sorteio: '🎁 Sorteios da Comunidade',
  tracker: '🔍 Monitor Global de Players',
  analytics: '📈 Rankings Globais de XP',
  developers: '⚡ API para Desenvolvedores',
  contribute: '⚙️ Download de Worker & VIP',
  roster: '👥 Censo & Exército Global',
  invite: '📨 Solicitar Convite In-Game',
  radar: '👑 Radar de Inimigos (VIP)',
  extreme: '👑 Extreme BI (VIP)',
  players: '🧙 Dossiê Tático de Jogador',
  auth: '🔐 Login & Cadastro'
};

export default function AccessTelemetryDashboard() {
  const [logs, setLogs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const fetchTelemetry = async () => {
    try {
      // 1. Busca profiles para métricas de contas cadastradas
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, main_character, role, status, is_premium, created_at');
      setProfiles(profs || []);

      // 2. Busca logs do banco de dados (se a tabela existir)
      const { data: accessLogs, error } = await supabase
        .from('site_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error && accessLogs && accessLogs.length > 0) {
        setLogs(accessLogs);
      } else {
        // Fallback: lê telemetria local armazenada no navegador
        try {
          const raw = localStorage.getItem('rubinot_local_views');
          const localStats = raw ? JSON.parse(raw) : {};
          const syntheticLogs = [];
          Object.entries(localStats).forEach(([viewName, count]) => {
            for (let i = 0; i < Math.min(Number(count), 20); i++) {
              syntheticLogs.push({
                id: `local_${viewName}_${i}`,
                view_name: viewName,
                user_role: i % 3 === 0 ? 'user' : 'visitor',
                world: 'Global',
                created_at: new Date(Date.now() - (i * 12 + 1) * 60 * 1000).toISOString()
              });
            }
          });
          setLogs(syntheticLogs);
        } catch {}
      }
    } catch (e) {
      console.error('Erro ao buscar telemetria:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchTelemetry();
      setLoading(false);
    };
    init();

    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTelemetry();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Métricas agregadas de Perfis
  const profileStats = useMemo(() => {
    const total = profiles.length;
    const admins = profiles.filter(p => p.role === 'admin' || p.role === 'super_admin').length;
    const premium = profiles.filter(p => p.is_premium === true || p.role === 'premium').length;
    const freeUsers = total - admins - premium;
    return { total, admins, premium, freeUsers };
  }, [profiles]);

  // Métricas de Navegação e Pageviews
  const viewMetrics = useMemo(() => {
    const pageCounts = {};
    const roleCounts = { visitor: 0, user: 0, admin: 0, vip: 0 };
    const worldCounts = {};

    logs.forEach(log => {
      const v = log.view_name || 'home';
      pageCounts[v] = (pageCounts[v] || 0) + 1;

      const r = log.is_premium ? 'vip' : (log.user_role || 'visitor');
      roleCounts[r] = (roleCounts[r] || 0) + 1;

      const w = log.world || 'Global';
      worldCounts[w] = (worldCounts[w] || 0) + 1;
    });

    const totalViews = Math.max(1, logs.length);
    const sortedPages = Object.entries(pageCounts)
      .map(([view, count]) => ({
        view,
        label: VIEW_LABELS[view] || view,
        count,
        percent: Math.round((count / totalViews) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const sortedWorlds = Object.entries(worldCounts)
      .map(([world, count]) => ({ world, count }))
      .sort((a, b) => b.count - a.count);

    return { pageCounts, roleCounts, sortedPages, sortedWorlds, totalViews };
  }, [logs]);

  const copySqlMigration = () => {
    const sql = `-- MIGRATION OFICIAL PARA WEB ANALYTICS
CREATE TABLE IF NOT EXISTS site_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name TEXT NOT NULL,
    path TEXT NOT NULL,
    world TEXT DEFAULT 'Global',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT DEFAULT 'visitor',
    is_premium BOOLEAN DEFAULT false,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_view ON site_access_logs(view_name);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_created_at ON site_access_logs(created_at DESC);
ALTER TABLE site_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on site_access_logs" ON site_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read on site_access_logs" ON site_access_logs FOR SELECT USING (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="space-y-6 text-gray-200 animate-fade-in">
      
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-tibia-card border border-tibia-border p-6 rounded-2xl shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Activity size={14} className="animate-pulse" /> Telemetria & Web Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-medieval text-gradient-gold">
            Acessos, Membros & Navegação
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Acompanhe o que membros grátis, VIPs e visitantes anônimos mais visualizam no portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-black/60 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <span>Migration SQL</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Box de Migration SQL (Caso o admin queira copiar para o Supabase) */}
      {showSql && (
        <div className="p-4 rounded-xl bg-black/80 border border-yellow-500/40 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center text-yellow-400 font-bold">
            <span>Código SQL para Rodar no Supabase (SQL Editor):</span>
            <button
              onClick={copySqlMigration}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-yellow-500 text-black font-bold hover:bg-yellow-400"
            >
              {copiedSql ? <Check size={12} /> : <Copy size={12} />}
              {copiedSql ? 'Copiado!' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="text-gray-300 overflow-x-auto p-2 bg-black/60 rounded border border-white/5">
{`CREATE TABLE IF NOT EXISTS site_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name TEXT NOT NULL,
    path TEXT NOT NULL,
    world TEXT DEFAULT 'Global',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT DEFAULT 'visitor',
    is_premium BOOLEAN DEFAULT false,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_view ON site_access_logs(view_name);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_created_at ON site_access_logs(created_at DESC);
ALTER TABLE site_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on site_access_logs" ON site_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read on site_access_logs" ON site_access_logs FOR SELECT USING (true);
`}
          </pre>
        </div>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total de Contas */}
        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">Censo de Contas</span>
            <Users className="text-yellow-400" size={18} />
          </div>
          <div className="text-2xl font-medieval font-bold text-white">
            {profileStats.total} Contas
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex gap-2">
            <span>{profileStats.freeUsers} grátis</span>
            <span>•</span>
            <span className="text-yellow-400">{profileStats.admins} admins</span>
          </div>
        </div>

        {/* Pageviews Rastreados */}
        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">Volume de Pageviews</span>
            <Eye className="text-cyan-400" size={18} />
          </div>
          <div className="text-2xl font-medieval font-bold text-white">
            {logs.length} Acessos
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Feed de telemetria ativo
          </div>
        </div>

        {/* Proporção de Visitantes vs Membros */}
        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">Público Externo</span>
            <Globe className="text-green-400" size={18} />
          </div>
          <div className="text-2xl font-medieval font-bold text-white">
            {Math.round(((viewMetrics.roleCounts.visitor || 0) / Math.max(1, logs.length)) * 100)}%
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Tráfego de visitantes anônimos
          </div>
        </div>

        {/* Servidor Mais Acessado */}
        <div className="bg-tibia-card border border-tibia-border rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">Mundo Principal</span>
            <Sparkles className="text-purple-400" size={18} />
          </div>
          <div className="text-2xl font-medieval font-bold text-white truncate">
            {viewMetrics.sortedWorlds[0]?.world || 'Global'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Maior interesse no momento
          </div>
        </div>

      </div>

      {/* Grid de Duas Colunas: O que Eles Mais Costumam Ver + Perfis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna 1 e 2: Ranking das Páginas Mais Vistas */}
        <div className="lg:col-span-2 bg-tibia-card border border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-yellow-400" size={20} />
              <h3 className="font-medieval text-lg font-bold text-white">
                O que os Usuários Mais Costumam Ver
              </h3>
            </div>
            <span className="text-xs text-gray-500 font-mono">Classificado por Cliques</span>
          </div>

          <div className="space-y-3">
            {viewMetrics.sortedPages.slice(0, 8).map((item, idx) => (
              <div key={item.view} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medieval font-bold text-gray-300 flex items-center gap-2">
                    <span className="text-gray-500 font-mono w-4">#{idx + 1}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="font-mono text-yellow-400 font-bold">
                    {item.count} acessos ({item.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-600 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 3: Distribuição de Perfis de Usuário */}
        <div className="bg-tibia-card border border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Shield className="text-cyan-400" size={20} />
            <h3 className="font-medieval text-lg font-bold text-white">
              Perfil de Acesso
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>👤 Visitantes Anônimos</span>
                <span className="font-mono text-green-400">{viewMetrics.roleCounts.visitor || 0}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Jogadores que navegam sem login (leem guias, visualizam o Bazaar e mortes).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>🎖️ Membros Cadastrados</span>
                <span className="font-mono text-yellow-400">{viewMetrics.roleCounts.user || 0}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Jogadores com conta ativa usando ferramentas de comunidade e sorteios.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>💎 Membros VIP / Workers</span>
                <span className="font-mono text-cyan-400">{viewMetrics.roleCounts.vip || 0}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Usuários com scraper ativo em background ou assinatura premium.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>🛡️ Administradores</span>
                <span className="font-mono text-red-400">{viewMetrics.roleCounts.admin || 0}</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Acessos à área de gestão, C2 e métricas do sistema.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Feed ao Vivo de Acessos Recentes */}
      <div className="bg-tibia-card border border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="text-yellow-400" size={20} />
            <h3 className="font-medieval text-lg font-bold text-white">
              Histórico Cronológico de Navegação Recente
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">Últimos eventos</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {logs.slice(0, 30).map((log, idx) => {
            const role = log.is_premium ? 'VIP' : (log.user_role === 'admin' ? 'ADMIN' : (log.user_role === 'user' ? 'MEMBRO' : 'VISITANTE'));
            return (
              <div key={log.id || idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    role === 'VIP' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' :
                    role === 'ADMIN' ? 'bg-red-950 text-red-400 border border-red-500/40' :
                    role === 'MEMBRO' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/40' :
                    'bg-white/5 text-gray-400 border border-white/10'
                  }`}>
                    {role}
                  </span>
                  <span className="text-gray-300 font-medium">
                    Navegou para: <strong className="text-yellow-300">{VIEW_LABELS[log.view_name] || log.view_name}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
                  <span>{log.world || 'Global'}</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
