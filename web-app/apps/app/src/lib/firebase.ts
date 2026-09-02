import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  type ActionCodeSettings,
  type User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBdwa5chw66W854gxwGu-ooNjR6zmZiZ5Y',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'acepharm-uk.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'acepharm-uk',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'acepharm-uk.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1066048447991',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1066048447991:web:5707a72f78d3586dc63af2',
};

// Initialize Firebase safely for SSR
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

import { apiClient } from './api-client';

/**
 * Returns dynamic ActionCodeSettings that redirect the learner directly to our
 * custom-designed /auth/action router without requiring manual Firebase Console action URL customization.
 */
export function getCustomActionCodeSettings(continuePath: string = '/session/new'): ActionCodeSettings {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.acepharmexams.co.uk';
  return {
    url: `${origin}/auth/action?continueUrl=${encodeURIComponent(continuePath)}`,
    handleCodeInApp: true,
  };
}

/**
 * Sends a password reset email via Hostinger SMTP using our custom design-system template.
 */
export async function sendCustomPasswordResetEmail(email: string, continuePath?: string) {
  try {
    const res = await apiClient.post('/api/v1/auth/send-custom-password-reset', {
      email,
    });
    return res;
  } catch (err) {
    // Fallback to client SDK if API backend is temporarily unreachable
    const actionCodeSettings = getCustomActionCodeSettings(continuePath);
    return firebaseSendPasswordResetEmail(auth, email, actionCodeSettings);
  }
}

/**
 * Sends an email verification link via Hostinger SMTP using our custom design-system template.
 */
export async function sendCustomEmailVerification(user: User, continuePath?: string) {
  try {
    if (!user.email) return;
    const res = await apiClient.post('/api/v1/auth/send-custom-verification', {
      email: user.email,
      name: user.displayName || undefined,
    });
    return res;
  } catch (err) {
    // Fallback to client SDK if API backend is temporarily unreachable
    const actionCodeSettings = getCustomActionCodeSettings(continuePath);
    return firebaseSendEmailVerification(user, actionCodeSettings);
  }
}
