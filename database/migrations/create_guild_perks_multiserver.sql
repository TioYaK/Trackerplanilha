-- ========================================================================================
-- SISTEMA DE PERKS DA GUILDA: ISOLAMENTO 100% MULTI-SERVIDOR (RUBINOT)
-- Suporte completo para: Auroria, Belaria, Bellum, Tenebrium, Vesperia, Malveria
-- ========================================================================================

-- 1. Atualização da tabela de configurações para suportar cada servidor
ALTER TABLE public.guild_perk_settings ADD COLUMN IF NOT EXISTS world TEXT DEFAULT 'Auroria';
ALTER TABLE public.guild_perk_settings ADD COLUMN IF NOT EXISTS guild_name TEXT DEFAULT 'Shellpatrocina';

-- Atualiza registro padrão de id=1 para Auroria
UPDATE public.guild_perk_settings 
SET world = 'Auroria', 
    guild_name = 'Shellpatrocina',
    bank_recipient = COALESCE(bank_recipient, 'Bank Rubin Auroria')
WHERE id = 1 AND (world IS NULL OR world = 'Auroria');

-- Cria constraint única no world para guild_perk_settings caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_guild_perk_settings_world'
    ) THEN
        ALTER TABLE public.guild_perk_settings ADD CONSTRAINT uq_guild_perk_settings_world UNIQUE (world);
    END IF;
END $$;

-- Insere as configurações padrão para todos os 6 servidores caso não existam
INSERT INTO public.guild_perk_settings (world, guild_name, bank_recipient, fee_amount, fee_currency, cycle_days, max_slots, min_weekly_xp)
VALUES 
    ('Auroria', 'Shellpatrocina', 'Bank Rubin Auroria', 50, 'RC', 30, 25, 1),
    ('Belaria', 'Battlestorm Belaria', 'Bank Rubin Belaria', 50, 'RC', 30, 25, 1),
    ('Bellum', 'Battlestorm Bellum', 'Bank Rubin Bellum', 50, 'RC', 30, 25, 1),
    ('Tenebrium', 'Battlestorm Retro', 'Bank Rubin Tenebrium', 50, 'RC', 30, 25, 1),
    ('Vesperia', 'Battlestorm Vesperia', 'Bank Rubin Vesperia', 50, 'RC', 30, 25, 1),
    ('Malveria', 'Battlestorm Malveria', 'Bank Rubin Malveria', 50, 'RC', 30, 25, 1)
ON CONFLICT (world) DO UPDATE 
SET guild_name = EXCLUDED.guild_name
WHERE public.guild_perk_settings.guild_name IS NULL;

-- 2. Atualização da tabela de membros (guild_perk_members)
ALTER TABLE public.guild_perk_members ADD COLUMN IF NOT EXISTS guild_name TEXT;

UPDATE public.guild_perk_members SET guild_name = 'Shellpatrocina' WHERE world = 'Auroria' AND guild_name IS NULL;
UPDATE public.guild_perk_members SET guild_name = 'Battlestorm Belaria' WHERE world = 'Belaria' AND guild_name IS NULL;
UPDATE public.guild_perk_members SET guild_name = 'Battlestorm Bellum' WHERE world = 'Bellum' AND guild_name IS NULL;
UPDATE public.guild_perk_members SET guild_name = 'Battlestorm Retro' WHERE world = 'Tenebrium' AND guild_name IS NULL;
UPDATE public.guild_perk_members SET guild_name = 'Battlestorm Vesperia' WHERE world = 'Vesperia' AND guild_name IS NULL;
UPDATE public.guild_perk_members SET guild_name = 'Battlestorm Malveria' WHERE world = 'Malveria' AND guild_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_guild_perk_members_world ON public.guild_perk_members (world);

-- 3. Atualização da tabela de pagamentos de cotas (guild_perk_payments)
ALTER TABLE public.guild_perk_payments ADD COLUMN IF NOT EXISTS world TEXT DEFAULT 'Auroria';
ALTER TABLE public.guild_perk_payments ADD COLUMN IF NOT EXISTS guild_name TEXT DEFAULT 'Shellpatrocina';

CREATE INDEX IF NOT EXISTS idx_guild_perk_payments_world ON public.guild_perk_payments (world);

-- 4. Atualização da tabela de gastos / investimentos em perks (guild_perk_expenses)
ALTER TABLE public.guild_perk_expenses ADD COLUMN IF NOT EXISTS world TEXT DEFAULT 'Auroria';
ALTER TABLE public.guild_perk_expenses ADD COLUMN IF NOT EXISTS guild_name TEXT DEFAULT 'Shellpatrocina';

CREATE INDEX IF NOT EXISTS idx_guild_perk_expenses_world ON public.guild_perk_expenses (world);

-- 5. Atualização da tabela de votações / enquetes (guild_perk_polls)
ALTER TABLE public.guild_perk_polls ADD COLUMN IF NOT EXISTS world TEXT DEFAULT 'Auroria';
ALTER TABLE public.guild_perk_polls ADD COLUMN IF NOT EXISTS guild_name TEXT DEFAULT 'Shellpatrocina';

CREATE INDEX IF NOT EXISTS idx_guild_perk_polls_world ON public.guild_perk_polls (world);

-- 6. Atualização da tabela de logs forenses (guild_perk_audit_logs)
ALTER TABLE public.guild_perk_audit_logs ADD COLUMN IF NOT EXISTS world TEXT DEFAULT 'Auroria';

CREATE INDEX IF NOT EXISTS idx_guild_perk_audit_world ON public.guild_perk_audit_logs (world);
