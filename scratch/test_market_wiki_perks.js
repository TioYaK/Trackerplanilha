import { 
  MARKET_EXCHANGE_RATE, 
  convertRcToKk, 
  convertKkToRc, 
  calculateGoldPower,
  ASCENSION_GENERAL_BONUSES,
  ASCENSION_BESTIARY_RACES,
  ASCENSION_ELEMENTS
} from '../frontend/src/lib/guildPerksConfig.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('='.repeat(65));
console.log('🪙 TESTE: COTAÇÃO DE MERCADO (25 RC ≈ 2 KK) & DADOS DA WIKI RUBINOT');
console.log('='.repeat(65));

// Teste 1: Cotação de Mercado Oficial (25 RC = 2 KK)
console.log('\n--- Teste 1: Taxa e Funções de Conversão Financeira ---');
assert(MARKET_EXCHANGE_RATE.rcToKk === 2.0 / 25, 'Taxa rcToKk é exatamente 2/25 (0.08 KK/RC)');
assert(MARKET_EXCHANGE_RATE.kkToRc === 25 / 2.0, 'Taxa kkToRc é exatamente 25/2 (12.5 RC/KK)');

// 25 RC deve dar 2.0 KK
assert(convertRcToKk(25) === 2.0, '25 RC convertido equivale a 2.0 KK');
// 50 RC (cota padrão) deve dar 4.0 KK
assert(convertRcToKk(50) === 4.0, '50 RC convertido equivale a 4.0 KK');
// 2 KK deve dar 25 RC
assert(convertKkToRc(2) === 25, '2 KK convertido equivale a 25 RC');
// 4 KK deve dar 50 RC
assert(convertKkToRc(4) === 50, '4 KK convertido equivale a 50 RC');

// Teste 2: Cálculo de Poder de Fogo em Gold Líquido no Caixa
console.log('\n--- Teste 2: Poder de Compra em Gold do Caixa ---');
// Caixa com 200 RC e 10 KK de Gold -> 200 * 0.08 = 16 KK + 10 KK = 26.0 KK
const power1 = calculateGoldPower(200, 10);
assert(power1 === 26.0, `Poder de Fogo: 200 RC + 10 KK = 26.0 KK (calculado: ${power1})`);

// Caixa zerado em RC com 50 KK -> 50.0 KK
const power2 = calculateGoldPower(0, 50);
assert(power2 === 50.0, `Poder de Fogo: 0 RC + 50 KK = 50.0 KK (calculado: ${power2})`);

// Teste 3: Integridade dos Dados Oficiais da Wiki RubinOT
console.log('\n--- Teste 3: Dados Oficiais do Guild Ascension (Wiki) ---');
// 10 General Bonuses
assert(ASCENSION_GENERAL_BONUSES.length === 10, 'Exatamente 10 General Bonuses catalogados');
const expectedGeneral = ['Experience', 'Loot', 'Life Leech', 'Mana Leech', 'Critical', 'Skill', 'Stamina Regeneration', 'Fast Exercise', 'Weapon Proficiency', 'Familiar Damage'];
expectedGeneral.forEach(name => {
  const found = ASCENSION_GENERAL_BONUSES.find(b => b.title === name);
  assert(found !== undefined, `General Bonus "${name}" presente na lista da Wiki com descrição: "${found?.effect?.slice(0, 30)}..."`);
});

// 21 Raças do Bestiary
assert(ASCENSION_BESTIARY_RACES.length === 21, 'Exatamente 21 Raças do Bestiary catalogadas');
['Demon', 'Dragon', 'Undead', 'Construct', 'Giant'].forEach(race => {
  assert(ASCENSION_BESTIARY_RACES.includes(race), `Raça Bestiary "${race}" presente`);
});

// 7 Elementos
assert(ASCENSION_ELEMENTS.length === 7, 'Exatamente 7 Elementos catalogados');
['Fire', 'Ice', 'Energy', 'Earth', 'Death', 'Holy', 'Physical'].forEach(el => {
  assert(ASCENSION_ELEMENTS.includes(el), `Elemento "${el}" presente`);
});

console.log('\n' + '='.repeat(65));
console.log('🎉 TODOS OS TESTES DE COTAÇÃO & WIKI PASSARAM COM 100% DE SUCESSO!');
console.log('='.repeat(65));
