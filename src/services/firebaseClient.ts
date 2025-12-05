import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  authenticateUser,
  createUser as createUserInDB,
  createSession,
  validateSession,
  invalidateSession,
  getUserByEmail
} from './sqlite';

// Storage key for session token
const SESSION_TOKEN_KEY = 'saferoute_session_token';

// Current user state
let currentUser: User | null = null;
let authStateListeners: Array<(user: User | null) => void> = [];

// Notify all listeners about auth state changes
function notifyAuthStateChange(user: User | null) {
  currentUser = user;
  authStateListeners.forEach(callback => callback(user));
}

// Initialize auth state from stored session
export async function initializeAuth(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      const user = await validateSession(token);
      if (user) {
        notifyAuthStateChange(user);
      } else {
        // Invalid session, clean up
        await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      }
    }
  } catch (error) {
    console.warn('Error initializing auth:', error);
  }
}

// Auth functions compatible with Firebase API (now using SQLite backend)
export const onAuthStateChanged = (_auth: any, callback: (user: User | null) => void) => {
  authStateListeners.push(callback);
  // Immediately call with current user
  callback(currentUser);

  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter(listener => listener !== callback);
  };
};

export const signInWithEmailAndPassword = async (_auth: any, email: string, password: string) => {
  try {
    const user = await authenticateUser(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const token = await createSession(user.id);
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);

    notifyAuthStateChange(user);
    return { user };
  } catch (error) {
    throw error;
  }
};

export const createUserWithEmailAndPassword = async (_auth: any, email: string, password: string, fullName?: string) => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const user = await createUserInDB(email, password, fullName || email.split('@')[0]);
    const token = await createSession(user.id);
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);

    notifyAuthStateChange(user);
    return { user };
  } catch (error) {
    throw error;
  }
};

export const signOut = async (_auth?: any) => {
  try {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      await invalidateSession(token);
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    }
    notifyAuthStateChange(null);
  } catch (error) {
    console.warn('Error signing out:', error);
  }
};

export const signInWithGoogle = async (userInfo?: { email: string; name: string; photo?: string }) => {
  try {
    // Use real user info if provided, otherwise fallback to mock (or error)
    const email = userInfo?.email || 'google_user@example.com';
    const password = 'social_login_password'; // Placeholder
    const fullName = userInfo?.name || 'Google User';

    // Check if user exists, if not create
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUserInDB(email, password, fullName);
    }

    const token = await createSession(user.id);
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);

    notifyAuthStateChange(user);
    return { user };
  } catch (error) {
    throw error;
  }
};

export const signInWithFacebook = async (userInfo?: { email: string; name: string; photo?: string }) => {
  try {
    // Use real user info if provided
    const email = userInfo?.email || 'facebook_user@example.com';
    const password = 'social_login_password';
    const fullName = userInfo?.name || 'Facebook User';

    // Check if user exists, if not create
    let user = await getUserByEmail(email);
    if (!user) {
      user = await createUserInDB(email, password, fullName);
    }

    const token = await createSession(user.id);
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);

    notifyAuthStateChange(user);
    return { user };
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = () => currentUser;

// For compatibility with existing code
export const getAuthInstance = () => ({
  currentUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
});

// Initialize auth when module loads
initializeAuth();
