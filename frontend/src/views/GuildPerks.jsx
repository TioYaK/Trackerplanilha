import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate, toBrtDateStr } from '../lib/tibiaUtils';
import { 
  Shield, Award, Sparkles, Clock, AlertTriangle, CheckCircle2, 
  XCircle, Coins, Users, Search, Copy, Check, FileText, 
  RefreshCw, Sliders, Calendar, Skull, UserCheck, UserX, AlertCircle, ArrowRight
} from 'lucide-react';

export default function GuildPerks({ isPublic = false, isAdmin = false }) {
  // Configurações do Sistema de Perks
  const [settings, setSettings] = useState({
    cycle_days: 30,
    fee_amount: 50,
    fee_currency: 'RC',
    bank_recipient: 'Bank Rubin',
    max_slots: 25,
    term_text: 'Prezado membro, o acesso às perks da guilda é restrito e encarece o custo de evolução para toda a guilda. Ao ingressar, você se compromete a contribuir com a cota acordada e manter atividade regular no servidor (mínimo de XP semanal). Membros inativos por 7 dias ou inadimplentes estão sujeitos a rebaixamento de cargo.',
    min_weekly_xp: 1
  });

  // Estados principais
  const [members, setMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedBank, setCopiedBank] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'request', 'status', 'admin_requests', 'admin_inactivity', 'admin_payments', 'admin_settings', 'audit'

  // Formulário de Solicitação
  const [charName, setCharName] = useState('');
  const [world, setWorld] = useState('Auroria');
  const [agreedTerm, setAgreedTerm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Busca de Status Individual
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedMember, setInspectedMember] = useState(null);

  // Estados do Modal / Ações do Admin
  const [graceReason, setGraceReason] = useState('');
  const [selectedForGrace, setSelectedForGrace] = useState(null);
  const [selectedForPayment, setSelectedForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(50);
  const [paymentCurrency, setPaymentCurrency] = useState('RC');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  // 1. Carrega dados do sistema
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1.1 Configurações
      const { data: sData } = await supabase
        .from('guild_perk_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (sData) {
        setSettings(sData);
        setPaymentAmount(sData.fee_amount || 50);
        setPaymentCurrency(sData.fee_currency || 'RC');
      }

      // 1.2 Membros participantes
      const { data: mData } = await supabase
        .from('guild_perk_members')
        .select('*')
        .order('created_at', { ascending: false });

      setMembers(mData || []);

      // 1.3 Logs de auditoria
      const { data: aData } = await supabase
        .from('guild_perk_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAuditLogs(aData || []);
    } catch (err) {
      console.warn('Tabelas de perks ainda não prontas no Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // Realtime subscription
    const channel = supabase.channel('guild_perks_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_members' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_settings' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  // Cálculos de Vagas e Atividade
  const activeMembers = useMemo(() => {
    return members.filter(m => m.status === 'ACTIVE' || m.status === 'INACTIVITY_ALERT');
  }, [members]);

  const pendingMembers = useMemo(() => {
    return members.filter(m => m.status === 'PENDING_APPROVAL');
  }, [members]);

  const inactivityAlerts = useMemo(() => {
    return members.filter(m => m.status === 'INACTIVITY_ALERT' || (m.status === 'ACTIVE' && (m.last_7d_xp || 0) <= 0));
  }, [members]);

  // Copiar nome do char Bank
  const handleCopyBank = () => {
    if (!settings.bank_recipient) return;
    navigator.clipboard.writeText(settings.bank_recipient);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  // Submeter Solicitação
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!charName.trim() || !agreedTerm) return;

    setSubmitting(true);
    setRequestFeedback(null);

    try {
      const cleanChar = charName.trim();

      // Checa se já existe cadastro
      const existing = members.find(m => m.character_name.toLowerCase() === cleanChar.toLowerCase());
      if (existing) {
        if (existing.status === 'ACTIVE') {
          throw new Error(`O personagem "${cleanChar}" já possui o cargo de Perks ativo!`);
        } else if (existing.status === 'PENDING_APPROVAL') {
          throw new Error(`Já existe uma solicitação em análise para "${cleanChar}". Aguarde o Admin aprovar.`);
        }
      }

      // Busca XP 7d do membro na guilda para enriquecer o pedido
      let recentXp = 0;
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: xpLogs } = await supabase
          .from('historical_sessions')
          .select('xp_gained')
          .ilike('character_name', cleanChar)
          .gte('session_start', sevenDaysAgo);

        if (xpLogs && xpLogs.length > 0) {
          recentXp = xpLogs.reduce((acc, curr) => acc + (parseInt(curr.xp_gained, 10) || 0), 0);
        }
      } catch {}

      // Insere ou atualiza solicitação
      const { data: inserted, error: insertErr } = await supabase
        .from('guild_perk_members')
        .upsert({
          character_name: cleanChar,
          world: world,
          status: 'PENDING_APPROVAL',
          last_7d_xp: recentXp,
          last_xp_check_at: new Date().toISOString(),
          requested_by: isPublic ? 'WebSite_Public' : 'WebSite_Member',
          updated_at: new Date().toISOString()
        }, { onConflict: 'character_name' })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Registra no Audit Log
      await supabase.from('guild_perk_audit_logs').insert({
        character_name: cleanChar,
        event_type: 'REQUEST_CREATED',
        actor: cleanChar,
        details: `Solicitou ingresso no Sistema de Perks (Mundo: ${world} | XP 7d prévia: ${(recentXp / 1000000).toFixed(1)}M).`
      });

      setRequestFeedback({
        type: 'success',
        message: `Solicitação para "${cleanChar}" enviada com sucesso! O Administrador irá avaliar seu histórico de jogo e liberar seu acesso.`
      });
      setCharName('');
      setAgreedTerm(false);
      fetchAllData();
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        message: err.message || 'Falha ao submeter solicitação.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Buscar Status Individual
  const handleInspectCharacter = () => {
    if (!searchQuery.trim()) return;
    const found = members.find(m => m.character_name.toLowerCase() === searchQuery.trim().toLowerCase());
    setInspectedMember(found || { notFound: true, name: searchQuery.trim() });
  };

  // Ações do Administrador: Aprovar Solicitação
  const handleAdminApprove = async (member) => {
    setAdminActionLoading(true);
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (settings.cycle_days || 30) * 86400000);

      // 1. Atualiza o status do membro para ACTIVE
      const { error: updErr } = await supabase
        .from('guild_perk_members')
        .update({
          status: 'ACTIVE',
          joined_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', member.id);

      if (updErr) throw updErr;

      // 2. Enfileira o comando para o worker promover o char in-game
      await supabase.from('guild_role_queue').insert({
        character_name: member.character_name,
        action: 'PROMOTE_PERK',
        status: 'PENDING',
        world: member.world || 'Auroria',
        guild_name: 'Shellpatrocina'
      });

      // 3. Log Forense
      await supabase.from('guild_perk_audit_logs').insert({
        character_name: member.character_name,
        event_type: 'APPROVED',
        actor: 'ADMIN',
        details: `Aprovado para as Perks. Cargo atribuído in-game e vigência inicial definida para ${settings.cycle_days} dias.`
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao aprovar membro: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações do Administrador: Rejeitar Solicitação
  const handleAdminReject = async (member) => {
    if (!confirm(`Deseja realmente rejeitar a solicitação de ${member.character_name}?`)) return;
    setAdminActionLoading(true);
    try {
      await supabase
        .from('guild_perk_members')
        .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
        .eq('id', member.id);

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: member.character_name,
        event_type: 'REJECTED',
        actor: 'ADMIN',
        details: 'Solicitação rejeitada pelo Administrador.'
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao rejeitar: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações do Administrador: Conceder Carência (+7 Dias de Prazo)
  const handleAdminGrantGrace = async () => {
    if (!selectedForGrace) return;
    setAdminActionLoading(true);
    try {
      const now = new Date();
      const currentExpiry = selectedForGrace.expires_at ? new Date(selectedForGrace.expires_at) : now;
      const newExpiry = new Date(Math.max(now.getTime(), currentExpiry.getTime()) + 7 * 86400000);

      await supabase
        .from('guild_perk_members')
        .update({
          status: 'ACTIVE',
          grace_period_until: newExpiry.toISOString(),
          extension_count: (selectedForGrace.extension_count || 0) + 1,
          extension_reason: graceReason || 'Carência autorizada pela liderança',
          updated_at: now.toISOString()
        })
        .eq('id', selectedForGrace.id);

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: selectedForGrace.character_name,
        event_type: 'GRACE_GRANTED',
        actor: 'ADMIN',
        details: `Concedida carência de +7 dias. Motivo: ${graceReason || 'Sem justificativa informada'}.`
      });

      setSelectedForGrace(null);
      setGraceReason('');
      fetchAllData();
    } catch (err) {
      alert('Erro ao conceder carência: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações do Administrador: Remover do Sistema e Rebaixar Cargo
  const handleAdminDemote = async (member) => {
    if (!confirm(`CONFIRMAÇÃO CRÍTICA:\nDeseja remover ${member.character_name} do sistema de perks e rebaixar seu cargo in-game no RubinOT?`)) return;
    setAdminActionLoading(true);
    try {
      // 1. Marca como REMOVED
      await supabase
        .from('guild_perk_members')
        .update({ status: 'REMOVED', updated_at: new Date().toISOString() })
        .eq('id', member.id);

      // 2. Enfileira o comando de rebaixamento para o worker
      await supabase.from('guild_role_queue').insert({
        character_name: member.character_name,
        action: 'DEMOTE_MEMBER',
        status: 'PENDING',
        world: member.world || 'Auroria',
        guild_name: 'Shellpatrocina'
      });

      // 3. Log Forense
      await supabase.from('guild_perk_audit_logs').insert({
        character_name: member.character_name,
        event_type: 'DEMOTED',
        actor: 'ADMIN',
        details: 'Removido do sistema de Perks e enfileirado para rebaixamento in-game por inatividade (0 XP em 7 dias) ou ausência de cota.'
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao rebaixar: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações do Administrador: Registrar Pagamento de Cota
  const handleAdminRegisterPayment = async () => {
    if (!selectedForPayment) return;
    setAdminActionLoading(true);
    try {
      const now = new Date();
      const currentExpiry = selectedForPayment.expires_at ? new Date(selectedForPayment.expires_at) : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate.getTime() + (settings.cycle_days || 30) * 86400000);

      // 1. Registra pagamento
      const { error: pErr } = await supabase
        .from('guild_perk_payments')
        .insert({
          perk_member_id: selectedForPayment.id,
          character_name: selectedForPayment.character_name,
          amount: Number(paymentAmount) || settings.fee_amount,
          currency: paymentCurrency || settings.fee_currency,
          cycle_start: baseDate.toISOString(),
          cycle_end: newExpiry.toISOString(),
          proof_url_or_notes: paymentNotes || 'Pagamento confirmado pelo Admin',
          verified_by: 'ADMIN'
        });

      if (pErr) throw pErr;

      // 2. Renova vigência do membro
      await supabase
        .from('guild_perk_members')
        .update({
          status: 'ACTIVE',
          expires_at: newExpiry.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('id', selectedForPayment.id);

      // 3. Log Forense
      await supabase.from('guild_perk_audit_logs').insert({
        character_name: selectedForPayment.character_name,
        event_type: 'PAYMENT_CONFIRMED',
        actor: 'ADMIN',
        details: `Registrado pagamento de ${paymentAmount} ${paymentCurrency}. Vigência estendida até ${toBrtDateStr(newExpiry)} (+${settings.cycle_days} dias).`
      });

      setSelectedForPayment(null);
      setPaymentNotes('');
      fetchAllData();
    } catch (err) {
      alert('Erro ao registrar pagamento: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Salvar Configurações Gerais (Admin)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setAdminActionLoading(true);
    try {
      const { error } = await supabase
        .from('guild_perk_settings')
        .upsert({
          id: 1,
          cycle_days: parseInt(settings.cycle_days, 10) || 30,
          fee_amount: Number(settings.fee_amount) || 50,
          fee_currency: settings.fee_currency || 'RC',
          bank_recipient: settings.bank_recipient || 'Bank Rubin',
          max_slots: parseInt(settings.max_slots, 10) || 25,
          term_text: settings.term_text,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('Configurações atualizadas com sucesso!');
      fetchAllData();
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Renderizadores de Status Badges
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
            Ativo nas Perks
          </span>
        );
      case 'INACTIVITY_ALERT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertTriangle size={12} className="mr-1 text-red-400" />
            0 XP (7 Dias)
          </span>
        );
      case 'FEE_EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Clock size={12} className="mr-1 text-orange-400" />
            Cota Vencida
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock size={12} className="mr-1 text-yellow-400" />
            Em Análise
          </span>
        );
      case 'REMOVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <UserX size={12} className="mr-1 text-gray-400" />
            Removido
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/40 text-red-400 border border-red-900/50">
            <XCircle size={12} className="mr-1 text-red-400" />
            Recusado
          </span>
        );
      default:
        return <span className="text-xs text-gray-400">{status}</span>;
    }
  };

  return (
    <div className={`w-full ${isPublic ? 'max-w-6xl mx-auto p-4 md:p-8' : 'p-6 max-w-7xl mx-auto'}`}>
      {/* Banner de Cabeçalho */}
      <div className="bg-gradient-to-r from-amber-950/40 via-black/80 to-amber-950/40 border-2 border-tibia-border rounded-xl p-6 shadow-2xl mb-8 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award size={160} className="text-amber-400" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                RubinOT • Guild System
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                  Modo Administrador
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-medieval text-yellow-500 drop-shadow-md flex items-center gap-3">
              <Shield className="text-amber-400" size={36} />
              Sistema de Perks da Guilda
            </h1>
            <p className="text-sm text-gray-300 font-sans mt-1.5 max-w-2xl leading-relaxed">
              Gestão estratégica de acesso aos bônus avançados de guilda. Cada vaga ativa encarece o custo de evolução coletiva — mantemos apenas membros comprometidos e adimplentes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-black/60 hover:bg-black/90 border border-tibia-border/60 text-gray-300 hover:text-white rounded text-xs font-semibold transition-all shadow-sm"
              title="Atualizar dados"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : "text-gray-400"} />
              <span>{loading ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>

        {/* 4 Cards de Parâmetros Globais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Vagas / Quórum */}
          <div className="bg-black/50 border border-tibia-border/60 p-4 rounded-lg">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Vagas no Sistema</span>
              <Users size={15} className="text-blue-400" />
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {activeMembers.length} <span className="text-sm font-normal text-gray-400">/ {settings.max_slots}</span>
            </p>
            <div className="w-full bg-black/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  activeMembers.length >= settings.max_slots ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, Math.round((activeMembers.length / settings.max_slots) * 100))}%` }}
              />
            </div>
          </div>

          {/* Card 2: Cota Vigente */}
          <div className="bg-black/50 border border-tibia-border/60 p-4 rounded-lg">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cota por Ciclo</span>
              <Coins size={15} className="text-amber-400" />
            </p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {settings.fee_amount} <span className="text-sm font-normal text-gray-300">{settings.fee_currency}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Contribuição de manutenção
            </p>
          </div>

          {/* Card 3: Duração do Ciclo */}
          <div className="bg-black/50 border border-tibia-border/60 p-4 rounded-lg">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Duração do Ciclo</span>
              <Calendar size={15} className="text-green-400" />
            </p>
            <p className="text-2xl font-black text-green-400 mt-1">
              {settings.cycle_days} <span className="text-sm font-normal text-gray-300">dias</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Intervalo de renovação
            </p>
          </div>

          {/* Card 4: Destinatário do Bank */}
          <div className="bg-black/50 border border-tibia-border/60 p-4 rounded-lg">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Personagem Bank</span>
              <Shield size={15} className="text-yellow-500" />
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-bold text-white truncate mr-2" title={settings.bank_recipient}>
                {settings.bank_recipient}
              </span>
              <button
                onClick={handleCopyBank}
                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 transition-colors"
                title="Copiar nome do Bank"
              >
                {copiedBank ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {copiedBank ? <span className="text-green-400 font-semibold">Nome copiado!</span> : 'Destinatário das transferências'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex flex-wrap gap-2 border-b border-tibia-border/60 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <Users size={14} />
          <span>Membros Ativos ({activeMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'request'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <Sparkles size={14} />
          <span>Solicitar Ingresso</span>
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'status'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <Search size={14} />
          <span>Consultar Situação</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <FileText size={14} />
          <span>Histórico & Auditoria</span>
        </button>

        {/* Abas Exclusivas do Administrador */}
        {isAdmin && (
          <>
            <div className="h-6 w-px bg-tibia-border/60 my-auto mx-1" />

            <button
              onClick={() => setActiveTab('admin_requests')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'admin_requests'
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-yellow-950/30 text-yellow-400 hover:bg-yellow-900/40 border border-yellow-600/40'
              }`}
            >
              <UserCheck size={14} />
              <span>Solicitações ({pendingMembers.length})</span>
              {pendingMembers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin_inactivity')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'admin_inactivity'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-600/40'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Mesa de Inatividade ({inactivityAlerts.length})</span>
              {inactivityAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin_settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'admin_settings'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
              }`}
            >
              <Sliders size={14} />
              <span>Ajustes do Ciclo</span>
            </button>
          </>
        )}
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: Membros Ativos */}
      {activeTab === 'members' && (
        <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2">
                <Users className="text-amber-400" size={20} />
                Membros Participantes do Sistema ({activeMembers.length})
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Jogadores com acesso ativo às perks da guilda e com cotas em conformidade.
              </p>
            </div>
          </div>

          {activeMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              Nenhum membro ativo cadastrado no sistema no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-tibia-border/60 text-gray-400 uppercase tracking-wider font-bold bg-black/50">
                    <th className="p-3">Personagem</th>
                    <th className="p-3">Mundo</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">XP (Últimos 7 Dias)</th>
                    <th className="p-3">Vigência da Cota</th>
                    {isAdmin && <th className="p-3 text-right">Ações Admin</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-tibia-border/30">
                  {activeMembers.map((m) => {
                    const expiry = m.expires_at ? new Date(m.expires_at) : null;
                    const isExpiringSoon = expiry && (expiry.getTime() - Date.now()) < 3 * 86400000;
                    const xp7dM = ((m.last_7d_xp || 0) / 1000000).toFixed(1);
                    const isLowXp = (m.last_7d_xp || 0) <= 0;

                    return (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <Award size={14} className="text-amber-400 flex-shrink-0" />
                          <span>{m.character_name}</span>
                        </td>
                        <td className="p-3 text-gray-300">{m.world || 'Auroria'}</td>
                        <td className="p-3">{renderStatusBadge(m.status)}</td>
                        <td className="p-3">
                          <span className={`font-semibold ${isLowXp ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                            {isLowXp ? '0 XP (Inativo)' : `+${xp7dM}M XP`}
                          </span>
                        </td>
                        <td className="p-3">
                          {expiry ? (
                            <span className={isExpiringSoon ? 'text-orange-400 font-bold' : 'text-gray-300'}>
                              {toBrtDateStr(expiry)}
                              {isExpiringSoon && <span className="ml-1 text-[10px] bg-orange-500/20 px-1 py-0.5 rounded">Vence logo</span>}
                            </span>
                          ) : (
                            <span className="text-gray-500">Sem data</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setSelectedForPayment(m)}
                              className="px-2.5 py-1 bg-green-950/40 hover:bg-green-900/60 border border-green-500/40 text-green-300 rounded text-[11px] font-semibold transition-all"
                            >
                              + Cota
                            </button>
                            <button
                              onClick={() => handleAdminDemote(m)}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 rounded text-[11px] font-semibold transition-all"
                            >
                              Rebaixar
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: Solicitar Ingresso (Termo de Adesão e Formulário) */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1 e 2: Termo de Adesão & Regras */}
          <div className="lg:col-span-2 bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner space-y-6">
            <div>
              <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2 mb-2">
                <FileText className="text-amber-400" size={20} />
                Termo de Adesão às Perks da Guilda
              </h3>
              <p className="text-xs text-gray-400">
                Leia atentamente as diretrizes antes de solicitar sua inclusão.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-black/60 border border-tibia-border/50 text-xs text-gray-300 leading-relaxed space-y-3 font-sans">
              <p className="text-amber-300/90 font-semibold flex items-center gap-1.5">
                <AlertCircle size={15} className="flex-shrink-0 text-amber-400" />
                Por que o acesso é restrito e monitorado?
              </p>
              <p>
                No RubinOT, a cada membro adicionado ao sistema de perks, a quantidade necessária de itens e gold para avançar de nível aumenta exponencialmente para toda a guilda. 
                Portanto, <strong>manter membros inativos atrasa o progresso coletivo</strong>.
              </p>

              <div className="h-px bg-tibia-border/40 my-2" />

              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Regras Obrigatórias:</h4>
              <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-1">
                <li><strong className="text-white">Regra da Atividade (Anti-Sangue-Suga):</strong> O membro deve gerar XP regularmente. Ficar 7 dias consecutivos com 0 XP gera alerta imediato de inatividade e possível rebaixamento de cargo in-game.</li>
                <li><strong className="text-white">Regra da Cota de Manutenção:</strong> Contribuição de <strong>{settings.fee_amount} {settings.fee_currency}</strong> a cada ciclo de <strong>{settings.cycle_days} dias</strong> transferida para o char Bank (<span className="text-amber-400 font-bold">{settings.bank_recipient}</span>).</li>
                <li><strong className="text-white">Veredito do Admin:</strong> Em caso de viagem ou imprevistos, o membro deve notificar a liderança para receber carência temporária antes do vencimento.</li>
              </ul>
            </div>

            {/* Caixa de Feedback */}
            {requestFeedback && (
              <div className={`p-4 rounded-lg text-xs font-semibold flex items-start gap-3 border ${
                requestFeedback.type === 'success' 
                  ? 'bg-green-950/40 border-green-500 text-green-300' 
                  : 'bg-red-950/40 border-red-500 text-red-300'
              }`}>
                {requestFeedback.type === 'success' ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" /> : <XCircle size={18} className="text-red-400 flex-shrink-0" />}
                <div>{requestFeedback.message}</div>
              </div>
            )}
          </div>

          {/* Coluna 3: Formulário de Solicitação */}
          <div className="bg-black/50 border-2 border-tibia-border/80 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Solicitar Vaga
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">
                  Nome do Personagem (Main)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kit Apanha"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">
                  Mundo de Jogo
                </label>
                <select
                  value={world}
                  onChange={(e) => setWorld(e.target.value)}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Auroria">Auroria</option>
                  <option value="Belaria">Belaria</option>
                  <option value="Bellum">Bellum</option>
                  <option value="Tenebrium">Tenebrium</option>
                  <option value="Vesperia">Vesperia</option>
                  <option value="Malveria">Malveria</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-300 select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerm}
                    onChange={(e) => setAgreedTerm(e.target.checked)}
                    className="mt-0.5 rounded border-tibia-border bg-black text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Concordo em contribuir com a cota de <strong>{settings.fee_amount} {settings.fee_currency}</strong> e manter XP regular nos últimos 7 dias.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting || !agreedTerm || !charName.trim()}
                className={`w-full mt-4 py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  agreedTerm && charName.trim()
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 cursor-pointer'
                    : 'bg-black/40 text-gray-500 border border-tibia-border/40 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Solicitação</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-tibia-border/40 text-[11px] text-gray-400 text-center">
              Vagas disponíveis no momento: <strong className="text-white">{Math.max(0, settings.max_slots - activeMembers.length)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: Consultar Situação Individual */}
      {activeTab === 'status' && (
        <div className="max-w-2xl mx-auto bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner space-y-6">
          <div>
            <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2 mb-1.5">
              <Search className="text-amber-400" size={20} />
              Consultar Minha Situação nas Perks
            </h3>
            <p className="text-xs text-gray-400">
              Digite o nome do seu personagem para verificar a validade da sua cota e situação de atividade.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite o nome do seu char..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspectCharacter()}
              className="flex-1 bg-black/80 border border-tibia-border/60 rounded px-4 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
            <button
              onClick={handleInspectCharacter}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-all shadow-md"
            >
              Consultar
            </button>
          </div>

          {inspectedMember && (
            <div className="p-5 rounded-lg bg-black/60 border border-tibia-border/60 space-y-4">
              {inspectedMember.notFound ? (
                <div className="text-center py-4 text-gray-400 text-xs">
                  Nenhum cadastro encontrado para <strong>"{inspectedMember.name}"</strong>. Você pode solicitar ingresso na aba "Solicitar Ingresso".
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-tibia-border/40 pb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Award size={18} className="text-amber-400" />
                        {inspectedMember.character_name}
                      </h4>
                      <p className="text-xs text-gray-400">{inspectedMember.world || 'Auroria'}</p>
                    </div>
                    <div>{renderStatusBadge(inspectedMember.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-black/40 p-3 rounded border border-tibia-border/40">
                      <span className="text-gray-400 uppercase text-[10px] block font-bold">XP (Últimos 7 Dias)</span>
                      <span className={`text-base font-bold mt-0.5 block ${
                        (inspectedMember.last_7d_xp || 0) <= 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {((inspectedMember.last_7d_xp || 0) / 1000000).toFixed(1)}M XP
                      </span>
                    </div>

                    <div className="bg-black/40 p-3 rounded border border-tibia-border/40">
                      <span className="text-gray-400 uppercase text-[10px] block font-bold">Validade da Cota</span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        {inspectedMember.expires_at ? toBrtDateStr(inspectedMember.expires_at) : 'Pendente'}
                      </span>
                    </div>
                  </div>

                  {inspectedMember.grace_period_until && (
                    <div className="p-2.5 rounded bg-yellow-950/30 border border-yellow-500/30 text-xs text-yellow-300">
                      ⚠️ Carência concedida até {toBrtDateStr(inspectedMember.grace_period_until)} ({inspectedMember.extension_reason || 'Autorizado pelo Admin'}).
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: Histórico & Auditoria Aberta */}
      {activeTab === 'audit' && (
        <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner">
          <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2 mb-2">
            <FileText className="text-amber-400" size={20} />
            Histórico Forense & Auditoria Aberta
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Registro imutável de todas as solicitações, aprovações, pagamentos de cota e rebaixamentos por inatividade.
          </p>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              Nenhum registro de auditoria arquivado ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-lg bg-black/50 border border-tibia-border/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Clock size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white mr-2">{log.character_name}</span>
                      <span className="text-gray-300">{log.details}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 whitespace-nowrap self-end sm:self-auto">
                    {parseUtcDate(log.created_at)?.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABAS DO ADMINISTRADOR */}

      {/* ADMIN ABA 1: Solicitações Pendentes */}
      {isAdmin && activeTab === 'admin_requests' && (
        <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner">
          <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2 mb-2">
            <UserCheck className="text-amber-400" size={20} />
            Fila de Solicitações Pendentes ({pendingMembers.length})
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Avalie o histórico de jogo do membro antes de aprovar. A aprovação enfileira o cargo in-game para o worker.
          </p>

          {pendingMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">
              Nenhuma solicitação pendente no momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingMembers.map((m) => (
                <div key={m.id} className="bg-black/60 border border-tibia-border/80 rounded-lg p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white">{m.character_name}</span>
                      <span className="text-xs text-gray-400">{m.world}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-300 space-y-1">
                      <p>XP Registrada (7 Dias): <strong className="text-green-400">+{((m.last_7d_xp || 0) / 1000000).toFixed(1)}M XP</strong></p>
                      <p className="text-gray-400 text-[11px]">Solicitado em: {toBrtDateStr(m.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-tibia-border/40">
                    <button
                      onClick={() => handleAdminApprove(m)}
                      disabled={adminActionLoading}
                      className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-black font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserCheck size={14} /> Aprovar & Promover
                    </button>
                    <button
                      onClick={() => handleAdminReject(m)}
                      disabled={adminActionLoading}
                      className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs rounded transition-all"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN ABA 2: Mesa de Inatividade (0 XP em 7 Dias) */}
      {isAdmin && activeTab === 'admin_inactivity' && (
        <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner">
          <h3 className="text-xl font-medieval text-red-500 flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-400" size={20} />
            Mesa de Veredito de Inatividade ({inactivityAlerts.length})
          </h3>
          <p className="text-xs text-gray-400 mb-6">
            Membros ativos no sistema de perks que registraram 0 XP nos últimos 7 dias. Decida entre conceder carência ou remover o membro e rebaixar o cargo in-game.
          </p>

          {inactivityAlerts.length === 0 ? (
            <div className="text-center py-12 text-green-400/80 italic flex flex-col items-center gap-2">
              <CheckCircle2 size={32} />
              <span>Nenhum membro em alerta de inatividade! Todos estão caçando e gerando XP.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inactivityAlerts.map((m) => (
                <div key={m.id} className="bg-black/60 border border-red-900/50 rounded-lg p-4 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white">{m.character_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        0 XP em 7 Dias
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-300 space-y-1">
                      <p>Vencimento da cota: <strong>{m.expires_at ? toBrtDateStr(m.expires_at) : 'Sem data'}</strong></p>
                      {m.extension_count > 0 && (
                        <p className="text-yellow-400 text-[11px]">Já recebeu {m.extension_count} carência(s) anterior(es).</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-tibia-border/40">
                    <button
                      onClick={() => setSelectedForGrace(m)}
                      disabled={adminActionLoading}
                      className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500 text-amber-300 font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <Clock size={14} /> Conceder +7 Dias
                    </button>
                    <button
                      onClick={() => handleAdminDemote(m)}
                      disabled={adminActionLoading}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserX size={14} /> Remover & Rebaixar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN ABA 3: Configurações Gerais do Ciclo */}
      {isAdmin && activeTab === 'admin_settings' && (
        <div className="max-w-2xl mx-auto bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner space-y-6">
          <div>
            <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2 mb-1.5">
              <Sliders className="text-amber-400" size={20} />
              Ajustes de Parâmetros do Ciclo
            </h3>
            <p className="text-xs text-gray-400">
              Personalize o período de validade, valor da cota e limites de participantes do sistema de perks.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Duração do Ciclo (Dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={settings.cycle_days}
                  onChange={(e) => setSettings({ ...settings, cycle_days: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Limite de Vagas (Cap)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={settings.max_slots}
                  onChange={(e) => setSettings({ ...settings, max_slots: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Valor da Cota
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={settings.fee_amount}
                  onChange={(e) => setSettings({ ...settings, fee_amount: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Moeda
                </label>
                <select
                  value={settings.fee_currency}
                  onChange={(e) => setSettings({ ...settings, fee_currency: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="RC">RC (Rubin Coins)</option>
                  <option value="KK">KK (Gold / Milhões)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                Nome do Personagem Bank Recebedor
              </label>
              <input
                type="text"
                value={settings.bank_recipient}
                onChange={(e) => setSettings({ ...settings, bank_recipient: e.target.value })}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={adminActionLoading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md mt-4"
            >
              Salvar Alterações
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Conceder Carência (+7 Dias) */}
      {selectedForGrace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tibia-card border-2 border-amber-500 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
              <Clock className="text-amber-400" size={18} />
              Conceder Carência (+7 Dias)
            </h4>
            <p className="text-xs text-gray-300">
              Concedendo prazo adicional de 7 dias para <strong>{selectedForGrace.character_name}</strong> sem rebaixamento de cargo in-game.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                Justificativa / Motivo
              </label>
              <input
                type="text"
                placeholder="Ex: Avisou viagem a trabalho até dia 15"
                value={graceReason}
                onChange={(e) => setGraceReason(e.target.value)}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdminGrantGrace}
                disabled={adminActionLoading}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-all"
              >
                Confirmar +7 Dias
              </button>
              <button
                onClick={() => setSelectedForGrace(null)}
                className="px-4 py-2 bg-black/60 hover:bg-black/80 border border-tibia-border/60 text-gray-300 rounded text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pagamento de Cota */}
      {selectedForPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tibia-card border-2 border-green-500 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-green-400 flex items-center gap-2">
              <Coins className="text-green-400" size={18} />
              Registrar Pagamento de Cota
            </h4>
            <p className="text-xs text-gray-300">
              Renovar o ciclo de perks para <strong>{selectedForPayment.character_name}</strong> (+{settings.cycle_days} dias).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Valor</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Moeda</label>
                <select
                  value={paymentCurrency}
                  onChange={(e) => setPaymentCurrency(e.target.value)}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none"
                >
                  <option value="RC">RC</option>
                  <option value="KK">KK</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Observações / Comprovante</label>
              <input
                type="text"
                placeholder="Ex: Transferência confirmada pelo Bank às 14:20"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-green-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAdminRegisterPayment}
                disabled={adminActionLoading}
                className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-black font-bold text-xs rounded transition-all"
              >
                Confirmar Pagamento & Renovar
              </button>
              <button
                onClick={() => setSelectedForPayment(null)}
                className="px-4 py-2 bg-black/60 hover:bg-black/80 border border-tibia-border/60 text-gray-300 rounded text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
