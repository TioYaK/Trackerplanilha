import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { parseUtcDate, toBrtDateStr } from '../lib/tibiaUtils';
import { 
  Shield, Award, Sparkles, Clock, AlertTriangle, CheckCircle2, 
  XCircle, Coins, Users, Search, Copy, Check, FileText, 
  RefreshCw, Sliders, Calendar, Skull, UserCheck, UserX, AlertCircle, ArrowRight,
  Landmark, CheckSquare, Plus, Trash2, PieChart, Vote, DollarSign, TrendingUp, TrendingDown,
  CheckCircle
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

  // Transparência Financeira & Gastos
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    currency: 'RC',
    proof_notes: ''
  });

  // Votações de Prioridade de Perks
  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [pollForm, setPollForm] = useState({
    title: '',
    description: '',
    options: ['', '']
  });
  const [votingCharName, setVotingCharName] = useState('');
  const [selectedPollOption, setSelectedPollOption] = useState({}); // { [pollId]: optionId }
  const [votingFeedback, setVotingFeedback] = useState({}); // { [pollId]: { type: 'success' | 'error', text: '' } }
  const [pollFilter, setPollFilter] = useState('ALL'); // 'ALL', 'OPEN', 'CLOSED'

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

      // 1.4 Histórico de Pagamentos de Cotas
      try {
        const { data: payData, error: payErr } = await supabase
          .from('guild_perk_payments')
          .select('*')
          .order('transaction_date', { ascending: false });
        if (!payErr && payData) setPayments(payData);
      } catch (e) {
        console.warn('Tabela guild_perk_payments não disponível:', e.message);
      }

      // 1.5 Gastos / Investimentos em Perks
      try {
        const { data: expData, error: expErr } = await supabase
          .from('guild_perk_expenses')
          .select('*')
          .order('spent_at', { ascending: false });
        if (!expErr && expData) setExpenses(expData);
      } catch (e) {
        console.warn('Tabela guild_perk_expenses não disponível:', e.message);
      }

      // 1.6 Enquetes / Votações e Opções
      try {
        const { data: pData, error: pErr } = await supabase
          .from('guild_perk_polls')
          .select('*, options:guild_perk_poll_options(*)')
          .order('created_at', { ascending: false });
        if (!pErr && pData) setPolls(pData);
      } catch (e) {
        console.warn('Tabela guild_perk_polls não disponível:', e.message);
      }

      // 1.7 Registro de Votos
      try {
        const { data: vData, error: vErr } = await supabase
          .from('guild_perk_poll_votes')
          .select('*');
        if (!vErr && vData) setVotes(vData);
      } catch (e) {
        console.warn('Tabela guild_perk_poll_votes não disponível:', e.message);
      }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_payments' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_expenses' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_polls' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_poll_options' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_perk_poll_votes' }, () => fetchAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  const worldGuildMap = {
    'Auroria': 'Shellpatrocina',
    'Belaria': 'Battlestorm Belaria',
    'Bellum': 'Battlestorm Bellum',
    'Tenebrium': 'Battlestorm Retro',
    'Vesperia': 'Battlestorm Vesperia',
    'Malveria': 'Battlestorm Malveria'
  };

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

  // Cálculos Financeiros do Caixa & Transparência
  const financialStats = useMemo(() => {
    let totalRcIn = 0;
    let totalKkIn = 0;
    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      const curr = (p.currency || 'RC').toUpperCase();
      if (curr === 'RC') totalRcIn += amt;
      else if (curr === 'KK') totalKkIn += amt;
    });

    let totalRcOut = 0;
    let totalKkOut = 0;
    expenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      const curr = (e.currency || 'RC').toUpperCase();
      if (curr === 'RC') totalRcOut += amt;
      else if (curr === 'KK') totalKkOut += amt;
    });

    const rcBalance = Math.round((totalRcIn - totalRcOut) * 100) / 100;
    const kkBalance = Math.round((totalKkIn - totalKkOut) * 100) / 100;

    return {
      totalRcIn: Math.round(totalRcIn * 100) / 100,
      totalKkIn: Math.round(totalKkIn * 100) / 100,
      totalRcOut: Math.round(totalRcOut * 100) / 100,
      totalKkOut: Math.round(totalKkOut * 100) / 100,
      rcBalance,
      kkBalance
    };
  }, [payments, expenses]);

  // Copiar nome do char Bank
  const handleCopyBank = () => {
    if (!settings.bank_recipient) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(settings.bank_recipient);
      } else {
        const el = document.createElement('textarea');
        el.value = settings.bank_recipient;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    } catch {
      setCopiedBank(false);
    }
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
        } else if (existing.status === 'INACTIVITY_ALERT' || existing.status === 'FEE_EXPIRED') {
          throw new Error(`O personagem "${cleanChar}" já faz parte do sistema (Status: ${existing.status}). Regularize sua cota com a liderança ou gere XP no jogo.`);
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

        // Adiciona delta ao vivo caso o jogador esteja caçando agora
        const { data: liveState } = await supabase
          .from('current_character_state')
          .select('session_start_xp, xp_total')
          .ilike('character_name', cleanChar)
          .maybeSingle();

        if (liveState && liveState.xp_total && liveState.session_start_xp) {
          const delta = Number(liveState.xp_total) - Number(liveState.session_start_xp);
          if (delta > 0) recentXp += delta;
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
        guild_name: worldGuildMap[member.world] || 'Shellpatrocina'
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
        guild_name: worldGuildMap[member.world] || 'Shellpatrocina'
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

  // Ações de Transparência: Registrar Gasto / Investimento de Perk
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseForm.amount);
    if (!expenseForm.description.trim() || isNaN(amountNum) || amountNum <= 0) {
      alert('Preencha a descrição e um valor numérico positivo para o investimento.');
      return;
    }
    setAdminActionLoading(true);
    try {
      const { error } = await supabase
        .from('guild_perk_expenses')
        .insert({
          description: expenseForm.description.trim(),
          amount: amountNum,
          currency: (expenseForm.currency || 'RC').toUpperCase(),
          proof_notes: expenseForm.proof_notes.trim() || null,
          registered_by: 'ADMIN'
        });
      if (error) throw error;

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: 'SISTEMA/ADMIN',
        event_type: 'EXPENSE_REGISTERED',
        actor: 'ADMIN',
        details: `Registrado investimento em perk: ${expenseForm.description} (${amountNum} ${(expenseForm.currency || 'RC').toUpperCase()}).`
      });

      setExpenseForm({ description: '', amount: '', currency: 'RC', proof_notes: '' });
      setExpenseModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert('Erro ao registrar investimento: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações de Transparência: Excluir Registro de Gasto (Admin)
  const handleDeleteExpense = async (expense) => {
    if (!confirm(`Deseja excluir o registro de investimento "${expense.description}" (${expense.amount} ${expense.currency})?`)) return;
    setAdminActionLoading(true);
    try {
      const { error } = await supabase
        .from('guild_perk_expenses')
        .delete()
        .eq('id', expense.id);
      if (error) throw error;

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: 'SISTEMA/ADMIN',
        event_type: 'EXPENSE_DELETED',
        actor: 'ADMIN',
        details: `Excluído registro de investimento: ${expense.description} (${expense.amount} ${expense.currency}).`
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao excluir registro: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Funções de Votação: Manipular Opções no Formulário
  const handleAddPollOption = () => {
    setPollForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handlePollOptionChange = (index, value) => {
    setPollForm(prev => {
      const newOpts = [...prev.options];
      newOpts[index] = value;
      return { ...prev, options: newOpts };
    });
  };

  const handleRemovePollOption = (index) => {
    if (pollForm.options.length <= 2) return;
    setPollForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  // Ações de Votação: Criar Nova Enquete (Admin)
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = pollForm.options.map(o => o.trim()).filter(Boolean);
    if (!pollForm.title.trim()) {
      alert('Informe o título da votação.');
      return;
    }
    if (validOptions.length < 2) {
      alert('Adicione pelo menos 2 opções para a votação.');
      return;
    }
    const uniqueOptions = Array.from(new Set(validOptions));
    if (uniqueOptions.length < 2) {
      alert('As opções de voto devem ser distintas entre si.');
      return;
    }
    setAdminActionLoading(true);
    try {
      // 1. Cria enquete
      const { data: pollData, error: pollErr } = await supabase
        .from('guild_perk_polls')
        .insert({
          title: pollForm.title.trim(),
          description: pollForm.description.trim() || null,
          status: 'OPEN',
          created_by: 'ADMIN'
        })
        .select()
        .single();
      if (pollErr) throw pollErr;

      // 2. Insere opções
      const optionsToInsert = uniqueOptions.map(title => ({
        poll_id: pollData.id,
        title,
        votes_count: 0
      }));
      const { error: optErr } = await supabase
        .from('guild_perk_poll_options')
        .insert(optionsToInsert);
      if (optErr) {
        await supabase.from('guild_perk_polls').delete().eq('id', pollData.id);
        throw optErr;
      }

      // 3. Log Forense
      await supabase.from('guild_perk_audit_logs').insert({
        character_name: 'SISTEMA/ADMIN',
        event_type: 'POLL_CREATED',
        actor: 'ADMIN',
        details: `Criada nova votação de perks: "${pollForm.title}" com ${uniqueOptions.length} opções.`
      });

      setPollForm({ title: '', description: '', options: ['', ''] });
      setPollModalOpen(false);
      fetchAllData();
    } catch (err) {
      alert('Erro ao criar votação: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações de Votação: Registrar Voto de Membro
  const handleCastVote = async (pollId) => {
    const selectedOptId = selectedPollOption[pollId];
    const char = (votingCharName || charName).trim();

    if (!char) {
      setVotingFeedback(prev => ({
        ...prev,
        [pollId]: { type: 'error', text: 'Informe o nome do seu personagem para votar.' }
      }));
      return;
    }
    if (!selectedOptId) {
      setVotingFeedback(prev => ({
        ...prev,
        [pollId]: { type: 'error', text: 'Selecione uma das opções acima para votar.' }
      }));
      return;
    }

    // Validação de Voto Único
    const alreadyVoted = votes.some(v => 
      v.poll_id === pollId && v.character_name.toLowerCase() === char.toLowerCase()
    );

    if (alreadyVoted) {
      setVotingFeedback(prev => ({
        ...prev,
        [pollId]: { type: 'error', text: `O personagem "${char}" já registrou voto nesta enquete! Limite de 1 voto por personagem.` }
      }));
      return;
    }

    setAdminActionLoading(true);
    try {
      // 1. Insere voto
      const { error: vErr } = await supabase
        .from('guild_perk_poll_votes')
        .insert({
          poll_id: pollId,
          option_id: selectedOptId,
          character_name: char
        });
      if (vErr) {
        if (vErr.message && vErr.message.includes('unique_vote_per_char_poll')) {
          throw new Error(`O personagem "${char}" já votou nesta enquete.`);
        }
        throw vErr;
      }

      // 2. Incrementa votes_count
      const targetPoll = polls.find(p => p.id === pollId);
      const targetOpt = targetPoll?.options?.find(o => o.id === selectedOptId);
      if (targetOpt) {
        await supabase
          .from('guild_perk_poll_options')
          .update({ votes_count: (targetOpt.votes_count || 0) + 1 })
          .eq('id', selectedOptId);
      }

      setVotingFeedback(prev => ({
        ...prev,
        [pollId]: { type: 'success', text: `Voto computado com sucesso para ${char}!` }
      }));

      fetchAllData();
    } catch (err) {
      setVotingFeedback(prev => ({
        ...prev,
        [pollId]: { type: 'error', text: err.message }
      }));
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações de Votação: Encerrar Votação e Declarar Vencedor (Admin)
  const handleClosePoll = async (poll) => {
    if (!confirm(`Deseja encerrar a votação "${poll.title}"? Não serão aceitos novos votos.`)) return;
    setAdminActionLoading(true);
    try {
      const pollOpts = poll.options || [];
      const optsWithCounts = pollOpts.map(opt => {
        const count = votes.filter(v => v.option_id === opt.id).length || opt.votes_count || 0;
        return { ...opt, computedVotes: count };
      });
      optsWithCounts.sort((a, b) => b.computedVotes - a.computedVotes);
      const topOpt = optsWithCounts[0];
      let winnerTitle = topOpt && topOpt.computedVotes > 0 ? topOpt.title : 'Sem votos suficientes';

      if (optsWithCounts.length > 1 && optsWithCounts[0].computedVotes > 0 && optsWithCounts[0].computedVotes === optsWithCounts[1].computedVotes) {
        winnerTitle = `Empate: ${optsWithCounts[0].title} & ${optsWithCounts[1].title} (${optsWithCounts[0].computedVotes} votos cada)`;
      }

      const { error } = await supabase
        .from('guild_perk_polls')
        .update({
          status: 'CLOSED',
          winner_option_title: winnerTitle
        })
        .eq('id', poll.id);
      if (error) throw error;

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: 'SISTEMA/ADMIN',
        event_type: 'POLL_CLOSED',
        actor: 'ADMIN',
        details: `Votação "${poll.title}" encerrada. Vencedora: ${winnerTitle}.`
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao encerrar votação: ' + err.message);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Ações de Votação: Excluir Votação (Admin)
  const handleDeletePoll = async (poll) => {
    if (!confirm(`CONFIRMAÇÃO: Deseja EXCLUIR permanentemente a votação "${poll.title}"?`)) return;
    setAdminActionLoading(true);
    try {
      const { error } = await supabase
        .from('guild_perk_polls')
        .delete()
        .eq('id', poll.id);
      if (error) throw error;

      await supabase.from('guild_perk_audit_logs').insert({
        character_name: 'SISTEMA/ADMIN',
        event_type: 'POLL_DELETED',
        actor: 'ADMIN',
        details: `Excluída votação de perks: "${poll.title}".`
      });

      fetchAllData();
    } catch (err) {
      alert('Erro ao excluir votação: ' + err.message);
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
          {/* Card 1: Membros Ativos */}
          <div className="bg-black/50 border border-tibia-border/60 p-4 rounded-lg">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Membros com Perks</span>
              <Users size={15} className="text-blue-400" />
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {activeMembers.length} <span className="text-sm font-normal text-gray-400">participantes</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Com cargo e bônus ativos
            </p>
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

        <button
          onClick={() => setActiveTab('transparency')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'transparency'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <Landmark size={14} />
          <span>Transparência & Caixa</span>
        </button>

        <button
          onClick={() => setActiveTab('polls')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'polls'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-black/40 text-gray-300 hover:text-white border border-tibia-border/40'
          }`}
        >
          <Vote size={14} />
          <span>Votações de Perks</span>
          {polls.filter(p => p.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-500 text-black font-black">
              {polls.filter(p => p.status === 'OPEN').length}
            </span>
          )}
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
              Acesso restrito: aprovação individual pelo Administrador da guilda.
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

      {/* ABA 5: Transparência & Caixa da Guilda */}
      {activeTab === 'transparency' && (
        <div className="space-y-6">
          {/* Header da Aba */}
          <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2">
                <Landmark className="text-amber-400" size={22} />
                Transparência & Caixa da Guilda
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                Prestação de contas 100% aberta e auditável. Veja todas as contribuições dos membros e cada investimento realizado na aquisição e upgrade das perks da guilda.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex-shrink-0"
              >
                <Plus size={16} />
                <span>Registrar Upgrade / Gasto</span>
              </button>
            )}
          </div>

          {/* 3 KPI Cards Financeiros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total Arrecadado */}
            <div className="bg-black/50 border border-tibia-border/60 p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Arrecadado (Entradas)</span>
                <span className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                  <TrendingUp size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-black text-green-400">{financialStats.totalRcIn.toLocaleString('pt-BR')} RC</span>
                {financialStats.totalKkIn > 0 && (
                  <span className="text-lg font-bold text-gray-300">+ {financialStats.totalKkIn.toLocaleString('pt-BR')} KK</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-400" />
                {payments.length} transferências de cotas recebidas
              </p>
            </div>

            {/* Card 2: Total Investido em Perks */}
            <div className="bg-black/50 border border-tibia-border/60 p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Investido em Upgrades (Saídas)</span>
                <span className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <TrendingDown size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-black text-red-400">{financialStats.totalRcOut.toLocaleString('pt-BR')} RC</span>
                {financialStats.totalKkOut > 0 && (
                  <span className="text-lg font-bold text-gray-300">+ {financialStats.totalKkOut.toLocaleString('pt-BR')} KK</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                {expenses.length} melhorias de perks adquiridas
              </p>
            </div>

            {/* Card 3: Saldo Disponível em Caixa */}
            <div className="bg-gradient-to-br from-amber-950/40 via-black/60 to-black/60 border-2 border-amber-500/50 p-5 rounded-xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Saldo Líquido em Caixa</span>
                <span className="p-2 rounded-lg bg-amber-500/20 text-yellow-400 border border-amber-500/40">
                  <Coins size={18} />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className={`text-2xl font-black ${financialStats.rcBalance >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {financialStats.rcBalance.toLocaleString('pt-BR')} RC
                </span>
                <span className={`text-lg font-bold ${financialStats.kkBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  + {financialStats.kkBalance.toLocaleString('pt-BR')} KK
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                <Shield size={13} className="text-amber-400" />
                Fundo de reserva para as próximas perks
              </p>
            </div>
          </div>

          {/* Duas Tabelas: Saídas (Investimentos) e Entradas (Pagamentos) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela de Saídas / Upgrades */}
            <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-4 border-b border-tibia-border/40 pb-3">
                <h4 className="text-base font-medieval text-red-400 flex items-center gap-2">
                  <TrendingDown size={18} className="text-red-400" />
                  Investimentos em Perks (Saídas)
                </h4>
                <span className="text-xs text-gray-400 font-mono">
                  {expenses.length} registros
                </span>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs italic">
                  Nenhum registro de gasto ou upgrade cadastrado ainda.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-3.5 rounded-lg bg-black/60 border border-tibia-border/40 hover:border-red-500/40 transition-all text-xs flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white text-sm">{exp.description}</p>
                          {exp.proof_notes && (
                            <p className="text-gray-400 text-xs mt-0.5">{exp.proof_notes}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-red-400 text-sm">
                            - {Number(exp.amount).toLocaleString('pt-BR')} {exp.currency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-tibia-border/20 pt-2">
                        <span>{toBrtDateStr(exp.spent_at || exp.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Por: {exp.registered_by}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteExpense(exp)}
                              disabled={adminActionLoading}
                              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-950/40 rounded transition-colors"
                              title="Excluir Registro"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela de Entradas / Cotas Recebidas */}
            <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-4 border-b border-tibia-border/40 pb-3">
                <h4 className="text-base font-medieval text-green-400 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  Cotas & Mensalidades Recebidas (Entradas)
                </h4>
                <span className="text-xs text-gray-400 font-mono">
                  {payments.length} transferências
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs italic">
                  Nenhuma cota registrada no sistema ainda.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-lg bg-black/60 border border-tibia-border/40 hover:border-green-500/40 transition-all text-xs flex flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{p.character_name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                              Cota Paga
                            </span>
                          </p>
                          {p.proof_url_or_notes && (
                            <p className="text-gray-400 text-xs mt-0.5">{p.proof_url_or_notes}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-green-400 text-sm">
                            + {Number(p.amount).toLocaleString('pt-BR')} {p.currency}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-tibia-border/20 pt-2">
                        <span>Data: {toBrtDateStr(p.transaction_date || p.created_at)}</span>
                        <span>Válido até: <strong className="text-gray-300">{toBrtDateStr(p.cycle_end)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 6: Votações de Prioridade de Perks */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          {/* Header da Aba */}
          <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-6 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-medieval text-yellow-500 flex items-center gap-2">
                <Vote className="text-amber-400" size={22} />
                Votações de Prioridade de Perks
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                Decisão coletiva da guilda: escolha quais novos bônus ou melhorias devem ser ativados primeiro. Cada personagem participante tem direito a 1 voto por enquete.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => setPollModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md"
                >
                  <Plus size={16} />
                  <span>Criar Nova Votação</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros de Votação */}
          <div className="flex items-center gap-2 border-b border-tibia-border/40 pb-2">
            <button
              onClick={() => setPollFilter('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                pollFilter === 'ALL'
                  ? 'bg-amber-500 text-black'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-tibia-border/30'
              }`}
            >
              Todas ({polls.length})
            </button>
            <button
              onClick={() => setPollFilter('OPEN')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                pollFilter === 'OPEN'
                  ? 'bg-green-600 text-white'
                  : 'bg-black/40 text-green-400/70 hover:text-green-400 border border-tibia-border/30'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Abertas ({polls.filter(p => p.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setPollFilter('CLOSED')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                pollFilter === 'CLOSED'
                  ? 'bg-gray-600 text-white'
                  : 'bg-black/40 text-gray-400 hover:text-white border border-tibia-border/30'
              }`}
            >
              Encerradas ({polls.filter(p => p.status === 'CLOSED').length})
            </button>
          </div>

          {/* Lista de Votações */}
          {polls.filter(p => pollFilter === 'ALL' || p.status === pollFilter).length === 0 ? (
            <div className="bg-black/40 border border-tibia-border/60 rounded-xl p-12 text-center text-gray-500 italic">
              Nenhuma enquete encontrada para o filtro selecionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {polls
                .filter(p => pollFilter === 'ALL' || p.status === pollFilter)
                .map((poll) => {
                  const isOpen = poll.status === 'OPEN';
                  const pollVotesList = votes.filter(v => v.poll_id === poll.id);
                  const totalPollVotes = pollVotesList.length || poll.options?.reduce((acc, opt) => acc + (opt.votes_count || 0), 0) || 0;
                  const feedback = votingFeedback[poll.id];

                  // Opções com votos calculados
                  const opts = (poll.options || []).map(opt => {
                    const optVotes = pollVotesList.length > 0 
                      ? pollVotesList.filter(v => v.option_id === opt.id).length 
                      : (opt.votes_count || 0);
                    const pct = totalPollVotes > 0 ? Math.round((optVotes / totalPollVotes) * 100) : 0;
                    return { ...opt, computedVotes: optVotes, pct };
                  });

                  return (
                    <div 
                      key={poll.id} 
                      className={`bg-black/50 border rounded-xl p-6 shadow-xl relative transition-all ${
                        isOpen ? 'border-amber-500/60 shadow-amber-950/20' : 'border-tibia-border/60 opacity-90'
                      }`}
                    >
                      {/* Topo do Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-tibia-border/40 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {isOpen ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                                Votação Aberta
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                <CheckCircle size={12} className="mr-1" />
                                Votação Encerrada
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {toBrtDateStr(poll.created_at)}
                            </span>
                          </div>

                          <h4 className="text-lg font-medieval text-yellow-400">
                            {poll.title}
                          </h4>
                          {poll.description && (
                            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
                              {poll.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <div className="px-3 py-1.5 bg-black/60 border border-tibia-border/40 rounded text-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total de Votos</span>
                            <span className="text-base font-black text-white">{totalPollVotes}</span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5">
                              {isOpen && (
                                <button
                                  onClick={() => handleClosePoll(poll)}
                                  disabled={adminActionLoading}
                                  className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xs rounded transition-all shadow"
                                  title="Encerrar Votação e Declarar Vencedor"
                                >
                                  Encerrar
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePoll(poll)}
                                disabled={adminActionLoading}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900 border border-red-500/40 text-red-300 rounded transition-all"
                                title="Excluir Votação"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vencedor Declarado (se houver) */}
                      {(!isOpen || poll.winner_option_title) && (
                        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/50 rounded-lg p-3.5 mb-5 flex items-center gap-3">
                          <div className="p-2 rounded-full bg-amber-500/20 text-yellow-400 border border-amber-500/40">
                            <Award size={20} />
                          </div>
                          <div>
                            <span className="text-[11px] uppercase font-black text-amber-400 tracking-wider block">
                              🏆 Opção Vencedora Definida
                            </span>
                            <span className="text-base font-bold text-white">
                              {poll.winner_option_title || 'Aguardando apuração final'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Lista de Opções & Barras de Progresso */}
                      <div className="space-y-3 mb-5">
                        {opts.map((opt) => {
                          const isSelected = selectedPollOption[poll.id] === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => isOpen && setSelectedPollOption(prev => ({ ...prev, [poll.id]: opt.id }))}
                              className={`relative p-3 rounded-lg border transition-all overflow-hidden ${
                                isOpen ? 'cursor-pointer' : 'cursor-default'
                              } ${
                                isSelected
                                  ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500'
                                  : 'bg-black/60 border-tibia-border/40 hover:border-tibia-border/80'
                              }`}
                            >
                              {/* Barra de Progresso de Fundo */}
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-amber-500/15 transition-all duration-500 ease-out pointer-events-none"
                                style={{ width: `${opt.pct}%` }}
                              />

                              <div className="relative z-10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {isOpen && (
                                    <input
                                      type="radio"
                                      name={`poll_${poll.id}`}
                                      checked={isSelected}
                                      onChange={() => setSelectedPollOption(prev => ({ ...prev, [poll.id]: opt.id }))}
                                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                                    />
                                  )}
                                  <div>
                                    <p className="font-bold text-white text-sm">{opt.title}</p>
                                    {opt.description && (
                                      <p className="text-xs text-gray-400">{opt.description}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="text-sm font-black text-amber-400 font-mono">
                                    {opt.pct}%
                                  </span>
                                  <span className="text-[11px] text-gray-400 block">
                                    {opt.computedVotes} {opt.computedVotes === 1 ? 'voto' : 'votos'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Área de Votação (Apenas se Enquete Aberta) */}
                      {isOpen && (() => {
                        const activeVoterChar = (votingCharName || charName).trim();
                        const existingVote = activeVoterChar 
                          ? votes.find(v => v.poll_id === poll.id && v.character_name.toLowerCase() === activeVoterChar.toLowerCase()) 
                          : null;
                        const votedOpt = existingVote ? poll.options?.find(o => o.id === existingVote.option_id) : null;

                        return (
                          <div className="bg-black/70 border border-tibia-border/60 rounded-lg p-4">
                            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Vote size={14} className="text-amber-400" />
                              Registrar seu Voto
                            </h5>

                            {existingVote ? (
                              <div className="p-3 rounded-lg bg-green-950/40 border border-green-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-green-300">
                                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                                  <span>
                                    Voto computado para <strong>{existingVote.character_name}</strong>
                                    {votedOpt ? <> na opção: <strong className="text-white">"{votedOpt.title}"</strong></> : '.'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-green-400/80 font-mono self-end sm:self-auto">
                                  {toBrtDateStr(existingVote.voted_at)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <input
                                  type="text"
                                  placeholder="Nome do seu personagem..."
                                  value={votingCharName}
                                  onChange={(e) => setVotingCharName(e.target.value)}
                                  className="flex-1 bg-black/90 border border-tibia-border/80 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                                />

                                <button
                                  onClick={() => handleCastVote(poll.id)}
                                  disabled={adminActionLoading}
                                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0"
                                >
                                  <Check size={14} />
                                  <span>Confirmar Voto</span>
                                </button>
                              </div>
                            )}

                            {feedback && (
                              <div className={`mt-3 p-2.5 rounded text-xs flex items-center gap-2 ${
                                feedback.type === 'success'
                                  ? 'bg-green-950/40 border border-green-500/40 text-green-300'
                                  : 'bg-red-950/40 border border-red-500/40 text-red-300'
                              }`}>
                                {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                <span>{feedback.text}</span>
                              </div>
                            )}

                            <p className="text-[11px] text-gray-500 mt-2">
                              * Regra: Máximo de 1 voto por personagem. Todos os votos são auditados e gravados com registro de data/hora.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
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

      {/* MODAL: Registrar Upgrade / Gasto (Admin) */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tibia-card border-2 border-amber-500 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
              <TrendingDown className="text-amber-400" size={18} />
              Registrar Upgrade ou Gasto de Perk
            </h4>
            <p className="text-xs text-gray-300">
              Registre a compra de itens, ativação de perks ou investimentos debitados do caixa da guilda.
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Descrição do Upgrade / Investimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Upgrade Perk de XP Nível 2"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Valor Gasto</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    placeholder="Ex: 100"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Moeda</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="RC">RC (Rubin Coins)</option>
                    <option value="KK">KK (Gold / Milhões)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">Observações / Comprovante</label>
                <input
                  type="text"
                  placeholder="Ex: Itens adquiridos no NPC de Venore"
                  value={expenseForm.proof_notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, proof_notes: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-all"
                >
                  Confirmar Investimento
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 bg-black/60 hover:bg-black/80 border border-tibia-border/60 text-gray-300 rounded text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Criar Nova Votação (Admin) */}
      {pollModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-tibia-card border-2 border-amber-500 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-medieval text-yellow-500 flex items-center gap-2">
              <Vote className="text-amber-400" size={18} />
              Criar Nova Votação de Prioridade
            </h4>
            <p className="text-xs text-gray-300">
              Defina a pergunta e as opções de perks que os membros da guilda irão votar.
            </p>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Título da Votação / Pergunta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Qual Perk devemos evoluir no próximo ciclo?"
                  value={pollForm.title}
                  onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1 uppercase">
                  Descrição / Contexto (Opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Arrecadamos fundos suficientes para 1 perk tier 2 ou 2 perks tier 1. Votem na sua preferência."
                  value={pollForm.description}
                  onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })}
                  className="w-full bg-black/80 border border-tibia-border/60 rounded px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Opções de Voto (Mínimo 2)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                  >
                    <Plus size={13} />
                    Adicionar Opção
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pollForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Opção ${idx + 1} (ex: Bônus de XP +3%)`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 bg-black/80 border border-tibia-border/60 rounded px-3 py-1.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                        required
                      />
                      {pollForm.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40"
                          title="Remover Opção"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-tibia-border/40">
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition-all"
                >
                  Publicar Votação
                </button>
                <button
                  type="button"
                  onClick={() => setPollModalOpen(false)}
                  className="px-4 py-2 bg-black/60 hover:bg-black/80 border border-tibia-border/60 text-gray-300 rounded text-xs"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
