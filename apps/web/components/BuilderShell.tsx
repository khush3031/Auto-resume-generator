'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createResume, exportResumePdf, updateResume } from '../src/lib/api';
import { useAuthStore } from '../src/store/auth.store';
import { AuthModal } from './AuthModal';
import { ResumePreviewer } from './ResumePreviewer';
import { AiBulletSuggestions } from './builder/AiBulletSuggestions';
import { AiSkillSuggestions } from './builder/AiSkillSuggestions';
import { AiSummarySuggestions } from './builder/AiSummarySuggestions';

const baseFormData: Record<string, string> = {
  fullName: '', jobTitle: '', email: '', phone: '',
  location: '', linkedin: '', website: '', initials: '', summary: '',
};

const sampleData: Record<string, string> = {
  fullName:  'Alex Johnson',        jobTitle:  'Senior Software Engineer',
  email:     'alex@example.com',    phone:     '+1 (555) 234-5678',
  location:  'San Francisco, CA',   linkedin:  'linkedin.com/in/alexjohnson',
  website:   'alexjohnson.dev',     initials:  'AJ',
  summary:   'Results-driven software engineer with 6+ years building scalable web applications. Passionate about clean architecture, developer experience, and shipping products that users love.',

  job1Title: 'Senior Software Engineer', job1Company:  'TechCorp Inc.',
  job1Location: 'San Francisco, CA',     job1Start: 'Jan 2021', job1End: 'Present',
  job1Bullet1: 'Led microservices redesign serving 2 M+ daily active users',
  job1Bullet2: 'Cut API p95 latency by 40 % through query optimisation',
  job1Bullet3: 'Mentored 4 junior engineers and ran technical interviews',

  job2Title: 'Software Engineer',    job2Company: 'StartupXYZ',
  job2Location: 'Remote',            job2Start: 'Jun 2019', job2End: 'Dec 2020',
  job2Bullet1: 'Built React dashboard adopted by 500+ enterprise clients',
  job2Bullet2: 'Automated CI/CD pipeline, reducing deploy time by 60 %',

  degree: 'B.S. Computer Science',  university:    'University of California, Berkeley',
  graduationYear: '2019',

  skill1: 'TypeScript', skill2: 'React',      skill3: 'Node.js',
  skill4: 'PostgreSQL', skill5: 'Docker',

  lang1: 'English', lang1Level: 'Native',
  lang2: 'Spanish', lang2Level: 'Conversational',

  cert1: 'AWS Certified Developer',   cert1Issuer: 'Amazon Web Services', cert1Year: '2022',
  cert2: 'Google Cloud Professional', cert2Issuer: 'Google',              cert2Year: '2023',
};

function experienceFields(n: number): Record<string, string> {
  return {
    [`job${n}Title`]: '', [`job${n}Company`]: '', [`job${n}Location`]: '',
    [`job${n}Start`]: '', [`job${n}End`]:     '',
    [`job${n}Bullet1`]: '', [`job${n}Bullet2`]: '', [`job${n}Bullet3`]: '',
  };
}
function educationFields(n: number): Record<string, string> {
  const p = n === 1 ? '' : String(n);
  return { [`degree${p}`]: '', [`university${p}`]: '', [`graduationYear${p}`]: '' };
}
function certFields(n: number): Record<string, string> {
  return { [`cert${n}`]: '', [`cert${n}Issuer`]: '', [`cert${n}Year`]: '' };
}
function skillFields(n: number): Record<string, string> { return { [`skill${n}`]: '' }; }
function langFields(n: number): Record<string, string> {
  return { [`lang${n}`]: '', [`lang${n}Level`]: '' };
}

function sanitizeEncoding(html: string): string {
  return html
    .replace(/â€"/g,    '\u2013').replace(/â€"/g,    '\u2014')
    .replace(/â€™/g,    '\u2019').replace(/â€œ/g,    '\u201C')
    .replace(/â€\x9D/g, '\u201D').replace(/â€¢/g,    '\u2022')
    .replace(/Ã©/g,     '\u00E9').replace(/Ã¨/g,     '\u00E8')
    .replace(/Ã /g,     '\u00E0').replace(/Ã¼/g,     '\u00FC')
    .replace(/Ã¶/g,     '\u00F6').replace(/Ã¤/g,     '\u00E4');
}

