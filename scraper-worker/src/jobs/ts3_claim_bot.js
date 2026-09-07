import { Teamspeak } from 'ts3-nodejs-library';
import { supabase } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const TS3_HOST = process.env.TS3_HOST || '127.0.0.1';
const TS3_QUERY_PORT = process.env.TS3_API_PORT || 10011;
const TS3_SERVER_PORT = process.env.TS3_SERVER_PORT || 9987;
const TS3_USER = process.env.TS3_QUERY_USER || 'serveradmin';
const TS3_PASS = process.env.TS3_QUERY_PASS || '';

async function startTS3Bot() {
    if (!TS3_PASS) {
        console.log('[TS3 BOT] Aguardando configuração de TS3_QUERY_PASS no .env.');
        return;
    }

    try {
        const teamspeak = await Teamspeak.connect({
            host: TS3_HOST,
            queryport: TS3_QUERY_PORT,
            serverport: TS3_SERVER_PORT,
            username: TS3_USER,
            password: TS3_PASS,
            nickname: 'Claim Bot'
        });

        console.log('[TS3 BOT] Conectado com sucesso ao TeamSpeak 3!');

        // Registra para receber eventos de texto no servidor
        await teamspeak.registerEvent('textserver');
        await teamspeak.registerEvent('textchannel');
        await teamspeak.registerEvent('textprivate');

        teamspeak.on('textmessage', async ev => {
            const msg = ev.msg.toLowerCase().trim();
            const sender = ev.invoker.nickname;

            // Ignora prñprias mensagens
            if (sender === 'Claim Bot') return;

            if (msg.startsWith('!claim ')) {
                const respawnId = msg.split(' ')[1]?.toUpperCase();
                if (!respawnId) return;
                console.log(`[server] ${sender} tentou claimar ${respawnId}`);
                // TODO: Logica de inserts no Supabase aqui
                ev.invoker.message(`Você tentou claimar ${respawnId}! A série de testes está funcionando.`);
            }
        });

        teamspeak.on('close', () => {
            console.log('[TS3 BOT] Conexão fechada, tentando reconectar...');
        });

        teamspeak.on('error', err => {
            console.error('[TS3 BOT ERROR]', err.message);
        });
    } catch (err) {
        console.error('[TS3 BOT FATAL]', err.message);
    }
}

startTS3Bot();
