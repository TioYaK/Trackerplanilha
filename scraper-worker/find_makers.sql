CREATE OR REPLACE FUNCTION find_makers(p_character_name TEXT)
RETURNS TABLE (candidate_name TEXT, matches BIGINT, last_match TIMESTAMP) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le2.character_name AS candidate_name,
        COUNT(*) AS matches,
        MAX(le2.event_time) AS last_match
    FROM login_events le1
    JOIN login_events le2 
      ON le1.character_name != le2.character_name 
      AND le1.event_type != le2.event_type
      AND le2.event_time BETWEEN le1.event_time - INTERVAL '3 minutes' AND le1.event_time + INTERVAL '3 minutes'
    WHERE le1.character_name = p_character_name
    GROUP BY le2.character_name
    HAVING COUNT(*) > 1
    ORDER BY matches DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;
