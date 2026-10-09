'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/shell/AppShell';
import MobileSplashScreen from '@/components/MobileSplashScreen';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const isMobile = window.innerWidth < 640;
      const shouldShowSplash = sessionStorage.getItem('admin_login_splash');
      if (shouldShowSplash === 'true') {
        sessionStorage.removeItem('admin_login_splash');
        if (isMobile) {
          setShowSplash(true);
        }
      }
    } catch {}
  }, []);

  return (
    <>
      {showSplash && (
        <MobileSplashScreen
          forceShow={true}
          durationMs={2600}
          onDismiss={() => setShowSplash(false)}
        />
      )}
      <AppShell>{children}</AppShell>
    </>
  );
}
