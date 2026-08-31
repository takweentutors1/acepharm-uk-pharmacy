'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, sendCustomEmailVerification } from '@/lib/firebase';
import { AuthStorage } from '@acepharm/preferences';

export type UserRole = 
  | 'student' 
  | 'author' 
  | 'clinical_reviewer' 
  | 'educational_reviewer' 
  | 'copy_editor' 
  | 'content_lead' 
  | 'support_agent' 
  | 'finance_admin' 
  | 'marketing_editor' 
  | 'super_admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isAdmin: boolean;
  isReviewer: boolean;
  stage?: 'mpharm_y2' | 'mpharm_y3' | 'mpharm_y4' | 'foundation' | 'oriel' | 'prescribing';
  isPro?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, stage: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    return AuthStorage.getSavedProfile<UserProfile>();
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://acepharm-api.takweencentreuk.workers.dev';

  const fetchProfileFromD1 = async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      AuthStorage.setToken(token);

      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const savedStage = AuthStorage.getStage(firebaseUser.uid);
      
      let nextProfile: UserProfile;

      if (res.ok) {
        const data = await res.json();
        const role: UserRole = data?.user?.role || 'student';
        const isAdmin = ['content_lead', 'super_admin', 'clinical_reviewer', 'educational_reviewer', 'author', 'marketing_editor'].includes(role);
        const isReviewer = ['clinical_reviewer', 'educational_reviewer', 'content_lead', 'super_admin'].includes(role);

        nextProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: data?.user?.first_name || firebaseUser.displayName || 'Pharmacy Learner',
          role,
          isAdmin,
          isReviewer,
          stage: (savedStage as any) || 'foundation',
          isPro: true,
        };
      } else {
        // Fallback default student profile
        nextProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Pharmacy Learner',
          role: 'student',
          isAdmin: false,
          isReviewer: false,
          stage: (savedStage as any) || 'foundation',
          isPro: true,
        };
      }

      setProfile(nextProfile);
      AuthStorage.setSavedProfile(nextProfile);
    } catch {
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Pharmacy Learner',
        role: 'student',
        isAdmin: false,
        isReviewer: false,
        stage: 'foundation',
        isPro: true,
      };
      setProfile(fallbackProfile);
      AuthStorage.setSavedProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfileFromD1(firebaseUser);
      } else {
        // Check if there is no user, clear cache
        setUser(null);
        setProfile(null);
        AuthStorage.removeToken();
        AuthStorage.removeSavedProfile();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await fetchProfileFromD1(cred.user);
    }
  };

  const signUp = async (email: string, pass: string, name: string, stage: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
      AuthStorage.setStage(cred.user.uid, stage);
      await fetchProfileFromD1(cred.user);
      try {
        await sendCustomEmailVerification(cred.user);
      } catch (e) {
        console.warn('Could not dispatch verification email:', e);
      }
    }
  };

  const signOut = async () => {
    AuthStorage.removeToken();
    AuthStorage.removeSavedProfile();
    setProfile(null);
    setUser(null);
    try {
      await firebaseSignOut(auth);
    } finally {
      const marketingUrl = 
        process.env.NEXT_PUBLIC_SITE_URL || 
        process.env.NEXT_PUBLIC_MARKETING_URL || 
        'https://acepharm-marketing.pages.dev';
      window.location.href = marketingUrl;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileFromD1(user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