function injectWrapFix(html: string): string {
  const style = `<style>
  * { box-sizing: border-box; }
  body, .page { max-width: 100% !important; overflow-x: hidden !important; }
  p, li, span, div {
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
  }
</style>`;
  return html.includes('</head>') ? html.replace('</head>', style + '\n</head>') : style + html;
}

function populateTemplate(html: string, data: Record<string, string>): string {
  const injected = injectWrapFix(sanitizeEncoding(html));
  return injected.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key: string) => {
    const v = data[key];
    return v !== undefined && v.trim() !== '' ? v : (sampleData[key] ?? '');
  });
}

function validate(
  formData: Record<string, string>,
  experiences: number[], educations: number[],
  skills: number[], langs: number[], certs: number[],
): Record<string, string> {
  const err: Record<string, string> = {};
  const req = (key: string, label: string) => {
    if (!formData[key]?.trim()) err[key] = `${label} is required`;
  };
  req('fullName', 'Full Name'); req('email', 'Email');
  experiences.forEach((n) => { req(`job${n}Title`, 'Job Title'); req(`job${n}Company`, 'Company'); });
  educations.forEach((n) => {
    const p = n === 1 ? '' : String(n);
    req(`degree${p}`, 'Degree'); req(`university${p}`, 'University / School');
  });
  skills.forEach((n) => req(`skill${n}`, 'Skill'));
  langs.forEach((n)  => req(`lang${n}`,  'Language'));
  certs.forEach((n)  => req(`cert${n}`,  'Certificate Name'));
  return err;
}

export function BuilderShell({
  template,
}: {
  template: { id: string; name: string; style: string; htmlContent: string };
}) {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  const [formData,     setFormData]     = useState<Record<string, string>>(baseFormData);
  const [experiences,  setExperiences]  = useState<number[]>([]);
  const [educations,   setEducations]   = useState<number[]>([]);
  const [certs,        setCerts]        = useState<number[]>([]);
  const [skills,       setSkills]       = useState<number[]>([]);
  const [langs,        setLangs]        = useState<number[]>([]);

  const expCounter   = useRef(0);
  const eduCounter   = useRef(0);
  const certCounter  = useRef(0);
  const skillCounter = useRef(0);
  const langCounter  = useRef(0);

  const [resumeId,        setResumeId]        = useState<string | null>(null);
  const [html,            setHtml]            = useState('');
  const [isSaving,        setIsSaving]        = useState(false);
  const [isDownloading,   setIsDownloading]   = useState(false);
  const [lastSavedAt,     setLastSavedAt]     = useState<string | null>(null);
  const [showAuthModal,   setShowAuthModal]   = useState(false);
  const [activeTab,       setActiveTab]       = useState<'edit' | 'preview'>('edit');
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  // Pre-fill from upload flow (source=upload query param) ──────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') !== 'upload') return;
    const key = `parsed_resume_${template.id}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return;
    try {
      const parsed: Record<string, string> = JSON.parse(stored);
      sessionStorage.removeItem(key);
      setFormData((prev) => {
        const next = { ...prev };
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim()) next[k] = v;
        });
        return next;
      });
    } catch {
      console.error('Failed to load parsed resume data from sessionStorage');
    }
  }, [template.id]);

  useEffect(() => {
    setHtml(populateTemplate(template.htmlContent, formData));
  }, [formData, template.htmlContent]);

  useEffect(() => {
    createResume({ templateId: template.id, formData })
      .then((resume) => setResumeId((resume?._id ?? resume?.id ?? null) as string | null))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!resumeId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateResume(resumeId, { formData });
        setLastSavedAt(new Date().toISOString());
      } catch { /* silent */ } finally { setIsSaving(false); }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, resumeId]);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      if (Object.keys(next).length === 0) setShowErrorBanner(false);
      return next;
    });
  }, []);

  const addSection = (
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    counter: React.MutableRefObject<number>,
    fields: (n: number) => Record<string, string>,
  ) => {
    counter.current += 1;
    const n = counter.current;
    setArr((p) => [...p, n]);
    setFormData((p) => ({ ...p, ...fields(n) }));
  };

  const removeSection = (
    n: number,
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    fields: (n: number) => Record<string, string>,
  ) => {
    setArr((p) => p.filter((x) => x !== n));
    setFormData((p) => { const next = { ...p }; Object.keys(fields(n)).forEach((k) => delete next[k]); return next; });
    setErrors((p) => {
      const next = { ...p };
      Object.keys(fields(n)).forEach((k) => delete next[k]);
      if (Object.keys(next).length === 0) setShowErrorBanner(false);
      return next;
    });
  };

  const handleDownload = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    const errs = validate(formData, experiences, educations, skills, langs, certs);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowErrorBanner(true);
      setActiveTab('edit');
      const firstKey = Object.keys(errs)[0];
      setTimeout(() => {
        document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    if (!resumeId) return;
    try {
      setIsDownloading(true);
      const blob = await exportResumePdf(resumeId);
      const url  = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a    = document.createElement('a');
      a.href = url; a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } finally { setIsDownloading(false); }
  };

  const errorCount = Object.keys(errors).length;
  const saveStatus = isSaving
    ? 'Saving…'
    : lastSavedAt
      ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}`
      : 'Auto-saved as you type';

  const errorBanner = showErrorBanner && errorCount > 0 ? (
    <div className="builder-error-banner">
      <svg className="builder-error-banner__icon" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
      </svg>
      <p className="builder-error-banner__text">
        <span style={{ fontWeight: 600 }}>{errorCount} field{errorCount > 1 ? 's' : ''} must be filled</span>
        {' '}before downloading. Required fields are highlighted in red.
      </p>
      <button onClick={() => setShowErrorBanner(false)} aria-label="Dismiss error banner"
        className="builder-error-banner__dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  ) : null;

  const formSections = (
    <div className="form-sections">
      <FormSection title="Personal Info">
        <Input id="field-fullName" label="Full Name *"  field="fullName"  value={formData.fullName}  onChange={updateField} error={errors.fullName} />
        <Input label="Job Title"                        field="jobTitle"  value={formData.jobTitle}  onChange={updateField} />
        <Input id="field-email"    label="Email *"      field="email"     value={formData.email}     onChange={updateField} error={errors.email} />
        <Input label="Phone"                            field="phone"     value={formData.phone}     onChange={updateField} />
        <Input label="Location"                         field="location"  value={formData.location}  onChange={updateField} />
        <Input label="LinkedIn URL"                     field="linkedin"  value={formData.linkedin}  onChange={updateField} />
        <Input label="Website"                          field="website"   value={formData.website}   onChange={updateField} />
        <Input label="Initials (e.g. JD)"               field="initials"  value={formData.initials}  onChange={updateField} />
      </FormSection>

      <FormSection title="Professional Summary">
        <Textarea label="Summary" field="summary" value={formData.summary} onChange={updateField} />
        <AiSummarySuggestions
          jobTitle={formData.jobTitle || ''}
          topSkills={[formData.skill1, formData.skill2, formData.skill3].filter(Boolean)}
          yearsOfExperience="3+"
          currentRole={formData.job1Title || ''}
          onSelect={(s) => updateField('summary', s)}
        />
      </FormSection>

      <FormSection title="Work Experience">
        {experiences.length === 0 && <EmptyHint text="No work experience added yet." />}
        {experiences.map((n) => (
          <Card key={n} label={`Experience ${n}`} onRemove={() => removeSection(n, setExperiences, experienceFields)}>
            <Input id={`field-job${n}Title`}   label="Job Title *" field={`job${n}Title`}   value={formData[`job${n}Title`]   ?? ''} onChange={updateField} error={errors[`job${n}Title`]} />
            <Input id={`field-job${n}Company`} label="Company *"   field={`job${n}Company`} value={formData[`job${n}Company`] ?? ''} onChange={updateField} error={errors[`job${n}Company`]} />
            <Input label="Location"            field={`job${n}Location`} value={formData[`job${n}Location`] ?? ''} onChange={updateField} />
            <div className="builder-date-row">
              <Input label="Start (e.g. Jan 2022)" field={`job${n}Start`} value={formData[`job${n}Start`] ?? ''} onChange={updateField} />
              <Input label="End (e.g. Present)"    field={`job${n}End`}   value={formData[`job${n}End`]   ?? ''} onChange={updateField} />
            </div>
            <Input label="Bullet 1" field={`job${n}Bullet1`} value={formData[`job${n}Bullet1`] ?? ''} onChange={updateField} />
            <Input label="Bullet 2" field={`job${n}Bullet2`} value={formData[`job${n}Bullet2`] ?? ''} onChange={updateField} />
            <Input label="Bullet 3" field={`job${n}Bullet3`} value={formData[`job${n}Bullet3`] ?? ''} onChange={updateField} />
            <AiBulletSuggestions
              jobTitle={formData[`job${n}Title`] || ''}
              company={formData[`job${n}Company`] || ''}
              existingBullets={[
                formData[`job${n}Bullet1`] || '',
                formData[`job${n}Bullet2`] || '',
                formData[`job${n}Bullet3`] || '',
              ]}
              onSelect={(bullet) => {
                const slots = [`job${n}Bullet1`, `job${n}Bullet2`, `job${n}Bullet3`];
                const empty = slots.find((s) => !formData[s]);
                updateField(empty ?? `job${n}Bullet3`, bullet);
              }}
            />
          </Card>
        ))}
        <AddButton label="Add Work Experience" onClick={() => addSection(setExperiences, expCounter, experienceFields)} />
      </FormSection>

      <FormSection title="Education">
        {educations.length === 0 && <EmptyHint text="No education entries added yet." />}
        {educations.map((n) => {
          const p = n === 1 ? '' : String(n);
          return (
            <Card key={n} label={`Education ${n}`} onRemove={() => removeSection(n, setEducations, educationFields)}>
              <Input id={`field-degree${p}`}     label="Degree / Course *"     field={`degree${p}`}     value={formData[`degree${p}`]     ?? ''} onChange={updateField} error={errors[`degree${p}`]} />
              <Input id={`field-university${p}`} label="University / School *" field={`university${p}`} value={formData[`university${p}`] ?? ''} onChange={updateField} error={errors[`university${p}`]} />
              <Input                             label="Graduation Year"        field={`graduationYear${p}`} value={formData[`graduationYear${p}`] ?? ''} onChange={updateField} />
            </Card>
          );
        })}
        <AddButton label="Add Education" onClick={() => addSection(setEducations, eduCounter, educationFields)} />
      </FormSection>

      <FormSection title="Skills">
        {skills.length === 0 && <EmptyHint text="No skills added yet." />}
        {skills.length > 0 && (
          <div className="builder-skill-row">
            {skills.map((n) => (
              <div key={n} className="builder-skill-item">
                <div className="builder-skill-item__field">
                  <Input id={`field-skill${n}`} label="Skill *" field={`skill${n}`}
                    value={formData[`skill${n}`] ?? ''} onChange={updateField} error={errors[`skill${n}`]} />
                </div>
                <button onClick={() => removeSection(n, setSkills, skillFields)} aria-label="Remove skill"
                  className="builder-remove-btn">
                  <XIcon />
                </button>
              </div>
            ))}
          </div>
        )}
        <AiSkillSuggestions
          jobTitle={formData.jobTitle || ''}
          experienceSummary={[
            formData.job1Title, formData.job1Company,
            formData.job1Bullet1, formData.job1Bullet2,
            formData.job2Title, formData.job2Company,
          ].filter(Boolean).join('. ')}
          selectedSkills={skills.map((n) => formData[`skill${n}`]).filter(Boolean)}
          onAdd={(skill) => {
            // Find first empty slot or add a new one
            const emptySlot = skills.find((n) => !formData[`skill${n}`]);
            if (emptySlot != null) {
              updateField(`skill${emptySlot}`, skill);
            } else {
              addSection(setSkills, skillCounter, skillFields);
              // After state update, set the new field via a tiny delay
              setTimeout(() => {
                const newN = skillCounter.current;
                updateField(`skill${newN}`, skill);
              }, 50);
            }
          }}
          onRemove={(skill) => {
            const slot = skills.find((n) => formData[`skill${n}`] === skill);
            if (slot != null) updateField(`skill${slot}`, '');
          }}
        />
        <AddButton label="Add Skill" onClick={() => addSection(setSkills, skillCounter, skillFields)} />
      </FormSection>

      <FormSection title="Languages">
        {langs.length === 0 && <EmptyHint text="No languages added yet." />}
        {langs.map((n) => (
          <div key={n} className="builder-lang-row">
            <div className="builder-lang-fields">
              <Input id={`field-lang${n}`} label="Language *" field={`lang${n}`}
                value={formData[`lang${n}`] ?? ''} onChange={updateField} error={errors[`lang${n}`]} />
              <Input label="Proficiency" field={`lang${n}Level`}
                value={formData[`lang${n}Level`] ?? ''} onChange={updateField} />
            </div>
            <button onClick={() => removeSection(n, setLangs, langFields)} aria-label="Remove language"
              className="builder-remove-btn">
              <XIcon />
            </button>
          </div>
        ))}
        <AddButton label="Add Language" onClick={() => addSection(setLangs, langCounter, langFields)} />
      </FormSection>

      <FormSection title="Certifications">
        {certs.length === 0 && <EmptyHint text="No certifications added yet." />}
        {certs.map((n) => (
          <Card key={n} label={`Certification ${n}`} onRemove={() => removeSection(n, setCerts, certFields)}>
            <Input id={`field-cert${n}`} label="Certificate Name *"       field={`cert${n}`}       value={formData[`cert${n}`]       ?? ''} onChange={updateField} error={errors[`cert${n}`]} />
            <Input                       label="Issuer (e.g. AWS, Google)" field={`cert${n}Issuer`} value={formData[`cert${n}Issuer`] ?? ''} onChange={updateField} />
            <Input                       label="Year (e.g. 2023)"          field={`cert${n}Year`}   value={formData[`cert${n}Year`]   ?? ''} onChange={updateField} />
          </Card>
        ))}
        <AddButton label="Add Certification" onClick={() => addSection(setCerts, certCounter, certFields)} />
      </FormSection>
    </div>
  );

  return (
    <>
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* ── Top bar (all breakpoints) ── */}
      <div className="builder-topbar">
        <div className="builder-topbar__left">
          <Link href="/templates" className="builder-topbar__back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Templates
          </Link>
          <span className="builder-topbar__divider" aria-hidden="true" />
          <div className="builder-topbar__info">
            <span className="builder-topbar__title">{template.name}</span>
            <span className="builder-topbar__saved">{saveStatus}</span>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="builder-tabs builder-tabs--topbar" role="tablist">
          {(['edit', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`builder-tab ${activeTab === tab ? 'builder-tab--active' : 'builder-tab--inactive'}`}
            >
              {tab === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading || !resumeId}
          className="builder-download-btn builder-download-btn--topbar"
        >
          {isDownloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      {/* ── Split (form + preview) ── */}
      <div className="builder-split">

        {/* Form panel */}
        <div className={`builder-form-panel${activeTab === 'preview' ? ' builder-form-panel--mobile-hidden' : ''}`}>
          {errorBanner && <div className="builder-error-wrap">{errorBanner}</div>}
          <div className="builder-form-body">
            {formSections}
          </div>
        </div>

        {/* Preview panel */}
        <div className={`builder-preview-panel${activeTab === 'edit' ? ' builder-preview-panel--mobile-hidden' : ''}`}>
          <div className="builder-preview-panel__header">
            <div className="builder-preview-panel__header-left">
              <span className="builder-preview-dot" aria-hidden="true" />
              <span className="builder-preview-label">Live Preview</span>
              <span className="builder-preview-name">{template.name}</span>
            </div>
            <span className="builder-preview-status">
              {isSaving ? 'Saving…' : resumeId ? 'Up to date' : 'Preview only'}
            </span>
          </div>
          <div className="builder-preview-body">
            <ResumePreviewer html={html} padding={64} />
          </div>
        </div>
      </div>

      {/* ── Mobile download bar ── */}
      <div className="builder-download-bar">
        <div className="builder-download-bar__inner">
          <p className="builder-save-status">{saveStatus}</p>
          <button
            onClick={handleDownload}
            disabled={isDownloading || !resumeId}
            className="builder-download-btn"
          >
            {isDownloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Primitive components ─────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-section">
      <h3 className="form-section__title">{title}</h3>
      <div className="form-section__fields">{children}</div>
    </div>
  );
}

function Card({ label, onRemove, children }: {
  label: string; onRemove: () => void; children: React.ReactNode;
}) {
  return (
    <div className="form-card">
      <div className="form-card__header">
        <p className="form-card__label">{label}</p>
        <button onClick={onRemove} className="form-card__remove">Remove</button>
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="add-button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      {label}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="empty-hint">{text}</p>;
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Input({ id, label, field, value, onChange, error }: {
  id?: string; label: string; field: string; value: string; error?: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div id={id} className="builder-field">
      <span className="builder-field__label">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className={`builder-input${error ? ' builder-input--error' : ''}`}
      />
      {error && (
        <p className="field-error">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function Textarea({ label, field, value, onChange, rows = 4 }: {
  label: string; field: string; value: string; rows?: number;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <label className="builder-field">
      <span className="builder-field__label">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        rows={rows}
        className="builder-textarea"
      />
    </label>
  );
}
