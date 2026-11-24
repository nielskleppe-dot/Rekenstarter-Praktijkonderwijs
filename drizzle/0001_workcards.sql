CREATE TABLE workcards (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX workcards_owner_updated ON workcards(owner_id, updated_at);
CREATE TABLE workcard_versions (
  card_id TEXT NOT NULL REFERENCES workcards(id),
  revision INTEGER NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (card_id, revision)
);
