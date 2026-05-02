'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { exportResumeFile, ResumeExportFormat } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth.store';
import { ResumeExportControl } from './ResumeExportControl';

interface DownloadButtonProps {
  resumeId: string;
  fullWidth?: boolean;
}

export function DownloadButton({ resumeId, fullWidth = false }: DownloadButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [format, setFormat] = useState<ResumeExportFormat>('pdf');

  const handleDownload = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/preview/${resumeId}`);
      return;
    }
    try {
      setIsDownloading(true);
      const { blob, fileName, mimeType } = await exportResumeFile(resumeId, format);
      const url  = URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const a    = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ResumeExportControl
      format={format}
      onFormatChange={setFormat}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      fullWidth={fullWidth}
    />
  );
}
