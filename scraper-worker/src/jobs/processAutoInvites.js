'use strict';

import { supabase } from '../db.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.CHROME_PATH,
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Executa o processamento de convites de guilda pendentes na fila
 */
export async function runProcessAutoInvites() {
  console.log('[AutoInvite] 🔍 Verificando fila de convites pendentes...');

  try {
    // 1. Buscar convites pendentes
    const { data: pendingInvites, error: fetchErr } = await supabase
      .from('guild_invites_queue')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchErr) {
      console.error('[AutoInvite] Erro ao consultar fila de convites:', fetchErr.message);
      return;
    }

    if (!pendingInvites || pendingInvites.length === 0) {
      console.log('[AutoInvite] ✨ Nenhum convite pendente.');
      return;
    }

    console.log(`[AutoInvite] 📋 Encontrados ${pendingInvites.length} convites para processar.`);

    // 2. Marcar como IN_PROGRESS para evitar que outro worker processe ao mesmo tempo
    const inviteIds = pendingInvites.map(i => i.id);
    await supabase
      .from('guild_invites_queue')
      .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
      .in('id', inviteIds);

    // 3. Agrupar por Mundo/Servidor
    const invitesByWorld = {};
    for (const invite of pendingInvites) {
      const worldKey = (invite.world || 'Auroria').trim();
      if (!invitesByWorld[worldKey]) invitesByWorld[worldKey] = [];
      invitesByWorld[worldKey].push(invite);
    }

    // 4. Inicializar o browser
    const chromeExe = findChrome();
    const launchOpts = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
    };
    if (chromeExe) launchOpts.executablePath = chromeExe;

    const browser = await puppeteer.launch(launchOpts);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      for (const [world, invites] of Object.entries(invitesByWorld)) {
        console.log(`\n[AutoInvite] 🌐 Iniciando lote para o mundo: ${world} (${invites.length} convites)`);

        // Buscar conta do líder do servidor
        const { data: leaderAcc, error: accErr } = await supabase
          .from('guild_leader_accounts')
          .select('*')
          .ilike('world', world)
          .maybeSingle();

        if (accErr || !leaderAcc) {
          const errMsg = `Nenhuma conta de líder cadastrada para o mundo '${world}' em 'guild_leader_accounts'.`;
          console.error(`[AutoInvite] ❌ ${errMsg}`);

          for (const inv of invites) {
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'FAILED', error_message: errMsg, updated_at: new Date().toISOString() })
              .eq('id', inv.id);
          }
          continue;
        }

        // Tentar fazer login no RubinOT
        console.log(`[AutoInvite] 🔑 Efetuando login no RubinOT (${world}) com a conta: ${leaderAcc.account_name}...`);
        const loggedIn = await loginRubinot(page, leaderAcc.account_name, leaderAcc.password);

        if (!loggedIn) {
          const errMsg = `Falha ao realizar login na conta '${leaderAcc.account_name}' no RubinOT.`;
          console.error(`[AutoInvite] ❌ ${errMsg}`);

          for (const inv of invites) {
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'FAILED', error_message: errMsg, updated_at: new Date().toISOString() })
              .eq('id', inv.id);
          }
          continue;
        }

        // Processar cada convite deste mundo
        for (const invite of invites) {
          const guildTarget = invite.guild_name || leaderAcc.guild_name || 'Shell';
          console.log(`[AutoInvite] ✉ Enviando convite para '${invite.character_name}' na guilda '${guildTarget}'...`);

          const result = await inviteCharacter(page, guildTarget, invite.character_name);

          if (result.success) {
            console.log(`[AutoInvite] ✅ Sucesso: ${invite.character_name} convidado!`);
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'SUCCESS', error_message: null, updated_at: new Date().toISOString() })
              .eq('id', invite.id);
          } else {
            console.error(`[AutoInvite] ❌ Falha (${invite.character_name}): ${result.reason}`);
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'FAILED', error_message: result.reason, updated_at: new Date().toISOString() })
              .eq('id', invite.id);
          }
        }
      }
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (err) {
    console.error('[AutoInvite] Erro inesperado ao processar convites:', err.message);
  }
}

