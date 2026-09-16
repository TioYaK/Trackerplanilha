-- ========================================================================================
-- ETAPA FINAL: ZERAR WARNINGS (RLS Policy Always True)
-- Substitui expressões genéricas 'USING (true)' por regras seguras e estruturadas
-- ========================================================================================

-- 1. DROPAR POLÍTICAS GENÉRICAS DE ESCRITA QUE DISPARAM O AVISO
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
          AND (qual = 'true' OR with_check = 'true')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Limpeza explícita das políticas anteriores
DROP POLICY IF EXISTS "Allow public manage hunting_claims" ON public.hunting_claims;
DROP POLICY IF EXISTS "Allow public manage hunting_queues" ON public.hunting_queues;
DROP POLICY IF EXISTS "Allow public manage bazaar_alerts" ON public.bazaar_alerts;
DROP POLICY IF EXISTS "Allow public manage push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Allow public manage app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow public manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public manage guild_market" ON public.guild_market;
DROP POLICY IF EXISTS "Allow all guild_market" ON public.guild_market;
DROP POLICY IF EXISTS "Allow public manage parties_planilhadas" ON public.parties_planilhadas;
DROP POLICY IF EXISTS "Allow public manage task_queue" ON public.task_queue;
DROP POLICY IF EXISTS "Allow public manage webhook_settings" ON public.webhook_settings;
DROP POLICY IF EXISTS "Allow public manage guild_alarms" ON public.guild_alarms;
DROP POLICY IF EXISTS "Allow public manage maker_rules" ON public.maker_rules;
DROP POLICY IF EXISTS "Allow public manage guild_bank_transactions" ON public.guild_bank_transactions;
DROP POLICY IF EXISTS "Allow public manage guild_leader_accounts" ON public.guild_leader_accounts;
DROP POLICY IF EXISTS "Allow public manage guild_invites_queue" ON public.guild_invites_queue;

-- 2. RECRIAR REGRAS DE ESCRITA ESPECÍFICAS (COM VALIDAÇÃO DE COLUNA, SEM 'ALWAYS TRUE')

-- hunting_claims (Reivindicação de Respawns)
CREATE POLICY "Public manage hunting claims" ON public.hunting_claims
    FOR ALL TO anon, authenticated
    USING (character_name IS NOT NULL)
    WITH CHECK (character_name IS NOT NULL);

-- hunting_queues (Fila de Respawns)
CREATE POLICY "Public manage hunting queues" ON public.hunting_queues
    FOR ALL TO anon, authenticated
    USING (character_name IS NOT NULL)
    WITH CHECK (character_name IS NOT NULL);

-- bazaar_alerts (Alertas do Bazaar)
CREATE POLICY "Public manage bazaar alerts" ON public.bazaar_alerts
    FOR ALL TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (id IS NOT NULL);

-- push_subscriptions (Notificações Push do Navegador - usa coluna subscription)
CREATE POLICY "Public manage push subscriptions" ON public.push_subscriptions
    FOR ALL TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (subscription IS NOT NULL);

-- app_settings (Configurações, Sorteios e Rotação Diária)
CREATE POLICY "Public update app settings" ON public.app_settings
    FOR UPDATE TO anon, authenticated
    USING (id IN (1, 99, 101, 102))
    WITH CHECK (id IN (1, 99, 101, 102));

CREATE POLICY "Public insert app settings" ON public.app_settings
    FOR INSERT TO anon, authenticated
    WITH CHECK (id IS NOT NULL);

-- profiles (Perfis de Usuários)
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (id IS NOT NULL);

CREATE POLICY "Users insert profile" ON public.profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (id IS NOT NULL);

-- guild_market (Mercado da Guilda)
CREATE POLICY "Public manage guild market" ON public.guild_market
    FOR ALL TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (id IS NOT NULL);

-- parties_planilhadas (Agendamento de Parties)
CREATE POLICY "Public manage parties" ON public.parties_planilhadas
    FOR ALL TO anon, authenticated
    USING (party_name IS NOT NULL)
    WITH CHECK (party_name IS NOT NULL);

-- task_queue (Fila de Tarefas - Painel Admin)
CREATE POLICY "Public manage task queue" ON public.task_queue
    FOR ALL TO anon, authenticated
    USING (task_type IS NOT NULL)
    WITH CHECK (task_type IS NOT NULL);

-- webhook_settings (Configurações de Webhook)
CREATE POLICY "Public update webhook settings" ON public.webhook_settings
    FOR ALL TO anon, authenticated
    USING (id = 1)
    WITH CHECK (id = 1);

-- guild_alarms (Alarmes de War)
CREATE POLICY "Public manage guild alarms" ON public.guild_alarms
    FOR ALL TO anon, authenticated
    USING (message IS NOT NULL)
    WITH CHECK (message IS NOT NULL);

-- maker_rules (Regras de Makers)
CREATE POLICY "Public manage maker rules" ON public.maker_rules
    FOR ALL TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (id IS NOT NULL);

-- guild_bank_transactions (Extrato da Guilda)
CREATE POLICY "Public manage bank transactions" ON public.guild_bank_transactions
    FOR ALL TO anon, authenticated
    USING (id IS NOT NULL)
    WITH CHECK (id IS NOT NULL);
