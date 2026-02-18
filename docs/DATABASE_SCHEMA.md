# 🗄️ SafeRoute Database Schema - Complete Reference

This document provides a comprehensive overview of the SQLite database schema used in the SafeRouteExpo mobile application, including detailed table structures, relationships, indexes, and sample data.

## 📊 Database Overview

**Database Type**: SQLite 3.x  
**Database File**: `saferoute.db` (Local device storage)  
**Schema Version**: 1.0  
**Total Tables**: 5 core tables + 1 view  
**Architecture**: Offline-first with local persistence  
**Location**: App's document directory

The database follows a normalized relational model with proper foreign key constraints, optimized for mobile performance and offline-first functionality.

## 🏗️ Database Architecture

```mermaid
erDiagram
    users ||--|| profiles : "has one"
    users ||--o{ auth_sessions : "has many"
    users ||--o{ emergency_contacts : "has many"
    users ||--o{ saved_addresses : "has many"
    
    users {
        TEXT id PK
        TEXT email UK
        TEXT full_name
        TEXT password_hash
        INTEGER created_at
    }
    
    auth_sessions {
        TEXT id PK
        TEXT user_id FK
        TEXT token UK
        INTEGER expires_at
        INTEGER created_at
    }
    
    profiles {
        TEXT user_id PK_FK
        TEXT full_name
        INTEGER dark_mode
        INTEGER created_at
        INTEGER updated_at
    }
    
    emergency_contacts {
        TEXT id PK
        TEXT user_id FK
        TEXT name
        TEXT phone
        TEXT relation
        INTEGER is_primary
        INTEGER created_at
    }
    
    saved_addresses {
        TEXT id PK
        TEXT user_id FK
        TEXT label
        TEXT address_text
        REAL latitude
        REAL longitude
        INTEGER created_at
    }
```

## 📋 Table Schemas

### 1. **users** (Authentication & Core User Data)

**Purpose**: Stores core user authentication information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique user identifier (SHA-256 hash) |
| `email` | TEXT | UNIQUE, NOT NULL | User's email address (lowercase) |
| `full_name` | TEXT | - | User's display name |
| `password_hash` | TEXT | NOT NULL | SHA-256 hashed password with salt |
| `created_at` | INTEGER | - | Unix timestamp of account creation |

**SQL Schema**:
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password_hash TEXT NOT NULL,
    created_at INTEGER
);
```

**Sample Data**:
```sql
INSERT INTO users VALUES (
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    'paarth@example.com',
    'Paarth Goswami',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    1672531200000
);
```

---

### 2. **auth_sessions** (Session Management)

**Purpose**: Manages user authentication sessions with token-based security

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Session identifier |
| `user_id` | TEXT | NOT NULL, FK → users.id | Reference to user |
| `token` | TEXT | UNIQUE, NOT NULL | Authentication token |
| `expires_at` | INTEGER | NOT NULL | Token expiration timestamp |
| `created_at` | INTEGER | - | Session creation timestamp |

**SQL Schema**:
```sql
CREATE TABLE auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**Session Management Logic**:
- **Token Lifetime**: 7 days (604,800,000 ms)
- **Auto-cleanup**: Expired sessions are removed on validation
- **Security**: Tokens are SHA-256 hashed random strings

---

### 3. **profiles** (User Preferences & Extended Info)

**Purpose**: Stores user profile information and app preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | TEXT | PRIMARY KEY, FK → users.id | User reference |
| `full_name` | TEXT | - | Editable display name |
| `dark_mode` | INTEGER | DEFAULT 0 | Theme preference (0=light, 1=dark) |
| `created_at` | INTEGER | - | Profile creation timestamp |
| `updated_at` | INTEGER | - | Last modification timestamp |

**SQL Schema**:
```sql
CREATE TABLE profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT,
    dark_mode INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**Business Rules**:
- One profile per user (1:1 relationship)
- `updated_at` is automatically set on profile changes
- `dark_mode`: 0 = Light theme, 1 = Dark theme

---

### 4. **emergency_contacts** (Safety Feature)

**Purpose**: Stores user's emergency contacts for SOS functionality

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Contact identifier |
| `user_id` | TEXT | FK → users.id | Owner of the contact |
| `name` | TEXT | - | Contact's full name |
| `phone` | TEXT | - | Phone number (auto-formatted) |
| `relation` | TEXT | - | Relationship (e.g., "Family", "Friend") |
| `is_primary` | INTEGER | DEFAULT 0 | Primary contact flag (0/1) |
| `created_at` | INTEGER | - | Contact creation timestamp |

**SQL Schema**:
```sql
CREATE TABLE emergency_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    phone TEXT,
    relation TEXT,
    is_primary INTEGER DEFAULT 0,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**Phone Number Formatting**:
