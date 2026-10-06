'use client';

import { useEffect } from 'react';

/**
 * MobileZoomDisabler
 * Completely disables pinch-to-zoom, gesture zoom, and double-tap zoom on mobile devices,
 * eliminating sudden zooms and keeping the viewport locked at 1:1 scale.
 */
export default function MobileZoomDisabler() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // 1. Prevent iOS Safari multi-touch gesture zooming (pinch-to-zoom)
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });

    // 2. Prevent multi-touch pinch on touchstart (2 or more touches)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    // 3. Prevent double-tap to zoom on legacy iOS browsers
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // If the tap target is not an input/textarea/select/button/link, prevent default
        const target = e.target as HTMLElement | null;
        const isInteractive = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a')
        );

        if (!isInteractive) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 4. Prevent Ctrl + wheel zooming (pinch-to-zoom on precision touchpads/trackpads)
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return null;
}
