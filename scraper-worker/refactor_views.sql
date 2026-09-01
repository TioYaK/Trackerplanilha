DROP VIEW IF EXISTS view_guild_roster CASCADE;
DROP VIEW IF EXISTS view_recent_hunters CASCADE;
DROP VIEW IF EXISTS view_top_rushers_24h CASCADE;
DROP VIEW IF EXISTS view_macro_daily CASCADE;

CREATE VIEW view_macro_daily AS
SELECT DATE(session_end) as day_date, SUM(xp_gained) as total_xp
FROM historical_sessions
GROUP BY DATE(session_end)
ORDER BY day_date DESC;

CREATE VIEW view_top_rushers_24h AS
SELECT h.character_name as name, SUM(h.xp_gained) as xp_gained, MAX(h.end_level) as level, COALESCE(MAX(c.vocation), 'Unknown') as vocation
FROM historical_sessions h
LEFT JOIN current_character_state c ON c.character_name = h.character_name
WHERE h.session_end >= NOW() - INTERVAL '24 hours'
GROUP BY h.character_name
ORDER BY xp_gained DESC;

CREATE VIEW view_recent_hunters AS
SELECT character_name, MAX(session_end) as last_hunt, SUM(xp_gained) as total_gained
FROM historical_sessions
GROUP BY character_name
ORDER BY last_hunt DESC;

CREATE VIEW view_guild_roster AS
SELECT 
    m.id,
    m.name, 
    m.rank, 
    COALESCE(c.level, m.level, 0) as level, 
    COALESCE(c.vocation, m.vocation, 'Unknown') as vocation, 
    COALESCE(
        (SELECT SUM(xp_gained) 
         FROM historical_sessions h 
         WHERE h.character_name = m.name 
         AND h.session_end >= NOW() - INTERVAL '24 hours'), 
        0
    ) AS xp_gained_24h,
    (c.last_active >= NOW() - INTERVAL '30 minutes') AS is_online
FROM guild_members m
LEFT JOIN current_character_state c ON c.character_name = m.name;

DROP TABLE IF EXISTS telemetry_logs;
