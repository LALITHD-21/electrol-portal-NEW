'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Send,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  UserCheck,
  ChevronRight,
  Eye,
  Lock,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  RequestStatus,
  STATUS_MAP,
  ALLOWED_TRANSITIONS,
  LINEAR_STEPPER_STEPS,
  getStatusConfig,
} from '@/lib/status-map';
import { REJECT_REASONS, RejectReasonItem } from '@/lib/reject-reasons';
import { VoterAdditionRequest, RequestEvent } from '@/lib/requestsService';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface AdminRequestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: VoterAdditionRequest | null;
  userRole?: 'admin' | 'supervisor' | 'operator' | 'field_agent';
  onStatusUpdated: (updated: VoterAdditionRequest) => void;
  onRequestDeleted?: (id: string) => void;
}

export function AdminRequestDetailDrawer({
  isOpen,
  onClose,
  request,
  userRole = 'supervisor',
  onStatusUpdated,
  onRequestDeleted,
}: AdminRequestDetailDrawerProps) {
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteSuccessMsg, setPromoteSuccessMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active transition confirmation sheet state
  const [activeActionTarget, setActiveActionTarget] = useState<RequestStatus | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Form inputs for transition sheet
  const [formAckNumber, setFormAckNumber] = useState('');
  const [formType, setFormType] = useState('Form 18');
  const [formSubmittedAt, setFormSubmittedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [enrolledPartNumber, setEnrolledPartNumber] = useState('');
  const [enrolledSerialNumber, setEnrolledSerialNumber] = useState('');
  const [enrolledConfirmedAt, setEnrolledConfirmedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [rejectReasonCode, setRejectReasonCode] = useState<string>(
    REJECT_REASONS[0]?.code || 'INCOMPLETE_DOCS'
  );
  const [internalNote, setInternalNote] = useState('');
  const [publicNote, setPublicNote] = useState('');
  const [isPublicVisible, setIsPublicVisible] = useState(true);

  // Load audit events when request changes
  useEffect(() => {
    if (!request || !isOpen) {
      setEvents([]);
      setActiveActionTarget(null);
      setErrorNotice(null);
      return;
    }

    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const res = await fetch(`/api/requests/${request.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.events) setEvents(data.events);
        }
      } catch {}
      setIsLoadingEvents(false);
    };

    fetchEvents();
  }, [request, isOpen]);

  // Reset transition sheet inputs when target action changes
  useEffect(() => {
    if (!activeActionTarget) return;
    setErrorNotice(null);
    setInternalNote('');
    setPublicNote('');
    setIsPublicVisible(true);

    if (activeActionTarget === 'form_submitted') {
      setFormType(request?.form_type || 'Form 18');
      setFormAckNumber(request?.form_ack_number || '');
      setFormSubmittedAt(
        request?.form_submitted_at
          ? request.form_submitted_at.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
    } else if (activeActionTarget === 'enrolled') {
      setEnrolledPartNumber(request?.enrolled_part_number || '');
      setEnrolledSerialNumber(request?.enrolled_serial_number || '');
      setEnrolledConfirmedAt(
        request?.enrolled_confirmed_at
          ? request.enrolled_confirmed_at.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
    } else if (activeActionTarget === 'rejected') {
      setRejectReasonCode(
        request?.public_reject_reason_code || REJECT_REASONS[0].code
      );
    }
  }, [activeActionTarget, request]);

  if (!isOpen || !request) return null;

  const currentStatusConfig = getStatusConfig(request.status);
  const allowedNextActions = ALLOWED_TRANSITIONS[request.status] || [];

  // Check if overdue
  const isOverdue =
    !['enrolled', 'rejected', 'duplicate', 'closed', 'withdrawn'].includes(request.status) &&
    new Date(request.sla_due_at).getTime() < Date.now();

  // Compute live preview message for the confirm sheet
  const selectedRejectObj = REJECT_REASONS.find((r) => r.code === rejectReasonCode);
  const previewContext = {
    slaDays: activeActionTarget ? STATUS_MAP[activeActionTarget].defaultSlaDays : 3,
    date:
      activeActionTarget === 'form_submitted'
        ? formSubmittedAt
        : activeActionTarget === 'enrolled'
        ? enrolledConfirmedAt
        : new Date().toISOString().slice(0, 10),
    ackNumber: formAckNumber || 'KA/2026/ERO/XXXXX',
    partNumber: enrolledPartNumber || 'XX',
    serialNumber: enrolledSerialNumber || 'YY',
    publicNote: publicNote,
    publicNoteKn: publicNote,
    rejectReason: selectedRejectObj?.publicTextEn,
    rejectReasonKn: selectedRejectObj?.publicTextKn,
    helpline: '+91 9845123456',
  };

  const previewEn = activeActionTarget
    ? STATUS_MAP[activeActionTarget].publicMessage.en(previewContext)
    : '';
  const previewKn = activeActionTarget
    ? STATUS_MAP[activeActionTarget].publicMessage.kn(previewContext)
    : '';

  // WhatsApp click link
  const waMessage = encodeURIComponent(
    `Namaskara ${request.elector_name},\n\nUpdate on your Voter Enrolment Request (${request.id}):\nStatus: ${currentStatusConfig.publicStepLabel.en} (${currentStatusConfig.publicStepLabel.kn}).\n\nTrack your progress live here:\n${window.location.origin}/track?ref=${encodeURIComponent(request.id)}\n\nShashi Hulikuntemutt Campaign Desk`
  );
  const waUrl = `https://wa.me/91${request.whatsapp || request.mobile}?text=${waMessage}`;

  // Execute transition
  const handleConfirmTransition = async () => {
    if (!activeActionTarget) return;
    setIsSubmittingAction(true);
    setErrorNotice(null);

    try {
      const payload: Record<string, any> = {
        status: activeActionTarget,
        actor_id: 'admin_desk_operator',
        reviewed_by: 'Election Operations Admin',
        internal_note: internalNote.trim() || undefined,
        public_note: publicNote.trim() || undefined,
        public_visible: isPublicVisible,
      };

      if (activeActionTarget === 'form_submitted') {
        if (!formAckNumber.trim()) {
          throw new Error('Acknowledgement number is mandatory for Form Submitted.');
        }
        payload.form_type = formType;
        payload.form_ack_number = formAckNumber.trim();
        payload.form_submitted_at = new Date(formSubmittedAt).toISOString();
      } else if (activeActionTarget === 'enrolled') {
        payload.enrolled_part_number = enrolledPartNumber.trim() || undefined;
        payload.enrolled_serial_number = enrolledSerialNumber.trim() || undefined;
        payload.enrolled_confirmed_at = new Date(enrolledConfirmedAt).toISOString();
      } else if (activeActionTarget === 'rejected') {
        payload.public_reject_reason_code = rejectReasonCode;
      }

      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status.');
      }

      onStatusUpdated(data.request);
      setActiveActionTarget(null);

      // Re-fetch events
      const evRes = await fetch(`/api/requests/${request.id}`);
      if (evRes.ok) {
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error updating status');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handlePromoteToRoll = async () => {
    if (!request || request.status !== 'enrolled') return;
    setIsPromoting(true);
    setPromoteSuccessMsg(null);
    setErrorNotice(null);

    try {
      const res = await fetch(`/api/requests/${request.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRole,
          actorId: 'supervisor_admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to promote record.');
      }

      setPromoteSuccessMsg('Successfully promoted to official electoral roll record!');

      // Re-fetch events
      const evRes = await fetch(`/api/requests/${request.id}`);
      if (evRes.ok) {
        const evData = await evRes.json();
        if (evData.events) setEvents(evData.events);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Error promoting record');
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    if (!window.confirm(`Are you sure you want to permanently delete request ${request.id} for "${request.elector_name}"? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, { method: 'DELETE' });
      if (res.ok) {
        onClose();
        if (onRequestDeleted) onRequestDeleted(request.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete request');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting request');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-hidden border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-800 text-blue-100 border border-blue-700">
                {request.id}
              </span>
              <span className="text-xs text-blue-200">
                {request.category || 'Graduates / Teachers Enrollment'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{request.elector_name}</span>
              {request.elector_name_kannada && (
                <span className="text-xs font-normal text-blue-200">
                  ({request.elector_name_kannada})
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Permanently delete request"
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-400/40 text-rose-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SLA Banner */}
          <div
            className={cn(
              'p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition shadow-2xs',
              isOverdue
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4', isOverdue ? 'text-rose-600' : 'text-blue-600')} />
              <span>
                {isOverdue ? '⚠️ SLA OVERDUE — Requires immediate action!' : 'SLA Target Window'}
              </span>
            </div>
            <div className="font-mono text-[11px]">
              Due: {new Date(request.sla_due_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Stepper Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Current Status &amp; Stepper
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                {currentStatusConfig.adminLabel}
              </span>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {LINEAR_STEPPER_STEPS.map((s) => {
                const isCurrent = request.status === s.key;
                const isCompleted =
                  currentStatusConfig.stepperIndex > s.step ||
                  (request.status === 'enrolled' && s.step <= 5);

                return (
                  <div key={s.key} className="flex flex-col items-center text-center space-y-1.5">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-2xs',
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold leading-tight',
                        isCurrent ? 'text-blue-900' : isCompleted ? 'text-emerald-900' : 'text-slate-400'
                      )}
                    >
                      {s.labelEn}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* If in branch status */}
            {currentStatusConfig.isBranchState && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Branch Status: {currentStatusConfig.adminLabel}</strong>
                  <span>{currentStatusConfig.publicMessage.en({ rejectReason: request.rejection_reason })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Allowed Next Actions
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                State transition enforcement active
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allowedNextActions.map((target) => {
                const conf = STATUS_MAP[target];
                const isPrimary =
                  (request.status === 'new' && target === 'contacted') ||
                  (request.status === 'contacted' && target === 'verified') ||
                  (request.status === 'verified' && target === 'form_submitted') ||
                  (request.status === 'form_submitted' && target === 'enrolled');

                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => setActiveActionTarget(target)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-2xs active:scale-95',
                      isPrimary
                        ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-300'
                        : target === 'rejected'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    )}
                  >
                    {conf.adminActionLabel || conf.adminLabel}
                  </button>
                );
              })}
            </div>

            {/* Promote to Roll Record (Section 4.8 & 5.6 Admin-only Action) */}
            {request.status === 'enrolled' && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">
                      Promote to Master Roll Record
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Confirmed in official roll. Writes entry to master electors directory.
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={userRole === 'operator' || isPromoting}
                    onClick={handlePromoteToRoll}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                    title={userRole === 'operator' ? 'Requires Supervisor or Admin role' : 'Promote now'}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>{isPromoting ? 'Promoting...' : 'Promote to Roll'}</span>
                  </button>
                </div>
                {userRole === 'operator' && (
                  <p className="text-[10px] text-amber-700 font-semibold">
                    🔒 Role restriction: Only Supervisor or Admin can promote records to the roll.
                  </p>
                )}
                {promoteSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">
                    ✓ {promoteSuccessMsg}
                  </div>
                )}
              </div>
            )}

            {/* Direct WhatsApp Contact Button */}
            <div className="pt-2 flex items-center gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Voter with Status Update</span>
              </a>
              <a
                href={`tel:${request.mobile}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Voter</span>
              </a>
            </div>
          </div>

          {/* Action Confirm Sheet (Inline) */}
          {activeActionTarget && (
            <div className="bg-sky-50/70 border-2 border-blue-400 rounded-3xl p-5 space-y-4 animate-fadeIn shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <h4 className="text-sm font-black text-blue-950">
                    Confirm Action: {STATUS_MAP[activeActionTarget].adminActionLabel}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveActionTarget(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form submitted specific fields */}
              {activeActionTarget === 'form_submitted' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Form Type</label>
                    <input
                      type="text"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Acknowledgement No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA/2026/ERO/98124"
                      value={formAckNumber}
                      onChange={(e) => setFormAckNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-400 bg-white font-mono font-bold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Filing Date</label>
                    <input
                      type="date"
                      value={formSubmittedAt}
                      onChange={(e) => setFormSubmittedAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Enrolled specific fields */}
              {activeActionTarget === 'enrolled' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900">
                    ⚠️ Statutory Warning: Confirming enrolment acknowledges that the name is physically verified in the published roll. This does NOT automatically modify master roll data.
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Part Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 124"
                        value={enrolledPartNumber}
                        onChange={(e) => setEnrolledPartNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Serial Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 119"
                        value={enrolledSerialNumber}
                        onChange={(e) => setEnrolledSerialNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected specific fields */}
              {activeActionTarget === 'rejected' && (
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">
                    Pre-Approved Public Rejection Reason *
                  </label>
                  <select
                    value={rejectReasonCode}
                    onChange={(e) => setRejectReasonCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white font-bold text-rose-950"
                  >
                    {REJECT_REASONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.labelEn} ({r.labelKn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Needs info or generic note */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">Internal Audit Note</label>
                <textarea
                  rows={2}
                  placeholder="Internal comments for volunteer desk (never shown to voter)..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800"
                />
              </div>

              {/* Public note if needs_info */}
              {activeActionTarget === 'needs_info' && (
                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">
                    Public Note (Shown on tracking page)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Clearly explain what details or documents the voter needs to provide..."
                    value={publicNote}
                    onChange={(e) => setPublicNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-400 bg-white font-medium text-slate-800"
                  />
                </div>
              )}

              {/* LIVE VOTER PREVIEW CARD */}
              <div className="bg-white rounded-2xl border border-blue-200 p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-blue-800">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Live Preview: What the Voter Will See on /track</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                  <p className="font-semibold text-slate-900 leading-relaxed">
                    🇬🇧 {previewEn}
                  </p>
                  <p className="font-semibold text-blue-950 leading-relaxed pt-1 border-t border-slate-200">
                    🇮🇳 {previewKn}
                  </p>
                </div>
              </div>

              {errorNotice && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-900 text-xs font-bold border border-rose-300">
                  {errorNotice}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveActionTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTransition}
                  disabled={isSubmittingAction}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingAction ? 'Processing...' : 'Confirm & Transition'}
                </button>
              </div>
            </div>
          )}

          {/* Elector Details Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Application Metadata
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block">Relative:</span>
                <strong className="text-slate-900">{request.relative_name} ({request.relation_type})</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <strong className="text-slate-900">{request.taluk} Taluk, {request.district}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile:</span>
                <strong className="font-mono text-blue-900">+91 {request.mobile}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Submitted At:</span>
                <span className="font-medium text-slate-700">
                  {new Date(request.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Immutable Audit Trail ({events.length})
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Append-only log
              </span>
            </div>

            {isLoadingEvents ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading audit events...</div>
            ) : events.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                No events recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div
                    key={ev.id || i}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-blue-700">
                          {ev.action}
                        </span>
                        {ev.public_visible ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            Public
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                            Internal
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {ev.public_note && (
                      <p className="text-slate-800 font-semibold bg-slate-50 p-2 rounded-xl">
                        "{ev.public_note}"
                      </p>
                    )}

                    {ev.internal_note && (
                      <p className="text-slate-500 italic text-[11px]">
                        Internal Note: {ev.internal_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
