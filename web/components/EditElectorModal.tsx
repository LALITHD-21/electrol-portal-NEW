'use client';

import React, { useState, useEffect } from 'react';
import { Elector } from '@/lib/types';
import { updateElectorRecord } from '@/lib/electorService';
import {
  X,
  User,
  Users,
  Calendar,
  UserCheck,
  MapPin,
  GraduationCap,
  Briefcase,
  Building2,
  Hash,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Phone,
  Landmark,
  Map,
  Home,
  Globe,
  Layers
} from 'lucide-react';
import { formatEpicForDisplay } from '@/lib/utils';
import { SpecularButton } from '@/components/ui/SpecularButton';

interface EditElectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  elector: Elector;
  onSaveSuccess: (updatedElector: Elector) => void;
}

interface FormDataState {
  name?: string;
  relative_name?: string | null;
  age?: string | number | null;
  sex?: 'M' | 'F' | 'O' | null;
  address?: string | null;
  qualification?: string | null;
  occupation?: string | null;
  whatsapp_mob?: string | null;
  caste?: string | null;
  district?: string | null;
  ac_name?: string | null;
  taluk?: string | null;
  hobli?: string | null;
  grama_panchayath?: string | null;
  village?: string | null;
  area_ward?: string | null;
  serial_number?: string | number | null;
  part_number?: string | null;
  polling_station_name?: string | null;
  polling_address?: string | null;
}

