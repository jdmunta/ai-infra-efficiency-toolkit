-- SQLite migration for v0.4 (add privacy-safe routing feature columns)
-- Run: sqlite3 data.db < backend/scripts/migrate_sqlite.sql

ALTER TABLE request_logs ADD COLUMN is_codey BOOLEAN DEFAULT 0;
ALTER TABLE request_logs ADD COLUMN prompt_len_bucket VARCHAR(32) DEFAULT 'unknown';
ALTER TABLE request_logs ADD COLUMN has_tools BOOLEAN DEFAULT 0;
