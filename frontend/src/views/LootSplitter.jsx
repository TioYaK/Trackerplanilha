import React, { useState } from 'react';
import { 
  Coins, Copy, Check, Calculator, ArrowRight, User, Users, 
  Sparkles, RefreshCw, AlertCircle, Share2, Shield, Flame, CheckCircle2, Clipboard 
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

export default function LootSplitter({ onNavigate }) {
  const [logText, setLogText] = useState('');
  const [guildTaxPct, setGuildTaxPct] = useState(0); // 0%, 5%, 10%
  const [result, setResult] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [copiedCommandIdx, setCopiedCommandIdx] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePasteClipboard = async () => {
    setErrorMsg('');
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setLogText(text);
        parseLog(text);
      } else {
        setErrorMsg('Sua área de transferência está vazia.');
      }
    } catch (e) {
      setErrorMsg('Não foi possível ler a área de transferência. Use Ctrl+V dentro do campo.');
    }
  };

  const sampleLog = `Session data: From 2026-09-12, 21:00:00 to 2026-09-12, 23:30:00
Session: 02:30h
Loot Type: Leader
Loot: 9,250,000
Supplies: 1,650,000
Balance: 7,600,000

Sir Llendarius (Leader)
  Loot: 9,250,000
  Supplies: 650,000
  Balance: 8,600,000
  Damage: 4,800,000
  Healing: 1,100,000

Healer Supremo
  Loot: 0
  Supplies: 450,000
  Balance: -450,000
  Damage: 2,900,000
  Healing: 5,400,000

Arrow Master
  Loot: 0
  Supplies: 350,000
  Balance: -350,000
  Damage: 5,900,000
  Healing: 300,000

Mage Destruidor
  Loot: 0
  Supplies: 200,000
  Balance: -200,000
  Damage: 6,400,000
  Healing: 400,000`;

  const parseLog = (textToParse = logText) => {
    setErrorMsg('');
    if (!textToParse.trim()) {
      setErrorMsg('Por favor, cole o log da Party Hunt do Client.');
      return;
    }

    try {
      const lines = textToParse.split('\n').map(l => l.trim()).filter(Boolean);
      let sessionTime = '02:00h';
      let totalLoot = 0;
      let totalSupplies = 0;

      const players = [];
      let currentPlayer = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.toLowerCase().startsWith('session:')) {
          sessionTime = line.replace(/session:/i, '').trim();
        } else if (!currentPlayer && line.startsWith('Loot:') && !line.includes('Loot Type')) {
          totalLoot = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
        } else if (!currentPlayer && line.startsWith('Supplies:')) {
          totalSupplies = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
        } else if (
          line.match(/^[A-Za-z0-9'\s\-]+(\s*\(Leader\))?$/i) &&
          !line.startsWith('Session') && 
          !line.startsWith('Loot') && 
          !line.startsWith('Supplies') && 
          !line.startsWith('Balance') && 
          !line.startsWith('Damage') && 
          !line.startsWith('Healing')
        ) {
          if (currentPlayer) {
            players.push(currentPlayer);
          }
          const cleanName = line.replace(/\(Leader\)/i, '').trim();
          currentPlayer = {
            name: cleanName,
            isLeader: line.toLowerCase().includes('(leader)'),
            loot: 0,
            supplies: 0,
            balance: 0,
            damage: 0,
            healing: 0
          };
        } else if (currentPlayer) {
          if (line.startsWith('Loot:')) {
            currentPlayer.loot = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
          } else if (line.startsWith('Supplies:')) {
            currentPlayer.supplies = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
          } else if (line.startsWith('Balance:')) {
            currentPlayer.balance = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
          } else if (line.startsWith('Damage:')) {
            currentPlayer.damage = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
          } else if (line.startsWith('Healing:')) {
            currentPlayer.healing = parseInt(line.replace(/[^0-9-]/g, ''), 10) || 0;
          }
        }
      }

      if (currentPlayer) {
        players.push(currentPlayer);
      }

      if (players.length === 0) {
        setErrorMsg('Não foi possível identificar os membros da party no log. Certifique-se de copiar todo o bloco de texto do Party Hunt.');
        return;
      }

      const sumLoot = players.reduce((acc, p) => acc + p.loot, 0) || totalLoot;
      const sumSupplies = players.reduce((acc, p) => acc + p.supplies, 0) || totalSupplies;
      const totalDamage = players.reduce((acc, p) => acc + (p.damage || 0), 0);
      const totalHealing = players.reduce((acc, p) => acc + (p.healing || 0), 0);
      const netBalance = sumLoot - sumSupplies;

      // Taxa da guilda (caixinha opcional)
      const taxRate = Number(guildTaxPct) || 0;
      const guildTaxAmount = netBalance > 0 ? Math.round(netBalance * (taxRate / 100)) : 0;
      const distributableBalance = netBalance - guildTaxAmount;
      const sharePerPlayer = Math.floor(distributableBalance / players.length);

      // Balanço de cada jogador
      const balances = players.map(p => {
        const shouldHave = p.supplies + sharePerPlayer;
        const diff = shouldHave - p.loot; // > 0 => receive; < 0 => pay
        return {
          ...p,
          diff
        };
      });

      const debtors = balances.filter(p => p.diff < 0).map(p => ({ ...p, owe: -p.diff }));
      const creditors = balances.filter(p => p.diff > 0).map(p => ({ ...p, receive: p.diff }));

      const transfers = [];
      let dIdx = 0;
      let cIdx = 0;

      while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];

        const amount = Math.min(debtor.owe, creditor.receive);
        if (amount > 0) {
          transfers.push({
            from: debtor.name,
            to: creditor.name,
            amount,
            bankCommand: 'transfer ' + amount + ' to ' + creditor.name
          });
        }

        debtor.owe -= amount;
        creditor.receive -= amount;

        if (debtor.owe <= 0) dIdx++;
        if (creditor.receive <= 0) cIdx++;
      }

      setResult({
        sessionTime,
        totalLoot: sumLoot,
        totalSupplies: sumSupplies,
        totalDamage,
        totalHealing,
        netBalance,
        guildTaxAmount,
        distributableBalance,
        sharePerPlayer,
        players: balances,
        transfers
      });
    } catch (e) {
      console.error(e);
      setErrorMsg('Erro ao processar o log. Formato inesperado.');
    }
  };

  const copyBankCommands = () => {
    if (!result || !result.transfers) return;
    const text = result.transfers.map(t => t.bankCommand).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const copyDiscordSummary = () => {
    if (!result) return;
    let msg = `💰 **DIVISÃO DE HUNT RUBINOT** 💰\n`;
    msg += `⏱️ **Duração:** ${result.sessionTime} | 💎 **Loot Total:** ${result.totalLoot.toLocaleString('pt-BR')} gp\n`;
    msg += `🧪 **Supplies:** ${result.totalSupplies.toLocaleString('pt-BR')} gp | ✨ **Lucro Total:** ${result.netBalance.toLocaleString('pt-BR')} gp\n`;
    msg += `👑 **Lucro por Jogador:** ${result.sharePerPlayer.toLocaleString('pt-BR')} gp\n\n`;
    msg += `🏦 **TRANSFERÊNCIAS NO BANCO:**\n`;
    if (result.transfers.length === 0) {
      msg += `Nenhuma transferência necessária.\n`;
    } else {
      result.transfers.forEach(t => {
        msg += '```' + t.bankCommand + '```\n';
      });
    }
    msg += `\n⚡ *Calculado via Rubinot Tracker - trackerplanilha.vercel.app*`;
    navigator.clipboard.writeText(msg);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full animate-fade-in text-gray-100 flex flex-col gap-6">
      
      {/* Banner Principal */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/40 bg-gradient-to-b from-yellow-950/40 via-black/95 to-black p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/50 bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3">
              <Coins size={14} className="text-yellow-400" />
              Party Hunt Analyzer & Auto-Split
            </div>
            <h1 className="text-3xl sm:text-4xl font-medieval text-gradient-gold">
              Divisão de Loot da Party
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
              Cole o log da Party Hunt do seu Client do Tibia/Rubinot. O sistema calcula a dedução de waste, o lucro justo e gera os comandos de transferência bancária exatos!
            </p>
          </div>

          <button
            onClick={() => {
              setLogText(sampleLog);
              parseLog(sampleLog);
            }}
            className="flex items-center gap-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 px-4 py-2.5 text-xs font-bold text-yellow-300 transition-all shrink-0"
          >
            <Sparkles size={16} />
            Testar Exemplo Real
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Input do Log */}
        <div className="lg:col-span-5 bg-black/60 border border-tibia-border p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Calculator size={16} className="text-yellow-400" />
              Cole o Log da Hunt
            </h3>
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-[11px] font-bold text-yellow-300 transition-all active:scale-95"
            >
              <Clipboard size={12} />
              Colar do Clipboard
            </button>
          </div>

          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Cole aqui o texto copiado do Party Hunt do Tibia..."
            rows={12}
            className="w-full bg-black/80 border border-tibia-border/60 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline-none focus:border-yellow-500 transition-colors resize-none placeholder-gray-600"
          />

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Opção de Caixinha da Guilda */}
          <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-tibia-border/40">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-400" /> Caixinha da Guilda:
            </span>
            <div className="flex gap-1.5">
              {[0, 5, 10].map(pct => (
                <button
                  key={pct}
                  onClick={() => setGuildTaxPct(pct)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    guildTaxPct === pct 
                      ? 'bg-yellow-500 text-black font-bold' 
                      : 'bg-black/60 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => parseLog()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black font-bold text-sm font-medieval flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 transition-all active:scale-95"
          >
            <Coins size={18} />
            Calcular Divisão Justa
          </button>
        </div>

        {/* Lado Direito: Resultados e Transferências */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {!result ? (
            <div className="h-full min-h-[350px] bg-black/40 border border-dashed border-tibia-border rounded-2xl flex flex-col items-center justify-center p-8 text-center text-gray-500 gap-3">
              <Coins size={48} className="text-gray-600 animate-pulse" />
              <p className="text-sm">Cole o log e clique em <strong>"Calcular Divisão Justa"</strong> para ver os comandos de transferência bancária.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-black/60 border border-tibia-border p-3.5 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Loot Bruto</p>
                  <p className="text-sm sm:text-base font-bold text-yellow-400 font-mono mt-0.5">
                    {result.totalLoot.toLocaleString('pt-BR')} gp
                  </p>
                </div>

                <div className="bg-black/60 border border-tibia-border p-3.5 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Supplies Gastos</p>
                  <p className="text-sm sm:text-base font-bold text-red-400 font-mono mt-0.5">
                    {result.totalSupplies.toLocaleString('pt-BR')} gp
                  </p>
                </div>

                <div className="bg-black/60 border border-tibia-border p-3.5 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Lucro Líquido</p>
                  <p className="text-sm sm:text-base font-bold text-green-400 font-mono mt-0.5">
                    {result.netBalance.toLocaleString('pt-BR')} gp
                  </p>
                </div>

                <div className="bg-black/60 border border-yellow-500/40 p-3.5 rounded-xl bg-yellow-950/20">
                  <p className="text-[10px] uppercase font-bold text-yellow-400">Lucro / Player</p>
                  <p className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                    {result.sharePerPlayer.toLocaleString('pt-BR')} gp
                  </p>
                </div>
              </div>

              {/* Tabela de Comandos de Transferência (O Ponto Mais Valioso) */}
              <div className="bg-gradient-to-b from-yellow-950/30 to-black/80 border-2 border-yellow-500/40 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-medieval text-yellow-400 flex items-center gap-2">
                      <ArrowRight size={18} className="text-yellow-400" />
                      Comandos de Banco (Copiar & Colar)
                    </h3>
                    <p className="text-xs text-gray-400">Basta copiar e colar no NPC Banker do Tibia!</p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={copyBankCommands}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                    >
                      {copiedBank ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedBank ? 'Copiado!' : 'Copiar Comandos'}</span>
                    </button>

                    <button
                      onClick={copyDiscordSummary}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400 text-blue-200 text-xs font-bold rounded-xl transition-all"
                    >
                      {copiedDiscord ? <Check size={14} /> : <Share2 size={14} />}
                      <span>{copiedDiscord ? 'Copiado!' : 'Discord/Zap'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.transfers.length === 0 ? (
                    <div className="p-4 bg-black/60 rounded-xl text-center text-xs text-gray-400 italic">
                      Tudo equilibrado! Nenhuma transferência necessária.
                    </div>
                  ) : (
                    result.transfers.map((t, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-black/80 border border-yellow-500/20 rounded-xl font-mono text-xs hover:border-yellow-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">{t.from}</span>
                          <span className="text-yellow-500">➔</span>
                          <span className="text-white font-bold">{t.to}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-green-400 font-bold">{t.amount.toLocaleString('pt-BR')} gp</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.bankCommand);
                              setCopiedCommandIdx(idx);
                              setTimeout(() => setCopiedCommandIdx(null), 2000);
                            }}
                            className="flex items-center gap-1 px-2 py-1 hover:bg-yellow-500/20 rounded border border-white/10 text-xs text-yellow-400 hover:border-yellow-500/40 transition-all"
                            title="Copiar comando único de banco"
                          >
                            {copiedCommandIdx === idx ? (
                              <>
                                <Check size={12} className="text-green-400" />
                                <span className="text-[10px] text-green-400 font-sans font-bold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span className="text-[10px] font-sans font-semibold">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Detalhamento Individual dos Membros */}
              <div className="bg-black/60 border border-tibia-border p-4 rounded-2xl">
                <h4 className="text-xs uppercase font-bold text-gray-400 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-yellow-400" />
                  Balanço Individual da Party
                </h4>
                <div className="space-y-2">
                  {result.players.map((p, i) => {
                    const dmgPct = result.totalDamage > 0 ? Math.round((p.damage / result.totalDamage) * 100) : 0;
                    const healPct = result.totalHealing > 0 ? Math.round((p.healing / result.totalHealing) * 100) : 0;

                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 text-xs gap-3">
                        <div className="flex flex-col gap-1 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-yellow-200">{p.name}</span>
                            {p.isLeader && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] font-bold border border-yellow-500/30">
                                Líder
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1 text-orange-400 font-semibold" title={`Dano: ${p.damage.toLocaleString('pt-BR')}`}>
                              <Flame size={11} /> {dmgPct}% DMG
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-cyan-400 font-semibold" title={`Cura: ${p.healing.toLocaleString('pt-BR')}`}>
                              <Shield size={11} /> {healPct}% HEAL
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400 font-mono text-[11px]">
                          <span>Loot: <strong className="text-white">{p.loot.toLocaleString('pt-BR')}</strong></span>
                          <span>Waste: <strong className="text-red-400">{p.supplies.toLocaleString('pt-BR')}</strong></span>
                          <span>Status: <strong className={p.diff > 0 ? 'text-green-400' : p.diff < 0 ? 'text-red-400' : 'text-gray-400'}>
                            {p.diff > 0 ? `Recebe ${p.diff.toLocaleString('pt-BR')} gp` : p.diff < 0 ? `Transfere ${(-p.diff).toLocaleString('pt-BR')} gp` : 'Quites'}
                          </strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Banner de Anúncios AdSense */}
      <AdBanner slot="loot_splitter_footer" format="horizontal" />
    </div>
  );
}
