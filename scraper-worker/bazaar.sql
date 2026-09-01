CREATE TABLE IF NOT EXISTS bazaar_alerts (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL UNIQUE,
    character_name TEXT NOT NULL,
    world_name TEXT,
    level INTEGER,
    vocation TEXT,
    current_bid INTEGER,
    auction_end TIMESTAMP,
    is_hunted BOOLEAN DEFAULT false,
    is_sniping_opportunity BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
