// Saved addresses service — Supabase-first with SQLite offline cache
import { query, run } from './sqlite';
import { supabase } from './supabaseClient';

export type SavedAddress = {
  id: string;
  user_id: string;
  label: string; // e.g., Home, Work
  address_text: string;
  latitude: number;
  longitude: number;
  created_at?: string | number;
  updated_at?: string | number;
};

// ─── FETCH ────────────────────────────────────────────
export async function fetchSavedAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Sync cloud data to local SQLite cache
      for (const addr of data) {
        await run(
          'INSERT OR REPLACE INTO saved_addresses (id, user_id, label, address_text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [addr.id, addr.user_id, addr.label, addr.address_text, addr.latitude, addr.longitude, Date.now()]
        );
      }
      return data as SavedAddress[];
    }
  } catch (e) {
    console.log('Supabase fetch failed, using local cache:', e);
  }

  // Offline fallback: read from SQLite
  return await query<SavedAddress>(
    'SELECT id, user_id, label, address_text, latitude, longitude, created_at FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

// ─── ADD ──────────────────────────────────────────────
export async function addSavedAddress(
  userId: string,
  addr: Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<SavedAddress> {
  const now = new Date().toISOString();

  try {
    // Try Supabase first
    const { data, error } = await supabase
      .from('saved_addresses')
      .insert({
        user_id: userId,
        label: addr.label,
        address_text: addr.address_text,
        latitude: addr.latitude,
        longitude: addr.longitude,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (data && !error) {
      // Cache in SQLite
      await run(
        'INSERT OR REPLACE INTO saved_addresses (id, user_id, label, address_text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data.id, userId, addr.label, addr.address_text, addr.latitude, addr.longitude, Date.now()]
      );
      return data as SavedAddress;
    }
    if (error) throw error;
  } catch (e) {
    console.log('Supabase insert failed, saving locally:', e);
  }

  // Offline fallback: save to SQLite only
  const id = Math.random().toString(36).slice(2);
  const created_at = Date.now();
  await run(
    'INSERT INTO saved_addresses (id, user_id, label, address_text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, addr.label, addr.address_text, addr.latitude, addr.longitude, created_at]
  );
  return { id, user_id: userId, created_at, ...addr } as SavedAddress;
}

// ─── DELETE ───────────────────────────────────────────
export async function deleteSavedAddress(id: string, userId?: string) {
  if (!userId) return;

  try {
    await supabase.from('saved_addresses').delete().eq('id', id).eq('user_id', userId);
  } catch (e) {
    console.log('Supabase delete failed:', e);
  }

  // Always clean local cache too
  await run('DELETE FROM saved_addresses WHERE id = ? AND user_id = ?', [id, userId]);
}

// ─── UPDATE ───────────────────────────────────────────
export async function updateSavedAddress(
  id: string,
  patch: Partial<Omit<SavedAddress, 'id' | 'user_id'>>,
  userId?: string
): Promise<SavedAddress> {
  if (!userId) return { id, ...(patch as any) } as SavedAddress;

  const updatePayload: any = { ...patch, updated_at: new Date().toISOString() };

  try {
    const { data, error } = await supabase
      .from('saved_addresses')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (data && !error) {
      // Update local cache
      await run(
        'UPDATE saved_addresses SET label = COALESCE(?, label), address_text = COALESCE(?, address_text), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ? AND user_id = ?',
        [patch.label, patch.address_text, patch.latitude, patch.longitude, id, userId]
      );
      return data as SavedAddress;
    }
    if (error) throw error;
  } catch (e) {
    console.log('Supabase update failed, updating locally:', e);
  }

  // Offline fallback
  await run(
    'UPDATE saved_addresses SET label = COALESCE(?, label), address_text = COALESCE(?, address_text), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude) WHERE id = ? AND user_id = ?',
    [patch.label, patch.address_text, patch.latitude, patch.longitude, id, userId]
  );
  const rows = await query<SavedAddress>(
    'SELECT id, user_id, label, address_text, latitude, longitude, created_at FROM saved_addresses WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] as SavedAddress;
}
