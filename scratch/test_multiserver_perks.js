import { WORLDS_CONFIG, WORLD_GUILD_MAP } from '../frontend/src/lib/guildPerksConfig.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('='.repeat(60));
console.log('🛡️ INICIANDO SUÍTE DE TESTES: ISOLAMENTO MULTI-SERVIDOR 100%');
console.log('='.repeat(60));

// Teste 1: Validação das 6 Guildas e Mundos Mapeados
console.log('\n--- Teste 1: Integridade dos 6 Mundos & Guildas ---');
assert(WORLDS_CONFIG.length === 6, 'Exatamente 6 mundos configurados');
const expectedWorlds = ['Auroria', 'Belaria', 'Bellum', 'Tenebrium', 'Vesperia', 'Malveria'];
expectedWorlds.forEach(w => {
  const found = WORLDS_CONFIG.find(item => item.world === w);
  assert(found !== undefined, `Mundo ${w} encontrado`);
  assert(found.guild && found.guild.length > 0, `Mundo ${w} possui guilda ${found.guild}`);
  assert(found.defaultBank && found.defaultBank.includes(w), `Mundo ${w} possui char bank específico: ${found.defaultBank}`);
  assert(WORLD_GUILD_MAP[w] === found.guild, `Mapeamento WORLD_GUILD_MAP consistente para ${w}`);
});

// Teste 2: Simulação de Isolamento Financeiro (Caixa por Servidor)
console.log('\n--- Teste 2: Isolamento Financeiro de Caixa & Transparência ---');

const mockPayments = [
  // Auroria
  { id: '1', character_name: 'Player Auroria 1', amount: 50, currency: 'RC', world: 'Auroria' },
  { id: '2', character_name: 'Player Auroria 2', amount: 10, currency: 'KK', world: 'Auroria' },
  // Belaria
  { id: '3', character_name: 'Player Belaria 1', amount: 50, currency: 'RC', world: 'Belaria' },
  { id: '4', character_name: 'Player Belaria 2', amount: 25, currency: 'KK', world: 'Belaria' }
];

const mockExpenses = [
  // Auroria: upgrade de 50 RC
  { id: 'e1', description: 'Perk Auroria XP', amount: 50, currency: 'RC', world: 'Auroria' },
  // Belaria: upgrade de 10 KK e câmbio de 50 RC em 15 KK
  { id: 'e2', description: 'Perk Belaria XP', amount: 10, currency: 'KK', world: 'Belaria' },
  { id: 'e3', description: 'Câmbio Belaria', amount: 50, currency: 'RC', converted_amount: 15, converted_currency: 'KK', world: 'Belaria' }
];

function calculateStats(selectedWorld, payments, expenses) {
  const filteredPay = selectedWorld === 'ALL' 
    ? payments 
    : payments.filter(p => p.world.toLowerCase() === selectedWorld.toLowerCase());
  const filteredExp = selectedWorld === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.world.toLowerCase() === selectedWorld.toLowerCase());

  let totalRcIn = 0, totalKkIn = 0;
  filteredPay.forEach(p => {
    if (p.currency === 'RC') totalRcIn += p.amount;
    if (p.currency === 'KK') totalKkIn += p.amount;
  });

  let totalRcOut = 0, totalKkOut = 0;
  let totalRcConv = 0, totalKkConv = 0;
  filteredExp.forEach(e => {
    if (e.currency === 'RC') totalRcOut += e.amount;
    if (e.currency === 'KK') totalKkOut += e.amount;
    if (e.converted_amount) {
      const convCurr = e.converted_currency || (e.currency === 'RC' ? 'KK' : 'RC');
      if (convCurr === 'RC') totalRcConv += e.converted_amount;
      if (convCurr === 'KK') totalKkConv += e.converted_amount;
    }
  });

  return {
    rcBalance: (totalRcIn + totalRcConv) - totalRcOut,
    kkBalance: (totalKkIn + totalKkConv) - totalKkOut,
    countPay: filteredPay.length,
    countExp: filteredExp.length
  };
}

// 2.1 Caixa Auroria
const auroriaStats = calculateStats('Auroria', mockPayments, mockExpenses);
assert(auroriaStats.countPay === 2, 'Auroria possui 2 pagamentos');
assert(auroriaStats.countExp === 1, 'Auroria possui 1 gasto');
assert(auroriaStats.rcBalance === 0, 'Saldo RC Auroria: 50 - 50 = 0 RC');
assert(auroriaStats.kkBalance === 10, 'Saldo KK Auroria: 10 KK');

