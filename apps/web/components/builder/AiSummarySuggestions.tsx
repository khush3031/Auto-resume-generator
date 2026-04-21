'use client';
import { useState } from 'react';
import { aiApi } from '../../src/lib/ai-api';

interface Props {
  jobTitle: string;
  topSkills: string[];
  yearsOfExperience: string;
  currentRole: string;
  onSelect: (summary: string) => void;
}

export function AiSummarySuggestions({
  jobTitle,
  topSkills,
  yearsOfExperience,
  currentRole,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      setError('Please fill in your job title first.');
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    setSuggestions([]);
    try {
      const results = await aiApi.suggestSummary({
        jobTitle: jobTitle || 'Professional',
        yearsOfExperience: yearsOfExperience || '3+',
        topSkills,
        currentRole,
        targetRole: jobTitle || 'Professional',
      });
      setSuggestions(results);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Could not generate summaries. Check that your API key is configured.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-suggest-wrapper">
      <button
        type="button"
        onClick={handleGenerate}
        className="ai-suggest-trigger"
        disabled={loading}
      >
        <span className="ai-suggest-trigger__icon">✦</span>
        {loading ? 'Writing your story...' : 'AI Generate summary'}
      </button>

      {open && (
        <div className="ai-suggest-panel ai-suggest-panel--wide">
          <div className="ai-suggest-panel__header">
            <span className="ai-suggest-panel__title">Summary Options</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ai-suggest-panel__close"
            >
              ✕
            </button>
          </div>
          <p className="ai-suggest-panel__hint">
            Choose a summary or use one as a starting point.
          </p>

          {error && <p className="ai-suggest-error">{error}</p>}

          {loading && (
            <div className="ai-suggest-loading">
              <div className="ai-suggest-skeleton" style={{ height: 64 }} />
              <div className="ai-suggest-skeleton" style={{ height: 64 }} />
              <div className="ai-suggest-skeleton" style={{ height: 64 }} />
            </div>
          )}

          {!loading &&
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(s);
                  setOpen(false);
                }}
                className="ai-summary-option"
              >
                <span className="ai-summary-option__badge">Option {i + 1}</span>
                <span className="ai-summary-option__text">{s}</span>
                <span className="ai-summary-option__action">Use this →</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
