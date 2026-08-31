import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS participants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  handle        TEXT NOT NULL UNIQUE,      -- takma ad; kimlik bilgisi saklanmaz
  segment       TEXT NOT NULL,
  telegram_chat TEXT,
  enrolled_at   TEXT NOT NULL,
  left_at       TEXT
);

CREATE TABLE IF NOT EXISTS watches (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  origin         TEXT NOT NULL,
  destination    TEXT NOT NULL,
  cabin          TEXT NOT NULL,
  date_from      TEXT NOT NULL,
  date_to        TEXT NOT NULL,
  max_miles      INTEGER NOT NULL,
  passengers     INTEGER NOT NULL DEFAULT 1,
  active         INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_watches_route ON watches(origin, destination, cabin, active);

-- Envanter Ajaninin gordugu ham musaitlik kayitlari
CREATE TABLE IF NOT EXISTS availability (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  origin       TEXT NOT NULL,
  destination  TEXT NOT NULL,
  cabin        TEXT NOT NULL,
  depart_date  TEXT NOT NULL,
  miles        INTEGER NOT NULL,
  taxes_try    INTEGER NOT NULL,
  seats        INTEGER NOT NULL,
  carrier      TEXT NOT NULL,
  cash_price_try INTEGER,
  seen_at      TEXT NOT NULL,
  UNIQUE(origin, destination, cabin, depart_date, carrier, miles)
);

CREATE TABLE IF NOT EXISTS alerts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  watch_id        INTEGER NOT NULL REFERENCES watches(id) ON DELETE CASCADE,
  participant_id  INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  fingerprint     TEXT NOT NULL,
  origin          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  cabin           TEXT NOT NULL,
  depart_date     TEXT NOT NULL,
  miles           INTEGER NOT NULL,
  taxes_try       INTEGER NOT NULL,
  seats           INTEGER NOT NULL,
  carrier         TEXT NOT NULL,
  saving_try      INTEGER,
  verification    TEXT NOT NULL DEFAULT 'unverified', -- unverified|verified|false_positive
  sent_at         TEXT NOT NULL,
  channel         TEXT NOT NULL,
  booked          INTEGER,                -- kullanici beyani: 1 evet, 0 hayir, NULL yanit yok
  responded_at    TEXT,
  UNIQUE(watch_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_alerts_participant ON alerts(participant_id, sent_at);

-- Haftalik geri bildirim formu
CREATE TABLE IF NOT EXISTS weekly_feedback (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  week           INTEGER NOT NULL,
  active         INTEGER NOT NULL,        -- o hafta urunu kullandi mi
  noise_complaint INTEGER NOT NULL DEFAULT 0,
  score          INTEGER,                 -- 1-5
  note           TEXT,
  created_at     TEXT NOT NULL,
  UNIQUE(participant_id, week)
);

-- Hafta 6-7 on satis testi (gercek tahsilat, cayma sonrasi net)
CREATE TABLE IF NOT EXISTS presales (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL,           -- monthly|annual
  amount_try     INTEGER NOT NULL,
  charged_at     TEXT NOT NULL,
  refunded_at    TEXT,
  UNIQUE(participant_id)
);

CREATE TABLE IF NOT EXISTS scan_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  route       TEXT NOT NULL,
  status      TEXT NOT NULL,             -- ok|rate_limited|blocked|error
  results     INTEGER NOT NULL DEFAULT 0,
  detail      TEXT,
  created_at  TEXT NOT NULL
);
`;

export function openDb(file = config.dbFile) {
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

export const nowIso = () => new Date().toISOString();
