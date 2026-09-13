import React, { useState, useEffect } from 'react';
import { 
  Bell, Send, ShieldAlert, Flame, Gem, CheckCircle2, AlertTriangle, 
  Trash2, Plus, ExternalLink, Sparkles, RefreshCw, Zap, Clock, Swords, Check
} from 'lucide-react';
import { soundFX } from '../lib/soundEffects';
import AdBanner from '../components/AdBanner';

export default function DiscordWebhooks({ isPremium }) {
  const [webhooks, setWebhooks] = useState(() => {
    try {
      const saved = localStorage.getItem('rubinot_discord_webhooks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [channelType, setChannelType] = useState('bazaar'); // 'bazaar', 'war', 'hunteds', 'all'
  
  // Regras de Alerta
  const [alertSanguine, setAlertSanguine] = useState(true);
  const [maxSanguinePrice, setMaxSanguinePrice] = useState('4500');
  const [alertSoulwar, setAlertSoulwar] = useState(true);
  const [maxSoulwarPrice, setMaxSoulwarPrice] = useState('2500');
  const [alertHunteds, setAlertHunteds] = useState(true);
  const [alertEndingSoon, setAlertEndingSoon] = useState(true);
  const [alertMassacres, setAlertMassacres] = useState(true);

  const [testingWebhookId, setTestingWebhookId] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('rubinot_discord_webhooks', JSON.stringify(webhooks));
    } catch (e) {}
  }, [webhooks]);

  const handleAddWebhook = (e) => {
    e.preventDefault();
    if (!urlInput.trim() || !urlInput.includes('discord.com/api/webhooks')) {
      alert('Por favor, insira uma URL de Webhook válida do Discord (ex: https://discord.com/api/webhooks/...)');
      return;
    }

    const newWebhook = {
      id: Date.now().toString(),
      name: nameInput.trim() || 'Canal Discord Principal',
      url: urlInput.trim(),
      channelType,
      createdAt: new Date().toISOString(),
      active: true
    };

    setWebhooks(prev => [...prev, newWebhook]);
    setNameInput('');
    setUrlInput('');
    soundFX.playSuccess();
  };

  const handleDeleteWebhook = (id) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleTestWebhook = async (webhook) => {
    setTestingWebhookId(webhook.id);
    setTestStatus(null);

    const payload = {
      username: 'Rubinot Tracker Bot 👑',
      avatar_url: 'https://rubinot.com.br/favicon.ico',
      embeds: [
        {
          title: '⚔️ [Rubinot Tracker] Conexão de Webhook Bem-Sucedida!',
          description: `Este canal está oficialmente conectado ao sistema de inteligência e telemetria do **Rubinot Tracker**.\n\nVocê receberá notificações automáticas em tempo real para os filtros selecionados!`,
          color: 16755200, // Amarelo Ouro
          fields: [
            {
              name: '🎯 Canal Vinculado',
              value: webhook.name,
              inline: true
            },
            {
              name: '🔔 Tipo de Alertas',
              value: webhook.channelType.toUpperCase(),
              inline: true
            },
            {
              name: '🩸 Regras Ativas',
              value: `• Sanguine até ${maxSanguinePrice} TC\n• Soulwar até ${maxSoulwarPrice} TC\n• Hunteds no Bazaar: ${alertHunteds ? 'SIM' : 'NÃO'}\n• Massacres de War: ${alertMassacres ? 'SIM' : 'NÃO'}`,
              inline: false
            }
          ],
          footer: {
            text: 'Rubinot Tracker • Telemetria & Sniper de Leilões'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTestStatus({ success: true, message: 'Mensagem de teste enviada com sucesso para o seu Discord!' });
        soundFX.playSuccess();
      } else {
        setTestStatus({ success: false, message: `Falha ao enviar: Discord respondeu com HTTP ${res.status}` });
      }
    } catch (err) {
      setTestStatus({ success: false, message: 'Erro de rede ou URL inválida: ' + err.message });
    } finally {
      setTestingWebhookId(null);
      setTimeout(() => setTestStatus(null), 5000);
    }
  };

  const handleSendSampleSniper = async (webhook) => {
    setTestingWebhookId(webhook.id + '_sample');
    setTestStatus(null);

    const samplePayload = {
      username: 'Bazaar Sniper Alert 🩸',
      avatar_url: 'https://rubinot.com.br/favicon.ico',
      embeds: [
        {
          title: '🩸 LEILÃO GRAIL ENCONTRADO: Fell Darkside (Lvl 1180)',
          url: 'https://rubinot.com.br/bazaar/history',
          description: 'Um novo personagem com itens **Sanguine (Rotten Blood)** foi detectado no Char Bazaar!',
          color: 15147318, // Vermelho Carmesim
          fields: [
            { name: '👤 Personagem', value: 'Fell Darkside', inline: true },
            { name: '🧙 Vocação', value: 'Elder Druid (ED)', inline: true },
            { name: '🌍 Mundo', value: 'Auroria (Open-PvP)', inline: true },
            { name: '💰 Lance Atual', value: '**1.800 TC**', inline: true },
            { name: '📊 Avaliação FIPE', value: '~4.650 TC', inline: true },
            { name: '🔥 Lucro Estimado', value: '**+2.292 TC (+61%)**', inline: true },
            { name: '🎒 Itens BiS', value: '• Sanguine Rod (Rotten Blood)\n• Sanguine Boots T1\n• Pair of Soulstalkers', inline: false },
            { name: '⏳ Término', value: 'Hoje às 22:00 BRT (Restam 2h 15m)', inline: false }
          ],
          footer: { text: 'Rubinot Bazaar Sniper Pro • Clique no título para abrir o leilão' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });

      if (res.ok) {
        setTestStatus({ success: true, message: 'Embed de demonstração de Sniper enviado para o Discord!' });
        soundFX.playSuccess();
      } else {
        setTestStatus({ success: false, message: `Falha: Discord HTTP ${res.status}` });
      }
    } catch (e) {
      setTestStatus({ success: false, message: 'Erro: ' + e.message });
    } finally {
      setTestingWebhookId(null);
      setTimeout(() => setTestStatus(null), 5000);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* HERO BANNER DISCORD WEBHOOKS */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-950/40 via-stone-950 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/50 bg-indigo-500/15 px-3.5 py-1 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 shadow-inner">
              <Bell size={14} className="text-indigo-400 animate-pulse" />
              Notificações Automáticas no Discord • Alertas 24/7
            </div>

            <h1 className="text-3xl sm:text-5xl font-medieval text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 drop-shadow-lg leading-tight">
              Central de Webhooks do Discord <span className="text-white">📢</span>
            </h1>
            
            <p className="text-gray-300 font-sans text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Receba alertas ricos diretamente nos canais de texto do Discord da sua guilda! Não perca pechinchas de itens <strong className="text-red-400">Sanguine</strong> e <strong className="text-purple-400">Soulwar</strong>, avise os membros quando um <strong className="text-yellow-400">Hunted</strong> entrar em leilão ou quando uma guerra estourar!
            </p>
          </div>

          <div className="bg-stone-900/90 border border-indigo-500/30 p-4 rounded-2xl flex flex-col gap-2 min-w-[240px] shadow-xl">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} /> Como Obter o Webhook
            </span>
            <div className="text-xs text-gray-400 space-y-1">
              <div>1. No seu Discord, clique na ⚙️ engrenagem do canal</div>
              <div>2. Vá em <strong>Integrações</strong> &gt; <strong>Webhooks</strong></div>
              <div>3. Clique em <strong>Novo Webhook</strong> e copie a URL</div>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK STATUS */}
      {testStatus && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 animate-fade-in shadow-xl ${
          testStatus.success 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          {testStatus.success ? <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> : <AlertTriangle size={18} className="shrink-0 text-red-400" />}
          <span>{testStatus.message}</span>
        </div>
      )}

      {/* CADASTRO DE NOVO WEBHOOK */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Plus size={18} className="text-indigo-400" /> Conectar Novo Canal do Discord
        </h2>

        <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Nome de Identificação
            </label>
            <input
              type="text"
              placeholder="Ex: #sniper-bazaar ou #alertas-war"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              URL do Webhook do Discord
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-black text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus size={16} />
              <span>Adicionar Canal</span>
            </button>
          </div>
        </form>
      </div>

      {/* REGRAS DE NOTIFICAÇÃO CONFIGURÁVEIS */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-yellow-400 flex items-center gap-2">
          <Sparkles size={18} /> Regras de Gatilho de Alerta
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Regra Sanguine */}
          <div className="bg-stone-950/80 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Flame size={14} /> Alerta Sanguine (Rotten Blood)
              </span>
              <input
                type="checkbox"
                checked={alertSanguine}
                onChange={(e) => setAlertSanguine(e.target.checked)}
                className="accent-red-600 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Notificar quando qualquer char com item Sanguine estiver por valor igual ou inferior a:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxSanguinePrice}
                onChange={(e) => setMaxSanguinePrice(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-yellow-400 font-mono font-bold"
              />
              <span className="text-xs text-gray-400 font-bold">TC</span>
            </div>
          </div>

          {/* Regra Soulwar */}
          <div className="bg-stone-950/80 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Gem size={14} /> Alerta Soulwar Gear
              </span>
              <input
                type="checkbox"
                checked={alertSoulwar}
                onChange={(e) => setAlertSoulwar(e.target.checked)}
                className="accent-purple-600 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Notificar itens Soulwar (Stalkers, Shells, etc.) abaixo de:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxSoulwarPrice}
                onChange={(e) => setMaxSoulwarPrice(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-yellow-400 font-mono font-bold"
              />
              <span className="text-xs text-gray-400 font-bold">TC</span>
            </div>
          </div>

          {/* Regra Hunteds */}
          <div className="bg-stone-950/80 border border-amber-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Hunted à Venda no Bazaar
              </span>
              <input
                type="checkbox"
                checked={alertHunteds}
                onChange={(e) => setAlertHunteds(e.target.checked)}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Dispara alerta imediato se qualquer jogador da sua lista de Hunteds for colocado em leilão no Bazaar.
            </p>
          </div>

          {/* Regra Término Iminente */}
          <div className="bg-stone-950/80 border border-cyan-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Clock size={14} /> Snipe Urgente (&lt; 30 min)
              </span>
              <input
                type="checkbox"
                checked={alertEndingSoon}
                onChange={(e) => setAlertEndingSoon(e.target.checked)}
                className="accent-cyan-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Avisa quando leilões com mais de 25% de desconto FIPE estiverem nos últimos 30 minutos de encerramento.
            </p>
          </div>

          {/* Regra Massacres */}
          <div className="bg-stone-950/80 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <Swords size={14} /> Batalhas e Massacres de Guerra
              </span>
              <input
                type="checkbox"
                checked={alertMassacres}
                onChange={(e) => setAlertMassacres(e.target.checked)}
                className="accent-red-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Notifica o canal quando 3+ mortes PvP consecutivas forem detectadas no seu mundo pelo Live War Feed.
            </p>
          </div>

        </div>
      </div>

      {/* LISTA DE WEBHOOKS ATIVOS */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Send size={18} className="text-indigo-400" /> Meus Canais de Notificação ({webhooks.length})
          </h2>
        </div>

        {webhooks.length === 0 ? (
          <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-8 text-center text-gray-400 space-y-2">
            <Bell size={32} className="mx-auto text-gray-600" />
            <p className="text-sm font-bold text-gray-300">Nenhum canal do Discord cadastrado ainda.</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Adicione a URL do Webhook do seu canal acima para receber notificações em tempo real.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((w) => (
              <div 
                key={w.id}
                className="bg-stone-950/80 border border-stone-800 hover:border-indigo-500/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">{w.name}</h3>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-1 truncate max-w-md">
                    {w.url.substring(0, 45)}...
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestWebhook(w)}
                    disabled={testingWebhookId === w.id}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {testingWebhookId === w.id ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Testar Conexão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendSampleSniper(w)}
                    disabled={testingWebhookId === w.id + '_sample'}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-xs font-bold text-red-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {testingWebhookId === w.id + '_sample' ? <RefreshCw size={13} className="animate-spin" /> : <Flame size={13} />}
                    <span>Simular Snipe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteWebhook(w.id)}
                    className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-red-500 text-gray-400 hover:text-red-400 transition-colors"
                    title="Excluir Webhook"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADSENSE */}
      <div className="mt-4">
        <AdBanner />
      </div>

    </div>
  );
}
