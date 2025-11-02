// server/db.js
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new Database(path.join(DATA_DIR, 'frontdesk.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS callers (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT
);
CREATE TABLE IF NOT EXISTS knowledge (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT UNIQUE,
  answer TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id TEXT,
  question TEXT,
  status TEXT CHECK(status IN ('PENDING','RESOLVED','UNRESOLVED')) DEFAULT 'PENDING',
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY(caller_id) REFERENCES callers(id)
);
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  help_request_id INTEGER,
  event TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
