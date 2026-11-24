CREATE TABLE ai_connection (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_id TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  revision INTEGER NOT NULL,
  verified_at TEXT NOT NULL,
  free_tier_confirmed INTEGER NOT NULL CHECK (free_tier_confirmed = 1)
);
