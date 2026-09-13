import { supabase } from '../db.js';

export const runAuditBank = async () => {
    try {
        console.log('[JOB] 💰 Iniciando auditoria do Guild Bank (Dia 16)...');

        const now = new Date();
        const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        
        // Verifica se hoje é dia 16
        if (brazilTime.getDate() !== 16) {
            return;
        }

        // Verifica se a auditoria já rodou neste mês para não duplicar strikes
        const monthKey = `${brazilTime.getFullYear()}-${brazilTime.getMonth() + 1}`;
        
        const { data: config } = await supabase.from('webhook_settings').select('last_bank_audit').eq('id', 1).maybeSingle();
        if (config?.last_bank_audit === monthKey) {
            return;
        }

        console.log('[JOB] 🚨 Auditando inadimplentes do Guild Bank...');

        // 1. Pega todos os membros com status "Pendente"
        const { data: pendentes, error: bankErr } = await supabase
            .from('guild_members')
            .select('name')
            .eq('bank_status', 'Pendente');

        if (bankErr) throw bankErr;

        if (pendentes && pendentes.length > 0) {
            console.log(`[JOB] ℹ️ ${pendentes.length} membros pendentes no Guild Bank.`);
        }

        // 3. Marca que a auditoria do mês já foi feita
        // Reutilizando a tabela webhook_settings (ou app_settings se preferir)
        await supabase.from('webhook_settings').update({ last_bank_audit: monthKey }).eq('id', 1);

        console.log('[JOB] ✅ Auditoria do Guild Bank finalizada.');
    } catch (e) {
        console.error('[JOB] Erro na auditoria do Guild Bank:', e.message);
    }
};
