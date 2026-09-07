/**
 * TEST com rebrowser-puppeteer
 * Este fork do Puppeteer esconde as chamadas CDP que o Cloudflare detecta.
 * Isso deve fazer o iframe do Turnstile renderizar o checkbox corretamente.
 */

import puppeteer from 'rebrowser-puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';

const WORK_PROFILE = path.join(process.cwd(), 'scraper-worker', 'worker_profiles', 'auroria_launcher');
const ACCOUNT = { email: 'pifot16+maker781272@gmail.com', password: 'Liususu!28@3' };
const CHAR_NAME = 'Xeroza pomba';
const GUILD_NAME = 'Shellpatrocina';
const SCREENSHOT_DIR = 'C:/Users/YaKe/.gemini/antigravity/brain/4e6b1053-e550-48e6-b21f-3295a1f5ee45/scratch';

async function run() {
  console.log('🚀 TEST rebrowser-puppeteer - Turnstile sem detecção CDP\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(edgePath) ? edgePath : undefined;
  console.log('Browser:', executablePath || 'Padrão');
  console.log('Perfil:', WORK_PROFILE);

  const browser = await puppeteer.launch({
    headless: false,
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
    await page.setViewport({ width: 1280, height: 800 });

    // Login
    console.log('\n1. Login...');
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

    // Navegar para guild manage
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
    await new Promise(r => setTimeout(r, 2500));

    // Verificar modal
    const hasModal = await page.evaluate(() => !!document.querySelector('.turnstile-overlay.visible'));
    if (!hasModal) {
      console.log('   ✅ Sem modal — convite direto!');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/rebrowser_result.png` });
      return;
    }

    console.log('\n6. Modal aberto. Verificando frame do Turnstile...');
    await new Promise(r => setTimeout(r, 2000));

    const frames = page.frames();
    const tsFrame = frames.find(f => f.url().includes('challenges.cloudflare.com'));

    if (tsFrame) {
      console.log('   Frame URL:', tsFrame.url().substring(0, 90) + '...');

      const bodyChildCount = await tsFrame.evaluate(() => document.body.children.length).catch(() => -1);
      console.log('   Elementos no body:', bodyChildCount);

      if (bodyChildCount > 0) {
        console.log('   ✅ FRAME CARREGOU! Tentando clicar no checkbox...');

        // Fazer screenshot do frame interno
        const checkbox = await tsFrame.$('input[type="checkbox"]');
        if (checkbox) {
          await checkbox.click();
          console.log('   ✅ Clicou no checkbox!');
        } else {
          // Tentar clicar no widget
          await tsFrame.evaluate(() => {
            const el = document.querySelector('#fWmsh9') ||
                       document.querySelector('[class*="widget"]') ||
                       document.querySelector('[class*="checkbox"]') ||
                       document.querySelector('.pgnB1');
            if (el) el.click();
            else {
              // Simular clique na posição do checkbox (aprox 23, 33)
              const e = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 23, clientY: 33 });
              document.elementFromPoint(23, 33)?.dispatchEvent(e);
            }
          });
          console.log('   Clique disparado no frame!');
        }
      } else {
        console.log('   ❌ Frame ainda vazio. rebrowser não foi suficiente.');
        // Tentar clique por coordenadas na página pai
        const box = await page.evaluate(() => {
          const w = document.querySelector('.turnstile-widget');
          if (!w) return null;
          const r = w.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
        if (box) {
          console.log('   Clicando nas coordenadas do widget:', JSON.stringify(box));
          await page.mouse.move(box.x + 23, box.y + 35, { steps: 10 });
          await new Promise(r => setTimeout(r, 300));
          await page.mouse.click(box.x + 23, box.y + 35);
        }
      }
    } else {
      console.log('   Frame não encontrado!');
    }

    // Aguardar token
    console.log('\n7. Aguardando token...');
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const token = await page.evaluate(() => {
        const el = document.querySelector('input[name="cf-turnstile-response"]');
        return el ? el.value : '';
      });
      if (token && token.length > 10) {
        console.log(`\n   ✅ TOKEN OBTIDO após ${i+1}s!`);
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
          console.log(`🎉 SUCESSO! "${CHAR_NAME}" convidado!`);
        } else {
          console.log(`Status ${result.status}:`, JSON.stringify(result.data, null, 2));
        }
        break;
      }
      process.stdout.write(`   ${i+1}s...\r`);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/rebrowser_result.png` });
    console.log('\nScreenshot salvo: rebrowser_result.png');
    await new Promise(r => setTimeout(r, 3000));

  } finally {
    await browser.close().catch(() => {});
  }
}

run().catch(console.error);
