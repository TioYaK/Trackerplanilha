import { calculatePerkSimulation, SIMULATOR_PRESET_SCENARIOS } from '../frontend/src/lib/guildPerksConfig.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('='.repeat(65));
console.log('🧮 TESTE: SIMULADOR ESTRATÉGICO & CALCULADORA DE VIABILIDADE');
console.log('='.repeat(65));

// Teste 1: Cenário 1.000 membros a 50 RC
console.log('\n--- Teste 1: Projeção de 1.000 Membros a 50 RC (Base 25 RC = 2 KK) ---');
const sim1k = calculatePerkSimulation({
  members: 1000,
  feeRc: 50,
  rateRc: 25,
  rateKk: 2.0,
  targetTier: 'FULL',
  perkCostPerMemberKk: 0.8,
  itemCostPerMemberKk: 0.6
});

assert(sim1k.grossRc === 50000, `Arrecadação Bruta: 50.000 RC (obtido: ${sim1k.grossRc})`);
assert(sim1k.grossGoldKk === 4000.0, `Poder em Gold: 4.000 KK / 4 Bi (obtido: ${sim1k.grossGoldKk})`);
// Custo: 1000 * 0.8 = 800 KK (perks) + 1000 * 0.6 = 600 KK (itens) = 1400 KK
assert(sim1k.totalCostGoldKk === 1400.0, `Custo Operacional Total: 1.400 KK (obtido: ${sim1k.totalCostGoldKk})`);
// RCs necessários: 1400 / 0.08 = 17.500 RC
assert(sim1k.rcNeededForCost === 17500, `RCs a vender no market: 17.500 RC (obtido: ${sim1k.rcNeededForCost})`);
// Sobra líquida: 50.000 - 17.500 = 32.500 RC
assert(sim1k.surplusRc === 32500, `Sobra Líquida da Liderança: 32.500 RC (obtido: ${sim1k.surplusRc})`);
assert(sim1k.surplusMarginPct === 65, `Margem de Sobra Líquida: 65% (obtido: ${sim1k.surplusMarginPct}%)`);
// Break-even fee: 1.4 KK por membro / 0.08 = 17.5 -> Math.ceil = 18 RC
assert(sim1k.breakEvenFeeRc === 18, `Cota mínima de Break-even: 18 RC (obtido: ${sim1k.breakEvenFeeRc})`);

// Teste 2: Cenário 50 membros a 50 RC
console.log('\n--- Teste 2: Projeção de 50 Membros a 50 RC ---');
const sim50 = calculatePerkSimulation({
  members: 50,
  feeRc: 50,
  rateRc: 25,
  rateKk: 2.0
});
assert(sim50.grossRc === 2500, `Arrecadação 50 membros: 2.500 RC`);
assert(sim50.grossGoldKk === 200.0, `Poder em Gold 50 membros: 200 KK`);
assert(sim50.surplusRc > 0, `Gera sobra positiva para 50 membros: +${sim50.surplusRc} RC`);

// Teste 3: Cenários Predefinidos
console.log('\n--- Teste 3: Validação dos Cenários da Tabela Comparativa ---');
assert(SIMULATOR_PRESET_SCENARIOS.length === 5, '5 cenários de escala suportados');
SIMULATOR_PRESET_SCENARIOS.forEach(count => {
  const res = calculatePerkSimulation({ members: count, feeRc: 50 });
  assert(res.grossRc === count * 50, `Cenário ${count} membros correto`);
  assert(res.surplusMarginPct > 50, `Cenário ${count} membros mantém margem saudável (>50%)`);
});

console.log('\n' + '='.repeat(65));
console.log('🎉 TODOS OS TESTES DO SIMULADOR PASSARAM COM SUCESSO!');
console.log('='.repeat(65));
