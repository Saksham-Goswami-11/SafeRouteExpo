// SQLite-backed emergency contacts service
import { query, run } from './sqlite';

export type EmergencyContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relation?: string;
  is_primary?: number;
  created_at?: number;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.startsWith('+' )) return `+${digits.replace(/^\+/, '')}`;
  return `+91${digits}`;
}

export async function fetchContacts(userId: string): Promise<EmergencyContact[]> {
  return await query<EmergencyContact>('SELECT id, user_id, name, phone, relation, is_primary, created_at FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

export async function addContact(userId: string, payload: Omit<EmergencyContact, 'id' | 'user_id' | 'created_at'>) {
  const id = Math.random().toString(36).slice(2);
  const created_at = Date.now();
  await run('INSERT INTO emergency_contacts (id, user_id, name, phone, relation, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, userId, payload.name, normalizePhone(payload.phone), payload.relation || null, payload.is_primary ? 1 : 0, created_at]);
  return { id, user_id: userId, created_at, ...payload, phone: normalizePhone(payload.phone) } as EmergencyContact;
}

export async function updateContact(id: string, payload: Partial<Omit<EmergencyContact, 'id' | 'user_id'>>, userId?: string) {
  if (!userId) return { id, ...(payload as any) } as EmergencyContact;
  await run('UPDATE emergency_contacts SET name = COALESCE(?, name), phone = COALESCE(?, phone), relation = COALESCE(?, relation), is_primary = COALESCE(?, is_primary) WHERE id = ? AND user_id = ?', [payload.name, payload.phone ? normalizePhone(payload.phone) : undefined, payload.relation, typeof payload.is_primary === 'number' ? payload.is_primary : undefined, id, userId]);
  const rows = await query<EmergencyContact>('SELECT id, user_id, name, phone, relation, is_primary, created_at FROM emergency_contacts WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] as EmergencyContact;
}

export async function deleteContact(id: string, userId?: string) {
  if (!userId) return;
  await run('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [id, userId]);
}
