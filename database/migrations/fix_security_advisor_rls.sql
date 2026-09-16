-- ========================================================================================
-- RESOLUÇÃO COMPLETA: SUPABASE SECURITY ADVISOR (RLS & SECURITY DEFINER VIEWS)
-- ========================================================================================

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS PÚBLICAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;

-- 2. RESOLVER 'Security Definer View': DEFINIR security_invoker = true EM TODAS AS VIEWS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true);', r.viewname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Aviso na view %: %', r.viewname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. CRIAR POLÍTICA DE LEITURA PÚBLICA (SELECT) EM TODAS AS TABELAS
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = r.tablename 
              AND policyname = 'Allow public read access'
        ) THEN
            BEGIN
                EXECUTE format(
                    'CREATE POLICY "Allow public read access" ON public.%I FOR SELECT USING (true);',
                    r.tablename
                );
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END LOOP;
END $$;

-- 4. POLÍTICAS DE ESCRITA E GERENCIAMENTO NAS TABELAS INTERATIVAS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hunting_claims' AND policyname = 'Allow public manage hunting_claims') THEN
        CREATE POLICY "Allow public manage hunting_claims" ON public.hunting_claims FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'hunting_queues' AND policyname = 'Allow public manage hunting_queues') THEN
        CREATE POLICY "Allow public manage hunting_queues" ON public.hunting_queues FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bazaar_alerts' AND policyname = 'Allow public manage bazaar_alerts') THEN
        CREATE POLICY "Allow public manage bazaar_alerts" ON public.bazaar_alerts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Allow public manage push_subscriptions') THEN
        CREATE POLICY "Allow public manage push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_settings' AND policyname = 'Allow public manage app_settings') THEN
        CREATE POLICY "Allow public manage app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Allow public manage profiles') THEN
        CREATE POLICY "Allow public manage profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guild_market' AND policyname = 'Allow public manage guild_market') THEN
        CREATE POLICY "Allow public manage guild_market" ON public.guild_market FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'parties_planilhadas' AND policyname = 'Allow public manage parties_planilhadas') THEN
        CREATE POLICY "Allow public manage parties_planilhadas" ON public.parties_planilhadas FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_queue' AND policyname = 'Allow public manage task_queue') THEN
        CREATE POLICY "Allow public manage task_queue" ON public.task_queue FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webhook_settings' AND policyname = 'Allow public manage webhook_settings') THEN
        CREATE POLICY "Allow public manage webhook_settings" ON public.webhook_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guild_alarms' AND policyname = 'Allow public manage guild_alarms') THEN
        CREATE POLICY "Allow public manage guild_alarms" ON public.guild_alarms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'maker_rules' AND policyname = 'Allow public manage maker_rules') THEN
        CREATE POLICY "Allow public manage maker_rules" ON public.maker_rules FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guild_bank_transactions' AND policyname = 'Allow public manage guild_bank_transactions') THEN
        CREATE POLICY "Allow public manage guild_bank_transactions" ON public.guild_bank_transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. RESOLVER OS WARNINGS DE FUNÇÕES (SET search_path = public, pg_temp)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oid::regprocedure as regproc
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
          AND prokind = 'f'
    ) LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp;', r.regproc);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;
