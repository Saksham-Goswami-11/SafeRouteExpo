import { initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD1546iT67TLA8_uPM_3z0uUJaR5XICqsY",
  authDomain: "amba-safety.firebaseapp.com",
  projectId: "amba-safety",
  storageBucket: "amba-safety.firebasestorage.app",
  messagingSenderId: "927322494760",
  appId: "1:927322494760:web:cb273548f5b094aa05a21d",
  measurementId: "G-JW376JN11V"
};

// Initialize App
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence (Critical for maintaining login state)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };
