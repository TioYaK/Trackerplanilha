import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, Users, Clock, Shield, Coins, Sparkles, 
  CheckCircle2, Copy, Check, Bell, BellOff, ArrowRight,
  TrendingUp, AlertTriangle, Info, Zap, Heart, Flame
} from 'lucide-react';
import AdBanner from '../components/AdBanner';

export default function HunterToolbelt() {
  const [activeTab, setActiveTab] = useState('share'); // 'share', 'stamina', 'bless', 'imbue'
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // =========================================================================
  // 1. PARTY EXP SHARE CALCULATOR
  // =========================================================================
  const [myLevel, setMyLevel] = useState(350);
  const [targetLevel, setTargetLevel] = useState(400);

  const shareRange = useMemo(() => {
    const lvl = Math.max(1, parseInt(myLevel) || 1);
    const minLvl = Math.floor(lvl * 2 / 3);
    const maxLvl = Math.ceil(lvl * 3 / 2);
    return { minLvl, maxLvl };
  }, [myLevel]);

  const targetShareStatus = useMemo(() => {
    const target = parseInt(targetLevel) || 1;
    const canShare = target >= shareRange.minLvl && target <= shareRange.maxLvl;
    return { canShare };
  }, [targetLevel, shareRange]);

  // =========================================================================
  // 2. STAMINA CALCULATOR COM ALARME
  // =========================================================================
  const [staminaHours, setStaminaHours] = useState(38);
  const [staminaMinutes, setStaminaMinutes] = useState(30);
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  const staminaCalc = useMemo(() => {
    const h = Math.min(42, Math.max(0, parseInt(staminaHours) || 0));
    const m = Math.min(59, Math.max(0, parseInt(staminaMinutes) || 0));
    const currentTotalMinutes = h * 60 + m;

    // Normal stamina (0h a 40h) regenera 1 min para cada 3 min offline
    // Green stamina (40h a 42h) regenera 1 min para cada 6 min offline
    const normalCap = 40 * 60; // 2400 mins
    const greenCap = 42 * 60;  // 2520 mins

    let minutesTo40 = 0;
    let minutesTo42 = 0;

    if (currentTotalMinutes < normalCap) {
      const normalDeficit = normalCap - currentTotalMinutes;
      minutesTo40 = normalDeficit * 3;
      minutesTo42 = minutesTo40 + (120 * 6); // 120 mins de verde * 6
    } else if (currentTotalMinutes < greenCap) {
      minutesTo40 = 0;
      const greenDeficit = greenCap - currentTotalMinutes;
      minutesTo42 = greenDeficit * 6;
    }

    const now = new Date();
    const readyAt40 = new Date(now.getTime() + minutesTo40 * 60000);
    const readyAt42 = new Date(now.getTime() + minutesTo42 * 60000);

    const formatDuration = (totalMins) => {
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return `${hrs}h ${mins}m`;
    };

    return {
      timeTo40Str: formatDuration(minutesTo40),
      timeTo42Str: formatDuration(minutesTo42),
      date40Str: readyAt40.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date42Str: readyAt42.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      isAlreadyFullGreen: currentTotalMinutes >= greenCap,
      isAlreadyFullNormal: currentTotalMinutes >= normalCap,
      currentTotalMinutes
    };
  }, [staminaHours, staminaMinutes]);

  const toggleBrowserNotification = () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de desktop.');
      return;
    }
    if (Notification.permission === 'granted') {
      setAlarmEnabled(!alarmEnabled);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') setAlarmEnabled(true);
      });
    }
  };

  // =========================================================================
  // 3. BLESSINGS & TWIST OF FATE CALCULATOR
  // =========================================================================
  const [blessLevel, setBlessLevel] = useState(250);

  const blessCost = useMemo(() => {
    const lvl = Math.max(1, parseInt(blessLevel) || 1);
    
    // Regra oficial do Tibia:
    // Até level 30: 2.000 gp cada
    // Level 31 a 120: 2.000 + 200 * (level - 30) cada
    // Level > 120: 20.000 gp cada
    let singleNormalCost = 20000;
    if (lvl <= 30) singleNormalCost = 2000;
    else if (lvl < 120) singleNormalCost = 2000 + 200 * (lvl - 30);
    else singleNormalCost = 20000;

    const normal5Total = singleNormalCost * 5;

    // Enhanced Blessings (Heart of the Mountain & Blood of the Fallen - Inquisition)
    // Acima de lvl 120 são 26.000 gp cada
    let singleInqCost = 26000;
    if (lvl <= 30) singleInqCost = 2600;
    else if (lvl < 120) singleInqCost = 2600 + 260 * (lvl - 30);
    else singleInqCost = 26000;

    const inq2Total = singleInqCost * 2;
    const all7Total = normal5Total + inq2Total;

    // Twist of Fate (PvP Blessing)
    let twistCost = 50000;
    if (lvl <= 30) twistCost = 2000;
    else if (lvl <= 270) twistCost = 2000 + Math.floor((lvl - 30) * 200);
    else twistCost = 50000;

    return {
      singleNormalCost,
      normal5Total,
      singleInqCost,
      inq2Total,
      all7Total,
      twistCost,
      grandTotalWithTwist: all7Total + twistCost
    };
  }, [blessLevel]);

  // =========================================================================
  // 4. IMBUEMENT: GOLD TOKENS VS MARKET PRODUCTS
  // =========================================================================
  const [goldTokenPrice, setGoldTokenPrice] = useState(42000); // 42k por token padrão
  
  // Preços médios de Creature Products Tier 3
  const [prodPrices, setProdPrices] = useState({
    vampireTeeth: 3200,    // 25x = 80k
    bloodyPincers: 9500,   // 15x = 142.5k
    deadBrain: 16000,      // 5x = 80k -> Total Life ~302.5k
    sabretooth: 5500,      // 25x = 137.5k
    protectiveCharm: 2800, // 20x = 56k
    vexclawTalon: 4000,    // 5x = 20k -> Total Crit ~213.5k
    ropeBelt: 4200,        // 25x = 105k
    silencerClaws: 3000,   // 25x = 75k
    grimeleechWings: 4500  // 5x = 22.5k -> Total Mana ~202.5k
  });

  const imbueComparison = useMemo(() => {
    const tokenFee6 = goldTokenPrice * 6; // 6 tokens para Tier 3
    const successFee100 = 150000; // Taxa de 100%

    // Life Leech T3
    const lifeItemsCost = (25 * prodPrices.vampireTeeth) + (15 * prodPrices.bloodyPincers) + (5 * prodPrices.deadBrain);
    // Mana Leech T3
    const manaItemsCost = (25 * prodPrices.ropeBelt) + (25 * prodPrices.silencerClaws) + (5 * prodPrices.grimeleechWings);
    // Critical T3
    const critItemsCost = (20 * prodPrices.protectiveCharm) + (25 * prodPrices.sabretooth) + (5 * prodPrices.vexclawTalon);

    return {
      tokenFee6,
      successFee100,
      life: {
        itemsCost: lifeItemsCost,
        tokenTotal: tokenFee6 + successFee100,
        itemsTotal: lifeItemsCost + successFee100,
        cheaperOption: lifeItemsCost < tokenFee6 ? 'ITEMS' : 'TOKENS',
        savings: Math.abs(lifeItemsCost - tokenFee6)
      },
      mana: {
        itemsCost: manaItemsCost,
        tokenTotal: tokenFee6 + successFee100,
        itemsTotal: manaItemsCost + successFee100,
        cheaperOption: manaItemsCost < tokenFee6 ? 'ITEMS' : 'TOKENS',
        savings: Math.abs(manaItemsCost - tokenFee6)
      },
      crit: {
        itemsCost: critItemsCost,
        tokenTotal: tokenFee6 + successFee100,
        itemsTotal: critItemsCost + successFee100,
        cheaperOption: critItemsCost < tokenFee6 ? 'ITEMS' : 'TOKENS',
        savings: Math.abs(critItemsCost - tokenFee6)
      }
    };
  }, [goldTokenPrice, prodPrices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Principal */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Calculator className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    Hunter's Toolbelt <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ESSENCIAL</span>
                  </h1>
                  <p className="text-slate-400 text-sm">
                    As calculadoras mais usadas no dia a dia do Tibia: Party Exp Share, Stamina com Alarme, Bênçãos e Tokens vs Itens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AdBanner */}
        <AdBanner slot="hunt-finder-top" />

        {/* Navegação por Abas */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border ${
              activeTab === 'share'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Party Exp Share
          </button>

          <button
            onClick={() => setActiveTab('stamina')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border ${
              activeTab === 'stamina'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Stamina & Alarme
          </button>

          <button
            onClick={() => setActiveTab('bless')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border ${
              activeTab === 'bless'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Blessings & Twist
          </button>

          <button
            onClick={() => setActiveTab('imbue')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition border ${
              activeTab === 'imbue'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" /> Imbuements (Token vs Itens)
          </button>
        </div>

        {/* 1. ABA EXP SHARE */}
        {activeTab === 'share' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Seu Nível (Calculadora de Alcance)
              </h3>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Digite seu Level:</label>
                <input 
                  type="number"
                  min="1"
                  max="3000"
                  value={myLevel}
                  onChange={(e) => setMyLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
                <div className="text-xs text-slate-400">Você pode ativar Shared Exp com:</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Level Mínimo</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{shareRange.minLvl}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Seu Level</span>
                    <span className="text-2xl font-black text-white font-mono">{myLevel || 1}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Level Máximo</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{shareRange.maxLvl}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleCopy(`🛡️ Level ${myLevel} divide XP de ${shareRange.minLvl} até ${shareRange.maxLvl}`, 'share-copy')}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedId === 'share-copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  Copiar Texto para Discord / Chat
                </button>
              </div>
            </div>

            {/* Testador de Parceria */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> Testador de Amigo / Membro da Party
              </h3>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Level do Parceiro:</label>
                <input 
                  type="number"
                  min="1"
                  max="3000"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono text-yellow-400 font-bold focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className={`p-5 rounded-xl border flex items-center gap-4 ${
                targetShareStatus.canShare
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}>
                {targetShareStatus.canShare ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {targetShareStatus.canShare ? 'SHARED EXPERIENCE ATIVA!' : 'FORA DO ALCANCE DE SHARE'}
                  </div>
                  <p className="text-xs opacity-90 mt-0.5">
                    {targetShareStatus.canShare 
                      ? `O level ${targetLevel} está dentro da faixa permitida (${shareRange.minLvl} - ${shareRange.maxLvl}) e receberá o bônus de 4 vocações normalmente.`
                      : `A diferença de level é muito alta. O level ${targetLevel} não receberá experiência compartilhada na hunt.`
                    }
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                💡 <span className="font-semibold text-slate-300">Fórmula Oficial:</span> Mínimo = <code className="text-cyan-300">Level * 2/3</code> | Máximo = <code className="text-emerald-300">Level * 3/2</code> (arredondado para cima).
              </div>
            </div>
          </div>
        )}

        {/* 2. ABA STAMINA */}
        {activeTab === 'stamina' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" /> Sua Stamina Atual
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Horas (0 - 42):</label>
                  <input 
                    type="number"
                    min="0"
                    max="42"
                    value={staminaHours}
                    onChange={(e) => setStaminaHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Minutos (0 - 59):</label>
                  <input 
                    type="number"
                    min="0"
                    max="59"
                    value={staminaMinutes}
                    onChange={(e) => setStaminaMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Botão de Alarme no Navegador */}
              <div className="pt-2">
                <button
                  onClick={toggleBrowserNotification}
                  className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                    alarmEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {alarmEnabled ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4" />}
                  {alarmEnabled ? 'Alarme Ativo no Navegador' : 'Ativar Notificação de Stamina Verde'}
                </button>
              </div>
            </div>

            {/* Resultado do Tempo de Descanso */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Previsão de Regeneração Offline
              </h3>

              {/* Stamina Verde (42h) */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-emerald-300">
                  <span>Stamina Bônus Verde (42h 00m)</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 rounded font-mono">+50% EXP</span>
                </div>
                <div className="text-2xl font-mono font-black text-white">
                  {staminaCalc.isAlreadyFullGreen ? 'JÁ ESTÁ CHEIA!' : `em ${staminaCalc.timeTo42Str}`}
                </div>
                {!staminaCalc.isAlreadyFullGreen && (
                  <div className="text-xs text-slate-400">
                    Pronta em: <strong className="text-emerald-400 font-mono">{staminaCalc.date42Str}</strong>
                  </div>
                )}
              </div>

              {/* Stamina Normal (40h) */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Stamina Normal (40h 00m)</span>
                  <span className="font-mono text-slate-500">100% EXP</span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-200">
                  {staminaCalc.isAlreadyFullNormal ? 'Atingida!' : `em ${staminaCalc.timeTo40Str}`}
                </div>
                {!staminaCalc.isAlreadyFullNormal && (
                  <div className="text-xs text-slate-400">
                    Pronta às: <strong className="text-slate-300 font-mono">{staminaCalc.date40Str}</strong>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                💡 Para cada 1 minuto de stamina verde (40h-42h), são necessários <strong>6 minutos offline</strong>. Na stamina normal (abaixo de 40h), cada minuto requer <strong>3 minutos offline</strong>.
              </div>
            </div>
          </div>
        )}

        {/* 3. ABA BLESSINGS */}
        {activeTab === 'bless' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" /> Seu Level para Cálculo de Bênçãos
              </h3>
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nível do Personagem:</label>
                <input 
                  type="number"
                  min="1"
                  max="3000"
                  value={blessLevel}
                  onChange={(e) => setBlessLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-2xl font-mono text-emerald-400 font-bold focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">5 Blessings Normais:</span>
                  <span className="font-mono font-bold text-white">{blessCost.normal5Total.toLocaleString()} GP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">2 Blessings Inquisição (Heart & Blood):</span>
                  <span className="font-mono font-bold text-white">{blessCost.inq2Total.toLocaleString()} GP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-amber-400 font-semibold">Total das 7 Bênçãos PVE:</span>
                  <span className="font-mono font-black text-amber-400">{blessCost.all7Total.toLocaleString()} GP</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-rose-400 font-semibold">Twist of Fate (PvP):</span>
                  <span className="font-mono font-bold text-rose-400">{blessCost.twistCost.toLocaleString()} GP</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> Custo Total & Dica Rápida
              </h3>

              <div className="p-5 bg-emerald-950/25 border border-emerald-500/40 rounded-xl space-y-2 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                  Custo Full (7 Blessings + Twist of Fate)
                </span>
                <span className="text-3xl font-black font-mono text-emerald-400 block">
                  {blessCost.grandTotalWithTwist.toLocaleString()} GP
                </span>
                <span className="text-xs text-slate-400 block">
                  (aprox. {Math.round(blessCost.grandTotalWithTwist / 1000)}k de Gold)
                </span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-indigo-300">💡 Como comprar tudo em 5 segundos:</div>
                <p className="text-slate-400 leading-relaxed">
                  Com a <strong className="text-slate-200">The Inquisition Quest</strong> feita, vá até o <strong>Henricus</strong> em Thais e diga:
                </p>
                <div className="bg-slate-900 p-2.5 rounded font-mono text-indigo-300 flex justify-between items-center border border-slate-800">
                  <span>hi -&gt; blessings -&gt; yes</span>
                  <button 
                    onClick={() => handleCopy('hi -> blessings -> yes', 'henricus')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedId === 'henricus' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ABA IMBUEMENT (TOKEN VS ITENS) */}
        {activeTab === 'imbue' && (
          <div className="space-y-6 animate-fade-in">
            {/* Cotação do Gold Token */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Preço do Gold Token no Market:</h4>
                  <p className="text-xs text-slate-400">São necessários 6 Gold Tokens para qualquer Imbuement Poderoso (Tier 3).</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  step="1000"
                  value={goldTokenPrice}
                  onChange={(e) => setGoldTokenPrice(parseInt(e.target.value) || 0)}
                  className="w-36 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-right font-mono font-bold text-amber-400 text-sm focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">GP / token</span>
              </div>
            </div>

            {/* Grid dos 3 Maiores Imbuements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Life Leech T3 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" /> Vampirism (Life T3)
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    imbueComparison.life.cheaperOption === 'ITEMS' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {imbueComparison.life.cheaperOption === 'ITEMS' ? 'USE ITENS' : 'USE TOKENS'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>25x Vampire Teeth:</span>
                    <span className="font-mono text-slate-200">{(25 * prodPrices.vampireTeeth).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>15x Bloody Pincers:</span>
                    <span className="font-mono text-slate-200">{(15 * prodPrices.bloodyPincers).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5x Piece of Dead Brain:</span>
                    <span className="font-mono text-slate-200">{(5 * prodPrices.deadBrain).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-emerald-400">
                    <span>Custo em Itens:</span>
                    <span className="font-mono">{imbueComparison.life.itemsCost.toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-400">
                    <span>Custo em 6x Tokens:</span>
                    <span className="font-mono">{imbueComparison.tokenFee6.toLocaleString()} GP</span>
                  </div>
                </div>

                <div className="text-xs text-center text-slate-300 font-medium">
                  Economia de: <strong className="text-emerald-400 font-mono">{imbueComparison.life.savings.toLocaleString()} GP</strong>
                </div>
              </div>

              {/* Mana Leech T3 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" /> Void (Mana T3)
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    imbueComparison.mana.cheaperOption === 'ITEMS' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {imbueComparison.mana.cheaperOption === 'ITEMS' ? 'USE ITENS' : 'USE TOKENS'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>25x Rope Belt:</span>
                    <span className="font-mono text-slate-200">{(25 * prodPrices.ropeBelt).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>25x Silencer Claws:</span>
                    <span className="font-mono text-slate-200">{(25 * prodPrices.silencerClaws).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5x Grimeleech Wings:</span>
                    <span className="font-mono text-slate-200">{(5 * prodPrices.grimeleechWings).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-emerald-400">
                    <span>Custo em Itens:</span>
                    <span className="font-mono">{imbueComparison.mana.itemsCost.toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-400">
                    <span>Custo em 6x Tokens:</span>
                    <span className="font-mono">{imbueComparison.tokenFee6.toLocaleString()} GP</span>
                  </div>
                </div>

                <div className="text-xs text-center text-slate-300 font-medium">
                  Economia de: <strong className="text-emerald-400 font-mono">{imbueComparison.mana.savings.toLocaleString()} GP</strong>
                </div>
              </div>

              {/* Critical T3 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" /> Strike (Crítico T3)
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    imbueComparison.crit.cheaperOption === 'ITEMS' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {imbueComparison.crit.cheaperOption === 'ITEMS' ? 'USE ITENS' : 'USE TOKENS'}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>20x Protective Charm:</span>
                    <span className="font-mono text-slate-200">{(20 * prodPrices.protectiveCharm).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>25x Sabretooth:</span>
                    <span className="font-mono text-slate-200">{(25 * prodPrices.sabretooth).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5x Vexclaw Talon:</span>
                    <span className="font-mono text-slate-200">{(5 * prodPrices.vexclawTalon).toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 font-semibold text-emerald-400">
                    <span>Custo em Itens:</span>
                    <span className="font-mono">{imbueComparison.crit.itemsCost.toLocaleString()} GP</span>
                  </div>
                  <div className="flex justify-between font-semibold text-amber-400">
                    <span>Custo em 6x Tokens:</span>
                    <span className="font-mono">{imbueComparison.tokenFee6.toLocaleString()} GP</span>
                  </div>
                </div>

                <div className="text-xs text-center text-slate-300 font-medium">
                  Economia de: <strong className="text-emerald-400 font-mono">{imbueComparison.crit.savings.toLocaleString()} GP</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
