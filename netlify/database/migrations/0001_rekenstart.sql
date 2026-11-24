CREATE TABLE IF NOT EXISTS rekenstart_plan (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rekenstart_quota (
  user_id TEXT NOT NULL,
  hour INTEGER NOT NULL,
  used INTEGER NOT NULL CHECK (used >= 0),
  PRIMARY KEY (user_id, hour)
);

CREATE TABLE IF NOT EXISTS workcards (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS workcards_owner_updated ON workcards(owner_id, updated_at);

CREATE TABLE IF NOT EXISTS workcard_versions (
  card_id TEXT NOT NULL REFERENCES workcards(id),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (card_id, revision)
);

CREATE TABLE IF NOT EXISTS ai_connection (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_id TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  verified_at TEXT NOT NULL,
  free_tier_confirmed INTEGER NOT NULL CHECK (free_tier_confirmed = 1)
);
