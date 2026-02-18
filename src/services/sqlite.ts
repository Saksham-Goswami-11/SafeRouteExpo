import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export type SQLResult<T = any> = T & { insertId?: number };

export interface User {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  created_at: number;
}

export interface AuthSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDB() {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('saferoute.db');
  return _db;
}

async function exec(sql: string, params: any[] = []) {
  const db = await getDB();
  return await db.runAsync(sql, params);
}

export async function initDB() {
  // Users table with authentication fields
  await exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    created_at INTEGER
  );`);

  // Authentication sessions table
  await exec(`CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT,
    dark_mode INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS emergency_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    phone TEXT,
    relation TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at INTEGER
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS saved_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    label TEXT,
    address_text TEXT,
    latitude REAL,
    longitude REAL,
    created_at INTEGER
  );`);

  // --- MIGRATIONS ---
  // Upgrade emergency_contacts with new columns for "Nano Banana Pro" UI
  const migrationCols = [
    { name: 'avatar_uri', def: 'TEXT' },
    { name: 'relationship_label', def: 'TEXT' },
    { name: 'is_active_simulated', def: 'INTEGER DEFAULT 0' }
  ];

  for (const col of migrationCols) {
    try {
      await exec(`ALTER TABLE emergency_contacts ADD COLUMN ${col.name} ${col.def};`);
    } catch (e) {
      // Column likely already exists, ignore error
      // console.log(`Column ${col.name} already exists or could not be added.`);
    }
  }

  // --- NEW TABLES ---
  await exec(`CREATE TABLE IF NOT EXISTS alert_history (
    id TEXT PRIMARY KEY,
    type TEXT, -- 'SOS_SENT', 'FALSE_ALARM', 'SYSTEM_TEST'
    timestamp INTEGER,
    location_snapshot TEXT, -- JSON string of {latitude, longitude}
    is_synced INTEGER DEFAULT 0
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );`);

  await exec(`CREATE TABLE IF NOT EXISTS audio_logs (
    id TEXT PRIMARY KEY,
    uri TEXT NOT NULL,
    timestamp INTEGER,
    duration TEXT
  );`);
  console.log("LOG Table: audio_logs checked/created");

  // Insert default settings if they don't exist
  await exec(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('ghost_mode', 'false');`);

  // Verify schema after updates
  await verifySchema();
}

/**
 * Helper to verify schema changes by logging table info to console.
 * Call this manually or from initDB during development.
 */
export async function verifySchema() {
  console.log('--- Verifying Database Schema ---');
  try {
    const tables = ['emergency_contacts', 'alert_history', 'app_settings'];
    for (const table of tables) {
      const info = await query(`PRAGMA table_info(${table})`);
      console.log(`Table: ${table}`);
      console.log(info.map((col: any) => ` - ${col.name} (${col.type})`).join('\n'));
    }
  } catch (error) {
    console.error('Error verifying schema:', error);
  }
  console.log('--- Schema Verification Complete ---');
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDB();
  const result = await db.getAllAsync<T>(sql, params);
  return result || [];
}

export async function run(sql: string, params: any[] = []) {
  const db = await getDB();
  await db.runAsync(sql, params);
}

// Authentication functions
export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'SafeRoute_Salt_2024' // Add a salt for security
  );
}

export async function generateToken(): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Math.random().toString() + Date.now().toString()
  );
}

export async function createUser(email: string, password: string, fullName: string): Promise<User> {

  const id = Crypto.randomUUID();

  const passwordHash = await hashPassword(password);

  const createdAt = Date.now();



  const db = await getDB();

  await db.runAsync(

    'INSERT INTO users (id, email, full_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',

    [id, email.toLowerCase(), fullName, passwordHash, createdAt]

  );



  return {

    id,

    email: email.toLowerCase(),

    full_name: fullName,

    password_hash: passwordHash,

    created_at: createdAt

  };

}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const passwordHash = await hashPassword(password);
  const users = await query<User>(
    'SELECT * FROM users WHERE email = ? AND password_hash = ?',
    [email.toLowerCase(), passwordHash]
  );

  return users.length > 0 ? users[0] : null;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = await generateToken();
  const token = await generateToken();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  const createdAt = Date.now();

  const db = await getDB();
  await db.runAsync(
    'INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, token, expiresAt, createdAt]
  );

  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  const now = Date.now();
  const sessions = await query<AuthSession & User & { user_created_at: number }>(
    `SELECT s.*, u.id, u.email, u.full_name, u.created_at as user_created_at 
     FROM auth_sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.token = ? AND s.expires_at > ?`,
    [token, now]
  );

  if (sessions.length === 0) return null;

  const session = sessions[0];
  return {
    id: session.user_id, // Use the user_id from the session, not the session's own id
    email: session.email,
    full_name: session.full_name,
    password_hash: '', // Don't return password hash
    created_at: session.user_created_at
  };
}

export async function invalidateSession(token: string): Promise<void> {
  const db = await getDB();
  await db.runAsync('DELETE FROM auth_sessions WHERE token = ?', [token]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await query<User>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  return users.length > 0 ? users[0] : null;
}

export async function addEmergencyContact(contact: { id: string, name: string, phone: string, userId: string }) {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO emergency_contacts (id, user_id, name, phone, created_at) VALUES (?, ?, ?, ?, ?)`,
    [contact.id, contact.userId, contact.name, contact.phone, Date.now()]
  );
}

export async function getEmergencyContacts(userId: string): Promise<{ name: string, phone: string }[]> {
  const contacts = await query<{ name: string, phone: string }>(
    'SELECT name, phone FROM emergency_contacts WHERE user_id = ?',
    [userId]
  );
  return contacts;
}


export async function saveAudioLog(log: { id: string, uri: string, timestamp: number, duration: string }) {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO audio_logs (id, uri, timestamp, duration) VALUES (?, ?, ?, ?)`,
    [log.id, log.uri, log.timestamp, log.duration]
  );
}

export async function getAudioLogs() {
  return await query<{ id: string, uri: string, timestamp: number, duration: string }>(
    'SELECT * FROM audio_logs ORDER BY timestamp DESC'
  );
}

// App Settings helpers (key-value store)
export async function saveSetting(key: string, value: string): Promise<void> {
  await run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<{ key: string; value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
  return rows.length > 0 ? rows[0].value : null;
}

