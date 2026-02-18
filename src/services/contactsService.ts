// SQLite-backed emergency contacts service
import { query, run } from './sqlite';

export type EmergencyContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation?: string;
  is_primary?: number;
  avatar_uri?: string;
  is_active_simulated?: number;
  created_at?: number;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.startsWith('+')) return `+${digits.replace(/^\+/, '')}`;
  return `+91${digits}`;
}

export async function fetchContacts(userId: string): Promise<EmergencyContact[]> {
  return await query<EmergencyContact>('SELECT id, user_id, name, phone, relation, is_primary, avatar_uri, is_active_simulated, created_at FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

export async function addContact(userId: string, payload: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>) {
  const id = Math.random().toString(36).slice(2);
  const created_at = Date.now();
  await run(
    'INSERT INTO emergency_contacts (id, user_id, name, phone, relation, is_primary, avatar_uri, is_active_simulated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, payload.name, normalizePhone(payload.phone), payload.relation || null, payload.is_primary ? 1 : 0, payload.avatar_uri || null, payload.is_active_simulated || 0, created_at]
  );
  return { id, user_id: userId, created_at, ...payload, phone: normalizePhone(payload.phone) } as EmergencyContact;
}

export async function updateContact(id: string, payload: Partial<Omit<EmergencyContact, 'id' | 'user_id'>>, userId?: string) {
  if (!userId) return { id, ...(payload as any) } as EmergencyContact;

  const fields: string[] = [];
  const values: any[] = [];

  if (payload.name !== undefined) { fields.push('name = ?'); values.push(payload.name); }
  if (payload.phone !== undefined) { fields.push('phone = ?'); values.push(normalizePhone(payload.phone)); }
  if (payload.relation !== undefined) { fields.push('relation = ?'); values.push(payload.relation); }
  if (payload.is_primary !== undefined) { fields.push('is_primary = ?'); values.push(payload.is_primary); }
  if (payload.avatar_uri !== undefined) { fields.push('avatar_uri = ?'); values.push(payload.avatar_uri); }
  if (payload.is_active_simulated !== undefined) { fields.push('is_active_simulated = ?'); values.push(payload.is_active_simulated); }

  if (fields.length === 0) return await query<EmergencyContact>('SELECT * FROM emergency_contacts WHERE id = ?', [id]).then(res => res[0]);

  values.push(id, userId);

  await run(`UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
  const rows = await query<EmergencyContact>('SELECT * FROM emergency_contacts WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] as EmergencyContact;
}

export async function deleteContact(id: string, userId?: string) {
  if (!userId) return;
  await run('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [id, userId]);
}
