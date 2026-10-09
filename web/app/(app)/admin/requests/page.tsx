'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Check,
  X,
  Phone,
  MessageSquare,
  Download,
  RefreshCw,
  UserPlus,
  MapPin,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  ChevronRight,
  User,
  ShieldCheck,
  ArrowUpDown,
  ExternalLink,
  Send,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  CONSTITUENCY_DISTRICTS,
  getTaluksByDistrict,
  getCitiesByTaluk,
  getAllTaluks,
} from '@/lib/constituencyData';
import { VoterAdditionRequest } from '@/lib/requestsService';
import { STATUS_MAP, getStatusConfig, RequestStatus, ALLOWED_TRANSITIONS } from '@/lib/status-map';
import { AdminRequestDetailDrawer } from '@/components/requests/AdminRequestDetailDrawer';
import { RequestAddVoterModal } from '@/components/requests/RequestAddVoterModal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<VoterAdditionRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    documents_pending: 0,
    needs_info: 0,
    verified: 0,
    form_submitted: 0,
    enrolled: 0,
    rejected: 0,
    duplicate: 0,
    closed: 0,
    overdue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated user role from default login (Section 5.6)
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'operator' | 'field_agent'>('admin');

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.role) setUserRole(data.role);
        }
      } catch {}
    }
    loadRole();
  }, []);

  // Multi-selection for bulk actions (Section 5.5)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  // Filters (Search section removed from admin page per requirements)
  const [districtFilter, setDistrictFilter] = useState('all');
  const [talukFilter, setTalukFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VoterAdditionRequest | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load requests with real-time support
  const fetchRequests = async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
    } else {
      setIsSyncing(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.set('district', districtFilter);
      if (talukFilter !== 'all') params.set('taluk', talukFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load requests');
      const data = await res.json();
      setRequests(data.requests || []);
      if (data.stats) setStats(data.stats);
      setLastSynced(new Date());
    } catch (err: any) {
      if (!isBackground) {
        setError(err.message || 'Error fetching voter requests');
      }
    } finally {
      if (!isBackground) setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchRequests(false);

    const interval = setInterval(() => {
      fetchRequests(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [districtFilter, talukFilter, statusFilter]);

  // Dynamic taluks based on selected district
  const availableTaluks = useMemo(() => {
    if (districtFilter === 'all') {
      return getAllTaluks().map((t) => t.taluk);
    }
    return getTaluksByDistrict(districtFilter).map((t) => t.name);
  }, [districtFilter]);

  // Requests filtered by status and location
  const filteredRequests = requests;

  // Selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Inspect selection uniformity for Section 5.5 bulk rules
  const selectedItems = useMemo(
    () => requests.filter((r) => selectedIds.includes(r.id)),
    [requests, selectedIds]
  );

  const isUniformSelection = useMemo(() => {
    if (selectedItems.length <= 1) return true;
    const firstStatus = selectedItems[0].status;
    return selectedItems.every((r) => r.status === firstStatus);
  }, [selectedItems]);

  const commonStatus = selectedItems.length > 0 ? selectedItems[0].status : null;

  // Allowed non-terminal bulk actions
  const allowedBulkTargets = useMemo(() => {
    if (!isUniformSelection || !commonStatus) return [];
    const targets = ALLOWED_TRANSITIONS[commonStatus] || [];
    // Strict prompt rule: Never bulk enrolled or bulk rejected
    return targets.filter((t) => !['enrolled', 'rejected'].includes(t));
  }, [isUniformSelection, commonStatus]);

  // Bulk transition action
  const handleExecuteBulkAction = async (targetStatus: RequestStatus) => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    setBulkNotice(null);

    try {
      const res = await fetch('/api/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestIds: selectedIds,
          targetStatus,
          actorId: `${userRole}_desk`,
          batchNote: `Batch transition to ${targetStatus} executed by ${userRole}.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk transition failed');

      setBulkNotice(`Successfully transitioned ${data.count} requests to "${targetStatus}".`);
      setSelectedIds([]);
      fetchRequests(true);
      setTimeout(() => setBulkNotice(null), 4000);
    } catch (err: any) {
      setBulkNotice(`Error: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      alert('No requests to export with current filters');
      return;
    }

    const exportRows = filteredRequests.map((r) => ({
      'Request ID': r.id,
      Status: r.status.toUpperCase(),
      'Public Step': STATUS_MAP[r.status]?.publicStepLabel.en || r.status,
      'Voter Name': r.elector_name,
      'Kannada Name': r.elector_name_kannada || '',
      'Relative Name': r.relative_name,
      Relation: r.relation_type,
      Gender: r.gender,
      Age: r.age,
      District: r.district,
      Taluk: r.taluk,
      'City / Town / Ward': r.city,
      'Polling Station': r.polling_station || '',
      Address: r.address || '',
      Pincode: r.pincode || '',
      Mobile: r.mobile,
      WhatsApp: r.whatsapp || r.mobile,
      Category: r.category,
      'Applicant Type': r.applicant_type,
      'Existing EPIC': r.existing_epic || 'N/A',
      'Form Type': r.form_type || 'Form 18',
      'Ack Number': r.form_ack_number || '',
      'Enrolled Part': r.enrolled_part_number || '',
      'Enrolled Serial': r.enrolled_serial_number || '',
      'SLA Due': r.sla_due_at ? new Date(r.sla_due_at).toLocaleString('en-IN') : '',
      'Submitted Date': new Date(r.created_at).toLocaleString('en-IN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voter Requests');

    const colWidths = Object.keys(exportRows[0]).map((key) => ({
      wch: Math.max(key.length, 16),
    }));
    worksheet['!cols'] = colWidths;

    const fileName = `Voter_Addition_Requests_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportCsv = () => {
    if (filteredRequests.length === 0) {
      alert('No requests to export');
      return;
    }

    const exportRows = filteredRequests.map((r) => ({
      'Request ID': r.id,
      Status: r.status,
      'Voter Name': r.elector_name,
      Relative: r.relative_name,
      District: r.district,
      Taluk: r.taluk,
      City: r.city,
      Mobile: r.mobile,
      Category: r.category,
      Date: new Date(r.created_at).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Voter_Addition_Requests_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const nowTime = Date.now();

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 via-white to-blue-50/60 p-5 sm:p-6 rounded-3xl border border-blue-100 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Voter Enrolment Request Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium pl-1">
            ಮತದಾರರ ಸೇರ್ಪಡೆ ವಿನಂತಿಗಳು • Form 18 application workflow across 5 districts.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Default Login Role Badge (Fixed, non-shifting) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs text-xs select-none">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
              ROLE:
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg font-black transition',
                userRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600'
              )}
            >
              Admin
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg font-black transition',
                userRole === 'supervisor'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600'
              )}
            >
              Supervisor
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg font-black transition',
                userRole === 'operator'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600'
              )}
            >
              Operator
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg font-black transition',
                userRole === 'field_agent'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600'
              )}
            >
              Worker
            </span>
          </div>

          {/* Live Sync Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className={cn("w-2 h-2 rounded-full bg-emerald-500", isSyncing ? "animate-ping" : "animate-pulse")} />
            <span>Live Sync</span>
            {lastSynced && (
              <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">
                ({lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchRequests(false)}
            title="Force refresh now"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition active:scale-95"
          >
            <RefreshCw className={cn('w-4 h-4', (isLoading || isSyncing) && 'animate-spin text-blue-600')} />
          </button>

          <Button
            type="button"
            onClick={handleExportExcel}
            variant="outline"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
          >
            Export Excel
          </Button>

          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            specular={true}
            lineColor="#7dd3fc"
            baseColor="#1d4ed8"
            leftIcon={<UserPlus className="w-4 h-4 text-blue-200" />}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md"
          >
            + New Request
          </Button>
        </div>
      </div>

      {/* KPI Cards: Section 5.4 Prominent SLA / Overdue counter */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('all')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          )}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            Total Requests
          </div>
          <div className="text-2xl font-black mt-1">{stats.total || 0}</div>
          <div className="text-[10px] mt-1 opacity-70">All applications</div>
        </div>

        {/* Overdue / Needs Attention */}
        <div
          onClick={() => setStatusFilter('all')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            (stats.overdue || 0) > 0
              ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 text-slate-700'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Needs Attention</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-2xl font-black mt-1 text-rose-700">{stats.overdue || 0}</div>
          <div className="text-[10px] mt-1 text-rose-600 font-semibold">Overdue SLA</div>
        </div>

        {/* Received */}
        <div
          onClick={() => setStatusFilter('new')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'new'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100/70'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Received</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.new || 0}</div>
          <div className="text-[10px] mt-1 opacity-80">New applications</div>
        </div>

        {/* Verified by Team */}
        <div
          onClick={() => setStatusFilter('verified')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'verified'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Verified</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.verified || 0}</div>
          <div className="text-[10px] mt-1 opacity-80">Ready for filing</div>
        </div>

        {/* Form Submitted */}
        <div
          onClick={() => setStatusFilter('form_submitted')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'form_submitted'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Form Submitted</span>
            <Send className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.form_submitted || 0}</div>
          <div className="text-[10px] mt-1 opacity-80">Filed at ERO desk</div>
        </div>

        {/* Confirmed in Roll */}
        <div
          onClick={() => setStatusFilter('enrolled')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'enrolled'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Confirmed</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.enrolled || 0}</div>
          <div className="text-[10px] mt-1 opacity-80">In published roll</div>
        </div>
      </div>

      {/* Operational Filter Bar (Search section moved to Analyst dashboard) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District Filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setTalukFilter('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
            >
              <option value="all">All Districts (5)</option>
              {CONSTITUENCY_DISTRICTS.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Taluk Filter (Dynamic) */}
          <div>
            <select
              value={talukFilter}
              onChange={(e) => setTalukFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
            >
              <option value="all">All Taluks</option>
              {availableTaluks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
            >
              <option value="all">All Statuses</option>
              <option value="new">Received (New)</option>
              <option value="contacted">Contacted</option>
              <option value="documents_pending">Documents Needed</option>
              <option value="needs_info">Needs Info</option>
              <option value="verified">Verified by Team</option>
              <option value="form_submitted">Form Submitted</option>
              <option value="enrolled">Confirmed in Roll</option>
              <option value="rejected">Could Not Process</option>
              <option value="duplicate">Already in Roll</option>
              <option value="closed">Closed / Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(districtFilter !== 'all' || talukFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold">Active filters:</span>
            {districtFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                Dist: {districtFilter}
              </span>
            )}
            {talukFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                Taluk: {talukFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                Status: {statusFilter}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setDistrictFilter('all');
                setTalukFilter('all');
                setStatusFilter('all');
              }}
              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] underline ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Sticky Bar (Section 5.5) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-blue-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-slideDown">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-blue-300" />
            <span className="text-xs font-black">
              {selectedIds.length} request{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            {!isUniformSelection && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/30">
                ⚠️ Mixed statuses: Select items of same status for bulk actions
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isUniformSelection &&
              allowedBulkTargets.map((target) => (
                <button
                  key={target}
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleExecuteBulkAction(target)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs transition disabled:opacity-50"
                >
                  {isBulkProcessing
                    ? 'Processing...'
                    : `Bulk: ${STATUS_MAP[target].adminActionLabel || STATUS_MAP[target].adminLabel}`}
                </button>
              ))}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {bulkNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl text-xs font-bold animate-fadeIn">
          {bulkNotice}
        </div>
      )}

      {/* Main Table / Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredRequests.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3.5 px-3">Ref ID</th>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Relative</th>
                <th className="py-3.5 px-4">Constituency / Taluk</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">SLA / Window</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
                        <ClipboardList className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-800">
                          No Voter Requests Match
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                          Try adjusting your filters or search query. New public submissions will appear here automatically.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isItemOverdue =
                    !['enrolled', 'rejected', 'duplicate', 'closed', 'withdrawn'].includes(req.status) &&
                    new Date(req.sla_due_at).getTime() < nowTime;
                  const cfg = getStatusConfig(req.status);
                  const isChecked = selectedIds.includes(req.id);

                  return (
                    <tr
                      key={req.id}
                      className={cn(
                        'hover:bg-blue-50/30 transition cursor-pointer',
                        isChecked && 'bg-blue-50/50',
                        isItemOverdue && !isChecked && 'bg-rose-50/20'
                      )}
                      onClick={() => setSelectedRequest(req)}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleSelect(req.id, e)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        {req.id}
                      </td>

                      {/* Elector */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">
                          {req.elector_name}
                        </div>
                        {req.elector_name_kannada && (
                          <div className="text-[11px] text-slate-500">
                            {req.elector_name_kannada}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {req.gender} • {req.age ? `${req.age} yrs` : 'Grad voter'}
                        </div>
                      </td>

                      {/* Relative */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {req.relative_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ({req.relation_type})
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {req.taluk}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {req.city ? `${req.city} • ` : ''}{req.district}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${req.mobile}`}
                            className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 hover:text-blue-600"
                            title="Call voter"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>+91 {req.mobile}</span>
                          </a>
                          <a
                            href={`https://wa.me/91${req.whatsapp || req.mobile}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>
                      </td>

                      {/* SLA Due */}
                      <td className="py-3.5 px-4">
                        {isItemOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500">
                            {new Date(req.sla_due_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider',
                            cfg.badgeVariant === 'primary' && 'bg-blue-100 text-blue-800',
                            cfg.badgeVariant === 'indigo' && 'bg-indigo-100 text-indigo-800',
                            cfg.badgeVariant === 'success' && 'bg-emerald-100 text-emerald-800',
                            cfg.badgeVariant === 'warning' && 'bg-amber-100 text-amber-800',
                            cfg.badgeVariant === 'error' && 'bg-rose-100 text-rose-800',
                            cfg.badgeVariant === 'secondary' && 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {req.status === 'enrolled' && <Check className="w-3 h-3 text-emerald-600" />}
                          {req.status === 'rejected' && <X className="w-3 h-3 text-rose-600" />}
                          <span>{cfg.publicStepLabel.en}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-bold text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Requests Mobile Cards List */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-800">No Requests Found</p>
                <p className="text-xs text-slate-500 mt-0.5">Adjust search criteria or check live sync.</p>
              </div>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isItemOverdue =
                !['enrolled', 'rejected', 'duplicate', 'closed', 'withdrawn'].includes(req.status) &&
                new Date(req.sla_due_at).getTime() < nowTime;
              const cfg = getStatusConfig(req.status);

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    'p-4 space-y-2.5 active:bg-blue-50/50 transition cursor-pointer',
                    isItemOverdue && 'bg-rose-50/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700">
                      {req.id}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                        cfg.badgeVariant === 'primary' && 'bg-blue-100 text-blue-800',
                        cfg.badgeVariant === 'indigo' && 'bg-indigo-100 text-indigo-800',
                        cfg.badgeVariant === 'success' && 'bg-emerald-100 text-emerald-800',
                        cfg.badgeVariant === 'warning' && 'bg-amber-100 text-amber-800',
                        cfg.badgeVariant === 'error' && 'bg-rose-100 text-rose-800',
                        cfg.badgeVariant === 'secondary' && 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {cfg.publicStepLabel.en}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {req.elector_name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {req.taluk} Taluk • {req.district}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono text-slate-700">+91 {req.mobile}</span>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs"
                    >
                      Manage &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Admin Request Detail Drawer */}
      <AdminRequestDetailDrawer
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        userRole={userRole}
        onStatusUpdated={(updated) => {
          setRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          );
          setSelectedRequest(updated);
          fetchRequests(true);
        }}
        onRequestDeleted={(deletedId) => {
          setRequests((prev) => prev.filter((r) => r.id !== deletedId));
          setSelectedRequest(null);
          fetchRequests(false);
        }}
      />

      {/* Add Request Modal */}
      <RequestAddVoterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchRequests();
        }}
      />
    </div>
  );
}
