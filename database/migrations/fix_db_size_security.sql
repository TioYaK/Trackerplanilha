-- ========================================================================================
-- ZERAR ÚLTIMOS AVISOS DO SUPABASE SECURITY ADVISOR
-- 1. Converte get_db_size() de SECURITY DEFINER para SECURITY INVOKER
--    (pg_database_size funciona perfeitamente com INVOKER e elimina os 2 avisos)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.get_db_size()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
    SELECT pg_size_pretty(pg_database_size(current_database()));
$$;

GRANT EXECUTE ON FUNCTION public.get_db_size() TO anon, authenticated, service_role;
