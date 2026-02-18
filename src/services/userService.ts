import { run, query } from './sqlite';

export async function upsertUser(user: { id: string; email?: string | null; full_name?: string | null }) {
  const now = Date.now();
  
  // Check if user already exists
  const existingUsers = await query('SELECT id FROM users WHERE id = ?', [user.id]);
  
  if (existingUsers.length > 0) {
    // User exists - update only email and full_name (preserve password_hash)
    await run('UPDATE users SET email = COALESCE(?, email), full_name = COALESCE(?, full_name) WHERE id = ?', [
      user.email,
      user.full_name,
      user.id
    ]);
  } else {
    // User doesn't exist - this shouldn't happen in normal flow
    // Users should be created through the signup process which handles password_hash
    console.warn('Attempting to create user without password_hash. User should be created through signup.');
    throw new Error('Cannot create user without authentication. Please use the signup process.');
  }
}
