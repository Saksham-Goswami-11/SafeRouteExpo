import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Alert } from '../types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAlertSound } from './useAlertSound';

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newAlertId, setNewAlertId] = useState<string | null>(null);
    const { playAlertSound } = useAlertSound();
    const initialLoadDone = useRef(false);

    // Fetch all alerts with profile info
    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('active_alerts')
            .select('*')
            .order('started_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setAlerts((data as Alert[]) || []);
        }
        setLoading(false);
        initialLoadDone.current = true;
    }, []);

    // Subscribe to realtime changes
    useEffect(() => {
        fetchAlerts();

        const channel = supabase
            .channel('dashboard-alerts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'active_alerts' },
                (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                    if (payload.eventType === 'INSERT') {
                        // New SOS alert — play alarm and re-fetch for profile join
                        if (initialLoadDone.current) {
                            playAlertSound();
                            setNewAlertId((payload.new as any).id);
                            setTimeout(() => setNewAlertId(null), 5000); // Clear flash after 5s
                        }
                        fetchAlerts();
                    } else if (payload.eventType === 'UPDATE') {
                        setAlerts(prev =>
                            prev.map(a =>
                                a.id === (payload.new as any).id
                                    ? { ...a, ...(payload.new as Partial<Alert>) }
                                    : a
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAlerts, playAlertSound]);

    // Resolve an alert
    const resolveAlert = useCallback(async (alertId: string) => {
        const { error } = await supabase
            .from('active_alerts')
            .update({
                status: 'RESOLVED',
                resolved_at: new Date().toISOString(),
            })
            .eq('id', alertId);

        if (error) throw error;
    }, []);

    return { alerts, loading, error, newAlertId, refetch: fetchAlerts, resolveAlert };
}