/**
 * Função de auxílio para Login no RubinOT
 */
async function loginRubinot(page, accountName, password) {
  try {
    await page.goto('https://rubinot.com.br/account/login', { waitUntil: 'networkidle2', timeout: 30000 });

    // Verificar se já está logado
    const currentUrl = page.url();
    if (currentUrl.includes('/account/manage') || currentUrl.includes('/account/dashboard')) {
      return true;
    }

    // Preencher formulário de login
    await page.waitForSelector('input[name="account"], input[name="name"], input[name="email"], #account', { timeout: 10000 });

    const accInput = await page.$('input[name="account"], input[name="name"], input[name="email"], #account');
    const passInput = await page.$('input[name="password"], input[type="password"], #password');

    if (!accInput || !passInput) {
      console.error('[AutoInvite] Inputs de login não encontrados na página.');
      return false;
    }

    // Digitar credenciais
    await accInput.click({ clickCount: 3 });
    await accInput.type(accountName);

    await passInput.click({ clickCount: 3 });
    await passInput.type(password);

    // Clicar em Entrar / Submit
    const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
        submitBtn.click()
      ]);
    } else {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
        page.keyboard.press('Enter')
      ]);
    }

    // Verificar se o login teve sucesso
    const afterUrl = page.url();
    const content = await page.content();

    if (content.toLowerCase().includes('senha incorreta') || content.toLowerCase().includes('invalid password')) {
      console.error('[AutoInvite] Senha ou conta incorreta no RubinOT.');
      return false;
    }

    return !afterUrl.includes('/login');
  } catch (err) {
    console.error('[AutoInvite] Erro durante o login:', err.message);
    return false;
  }
}

/**
 * Função de auxílio para Convidar Personagem na Guilda
 */
async function inviteCharacter(page, guildName, characterName) {
  try {
    const encodedGuild = encodeURIComponent(guildName);
    const targetUrl = `https://rubinot.com.br/guilds/${encodedGuild}`;

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    let inviteInput = await page.$('input[name="name"], input[name="character_name"], input[name="invite_name"], input[placeholder*="Personagem"], input[placeholder*="Character"]');

    if (!inviteInput) {
      const buttons = await page.$$('button, a');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.toLowerCase().includes('convidar') || text.toLowerCase().includes('invite'))) {
          await btn.click().catch(() => {});
          await page.waitForTimeout(1000);
          break;
        }
      }
      inviteInput = await page.$('input[name="name"], input[name="character_name"], input[name="invite_name"], input[placeholder*="Personagem"]');
    }

    if (!inviteInput) {
      // Tentativa fallback via fetch interno
      const submitResult = await page.evaluate(async (gName, cName) => {
        try {
          const res = await fetch(`/api/guilds/${encodeURIComponent(gName)}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ character: cName, name: cName })
          });
          const json = await res.json();
          return { status: res.status, data: json };
        } catch (e) {
          return { error: e.message };
        }
      }, guildName, characterName);

      if (submitResult && submitResult.status === 200) {
        return { success: true };
      }
      if (submitResult && submitResult.data && submitResult.data.message) {
        return { success: false, reason: submitResult.data.message };
      }
      return { success: false, reason: 'Formulário de convite não encontrado no painel da guilda.' };
    }

    await inviteInput.click({ clickCount: 3 });
    await inviteInput.type(characterName);

    const inviteBtn = await page.$('button[type="submit"], input[value*="Invite"], input[value*="Convidar"]');
    if (inviteBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        inviteBtn.click()
      ]);
    } else {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    const pageContent = await page.content();
    const lowerContent = pageContent.toLowerCase();

    if (lowerContent.includes('não existe') || lowerContent.includes('does not exist')) {
      return { success: false, reason: 'Personagem não encontrado no RubinOT.' };
    }
    if (lowerContent.includes('já possui') || lowerContent.includes('already in a guild')) {
      return { success: false, reason: 'Personagem já pertence a uma guilda.' };
    }
    if (lowerContent.includes('pendente') || lowerContent.includes('already invited')) {
      return { success: false, reason: 'Personagem já possui convite pendente.' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, reason: `Erro na navegação: ${err.message}` };
  }
}