- Automatically normalizes to international format
- Indian numbers: `+91` prefix
- Removes non-digit characters
- Example: `9876543210` → `+919876543210`

**Business Rules**:
- Multiple contacts per user allowed
- One primary contact recommended
- Phone numbers are automatically normalized

---

### 5. **saved_addresses** (Location Management)

**Purpose**: Stores frequently used addresses for quick navigation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Address identifier |
| `user_id` | TEXT | FK → users.id | Owner of the address |
| `label` | TEXT | - | User-defined label (e.g., "Home", "Office") |
| `address_text` | TEXT | - | Human-readable address |
| `latitude` | REAL | - | GPS latitude coordinate |
| `longitude` | REAL | - | GPS longitude coordinate |
| `created_at` | INTEGER | - | Address creation timestamp |

**SQL Schema**:
```sql
CREATE TABLE saved_addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    label TEXT,
    address_text TEXT,
    latitude REAL,
    longitude REAL,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

**Coordinate System**:
- **Latitude**: -90 to +90 (decimal degrees)
- **Longitude**: -180 to +180 (decimal degrees)
- **Precision**: Up to 6 decimal places (~0.1 meter accuracy)

---

## 🔐 Security Considerations

### **Password Security**
- **Hashing Algorithm**: SHA-256
- **Salt**: Static salt "SafeRoute_Salt_2024"
- **Storage**: Only hashed passwords stored, never plain text

### **Session Security**
- **Token Generation**: Cryptographically secure random tokens
- **Expiration**: 7-day automatic expiry
- **Cleanup**: Expired sessions automatically removed

### **Data Privacy**
- **Local Storage**: All data stored locally in SQLite
- **No Cloud Sync**: Complete offline functionality
- **User Isolation**: Foreign key constraints prevent data leakage

## 📈 Performance Optimizations

### **Indexing Strategy**
```sql
-- Recommended indexes for production
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX idx_saved_addresses_user_id ON saved_addresses(user_id);
```

### **Query Patterns**
- **Authentication**: Fast token-based lookups
- **User Data**: Efficient joins with proper foreign keys
- **Batch Operations**: Optimized for contact/address management

## 🔄 Migration & Versioning

### **Current Version**: 1.0
- Initial schema implementation
- Basic user management
- Authentication system
- Emergency features

### **Future Considerations**
- **Route History**: Table for storing navigation history
- **Safety Scores**: Cache table for location safety data
- **Settings**: Extended user preferences
- **Analytics**: Usage tracking (privacy-conscious)

## 🛠️ Database Initialization

The database is automatically initialized when the app starts:

```typescript
// Database initialization code
import { initDB } from './src/services/sqlite';

// Called on app startup
await initDB();
```

All tables are created with `IF NOT EXISTS` to prevent errors on subsequent runs.

## 📊 Data Relationships

```
User (1) ←→ (1) Profile
User (1) ←→ (0..*) Emergency Contacts
User (1) ←→ (0..*) Saved Addresses  
User (1) ←→ (0..*) Auth Sessions
```

## 🧪 Sample Queries

### **User Authentication**
```sql
-- Validate login
SELECT * FROM users 
WHERE email = 'user@example.com' 
AND password_hash = 'hashed_password';

-- Check session validity
SELECT u.*, s.expires_at 
FROM users u 
JOIN auth_sessions s ON u.id = s.user_id 
WHERE s.token = 'session_token' 
AND s.expires_at > 1672531200000;
```

### **Emergency Contacts**
```sql
-- Get all contacts for user
SELECT * FROM emergency_contacts 
WHERE user_id = 'user_id' 
ORDER BY is_primary DESC, created_at DESC;

-- Get primary contact
SELECT * FROM emergency_contacts 
WHERE user_id = 'user_id' AND is_primary = 1 
LIMIT 1;
```

### **Saved Addresses**
```sql
-- Get nearby addresses (conceptual - requires distance calculation)
SELECT *, 
  (latitude - :user_lat) * (latitude - :user_lat) + 
  (longitude - :user_lng) * (longitude - :user_lng) as distance_sq
