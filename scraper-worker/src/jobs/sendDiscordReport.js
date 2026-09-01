import { supabase } from '../db.js';
import axios from 'axios';

export const runSendDiscordReport = async () => {
    try {
        console.log('[JOB] Preparando Relatório Diário para o Discord...');

        const { data: webhook } = await supabase.from('webhook_settings').select('*').eq('id', 1).single();
        if (!webhook || !webhook.discord_url) {
            console.log('[JOB] Nenhum webhook configurado. Pulando...');
            return;
        }

        const ssDate = new Date(Date.now() - 13 * 60 * 60 * 1000);
        const todayStr = ssDate.toISOString().split('T')[0];

        if (webhook.last_sent_date === todayStr) {
            console.log([JOB] Relatório já enviado hoje (). Pulando...);
            return;
        }

        // ===================================
        // 1. Coleta de Dados (Macro)
        // ===================================
        const { data: census } = await supabase.from('view_macro_census').select('*').single();
        const { data: parties } = await supabase.from('parties_planilhadas').select('id');
        
        let report = 📰 **RELATÓRIO DIÁRIO DE GUILDA** 📰\n\n;
        
        report += 📊 **CENSO MACRO:**\n;
        report += - Membros Ativos Hoje: \n;
        report += - Total de PTs Agendadas:  PTs\n\n;

        // ===================================
        // 2. Coleta de Dados (Rushadores)
        // ===================================
        const { data: roster } = await supabase
            .from('view_guild_roster')
            .select('*')
            .order('xp_gained_24h', { ascending: false })
            .limit(50);
            
        if (roster && roster.length > 0) {
            let top50Xp = 0;
            roster.forEach(r => top50Xp += (r.xp_gained_24h || 0));
            
            report += 🔥 **TOP CARREGADORES:**\n;
            report += - Top 50 Membros fizeram: +M XP\n\n;
            
            report += ⭐ **Destaques do Dia (Top 3):**\n;
            roster.slice(0, 3).forEach((r, i) => {
                if (r.xp_gained_24h > 0) {
                    report +=   .  (+M XP)\n;
                }
            });
            report += \n;
        }

        // ===================================
        // 3. Mortes (Muro das Lamentações)
        // ===================================
        const { data: dead } = await supabase
            .from('view_guild_roster')
            .select('*')
            .lt('xp_gained_24h', 0)
            .order('xp_gained_24h', { ascending: true })
            .limit(3);

        if (dead && dead.length > 0) {
            report += 💀 **MURO DAS LAMENTAÇÕES:**\n;
            dead.forEach(d => {
                report += -  perdeu M XP\n;
            });
            report += \n;
        }

        report += ⚔️ *Bom jogo a todos! Organizem suas PTs e não deixem os respawns vazios!*;

        // ===================================
        // Disparo para o Webhook
        // ===================================
        await axios.post(webhook.discord_url, {
            content: report
        });

        // Registrar como enviado
        await supabase.from('webhook_settings').update({ last_sent_date: todayStr }).eq('id', 1);

        console.log('[JOB] Relatório do Discord disparado com sucesso!');
    } catch (e) {
        console.error('[JOB] Falha ao enviar Discord Report:', e.message);
    }
};