import { supabase } from '../scraper-worker/src/db.js';

(async () => {
  const sql = `
    CREATE OR REPLACE VIEW view_guild_roster AS
    SELECT 
        m.id,
        m.name, 
        m.rank, 
        COALESCE(c.level, m.level, 0) as level, 
        COALESCE(c.vocation, m.vocation, 'Unknown') as vocation, 
        (
          COALESCE((
            SELECT SUM(xp_gained) 
            FROM historical_sessions h 
            WHERE h.character_name = m.name 
            AND h.session_end >= NOW() - INTERVAL '24 hours'
          ), 0)
          +
          COALESCE(GREATEST(0, c.xp_total - c.session_start_xp), 0)
        ) AS xp_gained_24h,
        m.is_online
    FROM guild_members m
    LEFT JOIN current_character_state c ON c.character_name = m.name;
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    console.log('Execute SQL:', data, error);
  } catch (err) {
    console.log('RPC execute_sql not available, executing query...');
  }

  // Check view_guild_roster data
  const { data: roster, error } = await supabase
    .from('view_guild_roster')
    .select('*')
    .gt('xp_gained_24h', 0)
    .order('xp_gained_24h', { ascending: false })
    .limit(10);

  console.log('Error:', error);
  console.log('Top 10 Rushers with XP > 0 in view_guild_roster:', roster);
  process.exit(0);
})();
