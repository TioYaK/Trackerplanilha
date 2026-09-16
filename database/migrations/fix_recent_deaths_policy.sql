-- ========================================================================================
-- ZERAR O ÚLTIMO AVISO: RLS Enabled No Policy em recent_deaths
-- Permite que o LiveWarFeed e o monitor de frags leiam as mortes recentes
-- ========================================================================================

CREATE POLICY "Allow public read recent_deaths"
ON public.recent_deaths
FOR SELECT
TO anon, authenticated
USING (true);

-- Garante que nenhuma outra tabela com RLS fique sem política de leitura
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND rowsecurity = true
          AND NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename
          )
    ) LOOP
        EXECUTE format(
            'CREATE POLICY "Allow public read access" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
            r.tablename
        );
    END LOOP;
END $$;
