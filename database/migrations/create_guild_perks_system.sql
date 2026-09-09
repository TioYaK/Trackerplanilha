-- ========================================================================================
-- SISTEMA DE GESTÃO DE PERKS DA GUILDA (RUBINOT)
-- Tabelas: Configurações, Participantes, Pagamentos, Fila de Cargos e Auditoria
-- ========================================================================================

-- 1. Tabela de Configurações Gerais do Sistema de Perks
CREATE TABLE IF NOT EXISTS public.guild_perk_settings (
    id INT PRIMARY KEY DEFAULT 1,
    cycle_days INT NOT NULL DEFAULT 30,                -- Duração do ciclo de renovação (em dias)
    fee_amount NUMERIC NOT NULL DEFAULT 50,             -- Valor da cota por ciclo
    fee_currency TEXT NOT NULL DEFAULT 'RC',           -- Moeda ('RC' ou 'KK')
    bank_recipient TEXT NOT NULL DEFAULT 'Bank Rubin',  -- Nome do personagem Bank de destino
    max_slots INT NOT NULL DEFAULT 25,                 -- Limite máximo de vagas no sistema
    term_text TEXT NOT NULL DEFAULT 'Prezado membro, o acesso às perks da guilda é restrito e encarece o custo de evolução para toda a guilda. Ao ingressar, você se compromete a contribuir com a cota acordada e manter atividade regular no servidor (mínimo de XP semanal). Membros inativos por 7 dias ou inadimplentes estão sujeitos a rebaixamento de cargo.',
    min_weekly_xp BIGINT NOT NULL DEFAULT 1,           -- Mínimo de XP em 7 dias para não ser marcado como inativo
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insere a configuração padrão inicial se não existir
INSERT INTO public.guild_perk_settings (id, cycle_days, fee_amount, fee_currency, bank_recipient, max_slots)
VALUES (1, 30, 50, 'RC', 'Bank Rubin', 25)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Membros Participantes do Sistema de Perks
CREATE TABLE IF NOT EXISTS public.guild_perk_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_name TEXT UNIQUE NOT NULL,
    world TEXT NOT NULL DEFAULT 'Auroria',
    status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',   -- PENDING_APPROVAL, ACTIVE, INACTIVITY_ALERT, FEE_EXPIRED, REMOVED, REJECTED
    joined_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,               -- Data de validade da cota atual
    grace_period_until TIMESTAMP WITH TIME ZONE,       -- Data até quando o Admin concedeu carência
    extension_count INT DEFAULT 0,                     -- Quantas vezes o Admin concedeu +7 dias
    extension_reason TEXT,                             -- Motivo da carência concedida
    last_7d_xp BIGINT DEFAULT 0,                       -- XP acumulada nos últimos 7 dias
    last_xp_check_at TIMESTAMP WITH TIME ZONE,
    requested_by TEXT DEFAULT 'WebSite',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guild_perk_members_status ON public.guild_perk_members (status);
CREATE INDEX IF NOT EXISTS idx_guild_perk_members_char ON public.guild_perk_members (character_name);

-- 3. Tabela de Pagamentos e Contribuições de Perks
CREATE TABLE IF NOT EXISTS public.guild_perk_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perk_member_id UUID REFERENCES public.guild_perk_members(id) ON DELETE CASCADE,
    character_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RC',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_by TEXT NOT NULL DEFAULT 'ADMIN',         -- 'ADMIN' ou 'WORKER'
    cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
    cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
    proof_url_or_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guild_perk_payments_char ON public.guild_perk_payments (character_name);

-- 4. Tabela de Fila de Cargos para o Scraper-Worker (In-Game RubinOT)
CREATE TABLE IF NOT EXISTS public.guild_role_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_name TEXT NOT NULL,
    action TEXT NOT NULL,                              -- 'PROMOTE_PERK' ou 'DEMOTE_MEMBER'
    status TEXT NOT NULL DEFAULT 'PENDING',            -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    world TEXT NOT NULL DEFAULT 'Auroria',
    guild_name TEXT NOT NULL DEFAULT 'Shellpatrocina',
    retries INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_guild_role_queue_status ON public.guild_role_queue (status);

-- 5. Tabela de Histórico Forense & Auditoria Aberta das Perks
CREATE TABLE IF NOT EXISTS public.guild_perk_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_name TEXT NOT NULL,
    event_type TEXT NOT NULL,                          -- 'REQUEST_CREATED', 'APPROVED', 'REJECTED', 'PAYMENT_CONFIRMED', 'INACTIVITY_FLAGGED', 'GRACE_GRANTED', 'DEMOTED', 'REMOVED'
    actor TEXT NOT NULL DEFAULT 'SYSTEM',              -- 'SYSTEM', 'ADMIN:Nome', 'WORKER'
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guild_perk_audit_char ON public.guild_perk_audit_logs (character_name, created_at DESC);

-- Desativação de RLS para acesso suave pela aplicação
ALTER TABLE public.guild_perk_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_role_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_perk_audit_logs DISABLE ROW LEVEL SECURITY;
