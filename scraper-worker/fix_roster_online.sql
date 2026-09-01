CREATE OR REPLACE VIEW view_guild_roster AS
SELECT 
    m.id,
    m.name, 
    m.rank, 
    m.title, 
    COALESCE(c.level, m.level, 0) as level, 
    COALESCE(c.vocation, m.vocation, 'Unknown') as vocation, 
    COALESCE(c.xp_total, 0) as xp_total,
    COALESCE(
        (SELECT SUM(xp_gained) 
         FROM historical_sessions h 
         WHERE h.character_name = m.name 
         AND h.session_end >= NOW() - INTERVAL '24 hours'), 
        0
    ) AS xp_gained_24h,
    m.is_online
FROM guild_members m
LEFT JOIN current_character_state c ON c.character_name = m.name;
