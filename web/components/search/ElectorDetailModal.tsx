'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Edit3,
  ShieldCheck,
  BadgeCheck,
  Users,
  Calendar,
  UserCheck,
  Briefcase,
  GraduationCap,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { SearchResultRow } from '@/features/search/types';
import { formatEpicForDisplay, getInitials } from '@/lib/utils';
import { resolveElectorLocation, resolveElectorSerialNumber } from '@/lib/boothMaster';
import { resolvePollingStationDetails } from '@/lib/pollingStationMaster';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface ElectorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  elector: SearchResultRow | null;
  onDownloadSlip: () => void;
  onRequestCorrection: () => void;
}

export function ElectorDetailModal({
  isOpen,
  onClose,
  elector,
  onDownloadSlip,
  onRequestCorrection,
}: ElectorDetailModalProps) {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !elector) return null;

  const loc = resolveElectorLocation(elector);
  const pollingInfo = resolvePollingStationDetails(elector);
  const partNo = pollingInfo.basePartNumber;
  const serialNo = resolveElectorSerialNumber(elector);
  const electorName = elector.name || '—';
  const relativeName = elector.relative_name || '—';
  const epic = formatEpicForDisplay(elector.epic_number || '');
  const talukCity = elector.taluk || loc.taluk || loc.district || 'Tumkur';
  const area = elector.village || elector.address || `${loc.taluk}, ${loc.district}`;

  const initials = getInitials(electorName);

  const handleCopyDetails = () => {
    const summary = [
      `--- ELECTOR DETAILS SLIP ---`,
      `EPIC Number: ${epic}`,
      `Name: ${electorName}`,
      `Father / Husband: ${relativeName}`,
      `Part Number: Part ${pollingInfo.basePartNumber}`,
      `Polling Booth: ${pollingInfo.boothLabel} (${pollingInfo.boothType})`,
      `Part Serial No: #${serialNo}`,
      elector.age ? `Age: ${elector.age} yrs` : null,
      elector.sex ? `Gender: ${elector.sex === 'M' ? 'Male' : elector.sex === 'F' ? 'Female' : elector.sex}` : null,
      `Address: ${area}`,
      `Building Name & Room: ${pollingInfo.buildingName}`,
      `Location: ${pollingInfo.location}`,
      `Polling Area: ${pollingInfo.pollingArea}`,
      pollingInfo.serialRangeText ? `Roll Coverage: ${pollingInfo.serialRangeText}` : null,
      `District: ${loc.district}`,
      `Taluk: ${talukCity}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `*ಮತದಾರರ ಮಾಹಿತಿ ಚೀಟಿ / Voter Slip*
👤 ಹೆಸರು / Name: ${electorName}
👨‍👩‍👧 ತಂದೆ/ತಾಯಿ/ಪತಿ: ${relativeName}
🆔 EPIC: ${epic}
🏛️ Part No: Part ${pollingInfo.basePartNumber} (${pollingInfo.boothLabel})
🔢 Serial No: #${serialNo}
🏢 Polling Station: ${pollingInfo.buildingName}
📍 Location: ${pollingInfo.location}
🗺️ Area: ${pollingInfo.pollingArea}
Vote on polling day!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/90 animate-scaleIn my-auto max-h-[92vh] flex flex-col">
        {/* Top Gradient Shimmer Accent Line */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden shrink-0" />

        {/* Top Header Bar: EPIC + Action Chips + Close Button */}
        <div className="bg-slate-50/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          {/* EPIC Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[11px] tracking-wider shadow-2xs shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>EPIC</span>
            </span>
            <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-wide truncate">
              {epic}
            </span>
          </div>

          {/* Action Chips on Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Serial Number Chip */}
            <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs font-mono">
              <span className="text-slate-400 font-normal">Serial </span>
              <strong className="text-blue-700">#{serialNo}</strong>
            </span>

            {/* Copy Slip Button */}
            <button
              onClick={handleCopyDetails}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 shadow-2xs transition active:scale-95"
              title="Copy details slip"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-extrabold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Edit / Request Correction Button */}
            <button
              onClick={onRequestCorrection}
              type="button"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded-xl border border-blue-200 shadow-2xs transition active:scale-95"
              title="Request correction"
            >
              <Edit3 className="w-3 h-3 text-blue-600" />
              <span>Edit</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition ml-0.5"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* SECTION 1: Profile Avatar & Hero Information Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/30 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* Avatar Initials Square */}
            <div className="relative shrink-0 select-none">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-md shadow-indigo-500/20 tracking-wider">
                {initials}
              </div>
              {/* Verified green circle indicator */}
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center absolute -bottom-1 -right-1 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Name, Relative & Verified Badge */}
            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80 shadow-2xs">
                  <BadgeCheck className="w-3 h-3 text-blue-600" />
                  <span>Verified Elector</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug mt-1 truncate">
                  {electorName}
                </h3>
                {relativeName && (
                  <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                    <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Father / Husband: <strong className="text-slate-900">{relativeName}</strong></span>
                  </p>
                )}
              </div>

              {/* Quick Metadata Chips */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                {elector.age !== null && elector.age !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Age: <strong className="text-slate-900 font-mono">{elector.age} yrs</strong></span>
                  </span>
                )}
                {elector.sex && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    <span>Gender: <strong className="text-slate-900">{elector.sex === 'M' ? 'Male' : elector.sex === 'F' ? 'Female' : elector.sex}</strong></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Ordinary Residence / Address Block */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <img
                src="/location-pin.png"
                alt="Location"
                className="w-4 h-4 object-contain"
              />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Ordinary Residence / Address
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed break-words">
                {area}
              </p>
            </div>
          </div>

          {/* SECTION 3: Qualification & Occupation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Qualification Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Qualification
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {elector.qualification || 'Graduate'}
                </span>
              </div>
            </div>

            {/* Occupation Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600 shadow-2xs">
                <Briefcase className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Occupation
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                  {elector.occupation || 'Service / Employed'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: Polling Station Operational Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-700">
                  Polling Station &amp; Booth Allocation
                </span>
              </div>
              {pollingInfo.isAuxiliary ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Auxiliary Booth ({pollingInfo.boothCode})
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Primary Booth ({pollingInfo.boothCode})
                </span>
              )}
            </div>

            <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5 shadow-2xs text-xs">
              {/* Part & Booth Designation */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase text-slate-400 w-28 shrink-0">
                  Part &amp; Booth
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-mono font-bold text-xs shadow-2xs">
                    Part {pollingInfo.basePartNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs shadow-2xs ${pollingInfo.isAuxiliary ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'}`}>
                    Booth {pollingInfo.boothCode}
                  </span>
                  {pollingInfo.roomNumber && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                      {pollingInfo.roomNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Building Name */}
              <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 w-28 shrink-0">
                  Building Name
                </span>
                <span className="font-extrabold text-slate-900 text-right leading-snug">
                  {pollingInfo.buildingName}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 w-28 shrink-0">
                  Location
                </span>
                <span className="font-bold text-slate-800 text-right leading-snug">
                  {pollingInfo.location}
                </span>
              </div>

              {/* Polling Area */}
              <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] font-bold uppercase text-slate-400 w-28 shrink-0">
                  Polling Area
                </span>
                <span className="font-medium text-slate-700 text-right leading-snug">
                  {pollingInfo.pollingArea}
                </span>
              </div>

              {/* Voter Roll Range */}
              {pollingInfo.serialRangeText && (
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold uppercase text-slate-400 w-28 shrink-0">
                    Roll Range
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-right">
                    {pollingInfo.serialRangeText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: Three Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Button 1: Download Voter Slip */}
            <button
              type="button"
              onClick={onDownloadSlip}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-600/20 transition active:scale-[0.99]"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{language === 'kn' ? 'ಮತದಾರರ ಸ್ಲಿಪ್ ಡೌನ್‌ಲೋಡ್' : 'Download voter slip'}</span>
            </button>

            {/* Button 2: Share on WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 transition active:scale-[0.99]"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>{language === 'kn' ? 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳಿ' : 'Share on WhatsApp'}</span>
            </button>

            {/* Button 3: Details wrong? Request correction */}
            <button
              type="button"
              onClick={onRequestCorrection}
              className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 transition active:scale-[0.99]"
            >
              {language === 'kn' ? 'ವಿವರ ತಪ್ಪಾಗಿದೆಯೇ? ತಿದ್ದುಪಡಿಗೆ ವಿನಂತಿ' : 'Details wrong? Request correction'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElectorDetailModal;
