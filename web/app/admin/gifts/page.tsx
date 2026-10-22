'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppShell from '@/components/shell/AppShell';
import {
  Gift,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  MapPin,
  Phone,
  ShieldAlert,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ElectorItem {
  id: string | number;
  name: string;
  relativeName?: string;
  epicNumber: string;
  partNumber: string;
  serialNumber: string | number;
  district: string;
  taluk: string;
  pollingStationName?: string;
  phone?: string;
}

interface GiftRecord {
  id: string;
  epic_number: string;
  elector_name: string;
  relative_name?: string;
  part_number: string;
  serial_number: string;
  volunteer_name: string;
  issued_at: string;
}

export default function AdminGiftTrackerPage() {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedBooth, setSelectedBooth] = useState('');
  const [volunteerName, setVolunteerName] = useState('Campaign Volunteer');
  const [results, setResults] = useState<ElectorItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Gift tracking state
  const [giftedEpics, setGiftedEpics] = useState<Map<string, GiftRecord>>(new Map());
  const [totalDelivered, setTotalDelivered] = useState(0);
  const [boothDelivered, setBoothDelivered] = useState(0);

  // Modal State
  const [pendingElector, setPendingElector] = useState<ElectorItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load volunteer name & gift status on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('mlc_gift_volunteer_name');
      if (savedName) setVolunteerName(savedName);
    } catch {}
    loadGifts();
  }, [selectedBooth]);

  const loadGifts = async () => {
    try {
      const url = selectedBooth
        ? `/api/gifts?part=${encodeURIComponent(selectedBooth)}`
        : '/api/gifts';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTotalDelivered(data.totalDelivered || 0);
        setBoothDelivered(data.boothDelivered || 0);
        if (Array.isArray(data.records)) {
          const map = new Map<string, GiftRecord>();
          data.records.forEach((r: GiftRecord) => {
            if (r.epic_number) map.set(r.epic_number.toUpperCase(), r);
          });
          setGiftedEpics(map);
        }
      }
    } catch (e) {
      console.warn('Failed to load gifts:', e);
    }
  };

  // Perform search across all 183,818 voters
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed && !selectedBooth) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (trimmed) params.set('q', trimmed);
        if (selectedBooth) params.set('part', selectedBooth);
        params.set('limit', '25');

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const items = (data.results || data.electors || []).map((e: any) => ({
            id: e.id || e.epicNumber || e.epic_number,
            name: e.name || e.fullName || e.elector_name,
            relativeName: e.relativeName || e.relative_name,
            epicNumber: (e.epicNumber || e.epic_number || '').toUpperCase(),
            partNumber: String(e.partNumber || e.part_number || ''),
            serialNumber: e.serialNumber || e.serial_number || e.sl_no || '1',
            district: e.district || '',
            taluk: e.taluk || '',
            pollingStationName: e.pollingStationName || e.polling_station_name || '',
            phone: e.phone || e.whatsapp_mob || e.mobile,
          }));
          setResults(items);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedBooth]);

  const handleConfirmHandover = async () => {
    if (!pendingElector) return;
    setIsSubmitting(true);
    setDuplicateWarning(null);

    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epic_number: pendingElector.epicNumber,
          elector_name: pendingElector.name,
          relative_name: pendingElector.relativeName,
          part_number: pendingElector.partNumber,
          serial_number: String(pendingElector.serialNumber),
          district: pendingElector.district,
          taluk: pendingElector.taluk,
          polling_station_name: pendingElector.pollingStationName,
          volunteer_name: volunteerName.trim() || 'Campaign Volunteer',
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.error === 'DUPLICATE_GIFT_BLOCKED') {
        setDuplicateWarning(
          data.message || 'DUPLICATE BLOCKED: This voter has already received a gift!'
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue gift.');
      }

      // Success! Update local state
      setGiftedEpics((prev) => {
        const next = new Map(prev);
        next.set(pendingElector.epicNumber, data.record);
        return next;
      });
      setTotalDelivered((prev) => prev + 1);
      setBoothDelivered((prev) => prev + 1);

      // Save volunteer name
      try {
        localStorage.setItem('mlc_gift_volunteer_name', volunteerName.trim());
      } catch {}

      setSuccessToast(`🎁 Gift successfully issued to ${pendingElector.name}!`);
      setTimeout(() => setSuccessToast(null), 3500);

      setPendingElector(null);
    } catch (err: any) {
      alert(err.message || 'Error recording gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* Top Header Bar */}
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Voter Gift Tracker</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  183,818 Voters Synced
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                ಉಡುಗೊರೆ ವಿತರಣಾ ಪೋರ್ಟಲ್ · Strict 1-to-1 Handover Verification
              </p>
            </div>
          </div>

          {/* Action Counters & CSV Export */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalDelivered} Delivered</span>
            </div>

            <a
              href="/api/gifts/export"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Main Content Workspace */}
        <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Volunteer Attribution & Booth Setup Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-sm p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Volunteer Name / ಸ್ವಯಂಸೇವಕರ ಹೆಸರು
              </label>
              <input
                type="text"
                value={volunteerName}
                onChange={(e) => setVolunteerName(e.target.value)}
                placeholder="Enter volunteer name..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Filter by Polling Booth (Part No. 1 to 151)
              </label>
              <select
                value={selectedBooth}
                onChange={(e) => setSelectedBooth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">All 151 Polling Booths</option>
                {Array.from({ length: 151 }, (_, i) => i + 1).map((part) => (
                  <option key={part} value={String(part)}>
                    Part {part} {selectedBooth === String(part) ? `(${boothDelivered} Gifts)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar Across All 183,818 Electors */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Voter Name, Relative Name, or EPIC Number (e.g. TPC4491775)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 text-sm sm:text-base font-semibold shadow-sm transition bg-white"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin" />
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {results.map((elector) => {
                  const gift = giftedEpics.get(elector.epicNumber);
                  const isDelivered = Boolean(gift);

                  return (
                    <div
                      key={elector.id}
                      className={`p-4 rounded-2xl border transition-all shadow-2xs ${
                        isDelivered
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-soft-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {elector.name}
                          </h3>
                          {elector.relativeName && (
                            <p className="text-xs text-slate-600 truncate">
                              c/o {elector.relativeName}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                            <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {elector.epicNumber}
                            </span>
                            <span>•</span>
                            <span>Part {elector.partNumber}</span>
                            <span>•</span>
                            <span>Sl. {elector.serialNumber}</span>
                          </div>
                          {elector.phone && (
                            <p className="text-[11px] text-emerald-700 font-mono flex items-center gap-1 font-semibold">
                              <Phone className="w-3 h-3" />
                              <span>{elector.phone}</span>
                            </p>
                          )}
                        </div>

                        {/* Gift Handover Status Button */}
                        <div className="flex-shrink-0">
                          {isDelivered ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>GIFT ISSUED</span>
                              </span>
                              <p className="text-[10px] text-emerald-800 font-medium mt-1">
                                By {gift?.volunteer_name}
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingElector(elector)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-sm flex items-center gap-1.5"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Issue Gift</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : query.trim() ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <p className="text-sm font-bold text-slate-700">No voters found matching &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-slate-400">
                  Try typing the EPIC Number (e.g. TPC4491775) or a shorter part of the name.
                </p>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Ready to Track Voter Gifts</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Type an elector name or EPIC card number above to search all 183,818 graduate voters and mark gift distributions with strict zero-duplicate protection.
                </p>
              </div>
            )}
          </div>
        </main>

        {/* 2-Step Confirmation Modal (Anti-Accidental Tap) */}
        {pendingElector && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Gift className="w-5 h-5" />
                  <h3 className="text-base font-black text-slate-900">
                    Confirm Gift Handover
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingElector(null);
                    setDuplicateWarning(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {duplicateWarning ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-700">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span>DUPLICATE DELIVERY BLOCKED</span>
                  </div>
                  <p className="font-normal text-[11px] leading-relaxed">
                    {duplicateWarning}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Voter Name:</span>
                    <span className="font-black text-slate-900">{pendingElector.name}</span>
                  </div>
                  {pendingElector.relativeName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Relative:</span>
                      <span className="font-bold text-slate-700">{pendingElector.relativeName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">EPIC Number:</span>
                    <span className="font-mono font-bold text-slate-900">{pendingElector.epicNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Polling Booth:</span>
                    <span className="font-bold text-slate-800">Part {pendingElector.partNumber} · Sl. {pendingElector.serialNumber}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500">Issued by:</span>
                    <span className="font-bold text-emerald-800">{volunteerName || 'Campaign Volunteer'}</span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Strict Rule: Only 1 campaign gift is permitted per elector.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPendingElector(null);
                    setDuplicateWarning(null);
                  }}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || Boolean(duplicateWarning)}
                  onClick={handleConfirmHandover}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Handover</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
