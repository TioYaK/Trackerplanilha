'use strict';

import { supabase } from '../db.js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

// ==========================================
// CONFIGURAÇÕES DA PLANILHA E CONTAS PADRÃO
// ==========================================
const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/11ODx6WKc8qrlp_QLffMLgn9M95o42JiDhgUnG1w9K5Y/export?format=csv';

const WORLD_IDS = {
  auroria: '11',
  belaria: '15',
  bellum: '30',
  tenebrium: '21',
  vesperia: '16',
};

const DEFAULT_ACCOUNTS = {
  vesperia: { world: 'Vesperia', account_name: 'pifot16+maker9182@gmail.com', password: 'Liususu!28@', guild_name: 'Shellpatrocina' },
  auroria: { world: 'Auroria', account_name: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3', guild_name: 'Shellpatrocina' },
  bellum: { world: 'BELLUM', account_name: 'pifot16+mak3r78372@gmail.com', password: 'Liusas!2asd', guild_name: 'Shellpatrocina' },
  belaria: { world: 'Belaria', account_name: 'pifot16+guizera@gmail.com', password: 'Ljajhsj@J7172', guild_name: 'Shellpatrocina' },
  tenebrium: { world: 'Tenebrium', account_name: 'pifot16+rubinot2@gmail.com', password: '88100267hH**', guild_name: 'Shellpatrocina' },
};

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
 * Parser customizado de linha CSV com tratamento de aspas duplas
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Busca convites diretamente da Planilha do Google configurada
 */
async function syncGoogleSheetInvites() {
  const sheetUrl = process.env.GOOGLE_SHEET_URL || DEFAULT_SHEET_URL;
  if (!sheetUrl) return;

  try {
    let csvUrl = sheetUrl;
    if (sheetUrl.includes('/edit')) {
      csvUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
    } else if (!sheetUrl.includes('export?format=csv')) {
      csvUrl = DEFAULT_SHEET_URL;
    }

    const response = await fetch(csvUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return;

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(Boolean);
    if (lines.length <= 1) return;

    let addedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);

      // Mapeamento das Colunas da Planilha:
      // B (index 1) = Sistema ("invite")
      // C (index 2) = Nome do Personagem (Pode ser separado por vírgula)
      // D (index 3) = Status de Processamento ("Pendente", "", "Concluido", "Finalizado")
      // F (index 5) = Status do Invite ("Processado", "Sucesso", etc.)
      // G (index 6) = Servidor de Origem/Destino ("Auroria", "Belaria", etc.)
      const sistema = (cols[1] || '').replace(/"/g, '').trim().toLowerCase();
      const rawChar = (cols[2] || '').replace(/"/g, '').trim();
      const statusD = (cols[3] || '').replace(/"/g, '').trim().toLowerCase();
      const statusF = (cols[5] || '').replace(/"/g, '').trim().toLowerCase();
      const servidor = (cols[6] || '').replace(/"/g, '').trim() || 'Auroria';

      const isPending = statusD === 'pendente';

      if (sistema === 'invite' && rawChar && isPending) {
        const charList = rawChar.split(',').map(c => c.trim()).filter(Boolean);

        for (const charName of charList) {
          const { data: existing } = await supabase
            .from('guild_invites_queue')
            .select('id, status')
            .ilike('character_name', charName)
            .ilike('world', servidor)
            .maybeSingle();

          if (!existing) {
            await supabase.from('guild_invites_queue').insert({
              character_name: charName,
              world: servidor,
              guild_name: 'Shell',
              status: 'PENDING',
              requested_by: `Planilha Google (Linha ${i+1})`
            });
            addedCount++;
          }
        }
      }
    }

    if (addedCount > 0) {
      console.log(`[AutoInvite] 📊 ${addedCount} novos convites importados da Planilha Google para o Supabase!`);
    }
  } catch (err) {
    console.error('[AutoInvite] Erro ao sincronizar Planilha do Google:', err.message);
  }
}

/**
 * Executa o processamento de convites de guilda pendentes na fila
 */
export async function runProcessAutoInvites() {
  console.log('[AutoInvite] 🔍 Verificando fila de convites pendentes...');

  try {
    // 0. Sincronizar planilha do Google
    await syncGoogleSheetInvites();

    // 1. Buscar convites pendentes
    const { data: pendingInvites, error: fetchErr } = await supabase
      .from('guild_invites_queue')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(15);

    if (fetchErr) {
      console.error('[AutoInvite] Erro ao consultar fila de convites:', fetchErr.message);
      return;
    }

    if (!pendingInvites || pendingInvites.length === 0) {
      console.log('[AutoInvite] ✨ Nenhum convite pendente.');
      return;
    }

    console.log(`[AutoInvite] 📋 Encontrados ${pendingInvites.length} convites para processar.`);

    // 2. Marcar como IN_PROGRESS
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

        let leaderAcc = null;
        const { data: dbAcc } = await supabase
          .from('guild_leader_accounts')
          .select('*')
          .ilike('world', world)
          .maybeSingle();

        if (dbAcc) {
          leaderAcc = dbAcc;
        } else {
          const defaultKey = world.toLowerCase();
          leaderAcc = DEFAULT_ACCOUNTS[defaultKey] || null;
        }

        if (!leaderAcc) {
          const errMsg = `Nenhuma conta de líder cadastrada para o mundo '${world}'.`;
          console.error(`[AutoInvite] ❌ ${errMsg}`);

          for (const inv of invites) {
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'FAILED', error_message: errMsg, updated_at: new Date().toISOString() })
              .eq('id', inv.id);
          }
          continue;
        }

        // Login no RubinOT
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
          const guildTarget = invite.guild_name || leaderAcc.guild_name || process.env.GUILD_NAME || 'Shellpatrocina';
          console.log(`[AutoInvite] ✉ Enviando convite para '${invite.character_name}' na guilda '${guildTarget}' (${world})...`);

          const result = await inviteCharacter(page, world, guildTarget, invite.character_name);

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
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/account/manage') || currentUrl.includes('/account/dashboard') || currentUrl.includes('/characters')) {
      return true;
    }

    await new Promise(r => setTimeout(r, 2500));

    const accInput = await page.$('input[name="email"], input[name="account"], input[name="name"], #account, input[type="email"]');
    const passInput = await page.$('input[name="password"], input[type="password"], #password');

    if (!accInput || !passInput) {
      console.error('[AutoInvite] Inputs de login não encontrados na página.');
      return false;
    }

    await accInput.click({ clickCount: 3 });
    await accInput.type(accountName);

    await passInput.click({ clickCount: 3 });
    await passInput.type(password);

    // Clicar no botão 'Entrar'
    const buttons = await page.$$('button[type="submit"], button');
    let enterBtn = null;
    for (const btn of buttons) {
      const txt = await page.evaluate(el => el.innerText, btn);
      if (txt && txt.trim().toLowerCase() === 'entrar') {
        enterBtn = btn;
        break;
      }
    }

    if (enterBtn) {
      await enterBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await new Promise(r => setTimeout(r, 3000));

    const afterUrl = page.url();
    const content = await page.content();

    if (content.toLowerCase().includes('senha incorreta') || content.toLowerCase().includes('invalid password')) {
      console.error('[AutoInvite] Senha ou conta incorreta no RubinOT.');
      return false;
    }

    return true;
  } catch (err) {
    console.error('[AutoInvite] Erro durante o login:', err.message);
    return false;
  }
}

/**
 * Função de auxílio para Convidar Personagem na Guilda
 */
async function inviteCharacter(page, world, guildName, characterName) {
  try {
    // 1. Ir para a página de guildas
    await page.goto('https://rubinot.com.br/guilds', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Selecionar o mundo no dropdown
    const worldKey = world.toLowerCase();
    const worldId = WORLD_IDS[worldKey] || '11';

    const select = await page.$('select');
    if (select) {
      await page.select('select', worldId).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
    }

    // 3. Navegar para a página da guilda
    const encodedGuild = encodeURIComponent(guildName);
    const targetUrl = `https://rubinot.com.br/guilds/${encodedGuild}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    let inviteInput = await page.$('input[name="name"], input[name="character_name"], input[name="invite_name"], input[placeholder*="Personagem"], input[placeholder*="Character"]');

    if (!inviteInput) {
      const buttons = await page.$$('button, a');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.toLowerCase().includes('convidar') || text.toLowerCase().includes('invite'))) {
          await btn.click().catch(() => {});
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      }
      inviteInput = await page.$('input[name="name"], input[name="character_name"], input[name="invite_name"], input[placeholder*="Personagem"]');
    }

    if (!inviteInput) {
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
      await inviteBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    } else {
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 2000));
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
