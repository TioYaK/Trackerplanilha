'use strict';

import { supabase } from '../db.js';
import puppeteer from 'rebrowser-puppeteer'; // Usando fork anti-detecção

import fs from 'fs';
import path from 'path';
import os from 'os';
import { updateSheetRow } from '../lib/googleSheets.js';
import { findUniversalChrome, getLeanChromeArgs, getDebugScreenshotPath, cleanStaleLocks } from '../lib/storageGuardian.js';

async function updateSheetIfApplicable(invite, updates) {
  if (invite.requested_by && invite.requested_by.includes('Linha')) {
    const matches = [...invite.requested_by.matchAll(/Linha (\d+)/g)];
    for (const match of matches) {
      if (match && match[1]) {
        await new Promise(r => setTimeout(r, 1000)); await updateSheetRow(parseInt(match[1]), updates);
      }
    }
  }
}

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
  vesperia: { world: 'Vesperia', account_name: 'pifot16+maker9182@gmail.com', password: 'Liususu!28@', guild_name: 'Battlestorm Vesperia' },
  auroria: { world: 'Auroria', account_name: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3', guild_name: 'Shellpatrocina' },
  bellum: { world: 'BELLUM', account_name: 'pifot16+mak3r78372@gmail.com', password: 'Liusas!2asd', guild_name: 'Battlestorm Bellum' },
  belaria: { world: 'Belaria', account_name: 'pifot16+guizera@gmail.com', password: 'Ljajhsj@J7172', guild_name: 'Battlestorm Belaria' },
  tenebrium: { world: 'Tenebrium', account_name: 'pifot16+rubinot2@gmail.com', password: '88100267hH**', guild_name: 'Battlestorm Retro' },
  malveria: { world: 'Malveria', account_name: 'pifot16+grim@gmail.com', password: 'Kx3ngjasjd!2', guild_name: 'Battlestorm Malveria' }
};

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
      const currentReqBy = `Linha ${i + 1}`;

      if ((sistema === 'invite' || sistema === '') && rawChar && isPending) {
        const charList = rawChar.split(',').map(c => c.trim()).filter(Boolean);

        for (const charName of charList) {
          const { data: existing } = await supabase
            .from('guild_invites_queue')
            .select('id, status, requested_by')
            .ilike('character_name', charName)
            .ilike('world', servidor)
            .maybeSingle();

          if (!existing) {
            await supabase.from('guild_invites_queue').insert({
              character_name: charName,
              world: servidor,
              guild_name: 'Shell',
              status: 'PENDING',
              requested_by: currentReqBy
            });
            addedCount++;
          } else {
            let newReqBy = existing.requested_by || '';
            if (!newReqBy.includes(currentReqBy)) {
              newReqBy += (newReqBy ? ', ' : '') + currentReqBy;
            }
            
            await supabase.from('guild_invites_queue').update({
              status: 'PENDING',
              requested_by: newReqBy
            }).eq('id', existing.id);
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

// ==========================================
// LÓGICA DE CÓPIA DE PERFIL DO LAUNCHER
// ==========================================
const RUBINOT_PROFILE = path.join(os.homedir(), 'AppData', 'Local', 'rubinot-launcher', 'EBWebView');
const WORK_PROFILE_BASE = path.join(process.cwd(), 'worker_profiles');

function copyDirSafe(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  let files;
  try { files = fs.readdirSync(src); } catch { return; }
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    try {
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirSafe(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch { /* arquivo bloqueado, pula */ }
  }
}

function ensureProfile(world) {
  const profileDest = path.join(WORK_PROFILE_BASE, `launcher_${world}`);
  const srcDefault = path.join(WORK_PROFILE_BASE, 'auroria_launcher', 'Default');
  const destDefault = path.join(profileDest, 'Default');
  
  // Se o perfil do mundo não existir, copia do auroria_launcher (que já tem o cookie cf_clearance validado para o Chrome)
  if (!fs.existsSync(destDefault) && fs.existsSync(srcDefault)) {
    console.log(`[PROFILE] Copiando perfil validado do Chrome para mundo ${world}...`);
    copyDirSafe(srcDefault, destDefault);
  }
  
  if (!fs.existsSync(profileDest)) {
    fs.mkdirSync(profileDest, { recursive: true });
  }
  return profileDest;
}

const LOCK_FILE = path.join(process.cwd(), '.invite_processing.lock');

function acquireLock() {
  try {
    // O flag 'wx' falha se o arquivo já existe — lock atômico
    fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: 'wx' });
    return true;
  } catch {
    // Verificar se o processo dono do lock ainda está vivo
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
      try { process.kill(pid, 0); return false; } // processo ainda vivo
      catch { fs.unlinkSync(LOCK_FILE); return acquireLock(); } // processo morto, remove lock
    } catch { return false; }
  }
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch {}
}

/**
 * Executa o processamento de convites de guilda pendentes na fila
 */
export async function runProcessAutoInvites() {
  if (!acquireLock()) {
    console.log('[AutoInvite] Já existe um lote em processamento (lock de arquivo). Ignorando gatilho simultâneo.');
    return;
  }

  console.log('[AutoInvite] 🔍 Verificando fila de convites pendentes...');

  try {
    // 0. Sincronizar planilha do Google
    await syncGoogleSheetInvites();

    // Destrava convites que ficaram presos em IN_PROGRESS há mais de 3 minutos
    const staleTime = new Date(Date.now() - 3 * 60000).toISOString();
    await supabase.from('guild_invites_queue')
      .update({ status: 'PENDING', error_message: null })
      .eq('status', 'IN_PROGRESS')
      .lt('updated_at', staleTime);

    // 1. Buscar convites pendentes (ignorando mundos em espera como Malveria)
    const { data: pendingInvites, error: fetchErr } = await supabase
      .from('guild_invites_queue')
      .select('*')
      .eq('status', 'PENDING')
      .not('world', 'ilike', 'malveria')
      .order('created_at', { ascending: true })
      .limit(30);

    if (fetchErr) {
      console.error('[AutoInvite] Erro ao consultar fila de convites:', fetchErr.message);
      return;
    }

    if (!pendingInvites || pendingInvites.length === 0) {
      console.log('[AutoInvite] ✨ Nenhum convite pendente para mundos ativos.');
      return;
    }

    console.log(`[AutoInvite] 📋 Encontrados ${pendingInvites.length} convites para processar.`);

    // 2. Marcar como IN_PROGRESS e limpar mensagens de erro antigas
    const inviteIds = pendingInvites.map(i => i.id);
    await supabase
      .from('guild_invites_queue')
      .update({ status: 'IN_PROGRESS', error_message: null, updated_at: new Date().toISOString() })
      .in('id', inviteIds);

    for (const inv of pendingInvites) {
      await updateSheetIfApplicable(inv, { statusD: 'Processando', workerE: `Worker-${inv.world || 'Auto'}` });
    }

    // 3. Agrupar por Mundo/Servidor
    const invitesByWorld = {};
    for (const invite of pendingInvites) {
      const worldKey = (invite.world || 'Auroria').trim();
      if (!invitesByWorld[worldKey]) invitesByWorld[worldKey] = [];
      invitesByWorld[worldKey].push(invite);
    }

    // 4. Inicializar o browser
    const chromeExe = findUniversalChrome();
    
    // Configuração base (agora mudou para instanciar dentro do loop de mundos)
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
          await updateSheetIfApplicable(inv, { statusD: 'Finalizado', statusF: 'Falha: ' + errMsg });
        }
        continue;
      }

        const profilePath = ensureProfile(world);
        cleanStaleLocks(profilePath);

        console.log(`[PUPPETEER] Abrindo navegador para ${world}...`);
        const browser = await puppeteer.launch({
          headless: false, // Necessário para passar no Cloudflare Turnstile
          executablePath: chromeExe || undefined,
          userDataDir: profilePath,
          args: getLeanChromeArgs([
            '--window-size=1280,800',
            '--window-position=9999,9999', // Empurra a janela pra fora da tela visível
            '--exclude-switches=enable-automation'
          ]),
          ignoreDefaultArgs: ['--enable-automation'],
        });

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // Login no RubinOT
        console.log(`[AutoInvite] 🔑 Efetuando login no RubinOT (${world}) com a conta: ${leaderAcc.account_name}...`);
        const loggedIn = await loginRubinot(page, leaderAcc.account_name, leaderAcc.password);

        if (loggedIn === 'MAINTENANCE') {
          console.warn('[AutoInvite] 🔧 RubinOT em manutenção. Revertendo lote e aguardando o site voltar...');
          await browser.close().catch(() => {});
          const currentWorldInviteIds = invites.map(i => i.id);
          await supabase.from('guild_invites_queue')
            .update({ status: 'PENDING', error_message: 'Site em manutenção', updated_at: new Date().toISOString() })
            .in('id', currentWorldInviteIds);
          releaseLock();
          return; // Para tudo
        }

        if (!loggedIn) {
          const errMsg = `Falha ao realizar login na conta '${leaderAcc.account_name}' no RubinOT.`;
          console.error(`[AutoInvite] ❌ ${errMsg} O sistema tentará novamente no próximo ciclo.`);

          for (const inv of invites) {
            await updateSheetIfApplicable(inv, { statusD: 'Pendente', statusF: 'Site Lento (Aguardando Retentativa)' });
            await supabase.from('guild_invites_queue')
              .update({ status: 'PENDING', error_message: errMsg, updated_at: new Date().toISOString() })
              .eq('id', inv.id);
          }
          await browser.close().catch(() => {});
          continue; // Pula para o próximo mundo
        }

        // Processar cada convite deste mundo
        for (const invite of invites) {
          let guildTarget = invite.guild_name || leaderAcc.guild_name || process.env.GUILD_NAME || 'Shellpatrocina';
          if (guildTarget.toLowerCase() === 'shell') guildTarget = leaderAcc.guild_name || 'Shellpatrocina';
          console.log(`[AutoInvite] ✉ Enviando convite para '${invite.character_name}' na guilda '${guildTarget}' (${world})...`);

          console.log(`[AutoInvite] Aguardando 4 segundos entre convites...`);
          await new Promise(r => setTimeout(r, 4000));
          const result = await inviteCharacter(page, world, guildTarget, invite.character_name);

          if (result.success) {
            console.log(`[AutoInvite] ✅ Sucesso: ${invite.character_name} convidado!`);
            await supabase
              .from('guild_invites_queue')
              .update({ status: 'SUCCESS', error_message: null, updated_at: new Date().toISOString() })
              .eq('id', invite.id);
            await updateSheetIfApplicable(invite, { statusD: 'Finalizado', statusF: 'Sucesso' });
          } else {
            console.error(`[AutoInvite] ❌ Falha (${invite.character_name}): ${result.reason}`);
            
            const isTempError = result.reason.includes('timeout') || 
                                result.reason.includes('Formul') || 
                                result.reason.includes('Input de convite') || 
                                result.reason.includes('503') ||
                                result.reason.includes('Cloudflare') ||
                                result.reason.includes('Turnstile');

            if (isTempError) {
               // Erro temporário (site engasgou ou Cloudflare) - Mantém pendente para o próximo ciclo!
               console.log(`[AutoInvite] 🔄 Retentativa agendada para '${invite.character_name}' (${result.reason}).`);
               await supabase
                 .from('guild_invites_queue')
                 .update({ status: 'PENDING', error_message: result.reason, updated_at: new Date().toISOString() })
                 .eq('id', invite.id);
               await updateSheetIfApplicable(invite, { statusD: 'Pendente', statusF: 'Site Lento (Aguardando Retentativa)' });
            } else {
               // Erro definitivo (já tem guilda, não existe, etc) - Falha e encerra
               await supabase
                 .from('guild_invites_queue')
                 .update({ status: 'FAILED', error_message: result.reason, updated_at: new Date().toISOString() })
                 .eq('id', invite.id);
               await updateSheetIfApplicable(invite, { statusD: 'Finalizado', statusF: 'Falha: ' + result.reason });
            }
          }
        }
      } finally {
        await browser.close().catch(() => {});
      }
    }
  } catch (err) {
    console.error('[AutoInvite] Erro inesperado ao processar convites:', err.message);
  } finally {
    releaseLock();
  }
}

/**
 * Função de auxílio para Login no RubinOT
 */
async function loginRubinot(page, accountName, password) {
    try {
      await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 }).catch(e =>
        console.error('[AutoInvite] Aviso de timeout no /login, prosseguindo...'));

      // Verificar se o site está em manutenção
      const contentAfterNav = await page.content();
      if (contentAfterNav.includes('Maintenance Mode') || contentAfterNav.includes('Server is under maintenance') || contentAfterNav.includes("We'll Be Right Back")) {
        console.warn('[AutoInvite] 🔧 Site em manutenção! Pausando processamento...');
        return 'MAINTENANCE';
      }

      // Verificar se já está logado (o perfil do Chrome pode ter a sessão salva)
      const alreadyLoggedIn = contentAfterNav.includes('Minha Conta') || contentAfterNav.includes('>Sair<') || contentAfterNav.includes('Logado como');
      if (alreadyLoggedIn) {
        console.log(`[AutoInvite] ✅ Sessão já ativa para ${accountName} (cookie salvo).`);
        return true;
      }

      // Esperar o campo de email aparecer (React pode demorar a montar)
      const emailSelector = 'input[type="email"], input[name="email"], input[id="email"]';
      await page.waitForSelector(emailSelector, { timeout: 8000 }).catch(() => {});

      const emailInput = await page.$(emailSelector);
      const passInput  = await page.$('input[type="password"], input[name="password"], input[id="password"]');

      if (emailInput && passInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(accountName, { delay: 60 });
        await passInput.click({ clickCount: 3 });
        await passInput.type(password, { delay: 60 });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
          const form = document.querySelector('form');
          const btn = form?.querySelector('button[type="submit"], button') || document.querySelector('button[type="submit"]');
          if (btn) btn.click();
        });

        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.error(`[AutoInvite] ⚠️ Campos de login não encontrados para ${accountName}. Tentando screenshot...`);
        await page.screenshot({ path: getDebugScreenshotPath('debug_login_form.png') }).catch(() => {});
        return false;
      }

      // Verificar se está logado após submeter
      const pageContent = await page.content();
      const isLoggedIn = pageContent.includes('Minha Conta') || pageContent.includes('>Sair<') || pageContent.includes('Logado como');

      if (!isLoggedIn) {
        await page.screenshot({ path: getDebugScreenshotPath('debug_login_fail.png') }).catch(() => {});
        console.error(`[AutoInvite] ❌ Login falhou para ${accountName} (sessão não detectada).`);
        return false;
      }

      console.log(`[AutoInvite] ✅ Login confirmado para ${accountName}.`);
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
    // 1. Ir para a página de gerenciar guilda diretamente
    const encodedGuild = encodeURIComponent(guildName);
    const targetUrl = `https://rubinot.com.br/guilds/${encodedGuild}/manage`;
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Fechar banner de cookies se existir
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aceitar = btns.find(b => b.innerText.includes('Aceitar'));
      if (aceitar) aceitar.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Clicar na aba Convidar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.trim() === 'Convidar');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Digitar personagem
    const input = await page.$('input[placeholder="Nome do personagem"]');
    if (!input) {
       await page.screenshot({ path: getDebugScreenshotPath('debug_input_missing.png') }).catch(() => {});
       return { success: false, reason: 'Input de convite não encontrado na página (verifique permissões).' };
    }
    
    await input.click({ clickCount: 3 });
    await input.type(characterName, { delay: 80 });
    await new Promise(r => setTimeout(r, 500));

    // Clicar botão Convidar
    await page.evaluate(() => {
      const inp = document.querySelector('input[placeholder="Nome do personagem"]');
      if (inp) {
        const parent = inp.closest('form') || inp.parentElement;
        const btn = parent?.querySelector('button[type="submit"], button');
        if (btn) btn.click();
      }
    });

    // Esperar processamento do Cloudflare e resposta da página
    let turnstileSolved = false;
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        
        // Ocultado a requisição dupla via API, já que a UI consome o token e envia o formulário automaticamente.
        
        if (!turnstileSolved) {
            try {
                const tsFrame = page.frames().find(f => f.url().includes('challenges.cloudflare.com'));
                if (tsFrame) {
                    const checkbox = await tsFrame.$('input[type="checkbox"]');
                    if (checkbox) {
                        await checkbox.click();
                        turnstileSolved = true;
                        // Não espera muito, no próximo tick do loop ele já vai pegar o token
                    } else {
                        // Tentar clicar no widget via bounding box
                        const body = await tsFrame.$('body');
                        if (body) {
                           await body.click();
                           turnstileSolved = true;
                        }
                    }
                }
            } catch(e) {}
        }
        
        // Vamos buscar frases exatas no texto da página para caso a UI tenha funcionado
        const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
        
        if (pageText.includes('has been invited') || pageText.includes('foi convidado') || pageText.includes('sucesso')) {
            return { success: true };
        }
        
        if (pageText.includes('não existe') || pageText.includes('nao existe') || pageText.includes('does not exist') || 
            pageText.includes('player not found') || pageText.includes('character not found') ||
            pageText.includes('does not live on the same world') || pageText.includes('not found')) {
              try {
                  const { fetchRubinotApi } = await import('../lib/rubinotScraper.js');
                  const charData = await fetchRubinotApi('/api/characters/' + encodeURIComponent(characterName));
                  if (charData && charData.character && charData.character.world) {
                      return { success: false, reason: `Personagem está no mundo ${charData.character.world}.` };
                  }
              } catch (e) {}
              return { success: false, reason: 'Personagem não encontrado no RubinOT (ou está em outro mundo).' };
          }
        
        if (pageText.includes('already in a guild') || pageText.includes('already belongs') || pageText.includes('already a member of')) {
            return { success: false, reason: 'Personagem já pertence a uma guilda.' };
        }
        
        // Cuidado: a UI tem um título "Convites pendentes", por isso NÃO podemos buscar só pela palavra "pendente"
        if (pageText.includes('already been invited') || pageText.includes('já foi convidado') || pageText.includes('already invited')) {
            return { success: true, reason: 'Personagem já possui convite pendente.' };
        }
        
        if (pageText.includes('token is required') || pageText.includes('verification token')) {
            return { success: false, reason: 'Bloqueado pelo Cloudflare (Token is required).' };
        }
    }
    
    // Screenshot para debugar qual foi a mensagem real do site
    await page.screenshot({ path: getDebugScreenshotPath('debug_timeout.png') }).catch(() => {});
    return { success: false, reason: 'Cloudflare bloqueou a verificação (Turnstile) do convite.' };
  } catch (err) {
    return { success: false, reason: `Erro na navegação: ${err.message}` };
  }
}

