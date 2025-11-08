// SQLite-backed address service
import { query, run } from './sqlite';

export type SavedAddress = {
  id: string;
  user_id: string;
  label: string; // e.g., Home, Work
  address_text: string;
  latitude: number;
  longitude: number;
  created_at?: number;
};

export async function fetchSavedAddresses(userId: string): Promise<SavedAddress[]> {
  return await query<SavedAddress>('SELECT id, user_id, label, address_text, latitude, longitude, created_at FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

export async function addSavedAddress(userId: string, addr: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>) {
  const id = Math.random().toString(36).slice(2);
  const created_at = Date.now();
  await run('INSERT INTO saved_addresses (id, user_id, label, address_text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, addr.label, addr.address_text, addr.latitude, addr.longitude, created_at]);
  return { id, user_id: userId, created_at, ...addr } as SavedAddress;
}

export async function deleteSavedAddress(id: string, userId?: string) {
  if (!userId) return;
  await run('DELETE FROM saved_addresses WHERE id = ? AND user_id = ?', [id, userId]);
}

export async function updateSavedAddress(id: string, patch: Partial<Omit<SavedAddress, 'id' | 'user_id'>>, userId?: string) {
  if (!userId) return { id, ...(patch as any) } as SavedAddress;
  await run('UPDATE saved_addresses SET label = COALESCE(?, label), address_text = COALESCE(?, address_text), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ? AND user_id = ?', [patch.label, patch.address_text, patch.latitude, patch.longitude, id, userId]);
  const rows = await query<SavedAddress>('SELECT id, user_id, label, address_text, latitude, longitude, created_at FROM saved_addresses WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] as SavedAddress;
}
