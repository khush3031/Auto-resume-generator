'use client';

import type { ResumeExportFormat } from '../src/lib/api';

const EXPORT_OPTIONS: { value: ResumeExportFormat; label: string; buttonLabel: string }[] = [
  { value: 'pdf', label: 'PDF (.pdf)', buttonLabel: 'PDF' },
  { value: 'docx', label: 'Word (.docx)', buttonLabel: 'DOCX' },
  { value: 'doc', label: 'Word 97-2003 (.doc)', buttonLabel: 'DOC' },
];

export function ResumeExportControl({
  format,
  onFormatChange,
  onDownload,
  isDownloading,
  disabled = false,
  fullWidth = false,
}: {
  format: ResumeExportFormat;
  onFormatChange: (format: ResumeExportFormat) => void;
  onDownload: () => void;
  isDownloading: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const selected = EXPORT_OPTIONS.find((option) => option.value === format) ?? EXPORT_OPTIONS[0];

  return (
    <div className={`export-control${fullWidth ? ' export-control--full' : ''}`}>
      <label className="export-control__picker">
        <span className="sr-only">Select export format</span>
        <select
          value={format}
          onChange={(event) => onFormatChange(event.target.value as ResumeExportFormat)}
          className="export-control__select"
          aria-label="Select export format"
        >
          {EXPORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="export-control__chevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </label>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled || isDownloading}
        className="export-control__button"
      >
        {isDownloading ? `Preparing ${selected.buttonLabel}…` : `Download ${selected.buttonLabel}`}
      </button>
    </div>
  );
}
