import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { PoliceResponse, ResponseAction } from '../types';

export function usePoliceActions() {
    const { officer } = useAuth();

    // Dispatch / respond to an alert
    const respondToAlert = useCallback(async (alertId: string, action: ResponseAction, note?: string) => {
        if (!officer) throw new Error('Not authenticated as officer');

        const { error } = await supabase
            .from('police_responses')
            .insert({
                alert_id: alertId,
                officer_id: officer.id,
                action,
                note: note || null,
            });

        if (error) throw error;

        // If resolving, also update the alert status
        if (action === 'RESOLVED') {
            const { error: updateErr } = await supabase
                .from('active_alerts')
                .update({
                    status: 'RESOLVED',
                    resolved_at: new Date().toISOString(),
                })
                .eq('id', alertId);

            if (updateErr) throw updateErr;
        }
    }, [officer]);

    // Fetch response history for an alert
    const getResponses = useCallback(async (alertId: string): Promise<PoliceResponse[]> => {
        const { data, error } = await supabase
            .from('police_responses')
            .select('*')
            .eq('alert_id', alertId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data as PoliceResponse[]) || [];
    }, []);

    return { respondToAlert, getResponses };
}
