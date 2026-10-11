'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Elector } from '@/lib/types';
import ViewToggle from './ViewToggle';
import ProfileCard from './ProfileCard';
import ProfileTable from './ProfileTable';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import EditElectorModal from './EditElectorModal';
import { SpecularButton } from '@/components/ui/SpecularButton';
import { ArrowLeft, Copy, Check, Loader2, Sparkles, Printer, Edit3 } from 'lucide-react';
import { getElectorByEpic, primeElectorCache } from '@/lib/electorService';
import { formatEpicForDisplay } from '@/lib/utils';
import { resolvePollingStationDetails } from '@/lib/pollingStationMaster';
import { saveSearchHistoryItem } from '@/lib/searchHistory';

interface ProfileDisplayProps {
  elector: Elector;
  showBackToDashboard?: boolean;
}

export default function ProfileDisplay({
  elector: initialElector,
  showBackToDashboard = true,
}: ProfileDisplayProps) {
  const router = useRouter();
  const [currentElector, setCurrentElector] = useState<Elector | null>(initialElector);
  const [currentEpic, setCurrentEpic] = useState<string>(initialElector.epic_number);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Prime cache with the initially loaded elector
  useEffect(() => {
    if (initialElector?.epic_number) {
      primeElectorCache(initialElector.epic_number, initialElector);
      setCurrentElector(initialElector);
      setCurrentEpic(initialElector.epic_number);
    }
  }, [initialElector]);

  // Real-time fast in-place lookup for quick search
  const handleFastSearch = async (epic: string) => {
    setIsSearching(true);
    setSearchError(null);
    setCurrentEpic(epic);

    const { elector, error } = await getElectorByEpic(epic);
    setIsSearching(false);

    if (error) {
      setSearchError(error);
      setCurrentElector(null);
      saveSearchHistoryItem(epic);
    } else if (elector) {
      setCurrentElector(elector);
      saveSearchHistoryItem(epic, elector.name);
      // Synchronize browser URL smoothly
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `/profile/${encodeURIComponent(epic)}`);
      }
    }
  };

  const handleCopyDetails = () => {
    if (!currentElector) return;

    const phoneDigits = currentElector.whatsapp_mob ? String(currentElector.whatsapp_mob).replace(/\D/g, '') : null;
    const phoneDisplay = phoneDigits && phoneDigits.length === 10
      ? `${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)}`
      : phoneDigits;

    const pollingInfo = resolvePollingStationDetails(currentElector);

    const summary = [
      `--- ELECTOR DETAILS SLIP ---`,
      `EPIC Number: ${formatEpicForDisplay(currentElector.epic_number)}`,
      `Name: ${currentElector.name}`,
      currentElector.relative_name ? `Father / Husband: ${currentElector.relative_name}` : null,
      currentElector.age ? `Age: ${currentElector.age} yrs` : null,
      currentElector.sex ? `Sex: ${currentElector.sex === 'M' ? 'Male' : currentElector.sex === 'F' ? 'Female' : currentElector.sex}` : null,
      phoneDisplay ? `WhatsApp / Mobile: ${phoneDisplay}` : null,
      currentElector.caste ? `Caste: ${currentElector.caste}` : null,
      currentElector.address ? `Address: ${currentElector.address}` : null,
      currentElector.qualification ? `Qualification: ${currentElector.qualification}` : null,
      currentElector.occupation ? `Occupation: ${currentElector.occupation}` : null,
      currentElector.district ? `District: ${currentElector.district}` : null,
      currentElector.ac_name ? `Assembly: ${currentElector.ac_name}` : null,
      currentElector.taluk ? `Taluk: ${currentElector.taluk}` : null,
      currentElector.hobli ? `Hobli: ${currentElector.hobli}` : null,
      currentElector.grama_panchayath ? `Gram Panchayat: ${currentElector.grama_panchayath}` : null,
      currentElector.village ? `Village: ${currentElector.village}` : null,
      currentElector.area_ward ? `Area / Ward: ${currentElector.area_ward}` : null,
      currentElector.serial_number ? `Serial No: #${currentElector.serial_number}` : null,
      `Part Number: Part ${pollingInfo.basePartNumber}`,
      `Polling Booth: ${pollingInfo.boothLabel} (${pollingInfo.boothType})`,
      `Building Name & Room: ${pollingInfo.buildingName}`,
      `Location: ${pollingInfo.location}`,
      `Polling Area: ${pollingInfo.pollingArea}`,
      pollingInfo.serialRangeText ? `Roll Coverage: ${pollingInfo.serialRangeText}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
      {/* Edit Elector Modal */}
      {currentElector && (
        <EditElectorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          elector={currentElector}
          onSaveSuccess={updated => {
            setCurrentElector(updated);
          }}
        />
      )}

      {/* Action Bar Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1 no-print">
        {showBackToDashboard ? (
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200/80 shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
        ) : (
          <div />
        )}

        {/* Quick Instant Search Input */}
        <div className="w-full sm:w-80">
          <SearchBar
            initialValue={currentEpic}
            autoFocus={false}
            size="compact"
            showCharCounter={false}
            placeholder="Quick search new EPIC..."
            onSearch={handleFastSearch}
            isLoading={isSearching}
          />
        </div>
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-soft-xl animate-scaleIn">
          <div className="relative inline-flex">
            <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-30" />
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin relative" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Retrieving elector profile...</p>
        </div>
      )}

      {/* Main Content */}
      {!isSearching && (
        <>
          {currentElector ? (
            <div className="space-y-5">
              {/* Profile Bar Control Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs no-print">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                      Active Elector Profile
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {currentElector.name}
                      </span>
                      <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100 font-bold">
                        {formatEpicForDisplay(currentElector.epic_number)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
                  {/* Edit Record Action Button */}
                  <SpecularButton
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    size="sm"
                    variant="primary"
                    tint="#4f46e5"
                    tintOpacity={1}
                    lineColor="#c7d2fe"
                    baseColor="#3730a3"
                    textColor="#ffffff"
                    intensity={1.1}
                    radius={12}
                    speed={0.35}
                    autoAnimate={true}
                    followMouse={true}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-indigo-200" />}
                    className="shadow-sm active:scale-95"
                  >
                    Edit Record
                  </SpecularButton>

                  {/* View Mode Toggle */}
                  <ViewToggle view={view} onChange={setView} />
                </div>
              </div>

              {/* View Output */}
              <div className="pt-1 pb-44 sm:pb-8">
                {view === 'card' ? (
                  <ProfileCard
                    elector={currentElector}
                    onEditRequest={() => setIsEditModalOpen(true)}
                  />
                ) : (
                  <ProfileTable
                    elector={currentElector}
                    onEditRequest={() => setIsEditModalOpen(true)}
                  />
                )}
              </div>

              {/* Sticky Mobile Action Bar (Call, WhatsApp, Edit, Copy) */}
              <div className="sm:hidden fixed bottom-[calc(60px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-sticky bg-white/95 backdrop-blur-md border-t border-slate-200/90 p-2.5 shadow-elevated">
                <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
                  {currentElector.whatsapp_mob ? (
                    <a
                      href={`tel:${String(currentElector.whatsapp_mob).replace(/\D/g, '')}`}
                      aria-label="Call Elector"
                      className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-50 text-emerald-700 border border-emerald-200/90 rounded-xl active:bg-emerald-100 min-h-[44px] transition"
                    >
                      <span className="text-xs font-bold leading-tight">Call</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 text-slate-300 border border-slate-200 rounded-xl min-h-[44px]"
                    >
                      <span className="text-xs font-bold leading-tight">Call</span>
                    </button>
                  )}

                  {currentElector.whatsapp_mob ? (
                    <a
                      href={`https://wa.me/91${String(currentElector.whatsapp_mob).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp Elector"
                      className="flex flex-col items-center justify-center py-2 px-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl active:bg-emerald-200 min-h-[44px] transition"
                    >
                      <span className="text-xs font-bold leading-tight">WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex flex-col items-center justify-center py-2 px-1 bg-slate-50 text-slate-300 border border-slate-200 rounded-xl min-h-[44px]"
                    >
                      <span className="text-xs font-bold leading-tight">WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-xl active:bg-brand-100 min-h-[44px] transition"
                  >
                    <span className="text-xs font-bold leading-tight">Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyDetails}
                    className="flex flex-col items-center justify-center py-2 px-1 bg-white text-slate-700 border border-slate-200 rounded-xl active:bg-slate-100 min-h-[44px] transition"
                  >
                    <span className="text-xs font-bold leading-tight">
                      {copied ? 'Copied' : 'Slip'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState epic={currentEpic} />
          )}
        </>
      )}
    </div>
  );
}
