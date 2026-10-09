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
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  CONSTITUENCY_DISTRICTS,
  getTaluksByDistrict,
  getCitiesByTaluk,
  getAllTaluks,
} from '@/lib/constituencyData';
import { VoterAdditionRequest } from '@/lib/requestsService';
import { RequestAddVoterModal } from '@/components/requests/RequestAddVoterModal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<VoterAdditionRequest[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [districtFilter, setDistrictFilter] = useState('all');
  const [talukFilter, setTalukFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VoterAdditionRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Duplicate entry detected in existing electoral roll');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load requests
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (districtFilter !== 'all') params.set('district', districtFilter);
      if (talukFilter !== 'all') params.set('taluk', talukFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load requests');
      const data = await res.json();
      setRequests(data.requests || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Error fetching voter requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [districtFilter, talukFilter, statusFilter]);

  // Dynamic taluks based on selected district
  const availableTaluks = useMemo(() => {
    if (districtFilter === 'all') {
      return getAllTaluks().map((t) => t.taluk);
    }
    return getTaluksByDistrict(districtFilter).map((t) => t.name);
  }, [districtFilter]);

  // Client-side quick filter on search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.elector_name.toLowerCase().includes(q) ||
        r.relative_name.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.taluk.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.existing_epic && r.existing_epic.toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  // Status Updater
  const handleUpdateStatus = async (
    id: string,
    newStatus: 'pending' | 'in_review' | 'approved' | 'rejected',
    reason?: string
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: reason,
          reviewed_by: 'Election Operations Admin',
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();

      // Update in local state
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated.request } : r))
      );
      if (selectedRequest?.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, ...updated.request } : null));
      }

      // Re-fetch stats
      fetchRequests();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
      setIsRejectModalOpen(false);
      setRejectionTargetId(null);
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
      Notes: r.notes || '',
      'Rejection Reason': r.rejection_reason || '',
      'Reviewed By': r.reviewed_by || '',
      'Submitted Date': new Date(r.created_at).toLocaleString('en-IN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Voter Requests');

    // Auto col width
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

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-sky-50 via-white to-sky-50/60 p-5 sm:p-6 rounded-3xl border border-sky-100 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-600 text-white shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Voter Addition Requests Operations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium pl-1">
            ಮತದಾರರ ಸೇರ್ಪಡೆ ವಿನಂತಿಗಳು • Real-time field application desk across 5 districts &amp; 30 constituencies.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRequests}
            title="Refresh requests"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin text-sky-600')} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>

          <Button
            type="button"
            onClick={handleExportExcel}
            variant="outline"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold"
          >
            Export Excel (.xlsx)
          </Button>

          <Button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            specular={true}
            lineColor="#7dd3fc"
            baseColor="#0284c7"
            leftIcon={<UserPlus className="w-4 h-4 text-sky-200" />}
            className="bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-black shadow-md"
          >
            + New Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <div className="text-2xl font-black mt-1">{stats.total}</div>
          <div className="text-[10px] mt-1 opacity-70">All applications</div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Pending</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.pending}</div>
          <div className="text-[10px] mt-1 opacity-80">Requires verification</div>
        </div>

        {/* In Review */}
        <div
          onClick={() => setStatusFilter('in_review')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'in_review'
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>In Review</span>
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.in_review}</div>
          <div className="text-[10px] mt-1 opacity-80">With Taluk desk</div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs',
            statusFilter === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Approved</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.approved}</div>
          <div className="text-[10px] mt-1 opacity-80">Enrolled in roll</div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={cn(
            'p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1',
            statusFilter === 'rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
          )}
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span>Rejected</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black mt-1">{stats.rejected}</div>
          <div className="text-[10px] mt-1 opacity-80">Flagged / Duplicates</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Voter Name, Mobile, Taluk, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setTalukFilter('all');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[40px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(districtFilter !== 'all' || talukFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold">Active filters:</span>
            {districtFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[11px]">
                Dist: {districtFilter}
              </span>
            )}
            {talukFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[11px]">
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
                setSearchQuery('');
              }}
              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] underline ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table / Requests List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Results Count Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="text-slate-900 font-black">{filteredRequests.length}</span>
            <span>of {requests.length} requests</span>
          </div>

          <span className="text-[11px] text-slate-400">
            Click row or actions to update status
          </span>
        </div>

        {/* Requests Table (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Elector Details</th>
                <th className="py-3 px-4">Relative</th>
                <th className="py-3 px-4">Location (Taluk/City)</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No voter addition requests found</p>
                      <p className="text-[11px]">Adjust your filters or register a new request above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-sky-50/30 transition cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
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
                        {req.gender} • {req.age} yrs
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
                        {req.taluk} Taluk
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {req.city} • {req.district}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${req.mobile}`}
                          className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 hover:text-sky-600"
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

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                        {req.category}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      )}
                      {req.status === 'in_review' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          In Review
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                          <X className="w-3 h-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition font-bold"
                            title="Approve & Enroll"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {req.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              setRejectionTargetId(req.id);
                              setIsRejectModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 transition font-bold"
                            title="Reject Request"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Requests Mobile Cards List */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No requests found</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="p-4 space-y-2.5 active:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-sky-700">
                    {req.id}
                  </span>
                  {/* Status Badge */}
                  {req.status === 'pending' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  )}
                  {req.status === 'in_review' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-100 text-sky-800">
                      In Review
                    </span>
                  )}
                  {req.status === 'approved' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                      Approved
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800">
                      Rejected
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {req.elector_name}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {req.relation_type}: {req.relative_name} • {req.gender}, {req.age}y
                  </p>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <span>
                    {req.taluk} Taluk, {req.city} ({req.district})
                  </span>
                </div>

                {/* Mobile Action Ribbon */}
                <div
                  className="flex items-center justify-between pt-1 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={`tel:${req.mobile}`}
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-800"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>+91 {req.mobile}</span>
                  </a>

                  <div className="flex items-center gap-2">
                    {req.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Details Drawer / Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-sky-800">
                    {selectedRequest.id}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-black uppercase',
                      selectedRequest.status === 'approved' && 'bg-emerald-100 text-emerald-800',
                      selectedRequest.status === 'pending' && 'bg-amber-100 text-amber-800',
                      selectedRequest.status === 'in_review' && 'bg-sky-100 text-sky-800',
                      selectedRequest.status === 'rejected' && 'bg-rose-100 text-rose-800'
                    )}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {selectedRequest.elector_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              {/* Personal Info Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Voter Identification
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Relative Name:</span>
                    <strong className="text-slate-900">{selectedRequest.relative_name} ({selectedRequest.relation_type})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gender &amp; Age:</span>
                    <strong className="text-slate-900">{selectedRequest.gender}, {selectedRequest.age} years</strong>
                  </div>
                  {selectedRequest.existing_epic && (
                    <div>
                      <span className="text-slate-500 block">Existing EPIC:</span>
                      <strong className="text-sky-700 font-mono">{selectedRequest.existing_epic}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Category:</span>
                    <strong className="text-slate-900">{selectedRequest.category}</strong>
                  </div>
                </div>
              </div>

              {/* Location Grid */}
              <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                  Constituency Location
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">District:</span>
                    <strong className="text-slate-900">{selectedRequest.district}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Taluk:</span>
                    <strong className="text-slate-900">{selectedRequest.taluk}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">City / Town / Ward:</span>
                    <strong className="text-slate-900">{selectedRequest.city}</strong>
                  </div>
                  {selectedRequest.polling_station && (
                    <div>
                      <span className="text-slate-500 block">Polling Station:</span>
                      <strong className="text-slate-900">{selectedRequest.polling_station}</strong>
                    </div>
                  )}
                </div>

                {selectedRequest.address && (
                  <div className="pt-2 border-t border-sky-200/60 text-xs">
                    <span className="text-slate-500 block">Residential Address:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedRequest.address} {selectedRequest.pincode ? `- ${selectedRequest.pincode}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Contact &amp; Submission
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Mobile:</span>
                    <a href={`tel:${selectedRequest.mobile}`} className="font-mono font-bold text-sky-700 underline">
                      +91 {selectedRequest.mobile}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block">WhatsApp:</span>
                    <a
                      href={`https://wa.me/91${selectedRequest.whatsapp || selectedRequest.mobile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-700 underline"
                    >
                      +91 {selectedRequest.whatsapp || selectedRequest.mobile}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submitted By:</span>
                    <strong className="text-slate-900">{selectedRequest.applicant_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Submission Date:</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(selectedRequest.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div className="pt-2 border-t border-slate-200/80 text-xs">
                    <span className="text-slate-500 block">Notes / Remarks:</span>
                    <p className="text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200">
                      "{selectedRequest.notes}"
                    </p>
                  </div>
                )}

                {selectedRequest.rejection_reason && (
                  <div className="pt-2 border-t border-rose-200 text-xs">
                    <span className="text-rose-600 font-bold block">Rejection Reason:</span>
                    <p className="text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {selectedRequest.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Change Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Change Status:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUpdatingStatus || selectedRequest.status === 'in_review'}
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'in_review')}
                  className="px-3 py-1.5 rounded-xl border border-sky-300 text-sky-800 hover:bg-sky-50 font-bold text-xs disabled:opacity-50"
                >
                  Mark In Review
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus || selectedRequest.status === 'approved'}
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs disabled:opacity-50"
                >
                  Approve &amp; Enroll
                </button>

                <button
                  type="button"
                  disabled={isUpdatingStatus || selectedRequest.status === 'rejected'}
                  onClick={() => {
                    setRejectionTargetId(selectedRequest.id);
                    setIsRejectModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {isRejectModalOpen && rejectionTargetId && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h4 className="text-base font-black">Reject Addition Request</h4>
            </div>

            <p className="text-xs text-slate-600">
              Please specify the reason for rejecting request{' '}
              <strong className="font-mono text-slate-900">{rejectionTargetId}</strong>:
            </p>

            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="Duplicate entry detected in existing electoral roll">
                Duplicate entry detected in existing electoral roll
              </option>
              <option value="Invalid or unverifiable address / out of constituency">
                Invalid or unverifiable address / out of constituency
              </option>
              <option value="Incomplete applicant documentation (Age / Identity proof)">
                Incomplete applicant documentation (Age / Identity proof)
              </option>
              <option value="Under-age elector (less than 18 years on qualifying date)">
                Under-age elector (less than 18 years on qualifying date)
              </option>
              <option value="Duplicate EPIC card number already registered">
                Duplicate EPIC card number already registered
              </option>
              <option value="Other / Contact details unreachable">
                Other / Contact details unreachable
              </option>
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionTargetId(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() =>
                  handleUpdateStatus(rejectionTargetId, 'rejected', rejectionReason)
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

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
