'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ChevronDown,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  CONSTITUENCY_DISTRICTS,
  getHoblisByTaluk,
  getAllTaluks,
} from '@/lib/constituencyData';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export interface RequestAddVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
  mode?: 'add' | 'correction';
  initialData?: {
    fullName?: string;
    relativeName?: string;
    epicNumber?: string;
    taluk?: string;
    hobli?: string;
    villageArea?: string;
    address?: string;
  } | null;
}

export function RequestAddVoterModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'add',
  initialData,
}: RequestAddVoterModalProps) {
  const { language, t } = useLanguage();
  // Form fields matching reference screenshots
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [relativeName, setRelativeName] = useState(initialData?.relativeName || '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [occupation, setOccupation] = useState('');
  const [talukCity, setTalukCity] = useState(initialData?.taluk || 'Tumkur City');
  const [hobliWard, setHobliWard] = useState(initialData?.hobli || 'Ward 1-10');
  const [villageArea, setVillageArea] = useState(initialData?.villageArea || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [epicNumber, setEpicNumber] = useState(initialData?.epicNumber || '');
  const [anythingElse, setAnythingElse] = useState('');

  // Sync initialData when modal opens
  useEffect(() => {
    if (initialData) {
      if (initialData.fullName) setFullName(initialData.fullName);
      if (initialData.relativeName) setRelativeName(initialData.relativeName);
      if (initialData.epicNumber) setEpicNumber(initialData.epicNumber);
      if (initialData.taluk) setTalukCity(initialData.taluk);
      if (initialData.hobli) setHobliWard(initialData.hobli);
      if (initialData.villageArea) setVillageArea(initialData.villageArea);
      if (initialData.address) setAddress(initialData.address);
    }
  }, [initialData, isOpen]);

  // UI state
  const [isTalukPickerOpen, setIsTalukPickerOpen] = useState(false);
  const [isHobliPickerOpen, setIsHobliPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Grouped taluks for the picker
  const allTalukList = [
    // Tumkur
    'Tumkur City',
    'Tumkur Rural',
    'Chikkanayakanahalli',
    'Gubbi',
    'Koratagere',
    'Kunigal',
    'Madhugiri',
    'Pavagada',
    'Sira',
    'Tiptur',
    'Turuvekere',
    // Chitradurga
    'Chitradurga',
    'Challakere',
    'Hiriyur',
    'Holalkere',
    'Hosadurga',
    'Molakalmuru',
    // Davanagere
    'Davanagere',
    'Harihar',
    'Channagiri',
    'Honnali',
    'Jagalur',
    'Nyamathi',
    // Kolar
    'Kolar',
    'Bangarapet',
    'KGF',
    'Malur',
    'Mulbagal',
    'Srinivaspur',
    // Chikkaballapura
    'Chikkaballapur',
    'Bagepalli',
    'Chintamani',
    'Gauribidanur',
    'Gudibanda',
    'Sidlaghatta',
  ];

  // Derive District from chosen Taluk
  const getDistrictForTaluk = (taluk: string): string => {
    for (const dist of CONSTITUENCY_DISTRICTS) {
      if (dist.taluks.some((t) => t.name.toLowerCase() === taluk.toLowerCase())) {
        return dist.name;
      }
    }
    return 'Tumkur';
  };

  const currentDistrict = getDistrictForTaluk(talukCity);
  const availableHoblis = getHoblisByTaluk(currentDistrict, talukCity);

  useEffect(() => {
    if (availableHoblis.length > 0) {
      setHobliWard(availableHoblis[0]);
    } else {
      setHobliWard('Kasaba');
    }
  }, [talukCity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }
    if (!qualification.trim()) {
      setError('Please provide your educational qualification (e.g. BA, BE, MSc B.Ed)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elector_name: fullName.trim(),
          relative_name: relativeName.trim(),
          relation_type: 'Father',
          gender: 'Male',
          age: 21,
          mobile: cleanMobile,
          qualification: qualification.trim(),
          occupation: occupation.trim(),
          district: currentDistrict,
          taluk: talukCity,
          hobli: hobliWard,
          village: villageArea.trim(),
          address: address.trim(),
          existing_epic: epicNumber.trim().toUpperCase(),
          category: mode === 'correction' ? 'Correction in Roll' : 'Graduates / Teachers Enrollment',
          notes: mode === 'correction' ? `[CORRECTION REQUEST] ${anythingElse.trim()}` : anythingElse.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSubmittedData(data.request);
      if (onSuccess) onSuccess(data.request);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check network.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedData?.id) return;
    navigator.clipboard.writeText(submittedData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!submittedData) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const trackUrl = `${origin}/track?ref=${encodeURIComponent(submittedData.id)}`;
    const text = `*Karnataka Electoral Roll - Voter Enrolment Request*\n\n` +
      `📋 *Tracking ID:* ${submittedData.id}\n` +
      `👤 *Full Name:* ${submittedData.elector_name}\n` +
      `🎓 *Qualification:* ${submittedData.qualification || 'Graduate'}\n` +
      `📍 *Location:* ${submittedData.taluk}, ${submittedData.district}\n` +
      `📞 *Mobile:* +91 ${submittedData.mobile}\n` +
      `⏳ *Status:* Request Received (Pending Verification)\n\n` +
      `🔍 *Track progress live:* ${trackUrl}\n\n` +
      `Our team will verify and call to assist with official Form 18 submission.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setFullName('');
    setRelativeName('');
    setMobileNumber('');
    setQualification('');
    setOccupation('');
    setVillageArea('');
    setAddress('');
    setEpicNumber('');
    setAnythingElse('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-sky-100 overflow-hidden max-h-[92vh] flex flex-col animate-slideUp sm:animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 sm:py-4 flex items-start justify-between border-b border-slate-100">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
              {mode === 'correction'
                ? (language === 'kn' ? 'ಮತದಾರರ ವಿವರ ತಿದ್ದುಪಡಿಗೆ ವಿನಂತಿ' : 'Request a correction')
                : (language === 'kn' ? 'ಹೆಸರು ಸೇರಿಸಲು ವಿನಂತಿ (ನಮೂನೆ 18)' : 'Request to add my name')}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'kn'
                ? 'ದೃಢೀಕರಣಕ್ಕಾಗಿ ನಮ್ಮ ತಂಡವು ಈ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಲಿದೆ.'
                : 'Our team will call you on this number to verify.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {submittedData ? (
            /* Success Feedback */
            <div className="text-center py-4 space-y-5 animate-scaleIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Request Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Our election desk has recorded your application.
                </p>
              </div>

              {/* Reference ID Pill */}
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 max-w-xs mx-auto flex items-center justify-between gap-3 shadow-2xs">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                    Reference ID
                  </span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {submittedData.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-1.5 bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Link
                  href={`/track?ref=${encodeURIComponent(submittedData.id)}`}
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition"
                >
                  <span>Track Status Live &rarr;</span>
                </Link>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Add Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-slate-500 font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Input Form matching Image 2 & 3 */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full name * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Father / Mother / Husband */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father / Mother / Husband
                </label>
                <input
                  type="text"
                  value={relativeName}
                  onChange={(e) => setRelativeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Mobile number * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder=""
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Qualification * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qualification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="BA, BE, MSc B.Ed ..."
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Taluk / City & Hobli / Ward side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Taluk / City selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Taluk / City
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTalukPickerOpen(true)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 text-left flex items-center justify-between min-h-[44px] hover:border-slate-300 transition"
                  >
                    <span className="truncate">{talukCity}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                </div>

                {/* Hobli / Ward selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hobli / Ward
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHobliPickerOpen(true)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 text-left flex items-center justify-between min-h-[44px] hover:border-slate-300 transition"
                  >
                    <span className="truncate">{hobliWard}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                </div>
              </div>

              {/* Village / Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Village / Area
                </label>
                <input
                  type="text"
                  value={villageArea}
                  onChange={(e) => setVillageArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* EPIC (Voter ID) number, if any */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  EPIC (Voter ID) number, if any
                </label>
                <input
                  type="text"
                  value={epicNumber}
                  onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                />
              </div>

              {/* Anything else we should know? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anything else we should know?
                </label>
                <textarea
                  rows={2}
                  value={anythingElse}
                  onChange={(e) => setAnythingElse(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Submit request button (Full Width in Light Blue Theme) */}
              <div className="pt-2 pb-2">
                <Button
                  type="submit"
                  fullWidth={true}
                  variant="primary"
                  specular={true}
                  lineColor="#38bdf8"
                  baseColor="#0284c7"
                  isLoading={isLoading}
                  loadingText={language === 'kn' ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Submitting...'}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-sm py-3.5 rounded-2xl shadow-md transition active:scale-98"
                >
                  {mode === 'correction'
                    ? (language === 'kn' ? 'ತಿದ್ದುಪಡಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ' : 'Submit correction request')
                    : (language === 'kn' ? 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ' : 'Submit request')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Taluk / City Picker Bottom Sheet / Dialog (Matching Image 4 & 5) */}
      {isTalukPickerOpen && (
        <div
          className="fixed inset-0 z-popover flex items-center justify-center p-4 bg-slate-950/70 animate-fadeIn"
          onClick={() => setIsTalukPickerOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-4 shadow-2xl border border-slate-800 max-h-[80vh] flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-white">Select Taluk / City</h4>
              <button
                type="button"
                onClick={() => setIsTalukPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/80 flex-1 pt-1">
              {allTalukList.map((taluk) => {
                const isSelected = talukCity === taluk;
                return (
                  <button
                    key={taluk}
                    type="button"
                    onClick={() => {
                      setTalukCity(taluk);
                      setIsTalukPickerOpen(false);
                    }}
                    className={cn(
                      'w-full py-3 px-3 text-left flex items-center justify-between text-xs font-semibold transition',
                      isSelected ? 'text-sky-400 font-bold bg-slate-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                    )}
                  >
                    <span>{taluk}</span>
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                        isSelected ? 'border-sky-400 bg-sky-400' : 'border-slate-500'
                      )}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hobli / Ward Picker Dialog */}
      {isHobliPickerOpen && (
        <div
          className="fixed inset-0 z-popover flex items-center justify-center p-4 bg-slate-950/70 animate-fadeIn"
          onClick={() => setIsHobliPickerOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-4 shadow-2xl border border-slate-800 max-h-[80vh] flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-extrabold text-white">Select Hobli / Ward ({talukCity})</h4>
              <button
                type="button"
                onClick={() => setIsHobliPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/80 flex-1 pt-1">
              {(availableHoblis.length > 0 ? availableHoblis : ['Kasaba', 'Central Ward', 'Rural Circle']).map(
                (hobli) => {
                  const isSelected = hobliWard === hobli;
                  return (
                    <button
                      key={hobli}
                      type="button"
                      onClick={() => {
                        setHobliWard(hobli);
                        setIsHobliPickerOpen(false);
                      }}
                      className={cn(
                        'w-full py-3 px-3 text-left flex items-center justify-between text-xs font-semibold transition',
                        isSelected ? 'text-sky-400 font-bold bg-slate-800/50' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
                      )}
                    >
                      <span>{hobli}</span>
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                          isSelected ? 'border-sky-400 bg-sky-400' : 'border-slate-500'
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
