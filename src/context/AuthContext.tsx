import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithGoogle, signInWithFacebook } from '../services/firebaseClient';
import { getProfile, Profile, upsertProfile } from '../services/profileService';
import { User } from '../services/sqlite';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType, makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export type AuthContextType = {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- GOOGLE AUTH REQUEST ---
  // We are using manual flow because the hook is failing to initialize with tunnel
  const [googleRequest, setGoogleRequest] = useState<any>(null); // Placeholder to satisfy effect dependency if needed, or remove effect
  const [googleResponse, setGoogleResponse] = useState<any>(null);

  // --- FACEBOOK AUTH REQUEST ---
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: (Constants.expoConfig as any)?.facebookAppId || 'YOUR_FACEBOOK_APP_ID',
    responseType: ResponseType.Token,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(null, async (u) => {
      setUser(u ?? null);
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

  // Handle Google Response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.accessToken) {
        fetchGoogleUserInfo(authentication.accessToken);
      }
    }
  }, [googleResponse]);

  // Handle Facebook Response
  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { authentication } = fbResponse;
      if (authentication?.accessToken) {
        fetchFacebookUserInfo(authentication.accessToken);
      }
    }
  }, [fbResponse]);

  const fetchGoogleUserInfo = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await response.json();
      // user has email, name, picture
      await signInWithGoogle({
        email: user.email,
        name: user.name,
        photo: user.picture,
      });
    } catch (error) {
      console.error('Google User Info Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacebookUserInfo = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture.type(large)`);
      const user = await response.json();
      // user has email, name, picture
      await signInWithFacebook({
        email: user.email,
        name: user.name,
        photo: user.picture?.data?.url,
      });
    } catch (error) {
      console.error('Facebook User Info Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const cred = await createUserWithEmailAndPassword(null, email, password, fullName);
      const u = cred.user;
      if (u) {
        await refreshProfile();
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const clientId = '177501548511-qjrlvbc94needg9jhs5pisdmj4vffcss.apps.googleusercontent.com';
      // Hardcoded to match Google Cloud Console exactly
      const redirectUri = 'https://auth.expo.io/@saksham_goswami/SafeRouteExpo';
      // Simplify return URL to root to avoid path issues
      const returnUrl = Linking.createURL('');

      console.log('Initiating Google Login...');
      console.log('Redirect URI (for Google):', redirectUri);
      console.log('Return URL (for Expo Proxy):', returnUrl);

      // Expo Auth Proxy expects state to be a JSON string with returnUrl
      const state = JSON.stringify({ returnUrl });
      console.log('State param:', state);

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=openid%20profile%20email&state=${encodeURIComponent(state)}`;

      // Open browser and wait for redirect to the returnUrl (tunnel URL)
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        // Extract token from URL
        const params = new URLSearchParams(result.url.split('#')[1]);
        const accessToken = params.get('access_token');

        if (accessToken) {
          console.log('Got Access Token:', accessToken);
          await fetchGoogleUserInfo(accessToken);
        }
      } else {
        console.log('Google Login Cancelled or Failed:', result);
      }
    } catch (e) {
      console.error('Google Login Error', e);
    }
  };

  const loginWithFacebook = async () => {
    try {
      if (!fbRequest) {
        console.warn('Facebook Auth Request not ready yet');
        return;
      }
      await fbPromptAsync();
    } catch (e) {
      console.error('Facebook Login Error', e);
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
