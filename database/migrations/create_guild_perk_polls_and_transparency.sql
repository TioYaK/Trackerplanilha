-- ========================================================================================
-- SISTEMA DE PERKS DA GUILDA: TRANSPARÊNCIA FINANCEIRA & VOTAÇÕES DE UPGRADES
-- ========================================================================================

-- 1. Tabela de Gastos / Investimentos em Upgrades de Perks
CREATE TABLE IF NOT EXISTS public.guild_perk_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RC',
    spent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registered_by TEXT NOT NULL DEFAULT 'ADMIN',
    proof_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Votações / Enquetes de Perks da Guilda
CREATE TABLE IF NOT EXISTS public.guild_perk_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    created_by TEXT NOT NULL DEFAULT 'ADMIN',
    expires_at TIMESTAMP WITH TIME ZONE,
    winner_option_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Opções de Cada Votação
CREATE TABLE IF NOT EXISTS public.guild_perk_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.guild_perk_polls(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    votes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Registro de Votos (1 voto por personagem por enquete)
CREATE TABLE IF NOT EXISTS public.guild_perk_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.guild_perk_polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.guild_perk_poll_options(id) ON DELETE CASCADE,
    character_name TEXT NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_vote_per_char_poll UNIQUE (poll_id, character_name)
);

CREATE INDEX IF NOT EXISTS idx_perk_poll_options_poll ON public.guild_perk_poll_options (poll_id);
CREATE INDEX IF NOT EXISTS idx_perk_poll_votes_poll ON public.guild_perk_poll_votes (poll_id);

-- Desativação de RLS para acesso suave
ALTER TABLE public.guild_perk_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_polls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_poll_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_poll_votes DISABLE ROW LEVEL SECURITY;
