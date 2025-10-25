CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  pokemon_id INTEGER NOT NULL,
  pokemon_name TEXT,
  pokemon_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_poke_unique ON favorites (username, pokemon_id);