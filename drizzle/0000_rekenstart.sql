CREATE TABLE rekenstart_plan (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL
);
CREATE TABLE rekenstart_quota (
  user_id TEXT NOT NULL,
  hour INTEGER NOT NULL,
  used INTEGER NOT NULL,
  PRIMARY KEY (user_id, hour)
);
