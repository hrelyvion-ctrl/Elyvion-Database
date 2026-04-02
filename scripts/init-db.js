// Database initialization script - run once to set up SQLite
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(process.cwd(), 'data', 'resume.db')
const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

// Ensure directories exist
if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const db = new Database(DB_PATH)

// Enable WAL mode for performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS resumes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    filename    TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    file_size   INTEGER DEFAULT 0,
    mime_type   TEXT DEFAULT 'application/pdf',
    raw_text    TEXT DEFAULT '',
    parsed_name TEXT DEFAULT '',
    parsed_email TEXT DEFAULT '',
    parsed_phone TEXT DEFAULT '',
    parsed_skills TEXT DEFAULT '[]',
    parsed_experience TEXT DEFAULT '[]',
    parsed_education TEXT DEFAULT '[]',
    parsed_summary TEXT DEFAULT '',
    experience_years REAL DEFAULT 0,
    status      TEXT DEFAULT 'new' CHECK(status IN ('new','reviewed','shortlisted','rejected','hired')),
    rating      INTEGER DEFAULT 0 CHECK(rating BETWEEN 0 AND 5),
    tags        TEXT DEFAULT '[]',
    notes       TEXT DEFAULT '',
    uploaded_at TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS resumes_fts USING fts5(
    raw_text,
    parsed_name,
    parsed_skills,
    parsed_email,
    content='resumes',
    content_rowid='id'
  );

  CREATE TRIGGER IF NOT EXISTS resumes_ai AFTER INSERT ON resumes BEGIN
    INSERT INTO resumes_fts(rowid, raw_text, parsed_name, parsed_skills, parsed_email)
    VALUES (new.id, new.raw_text, new.parsed_name, new.parsed_skills, new.parsed_email);
  END;

  CREATE TRIGGER IF NOT EXISTS resumes_au AFTER UPDATE ON resumes BEGIN
    INSERT INTO resumes_fts(resumes_fts, rowid, raw_text, parsed_name, parsed_skills, parsed_email)
    VALUES ('delete', old.id, old.raw_text, old.parsed_name, old.parsed_skills, old.parsed_email);
    INSERT INTO resumes_fts(rowid, raw_text, parsed_name, parsed_skills, parsed_email)
    VALUES (new.id, new.raw_text, new.parsed_name, new.parsed_skills, new.parsed_email);
  END;

  CREATE TRIGGER IF NOT EXISTS resumes_ad AFTER DELETE ON resumes BEGIN
    INSERT INTO resumes_fts(resumes_fts, rowid, raw_text, parsed_name, parsed_skills, parsed_email)
    VALUES ('delete', old.id, old.raw_text, old.parsed_name, old.parsed_skills, old.parsed_email);
  END;

  INSERT OR IGNORE INTO tags (name, color) VALUES
    ('Frontend', '#3b82f6'),
    ('Backend', '#8b5cf6'),
    ('Fullstack', '#6366f1'),
    ('DevOps', '#f59e0b'),
    ('ML/AI', '#10b981'),
    ('Data Science', '#ec4899'),
    ('Mobile', '#06b6d4'),
    ('Shortlist', '#22c55e'),
    ('Hold', '#f97316'),
    ('Top Candidate', '#eab308');
`)

db.close()
console.log('✅ Database initialized at', DB_PATH)
console.log('✅ Uploads directory ready at', UPLOADS_DIR)
