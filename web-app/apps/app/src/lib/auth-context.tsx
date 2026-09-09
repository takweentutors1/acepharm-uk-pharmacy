'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthStorage } from '@acepharm/preferences';
import { apiClient } from '@/lib/api-client';
import * as authClient from '@/lib/auth-client';
import type { AuthUser } from '@/lib/auth-client';

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
  user: AuthUser | null;
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

function deriveProfile(data: any, uid: string): UserProfile {
  const role: UserRole = data?.user?.role || 'student';
  const isAdmin = ['content_lead', 'super_admin', 'clinical_reviewer', 'educational_reviewer', 'author', 'marketing_editor'].includes(role);
  const isReviewer = ['clinical_reviewer', 'educational_reviewer', 'content_lead', 'super_admin'].includes(role);
  const savedStage = AuthStorage.getStage(uid);

  return {
    uid,
    email: data?.user?.email ?? null,
    displayName: data?.user?.first_name || 'Pharmacy Learner',
    role,
    isAdmin,
    isReviewer,
    stage: (savedStage as any) || 'foundation',
    isPro: true,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    return AuthStorage.getSavedProfile<UserProfile>();
  });
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const token = AuthStorage.getToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient.get('/api/v1/auth/me');
      const nextUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        role: data.user.role,
        status: data.user.status,
        emailVerifiedAt: data.user.email_verified_at,
      };
      const nextProfile = deriveProfile(data, nextUser.id);

      setUser(nextUser);
      setProfile(nextProfile);
      AuthStorage.setSavedProfile(nextProfile);
    } catch {
      // Token invalid/expired and the api-client's own refresh-and-retry also failed.
      authClient.clearSession();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, pass: string) => {
    await authClient.apiSignIn(email, pass);
    await loadSession();
  };

  const signUp = async (email: string, pass: string, name: string, stage: string) => {
    const res = await authClient.apiSignUp(email, pass, name);
    AuthStorage.setStage(res.user.id, stage);
    await loadSession();
  };

  const signOut = async () => {
    setProfile(null);
    setUser(null);
    try {
      await authClient.apiLogout();
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
      await loadSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
