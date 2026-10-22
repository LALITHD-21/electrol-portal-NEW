'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * ============================================================
 * EDITABLE TICKER CONFIGURATION
 * ============================================================
 * Candidate Name rules (STRICT):
 * English: Shashi Hulikuntemutt
 * Kannada: ಶಶಿ ಹುಲಿಕುಂಟೆಮಠ್
 * Never alter or auto-correct these spellings.
 */
export interface TickerItemConfig {
  id: string;
  text: string;
  isHeadline?: boolean;
}

export const TICKER_ITEMS: TickerItemConfig[] = [
  {
    id: 'item-1',
    text: 'ಮತದಾನ ದಿನಾಂಕ: 23 ಅಕ್ಟೋಬರ್ 2026 (ಶುಕ್ರವಾರ) | ಸಮಯ: ಬೆಳಿಗ್ಗೆ 8 ರಿಂದ ಸಂಜೆ 4 ರವರೆಗೆ',
    isHeadline: true, // Golden accent highlight
  },
  {
    id: 'item-2',
    text: 'Polling Day: Friday, 23 October 2026 | Time: 8:00 AM – 4:00 PM',
    isHeadline: false,
  },
];

/**
 * Premium SVG Ballot Box / Star Separator
 * Guarantees identical baseline alignment with English and Kannada typography.
 */
function BallotSeparator() {
  return (
    <span className="tkr-separator" aria-hidden="true">
      <svg
        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2L14.4 8.6L21.5 9.3L16.1 14.1L17.7 21.1L12 17.5L6.3 21.1L7.9 14.1L2.5 9.3L9.6 8.6L12 2Z" />
      </svg>
    </span>
  );
}

export default function AnnouncementTicker() {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [durationSec, setDurationSec] = useState(65);
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate gentle, easily readable speed (~38px/s) based on content width
  useEffect(() => {
    const computeSpeed = () => {
      if (trackRef.current) {
        // Track width includes duplicated sets; single loop is 50%
        const singleSetWidth = trackRef.current.scrollWidth / 2;
        if (singleSetWidth > 0) {
          const targetPxPerSec = 38; // Gentle, comfortably readable scrolling speed
          const calculatedSec = Math.max(45, Math.round(singleSetWidth / targetPxPerSec));
          setDurationSec(calculatedSec);
        }
      }
    };

    computeSpeed();
    window.addEventListener('resize', computeSpeed);
    return () => window.removeEventListener('resize', computeSpeed);
  }, []);

  // Handle Page Visibility API: pause when tab is inactive to conserve battery and memory
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (!isVisible) return null;

  // Static accessible summary for screen readers
  const screenReaderSummary = TICKER_ITEMS.map((item) => item.text).join(' • ');

  // Repeat items to ensure seamless loop width across all screen resolutions
  const loopSet = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <aside
      className="tkr-bar"
      role="region"
      aria-label="Announcements"
      style={{
        // Dynamic duration based on calculated content width
        ['--tkr-duration' as any]: `${durationSec}s`,
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Visually Hidden Accessible Screen Reader Content */}
      <div className="tkr-sr-only">
        <h2>Electoral Announcements:</h2>
        <p>{screenReaderSummary}</p>
      </div>

      {/* Scrolling Track Viewport with Edge Fade Masks */}
      <div className="tkr-viewport" aria-hidden="true">
        <div
          ref={trackRef}
          className={`tkr-track ${isPaused ? 'tkr-track-paused' : ''}`}
        >
          {/* Primary Track Set */}
          {loopSet.map((item, index) => (
            <React.Fragment key={`orig-${item.id}-${index}`}>
              <span
                className={`tkr-item ${
                  item.isHeadline ? 'tkr-item-headline' : ''
                }`}
              >
                {item.text}
              </span>
              <BallotSeparator />
            </React.Fragment>
          ))}

          {/* Seamless Duplicate Set (enables translate -50% infinite loop) */}
          {loopSet.map((item, index) => (
            <React.Fragment key={`dup-${item.id}-${index}`}>
              <span
                className={`tkr-item ${
                  item.isHeadline ? 'tkr-item-headline' : ''
                }`}
              >
                {item.text}
              </span>
              <BallotSeparator />
            </React.Fragment>
          ))}
        </div>
      </div>
    </aside>
  );
}
