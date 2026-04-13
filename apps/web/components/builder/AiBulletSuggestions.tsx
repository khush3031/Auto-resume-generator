'use client';
import { useState } from 'react';
import { aiApi } from '../../src/lib/ai-api';

interface Props {
  jobTitle: string;
  company: string;
  existingBullets: string[];
  onSelect: (bullet: string) => void;
}

export function AiBulletSuggestions({
  jobTitle,
  company,
  existingBullets,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    if (!jobTitle && !company) {
      setError('Please fill in the job title and company first.');
      setOpen(true);
      return;
    }
    setLoading(true);
    setError('');
    setOpen(true);
    try {
      const results = await aiApi.suggestBullets(
        jobTitle,
        company,
        existingBullets,
      );
      setSuggestions(results);
    } catch {
      setError('Could not generate suggestions. Try again.');
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
        {loading ? 'Generating...' : 'AI Suggest bullets'}
      </button>

      {open && (
        <div className="ai-suggest-panel">
          <div className="ai-suggest-panel__header">
            <span className="ai-suggest-panel__title">AI Suggestions</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ai-suggest-panel__close"
            >
              ✕
            </button>
          </div>

          {error && <p className="ai-suggest-error">{error}</p>}

          {loading && (
            <div className="ai-suggest-loading">
              <div className="ai-suggest-skeleton" />
              <div className="ai-suggest-skeleton" />
              <div className="ai-suggest-skeleton" />
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
                className="ai-suggest-item"
              >
                <span className="ai-suggest-item__text">{s}</span>
                <span className="ai-suggest-item__action">Use →</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
