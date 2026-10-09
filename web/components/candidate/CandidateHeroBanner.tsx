'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserPlus,
  ShieldCheck,
  MapPin,
  Users,
  Building2,
  Sparkles,
  ClipboardList,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CandidateHeroBannerProps {
  onRequestAddVoter: () => void;
  candidateName?: string;
  candidateTitle?: string;
  constituencyName?: string;
  candidatePhotoUrl?: string;
}

export function CandidateHeroBanner({
  onRequestAddVoter,
  candidateName = 'Party Member / Candidate',
  candidateTitle = 'Official Candidate • Karnataka Legislative Council',
  constituencyName = 'South-East & Central Karnataka Constituency',
  candidatePhotoUrl = '/candidate-placeholder.png',
}: CandidateHeroBannerProps) {
  return (
    <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-sky-100/50 to-blue-50/80 border border-sky-200/90 shadow-sm transition-all duration-300 mb-6">
      {/* Decorative Light-Blue Ambient Glows */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Specular Gradient Line in Sky Cyan */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-400 opacity-90" />

      <div className="relative p-5 sm:p-7 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Candidate / Leader Photo Badge */}
          <div className="relative flex-shrink-0 group">
            {/* Glowing Ring with Light Blue specular accent */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-sky-400 to-blue-500 opacity-60 blur-xs group-hover:opacity-90 transition duration-300" />
            
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl bg-white border-2 border-sky-200 shadow-md overflow-hidden flex items-center justify-center p-1">
              {/* Leader Photo / High-Definition Avatar */}
              <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-sky-100 to-sky-200 flex items-center justify-center">
                <Image
                  src="/app-logo.png"
                  alt={candidateName}
                  fill
                  priority
                  unoptimized
                  className="object-contain p-2 hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Status Badge Pin */}
              <div className="absolute bottom-1 right-1 bg-sky-600 text-white rounded-full p-1.5 shadow-md border-2 border-white" title="Official Candidate / Verified">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Live Status Pill below photo */}
            <div className="mt-2 text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                MLC Candidate
              </span>
            </div>
          </div>

          {/* Candidate & Constituency Metadata */}
          <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
            {/* Top Pill Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-white/90 text-sky-800 border border-sky-200 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-sky-600" />
                <span>Karnataka Legislative Council</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-sky-500/10 text-sky-700 border border-sky-300/60">
                <MapPin className="w-3 h-3 text-sky-600" />
                <span>5 Districts Combined Roll</span>
              </span>
            </div>

            {/* Candidate Title & Honorifics */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {candidateName}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-sky-700 mt-0.5">
                {candidateTitle}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1">
                {constituencyName} • Tumkur, Chitradurga, Davanagere, Kolar &amp; Chikkaballapura
              </p>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 py-1 max-w-lg mx-auto md:mx-0">
              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-sky-200/80 text-center md:text-left shadow-2xs">
                <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <Users className="w-3 h-3 text-sky-600" />
                  <span>Voters</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  2,23,789
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-sky-200/80 text-center md:text-left shadow-2xs">
                <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <Building2 className="w-3 h-3 text-sky-600" />
                  <span>Booths</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  147 Stations
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-sky-200/80 text-center md:text-left shadow-2xs">
                <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] font-bold text-slate-500 uppercase">
                  <MapPin className="w-3 h-3 text-sky-600" />
                  <span>Districts</span>
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  5 Districts
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              {/* Request to Add Voter (Specular Button) */}
              <Button
                type="button"
                onClick={onRequestAddVoter}
                variant="primary"
                specular={true}
                lineColor="#7dd3fc"
                baseColor="#0369a1"
                leftIcon={<UserPlus className="w-4 h-4 text-sky-200" />}
                className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition"
              >
                Request to Add Voter
              </Button>

              {/* Admin Requests Portal Link */}
              <Link
                href="/admin/requests"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 font-extrabold text-xs shadow-2xs transition active:scale-95"
              >
                <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
                <span>Admin Requests Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
