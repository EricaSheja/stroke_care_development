import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// Schema for the MVP. Owner: Axel. Tables marked Planned in docs/erd.md are not created yet.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('survivor', 'prevention', 'clinician', 'admin')),
  consent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clinician_patients (
  clinician_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (clinician_id, patient_id)
);

CREATE TABLE IF NOT EXISTS bp_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  note TEXT,
  taken_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bp_user_time ON bp_readings (user_id, taken_at);

CREATE TABLE IF NOT EXISTS recovery_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  clinician_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS plan_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL REFERENCES recovery_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT
);

CREATE TABLE IF NOT EXISTS task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES plan_tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  done_on TEXT NOT NULL,
  UNIQUE (task_id, done_on)
);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS education_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT NOT NULL,
  reviewed_on TEXT,
  reviewer TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
);
`;

export function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}
