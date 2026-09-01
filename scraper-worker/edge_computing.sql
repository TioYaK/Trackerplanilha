CREATE TABLE IF NOT EXISTS current_character_state (
    character_name TEXT PRIMARY KEY,
    level INTEGER,
    vocation TEXT,
    xp_total BIGINT,
    last_active TIMESTAMP DEFAULT NOW(),
    session_start_xp BIGINT,
    session_start_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historical_sessions (
    id SERIAL PRIMARY KEY,
    character_name TEXT NOT NULL,
    session_start TIMESTAMP,
    session_end TIMESTAMP,
    duration_minutes INTEGER,
    xp_gained BIGINT,
    xp_per_hour BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
