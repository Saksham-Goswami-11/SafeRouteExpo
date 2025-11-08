import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '../services/firebaseClient';
import { getProfile, Profile, upsertProfile } from '../services/profileService';
import { User } from '../services/sqlite';

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(null, async (u) => {
      setUser(u ?? null);
      // User data is already properly stored in database from signup/login process
      // No need to upsert here as it causes password_hash constraint issues
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    refreshProfile();
  }, [user?.id]);

  const refreshProfile = async () => {
    if (!user) return;
    const data = await getProfile(user.id);
    setProfile(data);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(null, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(null, email, password);
      const u = cred.user;
      if (u) {
        // User is already created by createUserWithEmailAndPassword with proper password_hash
        // Just create the profile
        await upsertProfile(u.id, { full_name: fullName || u.full_name });
        await refreshProfile();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) return;
    const updated = await upsertProfile(user.id, patch);
    setProfile(updated);
  };

  const logout = async () => {
    await signOut();
  };

  const value = useMemo(
    () => ({ user, profile, loading, login, signup, logout, refreshProfile, updateProfile }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
