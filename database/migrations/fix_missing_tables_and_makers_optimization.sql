-- ========================================================================================
-- RESOLUCAO DEFINITIVA: CRIACAO DE TABELAS AUSENTES E OTIMIZACAO DE RPC FIND_MAKERS
-- Execute no SQL Editor do Supabase para suporte completo a Telemetria e Party Finder
-- ========================================================================================

-- 1. TABELA DE TELEMETRIA E ACESSOS (site_access_logs)
CREATE TABLE IF NOT EXISTS public.site_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name TEXT NOT NULL,
    path TEXT,
    world TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT DEFAULT 'guest',
    is_premium BOOLEAN DEFAULT false,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_access_logs_view ON public.site_access_logs(view_name);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_created_at ON public.site_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_role ON public.site_access_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_premium ON public.site_access_logs(is_premium);

ALTER TABLE public.site_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on site_access_logs" ON public.site_access_logs;
CREATE POLICY "Allow public insert on site_access_logs" 
    ON public.site_access_logs FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read on site_access_logs" ON public.site_access_logs;
CREATE POLICY "Allow admin read on site_access_logs" 
    ON public.site_access_logs FOR SELECT 
    USING (true);


-- 2. TABELA DO PARTY FINDER (party_finder_posts)
CREATE TABLE IF NOT EXISTS public.party_finder_posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    leader_name TEXT NOT NULL,
    world TEXT NOT NULL DEFAULT 'Auroria',
    vocation_needed TEXT NOT NULL,
    min_level INTEGER NOT NULL DEFAULT 100,
    target_respawn TEXT NOT NULL,
    schedule TEXT DEFAULT 'Agora / Hoje',
    description TEXT,
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_party_finder_world ON public.party_finder_posts(world);
CREATE INDEX IF NOT EXISTS idx_party_finder_created_at ON public.party_finder_posts(created_at DESC);

ALTER TABLE public.party_finder_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on party_finder_posts" ON public.party_finder_posts;
CREATE POLICY "Allow public read on party_finder_posts" 
    ON public.party_finder_posts FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow public insert on party_finder_posts" ON public.party_finder_posts;
CREATE POLICY "Allow public insert on party_finder_posts" 
    ON public.party_finder_posts FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on party_finder_posts" ON public.party_finder_posts;
CREATE POLICY "Allow public delete on party_finder_posts" 
    ON public.party_finder_posts FOR DELETE 
    USING (true);


-- 3. OTIMIZACAO DA FUNCAO FIND_MAKERS (Evita timeout de 57014 limitando aos ultimos 14 dias)
CREATE OR REPLACE FUNCTION public.find_makers(p_character_name TEXT)
RETURNS TABLE (candidate_name TEXT, matches BIGINT, last_match TIMESTAMP WITH TIME ZONE) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le2.character_name AS candidate_name,
        COUNT(*) AS matches,
        MAX(le2.event_time) AS last_match
    FROM public.login_events le1
    JOIN public.login_events le2 
      ON le1.character_name != le2.character_name 
      AND le1.event_type != le2.event_type
      AND le2.event_time BETWEEN le1.event_time - INTERVAL '3 minutes' AND le1.event_time + INTERVAL '3 minutes'
    WHERE le1.character_name = p_character_name
      AND le1.event_time >= (NOW() - INTERVAL '14 days')
      AND le2.event_time >= (NOW() - INTERVAL '14 days')
    GROUP BY le2.character_name
    HAVING COUNT(*) > 1
    ORDER BY matches DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.find_makers(TEXT) TO anon, authenticated, service_role;
