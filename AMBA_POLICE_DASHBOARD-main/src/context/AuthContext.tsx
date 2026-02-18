import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { PoliceOfficer } from '../types';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
    session: Session | null;
    officer: PoliceOfficer | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [officer, setOfficer] = useState<PoliceOfficer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            try {
                // 1. Get initial session
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(initialSession);
                    if (initialSession?.user) {
                        await fetchOfficerProfile(initialSession.user.id);
                    }
                }
            } catch (error) {
                console.error('Auth Init Error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        initAuth();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('[Auth Event]', event);

                if (mounted) {
                    setSession(newSession);

                    if (newSession?.user) {
                        // Only fetch if we don't have it or if it's a different user
                        await fetchOfficerProfile(newSession.user.id);
                    } else {
                        setOfficer(null);
                        setLoading(false);
                    }
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    async function fetchOfficerProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('police_officers')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) {
                console.warn('User is authenticated but NOT a police officer config:', error?.message);
                // Optional: Force signout if you want strict enforcement
                // await supabase.auth.signOut(); 
                // But for now, let's just not set the officer, App.tsx will handle the "Not Authorized" UI
                setOfficer(null);
            } else {
                setOfficer(data as PoliceOfficer);
            }
        } catch (e) {
            console.error('Profile fetch error:', e);
            setOfficer(null);
        }
    }

    async function signIn(email: string, password: string) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setLoading(false);
            throw error;
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
        setSession(null);
        setOfficer(null);
    }

    return (
        <AuthContext.Provider value={{ session, officer, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
