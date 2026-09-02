'use client';

import React, { useState, useEffect } from 'react';
import { AuthStorage } from '@acepharm/preferences';

interface MarketingAuthNavProps {
  appUrl?: string;
}

export const MarketingAuthNav: React.FC<MarketingAuthNavProps> = ({
  appUrl = 'https://app.acepharmexams.co.uk',
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ displayName?: string | null; email?: string | null; role?: string } | null>(null);

  useEffect(() => {
    // Check local storage for persistent profile or auth token
    const token = AuthStorage.getToken();
    const savedProfile = AuthStorage.getSavedProfile<{ displayName?: string; email?: string; role?: string }>();
    
    if (token || savedProfile) {
      setIsLoggedIn(true);
      setProfile(savedProfile);
    }
  }, []);

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={appUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo hover:bg-indigo-deep px-4 py-2 rounded-btn shadow-xs transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Dashboard</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <a
        href={`${appUrl}/auth/login`}
        className="text-xs font-semibold text-slate hover:text-ink px-3 py-2 rounded-btn border border-border hover:border-slate transition-colors"
      >
        Log in
      </a>
      <a
        href={`${appUrl}/auth/register`}
        className="text-xs font-semibold text-white bg-indigo hover:bg-indigo-deep px-3.5 py-2 rounded-btn shadow-xs transition-all"
      >
        Start revising free
      </a>
    </div>
  );
};
