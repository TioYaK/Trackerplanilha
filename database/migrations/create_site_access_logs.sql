-- ========================================================================================
-- MIGRATION: TELEMETRIA E REGISTRO DE ACESSOS (WEB ANALYTICS DO RUBINOT)
-- Permite acompanhar o tráfego de Visitantes, Membros Grátis e Membros Premium/VIP
-- ========================================================================================

CREATE TABLE IF NOT EXISTS site_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_name TEXT NOT NULL,
    path TEXT NOT NULL,
    world TEXT DEFAULT 'Global',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT DEFAULT 'visitor', -- 'visitor', 'user', 'admin'
    is_premium BOOLEAN DEFAULT false,
    referrer TEXT,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices otimizados para agregação de páginas mais visitadas e filtros temporais
CREATE INDEX IF NOT EXISTS idx_site_access_logs_view ON site_access_logs(view_name);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_created_at ON site_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_role ON site_access_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_site_access_logs_premium ON site_access_logs(is_premium);

-- Habilitar Row Level Security (RLS)
ALTER TABLE site_access_logs ENABLE ROW LEVEL SECURITY;

-- 1. Política de Inserção: Qualquer visitante ou membro logado pode registrar telemetria anônima ou identificada
CREATE POLICY "Allow public insert on site_access_logs"
    ON site_access_logs FOR INSERT
    WITH CHECK (true);

-- 2. Política de Leitura: Apenas administradores e service role podem ler dados analíticos
CREATE POLICY "Allow admin read on site_access_logs"
    ON site_access_logs FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );
