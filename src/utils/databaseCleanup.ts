import { getDB, query, run } from '../services/sqlite';

/**
 * Database cleanup utility to fix common issues and corrupted data
 */
export class DatabaseCleanup {
  
  /**
   * Clean up users with NULL password_hash (corrupted entries)
   */
  static async cleanupCorruptedUsers() {
    try {
      console.log('Starting database cleanup...');
      
      // Find users with NULL password_hash
      const corruptedUsers = await query(
        'SELECT id, email FROM users WHERE password_hash IS NULL OR password_hash = ""'
      );
      
      if (corruptedUsers.length > 0) {
        console.log(`Found ${corruptedUsers.length} corrupted user records`);
        
        // Delete corrupted user records and related data
        for (const user of corruptedUsers) {
          await this.deleteUserAndRelatedData(user.id);
          console.log(`Cleaned up corrupted user: ${user.email}`);
        }
      }
      
      // Clean up orphaned sessions
      await this.cleanupOrphanedSessions();
      
      // Clean up orphaned profiles
      await this.cleanupOrphanedProfiles();
      
      // Clean up orphaned contacts
      await this.cleanupOrphanedContacts();
      
      // Clean up orphaned addresses
      await this.cleanupOrphanedAddresses();
      
      console.log('Database cleanup completed successfully');
      
    } catch (error) {
      console.error('Database cleanup failed:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user and all related data
   */
  static async deleteUserAndRelatedData(userId: string) {
    const db = await getDB();
    
    try {
      // Start transaction
      await db.execAsync('BEGIN TRANSACTION');
      
      // Delete in correct order to respect foreign key constraints
      await run('DELETE FROM auth_sessions WHERE user_id = ?', [userId]);
      await run('DELETE FROM emergency_contacts WHERE user_id = ?', [userId]);
      await run('DELETE FROM saved_addresses WHERE user_id = ?', [userId]);
      await run('DELETE FROM profiles WHERE user_id = ?', [userId]);
      await run('DELETE FROM users WHERE id = ?', [userId]);
      
      // Commit transaction
      await db.execAsync('COMMIT');
      
    } catch (error) {
      // Rollback on error
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * Clean up expired auth sessions
   */
  static async cleanupExpiredSessions() {
    const now = Date.now();
    const result = await run('DELETE FROM auth_sessions WHERE expires_at < ?', [now]);
    console.log('Cleaned up expired sessions');
    return result;
  }
  
  /**
   * Clean up orphaned auth sessions
   */
  static async cleanupOrphanedSessions() {
    const orphanedSessions = await query(`
      SELECT s.id FROM auth_sessions s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedSessions.length > 0) {
      await run(`
        DELETE FROM auth_sessions 
        WHERE id IN (${orphanedSessions.map(() => '?').join(',')})
      `, orphanedSessions.map(s => s.id));
      
      console.log(`Cleaned up ${orphanedSessions.length} orphaned sessions`);
    }
  }
  
  /**
   * Clean up orphaned profiles
   */
  static async cleanupOrphanedProfiles() {
    const orphanedProfiles = await query(`
      SELECT p.user_id FROM profiles p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedProfiles.length > 0) {
      await run(`
        DELETE FROM profiles 
        WHERE user_id IN (${orphanedProfiles.map(() => '?').join(',')})
      `, orphanedProfiles.map(p => p.user_id));
      
      console.log(`Cleaned up ${orphanedProfiles.length} orphaned profiles`);
    }
  }
  
  /**
   * Clean up orphaned emergency contacts
   */
  static async cleanupOrphanedContacts() {
    const orphanedContacts = await query(`
      SELECT ec.id FROM emergency_contacts ec 
      LEFT JOIN users u ON ec.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedContacts.length > 0) {
      await run(`
        DELETE FROM emergency_contacts 
        WHERE id IN (${orphanedContacts.map(() => '?').join(',')})
      `, orphanedContacts.map(c => c.id));
      
      console.log(`Cleaned up ${orphanedContacts.length} orphaned contacts`);
    }
  }
  
  /**
   * Clean up orphaned saved addresses
   */
  static async cleanupOrphanedAddresses() {
    const orphanedAddresses = await query(`
      SELECT sa.id FROM saved_addresses sa 
      LEFT JOIN users u ON sa.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedAddresses.length > 0) {
      await run(`
        DELETE FROM saved_addresses 
        WHERE id IN (${orphanedAddresses.map(() => '?').join(',')})
      `, orphanedAddresses.map(a => a.id));
      
      console.log(`Cleaned up ${orphanedAddresses.length} orphaned addresses`);
    }
  }
  
  /**
   * Validate database integrity
   */
  static async validateDatabaseIntegrity() {
    try {
      const db = await getDB();
      
      // Run SQLite integrity check
      const integrityResult = await db.getAllAsync('PRAGMA integrity_check');
      
      // Run foreign key check
      const fkResult = await db.getAllAsync('PRAGMA foreign_key_check');
      
      console.log('Database integrity check:', integrityResult);
      console.log('Foreign key check:', fkResult);
      
      return {
        integrity: integrityResult,
        foreignKeys: fkResult,
        isValid: (integrityResult[0] as any)?.integrity_check === 'ok' && fkResult.length === 0
      };
      
    } catch (error) {
      console.error('Database validation failed:', error);
      return { isValid: false, error };
    }
  }
  
  /**
   * Get database statistics
   */
  static async getDatabaseStats() {
    try {
      const stats = await Promise.all([
        query('SELECT COUNT(*) as count FROM users'),
        query('SELECT COUNT(*) as count FROM auth_sessions'),
        query('SELECT COUNT(*) as count FROM profiles'),
        query('SELECT COUNT(*) as count FROM emergency_contacts'),
        query('SELECT COUNT(*) as count FROM saved_addresses'),
      ]);
      
      return {
        users: stats[0][0].count,
        sessions: stats[1][0].count,
        profiles: stats[2][0].count,
        contacts: stats[3][0].count,
        addresses: stats[4][0].count,
      };
      
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }
  
  /**
   * Reset database (DANGER: This will delete all data)
   */
  static async resetDatabase() {
    console.warn('WARNING: Resetting entire database!');
    
    try {
      const db = await getDB();
      
      // Drop all tables
      await db.execAsync(`
        DROP TABLE IF EXISTS saved_addresses;
        DROP TABLE IF EXISTS emergency_contacts;
        DROP TABLE IF EXISTS profiles;
        DROP TABLE IF EXISTS auth_sessions;
        DROP TABLE IF EXISTS users;
      `);
      
      // Recreate tables by calling initDB
      const { initDB } = await import('../services/sqlite');
      await initDB();
      
      console.log('Database reset completed');
      
    } catch (error) {
      console.error('Database reset failed:', error);
      throw error;
    }
  }
}

/**
 * Run database cleanup on app startup (safe operations only)
 */
export async function runStartupCleanup() {
  try {
    // Clean up expired sessions
    await DatabaseCleanup.cleanupExpiredSessions();
    
    // Clean up corrupted users (only if they have NULL password_hash)
    await DatabaseCleanup.cleanupCorruptedUsers();
    
  } catch (error) {
    console.warn('Startup cleanup failed:', error);
    // Don't throw - app should still start even if cleanup fails
  }
}