// ─── Alert types (from active_alerts + profiles join) ────────────

export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface Alert {
    id: string;
    user_id: string;
    status: AlertStatus;
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    speed: number | null;
    battery: number | null;
    address_snapshot: string | null;
    started_at: string;
    resolved_at: string | null;
    last_updated: string;
    user_name: string | null;
    user_email: string | null;
    // Joined from profiles
    profiles?: {
        full_name: string | null;
        phone_number: string | null;
        avatar_url: string | null;
    } | null;
}

// ─── Police officer (from police_officers table) ──────────────────

export interface PoliceOfficer {
    id: string;
    badge_number: string;
    full_name: string;
    rank: string;
    station: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string;
}

// ─── Police response (from police_responses table) ────────────────

export type ResponseAction = 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED';

export interface PoliceResponse {
    id: string;
    alert_id: string;
    officer_id: string;
    action: ResponseAction;
    note: string | null;
    created_at: string;
}

// ─── Audio evidence (from audio_evidence table) ───────────────────

export interface AudioEvidence {
    id: string;
    user_id: string;
    alert_id: string | null;
    storage_path: string;
    duration: string | null;
    recorded_at: string;
}
