/**
 * Firebase Client SDK Configuration.
 * Used for Google OAuth login from frontend.
 *
 * Setup:
 * 1. Firebase Console → Project Settings → Your apps → Web
 * 2. Copy config values to .env (VITE_FIREBASE_*)
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type UserCredential,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Login with Google via Firebase popup.
 * Returns Firebase ID Token (to send to backend for verification).
 */
export async function signInWithGoogle(): Promise<{ idToken: string; user: { email: string; displayName: string; photoURL: string } }> {
  const result: UserCredential = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    user: {
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      photoURL: result.user.photoURL || '',
    },
  };
}

/**
 * Sign out from Firebase (clears firebase session only).
 */
export async function firebaseSignOut(): Promise<void> {
  await signOut(auth);
}

export { auth };
