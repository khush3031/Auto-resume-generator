'use client';
import { useState } from 'react';
import { aiApi } from '../../src/lib/ai-api';

interface Props {
  jobTitle: string;
  experienceSummary: string;
  selectedSkills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}

export function AiSkillSuggestions({
  jobTitle,
  experienceSummary,
  selectedSkills,
  onAdd,
  onRemove,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<{
    technical: string[];
    soft: string[];
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!jobTitle) {
      setError('Please fill in your job title first.');
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    setSkills(null);
    try {
      const result = await aiApi.suggestSkills(
        jobTitle || 'Professional',
        experienceSummary,
      );
      setSkills(result);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Could not generate skill suggestions. Check that your API key is configured.',
      );
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (skill: string) =>
    selectedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());

  const handleChipClick = (skill: string) => {
    if (isSelected(skill)) onRemove(skill);
    else onAdd(skill);
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
        {loading ? 'Analysing your profile...' : 'AI Suggest skills'}
      </button>

      {open && (
        <div className="ai-suggest-panel">
          <div className="ai-suggest-panel__header">
            <span className="ai-suggest-panel__title">Suggested Skills</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ai-suggest-panel__close"
            >
              ✕
            </button>
          </div>
          <p className="ai-suggest-panel__hint">
            Click a skill to add it to your resume. Click again to remove.
          </p>

          {error && <p className="ai-suggest-error">{error}</p>}

          {loading && (
            <div className="ai-suggest-loading">
              <div className="ai-suggest-skeleton" style={{ height: 32 }} />
              <div className="ai-suggest-skeleton" style={{ height: 32 }} />
            </div>
          )}

          {!loading && skills && (
            <>
              <div className="ai-skill-group">
                <p className="ai-skill-group__label">Technical</p>
                <div className="ai-skill-chips">
                  {skills.technical.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleChipClick(skill)}
                      className={`ai-skill-chip${isSelected(skill) ? ' ai-skill-chip--selected' : ''}`}
                    >
                      {isSelected(skill) ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ai-skill-group">
                <p className="ai-skill-group__label">Soft Skills</p>
                <div className="ai-skill-chips">
                  {skills.soft.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleChipClick(skill)}
                      className={`ai-skill-chip${isSelected(skill) ? ' ai-skill-chip--selected' : ''}`}
                    >
                      {isSelected(skill) ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
