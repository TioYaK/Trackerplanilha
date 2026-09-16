-- ========================================================================================
-- ZERAR ÚLTIMOS AVISOS DO SUPABASE SECURITY ADVISOR
-- 1. DROP da função anterior (necessário para mudar tipo/assinatura)
-- 2. Recria get_db_size() retornando bigint e com SECURITY INVOKER
--    (Mantém compatibilidade com o AdminDashboard e elimina os 2 avisos)
-- ========================================================================================

DROP FUNCTION IF EXISTS public.get_db_size();

CREATE OR REPLACE FUNCTION public.get_db_size()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT pg_database_size(current_database());
$$;

GRANT EXECUTE ON FUNCTION public.get_db_size() TO anon, authenticated, service_role;