FROM saved_addresses 
WHERE user_id = 'user_id' 
ORDER BY distance_sq 
LIMIT 5;
```

---

## 📊 Performance & Optimization

### **Index Strategy**
```sql
-- Primary Indexes (Auto-created with PRIMARY KEY)
CREATE UNIQUE INDEX sqlite_autoindex_users_1 ON users(id);
CREATE UNIQUE INDEX sqlite_autoindex_users_2 ON users(email);
CREATE UNIQUE INDEX sqlite_autoindex_auth_sessions_1 ON auth_sessions(id);
CREATE UNIQUE INDEX sqlite_autoindex_auth_sessions_2 ON auth_sessions(token);

-- Recommended Additional Indexes for Production
CREATE INDEX idx_auth_sessions_user_expires ON auth_sessions(user_id, expires_at);
CREATE INDEX idx_emergency_contacts_user_primary ON emergency_contacts(user_id, is_primary);
CREATE INDEX idx_saved_addresses_user_created ON saved_addresses(user_id, created_at DESC);
CREATE INDEX idx_profiles_updated ON profiles(updated_at DESC);
```

### **Query Performance Tips**

#### **Fast User Lookup**
```sql
-- Efficient login query (uses email index)
SELECT id, email, full_name FROM users 
WHERE email = ? AND password_hash = ?
LIMIT 1;
```

#### **Session Validation**
```sql
-- Optimized session check (uses token index + join)
SELECT u.id, u.email, u.full_name, s.expires_at
FROM users u 
INNER JOIN auth_sessions s ON u.id = s.user_id 
WHERE s.token = ? AND s.expires_at > ?;
```

#### **Emergency Contacts Retrieval**
```sql
-- Get contacts ordered by priority (primary first)
SELECT id, name, phone, relation, is_primary
FROM emergency_contacts 
WHERE user_id = ? 
ORDER BY is_primary DESC, created_at ASC;
```

---

## 🔧 Database Maintenance

### **Cleanup Operations**

#### **Expired Sessions Cleanup**
```sql
-- Remove expired auth sessions (run periodically)
DELETE FROM auth_sessions WHERE expires_at < strftime('%s', 'now') * 1000;
```

#### **Database Statistics**
```sql
-- Check table sizes
SELECT name, 
       COUNT(*) as row_count
FROM sqlite_master m 
LEFT JOIN (
  SELECT 'users' as table_name, COUNT(*) as cnt FROM users
  UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
  UNION ALL SELECT 'auth_sessions', COUNT(*) FROM auth_sessions
  UNION ALL SELECT 'emergency_contacts', COUNT(*) FROM emergency_contacts
  UNION ALL SELECT 'saved_addresses', COUNT(*) FROM saved_addresses
) counts ON m.name = counts.table_name
WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'
ORDER BY row_count DESC;
```

#### **Database Health Check**
```sql
-- Integrity check
PRAGMA integrity_check;

-- Foreign key check
PRAGMA foreign_key_check;

-- Get database size info
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;
```

### **Backup Strategy**
```typescript
// Backup database to external storage
export async function backupDatabase() {
  const db = await getDB();
  const backup = `
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `;
  // Export schema + data
}
```

---

## 🧪 Test Data & Fixtures

### **Development Test Data**
```sql
-- Test user account
INSERT INTO users (id, email, full_name, password_hash, created_at) VALUES (
  'test_user_123',
  'test@saferoute.com',
  'Test User',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- empty string hash
  1672531200000
);

-- Test profile
INSERT INTO profiles (user_id, full_name, dark_mode, created_at, updated_at) VALUES (
  'test_user_123',
  'Test User Profile',
  1,
  1672531200000,
  1672531200000
);

-- Test emergency contacts
INSERT INTO emergency_contacts (id, user_id, name, phone, relation, is_primary, created_at) VALUES 
  ('contact_1', 'test_user_123', 'Emergency Contact 1', '+919876543210', 'Family', 1, 1672531200000),
  ('contact_2', 'test_user_123', 'Emergency Contact 2', '+919876543211', 'Friend', 0, 1672531300000);

-- Test saved addresses
INSERT INTO saved_addresses (id, user_id, label, address_text, latitude, longitude, created_at) VALUES 
  ('addr_1', 'test_user_123', 'Home', '123 Test Street, Test City', 28.6139, 77.2090, 1672531200000),
  ('addr_2', 'test_user_123', 'Office', '456 Work Plaza, Business District', 28.6289, 77.2167, 1672531300000);
```

### **Data Validation Queries**
```sql
-- Validate foreign key relationships
SELECT 'profiles' as table_name, COUNT(*) as orphaned
FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL
UNION ALL
SELECT 'emergency_contacts', COUNT(*)
FROM emergency_contacts ec LEFT JOIN users u ON ec.user_id = u.id WHERE u.id IS NULL
UNION ALL
SELECT 'saved_addresses', COUNT(*)
FROM saved_addresses sa LEFT JOIN users u ON sa.user_id = u.id WHERE u.id IS NULL;

