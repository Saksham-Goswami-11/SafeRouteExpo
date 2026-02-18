import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseClient';
import {
  User as SqliteUser,
  createUser as createLocalUser,
  authenticateUser as authenticateLocalUser,
  getUserByEmail
} from '../services/sqlite';
import { Profile, getProfile, upsertProfile } from '../services/profileService'; // Assuming this service exists or using local fallback logic
import * as WebBrowser from 'expo-web-browser';

// Defining a unified User type for the app to use
// It can be a Firebase User or a SQLite User structure
// We'll primarily rely on the structure demanded by the app
export type AppUser = {
  id: string;
  email: string | null;
  fullName?: string;
};

export type AuthContextType = {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Detect Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase Login Detected
        const appUser: AppUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
        };
        setUser(appUser);
        await loadUserProfile(appUser.id);
      } else {
        // No Firebase User, might be local?
        // For now, if firebase says no, we assume logged out unless we manually set local user
        // But usually onAuthStateChanged is the source of truth for "Online" session.
        // If offline, this listener might not fire or might fire null. 
        // We'll rely on manual login for offline fallback.
        if (!user) setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Try Firestore first
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as Profile);
      } else {
        // Fallback to local profileService
        const localProfile = await getProfile(userId);
        setProfile(localProfile);
      }
    } catch (e) {
      console.log("Error loading profile", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Try Firebase Login
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase Login Success');
      // onAuthStateChanged will handle the rest
    } catch (firebaseError: any) {
      console.log('Firebase Login Failed', firebaseError.code);

      // 2. Offline Fallback: Try SQLite
      try {
        console.log('Attempting Local Login...');
        const localUser = await authenticateLocalUser(email, password);
        if (localUser) {
          const appUser: AppUser = {
            id: localUser.id,
            email: localUser.email,
            fullName: localUser.full_name
          };
          setUser(appUser);
          await loadUserProfile(localUser.id);
        } else {
          throw new Error("Invalid credentials (Offline & Online)");
        }
      } catch (localError) {
        throw localError; // Propagate error if both fail
      }
    } finally {
      // Loading set to false in onAuthStateChanged or here if local
      if (!auth.currentUser) setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string = '') => {
    setLoading(true);
    try {
      // 1. Firebase Signup
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUserId = cred.user.uid;

      // 2. Create Firestore Document
      await setDoc(doc(db, 'users', firebaseUserId), {
        email: email.toLowerCase(),
        fullName,
        createdAt: Date.now(),
        phoneNumber: ''
      });

      // 3. SQLite Backup
      // We check if it exists locally to avoid unique constraint errors?
      // sqlite.createUser handles insert. 
      // NOTE: This generates a DIFFERENT ID locally. 
      // Ideally we'd valid sync, but for "Backup" this suffices for now.
      const existing = await getUserByEmail(email);
      if (!existing) {
        await createLocalUser(email, password, fullName);
      }

      // 4. Force Profile Refresh
      await loadUserProfile(firebaseUserId);

    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const refreshProfile = async () => {
    if (user) await loadUserProfile(user.id);
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) return;
    // Update local logic for now or implement firestore update
    // await upsertProfile(user.id, patch);

    // Update Firestore if online
    try {
      await setDoc(doc(db, 'users', user.id), patch, { merge: true });
    } catch (e) {
      console.warn("Could not sync profile to cloud");
    }

    // Refresh local view
    setProfile(prev => prev ? ({ ...prev, ...patch }) : null);
  };

  const loginWithGoogle = async () => {
    console.warn("Google Login not yet fully refactored for new provider");
  };
  const loginWithFacebook = async () => {
    console.warn("Facebook Login not yet fully refactored");
  };

  const value = useMemo(
    () => ({ user, profile, loading, login, signup, loginWithGoogle, loginWithFacebook, logout, refreshProfile, updateProfile }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
