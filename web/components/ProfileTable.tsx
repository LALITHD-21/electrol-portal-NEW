'use client';

import React from 'react';
import { Elector } from '@/lib/types';
import { formatEpicForDisplay } from '@/lib/utils';
import { resolvePollingStationDetails } from '@/lib/pollingStationMaster';
import { Printer, FileText, Edit3 } from 'lucide-react';

interface ProfileTableProps {
  elector: Elector;
  onEditRequest?: () => void;
}

/**
 * Format phone number for display: "93794 34328"
 */
function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return '—';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 5)}\u00A0${digits.slice(5)}`;
  }
  return digits || '—';
}

export default function ProfileTable({ elector, onEditRequest }: ProfileTableProps) {
  const pollingInfo = resolvePollingStationDetails(elector);

  const mainRows = [
    { label: 'EPIC Number', value: elector.epic_number, formatted: formatEpicForDisplay(elector.epic_number), isMono: true, nowrap: true },
    { label: 'Serial Number', value: elector.serial_number?.toString() || '—', isMono: true, nowrap: true },
    { label: 'Full Name', value: elector.name },
    { label: 'Relative Name', value: elector.relative_name || '—' },
    { label: 'Sex', value: elector.sex === 'M' ? 'Male (M)' : elector.sex === 'F' ? 'Female (F)' : (elector.sex || '—') },
    { label: 'Age', value: elector.age ? `${elector.age} years` : '—', nowrap: true },
    { label: 'WhatsApp / Mobile', value: formatPhoneDisplay(elector.whatsapp_mob), isMono: true, nowrap: true },
    { label: 'Caste', value: elector.caste || '—' },
    { label: 'Address', value: elector.address || '—' },
    { label: 'Qualification', value: elector.qualification || '—' },
    { label: 'Occupation', value: elector.occupation || '—' },
  ];

  const locationRows = [
    { label: 'District', value: elector.district || '—' },
    { label: 'Assembly (AC)', value: elector.ac_name || '—' },
    { label: 'Taluk', value: elector.taluk || '—' },
    { label: 'Hobli', value: elector.hobli || '—' },
    { label: 'Gram Panchayat', value: elector.grama_panchayath || '—' },
    { label: 'Village', value: elector.village || '—' },
    { label: 'Area / Ward', value: elector.area_ward || '—' },
  ];

  const pollingRows = [
    { label: 'Part Number', value: `Part ${pollingInfo.basePartNumber}`, isMono: true, nowrap: true },
    { label: 'Booth Designation', value: `${pollingInfo.boothLabel} (${pollingInfo.boothType})`, isMono: false },
    { label: 'Building Name & Room', value: pollingInfo.buildingName },
    { label: 'Location / Hobli', value: pollingInfo.location },
    { label: 'Polling Area / Coverage', value: pollingInfo.pollingArea },
    ...(pollingInfo.serialRangeText ? [{ label: 'Voter Roll Range', value: `${pollingInfo.serialRangeText}${pollingInfo.thresholdNotice ? ` — ${pollingInfo.thresholdNotice}` : ''}` }] : []),
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-scaleIn">
      {/* Print Trigger Action */}
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Tabular Voter Record</span>
        </div>
        <div className="flex items-center gap-2">
          {onEditRequest && (
            <button
              onClick={onEditRequest}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/90 rounded-xl hover:bg-indigo-100 shadow-xs transition active:scale-95"
            >
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Edit Record</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:bg-slate-50 hover:shadow-md focus:ring-2 focus:ring-indigo-500/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Table Slip</span>
          </button>
        </div>
      </div>

      {/* Printable Data Table */}
      <div className="printable-table bg-white rounded-3xl border border-slate-200/80 shadow-soft-xl overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80">
              <th className="py-3.5 px-4 sm:px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-[38%] sm:w-[32%] sm:max-w-[180px]">
                Attribute
              </th>
              <th className="py-3.5 px-4 sm:px-6 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 w-[62%] sm:w-[68%]">
                Elector Detail
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Personal Details Section */}
            {mainRows.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-slate-100 transition-colors ${
                  index % 2 === 0 ? 'bg-white hover:bg-indigo-50/20' : 'bg-slate-50/40 hover:bg-indigo-50/20'
                }`}
              >
                <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-500 align-top break-words">
                  {row.label}
                </td>
                <td
                  className={`py-3.5 px-4 sm:px-6 text-xs sm:text-sm text-slate-900 leading-relaxed align-top ${
                    row.isMono ? 'epic-mono font-extrabold text-indigo-700' : 'font-semibold'
                  } ${row.nowrap ? 'whitespace-nowrap' : 'break-words'}`}
                >
                  {row.formatted || row.value}
                </td>
              </tr>
            ))}

            {/* Constituency & Location Header Row */}
            <tr className="bg-gradient-to-r from-sky-50 via-blue-50 to-slate-50 border-y border-slate-200/80">
              <td
                colSpan={2}
                className="py-3 px-4 sm:px-6 text-xs font-extrabold uppercase tracking-wider text-sky-700"
              >
                Constituency & Location Details
              </td>
            </tr>

            {locationRows.map((row, index) => (
              <tr
                key={`loc-${index}`}
                className={`border-b border-slate-100 transition-colors ${
                  index % 2 === 0 ? 'bg-white hover:bg-sky-50/20' : 'bg-slate-50/40 hover:bg-sky-50/20'
                }`}
              >
                <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-500 align-top break-words">
                  {row.label}
                </td>
                <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed align-top break-words">
                  {row.value}
                </td>
              </tr>
            ))}

            {/* Polling Station Header Row */}
            <tr className="bg-gradient-to-r from-violet-50 via-indigo-50 to-slate-50 border-y border-slate-200/80">
              <td
                colSpan={2}
                className="py-3 px-4 sm:px-6 text-xs font-extrabold uppercase tracking-wider text-indigo-700"
              >
                Polling Station & Location Details
              </td>
            </tr>

            {pollingRows.map((row, index) => (
              <tr
                key={`polling-${index}`}
                className={`border-b border-slate-100 transition-colors ${
                  index % 2 === 0 ? 'bg-white hover:bg-violet-50/20' : 'bg-slate-50/40 hover:bg-violet-50/20'
                }`}
              >
                <td className="py-3.5 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-slate-500 align-top break-words">
                  {row.label}
                </td>
                <td className={`py-3.5 px-4 sm:px-6 text-xs sm:text-sm text-slate-900 leading-relaxed align-top ${row.isMono ? 'epic-mono font-extrabold' : 'font-semibold'} ${row.nowrap ? 'whitespace-nowrap' : 'break-words'}`}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