-- Check for duplicate emails
SELECT email, COUNT(*) as count 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Validate coordinate ranges
SELECT id, label, latitude, longitude
FROM saved_addresses 
WHERE latitude < -90 OR latitude > 90 
   OR longitude < -180 OR longitude > 180;
```

---

## 📱 Mobile-Specific Considerations

### **Storage Constraints**
- **Database Size Limit**: ~2GB per SQLite file
- **Recommended Max Size**: 100MB for optimal performance
- **Current Schema Capacity**: ~1M users, ~10M addresses/contacts

### **Performance Optimization**
```sql
-- Enable Write-Ahead Logging (WAL) mode for better concurrency
PRAGMA journal_mode=WAL;

-- Optimize for mobile performance
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=2000;
PRAGMA temp_store=memory;
```

### **Memory Management**
```typescript
// Connection pool management
export class DatabaseManager {
  private static instance: SQLite.SQLiteDatabase | null = null;
  
  static async getConnection() {
    if (!this.instance) {
      this.instance = await SQLite.openDatabaseAsync('saferoute.db');
      await this.instance.execAsync('PRAGMA foreign_keys=ON');
    }
    return this.instance;
  }
  
  static async closeConnection() {
    if (this.instance) {
      await this.instance.closeAsync();
      this.instance = null;
    }
  }
}
```

---

## 🔮 Future Schema Extensions

### **Planned Tables (v2.0)**

#### **Route History**
```sql
CREATE TABLE route_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    start_address TEXT,
    end_address TEXT,
    start_lat REAL,
    start_lng REAL,
    end_lat REAL,
    end_lng REAL,
    safety_score INTEGER,
    duration_minutes INTEGER,
    distance_meters INTEGER,
    route_data TEXT, -- JSON of route coordinates
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### **Safety Reports**
```sql
CREATE TABLE safety_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    report_type TEXT NOT NULL, -- 'incident', 'safe', 'avoid'
    description TEXT,
    severity INTEGER DEFAULT 1, -- 1-5 scale
    verified BOOLEAN DEFAULT 0,
    created_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### **App Settings**
```sql
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY,
    notifications_enabled BOOLEAN DEFAULT 1,
    sos_enabled BOOLEAN DEFAULT 1,
    auto_share_location BOOLEAN DEFAULT 0,
    preferred_transport TEXT DEFAULT 'walking', -- 'walking', 'driving', 'transit'
    safety_threshold INTEGER DEFAULT 40, -- Minimum safety score
    language_code TEXT DEFAULT 'en',
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### **Migration Strategy**
```typescript
const migrations = {
  '1.1': async (db: SQLite.SQLiteDatabase) => {
    await db.execAsync(`
      ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
      ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    `);
  },
  '2.0': async (db: SQLite.SQLiteDatabase) => {
    // Create new tables
    await db.execAsync(routeHistorySchema);
    await db.execAsync(safetyReportsSchema);
    await db.execAsync(userSettingsSchema);
  }
};
```

---

## 📚 Additional Resources

### **Related Documentation**
- [API Documentation](./API_DOCUMENTATION.md) - Service layer APIs
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md) - System design overview
- [SQLite Documentation](https://www.sqlite.org/docs.html) - Official SQLite docs
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) - React Native integration

### **Development Tools**
- **DB Browser for SQLite**: Visual database inspector
- **SQLite Studio**: Advanced database management
- **Expo SQLite DevTools**: In-app database inspection

### **Common Queries Reference**
```sql
-- User dashboard data
SELECT 
  u.full_name,
  p.dark_mode,
  COUNT(DISTINCT ec.id) as emergency_contacts_count,
  COUNT(DISTINCT sa.id) as saved_addresses_count
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN emergency_contacts ec ON u.id = ec.user_id
LEFT JOIN saved_addresses sa ON u.id = sa.user_id
WHERE u.id = ?
GROUP BY u.id;

-- Recent activity summary
SELECT 
  'contact' as type, name as title, created_at
  FROM emergency_contacts WHERE user_id = ?
UNION ALL
SELECT 
  'address' as type, label as title, created_at
  FROM saved_addresses WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 5;
```

---

**Database Schema Version**: 1.0  
**Last Updated**: September 2024  
**Maintained By**: SafeRoute Development Team  
**Documentation**: Complete reference with examples and best practices
