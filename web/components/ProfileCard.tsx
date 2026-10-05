'use client';

import React, { useState } from 'react';
import { Elector } from '@/lib/types';
import { formatEpicForDisplay } from '@/lib/utils';
import PhotoPlaceholder from './PhotoPlaceholder';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  BadgeCheck,
  Calendar,
  UserCheck,
  Edit3,
  Phone,
  Landmark,
  Map,
  Home,
  Hash,
  Globe,
  Layers,
  Sparkles,
  ExternalLink,
  Navigation
} from 'lucide-react';

interface ProfileCardProps {
  elector: Elector;
  onEditRequest?: () => void;
}

function formatPhoneDisplay(phone: string | null): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)}\u00A0${digits.slice(5)}`;
  }
  return digits;
}

export default function ProfileCard({ elector, onEditRequest }: ProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const formattedEpic = formatEpicForDisplay(elector.epic_number);

  const hasPollingData =
    elector.part_number || elector.polling_station_name || elector.polling_address;

  const hasLocationData =
    elector.district || elector.ac_name || elector.taluk ||
    elector.hobli || elector.grama_panchayath || elector.village || elector.area_ward;

  const phoneDisplay = formatPhoneDisplay(elector.whatsapp_mob);
  const phoneDigits = elector.whatsapp_mob ? String(elector.whatsapp_mob).replace(/\D/g, '') : null;

  const handleCopyDetails = () => {
    const summary = [
      `--- ELECTOR DETAILS SLIP ---`,
      `EPIC Number: ${formattedEpic}`,
      `Name: ${elector.name}`,
      elector.relative_name ? `Father / Husband: ${elector.relative_name}` : null,
      elector.age ? `Age: ${elector.age}` : null,
      elector.sex ? `Sex: ${elector.sex === 'M' ? 'Male' : elector.sex === 'F' ? 'Female' : elector.sex}` : null,
      elector.whatsapp_mob ? `WhatsApp / Mobile: ${phoneDisplay}` : null,
      elector.caste ? `Caste: ${elector.caste}` : null,
      elector.address ? `Address: ${elector.address}` : null,
      elector.qualification ? `Qualification: ${elector.qualification}` : null,
      elector.occupation ? `Occupation: ${elector.occupation}` : null,
      elector.district ? `District: ${elector.district}` : null,
      elector.ac_name ? `Assembly: ${elector.ac_name}` : null,
      elector.taluk ? `Taluk: ${elector.taluk}` : null,
      elector.hobli ? `Hobli: ${elector.hobli}` : null,
      elector.grama_panchayath ? `Gram Panchayat: ${elector.grama_panchayath}` : null,
      elector.village ? `Village: ${elector.village}` : null,
      elector.area_ward ? `Area / Ward: ${elector.area_ward}` : null,
      elector.serial_number ? `Part Serial No: ${elector.serial_number}` : null,
      elector.part_number ? `Part Number: ${elector.part_number}` : null,
      elector.polling_station_name ? `Polling Station: ${elector.polling_station_name}` : null,
      elector.polling_address ? `Polling Address: ${elector.polling_address}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-elevated overflow-hidden transition-all duration-300 hover:shadow-card-glow animate-scaleIn">
      {/* Top Banner Accent Line with subtle shimmer */}
      <div className="h-2.5 bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>

      {/* Card Header Bar */}
      <div className="bg-slate-50/90 backdrop-blur-md px-5 sm:px-8 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-black text-xs tracking-wider shadow-sm shadow-brand-500/20 whitespace-nowrap">
            <ShieldCheck className="w-4 h-4" />
            <span>EPIC</span>
          </div>
          <span className="epic-mono text-lg sm:text-2xl font-black text-slate-900 tracking-wider whitespace-nowrap">
            {formattedEpic}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {elector.serial_number !== null && elector.serial_number !== undefined && (
            <div className="text-xs font-bold text-slate-700 bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs font-mono flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-400 font-normal">Index No:</span>
              <strong className="text-brand-600">#{elector.serial_number}</strong>
            </div>
          )}

          {/* Copy Slip Button */}
          <button
            onClick={handleCopyDetails}
            type="button"
            className="btn-secondary !px-3 !py-1.5 !text-xs font-bold shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-scaleIn" />
                <span className="text-emerald-700 font-extrabold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800" />
                <span>Copy Slip</span>
              </>
            )}
          </button>

          {/* Edit Record Button */}
          {onEditRequest && (
            <button
              onClick={onEditRequest}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 hover:border-brand-300 transition-all active:scale-95 shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-brand-600" />
              <span>Edit Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-8 space-y-6">
        {/* ═══════════════════════════════════════════════════
            SECTION 1: Profile Avatar & Primary Info Header
           ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30 p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
          {/* Avatar / Photo Placeholder */}
          <div className="flex-shrink-0">
            <PhotoPlaceholder
              name={elector.name}
              epic={elector.epic_number}
              className="w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl"
            />
          </div>

          {/* Name & Primary Attributes */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-100 mb-1.5 shadow-2xs">
                <BadgeCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>100% Verified Elector Roll</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {elector.name}
              </h1>
              {elector.relative_name && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-semibold">
                  <Users className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>Father / Husband: <strong className="text-slate-900">{elector.relative_name}</strong></span>
                </p>
              )}
            </div>

            {/* Quick Metrics Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              {elector.age !== null && elector.age !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Age: <strong className="text-slate-900 font-mono">{elector.age} yrs</strong></span>
                </span>
              )}
              {elector.sex && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gender: <strong className="text-slate-900">{elector.sex === 'M' ? 'Male' : elector.sex === 'F' ? 'Female' : elector.sex}</strong></span>
                </span>
              )}
              {elector.caste && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Caste: <strong className="text-amber-950">{elector.caste}</strong></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 2: WhatsApp / Mobile Contact
           ═══════════════════════════════════════════════════ */}
        {phoneDisplay && (
          <div className="flex items-center justify-between gap-2.5 sm:gap-4 bg-gradient-to-r from-emerald-50/90 via-emerald-50/50 to-white p-3.5 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs group hover:border-emerald-300 transition-all">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block truncate">
                  Verified WhatsApp / Mobile Contact
                </span>
                <span className="text-base sm:text-xl md:text-2xl font-black text-emerald-950 epic-mono tracking-wider whitespace-nowrap block truncate">
                  {phoneDisplay}
                </span>
              </div>
            </div>

            {phoneDigits && (
              <a
                href={`https://wa.me/91${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all active:scale-95 flex-shrink-0 whitespace-nowrap"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 3: Address & Demographics Block
           ═══════════════════════════════════════════════════ */}
        <div className="space-y-3.5">
          {/* Ordinary Residence Address Block */}
          <div className="flex items-start gap-3.5 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-brand-600 shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Ordinary Residence / Address
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed break-words whitespace-pre-line">
                {elector.address || 'Address not recorded'}
              </p>
            </div>
          </div>

          {/* Qualification & Occupation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Qualification */}
            <div className="flex items-start gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Qualification</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {elector.qualification || '—'}
                </span>
              </div>
            </div>

            {/* Occupation */}
            <div className="flex items-start gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Occupation</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block truncate">
                  {elector.occupation || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 4: Constituency & Administrative Location
           ═══════════════════════════════════════════════════ */}
        {hasLocationData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 text-sky-600">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Constituency &amp; Administrative Mapping
              </span>
            </div>

            <div className="bg-gradient-to-br from-sky-50/40 via-blue-50/20 to-slate-50/80 p-5 rounded-2xl border border-sky-100 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
                {elector.district && (
                  <div className="flex items-baseline gap-2.5">
                    <Landmark className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">District</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.district}</span>
                    </div>
                  </div>
                )}

                {elector.ac_name && (
                  <div className="flex items-baseline gap-2.5">
                    <Building2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Assembly Constituency (AC)</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.ac_name}</span>
                    </div>
                  </div>
                )}

                {elector.taluk && (
                  <div className="flex items-baseline gap-2.5">
                    <Map className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Taluk</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.taluk}</span>
                    </div>
                  </div>
                )}

                {elector.hobli && (
                  <div className="flex items-baseline gap-2.5">
                    <Navigation className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Hobli</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.hobli}</span>
                    </div>
                  </div>
                )}

                {elector.grama_panchayath && (
                  <div className="flex items-baseline gap-2.5">
                    <Home className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Gram Panchayat</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.grama_panchayath}</span>
                    </div>
                  </div>
                )}

                {elector.village && (
                  <div className="flex items-baseline gap-2.5">
                    <Home className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Village</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900">{elector.village}</span>
                    </div>
                  </div>
                )}

                {elector.area_ward && (
                  <div className="sm:col-span-2 flex items-start gap-2.5 pt-2 border-t border-sky-100/70 mt-1">
                    <MapPin className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Area / Ward</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">{elector.area_ward}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 5: Polling Station Operational Block
           ═══════════════════════════════════════════════════ */}
        {hasPollingData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 text-violet-600">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Polling Station &amp; Location Details
              </span>
            </div>

            <div className="bg-gradient-to-br from-violet-50/50 via-indigo-50/30 to-slate-50/80 p-4 sm:p-5 rounded-2xl border border-violet-100 divide-y divide-violet-100/70 shadow-2xs">
              {/* Part Number */}
              <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] items-center gap-2 sm:gap-4 pb-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Part Number
                </span>
                <span className="text-xs sm:text-sm font-black text-brand-700 epic-mono bg-white px-3 py-1 rounded-xl border border-brand-100 shadow-2xs inline-block w-fit whitespace-nowrap">
                  Part {elector.part_number || '—'}
                </span>
              </div>

              {/* Station Name */}
              <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] items-start gap-2 sm:gap-4 py-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-0.5">
                  Polling Station
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed break-words">
                  {elector.polling_station_name || '—'}
                </span>
              </div>

              {/* Polling Address */}
              <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] items-start gap-2 sm:gap-4 pt-3">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-0.5">
                  Polling Address
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed break-words">
                  {elector.polling_address || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
