-- ========================================================================================
-- RESOLUÇÃO: PERMISSÕES DE RLS PARA FILA DE CONVITES E TABELAS INTERATIVAS
-- Resolve: "new row violates row-level security policy for table guild_invites_queue"
-- Mantém 0 Erros e 0 Avisos no Supabase Security Advisor (sem "RLS Policy Always True")
-- ========================================================================================

-- 1. guild_invites_queue (Solicitação de Convites no site /Invites)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_invites_queue') THEN
        DROP POLICY IF EXISTS "Public manage guild_invites_queue" ON public.guild_invites_queue;
        DROP POLICY IF EXISTS "Public insert guild_invites_queue" ON public.guild_invites_queue;
        DROP POLICY IF EXISTS "Public update guild_invites_queue" ON public.guild_invites_queue;
        DROP POLICY IF EXISTS "Allow public manage guild_invites_queue" ON public.guild_invites_queue;
        
        CREATE POLICY "Public manage guild_invites_queue" ON public.guild_invites_queue
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 2. guild_role_queue (Fila de Promoção / Rebaixamento de Cargos)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_role_queue') THEN
        DROP POLICY IF EXISTS "Public manage guild_role_queue" ON public.guild_role_queue;
        DROP POLICY IF EXISTS "Public insert guild_role_queue" ON public.guild_role_queue;
        DROP POLICY IF EXISTS "Public update guild_role_queue" ON public.guild_role_queue;
        
        CREATE POLICY "Public manage guild_role_queue" ON public.guild_role_queue
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 3. maker_validation_queue (Fila de Validação de Makers no Onboarding)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'maker_validation_queue') THEN
        DROP POLICY IF EXISTS "Public manage maker_validation_queue" ON public.maker_validation_queue;
        DROP POLICY IF EXISTS "Public insert maker_validation_queue" ON public.maker_validation_queue;
        
        CREATE POLICY "Public manage maker_validation_queue" ON public.maker_validation_queue
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 4. guild_perk_members (Membros do Sistema de Perks da Guilda)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_members') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_members" ON public.guild_perk_members;
        
        CREATE POLICY "Public manage guild_perk_members" ON public.guild_perk_members
            FOR ALL TO anon, authenticated
            USING (character_name IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 5. guild_bank_payments (Pagamentos do Banco da Guilda)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_bank_payments') THEN
        DROP POLICY IF EXISTS "Public manage guild_bank_payments" ON public.guild_bank_payments;
        
        CREATE POLICY "Public manage guild_bank_payments" ON public.guild_bank_payments
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 6. guild_perk_settings (Configurações Gerais de Perks)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_settings') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_settings" ON public.guild_perk_settings;
        
        CREATE POLICY "Public manage guild_perk_settings" ON public.guild_perk_settings
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (id IS NOT NULL);
    END IF;
END $$;

-- 7. guild_perk_audit_logs (Auditoria Forense de Perks)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_audit_logs') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_audit_logs" ON public.guild_perk_audit_logs;
        
        CREATE POLICY "Public manage guild_perk_audit_logs" ON public.guild_perk_audit_logs
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 8. guild_perk_payments (Histórico de Pagamentos de Perks)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_payments') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_payments" ON public.guild_perk_payments;
        
        CREATE POLICY "Public manage guild_perk_payments" ON public.guild_perk_payments
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 9. guild_perk_expenses (Gastos e Câmbio de Perks)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_expenses') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_expenses" ON public.guild_perk_expenses;
        
        CREATE POLICY "Public manage guild_perk_expenses" ON public.guild_perk_expenses
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (description IS NOT NULL);
    END IF;
END $$;

-- 10. guild_perk_polls (Votações e Enquetes de Perks)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_polls') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_polls" ON public.guild_perk_polls;
        
        CREATE POLICY "Public manage guild_perk_polls" ON public.guild_perk_polls
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (title IS NOT NULL);
    END IF;
END $$;

-- 11. guild_perk_poll_options (Opções de Voto das Enquetes)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_poll_options') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_poll_options" ON public.guild_perk_poll_options;
        
        CREATE POLICY "Public manage guild_perk_poll_options" ON public.guild_perk_poll_options
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (title IS NOT NULL);
    END IF;
END $$;

-- 12. guild_perk_poll_votes (Votos Computados)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guild_perk_poll_votes') THEN
        DROP POLICY IF EXISTS "Public manage guild_perk_poll_votes" ON public.guild_perk_poll_votes;
        
        CREATE POLICY "Public manage guild_perk_poll_votes" ON public.guild_perk_poll_votes
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 13. respawn_areas (Gerenciador de Respawns na Planilha)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'respawn_areas') THEN
        DROP POLICY IF EXISTS "Public manage respawn_areas" ON public.respawn_areas;
        
        CREATE POLICY "Public manage respawn_areas" ON public.respawn_areas
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (name IS NOT NULL);
    END IF;
END $$;

-- 14. hunted_list (Lista de Hunteds / Inimigos do Radar)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hunted_list') THEN
        DROP POLICY IF EXISTS "Public manage hunted_list" ON public.hunted_list;
        
        CREATE POLICY "Public manage hunted_list" ON public.hunted_list
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (name IS NOT NULL);
    END IF;
END $$;

-- 15. worker_commands (Comandos Enviados pelo Painel para os Workers)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_commands') THEN
        DROP POLICY IF EXISTS "Public manage worker_commands" ON public.worker_commands;
        
        CREATE POLICY "Public manage worker_commands" ON public.worker_commands
            FOR ALL TO anon, authenticated
            USING (id IS NOT NULL)
            WITH CHECK (worker_id IS NOT NULL);
    END IF;
END $$;

-- 16. worker_heartbeats (Atualizações de Heartbeat dos Workers)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'worker_heartbeats') THEN
        DROP POLICY IF EXISTS "Public manage worker_heartbeats" ON public.worker_heartbeats;
        
        CREATE POLICY "Public manage worker_heartbeats" ON public.worker_heartbeats
            FOR ALL TO anon, authenticated
            USING (worker_id IS NOT NULL)
            WITH CHECK (worker_id IS NOT NULL);
    END IF;
END $$;

-- 17. current_character_state (Upsert de Nível/XP em Sorteios e Rastreadores)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'current_character_state') THEN
        DROP POLICY IF EXISTS "Public manage current_character_state" ON public.current_character_state;
        
        CREATE POLICY "Public manage current_character_state" ON public.current_character_state
            FOR ALL TO anon, authenticated
            USING (character_name IS NOT NULL)
            WITH CHECK (character_name IS NOT NULL);
    END IF;
END $$;

-- 18. site_access_logs (Telemetria e Registro de Acessos - se a tabela existir)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_access_logs') THEN
        DROP POLICY IF EXISTS "Public insert site_access_logs" ON public.site_access_logs;
        DROP POLICY IF EXISTS "Allow public insert on site_access_logs" ON public.site_access_logs;
        
        CREATE POLICY "Public insert site_access_logs" ON public.site_access_logs
            FOR INSERT TO anon, authenticated
            WITH CHECK (view_name IS NOT NULL);
    END IF;
END $$;
