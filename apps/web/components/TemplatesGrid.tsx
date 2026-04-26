'use client';
import { useEffect, useState } from 'react';
import { TemplateCard } from './TemplateCard';

interface TemplateMeta {
  id: string;
  name: string;
  style: string;
  htmlContent?: string;
  previewHtml?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 6000;

export function TemplatesGrid() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [status, setStatus] = useState<'loading' | 'waking' | 'error' | 'done'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [activeStyle, setActiveStyle] = useState<'All' | string>('All');

  useEffect(() => {
    let cancelled = false;

    async function fetchWithRetry() {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        if (i > 0) setStatus('waking');
        setAttempt(i + 1);

        try {
          const res = await fetch(`${API_URL}/templates`, {
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) throw new Error(`${res.status}`);
          const json = await res.json();
          if (!cancelled) {
            setTemplates(json.data ?? []);
            setStatus('done');
          }
          return;
        } catch {
          if (i < MAX_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          }
        }
      }
      if (!cancelled) setStatus('error');
    }

    fetchWithRetry();
    return () => { cancelled = true; };
  }, []);

  const styleOptions = ['All', ...Array.from(new Set(templates.map((template) => template.style)))];
  const filteredTemplates = activeStyle === 'All'
    ? templates
    : templates.filter((template) => template.style === activeStyle);

  if (status === 'done' && templates.length > 0) {
    return (
      <>
        <div className="template-toolbar">
          <div className="template-toolbar__chips">
            {styleOptions.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setActiveStyle(style)}
                className={`template-toolbar__chip${activeStyle === style ? ' template-toolbar__chip--active' : ''}`}
              >
                {style}
              </button>
            ))}
          </div>
          <p className="template-toolbar__count">
            {filteredTemplates.length} template{filteredTemplates.length === 1 ? '' : 's'} ready
          </p>
        </div>

        <div className="template-grid">
          {filteredTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </>
    );
  }

  if (status === 'error') {
    return (
      <div className="empty-state">
        <div className="empty-state__icon-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="empty-state__title">Could not reach the server</p>
        <p className="empty-state__desc">The server may be busy. Please refresh the page to try again.</p>
        <button className="btn btn--primary btn--sm" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap templates-wakeup-spinner" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>
      {status === 'waking' ? (
        <>
          <p className="empty-state__title">Waking up the server…</p>
          <p className="empty-state__desc">
            Free servers sleep after inactivity. This usually takes under a minute.
            {attempt > 2 && ` (attempt ${attempt} of ${MAX_ATTEMPTS})`}
          </p>
        </>
      ) : (
        <>
          <p className="empty-state__title">Loading templates…</p>
          <p className="empty-state__desc">Connecting to server</p>
        </>
      )}
    </div>
  );
}
