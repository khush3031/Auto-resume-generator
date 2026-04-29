'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { exportResumePdf } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth.store';

interface DownloadButtonProps {
  resumeId: string;
  iconOnly?: boolean;
  fullWidth?: boolean;
}

export function DownloadButton({ resumeId, iconOnly = false, fullWidth = false }: DownloadButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/preview/${resumeId}`);
      return;
    }
    try {
      setIsDownloading(true);
      const { blob, fileName } = await exportResumePdf(resumeId);
      const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label="Download PDF"
        className="dl-btn--icon"
      >
        {isDownloading ? (
          <svg className="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`dl-btn${fullWidth ? ' dl-btn--full' : ''}`}
    >
      {isDownloading ? 'Preparing…' : 'Download PDF'}
    </button>
  );
}
