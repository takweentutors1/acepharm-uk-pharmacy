'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const Spinner = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen bg-canvas">
    <Loader2 className="w-8 h-8 text-indigo animate-spin" />
  </div>
);

/**
 * Legacy landing page for Firebase-issued action links (?mode=verifyEmail|resetPassword&oobCode=...)
 * sent before the custom-auth cutover. Firebase's oobCode is meaningless to the new API, so this can
 * only redirect to the new token-based pages, which will show "link invalid/expired" for old codes.
 * Remove once the migration window has fully passed (see docs/adr — custom auth rollout).
 */
function LegacyAuthActionRedirect() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const continueUrl = searchParams.get('continueUrl');
    const target = mode === 'resetPassword' ? '/auth/reset' : '/auth/verify';
    const qs = continueUrl ? `?continueUrl=${encodeURIComponent(continueUrl)}` : '';
    window.location.replace(`${target}${qs}`);
  }, [searchParams]);

  return <Spinner />;
}

export default function AuthActionHandlerPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LegacyAuthActionRedirect />
    </Suspense>
  );
}