export default function EditElectorModal({
  isOpen,
  onClose,
  elector,
  onSaveSuccess,
}: EditElectorModalProps) {
  const [formData, setFormData] = useState<FormDataState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (elector) {
      setFormData({
        name: elector.name || '',
        relative_name: elector.relative_name || '',
        age: elector.age !== null && elector.age !== undefined ? elector.age : '',
        sex: elector.sex || null,
        address: elector.address || '',
        qualification: elector.qualification || '',
        occupation: elector.occupation || '',
        whatsapp_mob: elector.whatsapp_mob || '',
        caste: elector.caste || '',
        district: elector.district || '',
        ac_name: elector.ac_name || '',
        taluk: elector.taluk || '',
        hobli: elector.hobli || '',
        grama_panchayath: elector.grama_panchayath || '',
        village: elector.village || '',
        area_ward: elector.area_ward || '',
        serial_number: elector.serial_number !== null && elector.serial_number !== undefined ? elector.serial_number : '',
        part_number: elector.part_number || '',
        polling_station_name: elector.polling_station_name || '',
        polling_address: elector.polling_address || '',
      });
      setError(null);
      setSuccessMessage(null);
    }
  }, [elector, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      setError('Name field is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: Partial<Elector> = {
      name: formData.name.trim(),
      relative_name: formData.relative_name ? String(formData.relative_name).trim() : null,
      age: formData.age !== '' && formData.age !== null && formData.age !== undefined ? Number(formData.age) : null,
      sex: (formData.sex === 'M' || formData.sex === 'F') ? formData.sex : null,
      address: formData.address ? String(formData.address).trim() : null,
      qualification: formData.qualification ? String(formData.qualification).trim() : null,
      occupation: formData.occupation ? String(formData.occupation).trim() : null,
      whatsapp_mob: formData.whatsapp_mob ? String(formData.whatsapp_mob).replace(/\D/g, '').trim() : null,
      caste: formData.caste ? String(formData.caste).trim() : null,
      district: formData.district ? String(formData.district).trim() : null,
      ac_name: formData.ac_name ? String(formData.ac_name).trim() : null,
      taluk: formData.taluk ? String(formData.taluk).trim() : null,
      hobli: formData.hobli ? String(formData.hobli).trim() : null,
      grama_panchayath: formData.grama_panchayath ? String(formData.grama_panchayath).trim() : null,
      village: formData.village ? String(formData.village).trim() : null,
      area_ward: formData.area_ward ? String(formData.area_ward).trim() : null,
      serial_number: formData.serial_number !== '' && formData.serial_number !== null && formData.serial_number !== undefined ? Number(formData.serial_number) : null,
      part_number: formData.part_number ? String(formData.part_number).trim() : null,
      polling_station_name: formData.polling_station_name ? String(formData.polling_station_name).trim() : null,
      polling_address: formData.polling_address ? String(formData.polling_address).trim() : null,
    };

    const { elector: updated, error: updateError } = await updateElectorRecord(
      elector.epic_number,
      payload
    );

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
    } else if (updated) {
      setSuccessMessage('Record updated permanently in database!');
      setTimeout(() => {
        onSaveSuccess(updated);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated border border-slate-200/80 overflow-hidden flex flex-col h-[92dvh] sm:h-auto sm:max-h-[90vh] animate-fadeInUp sm:animate-scaleIn">
        {/* Mobile Drag Indicator Bar */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200/80 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-2xs flex-shrink-0">
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
                Edit Elector Record
              </h2>
              <p className="text-xs text-slate-500 font-semibold truncate">
                EPIC: <span className="epic-mono text-brand-600 font-bold">{formatEpicForDisplay(elector.epic_number)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition active:scale-95 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Personal Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                  placeholder="Enter elector full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Relative Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Father / Husband Name</span>
                </label>
                <input
                  type="text"
                  name="relative_name"
                  value={formData.relative_name || ''}
                  onChange={handleChange}
                  placeholder="Relative name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age !== undefined && formData.age !== null ? formData.age : ''}
                  onChange={handleChange}
                  min={18}
                  max={120}
                  placeholder="Age"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Sex / Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gender</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex || ''}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>

              {/* WhatsApp / Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>WhatsApp / Mobile</span>
                </label>
                <input
                  type="tel"
                  name="whatsapp_mob"
                  value={formData.whatsapp_mob || ''}
                  onChange={handleChange}
                  placeholder="e.g. 9379434328"
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Caste */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Caste</span>
                </label>
                <input
                  type="text"
                  name="caste"
                  value={formData.caste || ''}
                  onChange={handleChange}
                  placeholder="e.g. Vokkaliga, Lingayat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Education & Occupation */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              2. Qualification & Occupation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Qualification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Qualification</span>
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification || ''}
                  onChange={handleChange}
                  placeholder="e.g. Graduate, SSC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Occupation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Occupation</span>
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={handleChange}
                  placeholder="e.g. Engineer, Business"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ordinary Residence */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              3. Ordinary Residence
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Address / Residence</span>
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="House No, Street, Village/Town"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Section 4: Constituency & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              4. Constituency & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* District */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>District</span>
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district || ''}
                  onChange={handleChange}
                  placeholder="e.g. Chikkaballapura"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Assembly Constituency */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assembly (AC)</span>
                </label>
                <input
                  type="text"
                  name="ac_name"
                  value={formData.ac_name || ''}
                  onChange={handleChange}
                  placeholder="e.g. Gauribidanur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Taluk */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-slate-400" />
                  <span>Taluk</span>
                </label>
                <input
                  type="text"
                  name="taluk"
                  value={formData.taluk || ''}
                  onChange={handleChange}
                  placeholder="e.g. Gauribidanur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Hobli */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hobli</span>
                </label>
                <input
                  type="text"
                  name="hobli"
                  value={formData.hobli || ''}
                  onChange={handleChange}
                  placeholder="Hobli name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Gram Panchayat */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gram Panchayat</span>
                </label>
                <input
                  type="text"
                  name="grama_panchayath"
                  value={formData.grama_panchayath || ''}
                  onChange={handleChange}
                  placeholder="GP name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Village */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Village</span>
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village || ''}
                  onChange={handleChange}
                  placeholder="Village name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Area / Ward */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Area / Ward</span>
                </label>
                <input
                  type="text"
                  name="area_ward"
                  value={formData.area_ward || ''}
                  onChange={handleChange}
                  placeholder="Area or ward coverage"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Polling Station Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              5. Polling Station & Serial Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Part Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Part Number</span>
                </label>
                <input
                  type="text"
                  name="part_number"
                  value={formData.part_number || ''}
                  onChange={handleChange}
                  placeholder="e.g. 142"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Serial Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Serial Number</span>
                </label>
                <input
                  type="number"
                  name="serial_number"
                  value={formData.serial_number !== undefined && formData.serial_number !== null ? formData.serial_number : ''}
                  onChange={handleChange}
                  placeholder="e.g. 450"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Polling Station Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Polling Station Name</span>
                </label>
                <input
                  type="text"
                  name="polling_station_name"
                  value={formData.polling_station_name || ''}
                  onChange={handleChange}
                  placeholder="Station building or school name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Polling Address / Coverage Area */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Polling Station Coverage Area</span>
                </label>
                <textarea
                  name="polling_address"
                  rows={2}
                  value={formData.polling_address || ''}
                  onChange={handleChange}
                  placeholder="Polling coverage area / street list"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions with Safe Area */}
          <div className="p-4 sm:p-5 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/90 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>

            <SpecularButton
              type="submit"
              disabled={isSaving}
              size="md"
              variant="primary"
              tint="#4338ca"
              tintOpacity={1}
              lineColor="#a5b4fc"
              baseColor="#312e81"
              textColor="#ffffff"
              intensity={1.15}
              radius={14}
              speed={0.35}
              autoAnimate={true}
              followMouse={true}
              isLoading={isSaving}
              loadingText="Saving Changes..."
              leftIcon={<Save className="w-4 h-4 text-indigo-200" />}
              className="shadow-md shadow-indigo-950/20 active:scale-95 min-h-[44px]"
            >
              Save Changes
            </SpecularButton>
          </div>
        </form>
      </div>
    </div>
  );
}
