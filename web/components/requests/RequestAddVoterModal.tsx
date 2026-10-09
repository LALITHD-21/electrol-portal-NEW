'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  MapPin,
  Phone,
  User,
  FileText,
  AlertCircle,
  Loader2,
  Building,
  Sparkles,
} from 'lucide-react';
import {
  CONSTITUENCY_DISTRICTS,
  getTaluksByDistrict,
  getCitiesByTaluk,
} from '@/lib/constituencyData';
import { Button } from '@/components/ui/Button';

export interface RequestAddVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
}

export function RequestAddVoterModal({
  isOpen,
  onClose,
  onSuccess,
}: RequestAddVoterModalProps) {
  // Form state
  const [district, setDistrict] = useState('Tumkur');
  const [taluk, setTaluk] = useState('Tumkur');
  const [city, setCity] = useState('Tumkur City');
  const [customCity, setCustomCity] = useState('');
  const [electorName, setElectorName] = useState('');
  const [electorNameKannada, setElectorNameKannada] = useState('');
  const [relativeName, setRelativeName] = useState('');
  const [relationType, setRelationType] = useState('Father');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [existingEpic, setExistingEpic] = useState('');
  const [pollingStation, setPollingStation] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [applicantType, setApplicantType] = useState('Self');
  const [category, setCategory] = useState('New Registration (Form 6)');
  const [notes, setNotes] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Dynamic taluk & city lists
  const availableTaluks = getTaluksByDistrict(district);
  const availableCities = getCitiesByTaluk(district, taluk);

  // Update taluk when district changes
  useEffect(() => {
    const taluks = getTaluksByDistrict(district);
    if (taluks.length > 0) {
      setTaluk(taluks[0].name);
      const cities = getCitiesByTaluk(district, taluks[0].name);
      setCity(cities[0] || 'Main Town');
    }
  }, [district]);

  // Update city when taluk changes
  useEffect(() => {
    const cities = getCitiesByTaluk(district, taluk);
    if (cities.length > 0) {
      setCity(cities[0]);
    } else {
      setCity('Main Town');
    }
  }, [taluk]);

  // Keep WhatsApp synced if checkbox is active
  useEffect(() => {
    if (sameAsMobile) {
      setWhatsapp(mobile);
    }
  }, [mobile, sameAsMobile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!electorName.trim()) {
      setError('Please enter the voter’s full name');
      return;
    }
    if (!relativeName.trim()) {
      setError('Please enter Father / Husband / Guardian’s name');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }

    const finalCity = city === '__custom__' ? customCity.trim() || 'Town/Ward' : city;

    setIsLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elector_name: electorName,
          elector_name_kannada: electorNameKannada,
          relative_name: relativeName,
          relation_type: relationType,
          gender,
          age: Number(age) || 18,
          existing_epic: existingEpic,
          district,
          taluk,
          city: finalCity,
          polling_station: pollingStation,
          address,
          pincode,
          mobile: cleanMobile,
          whatsapp: sameAsMobile ? cleanMobile : whatsapp.replace(/\D/g, '') || cleanMobile,
          applicant_type: applicantType,
          category,
          notes,
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
    const text = `*Karnataka Electoral Roll - Voter Addition Request Received*\n\n` +
      `📋 *Tracking ID:* ${submittedData.id}\n` +
      `👤 *Voter Name:* ${submittedData.elector_name}\n` +
      `📍 *Location:* ${submittedData.taluk} Taluk, ${submittedData.district} Dist\n` +
      `🏙️ *City/Ward:* ${submittedData.city}\n` +
      `📞 *Contact:* +91 ${submittedData.mobile}\n` +
      `📌 *Category:* ${submittedData.category}\n` +
      `⏳ *Status:* Pending Verification\n\n` +
      `Your request has been submitted to the Electoral Team for official roll verification.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setElectorName('');
    setElectorNameKannada('');
    setRelativeName('');
    setAge('');
    setExistingEpic('');
    setPollingStation('');
    setAddress('');
    setPincode('');
    setMobile('');
    setWhatsapp('');
    setNotes('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar - Light Blue Brand Palette */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-sky-50 via-sky-100/70 to-blue-50 border-b border-sky-200/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-300 text-sky-700 flex items-center justify-center shadow-2xs">
              <UserPlus className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Request to Add Voter
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white">
                  Form 6 / Roll
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                ಹೊಸ ಮತದಾರರ ಸೇರ್ಪಡೆ ಕೋರಿಕೆ • Karnataka Legislative Council Roll
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 active:bg-slate-200 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {submittedData ? (
            /* Success Feedback View */
            <div className="text-center py-4 space-y-6 animate-scaleIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 text-emerald-600 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  Request Submitted Successfully!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your voter addition request has been queued for verification by the electoral desk.
                </p>
              </div>

              {/* Reference ID Pill */}
              <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 max-w-sm mx-auto flex items-center justify-between gap-3 shadow-2xs">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                    Tracking Reference ID
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900">
                    {submittedData.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3 py-1.5 bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 active:bg-sky-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Voter Name:</span>
                  <span className="font-extrabold text-slate-900">{submittedData.elector_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Location:</span>
                  <span className="font-bold text-slate-800">
                    {submittedData.taluk} Taluk, {submittedData.district} Dist
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">City / Ward:</span>
                  <span className="font-bold text-slate-800">{submittedData.city}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-slate-500 font-semibold">Mobile:</span>
                  <span className="font-mono font-bold text-slate-800">+91 {submittedData.mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Category:</span>
                  <span className="font-bold text-sky-700">{submittedData.category}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Receipt on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Another Voter</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Hierarchy (District -> Taluk -> City) */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-800">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Constituency Location Hierarchy (ಕರ್ನಾಟಕ ಕ್ಷೇತ್ರ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* District */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      District (ಜಿಲ್ಲೆ) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-sky-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      {CONSTITUENCY_DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Taluk */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Taluk (ತಾಲೂಕು) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={taluk}
                      onChange={(e) => setTaluk(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-sky-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      {availableTaluks.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City / Town / Ward */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      City / Town / Ward (ನಗರ/ಗ್ರಾಮ) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-sky-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ Other / Type Specific Area</option>
                    </select>
                  </div>
                </div>

                {city === '__custom__' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Specify City / Village Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 12, Sira Gate, Gubbi Extension"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-sky-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Personal Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Elector Personal Details (ವ್ಯಕ್ತಿ ವಿವರ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name (English) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Gowda"
                      value={electorName}
                      onChange={(e) => setElectorName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>

                  {/* Kannada Name (Optional) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Name in Kannada (ಐಚ್ಛಿಕ)
                    </label>
                    <input
                      type="text"
                      placeholder="ಉದಾ: ರಮೇಶ್ ಗೌಡ"
                      value={electorNameKannada}
                      onChange={(e) => setElectorNameKannada(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Relative Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Relative's Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Father / Husband / Mother's Name"
                      value={relativeName}
                      onChange={(e) => setRelativeName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>

                  {/* Relation Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      <option value="Father">Father (ತಂದೆ)</option>
                      <option value="Husband">Husband (ಪತಿ)</option>
                      <option value="Mother">Mother (ತಾಯಿ)</option>
                      <option value="Guardian">Guardian (ಪೋಷಕರು)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {/* Gender */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      <option value="Male">Male (ಪುರುಷ)</option>
                      <option value="Female">Female (ಮಹಿಳೆ)</option>
                      <option value="Third Gender">Third Gender</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Age (ವಯಸ್ಸು) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="18"
                      max="110"
                      required
                      placeholder="e.g. 24"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>

                  {/* Existing EPIC (Optional) */}
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Existing EPIC Card (if any)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TYA0633792"
                      value={existingEpic}
                      onChange={(e) => setExistingEpic(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact Details */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Contact & Communication (ಸಂಪರ್ಕ ಮಾಹಿತಿ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      10-Digit Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9845123456"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        WhatsApp Number
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => setSameAsMobile(e.target.checked)}
                          className="rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                        />
                        <span>Same as Mobile</span>
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        disabled={sameAsMobile}
                        placeholder="9845123456"
                        value={sameAsMobile ? mobile : whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500 min-h-[42px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Address, Polling Station & Category */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>Address & Polling Booth (ವಿಳಾಸ ಮತ್ತು ಬೂತ್)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Enrollment Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      <option value="New Registration (Form 6)">New Registration (Form 6)</option>
                      <option value="Graduates / Teachers Enrollment">Graduates / Teachers Roll (Form 18/19)</option>
                      <option value="Constituency Transfer (Form 8)">Constituency Transfer (Form 8)</option>
                      <option value="Correction in Roll">Correction in Roll Details</option>
                    </select>
                  </div>

                  {/* Submitter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Submitted By
                    </label>
                    <select
                      value={applicantType}
                      onChange={(e) => setApplicantType(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    >
                      <option value="Self">Self (Voter Directly)</option>
                      <option value="Party Worker / Agent">Party Worker / BL Agent</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Citizen Volunteer">Citizen Volunteer</option>
                    </select>
                  </div>
                </div>

                {/* Polling Station Name or Area */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nearest Polling Station / Landmark / School (ಐಚ್ಛಿಕ)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Govt Higher Primary School Room 1, Harihar"
                    value={pollingStation}
                    onChange={(e) => setPollingStation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Street Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      House / Door No & Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #42, Main Road, Near Temple"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="572104"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[42px]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Additional Notes / Qualifications / Remarks (ಐಚ್ಛಿಕ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Degree certificate verified, recently moved from rural ward..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition"
                >
                  Cancel
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  specular={true}
                  lineColor="#38bdf8"
                  baseColor="#0284c7"
                  isLoading={isLoading}
                  loadingText="Submitting..."
                  leftIcon={<Sparkles className="w-4 h-4 text-sky-200" />}
                  className="bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md hover:from-sky-700 hover:to-blue-700"
                >
                  Submit Voter Addition Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
