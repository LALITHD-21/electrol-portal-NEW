'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Share2, Printer, Loader2, Check, Copy } from 'lucide-react';
import { toPng } from 'html-to-image';
import { SearchResultRow } from '@/features/search/types';
import { formatEpicForDisplay, isValidIndianMobile, sanitizeDisplayLocation, formatElectorFullName } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber } from '@/lib/boothMaster';
import { resolvePollingStationDetails } from '@/lib/pollingStationMaster';
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
  autoShareWhatsApp?: boolean;
  onRequestCorrection?: () => void;
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
  autoShareWhatsApp = false,
  onRequestCorrection,
}: VoterSlipModalProps) {
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareToast, setShareToast] = useState<{ show: boolean; message: string; phone?: string } | null>(null);
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

  // Trigger autoShare if requested from parent modal
  useEffect(() => {
    if (isOpen && autoShareWhatsApp && mounted && slipRef.current) {
      const timer = setTimeout(() => {
        handleShareWhatsApp();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoShareWhatsApp, mounted]);

  if (!isOpen || !elector) return null;
  if (!mounted) return null;

  // Resolve guaranteed location, polling station details, and serial number
  const loc = resolveElectorLocation(elector);
  const pollingInfo = resolvePollingStationDetails(elector);
  const resolvedSerial = resolveElectorSerialNumber(elector);

  const partNo = pollingInfo.boothCode || elector.part_number || '1';
  const serialNo = resolvedSerial;
  const electorName = formatElectorFullName(elector.name);
  const relativeName = formatElectorFullName(elector.relative_name);
  const epic = formatEpicForDisplay(elector.epic_number || '');
  const talukCity = elector.taluk || loc.taluk || loc.district || 'Tumkur';
  const rawBoothName = pollingInfo.buildingName || elector.polling_station_name || '—';
  const boothName = sanitizeDisplayLocation(rawBoothName) || '—';
  const boothRoom = pollingInfo.roomNumber || '';
  const rawPollingArea = pollingInfo.pollingArea || elector.polling_address || elector.village || elector.address || '';
  const pollingArea = sanitizeDisplayLocation(rawPollingArea);

  const hasValidPhone = isValidIndianMobile(elector.whatsapp_mob);
  const cleanPhone = hasValidPhone ? String(elector.whatsapp_mob).replace(/\D/g, '') : '';

  // Format WhatsApp Share text
  const shareMessage = `*ಮತದಾರರ ಮಾಹಿತಿ ಚೀಟಿ / Voter Information Slip*
━━━━━━━━━━━━━━━━━━━
👤 *ಹೆಸರು / Name:* ${electorName}
👨‍👩‍👧 *ತಂದೆ/ತಾಯಿ/ಪತಿ:* ${relativeName}
🆔 *EPIC No:* ${epic || '—'}${hasValidPhone ? `\n📱 *ಮೊಬೈಲ್ / Mobile:* ${cleanPhone}` : ''}
🏛️ *ಭಾಗ ಸಂಖ್ಯೆ / Part No:* ${partNo}${pollingInfo.isAuxiliary ? ' (Auxiliary Booth)' : ''}
🔢 *ಕ್ರಮ ಸಂಖ್ಯೆ / Serial No:* ${serialNo}
📍 *ತಾಲ್ಲೂಕು / Taluk:* ${talukCity}
🏢 *ಮತಗಟ್ಟೆ / Polling Booth:* ${boothName}${boothRoom ? ` - ${boothRoom}` : ''}
📌 *ಪ್ರದೇಶ / Polling Area:* ${pollingArea}
━━━━━━━━━━━━━━━━━━━
Vote on polling day!`;

  // Crystal-Clear HD Voter Slip Image Sharer for WhatsApp
  const handleShareWhatsApp = async () => {
    if (!slipRef.current || isSharing) return;

    try {
      setIsSharing(true);

      // 1. Capture exact 100% replica in Ultra-HD 2.5x pixel ratio
      const dataUrl = await toPng(slipRef.current, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        quality: 1.0,
      });

      const cleanEpic = (elector.epic_number || '').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `VoterSlip_${cleanEpic || 'Elector'}.png`;

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      // Direct WhatsApp link targeting the elector's phone number if available
      const waUrl = cleanPhone
        ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(shareMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

      // 2. AUTOMATICALLY COPY HD IMAGE TO CLIPBOARD (Universal: works on modern Chrome, Safari, Edge, Android)
      let copiedToClipboard = false;
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedToClipboard = true;
        }
      } catch (clipErr) {
        console.warn('Clipboard write skipped or unsupported:', clipErr);
      }

      // 3. Auto-download the exact HD PNG file
      try {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Auto download error:', dlErr);
      }

      // 4. Primary: Web Share API with image file (Supported on Mobile Chrome, Android, iOS Safari)
      let sharedDirectly = false;
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Voter Slip - ${electorName}`,
            text: shareMessage,
          });
          sharedDirectly = true;
          setIsSharing(false);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsSharing(false);
            return; // User dismissed native share sheet
          }
          console.warn('Navigator file share skipped, using fallback:', shareErr);
        }
      }

      // 5. Desktop / Web Fallback: Open WhatsApp directly to the elector's respected number
      if (!sharedDirectly) {
        window.open(waUrl, '_blank');
      }

      // 6. Show confirmation toast
      setShareToast({
        show: true,
        message: cleanPhone
          ? (language === 'kn'
              ? `✅ ಸ್ಲಿಪ್ ಚಿತ್ರ ನಕಲಿಸಲಾಗಿದೆ! ${cleanPhone} ಗೆ ವಾಟ್ಸಾಪ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ...`
              : `✅ HD Voter Slip image copied! Opening WhatsApp for ${cleanPhone}...`)
          : (language === 'kn'
              ? '✅ ಸ್ಲಿಪ್ ಚಿತ್ರ ನಕಲಿಸಲಾಗಿದೆ! ವಾಟ್ಸಾಪ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ...'
              : '✅ HD Voter Slip image copied! Opening WhatsApp...'),
        phone: cleanPhone || undefined,
      });

    } catch (err) {
      console.error('Failed to share voter slip image:', err);
      // Emergency text fallback
      const fallbackUrl = cleanPhone
        ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(shareMessage)}`
        : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(fallbackUrl, '_blank');
    } finally {
      setIsSharing(false);
    }
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
        border: 1px solid #cbd5e1 !important;
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

      // High-resolution fast single-pass capture at 2x pixel ratio
      const dataUrl = await toPng(slipRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        quality: 0.95,
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
        <div className="p-3.5 sm:p-6 max-h-[88vh] overflow-y-auto space-y-3.5">
          {/* Printable / Visual Slip Card (Identical in Preview, Downloaded PNG, and Printed Page) */}
          <div
            ref={slipRef}
            className="print-voter-slip rounded-2xl border border-slate-200 overflow-hidden shadow-soft-sm bg-white w-full max-w-[460px] mx-auto text-left"
            style={{ width: '100%', maxWidth: '460px' }}
          >
            {/* Top Candidate Banner (matching reference structure) */}
            <div className="bg-blue-700 text-white p-4 sm:p-5 flex items-center gap-3.5 sm:gap-4">
              {/* Candidate Portrait Avatar Frame */}
              <div
                className="relative shrink-0 rounded-2xl border-2 border-white/95 shadow-md overflow-hidden bg-white"
                style={{
                  width: '80px',
                  height: '80px',
                  minWidth: '80px',
                  minHeight: '80px',
                  maxWidth: '80px',
                  maxHeight: '80px',
                }}
              >
                <img
                  src={candidatePhotoUrl}
                  alt={displayCandidate}
                  width={80}
                  height={80}
                  style={{
                    width: '80px',
                    height: '80px',
                    minWidth: '80px',
                    minHeight: '80px',
                    maxWidth: '80px',
                    maxHeight: '80px',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    display: 'block',
                  }}
                  className="w-full h-full object-cover object-top block"
                />
              </div>

              {/* Candidate Text Metadata */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold text-blue-100 tracking-wide leading-tight">
                  {displayConstituency}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight mt-0.5 truncate">
                  {displayCandidate}
                </h2>
                <div className="text-xs sm:text-sm font-bold text-amber-300 mt-1">
                  {displayRole}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 pb-0 space-y-4 bg-white">
              {/* Slip Header */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                  Voter Information Slip
                </h2>
                <span className="text-xs sm:text-sm font-semibold text-slate-500 whitespace-nowrap">
                  ಮತದಾರರ ಮಾಹಿತಿ ಚೀಟಿ
                </span>
              </div>

              {/* Part No. and Serial No. Blue Box */}
              <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-500">
                    Part No. / ಭಾಗ ಸಂಖ್ಯೆ
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-blue-700 tracking-tight mt-0.5 font-mono">
                    {partNo}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-semibold text-slate-500">
                    Serial No. / ಕ್ರಮ ಸಂಖ್ಯೆ
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-blue-700 tracking-tight mt-0.5 font-mono">
                    {serialNo}
                  </div>
                </div>
              </div>

              {/* Details List with Clean Horizontal Dividers */}
              <div className="space-y-2 pt-1 text-left">
                {/* Name */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    Name / ಹೆಸರು
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {electorName}
                  </div>
                </div>

                {/* Father / Mother / Husband */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    Father / Mother / Husband / ತಂದೆ / ತಾಯಿ / ಪತಿ
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                    {relativeName}
                  </div>
                </div>

                {/* EPIC No. */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    EPIC No. / ಎಪಿಕ್ ಸಂಖ್ಯೆ
                  </div>
                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wide">
                    {epic || '—'}
                  </div>
                </div>

                {/* Mobile / Contact Number (if verified) */}
                {hasValidPhone && (
                  <div className="border-b border-slate-100 pb-2">
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                      Mobile / WhatsApp / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ
                    </div>
                    <div className="font-mono text-sm sm:text-base font-black text-emerald-800 tracking-wide flex items-center gap-1.5 mt-0.5">
                      <span>{cleanPhone}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.5 rounded-md">
                        Verified
                      </span>
                    </div>
                  </div>
                )}

                {/* Polling station */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    Polling station / ಮತಗಟ್ಟೆ
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                    {boothName}
                    {boothRoom ? ` - ${boothRoom}` : ''}
                  </div>
                </div>

                {/* Taluk / City */}
                <div className="border-b border-slate-100 pb-2">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                    Taluk / City / ತಾಲ್ಲೂಕು / ನಗರ
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                    {talukCity}
                  </div>
                </div>

                {/* Hobli / Ward · Area */}
                {pollingArea && (
                  <div className="border-b border-slate-100 pb-2">
                    <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                      Hobli / Ward · Area / ಹೋಬಳಿ / ವಾರ್ಡ್ · ಪ್ರದೇಶ
                    </div>
                    <div className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                      {pollingArea}
                    </div>
                  </div>
                )}
              </div>

              {/* Callout Header in Bold Kannada */}
              <div className="pt-2 text-left">
                <h3 className="text-base sm:text-lg font-black text-blue-700 tracking-tight">
                  ನಿಮ್ಮ ಪ್ರಥಮ ಪ್ರಾಶಸ್ತ್ಯ ಮತ ನೀಡಿ ಬೆಂಬಲಿಸಿ
                </h3>
              </div>

              {/* Ballot Candidate Guide Specimen */}
              <div className="relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-2xs bg-white">
                <img
                  src="/ballot-candidate-guide.png"
                  alt="Official Ballot Paper Specimen - Shashi Hulikuntemutt Sl. No. 1"
                  width={1024}
                  height={367}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                  className="w-full h-auto block object-contain"
                />
              </div>
            </div>

            {/* Bottom Royal Blue Verification Banner */}
            <div className="bg-blue-700 text-white p-3.5 sm:p-4 text-left rounded-b-2xl mt-4">
              <p className="text-xs sm:text-sm font-black text-white leading-tight">
                Please verify your details. Vote on polling day.
              </p>
              <p className="text-[11px] text-blue-100 font-medium mt-1">
                shashihulikuntemutt.com
              </p>
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400 font-medium no-print">
            On a phone you can also long-press the slip to save it.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 no-print">
            {/* Grid for main download & print buttons */}
            {/* Toast Feedback Banner when HD image is prepared / shared */}
            {shareToast && shareToast.show && (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-start gap-3 animate-scaleIn text-left">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                    {language === 'kn' ? 'ಎಚ್‌ಡಿ ಸ್ಲಿಪ್ ಚಿತ್ರ ಸಿದ್ಧವಾಗಿದೆ!' : 'HD Slip Image Ready!'}
                  </h4>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5 leading-relaxed">
                    {shareToast.message}
                  </p>
                  {shareToast.phone && (
                    <p className="text-[11px] text-emerald-700 font-mono mt-1 font-extrabold">
                      Recipient: +91 {shareToast.phone}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShareToast(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition"
                  aria-label="Dismiss toast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Grid for main download & print buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Button 1: Save Image */}
              <button
                type="button"
                onClick={handleSaveImage}
                disabled={isGenerating || isSharing}
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

            {/* Button 3: Share HD Image to WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharing || isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === 'kn' ? 'ಎಚ್‌ಡಿ ಸ್ಲಿಪ್ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...' : 'Preparing HD Image...'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>
                    {cleanPhone
                      ? (language === 'kn'
                          ? `ವಾಟ್ಸಾಪ್‌ಗೆ ಎಚ್‌ಡಿ ಸ್ಲಿಪ್ ಕಳುಹಿಸಿ (${cleanPhone})`
                          : `Send HD Slip to WhatsApp (${cleanPhone})`)
                      : (language === 'kn'
                          ? 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಎಚ್‌ಡಿ ಸ್ಲಿಪ್ ಹಂಚಿಕೊಳ್ಳಿ'
                          : 'Share HD Slip to WhatsApp')}
                  </span>
                </>
              )}
            </button>

            {/* Button 4: Request Correction */}
            {onRequestCorrection && (
              <button
                type="button"
                onClick={onRequestCorrection}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition active:scale-[0.98]"
              >
                {language === 'kn' ? 'ವಿವರ ತಪ್ಪಾಗಿದೆಯೇ? ತಿದ್ದುಪಡಿಗೆ ವಿನಂತಿ' : 'Details wrong? Request correction'}
              </button>
            )}

            {/* Button 5: Close */}
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
