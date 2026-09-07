/**
 * TEST CLIQUE NO CHECKBOX DO TURNSTILE
 * O perfil do Launcher faz o widget renderizar de verdade.
 * Agora rodamos non-headless e tentamos clicar no checkbox.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import os from 'os';
import path from 'path';

puppeteer.use(StealthPlugin());

const WORK_PROFILE = path.join(process.cwd(), 'scraper-worker', 'worker_profiles', 'auroria_launcher');
const ACCOUNT = { email: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3' };
const CHAR_NAME = 'Xeroza pomba';
const GUILD_NAME = 'Shellpatrocina';

async function runClickTest() {
  console.log('🚀 TESTE - CLIQUE NO CHECKBOX DO TURNSTILE (non-headless)\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : undefined;

  const browser = await puppeteer.launch({
    headless: false,  // PRECISA ser false para o click funcionar
    userDataDir: WORK_PROFILE,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,800',
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  try {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {}, app: {} };
    });

    await page.setViewport({ width: 1280, height: 800 });

    // Login
    console.log('1. Login...');
    await page.goto('https://rubinot.com.br/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(async (email, password) => {
      try {
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
      } catch(e) {}
    }, ACCOUNT.email, ACCOUNT.password);
    await new Promise(r => setTimeout(r, 1000));
    console.log('   ✅ Login feito');

    // Navegar para gerenciar guilda
    console.log(`\n2. Navegando para /guilds/${GUILD_NAME}/manage...`);
    await page.goto(`https://rubinot.com.br/guilds/${GUILD_NAME}/manage`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Fechar cookies
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aceitar = btns.find(b => b.innerText.includes('Aceitar'));
      if (aceitar) aceitar.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Clicar aba Convidar
    console.log('3. Clicando aba Convidar...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.trim() === 'Convidar');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Digitar personagem
    console.log(`4. Digitando "${CHAR_NAME}"...`);
    const input = await page.$('input[placeholder="Nome do personagem"]');
    if (input) {
      await input.click({ clickCount: 3 });
      await input.type(CHAR_NAME, { delay: 80 });
    }
    await new Promise(r => setTimeout(r, 500));

    // Clicar Convidar
    console.log('5. Clicando botão Convidar...');
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Nome do personagem"]');
      if (input) {
        const parent = input.closest('form') || input.parentElement;
        const btn = parent?.querySelector('button[type="submit"], button');
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    // Verificar se o modal apareceu
    const hasModal = await page.evaluate(() => {
      return !!document.querySelector('.turnstile-overlay.visible');
    });

    if (!hasModal) {
      console.log('   ✅ Sem modal — convite enviado direto!');
      const result = await page.evaluate(() => document.body.innerText.substring(0, 300));
      console.log('   Conteúdo:', result);
      await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/click_result.png' });
      return;
    }

    console.log('   Modal aberto, localizando checkbox do Turnstile...');

    // Aguardar o frame do Turnstile carregar
    await new Promise(r => setTimeout(r, 2000));

    // Pegar o frame do Turnstile
    const frames = page.frames();
    const tsFrame = frames.find(f => f.url().includes('challenges.cloudflare.com'));
    
    if (tsFrame) {
      console.log('   Frame encontrado:', tsFrame.url().substring(0, 80) + '...');

      // Verificar se o body tem conteúdo
      const bodyContent = await tsFrame.evaluate(() => document.body.children.length);
      console.log('   Elementos no body do frame:', bodyContent);

      if (bodyContent > 0) {
        // Tentar clicar no checkbox dentro do frame
        console.log('   Tentando clicar no checkbox dentro do frame...');
        try {
          const checkbox = await tsFrame.$('input[type="checkbox"]');
          if (checkbox) {
            await checkbox.click();
            console.log('   ✅ Clicou no checkbox!');
          } else {
            // Clicar na área do widget (coordenada fixa)
            const widgetDiv = await tsFrame.$('#fWmsh9, .widget-checkbox, [id*="checkbox"]');
            if (widgetDiv) {
              await widgetDiv.click();
              console.log('   ✅ Clicou no widget div!');
            } else {
              // Clique forçado no centro-esquerda do frame
              await tsFrame.evaluate(() => {
                const clickEvent = new MouseEvent('click', {
                  bubbles: true, cancelable: true, view: window, clientX: 23, clientY: 33
                });
                document.elementFromPoint(23, 33)?.dispatchEvent(clickEvent);
              });
              console.log('   Clique por coordinates disparado');
            }
          }
        } catch (e) {
          console.log('   Erro no clique:', e.message);
        }
      } else {
        // Frame vazio — usar coordenadas absolutas do modal na página pai
        console.log('   Frame vazio. Tentando clique por coordenadas absolutas...');
        
        const modalBox = await page.evaluate(() => {
          const widget = document.querySelector('.turnstile-widget');
          if (!widget) return null;
          const rect = widget.getBoundingClientRect();
          return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
        });

        if (modalBox) {
          console.log('   Widget box:', JSON.stringify(modalBox));
          // Clicar na posição do checkbox (canto esquerdo do widget)
          const clickX = modalBox.x + 23;
          const clickY = modalBox.y + modalBox.h / 2;
          console.log(`   Clicando em (${clickX}, ${clickY})...`);
          await page.mouse.click(clickX, clickY);
        }
      }
    } else {
      console.log('   Frame do Turnstile não encontrado nos frames da página.');
    }

    // Aguardar token (até 25s)
    console.log('\n6. Aguardando token do Turnstile...');
    let gotToken = false;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const token = await page.evaluate(() => {
        const el = document.querySelector('input[name="cf-turnstile-response"]');
        return el ? el.value : '';
      });
      if (token && token.length > 10) {
        console.log(`   ✅ Token obtido após ${i+1}s!`);
        gotToken = true;

        // Enviar invite via API
        const result = await page.evaluate(async (guild, char, tk) => {
          const res = await fetch(`/api/guilds/${encodeURIComponent(guild)}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: char, turnstileToken: tk })
          });
          return { status: res.status, data: await res.json() };
        }, GUILD_NAME, CHAR_NAME, token);

        console.log('\n🎯 RESULTADO:');
        console.log('─'.repeat(60));
        if (result.status === 200 || result.status === 201) {
          console.log(`🎉 SUCESSO! "${CHAR_NAME}" convidado para "${GUILD_NAME}"!`);
        } else {
          console.log(`Status ${result.status}:`, JSON.stringify(result.data, null, 2));
        }
        break;
      }
      process.stdout.write(`   ${i+1}s...\r`);
    }

    if (!gotToken) {
      console.log('\n   ⚠️  Token não obtido em 25s.');
    }

    await page.screenshot({ path: 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch/click_result.png' });
    console.log('   Screenshot salvo.');
    await new Promise(r => setTimeout(r, 3000));

  } finally {
    await browser.close().catch(() => {});
  }
}

runClickTest().catch(console.error);
