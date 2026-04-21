'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../src/lib/api';

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

const TEMPLATES = [
  { id: 'classic',    name: 'Classic'    },
  { id: 'minimal',    name: 'Minimal'    },
  { id: 'executive',  name: 'Executive'  },
  { id: 'modern',     name: 'Modern'     },
  { id: 'elegant',    name: 'Elegant'    },
  { id: 'bold',       name: 'Bold'       },
  { id: 'clean-grid', name: 'Clean Grid' },
  { id: 'ats',        name: 'ATS'        },
];

const HOW_STEPS = [
  { icon: '📄', t: 'Upload',    d: 'Drop your PDF or image resume'      },
  { icon: '✦',  t: 'AI Parse', d: 'Claude AI extracts all your details' },
  { icon: '✏️', t: 'Edit',     d: 'Review and refine in the live builder' },
  { icon: '⬇️', t: 'Download', d: 'Export a polished PDF'               },
];

export default function UploadPage() {
  const router = useRouter();
  const [state, setState]       = useState<UploadState>('idle');
  const [error, setError]       = useState('');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  const handleFile = useCallback(async (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG, or WEBP file.');
      setState('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      setState('error');
      return;
    }
    setState('uploading');
    setError('');
    setProgress(20);
    const fd = new FormData();
    fd.append('file', file);
    try {
      setState('parsing');
      setProgress(60);
      const { data } = await api.post('/upload/parse-resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProgress(95);
      setState('success');
      sessionStorage.setItem(
        `parsed_resume_${selectedTemplate}`,
        JSON.stringify(data.data),
      );
      setTimeout(() => router.push(`/builder/${selectedTemplate}?source=upload`), 800);
    } catch (err: any) {
      setState('error');
      setError(err?.response?.data?.message || 'Failed to parse resume. Please try a different file.');
    }
  }, [selectedTemplate, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const isProcessing = state === 'uploading' || state === 'parsing';

  return (
    <div className="upl-page">

      {/* ── Hero header ── */}
      <div className="upl-hero">
        <p className="text-eyebrow">Upload &amp; Rebuild</p>
        <h1 className="upl-hero__title">
          Rebuild your resume<br />in a new style
        </h1>
        <p className="upl-hero__subtitle">
          Upload your existing resume as a PDF or image. Claude AI extracts your
          information and rebuilds it in any template — instantly.
        </p>
      </div>

      {/* ── Main form area ── */}
      <div className="upl-body">

        {/* Step 1 — template picker */}
        <div className="upl-card">
          <div className="upload-step__label">
            <span className="upload-step__num">1</span>
            Choose your new template style
          </div>
          <div className="upload-template-grid">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={`upload-template-chip${selectedTemplate === t.id ? ' upload-template-chip--active' : ''}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — file drop */}
        <div className="upl-card">
          <div className="upload-step__label">
            <span className="upload-step__num">2</span>
            Upload your current resume
          </div>
          <label
            className={[
              'upload-dropzone',
              dragOver        ? 'upload-dropzone--drag'  : '',
              state === 'error' ? 'upload-dropzone--error' : '',
            ].filter(Boolean).join(' ')}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />

            {(state === 'idle' || state === 'error') && (
              <div className="upload-dropzone__inner">
                <div className="upload-dropzone__icon">
                  <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="upload-dropzone__text">
                  Drag &amp; drop your resume here or{' '}
                  <span className="upload-dropzone__link">browse files</span>
                </p>
                <p className="upload-dropzone__hint">PDF, JPG, PNG, WEBP · Max 10 MB</p>
              </div>
            )}

            {isProcessing && (
              <div className="upload-dropzone__inner">
                <div className="upload-progress">
                  <div className="upload-progress__bar">
                    <div className="upload-progress__fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="upload-progress__label">
                    {state === 'uploading' ? 'Uploading your resume…' : '✦ AI is reading your resume…'}
                  </p>
                </div>
              </div>
            )}

            {state === 'success' && (
              <div className="upload-dropzone__inner">
                <div className="upload-success">
                  <div className="upload-success__icon">✓</div>
                  <p className="upload-success__text">Resume parsed! Redirecting to builder…</p>
                </div>
              </div>
            )}
          </label>
          {error && <p className="upload-error">{error}</p>}
        </div>

        {/* How it works */}
        <div className="upl-how">
          <p className="upl-how__label">How it works</p>
          <div className="upl-how__grid">
            {HOW_STEPS.map((s) => (
              <div key={s.t} className="upl-how__step">
                <span className="upl-how__icon">{s.icon}</span>
                <strong className="upl-how__step-title">{s.t}</strong>
                <span className="upl-how__step-desc">{s.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/templates" className="btn btn--outline btn--sm">
            ← Browse templates instead
          </Link>
        </div>

      </div>
    </div>
  );
}
