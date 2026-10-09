'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Printer, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SearchResultRow } from '@/features/search/types';
import { formatEpicForDisplay } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber } from '@/lib/boothMaster';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface VoterSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  elector: SearchResultRow | null;
  candidateName?: string;
  candidateRole?: string;
  constituencyTitle?: string;
  voterCountText?: string;
  candidatePhotoUrl?: string;
  partyLogoUrl?: string;
}

export function VoterSlipModal({
  isOpen,
  onClose,
  elector,
  candidateName,
  candidateRole,
  constituencyTitle,
  voterCountText,
  candidatePhotoUrl = '/candidate-avatar.jpg',
  partyLogoUrl = '/inc-logo.png',
}: VoterSlipModalProps) {
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const displayCandidate =
    language === 'kn' ? t.candidateName : (candidateName || t.candidateName);
  const displayRole =
    language === 'kn' ? t.candidateRole : (candidateRole || t.candidateRole);
  const displayConstituency =
    language === 'kn' ? t.constituencyTitle : (constituencyTitle || t.constituencyTitle);
  const displayVoterCount =
    language === 'kn' ? t.voterCountText : (voterCountText || t.voterCountText);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('voter-slip-open');
      return () => {
        document.body.classList.remove('voter-slip-open');
      };
    }
  }, [isOpen]);

  if (!isOpen || !elector) return null;
  if (!mounted) return null;

  // Resolve guaranteed location and serial number
  const loc = resolveElectorLocation(elector);
  const resolvedSerial = resolveElectorSerialNumber(elector);

  const partNo = elector.part_number || '1';
  const serialNo = resolvedSerial;
  const electorName = elector.name || '—';
  const relativeName = elector.relative_name || '—';
  const epic = formatEpicForDisplay(elector.epic_number || '');
  const talukCity = elector.taluk || loc.taluk || loc.district || 'Tumkur';
  const areaHobli = [
    elector.polling_station_name,
    elector.village || elector.address,
  ].filter(Boolean).join(' · ') || `${loc.taluk}, ${loc.district}`;

  // Format WhatsApp Share text
  const shareMessage = `*ಮತದಾರರ ಮಾಹಿತಿ ಚೀಟಿ / Voter Information Slip*
━━━━━━━━━━━━━━━━━━━
👤 *ಹೆಸರು / Name:* ${electorName}
👨‍👩‍👧 *ತಂದೆ/ತಾಯಿ/ಪತಿ:* ${relativeName}
🆔 *EPIC No:* ${epic}
🏛️ *ಭಾಗ ಸಂಖ್ಯೆ / Part No:* ${partNo}
🔢 *ಕ್ರಮ ಸಂಖ್ಯೆ / Serial No:* ${serialNo}
📍 *ತಾಲ್ಲೂಕು / Taluk:* ${talukCity}
🏢 *ಪ್ರದೇಶ / Booth:* ${areaHobli}
━━━━━━━━━━━━━━━━━━━
Vote on polling day!`;

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  // Dedicated single-page high-precision print generator
  const handlePrint = () => {
    if (!slipRef.current) {
      window.print();
      return;
    }

    try {
      // Remove any previously created print iframe
      const existingFrame = document.getElementById('voter-slip-print-frame');
      if (existingFrame) {
        existingFrame.remove();
      }

      // Create an isolated iframe for clean single-page printing
      const printFrame = document.createElement('iframe');
      printFrame.id = 'voter-slip-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (!frameDoc || !printFrame.contentWindow) {
        window.print();
        return;
      }

      // Collect all stylesheets and style tags
      let stylesHtml = '';
      document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
        stylesHtml += node.outerHTML;
      });

      const slipHtml = slipRef.current.outerHTML;

      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Voter Information Slip - ${epic || 'Elector'}</title>
    ${stylesHtml}
    <style>
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
      }
      body {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        padding-top: 6mm !important;
      }
      .print-voter-slip {
        width: 145mm !important;
        max-width: 145mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: 2px solid #2563eb !important;
        border-radius: 18px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .print-voter-slip img {
        display: block !important;
        max-width: 100% !important;
      }
    </style>
  </head>
  <body>
    ${slipHtml}
  </body>
</html>`);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print error, falling back to window.print():', e);
          window.print();
        } finally {
          setTimeout(() => {
            printFrame.remove();
          }, 3000);
        }
      };

      // Allow brief moment for images & fonts to paint inside the frame
      setTimeout(triggerPrint, 350);
    } catch (err) {
      console.error('Print preparation error, using fallback:', err);
      window.print();
    }
  };

  // High-Resolution 100% Identical Image Generator for "Save Image"
  const handleSaveImage = async () => {
    if (!slipRef.current) return;
    try {
      setIsGenerating(true);

      // Warm-up pass to resolve webfonts and images into the DOM
      await toPng(slipRef.current, { pixelRatio: 1, backgroundColor: '#ffffff' });

      // High-resolution capture at 2.5x pixel ratio (crystal clear 4K HD output identical to on-screen preview & print)
      const dataUrl = await toPng(slipRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        quality: 0.98,
      });

      const cleanEpic = (elector.epic_number || '').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `VoterSlip_${cleanEpic || 'Elector'}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate high-resolution voter slip image:', err);
      // Fallback gracefully to browser print if export encounters sandbox restrictions
      handlePrint();
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div id="voter-slip-modal-portal" className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn my-auto">
        {/* Top Handle bar (Mobile) & Header */}
        <div className="relative pt-3 px-4 pb-2 flex items-center justify-between border-b border-slate-100 no-print">
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            {language === 'kn' ? 'ಮತದಾರರ ಸ್ಲಿಪ್ ಡೌನ್‌ಲೋಡ್' : 'Download voter slip'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Slip Content Area */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Printable / Visual Slip Card (Identical in Preview, Downloaded PNG, and Printed Page) */}
          <div
            ref={slipRef}
            className="print-voter-slip rounded-2xl border-2 border-blue-200/90 overflow-hidden shadow-soft-sm bg-white"
          >
            {/* Top Royal Blue Header Banner matching CandidateHeroBanner.tsx */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#0284c7] text-white p-4 sm:p-5 border-b border-blue-400/40">
              {/* Subtle Indian National Congress Tricolor Accent Stripe at Top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38] opacity-90 z-10" />

              {/* Official Indian National Congress Tricolor Flag Background Integration */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                {/* Congress Tricolor Flag Image - Shifted to the right side away from candidate text */}
                <div className="absolute right-0 top-0 bottom-0 w-3/4 sm:w-2/3 h-full opacity-20 sm:opacity-25 translate-x-12 sm:translate-x-18">
                  <img
                    src="/congress-flag.png"
                    alt="Indian National Congress Flag"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Smooth horizontal gradient to seamlessly blend into royal blue on the left */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af] via-[#1e40af]/90 sm:via-[#1e40af]/75 to-transparent" />

                {/* Top and bottom subtle shading */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/25 via-transparent to-blue-900/15" />
              </div>

              <div className="relative z-10 flex items-center gap-3.5 sm:gap-5">
                {/* Candidate Portrait Avatar Frame (Big 4K HD photo with sleek minimal border) */}
                <div className="relative w-22 h-22 sm:w-28 sm:h-28 min-w-[88px] min-h-[88px] sm:min-w-[112px] sm:min-h-[112px] shrink-0">
                  <div className="relative w-full h-full rounded-2xl sm:rounded-3xl border-2 border-white/95 shadow-xl shadow-blue-950/25 overflow-hidden bg-slate-900/10">
                    <img
                      src={candidatePhotoUrl}
                      alt={displayCandidate}
                      className="w-full h-full object-cover object-top block"
                    />
                  </div>
                </div>

                {/* Candidate Text Metadata */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 py-0.5">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-200 leading-tight">
                    {displayConstituency}
                  </div>
                  <h2 className="text-base sm:text-2xl font-black tracking-tight text-white leading-snug">
                    {displayCandidate}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {/* INC Candidate Pill with Transparent Minimal Indian Flag Background (No Wheel) */}
                    <span className="relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black text-blue-950 shadow-sm border border-white/90 backdrop-blur-md">
                      {/* 3-Band Indian Flag (Tricolor: Saffron, White, Green - without Ashoka Chakra) */}
                      <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                        <div className="flex-1 bg-[#FF9933]" />
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-[#138808]" />
                      </div>
                      {/* Soft frosted glass overlay for high-contrast text readability */}
                      <div className="absolute inset-0 bg-white/55 pointer-events-none" />

                      {/* Content */}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <img
                          src={partyLogoUrl}
                          alt="INC"
                          className="w-3.5 h-4.5 object-contain inline-block shrink-0"
                        />
                        <span>{displayRole}</span>
                      </span>
                    </span>

                    {/* Listed Voters Pill */}
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-blue-950/50 border border-blue-300/40 text-blue-100 backdrop-blur-xs">
                      {displayVoterCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Slip Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
                <span className="text-sm sm:text-base font-black text-slate-900">
                  Voter Information Slip
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-500">
                  ಮತದಾರರ ಮಾಹಿತಿ ಚೀಟಿ
                </span>
              </div>

              {/* Two Highlighted Boxes: Part No & Serial No */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3 sm:p-3.5 text-left shadow-2xs">
                  <div className="text-[10.5px] sm:text-xs font-bold text-blue-800">
                    Part No. / ಭಾಗ ಸಂಖ್ಯೆ
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-0.5 font-mono">
                    {partNo}
                  </div>
                </div>

                <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-3 sm:p-3.5 text-left shadow-2xs">
                  <div className="text-[10.5px] sm:text-xs font-bold text-blue-800">
                    Serial No. / ಕ್ರಮ ಸಂಖ್ಯೆ
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-0.5 font-mono">
                    {serialNo}
                  </div>
                </div>
              </div>

              {/* Detail Rows */}
              <div className="space-y-2.5 text-xs sm:text-sm pt-0.5">
                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Name / ಹೆಸರು
                  </div>
                  <div className="text-sm sm:text-base font-black text-slate-900">
                    {electorName}
                  </div>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Father / Mother / Husband / ತಂದೆ / ತಾಯಿ / ಪತಿ
                  </div>
                  <div className="font-bold text-slate-800">
                    {relativeName}
                  </div>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400">
                    EPIC No. / ಎಪಿಕ್ ಸಂಖ್ಯೆ
                  </div>
                  <div className="font-mono font-black text-slate-900 tracking-wider">
                    {epic}
                  </div>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Taluk / City / ತಾಲ್ಲೂಕು / ನಗರ
                  </div>
                  <div className="font-bold text-slate-800">
                    {talukCity}
                  </div>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Hobli / Ward · Polling Booth / ಹೋಬಳಿ / ವಾರ್ಡ್ · ಮತಗಟ್ಟೆ
                  </div>
                  <div className="font-semibold text-slate-800 leading-snug">
                    {areaHobli}
                  </div>
                </div>
              </div>
            </div>

            {/* Blue Verification Banner at Bottom of Slip */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white px-4 py-2.5 text-center space-y-0.5 border-t border-blue-500/30">
              <p className="text-xs sm:text-sm font-black">
                Please verify your details. Vote on polling day.
              </p>
              <p className="text-[10px] text-blue-100 font-medium">
                CEO Karnataka Electoral Roll · South-East Graduates&apos; Constituency
              </p>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 font-medium no-print">
            On a phone you can also long-press the slip to save it.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 no-print">
            {/* Grid for main download & print buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Button 1: Save Image */}
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === 'kn' ? 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'Generating Slip...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{language === 'kn' ? 'ಸ್ಲಿಪ್ ಸೇವ್ ಮಾಡಿ' : 'Save Image'}</span>
                  </>
                )}
              </button>

              {/* Button 2: Print Voter Slip */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 shadow-2xs transition active:scale-[0.98]"
              >
                <Printer className="w-4 h-4 text-blue-700" />
                <span>{language === 'kn' ? 'ಸ್ಲಿಪ್ ಪ್ರಿಂಟ್ ಮಾಡಿ' : 'Print Voter Slip'}</span>
              </button>
            </div>

            {/* Button 3: Share / Save to Photos (WhatsApp) */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-sm transition active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              <span>{language === 'kn' ? 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share to WhatsApp'}</span>
            </button>

            {/* Button 4: Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition active:scale-[0.98]"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
