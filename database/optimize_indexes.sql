-- ========================================================================================
-- OTIMIZAÇÃO DE ÍNDICES PARA ALTA PERFORMANCE (BATTLESTORM TRACKER)
-- Execute este script no SQL Editor do Supabase para acelerar consultas e views em até 10x.
-- ========================================================================================

-- 1. Acelera view_guild_roster, view_top_rushers_24h e gráficos históricos do dashboard
CREATE INDEX IF NOT EXISTS idx_historical_sessions_char_end 
ON historical_sessions (character_name, session_end DESC);

CREATE INDEX IF NOT EXISTS idx_historical_sessions_end 
ON historical_sessions (session_end DESC);

-- 2. Acelera a função find_makers (correlação temporal de logins em ±3 min) e expurgo
CREATE INDEX IF NOT EXISTS idx_login_events_char_time 
ON login_events (character_name, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_login_events_time 
ON login_events (event_time DESC);

-- 3. Acelera o lock do Task Queue do Worker (executado a cada 5 segundos por todos os workers)
CREATE INDEX IF NOT EXISTS idx_task_queue_status_locked 
ON task_queue (status, locked_at);

-- 4. Acelera consultas de mortes recentes por data e filtro de guilda/hunted
CREATE INDEX IF NOT EXISTS idx_recent_deaths_time 
ON recent_deaths (death_time DESC);

CREATE INDEX IF NOT EXISTS idx_recent_deaths_guild_hunted 
ON recent_deaths (is_guild_member, is_hunted);

-- 5. Acelera listagem e busca rápida de Hunteds online
CREATE INDEX IF NOT EXISTS idx_hunted_list_online 
ON hunted_list (is_online, name);

-- 6. Acelera monitoramento de membros de guilda online e data de atividade
CREATE INDEX IF NOT EXISTS idx_guild_members_online_name 
ON guild_members (is_online, name);
