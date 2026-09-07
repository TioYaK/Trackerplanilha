/**
 * TEST CAPSOLVER - Turnstile Token Solver
 * 
 * INSTRUÇÕES:
 * 1. Acesse https://dashboard.capsolver.com/passport/register
 * 2. Crie uma conta gratuita (ganha créditos de teste)
 * 3. No dashboard, vá em "API Key" e copie sua chave
 * 4. Cole no campo CAPSOLVER_API_KEY abaixo
 * 5. Execute: node scraper-worker/src/test_capsolver.js
 */

import CapSolver from 'capsolver-npm';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// ⚡ COLE SUA API KEY AQUI ⚡
const CAPSOLVER_API_KEY = 'SUA_API_KEY_AQUI';

// Configurações do Turnstile do RubinOT
const TURNSTILE_SITEKEY = '0x4AAAAAACNN6UP_0bMMfY0F';
const TARGET_URL = 'https://rubinot.com.br/guilds/Shellpatrocina/manage';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function solveTurnstileWithCapSolver() {
  console.log('🚀 CapSolver - Teste de Resolução do Turnstile do RubinOT\n');
  console.log('─'.repeat(60));

  if (CAPSOLVER_API_KEY === 'SUA_API_KEY_AQUI') {
    console.error('❌ ERRO: Você precisa configurar sua API Key do CapSolver!');
    console.log('\n📝 Como obter:');
    console.log('   1. Acesse: https://dashboard.capsolver.com/passport/register');
    console.log('   2. Crie uma conta gratuita');
    console.log('   3. Vá em "API Key" no dashboard');
    console.log('   4. Cole a chave no campo CAPSOLVER_API_KEY neste arquivo\n');
    process.exit(1);
  }

  // 1. Verificar saldo da conta
  console.log('1️⃣  Verificando saldo da conta CapSolver...');
  const capsolver = new CapSolver(CAPSOLVER_API_KEY);
  
  let balance;
  try {
    balance = await capsolver.getBalance();
    console.log(`   ✅ Saldo disponível: $${balance.balance.toFixed(4)}`);
  } catch (err) {
    console.error('   ❌ Erro ao verificar saldo:', err.message);
    console.log('   Verifique se a API Key está correta.');
    process.exit(1);
  }

  // 2. Resolver o Turnstile
  console.log('\n2️⃣  Solicitando resolução do Turnstile...');
  console.log(`   Sitekey: ${TURNSTILE_SITEKEY}`);
  console.log(`   URL: ${TARGET_URL}`);
  
  const startTime = Date.now();
  
  let token;
  try {
    const result = await capsolver.solve({
      type: 'AntiTurnstileTaskProxyLess',
      websiteURL: TARGET_URL,
      websiteKey: TURNSTILE_SITEKEY,
    });

    token = result.solution.token;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ Token resolvido em ${elapsed}s!`);
    console.log(`   Token (primeiros 40 chars): ${token.substring(0, 40)}...`);
  } catch (err) {
    console.error('   ❌ Erro ao resolver Turnstile:', err.message);
    process.exit(1);
  }

  // 3. Usar o token para convidar o personagem
  console.log('\n3️⃣  Usando token para enviar convite...');
  
  const chromeExe = findChrome();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    executablePath: chromeExe || undefined,
  });

  try {
    const page = await browser.newPage();
    
    // Login via NextAuth
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(async (email, password) => {
      const csrfRes = await fetch('/api/auth/csrf');
      const csrfData = await csrfRes.json();
      const params = new URLSearchParams();
      params.append('email', email);
      params.append('password', password);
      params.append('csrfToken', csrfData.csrfToken);
      params.append('json', 'true');
      await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
    }, 'pifot16+maker781272@gmail.com', 'Liususu!28@3');

    await page.goto('https://rubinot.com.br/guilds/Shellpatrocina/manage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Enviar convite usando o token do CapSolver
    const inviteResult = await page.evaluate(async (guildName, charName, turnstileToken) => {
      try {
        const res = await fetch(`/api/guilds/${encodeURIComponent(guildName)}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: charName, turnstileToken })
        });
        const json = await res.json();
        return { status: res.status, ok: res.ok, data: json };
      } catch (e) {
        return { error: e.message };
      }
    }, 'Shellpatrocina', 'Xeroza pomba', token);

    console.log('\n4️⃣  Resultado do convite:');
    console.log('─'.repeat(60));
    
    if (inviteResult.ok || inviteResult.status === 200) {
      console.log('   🎉 SUCESSO! Convite enviado para Xeroza pomba!');
      console.log('   Resposta:', JSON.stringify(inviteResult.data, null, 2));
    } else if (inviteResult.status === 400) {
      const msg = inviteResult.data?.error || JSON.stringify(inviteResult.data);
      if (msg.includes('already') || msg.includes('já')) {
        console.log('   ⚠️  Personagem já possui convite pendente ou já é membro.');
      } else {
        console.log('   ❌ Falha no convite:', msg);
      }
    } else {
      console.log('   Resposta:', JSON.stringify(inviteResult, null, 2));
    }

  } finally {
    await browser.close();
  }

  console.log('\n─'.repeat(60));
  console.log('✅ Teste concluído! O CapSolver funcionou.');
  console.log(`💰 Custo estimado por resolução: ~$0.0006 (60 centavos por 1000)`);
}

solveTurnstileWithCapSolver().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
