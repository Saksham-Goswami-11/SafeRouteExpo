// Settings sync service — Supabase-first with SQLite offline cache
import { supabase } from './supabaseClient';
import * as sqlite from './sqlite';

export type UserSettings = {
    user_id: string;
    dark_mode: boolean;
    shake_sos_enabled: boolean;
    shake_sensitivity: number;
    notifications_enabled: boolean;
    ghost_mode: boolean;
    fake_call_contact: string | null;
    updated_at?: string;
};

const DEFAULTS: Omit<UserSettings, 'user_id'> = {
    dark_mode: true,
    shake_sos_enabled: true,
    shake_sensitivity: 1.5,
    notifications_enabled: true,
    ghost_mode: false,
    fake_call_contact: null,
};

// ─── FETCH ────────────────────────────────────────────
export async function fetchSettings(userId: string): Promise<UserSettings> {
    try {
        // Try Supabase first
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data && !error) {
            // Cache key settings locally
            await sqlite.saveSetting('dark_mode', data.dark_mode ? '1' : '0');
            await sqlite.saveSetting('ghost_mode', data.ghost_mode ? '1' : '0');
            await sqlite.saveSetting('shake_sos_enabled', data.shake_sos_enabled ? '1' : '0');
            await sqlite.saveSetting('shake_sensitivity', String(data.shake_sensitivity));
            return data as UserSettings;
        }
    } catch (e) {
        console.log('Supabase settings fetch failed, using local defaults:', e);
    }

    // Offline fallback: read from SQLite app_settings
    const darkMode = await sqlite.getSetting('dark_mode');
    const ghostMode = await sqlite.getSetting('ghost_mode');
    const shakeEnabled = await sqlite.getSetting('shake_sos_enabled');
    const shakeSensitivity = await sqlite.getSetting('shake_sensitivity');

    return {
        user_id: userId,
        dark_mode: darkMode === '1' || darkMode === null ? DEFAULTS.dark_mode : false,
        shake_sos_enabled: shakeEnabled === '0' ? false : DEFAULTS.shake_sos_enabled,
        shake_sensitivity: shakeSensitivity ? parseFloat(shakeSensitivity) : DEFAULTS.shake_sensitivity,
        notifications_enabled: DEFAULTS.notifications_enabled,
        ghost_mode: ghostMode === '1',
        fake_call_contact: DEFAULTS.fake_call_contact,
    };
}

// ─── UPDATE ───────────────────────────────────────────
export async function updateSettings(
    userId: string,
    patch: Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>
): Promise<void> {
    const updatePayload = { ...patch, updated_at: new Date().toISOString() };

    try {
        // Upsert to Supabase
        await supabase
            .from('user_settings')
            .upsert({ user_id: userId, ...updatePayload }, { onConflict: 'user_id' });
    } catch (e) {
        console.log('Supabase settings update failed:', e);
    }

    // Sync relevant keys to SQLite app_settings
    if (patch.dark_mode !== undefined) {
        await sqlite.saveSetting('dark_mode', patch.dark_mode ? '1' : '0');
    }
    if (patch.ghost_mode !== undefined) {
        await sqlite.saveSetting('ghost_mode', patch.ghost_mode ? '1' : '0');
    }
    if (patch.shake_sos_enabled !== undefined) {
        await sqlite.saveSetting('shake_sos_enabled', patch.shake_sos_enabled ? '1' : '0');
    }
    if (patch.shake_sensitivity !== undefined) {
        await sqlite.saveSetting('shake_sensitivity', String(patch.shake_sensitivity));
    }
}
