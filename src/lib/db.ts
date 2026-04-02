/**
 * db.ts — sql.js based SQLite wrapper
 * Uses pure JavaScript/WASM — no native compilation needed.
 * API mimics better-sqlite3 so API routes need minimal changes.
 */
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'resume.db')
export const UPLOADS_PATH = path.join(process.cwd(), 'uploads')

let _db: any = null
let _SQL: any = null

async function loadSqlJs() {
  if (_SQL) return _SQL
  // Use the pre-compiled WASM binary from the sql.js package
  const initSqlJs = (await import('sql.js')).default
  _SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  })
  return _SQL
}

export async function getDb() {
  if (_db) return wrap(_db)

  // Ensure directories exist
  for (const dir of [path.dirname(DB_PATH), UPLOADS_PATH]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  const SQL = await loadSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH)
    _db = new SQL.Database(buf)
  } else {
    _db = new SQL.Database()
  }

  // Always run schema init (CREATE IF NOT EXISTS is idempotent)
  runSchema(_db)
  persist(_db)

  return wrap(_db)
}

function persist(db: any) {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

export function persistDb() {
  if (_db) persist(_db)
}

/** Convert { key: val } → { '@key': val } for named sql.js params */
function toSqlParams(params: any): any {
  if (params === undefined || params === null) return []
  if (Array.isArray(params)) return params
  if (typeof params !== 'object') return [params]
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(params)) {
    const key = (k.startsWith('@') || k.startsWith(':') || k.startsWith('$')) ? k : `@${k}`
    // sql.js returns BigInt for last_insert_rowid — normalise
    out[key] = typeof v === 'bigint' ? Number(v) : v
  }
  return out
}

/** Wrap the raw sql.js Database in a better-sqlite3-compatible API */
function wrap(db: any) {
  return {
    pragma: (_str: string) => { /* pragmas already set in runSchema */ },

    exec: (sql: string) => {
      db.run(sql)
      persist(db)
    },

    prepare: (sql: string) => ({
      /** INSERT / UPDATE / DELETE */
      run: (...args: any[]) => {
        const params = args.length > 1 ? args : args.length === 1 ? toSqlParams(args[0]) : []
        db.run(sql, params)
        persist(db)
        const changes = db.getRowsModified()
        let lastInsertRowid = 0
        try {
          const r = db.exec('SELECT last_insert_rowid()')
          const raw = r?.[0]?.values?.[0]?.[0]
          lastInsertRowid = typeof raw === 'bigint' ? Number(raw) : (raw ?? 0)
        } catch {}
        return { changes, lastInsertRowid }
      },

      /** SELECT returning first row or undefined */
      get: (...args: any[]) => {
        const params = args.length > 1 ? args : args.length === 1 ? toSqlParams(args[0]) : []
        const stmt = db.prepare(sql)
        try {
          if (params && ((Array.isArray(params) && params.length > 0) || (!Array.isArray(params) && Object.keys(params).length > 0))) {
            stmt.bind(params)
          }
          if (stmt.step()) return normaliseRow(stmt.getAsObject())
          return undefined
        } finally {
          stmt.free()
        }
      },

      /** SELECT returning all rows */
      all: (...args: any[]) => {
        const params = args.length > 1 ? args : args.length === 1 ? toSqlParams(args[0]) : []
        const stmt = db.prepare(sql)
        const rows: any[] = []
        try {
          if (params && ((Array.isArray(params) && params.length > 0) || (!Array.isArray(params) && Object.keys(params).length > 0))) {
            stmt.bind(params)
          }
          while (stmt.step()) rows.push(normaliseRow(stmt.getAsObject()))
        } finally {
          stmt.free()
        }
        return rows
      },
    }),
  }
}

/** sql.js sometimes returns BigInt — convert to Number for JSON serialisation */
function normaliseRow(row: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === 'bigint' ? Number(v) : v
  }
  return out
}

function runSchema(db: any) {
  db.run(`PRAGMA journal_mode=WAL;`)
  db.run(`PRAGMA foreign_keys=ON;`)

  db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      filename          TEXT NOT NULL,
      original_name     TEXT NOT NULL,
      file_path         TEXT NOT NULL,
      file_size         INTEGER DEFAULT 0,
      mime_type         TEXT DEFAULT 'application/pdf',
      raw_text          TEXT DEFAULT '',
      parsed_name       TEXT DEFAULT '',
      parsed_email      TEXT DEFAULT '',
      parsed_phone      TEXT DEFAULT '',
      parsed_skills     TEXT DEFAULT '[]',
      parsed_experience TEXT DEFAULT '[]',
      parsed_education  TEXT DEFAULT '[]',
      parsed_summary    TEXT DEFAULT '',
      experience_years  REAL DEFAULT 0,
      status            TEXT DEFAULT 'new',
      rating            INTEGER DEFAULT 0,
      tags              TEXT DEFAULT '[]',
      notes             TEXT DEFAULT '',
      uploaded_at       TEXT DEFAULT (datetime('now')),
      updated_at        TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS resumes_fts USING fts5(
      raw_text, parsed_name, parsed_skills, parsed_email,
      content='resumes', content_rowid='id'
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
  `)

  // Seed default tags
  const seeds = [
    ['Frontend','#3b82f6'], ['Backend','#8b5cf6'], ['Fullstack','#6366f1'],
    ['DevOps','#f59e0b'], ['ML/AI','#10b981'], ['Data Science','#ec4899'],
    ['Mobile','#06b6d4'], ['Shortlist','#22c55e'], ['Hold','#f97316'], ['Top Candidate','#eab308'],
  ]
  for (const [name, color] of seeds) {
    db.run(`INSERT OR IGNORE INTO tags (name, color) VALUES (@name, @color)`, { '@name': name, '@color': color })
  }
}
