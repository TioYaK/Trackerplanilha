CREATE TABLE IF NOT EXISTS guild_attendance (
    id SERIAL PRIMARY KEY,
    character_name TEXT NOT NULL,
    date DATE NOT NULL,
    minutes_online INTEGER DEFAULT 0,
    UNIQUE(character_name, date)
);

CREATE OR REPLACE FUNCTION increment_attendance_batch(p_names TEXT[], p_date DATE, p_minutes INTEGER)
RETURNS void AS $$
DECLARE
    name TEXT;
BEGIN
    FOREACH name IN ARRAY p_names
    LOOP
        INSERT INTO guild_attendance (character_name, date, minutes_online)
        VALUES (name, p_date, p_minutes)
        ON CONFLICT (character_name, date)
        DO UPDATE SET minutes_online = guild_attendance.minutes_online + p_minutes;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
