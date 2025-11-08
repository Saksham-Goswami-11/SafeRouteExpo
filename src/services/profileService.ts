// SQLite-backed profile service
import { query, run } from './sqlite';

export type Profile = {
  id: string; // auth user id
  full_name?: string;
  avatar_url?: string;
  dark_mode?: boolean;
  created_at?: number;
  updated_at?: number;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const rows = await query<Profile>('SELECT user_id as id, full_name, dark_mode, created_at, updated_at FROM profiles WHERE user_id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

export async function upsertProfile(userId: string, patch: Partial<Profile>) {
  const now = Date.now();
  const existing = await getProfile(userId);
  if (existing) {
    await run('UPDATE profiles SET full_name = COALESCE(?, full_name), dark_mode = COALESCE(?, dark_mode), updated_at = ? WHERE user_id = ?', [patch.full_name, patch.dark_mode ? 1 : 0, now, userId]);
  } else {
    await run('INSERT INTO profiles (user_id, full_name, dark_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [userId, patch.full_name || null, patch.dark_mode ? 1 : 0, now, now]);
  }
  return (await getProfile(userId)) as Profile;
}
