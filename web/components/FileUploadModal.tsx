'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

interface UploadReport {
  fileName: string;
  fileFormat?: string;
  sheetsParsed?: number;
  totalRawRows: number;
  validRecords: number;
  upsertedRecords: number;
  duplicateRecords?: number;
  droppedRecords: number;
  durationMs: number;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [report, setReport] = useState<UploadReport | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv', 'pdf'].includes(ext || '')) {
      setSelectedFile(file);
      setUploadError(null);
      setReport(null);
    } else {
      setSelectedFile(null);
      setUploadError(
        'Invalid file format. Please select an Excel spreadsheet (.xlsx, .xls, .csv) or PDF document (.pdf).'
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setIsUploading(false);

      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload and process dataset.');
      } else {
        setReport(data);
        if (onUploadSuccess) onUploadSuccess();
      }
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'An unexpected error occurred during upload.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadError(null);
    setReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-elevated border border-slate-200/80 overflow-hidden flex flex-col h-[90dvh] sm:h-auto sm:max-h-[90vh] animate-fadeInUp sm:animate-scaleIn">
        {/* Mobile Drag Indicator Bar */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-2xs">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                Upload Voter Dataset
              </h3>
              <p className="text-[11px] text-slate-500">Excel (.xlsx, .csv) &amp; PDF (.pdf)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl active:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* Format Badges & Instructions */}
          {!report && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs px-1">
              <span className="text-slate-500 font-medium">Supported File Formats:</span>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  .XLSX
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  .CSV
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  .PDF
                </span>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {!report && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                  : selectedFile
                  ? 'border-brand-300 bg-brand-50/20'
                  : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-2xs">
                    {selectedFile.name.endsWith('.pdf') ? (
                      <FileText className="w-6 h-6 text-rose-600" />
                    ) : (
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-xs mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB •{' '}
                      {selectedFile.name.split('.').pop()?.toUpperCase()} Document
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="text-xs text-brand-600 hover:text-brand-800 font-bold underline"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-brand-400 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Tap to browse or drop file here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Excel spreadsheets (.xlsx, .csv) or PDF files (.pdf)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Ingestion Report Summary */}
          {report && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Dataset Processed &amp; Ingested!</span>
                </div>
                {report.fileFormat && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {report.fileFormat} FORMAT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <p className="text-slate-500 text-[11px]">Unique Voters Ingested</p>
                  <p className="font-extrabold text-emerald-600 text-base sm:text-lg mt-0.5 font-mono">
                    {report.upsertedRecords.toLocaleString()}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <p className="text-slate-500 text-[11px]">Sheets Processed</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5 flex items-center gap-1 font-mono">
                    <Layers className="w-3.5 h-3.5 text-brand-500" />
                    <span>
                      {report.sheetsParsed || 1}{' '}
                      {report.sheetsParsed === 1 ? 'Sheet' : 'Sheets'}
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <p className="text-slate-500 text-[11px]">Duplicates Handled</p>
                  <p className="font-bold text-brand-600 text-sm mt-0.5 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                    <span>{report.duplicateRecords || 0} Merged</span>
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <p className="text-slate-500 text-[11px]">Raw Rows Scanned</p>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                    {report.totalRawRows.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-emerald-700 pt-1 font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Processed in {report.durationMs}ms</span>
                </span>
                <span className="font-bold">Idempotent Deduplication</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Footer with Safe Area */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {report ? (
            <>
              <Button variant="secondary" size="md" onClick={handleReset} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Upload Another
              </Button>
              <Button variant="primary" size="md" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
                loadingText="Parsing & Ingesting..."
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload &amp; Ingest
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
