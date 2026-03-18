-- Dove IT Obligations Tracker - Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'technician')),
  technician_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contract_details TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  region TEXT DEFAULT '',
  primary_tech TEXT DEFAULT '',
  secondary_tech TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS obligations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  obligation_type TEXT NOT NULL DEFAULT 'custom',
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  specific_date TEXT,
  day_of_week INTEGER,
  day_of_month INTEGER,
  month_of_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  obligation_id TEXT NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_by TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS snoozes (
  id TEXT PRIMARY KEY,
  obligation_id TEXT NOT NULL REFERENCES obligations(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  snooze_to TEXT NOT NULL,
  reason TEXT DEFAULT '',
  snoozed_by TEXT DEFAULT '',
  snoozed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'note',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_feed (
  id TEXT PRIMARY KEY,
  tech TEXT NOT NULL,
  action TEXT NOT NULL,
  obligation_title TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  obligation_type TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_obligations_client ON obligations(client_id);
CREATE INDEX IF NOT EXISTS idx_completions_obligation ON completions(obligation_id);
CREATE INDEX IF NOT EXISTS idx_completions_due_date ON completions(due_date);
CREATE INDEX IF NOT EXISTS idx_snoozes_obligation ON snoozes(obligation_id);
CREATE INDEX IF NOT EXISTS idx_activity_client ON activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_team_feed_timestamp ON team_feed(timestamp DESC);
