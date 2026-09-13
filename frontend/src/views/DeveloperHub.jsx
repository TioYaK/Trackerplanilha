import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Code2, Terminal, Key, Copy, Check, ExternalLink, ShieldCheck, 
  Zap, Server, RefreshCw, Cpu, Layers, DollarSign, CheckCircle2, 
  AlertCircle, Trash2, Eye, EyeOff, Play, Send, ChevronRight, Lock, Sparkles, Gem, HelpCircle, X
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://trackerplanilha.vercel.app';

export default function DeveloperHub({ user, profile, isAdmin, onNavigate }) {
  const [activeNavTab, setActiveNavTab] = useState('docs'); // 'docs' | 'keys' | 'pricing' | 'admin'
  const [selectedEndpoint, setSelectedEndpoint] = useState('character');
  const [codeLang, setCodeLang] = useState('curl'); // 'curl' | 'js' | 'python'
  
  // Estados das chaves
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [visibleKeyIds, setVisibleKeyIds] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState(null);

  // Estados do API Explorer (Testador ao vivo)
  const [testParams, setTestParams] = useState({
    name: 'Decayek',
    world: 'Auroria',
    limit: '10'
  });
  const [selectedKeyForTest, setSelectedKeyForTest] = useState('');
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Modal de Aluguel
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [selectedPlanToRent, setSelectedPlanToRent] = useState(null);
  const [pixCopied, setPixCopied] = useState(false);

  // Admin states
  const [allKeys, setAllKeys] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const userEmail = user?.email || profile?.email || '';

  // Carregar chaves do usuário
  const fetchUserKeys = async () => {
    if (!userEmail) return;
    setLoadingKeys(true);
    try {
      const res = await fetch(`/api/v1/keys?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (data.keys && data.keys.length > 0 && !selectedKeyForTest) {
          setSelectedKeyForTest(data.keys[0].key);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar chaves:', e);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Carregar todas as chaves (admin)
  const fetchAllKeysAdmin = async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/v1/keys?email=pifot16@gmail.com&admin=true`);
      if (res.ok) {
        const data = await res.json();
        setAllKeys(data.keys || []);
      }
    } catch (e) {
      console.warn('Erro admin chaves:', e);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchUserKeys();
    if (isAdmin) fetchAllKeysAdmin();
  }, [userEmail, isAdmin]);

  // Criar nova chave
  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!userEmail) {
      alert('Você precisa estar logado para gerar uma chave de API.');
      return;
    }
    setCreatingKey(true);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim() || 'Minha Aplicação',
          user_id: user?.id,
          user_email: userEmail,
          user_name: profile?.main_character || profile?.name || 'Dev'
        })
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setKeys([data.apiKey, ...keys]);
        setNewKeyName('');
        setSelectedKeyForTest(data.apiKey.key);
        alert('🎉 Chave de API criada com sucesso! Copie e guarde em segurança.');
      } else {
        alert(`Erro: ${data.error || 'Falha ao criar chave'}`);
      }
    } catch (err) {
      alert('Erro ao conectar ao servidor: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  // Revogar chave
  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Tem certeza que deseja revogar esta chave? Ela deixará de funcionar imediatamente.')) return;
    try {
      const res = await fetch(`/api/v1/keys?id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys(keys.map(k => k.id === keyId ? { ...k, status: 'REVOKED' } : k));
        if (isAdmin) setAllKeys(allKeys.map(k => k.id === keyId ? { ...k, status: 'REVOKED' } : k));
      }
    } catch (e) {
      alert('Erro ao revogar: ' + e.message);
    }
  };

  // Admin: Atualizar Tier
  const handleAdminUpdateTier = async (keyId, newTier) => {
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyId, tier: newTier })
      });
      if (res.ok) {
        setAllKeys(allKeys.map(k => k.id === keyId ? { ...k, tier: newTier } : k));
        fetchUserKeys();
        alert(`Plano atualizado para ${newTier} com sucesso!`);
      }
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  const toggleKeyVisibility = (id) => {
    const next = new Set(visibleKeyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleKeyIds(next);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Testar Endpoint ao vivo
  const handleTestRun = async () => {
    setTestingEndpoint(true);
    setTestResponse(null);
    setTestStatus(null);

    let endpointUrl = '';
    if (selectedEndpoint === 'character') {
      endpointUrl = `/api/v1/character?name=${encodeURIComponent(testParams.name || 'Decayek')}`;
    } else if (selectedEndpoint === 'onlines') {
      endpointUrl = `/api/v1/onlines?world=${encodeURIComponent(testParams.world || 'Auroria')}`;
    } else if (selectedEndpoint === 'deaths') {
      endpointUrl = `/api/v1/deaths?limit=${encodeURIComponent(testParams.limit || '10')}`;
    }

    const headers = {};
    if (selectedKeyForTest) {
      headers['Authorization'] = `Bearer ${selectedKeyForTest}`;
    }

    const t0 = performance.now();
    try {
      const res = await fetch(endpointUrl, { headers });
      const duration = Math.round(performance.now() - t0);
      const data = await res.json();
      setTestStatus({
        code: res.status,
        text: res.statusText || (res.ok ? 'OK' : 'Error'),
        duration,
        limit: res.headers.get('X-RateLimit-Limit') || 'N/A',
        remaining: res.headers.get('X-RateLimit-Remaining') || 'N/A'
      });
      setTestResponse(data);
    } catch (err) {
      setTestStatus({ code: 500, text: 'Network Error', duration: 0 });
      setTestResponse({ error: err.message });
    } finally {
      setTestingEndpoint(false);
    }
  };

  // Snippets de código por endpoint
  const getCodeSnippet = () => {
    const keyPlaceholder = selectedKeyForTest || 'bst_live_sua_chave_aqui';
    let path = '';
    if (selectedEndpoint === 'character') path = `/api/v1/character?name=${testParams.name || 'Decayek'}`;
    if (selectedEndpoint === 'onlines') path = `/api/v1/onlines?world=${testParams.world || 'Auroria'}`;
    if (selectedEndpoint === 'deaths') path = `/api/v1/deaths?limit=${testParams.limit || '10'}`;

    const fullUrl = `${API_BASE_URL}${path}`;

    if (codeLang === 'curl') {
      return `curl -X GET "${fullUrl}" \\
  -H "Authorization: Bearer ${keyPlaceholder}" \\
  -H "Accept: application/json"`;
    }

    if (codeLang === 'js') {
      return `// Node.js ou Navegador
const response = await fetch("${fullUrl}", {
  headers: {
    "Authorization": "Bearer ${keyPlaceholder}",
    "Accept": "application/json"
  }
});

const data = await response.json();
console.log(data);`;
    }

    if (codeLang === 'python') {
      return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer ${keyPlaceholder}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-tibia-bg bg-tibia-pattern pb-20 pt-4 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* 1. HERO DO DEVELOPER HUB */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3.5 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 shadow-inner">
                <Terminal size={14} className="text-yellow-400" />
                BattleStorm Developer API Engine
              </div>

              <h1 className="text-3xl sm:text-5xl font-medieval text-gradient-gold drop-shadow-lg leading-tight">
                Alugue a API do <span className="text-white">Rubinot Tracker</span>
              </h1>

              <p className="text-gray-300 font-sans text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                A infraestrutura de dados mais veloz e completa do Rubinot. Telemetria dos 6 servidores, radar de mortes instantâneo, monitoramento de makers e leilões direto no seu bot de Discord ou painel.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-950/50 border border-green-500/30 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  6 Mundos Conectados
                </div>
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold bg-yellow-950/50 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                  <Zap size={13} />
                  Bypass Cloudflare Embutido
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-950/50 border border-blue-500/30 px-3 py-1.5 rounded-lg">
                  <Server size={13} />
                  Latência Média &lt; 150ms
                </div>
              </div>
            </div>

            {/* Ações Rápidas do Topo */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setActiveNavTab('keys')}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-6 py-3 text-sm font-bold text-black shadow-xl transition-all active:scale-95"
              >
                <Key size={16} />
                <span>Minhas Chaves de API</span>
              </button>

              <button
                onClick={() => setActiveNavTab('pricing')}
                className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/40 bg-black/60 hover:bg-white/10 px-6 py-3 text-sm font-bold text-yellow-300 transition-all"
              >
                <DollarSign size={16} />
                <span>Planos & Aluguel</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. NAVEGAÇÃO ENTRE ABAS */}
        <div className="flex items-center border-b border-yellow-500/20 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveNavTab('docs')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeNavTab === 'docs'
                ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 size={15} /> Documentação & Playground
          </button>

          <button
            onClick={() => setActiveNavTab('keys')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeNavTab === 'keys'
                ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key size={15} /> Gerenciar Chaves ({keys.length})
          </button>

          <button
            onClick={() => setActiveNavTab('pricing')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeNavTab === 'pricing'
                ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gem size={15} /> Planos de Aluguel
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveNavTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                activeNavTab === 'admin'
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck size={15} /> Gestão Admin ({allKeys.length})
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: DOCUMENTAÇÃO INTERATIVA & PLAYGROUND                               */}
        {/* ========================================================================= */}
        {activeNavTab === 'docs' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Lado Esquerdo: Menu de Endpoints & Parâmetros (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-5 shadow-xl space-y-4">
                  <h3 className="text-base font-medieval font-bold text-white flex items-center gap-2 border-b border-tibia-border pb-3">
                    <Layers size={18} className="text-yellow-400" />
                    Endpoints Disponíveis
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedEndpoint('character')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedEndpoint === 'character'
                          ? 'border-yellow-500 bg-yellow-500/15 text-white shadow-md'
                          : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          GET
                        </span>
                        <span className="font-mono text-xs truncate">/api/v1/character</span>
                      </div>
                      <span className="text-[10px] text-gray-500">Personagem</span>
                    </button>

                    <button
                      onClick={() => setSelectedEndpoint('onlines')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedEndpoint === 'onlines'
                          ? 'border-yellow-500 bg-yellow-500/15 text-white shadow-md'
                          : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-green-500/20 text-green-400 border border-green-500/30">
                          GET
                        </span>
                        <span className="font-mono text-xs truncate">/api/v1/onlines</span>
                      </div>
                      <span className="text-[10px] text-gray-500">Mundos & Onlines</span>
                    </button>

                    <button
                      onClick={() => setSelectedEndpoint('deaths')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedEndpoint === 'deaths'
                          ? 'border-yellow-500 bg-yellow-500/15 text-white shadow-md'
                          : 'border-white/5 bg-black/40 text-gray-400 hover:border-white/20 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                          GET
                        </span>
                        <span className="font-mono text-xs truncate">/api/v1/deaths</span>
                      </div>
                      <span className="text-[10px] text-gray-500">Mural de Baixas</span>
                    </button>
                  </div>
                </div>

                {/* Parâmetros do Endpoint Selecionado */}
                <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-5 shadow-xl space-y-4">
                  <h3 className="text-base font-medieval font-bold text-white flex items-center gap-2 border-b border-tibia-border pb-3">
                    <Terminal size={18} className="text-yellow-400" />
                    Parâmetros da Consulta
                  </h3>

                  {selectedEndpoint === 'character' && (
                    <div>
                      <label className="block text-xs font-sans text-gray-400 mb-1">
                        Nome do Personagem (Query Param <code className="text-yellow-400">name</code>)
                      </label>
                      <input
                        type="text"
                        value={testParams.name}
                        onChange={(e) => setTestParams({ ...testParams, name: e.target.value })}
                        placeholder="Ex: Decayek, Kit Apanha..."
                        className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        Retorna nível, vocação, guilda, mundo e status online em tempo real.
                      </p>
                    </div>
                  )}

                  {selectedEndpoint === 'onlines' && (
                    <div>
                      <label className="block text-xs font-sans text-gray-400 mb-1">
                        Mundo Alvo (Query Param <code className="text-yellow-400">world</code>)
                      </label>
                      <select
                        value={testParams.world}
                        onChange={(e) => setTestParams({ ...testParams, world: e.target.value })}
                        className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      >
                        <option value="ALL">🌐 Todos os 6 Servidores (Global)</option>
                        <option value="Auroria">Auroria</option>
                        <option value="Belaria">Belaria</option>
                        <option value="Bellum">Bellum</option>
                        <option value="Tenebrium">Tenebrium</option>
                        <option value="Vesperia">Vesperia</option>
                        <option value="Malveria">Malveria</option>
                      </select>
                    </div>
                  )}

                  {selectedEndpoint === 'deaths' && (
                    <div>
                      <label className="block text-xs font-sans text-gray-400 mb-1">
                        Limite de Baixas (Query Param <code className="text-yellow-400">limit</code>)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={testParams.limit}
                        onChange={(e) => setTestParams({ ...testParams, limit: e.target.value })}
                        className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Seletor de Chave para Testar */}
                  <div className="pt-2 border-t border-tibia-border">
                    <label className="block text-xs font-sans text-gray-400 mb-1 flex items-center justify-between">
                      <span>Chave de Autenticação</span>
                      {keys.length === 0 && (
                        <span className="text-[10px] text-yellow-500">Crie uma chave na aba "Minhas Chaves"</span>
                      )}
                    </label>
                    <select
                      value={selectedKeyForTest}
                      onChange={(e) => setSelectedKeyForTest(e.target.value)}
                      className="w-full rounded-lg bg-black/60 border border-tibia-border px-3 py-2 text-xs font-mono text-yellow-400 focus:border-yellow-500 outline-none"
                    >
                      {keys.length > 0 ? (
                        keys.map(k => (
                          <option key={k.id} value={k.key}>
                            {k.name} ({k.tier}) - {k.key.slice(0, 14)}...
                          </option>
                        ))
                      ) : (
                        <option value="">Sem chave (Requisições retornarão 401)</option>
                      )}
                    </select>
                  </div>

                  <button
                    onClick={handleTestRun}
                    disabled={testingEndpoint}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 p-3 text-xs font-bold text-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Play size={14} className={testingEndpoint ? 'animate-spin' : ''} />
                    <span>{testingEndpoint ? 'Executando Requisição...' : 'Testar Requisição Agora'}</span>
                  </button>
                </div>
              </div>

              {/* Lado Direito: Snippets de Código & Resposta ao Vivo (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visualizador de Snippet */}
                <div className="bg-black/80 border-2 border-tibia-border rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-tibia-border">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500/80" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <span className="w-3 h-3 rounded-full bg-green-500/80" />
                      <span className="text-xs font-mono text-gray-400 ml-2">Exemplo de Integração</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                      {['curl', 'js', 'python'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => setCodeLang(lang)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase transition-all ${
                            codeLang === lang
                              ? 'bg-yellow-500 text-black shadow'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 relative">
                    <button
                      onClick={() => copyToClipboard(getCodeSnippet(), 'snippet')}
                      className="absolute right-6 top-6 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 backdrop-blur-sm"
                      title="Copiar código"
                    >
                      {copiedKey === 'snippet' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      <span>{copiedKey === 'snippet' ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <pre className="text-xs font-mono text-yellow-300/90 overflow-x-auto p-2 leading-relaxed">
                      {getCodeSnippet()}
                    </pre>
                  </div>
                </div>

                {/* Resposta do Teste ao Vivo */}
                <div className="bg-black/90 border-2 border-tibia-border rounded-2xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 bg-black/95 border-b border-tibia-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white uppercase font-sans">Resposta da API</span>
                      {testStatus && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          testStatus.code === 200 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {testStatus.code} {testStatus.text} • {testStatus.duration}ms
                        </span>
                      )}
                    </div>

                    {testStatus && (
                      <div className="text-[10px] font-mono text-gray-400">
                        Quota Restante: <strong className="text-yellow-400">{testStatus.remaining}</strong> / {testStatus.limit}
                      </div>
                    )}
                  </div>

                  <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs">
                    {testResponse ? (
                      <pre className="text-gray-300 leading-relaxed">
                        {JSON.stringify(testResponse, null, 2)}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-gray-600 font-sans text-xs">
                        Clique em "Testar Requisição Agora" para disparar a chamada e visualizar a resposta JSON em tempo real.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: GERENCIAMENTO DE CHAVES DE API                                     */}
        {/* ========================================================================= */}
        {activeNavTab === 'keys' && (
          <div className="space-y-6">
            
            {/* Header com formulário de criar chave */}
            <div className="bg-tibia-card border-2 border-tibia-border rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-tibia-border pb-4">
                <div>
                  <h3 className="text-lg font-medieval font-bold text-white flex items-center gap-2">
                    <Key size={18} className="text-yellow-400" />
                    Minhas Chaves de API
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">
                    Use estas credenciais no cabeçalho <code className="text-yellow-400">Authorization: Bearer &lt;KEY&gt;</code> para consumir os dados.
                  </p>
                </div>

                {userEmail ? (
                  <form onSubmit={handleCreateKey} className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Nome da aplicação (ex: Bot War)"
                      className="rounded-xl bg-black/60 border border-tibia-border px-3.5 py-2 text-xs text-white focus:border-yellow-500 outline-none w-full sm:w-64"
                      required
                    />
                    <button
                      type="submit"
                      disabled={creatingKey}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-black shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      <span>{creatingKey ? 'Gerando...' : '+ Nova Chave'}</span>
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => onNavigate('auth')}
                    className="flex items-center gap-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-4 py-2 shadow-md transition-all"
                  >
                    <Lock size={14} /> Fazer Login para Criar Chave
                  </button>
                )}
              </div>

              {/* Lista de Chaves */}
              {loadingKeys ? (
                <div className="py-12 text-center text-gray-400 text-xs">Carregando suas credenciais...</div>
              ) : keys.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
                    <Key size={24} />
                  </div>
                  <h4 className="text-base font-medieval font-bold text-white">Nenhuma chave de API gerada</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto font-sans">
                    Crie sua primeira chave no formulário acima para começar a integrar o Rubinot Tracker com seu projeto.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {keys.map(k => (
                    <div
                      key={k.id}
                      className="p-4 rounded-xl bg-black/60 border border-white/5 hover:border-yellow-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white font-medieval">{k.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-sans ${
                            k.tier === 'ENTERPRISE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : k.tier === 'PRO'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            Plano {k.tier}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            k.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {k.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs text-yellow-300/90 bg-black/80 px-3 py-1.5 rounded-lg border border-white/10 w-fit">
                          <span>
                            {visibleKeyIds.has(k.id) ? k.key : `${k.key.slice(0, 12)}••••••••••••••••••••••••`}
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(k.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title={visibleKeyIds.has(k.id) ? 'Ocultar' : 'Revelar'}
                          >
                            {visibleKeyIds.has(k.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(k.key, k.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copiar Chave"
                          >
                            {copiedKey === k.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-gray-500">
                          <span>Limite: <strong className="text-gray-300">{k.rate_limit} req/min</strong></span>
                          <span>Requisições realizadas: <strong className="text-gray-300">{k.requests_count || 0}</strong></span>
                          <span>Criada em: {new Date(k.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {k.tier === 'STARTER' && (
                          <button
                            onClick={() => {
                              setSelectedPlanToRent('PRO');
                              setRentalModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-black font-bold text-xs shadow transition-all"
                          >
                            Fazer Upgrade Pro ⚡
                          </button>
                        )}
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Revogar chave"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: PLANOS & ALUGUEL DE API                                            */}
        {/* ========================================================================= */}
        {activeNavTab === 'pricing' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-medieval text-gradient-gold font-bold">
                Escolha o Plano Ideal para a Sua Aplicação
              </h2>
              <p className="text-sm text-gray-400 font-sans">
                Cobrança flexível em Tibia Coins (in-game) ou Pix direto. Sem burocracia, ativação imediata.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PLANO 1: STARTER */}
              <div className="bg-tibia-card border-2 border-tibia-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Starter
                    </span>
                    <span className="text-xs text-gray-500 font-bold">Comunidade</span>
                  </div>

                  <div>
                    <div className="text-3xl font-bold font-medieval text-white">Grátis</div>
                    <p className="text-xs text-gray-400 mt-1">Para membros da guilda e apoiadores com worker ativo.</p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-tibia-border text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                      <span><strong>60 requisições</strong> por minuto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                      <span>Acesso a <code className="text-yellow-400">/character</code>, <code className="text-yellow-400">/onlines</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                      <span>Mural de Mortes Recentes <code className="text-yellow-400">/deaths</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                      <span>1 Chave de API ativa</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveNavTab('keys')}
                  className="w-full py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all"
                >
                  Começar Gratuitamente
                </button>
              </div>

              {/* PLANO 2: DEV PRO (DESTAQUE) */}
              <div className="relative bg-gradient-to-b from-yellow-950/40 via-black to-black border-2 border-yellow-500 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6 scale-105">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                  MAIS POPULAR ⭐
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                      Dev Pro ⚡
                    </span>
                    <span className="text-xs text-yellow-500 font-bold">Bots & Ferramentas</span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-medieval text-yellow-400">50 TC</span>
                      <span className="text-xs text-gray-400">/ mês</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ou R$ 15,00 via Pix. Ativação no mesmo dia.</p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-yellow-500/20 text-xs text-gray-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                      <span><strong>300 requisições</strong> por minuto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                      <span>Todos os endpoints com <strong>histórico estendido</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                      <span>Acesso ao <strong>Bazaar Sniper API</strong> (Leilões)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                      <span>Até <strong>3 Chaves de API</strong> simultâneas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-yellow-400 shrink-0" />
                      <span>Suporte técnico prioritário via Discord</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanToRent('PRO');
                    setRentalModalOpen(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-xs shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  Alugar Plano Pro Agora
                </button>
              </div>

              {/* PLANO 3: GUILD ENTERPRISE */}
              <div className="bg-tibia-card border-2 border-purple-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Guild Enterprise
                    </span>
                    <span className="text-xs text-purple-400 font-bold">War & High Frequency</span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-medieval text-purple-300">150 TC</span>
                      <span className="text-xs text-gray-400">/ mês</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Ou R$ 35,00 via Pix. Potência militar de espionagem.</p>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-tibia-border text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                      <span><strong>1.200 requisições</strong> por minuto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                      <span><strong>Webhooks em tempo real</strong> (Logins de Hunteds e Mortes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                      <span>Chaves de API ilimitadas para múltiplos bots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                      <span>Consultas de <strong>Warmode Radar Spy</strong> liberadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0" />
                      <span>Canal direto com o criador (YaK)</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanToRent('ENTERPRISE');
                    setRentalModalOpen(true);
                  }}
                  className="w-full py-2.5 rounded-xl border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-bold text-xs transition-all"
                >
                  Alugar Plano Enterprise
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: PAINEL ADMINISTRATIVO DE GESTÃO (EXCLUSIVO ADMIN)                 */}
        {/* ========================================================================= */}
        {activeNavTab === 'admin' && isAdmin && (
          <div className="bg-tibia-card border-2 border-red-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-tibia-border pb-3">
              <div>
                <h3 className="text-lg font-medieval font-bold text-red-400 flex items-center gap-2">
                  <ShieldCheck size={18} /> Gestão de Desenvolvedores e Aluguéis
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  Aprove planos Pro/Enterprise e gerencie os limites das chaves de API alugadas.
                </p>
              </div>
              <button
                onClick={fetchAllKeysAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
              >
                <RefreshCw size={13} className={adminLoading ? 'animate-spin' : ''} />
                Atualizar Lista
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="border-b border-tibia-border text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5">Aplicação</th>
                    <th>Desenvolvedor</th>
                    <th>Chave (Prefixo)</th>
                    <th>Plano / Tier</th>
                    <th>Limite</th>
                    <th>Requisições</th>
                    <th>Status</th>
                    <th className="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allKeys.map(k => (
                    <tr key={k.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-bold text-white">{k.name}</td>
                      <td className="text-gray-300">{k.user_email}</td>
                      <td className="font-mono text-yellow-400">{k.key.slice(0, 14)}...</td>
                      <td>
                        <select
                          value={k.tier}
                          onChange={(e) => handleAdminUpdateTier(k.id, e.target.value)}
                          className="rounded bg-black border border-white/20 px-2 py-1 text-[11px] font-bold text-yellow-400 outline-none"
                        >
                          <option value="STARTER">STARTER</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </td>
                      <td className="text-gray-400">{k.rate_limit} / min</td>
                      <td className="text-gray-300 font-mono">{k.requests_count || 0}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          k.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {k.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold"
                          >
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANNER DE PUBLICIDADE OFICIAL */}
        <AdBanner />

      </div>

      {/* MODAL DE ALUGUEL / PAGAMENTO */}
      {rentalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-yellow-500/60 bg-gradient-to-b from-yellow-950/80 via-black to-black p-6 sm:p-8 shadow-2xl text-left space-y-6">
            <button
              onClick={() => setRentalModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-2xl shrink-0">
                💎
              </div>
              <div>
                <h3 className="text-xl font-medieval font-bold text-white">
                  Alugar Plano {selectedPlanToRent === 'ENTERPRISE' ? 'Guild Enterprise' : 'Dev Pro'}
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  {selectedPlanToRent === 'ENTERPRISE' ? '150 Tibia Coins ou R$ 35,00 / mês' : '50 Tibia Coins ou R$ 15,00 / mês'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans text-gray-300">
              {/* Opção 1: Tibia Coins in-game */}
              <div className="p-4 rounded-2xl bg-yellow-950/30 border border-yellow-500/30 space-y-2">
                <div className="flex items-center justify-between font-bold text-yellow-400 uppercase text-[11px]">
                  <span>Opção 1: Tibia Coins In-Game (Mais Rápido)</span>
                  <span className="text-white font-medieval">{selectedPlanToRent === 'ENTERPRISE' ? '150 TC' : '50 TC'}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Transfira as Tibia Coins para o personagem <strong className="text-white">Kit Apanha</strong> ou <strong className="text-white">Pacozk</strong> (Auroria) e informe seu email na mensagem de transferência: <code className="text-yellow-400 font-mono">{userEmail || 'seu-email@aqui.com'}</code>.
                </p>
              </div>

              {/* Opção 2: Pix */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between font-bold text-white uppercase text-[11px]">
                  <span>Opção 2: Pagamento via Pix</span>
                  <span className="text-green-400 font-bold">{selectedPlanToRent === 'ENTERPRISE' ? 'R$ 35,00' : 'R$ 15,00'}</span>
                </div>
                <p className="text-gray-400">
                  Chave Pix (Email): <strong className="text-yellow-300 font-mono select-all">pifot16@gmail.com</strong>
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('pifot16@gmail.com');
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all"
                >
                  {pixCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  <span>{pixCopied ? 'Chave Copiada!' : 'Copiar Chave Pix'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30 text-[11px] text-blue-300 flex items-start gap-2">
                <HelpCircle size={15} className="shrink-0 mt-0.5 text-blue-400" />
                <span>
                  Após o envio, envie o comprovante ou informe o admin no Discord da guilda. Sua chave será promovida imediatamente para o plano alugado!
                </span>
              </div>
            </div>

            <button
              onClick={() => setRentalModalOpen(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg transition-all"
            >
              Entendido / Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
