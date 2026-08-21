-- ========================================================================================
-- FASE 1: ARQUITETURA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Script de criação de tabelas, enums e políticas RLS para a Plataforma Auroria
-- ========================================================================================

-- Criando ENUMs para a máquina de estados do Worker e Status do Slot
CREATE TYPE task_type_enum AS ENUM ('FETCH_GUILD', 'FETCH_ONLINES', 'FETCH_HIGHSCORE', 'AUDIT_SLOTS');
CREATE TYPE task_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');
CREATE TYPE slot_status_enum AS ENUM ('EFFICIENT', 'SUBOPTIMAL', 'GHOST_SLOT');

-- 1. Tabela guild_members: Armazena o censo macro da guilda
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    vocation TEXT,
    level INT DEFAULT 0,
    rank TEXT,
    is_active_7d BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela parties_planilhadas: Os agendamentos de slots
CREATE TABLE IF NOT EXISTS parties_planilhadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_name TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    respawn_category TEXT NOT NULL, -- ex: 'Darashia', 'Sanguine', 'Darklight', 'Piranhas', 'Totem'
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    members JSONB DEFAULT '[]'::jsonb, -- Array de nomes [ "Player 1", "Player 2" ]
    status slot_status_enum DEFAULT 'EFFICIENT',
    delta_xp TEXT DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela task_queue: Sistema de Locking para Scraper Distribuído (PM2 Workers)
CREATE TABLE IF NOT EXISTS task_queue (
    id SERIAL PRIMARY KEY,
    task_type task_type_enum NOT NULL,
    page_number INT DEFAULT NULL, -- 1 a 20 para highscores
    status task_status_enum DEFAULT 'PENDING',
    worker_id TEXT DEFAULT NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela telemetry_logs: Séries Temporais de 10 em 10 min
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id BIGSERIAL PRIMARY KEY,
    character_name TEXT NOT NULL,
    level INT,
    xp_total BIGINT NOT NULL,
    delta_xp BIGINT DEFAULT 0, -- Variação de XP em relação ao log anterior
    is_online BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Índice para buscas rápidas no dashboard por personagem e tempo
CREATE INDEX idx_telemetry_character_recorded ON telemetry_logs (character_name, recorded_at DESC);

-- 5. Tabela slot_audit_logs: Métricas de Desperdício por Slot processadas ao final de cada dia
CREATE TABLE IF NOT EXISTS slot_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties_planilhadas(id) ON DELETE CASCADE,
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    minutes_hunting INT DEFAULT 0,
    minutes_idle INT DEFAULT 0,
    total_xp_gained BIGINT DEFAULT 0,
    efficiency_percentage FLOAT DEFAULT 0.0,
    status slot_status_enum DEFAULT 'EFFICIENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================================================
-- VIEWS DE CONSOLIDAÇÃO PARA O DASHBOARD (Calculadas em tempo real / sob demanda)
-- ========================================================================================

-- View de Macro Censo
CREATE OR REPLACE VIEW view_macro_census AS
SELECT
    (SELECT COUNT(*) FROM guild_members) as total_members,
    (SELECT COUNT(DISTINCT character_name) FROM telemetry_logs WHERE recorded_at >= NOW() - INTERVAL '7 days') as active_members;

-- ========================================================================================
-- TRIGGERS PARA UPDATED_AT
-- ========================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guild_members_updated_at
BEFORE UPDATE ON guild_members
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_task_queue_updated_at
BEFORE UPDATE ON task_queue
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- População Inicial da Task Queue (Seed básico para o Worker começar a operar)
-- O worker pode recriar essas tasks ao finalizá-las, ou via cron.
INSERT INTO task_queue (task_type) VALUES ('FETCH_GUILD');
INSERT INTO task_queue (task_type) VALUES ('FETCH_ONLINES');
INSERT INTO task_queue (task_type) VALUES ('AUDIT_SLOTS');
-- Highscores paginadas de 1 a 20
DO $$
BEGIN
    FOR i IN 1..20 LOOP
        INSERT INTO task_queue (task_type, page_number) VALUES ('FETCH_HIGHSCORE', i);
    END LOOP;
END;
$$;
