'use strict';

import { supabase } from '../db.js';
import puppeteer from 'rebrowser-puppeteer'; // Usando fork anti-detecção

import fs from 'fs';
import path from 'path';
import os from 'os';
import { updateSheetRow } from '../lib/googleSheets.js';

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

function findChrome() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
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

let isProcessing = false;

/**
 * Executa o processamento de convites de guilda pendentes na fila
 */
export async function runProcessAutoInvites() {
  if (isProcessing) {
    console.log('[AutoInvite] Já existe um lote em processamento. Ignorando gatilho simultâneo.');
    return;
  }
  isProcessing = true;

  console.log('[AutoInvite] 🔍 Verificando fila de convites pendentes...');

  try {
    // 0. Sincronizar planilha do Google
    await syncGoogleSheetInvites();

    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    await supabase.from('guild_invites_queue').update({ status: 'PENDING' }).eq('status', 'IN_PROGRESS').lt('updated_at', fiveMinsAgo);

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
    const filteredInvites = pendingInvites.filter(i => (i.world || '').toLowerCase() !== 'malveria');
    if (filteredInvites.length === 0) { console.log('[AutoInvite] Apenas convites de mundos ignorados (Malveria). Pulando.'); isProcessing = false; return; }
    const inviteIds = filteredInvites.map(i => i.id);
    await supabase
      .from('guild_invites_queue')
      .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
      .in('id', inviteIds);

    for (const inv of filteredInvites) {
      await updateSheetIfApplicable(inv, { statusD: 'Processando', workerE: `Worker-${inv.world || 'Auto'}` });
    }

    // 3. Agrupar por Mundo/Servidor
    const invitesByWorld = {};
    for (const invite of filteredInvites) {
      const worldKey = (invite.world || 'Auroria').trim();
      if (!invitesByWorld[worldKey]) invitesByWorld[worldKey] = [];
      invitesByWorld[worldKey].push(invite);
    }

    // 4. Inicializar o browser
    const chromeExe = findChrome();
    
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

      console.log(`[PUPPETEER] Abrindo navegador para ${world}...`);
      const browser = await puppeteer.launch({
        headless: false, // Turnstile é mais permissivo quando não é headless
        executablePath: chromeExe || undefined,
        userDataDir: profilePath,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--window-size=1280,800',
          '--disable-blink-features=AutomationControlled',
          '--exclude-switches=enable-automation'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      });

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // Login no RubinOT
        console.log(`[AutoInvite] 🔑 Efetuando login no RubinOT (${world}) com a conta: ${leaderAcc.account_name}...`);
        const loggedIn = await loginRubinot(page, leaderAcc.account_name, leaderAcc.password);

        if (!loggedIn) {
          const errMsg = `Falha ao realizar login na conta '${leaderAcc.account_name}' no RubinOT.`;
          console.error(`[AutoInvite] ❌ ${errMsg} O sistema tentará novamente no próximo ciclo.`);

          // Em vez de falhar todos, apenas pula este mundo. 
          // Como não atualizamos o Supabase, eles continuarão PENDING e serão tentados novamente em 30s.
          for (const inv of invites) {
            await updateSheetIfApplicable(inv, { statusD: 'Pendente', statusF: 'Site Lento (Aguardando Retentativa)' });
          }
          await browser.close();
          continue; // Pula para o próximo mundo
        }

        // Processar cada convite deste mundo
        for (const invite of invites) {
          let guildTarget = invite.guild_name || leaderAcc.guild_name || process.env.GUILD_NAME || 'Shellpatrocina';
          if (guildTarget.toLowerCase() === 'shell') guildTarget = leaderAcc.guild_name || 'Shellpatrocina';
          console.log(`[AutoInvite] ✉ Enviando convite para '${invite.character_name}' na guilda '${guildTarget}' (${world})...`);

          console.log(`[AutoInvite] Aguardando 1 minuto para não sobrecarregar o site...`);
          await new Promise(r => setTimeout(r, 60000));
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
                                result.reason.includes('Formul') || result.reason.includes('Input de convite') || result.reason.includes('503');

            if (isTempError) {
               // Erro temporário (site engasgou) - Mantém pendente para o próximo ciclo!
               console.log(`[AutoInvite] 🔄 Retentativa agendada para '${invite.character_name}' devido a lentidão do site.`);
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
    isProcessing = false;
  }
}

/**
 * Função de auxílio para Login no RubinOT
 */
async function loginRubinot(page, accountName, password) {
  try {
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => console.error('[AutoInvite] Aviso de timeout no /login, prosseguindo...'));
    await new Promise(r => setTimeout(r, 2000));

    // Usar a mesma lógica de login direto pela API do NextAuth que funcionou perfeitamente nos nossos testes
    await page.evaluate(async (email, pass) => {
      try {
        const csrfRes = await fetch('/api/auth/csrf');
        const csrfData = await csrfRes.json();
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', pass);
        params.append('csrfToken', csrfData.csrfToken);
        params.append('json', 'true');
        await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
      } catch(e) {}
    }, accountName, password);
    
    await new Promise(r => setTimeout(r, 1500));
    
    // Atualiza a página para aplicar a sessão
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

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
       await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/debug_input_missing.png' });
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
        
        if (pageText.includes('nǜo existe') || pageText.includes('does not exist') || pageText.includes('does not live on the same world')) {
              try {
                  const { fetchRubinotApi } = await import('../lib/rubinotScraper.js');
                  const charData = await fetchRubinotApi('/api/characters/' + encodeURIComponent(characterName));
                  if (charData && charData.character && charData.character.world) {
                      return { success: false, reason: `Falha: Personagem está no mundo ${charData.character.world}.` };
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
    await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/debug_timeout.png' });
    return { success: false, reason: 'Cloudflare bloqueou o POST (Turnstile)ção do convite.' };
  } catch (err) {
    return { success: false, reason: `Erro na navegação: ${err.message}` };
  }
}