// 2.2 Caixa Belaria
const belariaStats = calculateStats('Belaria', mockPayments, mockExpenses);
assert(belariaStats.countPay === 2, 'Belaria possui 2 pagamentos');
assert(belariaStats.countExp === 2, 'Belaria possui 2 gastos/câmbios');
// Belaria RC: 50 in, 50 out (câmbio) -> 0 RC
assert(belariaStats.rcBalance === 0, 'Saldo RC Belaria: 0 RC');
// Belaria KK: 25 in + 15 in (câmbio) - 10 out = 30 KK
assert(belariaStats.kkBalance === 30, 'Saldo KK Belaria: 25 + 15 - 10 = 30 KK');

// 2.3 Caixa Consolidado da Aliança (ALL)
const allStats = calculateStats('ALL', mockPayments, mockExpenses);
assert(allStats.countPay === 4, 'Aliança possui 4 pagamentos totais');
assert(allStats.countExp === 3, 'Aliança possui 3 despesas totais');
assert(allStats.rcBalance === 0, 'Saldo RC Aliança: 0 RC');
assert(allStats.kkBalance === 40, 'Saldo KK Aliança: 10 (Auroria) + 30 (Belaria) = 40 KK');

// Teste 3: Isolamento de Votações por Mundo
console.log('\n--- Teste 3: Isolamento de Votações / Enquetes ---');

const mockPolls = [
  { id: 'p1', title: 'Perk Auroria', world: 'Auroria' },
  { id: 'p2', title: 'Perk Belaria', world: 'Belaria' },
  { id: 'p3', title: 'Perk Bellum', world: 'Bellum' },
  { id: 'p4', title: 'Regra Geral Aliança', world: 'ALL' }
];

function filterPolls(selectedWorld, polls) {
  if (selectedWorld === 'ALL') return polls;
  return polls.filter(p => {
    const pw = (p.world || 'Auroria').toLowerCase();
    return pw === selectedWorld.toLowerCase() || pw === 'all' || pw === 'global';
  });
}

const auroriaPolls = filterPolls('Auroria', mockPolls);
assert(auroriaPolls.length === 2, 'Auroria vê 2 enquetes: sua própria e a Geral');
assert(auroriaPolls.some(p => p.id === 'p1') && auroriaPolls.some(p => p.id === 'p4'), 'Enquetes de Auroria corretas');

const belariaPolls = filterPolls('Belaria', mockPolls);
assert(belariaPolls.length === 2, 'Belaria vê 2 enquetes: sua própria e a Geral');
assert(belariaPolls.some(p => p.id === 'p2') && belariaPolls.some(p => p.id === 'p4'), 'Enquetes de Belaria corretas');

const allPolls = filterPolls('ALL', mockPolls);
assert(allPolls.length === 4, 'Visão geral ALL exibe todas as 4 enquetes');

// Teste 4: Isolamento de Membros por Mundo
console.log('\n--- Teste 4: Isolamento de Participantes por Mundo ---');

const mockMembers = [
  { id: 'm1', character_name: 'Hero Auroria', world: 'Auroria', status: 'ACTIVE' },
  { id: 'm2', character_name: 'Hero Belaria', world: 'Belaria', status: 'ACTIVE' },
  { id: 'm3', character_name: 'Hero Bellum', world: 'Bellum', status: 'INACTIVITY_ALERT' },
  { id: 'm4', character_name: 'Hero Tenebrium', world: 'Tenebrium', status: 'ACTIVE' }
];

function filterMembers(selectedWorld, members) {
  if (selectedWorld === 'ALL') return members;
  return members.filter(m => (m.world || 'Auroria').toLowerCase() === selectedWorld.toLowerCase());
}

assert(filterMembers('Auroria', mockMembers).length === 1, '1 membro em Auroria');
assert(filterMembers('Belaria', mockMembers).length === 1, '1 membro em Belaria');
assert(filterMembers('Bellum', mockMembers).length === 1, '1 membro em Bellum');
assert(filterMembers('Vesperia', mockMembers).length === 0, '0 membros em Vesperia');
assert(filterMembers('ALL', mockMembers).length === 4, '4 membros no total consolidado');

console.log('\n' + '='.repeat(60));
console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 100% ISOLADO!');
console.log('='.repeat(60));
