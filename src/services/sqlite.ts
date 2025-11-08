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
  const id = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    email + Date.now().toString()
  );
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
